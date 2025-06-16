from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import (
    PercentilesPorCuestionario,
    SeccionDePercentilesPorGrupo,
    RelacionDePuntuacionesYPercentiles,
    CalculoDeIndiceDeNecesidadesDeApoyo
)
from .serializers import (
    PercentilesPorCuestionarioSerializer,
    SeccionDePercentilesPorGrupoSerializer,
    RelacionDePuntuacionesYPercentilesSerializer,
    CalculoDeIndiceDeNecesidadesDeApoyoSerializer
)
from .utils import get_filtered_and_formatted_puntuaciones
from cuestionarios.models import BaseCuestionarios

class PercentilesPorCuestionarioView(generics.ListCreateAPIView):
    """
    Vista para listar y crear Tablas de Equivalencia (PercentilesPorCuestionario).
    """
    serializer_class = PercentilesPorCuestionarioSerializer

    def get_queryset(self):
        base_cuestionario_id = self.request.query_params.get("base_cuestionario_id")
        queryset = PercentilesPorCuestionario.objects.all()
        if base_cuestionario_id:
            queryset = queryset.filter(base_cuestionario_id=base_cuestionario_id)
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        base_cuestionario_id = request.data.get("base_cuestionario_id")

        if not base_cuestionario_id:
            return Response({"error": "El campo 'base_cuestionario_id' es obligatorio."},
                            status=status.HTTP_400_BAD_REQUEST)

        if PercentilesPorCuestionario.objects.filter(base_cuestionario_id=base_cuestionario_id).exists():
            return Response({"error": "Ya existe una tabla de equivalencia para este cuestionario."},
                            status=status.HTTP_400_BAD_REQUEST)

        base_cuestionario = get_object_or_404(BaseCuestionarios, id=base_cuestionario_id)

        tabla_equivalencia = PercentilesPorCuestionario.objects.create(
            base_cuestionario=base_cuestionario
        )

        serializer = self.get_serializer(tabla_equivalencia)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PercentilesPorCuestionarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar o eliminar una Tabla de Equivalencia.
    """
    serializer_class = PercentilesPorCuestionarioSerializer

    def get_queryset(self):
        return PercentilesPorCuestionario.objects.all()

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE"]:
            return [IsAuthenticated()]
        return [AllowAny()]


class SeccionDePercentilesPorGrupoCreateView(generics.CreateAPIView):
    serializer_class = SeccionDePercentilesPorGrupoSerializer

    def create(self, request, *args, **kwargs):
        percentiles_cuestionario_id = kwargs.get("tabla_id")

        percentiles_cuestionario = get_object_or_404(PercentilesPorCuestionario, id=percentiles_cuestionario_id)

        nombre_seccion = request.data.get("nombre_seccion")
        grupo = request.data.get("grupo", "todos")

        if not nombre_seccion:
            return Response({"error": "El campo 'nombre_seccion' es obligatorio."},
                            status=status.HTTP_400_BAD_REQUEST)

        nueva_seccion = SeccionDePercentilesPorGrupo.objects.create(
            percentiles_cuestionario=percentiles_cuestionario,
            nombre_seccion=nombre_seccion,
            grupo=grupo
        )

        serializer = self.get_serializer(nueva_seccion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class EliminarPuntuacionView(APIView):
    """
    Vista para eliminar una puntuación por su ID.
    """
    def delete(self, request, pk):
        puntuacion = get_object_or_404(RelacionDePuntuacionesYPercentiles, id=pk)
        puntuacion.delete()
        return Response({"message": "Puntuación eliminada correctamente."}, status=status.HTTP_204_NO_CONTENT)
    


class PuntuacionesPorSeccionCrearView(generics.ListCreateAPIView):
    """
    Vista para obtener y crear puntuaciones dentro de una sección.
    """
    serializer_class = RelacionDePuntuacionesYPercentilesSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Filtra las puntuaciones por el ID de la sección.
        """
        seccion_id = self.kwargs.get('seccion_id')
        return RelacionDePuntuacionesYPercentiles.objects.filter(seccion_id=seccion_id).order_by('puntuacion_estandar')

    def create(self, request, *args, **kwargs):
        """
        Crea múltiples puntuaciones para una sección específica.
        """
        # ✅ OBLIGAR a que el `seccion_id` esté en la petición
        seccion_id = request.data.get('seccion_id')

        if not seccion_id:
            return Response({"error": "El campo 'seccion' es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            seccion_id = int(seccion_id)  # ✅ Convertir a entero para evitar errores
        except ValueError:
            return Response({"error": "El campo 'seccion' debe ser un número entero válido."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ VALIDAR que la sección exista
        seccion = get_object_or_404(SeccionDePercentilesPorGrupo, id=seccion_id)

        # ✅ OBTENER PUNTUACIONES
        puntuaciones_data = request.data.get('puntuaciones', [])

        if not puntuaciones_data:
            return Response({"error": "No se enviaron puntuaciones."}, status=status.HTTP_400_BAD_REQUEST)

        nuevas_puntuaciones = []
        for data in puntuaciones_data:
            # ✅ VERIFICAR QUE TODOS LOS CAMPOS ESTÉN PRESENTES
            if not all(k in data for k in ("puntuacion_directa", "puntuacion_estandar", "percentil")):
                return Response({"error": "Cada puntuación debe contener 'puntuacion_directa', 'puntuacion_estandar' y 'percentil'."},
                                status=status.HTTP_400_BAD_REQUEST)

            # ✅ VALIDAR PUNTUACIÓN ESTÁNDAR
            try:
                data["puntuacion_estandar"] = int(data["puntuacion_estandar"])
            except ValueError:
                return Response({"error": "El campo 'puntuacion_estandar' debe ser un número entero."},
                                status=status.HTTP_400_BAD_REQUEST)

            # ✅ AGREGAR LA PUNTUACIÓN A LA LISTA
            nuevas_puntuaciones.append(RelacionDePuntuacionesYPercentiles(
                seccion=seccion,  # ✅ Pasar la instancia de la sección
                puntuacion_directa=data["puntuacion_directa"],
                puntuacion_estandar=data["puntuacion_estandar"],
                percentil=data["percentil"]
            ))

        # ✅ GUARDAR LAS PUNTUACIONES EN LA BASE DE DATOS
        RelacionDePuntuacionesYPercentiles.objects.bulk_create(nuevas_puntuaciones)

        return Response({"message": "Puntuaciones guardadas correctamente."}, status=status.HTTP_201_CREATED)


####### Ver puntuaciones ###
    

class PuntuacionesPorSeccionView(generics.ListCreateAPIView):
    """
    Vista para obtener y crear puntuaciones dentro de una sección.
    """
    serializer_class = RelacionDePuntuacionesYPercentilesSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Filtra las puntuaciones por el ID de la sección.
        """
        seccion_id = self.kwargs.get('seccion_id')
        return RelacionDePuntuacionesYPercentiles.objects.filter(seccion_id=seccion_id).order_by('puntuacion_estandar')

    def create(self, request, *args, **kwargs):
        """
        Crea múltiples puntuaciones para una sección específica.
        """
        # ✅ OBLIGAR a que el `seccion_id` esté en la petición
        seccion_id = request.data.get('seccion_id')

        if not seccion_id:
            return Response({"error": "El campo 'seccion' es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            seccion_id = int(seccion_id)  # ✅ Convertir a entero para evitar errores
        except ValueError:
            return Response({"error": "El campo 'seccion' debe ser un número entero válido."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ VALIDAR que la sección exista
        seccion = get_object_or_404(SeccionDePercentilesPorGrupo, id=seccion_id)

        # ✅ OBTENER PUNTUACIONES
        puntuaciones_data = request.data.get('puntuaciones', [])

        if not puntuaciones_data:
            return Response({"error": "No se enviaron puntuaciones."}, status=status.HTTP_400_BAD_REQUEST)

        nuevas_puntuaciones = []
        for data in puntuaciones_data:
            # ✅ VERIFICAR QUE TODOS LOS CAMPOS ESTÉN PRESENTES
            if not all(k in data for k in ("puntuacion_directa", "puntuacion_estandar", "percentil")):
                return Response({"error": "Cada puntuación debe contener 'puntuacion_directa', 'puntuacion_estandar' y 'percentil'."},
                                status=status.HTTP_400_BAD_REQUEST)

            # ✅ VALIDAR PUNTUACIÓN ESTÁNDAR
            try:
                data["puntuacion_estandar"] = int(data["puntuacion_estandar"])
            except ValueError:
                return Response({"error": "El campo 'puntuacion_estandar' debe ser un número entero."},
                                status=status.HTTP_400_BAD_REQUEST)

            # ✅ AGREGAR LA PUNTUACIÓN A LA LISTA
            nuevas_puntuaciones.append(RelacionDePuntuacionesYPercentiles(
                seccion=seccion,  # ✅ Pasar la instancia de la sección
                puntuacion_directa=data["puntuacion_directa"],
                puntuacion_estandar=data["puntuacion_estandar"],
                percentil=data["percentil"]
            ))

        # ✅ GUARDAR LAS PUNTUACIONES EN LA BASE DE DATOS
        RelacionDePuntuacionesYPercentiles.objects.bulk_create(nuevas_puntuaciones)

        return Response({"message": "Puntuaciones guardadas correctamente."}, status=status.HTTP_201_CREATED)

# Este es el view bueno
class PuntuacionesPorSeccionView(generics.ListAPIView):
    """
    Vista que devuelve todas las puntuaciones organizadas por secciones y permite filtrar por cualquier campo.
    """
    serializer_class = PercentilesPorCuestionarioSerializer # Still useful for schema generation/documentation
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        """
        Devuelve la lista de puntuaciones filtradas y formateadas.
        """
        # Call the utility function with the request query parameters
        resultados = get_filtered_and_formatted_puntuaciones(request.query_params)
        
        return Response(resultados)
    
class CargaMasivaIndiceApoyoView(APIView):
    def post(self, request):
        cuestionario_id = request.data.get("cuestionario_id")
        valores = request.data.get("valores", [])

        if not cuestionario_id or not valores:
            return Response({"error": "Faltan datos."}, status=400)

        tabla = get_object_or_404(PercentilesPorCuestionario, id=cuestionario_id)

        nuevos = []
        for row in valores:
            try:
                total = int(row["total_suma_estandar"])
                indice = int(row["indice_de_necesidades_de_apoyo"])
                percentil = str(row["percentil"])
            except (KeyError, ValueError):
                return Response({"error": "Error en la estructura de los datos."}, status=400)

            nuevos.append(
                CalculoDeIndiceDeNecesidadesDeApoyo(
                    percentiles_por_cuestionario=tabla,
                    total_suma_estandar=total,
                    indice_de_necesidades_de_apoyo=indice,
                    percentil=percentil
                )
            )

        CalculoDeIndiceDeNecesidadesDeApoyo.objects.bulk_create(nuevos)

        return Response({"message": "Carga masiva exitosa."}, status=201)

class IndiceApoyoListView(APIView):
    permissions_classes = [AllowAny]
    def get(self, request):
        cuestionario_id = request.query_params.get("cuestionario_id")
        if not cuestionario_id:
            return Response({"error": "cuestionario_id es requerido."}, status=400)

        queryset = CalculoDeIndiceDeNecesidadesDeApoyo.objects.filter(
            percentiles_por_cuestionario_id=cuestionario_id
        ).order_by("total_suma_estandar")

        serializer = CalculoDeIndiceDeNecesidadesDeApoyoSerializer(queryset, many=True)
        return Response(serializer.data, status=200)
    
class IndiceApoyoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CalculoDeIndiceDeNecesidadesDeApoyo.objects.all()
    serializer_class = CalculoDeIndiceDeNecesidadesDeApoyoSerializer