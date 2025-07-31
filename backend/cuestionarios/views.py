from django.db import IntegrityError, transaction, models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Cuestionario, Pregunta, Opcion, DesbloqueoPregunta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .funciones.guardar_cuestionario import guardar_cuestionario_desde_json
from .precargacuestionario import procesar_archivo_precarga
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.generics import UpdateAPIView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.models import CustomUser
from datetime import datetime, date
import json
from django.http import FileResponse, FileResponse, Http404
import unicodedata
import re

import logging
from django.views.decorators.http import require_http_methods

from .models import (
    Cuestionario, 
    Pregunta, 
    Respuesta, 
    Opcion, 
    DesbloqueoPregunta, 
    EstadoCuestionario, 
    BaseCuestionarios,
    ImagenOpcion,
)

from .serializers import (
    CuestionarioSerializer, PreguntaSerializer, RespuestaSerializer, 
    OpcionSerializer, UsuarioRespuestaSerializer, DesbloqueoPreguntaSerializer, 
    CuestionarioDesbloqueosSerializer, BaseCuestionariosSerializer,
    RespuestaDesbloqueadaSerializer, RespuestaUnlockedPathSerializer,
    RespuestaSISSerializer, ResumenSISSerializer, ReporteCuestionariosSerializer,
)

from .utils import (
    cargar_cuestionarios_desde_excel,
    evaluar_rango,
    descargar_plantilla_cuestionario,
    get_resumen_sis,
    get_user_evaluation_summary,
    validar_columnas_excel
)


def normalizar_nombre_cuestionario(nombre):
    """
    Normaliza el nombre del cuestionario:
    - Mantiene mayúsculas/minúsculas originales
    - Mantiene acentos
    - Quita símbolos extraños (mantener solo letras, números, espacios y acentos)
    - Normaliza espacios múltiples a uno solo
    - Quita espacios al inicio y final
    """
    if not nombre:
        return nombre
    
    # Quitar símbolos extraños (mantener solo letras, números, espacios y caracteres acentuados)
    # Usar una expresión regular que permita letras con acentos
    normalizado = re.sub(r'[^a-zA-ZÀ-ÿ0-9\s]', '', nombre)
    
    # Normalizar espacios múltiples a uno solo y quitar espacios al inicio/final
    normalizado = re.sub(r'\s+', ' ', normalizado).strip()
    
    return normalizado


class CuestionarioSeleccion(APIView):
    """Lista todos los cuestionarios agrupados por BaseCuestionarios o un cuestionario específico por ID"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, id=None):
        if id:
            base_cuestionario = get_object_or_404(BaseCuestionarios, id=id)
            serializer = BaseCuestionariosSerializer(base_cuestionario)
        else:
            base_cuestionarios = BaseCuestionarios.objects.all()
            serializer = BaseCuestionariosSerializer(base_cuestionarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CrearNuevaVersionCuestionario(APIView):
    """Crea una nueva versión de un cuestionario existente"""
    def post(self, request, cuestionario_id):
        try:
            cuestionario = Cuestionario.objects.get(id=cuestionario_id)
            nueva_version = Cuestionario.objects.create(
                nombre=cuestionario.nombre,
                version=cuestionario.version + 1,
                activo=False,  # Crear la nueva versión como inactiva
                base_cuestionario=cuestionario.base_cuestionario
            )
            serializer = CuestionarioSerializer(nueva_version)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Cuestionario.DoesNotExist:
            return Response({"error": "Cuestionario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
class ActivarCuestionarioView(APIView):
    """Activa una versión del cuestionario y desactiva las demás"""
    def post(self, request, cuestionario_id):
        try:
            cuestionario_a_activar = Cuestionario.objects.get(id=cuestionario_id)
            cuestionarios = Cuestionario.objects.filter(base_cuestionario=cuestionario_a_activar.base_cuestionario)

            for cuestionario in cuestionarios:
                cuestionario.activo = (cuestionario.id == cuestionario_id)
                cuestionario.save()

            return Response({"message": "Cuestionario activado correctamente"}, status=status.HTTP_200_OK)
        except Cuestionario.DoesNotExist:
            return Response({"error": "Cuestionario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

class CuestionarioSeleccionVisualizacion(APIView):
    """Muestra un cuestionario específico por ID"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        cuestionario = get_object_or_404(Cuestionario, pk=pk)
        serializer = CuestionarioSerializer(cuestionario)
        return Response(serializer.data)

class PreguntaSeleccion(APIView):
    """Lista todas las preguntas con sus opciones"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        preguntas = Pregunta.objects.all()
        serializer = PreguntaSerializer(preguntas, many=True)
        return Response(serializer.data)
    

class RespuestasGuardadas(APIView):
    """Guarda o actualiza respuestas de los usuarios y desbloquea nuevas preguntas si aplica"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Obtiene las respuestas filtradas por usuario y cuestionario"""
        usuario_id = request.query_params.get('usuario')
        cuestionario_id = request.query_params.get('cuestionario')

        # Filtrar respuestas por usuario y cuestionario si se proporcionan
        respuestas = Respuesta.objects.all()
        if usuario_id:
            respuestas = respuestas.filter(usuario_id=usuario_id)
        if cuestionario_id:
            respuestas = respuestas.filter(cuestionario_id=cuestionario_id)

        serializer = RespuestaSerializer(respuestas, many=True)
        return Response(serializer.data)

    def validate_response_data(self, respuesta, pregunta_tipo):
        """Validate response data based on question type"""
        if respuesta is None:
            return None
            
        # Handle string dates with extra quotes
        if isinstance(respuesta, str) and respuesta.startswith('"') and respuesta.endswith('"'):
            respuesta = respuesta[1:-1]
        
        # For certain question types, ensure proper format
        if pregunta_tipo in ['fecha', 'fecha_hora']:
            # Date/datetime validation could go here
            return respuesta
        elif pregunta_tipo == 'numero':
            # Numeric validation
            try:
                if isinstance(respuesta, str):
                    float(respuesta)  # Test if it's a valid number
                return respuesta
            except ValueError:
                raise ValueError(f"Invalid numeric value: {respuesta}")
        elif pregunta_tipo in ['multiple', 'binaria']:
            # Should be a single value
            if isinstance(respuesta, list) and len(respuesta) == 1:
                return respuesta[0]
            return respuesta
        elif pregunta_tipo == 'checkbox':
            # Should be a list
            if isinstance(respuesta, str):
                try:
                    parsed = json.loads(respuesta)
                    return parsed if isinstance(parsed, list) else [parsed]
                except json.JSONDecodeError:
                    return [respuesta]
            elif not isinstance(respuesta, list):
                return [respuesta]
            return respuesta
        
        return respuesta

    def post(self, request):
        """Guarda la respuesta del usuario y desbloquea preguntas si es necesario"""
        data = request.data
        print("=== INICIO PROCESO DE GUARDADO ===")
        print("Datos recibidos:", data)

        usuario_id = data.get('usuario')
        cuestionario_id = data.get('cuestionario')
        pregunta_id = data.get('pregunta')
        respuesta = data.get('respuesta')

        print(f"Usuario ID: {usuario_id}")
        print(f"Cuestionario ID: {cuestionario_id}")
        print(f"Pregunta ID: {pregunta_id}")
        print(f"Respuesta recibida: {respuesta}")
        print(f"Tipo de respuesta: {type(respuesta)}")

        # Validate required fields
        if not all([usuario_id, cuestionario_id, pregunta_id]):
            return Response(
                {"error": "usuario, cuestionario, and pregunta are required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            usuario = get_object_or_404(CustomUser, id=usuario_id)
            cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)
            pregunta = get_object_or_404(Pregunta, id=pregunta_id)

            print(f"Pregunta encontrada: {pregunta.texto}")
            print(f"Tipo de pregunta: {pregunta.tipo}")

            # Validate and clean response data
            try:
                respuesta_limpia = self.validate_response_data(respuesta, pregunta.tipo)
                print(f"Respuesta validada: {respuesta_limpia}")
            except ValueError as e:
                return Response(
                    {"error": f"Invalid response format: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process response according to type for Azure SQL compatibility
            try:
                # Para ciertos tipos, guardar el valor simple en lugar de procesarlo
                if pregunta.tipo in ['numero', 'multiple', 'dropdown', 'binaria']:
                    if pregunta.tipo == 'numero':
                        respuesta_procesada = float(respuesta_limpia) if respuesta_limpia else 0
                    elif pregunta.tipo in ['multiple', 'dropdown']:
                        respuesta_procesada = int(respuesta_limpia) if respuesta_limpia else 0
                    elif pregunta.tipo == 'binaria':
                        respuesta_procesada = respuesta_limpia in [True, 'true', '1', 'sí', 'si']
                    else:
                        respuesta_procesada = respuesta_limpia
                else:
                    respuesta_procesada = procesar_respuesta_para_tipo(respuesta_limpia, pregunta.tipo)
                print(f"Respuesta procesada para guardar: {respuesta_procesada}")
            except Exception as e:
                print(f"Error procesando respuesta: {e}")
                return Response(
                    {"error": f"Error processing response: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use transaction to ensure atomicity
            with transaction.atomic():
                try:
                    respuesta_obj, created = Respuesta.objects.update_or_create(
                        usuario=usuario,
                        cuestionario=cuestionario,
                        pregunta=pregunta,
                        defaults={'respuesta': respuesta_procesada}
                    )
                    print(f"Respuesta guardada: {created}")
                    
                except IntegrityError as e:
                    print(f"IntegrityError al guardar respuesta: {e}")
                    return Response(
                        {"error": "Database constraint violation. The response format may be invalid for this question type."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Process unlocking logic (your existing code with minor improvements)
                if pregunta.tipo != 'abierta':
                    print("=== PROCESANDO DESBLOQUEOS ===")
                    try:
                        if pregunta.tipo == 'checkbox':
                            print("Procesando pregunta tipo CHECKBOX")
                            
                            todas_opciones = Opcion.objects.filter(pregunta=pregunta)
                            print(f"Todas las opciones disponibles para la pregunta {pregunta.id}:")
                            for op in todas_opciones:
                                print(f"  - ID: {op.id}, Valor: {op.valor}, Texto: {op.texto}")
                            
                            if isinstance(respuesta_limpia, str):
                                try:
                                    opciones_seleccionadas = json.loads(respuesta_limpia)
                                    print(f"Opciones seleccionadas (JSON parseado): {opciones_seleccionadas}")
                                except json.JSONDecodeError:
                                    opciones_seleccionadas = []
                                    print("Error al parsear JSON, opciones_seleccionadas = []")
                            else:
                                opciones_seleccionadas = respuesta_limpia if isinstance(respuesta_limpia, list) else []
                                print(f"Opciones seleccionadas (directo): {opciones_seleccionadas}")

                            print(f"Total de opciones seleccionadas: {len(opciones_seleccionadas)}")

                            for valor in opciones_seleccionadas:
                                print(f"Procesando valor: {valor}")
                                opciones = Opcion.objects.filter(
                                    pregunta=pregunta,
                                    id=valor
                                )
                                print(f"Opciones encontradas para ID {valor}: {opciones.count()}")
                                
                                for opcion in opciones:
                                    print(f"Procesando opción: {opcion.texto} (ID: {opcion.id}, valor: {opcion.valor})")
                                    desbloqueos = DesbloqueoPregunta.objects.filter(
                                        cuestionario=cuestionario,
                                        pregunta_origen=pregunta,
                                        opcion_desbloqueadora=opcion
                                    )
                                    print(f"Desbloqueos encontrados para esta opción: {desbloqueos.count()}")
                                    
                                    for desbloqueo in desbloqueos:
                                        print(f"Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                                        try:
                                            resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                                usuario=usuario,
                                                cuestionario=cuestionario,
                                                pregunta=desbloqueo.pregunta_desbloqueada,
                                                defaults={'respuesta': None}  # Use None instead of empty string
                                            )
                                            print(f"Respuesta de desbloqueo creada: {created_desbloqueo}")
                                        except IntegrityError as e:
                                            print(f"Error al crear respuesta de desbloqueo: {e}")
                                            continue

                        else:
                            print(f"Procesando pregunta tipo: {pregunta.tipo}")
                            if isinstance(respuesta_limpia, (str, int)) and str(respuesta_limpia).isdigit():
                                opciones_seleccionadas = Opcion.objects.filter(
                                    pregunta=pregunta,
                                    valor=int(respuesta_limpia)
                                )
                                print(f"Opciones encontradas para respuesta {respuesta_limpia}: {opciones_seleccionadas.count()}")

                                for opcion_seleccionada in opciones_seleccionadas:
                                    print(f"Procesando opción: {opcion_seleccionada.texto}")
                                    desbloqueos = DesbloqueoPregunta.objects.filter(
                                        cuestionario=cuestionario,
                                        pregunta_origen=pregunta,
                                        opcion_desbloqueadora=opcion_seleccionada
                                    )
                                    print(f"Desbloqueos encontrados: {desbloqueos.count()}")

                                    for desbloqueo in desbloqueos:
                                        print(f"Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                                        try:
                                            resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                                usuario=usuario,
                                                cuestionario=cuestionario,
                                                pregunta=desbloqueo.pregunta_desbloqueada,
                                                defaults={'respuesta': None}  # Use None instead of empty string
                                            )
                                            print(f"Respuesta de desbloqueo creada: {created_desbloqueo}")
                                        except IntegrityError as e:
                                            print(f"Error al crear respuesta de desbloqueo: {e}")
                                            continue
                            else:
                                print(f"Respuesta no es un número válido: {respuesta_limpia}")

                    except Exception as e:
                        print(f"Error al procesar desbloqueos: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        # Don't fail the whole request if unlocking fails
                        pass

            print("=== FIN PROCESO DE GUARDADO ===")
            serializer = RespuestaSerializer(respuesta_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            print(f"Error general en el proceso: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "An unexpected error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class RespuestaActualizacion(UpdateAPIView):
    """Actualiza una respuesta existente"""
    queryset = Respuesta.objects.all()
    serializer_class = RespuestaSerializer
    permission_classes = [permissions.AllowAny]


@csrf_exempt
def validar_columnas_excel_view(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'status': 'error', 'message': 'No se ha proporcionado ningún archivo.'}, status=400)

        # Guardar el archivo temporalmente
        ruta_archivo = '/tmp/' + file.name
        with open(ruta_archivo, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # Validar columnas del archivo
        resultado_validacion = validar_columnas_excel(ruta_archivo)
        return JsonResponse(resultado_validacion)



@csrf_exempt
def upload_excel(request):
    if request.method == 'POST' and request.FILES.get('file'):
        excel_file = request.FILES['file']
        cuestionario_id = request.POST.get('cuestionario_id')

        if not cuestionario_id:
            return JsonResponse({'error': 'Se requiere el id del cuestionario'}, status=400)

        try:
            cargar_cuestionarios_desde_excel(excel_file, cuestionario_id)
            return JsonResponse({'message': 'Upload successful!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

class DescargarPlantillaCuestionarios(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        """
        Endpoint para descargar la plantilla de precarga de cuestionarios.
        Retorna el archivo Excel o un mensaje de error.
        """
        return descargar_plantilla_cuestionario()


class UsuarioRespuestasView(APIView):
    """Devuelve todas las respuestas de un usuario"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        usuario_id = request.query_params.get('usuario_id')
        if not usuario_id:
            return Response({"error": "Se requiere el ID del usuario"}, status=status.HTTP_400_BAD_REQUEST)

        usuario = get_object_or_404(CustomUser, id=usuario_id)
        respuestas = Respuesta.objects.filter(usuario=usuario)
        serializer = UsuarioRespuestaSerializer(respuestas, many=True)

        return Response({
            "usuario": usuario.email,
            "respuestas": serializer.data
        })

class CuestionarioDesbloqueosView(APIView):
    """Vista para obtener todos los cuestionarios con sus preguntas, opciones y reglas de desbloqueo"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cuestionarios = Cuestionario.objects.all()
        serializer = CuestionarioDesbloqueosSerializer(cuestionarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class BulkRespuestasView(APIView):
    def post(self, request):
        serializer = RespuestaSerializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ValidarEstadoCuestionarioView(APIView):
    """Maneja estados de cuestionarios para todos los usuarios"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Obtiene el estado de los cuestionarios, opcionalmente filtrando por usuario_id"""
        usuario_id = request.GET.get('usuario_id', None)

        if usuario_id:
            try:
                usuario = get_object_or_404(CustomUser, id=usuario_id)
                cuestionarios = Cuestionario.objects.all()
                resultados = []

                for cuestionario in cuestionarios:
                    estado_cuestionario = EstadoCuestionario.objects.filter(
                        usuario=usuario,
                        cuestionario=cuestionario
                    ).first()

                    resultados.append({
                        "usuario_id": usuario.id,
                        "usuario_email": usuario.email,
                        "cuestionario_id": cuestionario.id,
                        "cuestionario_nombre": cuestionario.nombre,
                        "estado": estado_cuestionario.estado if estado_cuestionario else "inactivo",
                        "finalizado": estado_cuestionario.estado == 'finalizado' if estado_cuestionario else False
                    })

                return Response(resultados, status=status.HTTP_200_OK)

            except CustomUser.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        else:
            usuarios = CustomUser.objects.all()
            cuestionarios = Cuestionario.objects.all()
            resultados = []

            for usuario in usuarios:
                for cuestionario in cuestionarios:
                    estado_cuestionario = EstadoCuestionario.objects.filter(
                        usuario=usuario,
                        cuestionario=cuestionario
                    ).first()

                    resultados.append({
                        "usuario_id": usuario.id,
                        "usuario_email": usuario.email,
                        "cuestionario_id": cuestionario.id,
                        "cuestionario_nombre": cuestionario.nombre,
                        "estado": estado_cuestionario.estado if estado_cuestionario else "inactivo",
                        "finalizado": estado_cuestionario.estado == 'finalizado' if estado_cuestionario else False
                    })

            return Response(resultados, status=status.HTTP_200_OK)

    def post(self, request):
        """Actualiza el estado de un cuestionario para un usuario específico"""
        usuario_id = request.data.get('usuario')
        cuestionario_id = request.data.get('cuestionario')
        estado = request.data.get('estado')

        if not usuario_id or not cuestionario_id:
            return Response({"error": "Se requiere el ID del usuario y del cuestionario"}, 
                          status=status.HTTP_400_BAD_REQUEST)

        usuario = get_object_or_404(CustomUser, id=usuario_id)
        cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)

        # Lógica de finalización explícita
        if estado == 'finalizado':
            estado_cuestionario, created = EstadoCuestionario.objects.update_or_create(
                usuario=usuario,
                cuestionario=cuestionario,
                defaults={'estado': 'finalizado'}
            )
        else:
            # Lógica automática basada en respuestas
            respuestas = Respuesta.objects.filter(usuario=usuario, cuestionario=cuestionario)
            nuevo_estado = 'en_proceso' if respuestas.exists() else 'inactivo'

            estado_cuestionario, created = EstadoCuestionario.objects.update_or_create(
                usuario=usuario,
                cuestionario=cuestionario,
                defaults={'estado': nuevo_estado}
            )

        return Response({
            "usuario": usuario.email,
            "cuestionario": cuestionario.nombre,
            "estado": estado_cuestionario.estado,
            "finalizado": estado_cuestionario.estado == 'finalizado'
        }, status=status.HTTP_200_OK)
    
class FinalizarCuestionarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        usuario_id = request.GET.get('usuario', None)
        cuestionario_id = request.GET.get('cuestionario', None)

        # Si se proporcionan usuario_id y cuestionario_id, filtrar por esos valores
        if usuario_id and cuestionario_id:
            print(f"usuario id: {usuario_id}, cuestionario_id: {cuestionario_id}")
            try:
                usuario = get_object_or_404(CustomUser, id=usuario_id)
                cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)
                estado_cuestionario = EstadoCuestionario.objects.filter(
                    usuario=usuario,
                    cuestionario=cuestionario
                ).first()

                # Devolver un solo objeto con la información del usuario y cuestionario
                return Response([{
                    "usuario": {
                        "id": usuario.id,
                        "email": usuario.email,
                        "finalizado": estado_cuestionario.estado == 'finalizado' if estado_cuestionario else False,
                    },
                    "cuestionario": {
                        "id": cuestionario.id,
                        "nombre": cuestionario.nombre,
                    },
                    "estado": estado_cuestionario.estado if estado_cuestionario else "inactivo",
                    "fecha_finalizado": estado_cuestionario.fecha_finalizado if estado_cuestionario else None
                }], status=status.HTTP_200_OK)

            except CustomUser.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            except Cuestionario.DoesNotExist:
                return Response({"error": "Cuestionario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Si solo se proporciona usuario_id, devolver los cuestionarios finalizados para ese usuario
        elif usuario_id:
            print(f"usuario id: {usuario_id}")
            try:
                usuario = get_object_or_404(CustomUser, id=usuario_id)
                estados_cuestionarios = EstadoCuestionario.objects.filter(usuario=usuario)

                resultados = []
                for estado_cuestionario in estados_cuestionarios:
                    resultados.append({
                        "usuario": {
                            "id": usuario.id,
                            "email": usuario.email,
                            "finalizado": estado_cuestionario.estado == 'finalizado',
                        },
                        "cuestionario": {
                            "id": estado_cuestionario.cuestionario.id,
                            "nombre": estado_cuestionario.cuestionario.nombre,
                        },
                        "estado": estado_cuestionario.estado,
                        "fecha_finalizado": estado_cuestionario.fecha_finalizado
                    })

                return Response(resultados, status=status.HTTP_200_OK)

            except CustomUser.DoesNotExist:
                return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Si no se proporcionan usuario_id y cuestionario_id, devolver todos los resultados
        usuarios = CustomUser.objects.all()
        cuestionarios = Cuestionario.objects.all()
        resultados = []

        for usuario in usuarios:
            for cuestionario in cuestionarios:
                estado_cuestionario = EstadoCuestionario.objects.filter(
                    usuario=usuario,
                    cuestionario=cuestionario
                ).first()

                resultados.append({
                    "usuario": {
                        "id": usuario.id,
                        "email": usuario.email,
                        "finalizado": estado_cuestionario.estado == 'finalizado' if estado_cuestionario else False,
                    },
                    "cuestionario": {
                        "id": cuestionario.id,
                        "nombre": cuestionario.nombre,
                    },
                    "estado": estado_cuestionario.estado if estado_cuestionario else "inactivo",
                    "fecha_finalizado": estado_cuestionario.fecha_finalizado if estado_cuestionario else None
                })

        return Response(resultados, status=status.HTTP_200_OK)

    def post(self, request):
        usuario_id = request.data.get('usuario')
        cuestionario_id = request.data.get('cuestionario')

        if not usuario_id or not cuestionario_id:
            return Response({"error": "Se requiere el ID del usuario y del cuestionario"}, status=status.HTTP_400_BAD_REQUEST)

        usuario = get_object_or_404(CustomUser, id=usuario_id)
        cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)

        # Cambiar el estado a 'finalizado' y guardar la fecha y hora actual
        estado_cuestionario, created = EstadoCuestionario.objects.update_or_create(
            usuario=usuario,
            cuestionario=cuestionario,
            defaults={
                'estado': 'finalizado',
                'fecha_finalizado': datetime.now()  # Guardar la fecha y hora actual
            }
        )

        return Response({
            "usuario": usuario.email,
            "cuestionario": cuestionario.nombre,
            "estado": estado_cuestionario.estado,
            "finalizado": True,
            "fecha_finalizado": estado_cuestionario.fecha_finalizado  # Incluir la fecha en la respuesta
        }, status=status.HTTP_200_OK)
    
class EtapaCuestionarioView(APIView):
    """Devuelve las opciones de etapa de cuestionario"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        STAGE_CHOICES = [
            {'value': 'Reg', 'label': 'Registro'},
            {'value': 'Pre', 'label': 'Preentrevista'},
            {'value': 'Can', 'label': 'Canalización'},
            {'value': 'Ent', 'label': 'Entrevista'},
            {'value': 'Cap', 'label': 'Capacitación'},
        ]
        return Response(STAGE_CHOICES)

class CrearCuestionario(APIView):
    """Crea un nuevo cuestionario y lista todos los cuestionarios"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Lista todos los cuestionarios"""
        cuestionarios = Cuestionario.objects.all()
        serializer = CuestionarioSerializer(cuestionarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Crea un nuevo cuestionario"""
        data = request.data
        nombre = data.get('nombre')
        etapa = data.get('etapa')
        responsable = data.get('responsable')
        inicio = data.get('inicio')

        if not nombre or not etapa:
            return Response({"error": "Se requiere el nombre y la etapa del cuestionario"}, status=status.HTTP_400_BAD_REQUEST)

        # Normalizar el nombre del cuestionario
        nombre_normalizado = normalizar_nombre_cuestionario(nombre)
        
        # Verificar si ya existe un cuestionario con el nombre normalizado
        cuestionario_existente = BaseCuestionarios.objects.filter(
            nombre__iexact=nombre_normalizado
        ).first()
        
        if cuestionario_existente:
            return Response({"error": "Ya existe un cuestionario con ese nombre"}, status=status.HTTP_400_BAD_REQUEST)

        base_cuestionario, created = BaseCuestionarios.objects.get_or_create(
            nombre=nombre_normalizado,
            defaults={'estado_desbloqueo': etapa, 'responsable': responsable, 'inicio': inicio}
        )

        cuestionario, created = Cuestionario.objects.get_or_create(
            nombre=nombre_normalizado,
            base_cuestionario=base_cuestionario,
            defaults={
                'version': 1,
                'activo': True,
            }
        )

        if not created:
            return Response({"error": "El cuestionario ya existe"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CuestionarioSerializer(cuestionario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class PreguntasCuestionarioView(APIView):
    """Obtiene todas las preguntas de un cuestionario específico"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, cuestionario_id):
        preguntas = Pregunta.objects.filter(cuestionario_id=cuestionario_id)
        serializer = PreguntaSerializer(preguntas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RespuestasUsuarioDesbloqueadasView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, usuario_id):
        # Obtener el usuario
        usuario = get_object_or_404(CustomUser, id=usuario_id)

        # Obtener todas las respuestas del usuario
        respuestas = Respuesta.objects.filter(usuario=usuario)

        # Serializar las respuestas que cumplen con los desbloqueos
        serializer = RespuestaDesbloqueadaSerializer(respuestas, many=True)

        # Filtrar respuestas que no cumplen con los desbloqueos (respuesta = None)
        respuestas_filtradas = [resp for resp in serializer.data if resp['respuesta'] is not None]

        return Response(respuestas_filtradas, status=status.HTTP_200_OK)
    
    
class CuestionarioPreentrevistaActivo(APIView):
    def get(self, request):
        # Filtrar por nombre "Preentrevista", cuestionario activo, inicio=True y responsable="PCD"
        cuestionario_activo = Cuestionario.objects.filter(
            nombre="Preentrevista",
            activo=True,
            basecuestionarios__inicio=True,
            basecuestionarios__responsable="PCD"
        ).first()

        if cuestionario_activo:
            serializer = CuestionarioSerializer(cuestionario_activo)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "No se encontró un cuestionario activo con los criterios especificados."}, status=status.HTTP_404_NOT_FOUND)

        ############ edicion de cuestionarios ############
class EditarCuestionarioView(UpdateAPIView):
    """Vista para editar una base de cuestionarios existente."""
    queryset = BaseCuestionarios.objects.all()
    serializer_class = BaseCuestionariosSerializer
    permission_classes = [permissions.AllowAny]  # Ajusta los permisos según sea necesario

    def put(self, request, *args, **kwargs):
        """Maneja la actualización de una base de cuestionarios."""
        instance = self.get_object()  # Obtiene la base de cuestionarios a editar
        
        # Si se está actualizando el nombre, normalizarlo
        if 'nombre' in request.data:
            nombre_normalizado = normalizar_nombre_cuestionario(request.data['nombre'])
            
            # Verificar si ya existe otro cuestionario con el nombre normalizado (excluyendo el actual)
            cuestionario_existente = BaseCuestionarios.objects.filter(
                nombre__iexact=nombre_normalizado
            ).exclude(id=instance.id).first()
            
            if cuestionario_existente:
                return Response(
                    {"error": "Ya existe otro cuestionario con ese nombre"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar el nombre normalizado en los datos
            request.data['nombre'] = nombre_normalizado
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)  # Permite actualización parcial
        # print(f"\n\n\n Esto se mando: {request.data} \n\n\n")
        serializer.is_valid(raise_exception=True)  # Valida los datos
        serializer.save()  # Guarda los cambios

        return Response(serializer.data, status=status.HTTP_200_OK)
    

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import Respuesta, CustomUser, Cuestionario
from .serializers import RespuestaUnlockedPathSerializer

class RespuestasUnlockedPathView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Obtener los parámetros de consulta
        usuario_id = request.query_params.get('usuario_id')
        cuestionario_id = request.query_params.get('cuestionario_id')

        # Validar que al menos uno de los parámetros esté presente
        if not usuario_id and not cuestionario_id:
            return Response(
                {"detail": "Debe proporcionar al menos un parámetro: usuario_id o cuestionario_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        respuestas = Respuesta.objects.all()

        # Filtrar respuestas por usuario_id si está presente
        if usuario_id:
            try:
                usuario = get_object_or_404(CustomUser, id=usuario_id)
                respuestas = respuestas.filter(usuario=usuario).select_related('cuestionario', 'pregunta')
            except ValueError:
                return Response(
                    {"detail": "El usuario_id debe ser un número entero válido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Filtrar respuestas por cuestionario_id si está presente
        if cuestionario_id:
            try:
                cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)
                respuestas = respuestas.filter(cuestionario=cuestionario).select_related('usuario', 'pregunta')
            except ValueError:
                return Response(
                    {"detail": "El cuestionario_id debe ser un número entero válido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Serializar las respuestas
        serializer = RespuestaUnlockedPathSerializer(respuestas, many=True)
        respuestas_serializadas = serializer.data

        # Aplicar filtros adicionales si es necesario
        filtro_desbloqueada = request.query_params.get('desbloqueada')
        filtro_ficha_tecnica = request.query_params.get('ficha_tecnica')
        filtro_dato_personal = request.query_params.get('dato_personal')
        otros_filtros = {
            key: value for key, value in request.query_params.items()
            if key not in ['desbloqueada', 'ficha_tecnica', 'dato_personal', 'usuario_id', 'cuestionario_id']
        }

        # Filtrar las respuestas serializadas
        respuestas_filtradas = []
        for respuesta in respuestas_serializadas:
            cumple_filtros = True

            # Aplicar filtro por desbloqueada
            if filtro_desbloqueada:
                valores_filtro = filtro_desbloqueada.split(',')
                if str(respuesta['desbloqueada']).lower() not in valores_filtro:
                    cumple_filtros = False

            # Aplicar filtro por ficha_tecnica
            if filtro_ficha_tecnica:
                ficha_tecnica_respuesta = str(respuesta.get('ficha_tecnica', False)).lower()
                if filtro_ficha_tecnica.lower() == 'true' and ficha_tecnica_respuesta != 'true':
                    cumple_filtros = False
                elif filtro_ficha_tecnica.lower() == 'false' and ficha_tecnica_respuesta == 'true':
                    cumple_filtros = False

            # Aplicar filtro por dato_personal
            if filtro_dato_personal:
                dato_personal_respuesta = str(respuesta.get('dato_personal', False)).lower()
                if filtro_dato_personal.lower() == 'true' and dato_personal_respuesta != 'true':
                    cumple_filtros = False
                elif filtro_dato_personal.lower() == 'false' and dato_personal_respuesta == 'true':
                    cumple_filtros = False

            # Aplicar otros filtros
            for key, value in otros_filtros.items():
                if str(respuesta.get(key, '')).lower() != value.lower():
                    cumple_filtros = False

            # Si cumple con todos los filtros, agregar a la lista
            if cumple_filtros:
                respuestas_filtradas.append(respuesta)

        # Devolver las respuestas filtradas
        return Response(respuestas_filtradas, status=status.HTTP_200_OK)
    
############### SIS Views ################

class RespuestasSISView(APIView):
    """Obtiene respuestas de preguntas tipo SIS o SIS2, con la posibilidad de filtrado dinámico"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        filtros = {}

        # Obtener los parámetros de la URL y filtrar solo los que sean relevantes
        usuario_id = request.query_params.get('usuario_id')
        cuestionario_id = request.query_params.get('cuestionario_id')
        seccion_sis = request.query_params.get('seccion_sis')
        pregunta_id = request.query_params.get('pregunta_id')
        tipo_pregunta = request.query_params.get('tipo_pregunta')

        if usuario_id:
            filtros['usuario_id'] = usuario_id
        if cuestionario_id:
            filtros['cuestionario_id'] = cuestionario_id
        if seccion_sis:
            filtros['pregunta__seccion_sis'] = seccion_sis
        if pregunta_id:
            filtros['pregunta_id'] = pregunta_id
        if tipo_pregunta:
            filtros['pregunta__tipo'] = tipo_pregunta

        # Filtrar solo preguntas de tipo SIS o SIS2
        preguntas_sis = Pregunta.objects.filter(tipo__in=['sis', 'sis2'])

        # Aplicar filtros si existen
        respuestas = Respuesta.objects.filter(pregunta__in=preguntas_sis, **filtros).select_related('pregunta', 'cuestionario', 'usuario')

        # Serializar las respuestas
        serializer = RespuestaSISSerializer(respuestas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

######### REsumen del Sis view ##########


class ResumenSISView(APIView):
    """Obtiene el resumen de respuestas SIS agrupado por usuario y sección, con totales y ayudas"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        usuario_id = request.query_params.get("usuario_id")

        try:
            datos_finales = get_resumen_sis(usuario_id=usuario_id)

            serializer = ResumenSISSerializer(datos_finales, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Nueva vista: ResumenCHView
class ResumenCHView(APIView):
    """Obtiene el resumen de respuestas tipo CH agrupado por usuario, incluyendo conteo de resultados y ayudas."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        usuario_id = request.query_params.get("usuario_id")
        if not usuario_id:
            return Response({"error": "Se requiere usuario_id"}, status=status.HTTP_400_BAD_REQUEST)

        respuestas = Respuesta.objects.filter(
            usuario_id=usuario_id,
            pregunta__tipo="ch"
        ).select_related('pregunta')

        resumen = {
            "usuario_id": int(usuario_id),
            "preguntas_totales": 0,
            "preguntas_respondidas": 0,
            "lo_hace": 0,
            "en_proceso": 0,
            "no_lo_hace": 0,
            "ayudas": [],
            "lista_lo_hace": [],
            "lista_en_proceso": [],
            "lista_no_lo_hace": []
        }

        for respuesta in respuestas:
            resumen["preguntas_totales"] += 1
            if respuesta.respuesta:
                resumen["preguntas_respondidas"] += 1
                try:
                    # Manejar tanto objetos JSON nativos como strings JSON (para compatibilidad)
                    if isinstance(respuesta.respuesta, str):
                        data = json.loads(respuesta.respuesta)
                    else:
                        data = respuesta.respuesta
                    
                    resultado = data.get("resultado")
                    if resultado == "lo_hace":
                        resumen["lo_hace"] += 1
                        resumen["lista_lo_hace"].append({
                            "pregunta_id": respuesta.pregunta.id,
                            "pregunta": respuesta.pregunta.texto,
                            "aid_id": data.get("aid_id"),
                            "aid_text": data.get("aid_text")
                        })
                    elif resultado == "en_proceso":
                        resumen["en_proceso"] += 1
                        resumen["lista_en_proceso"].append({
                            "pregunta_id": respuesta.pregunta.id,
                            "pregunta": respuesta.pregunta.texto,
                            "aid_id": data.get("aid_id"),
                            "aid_text": data.get("aid_text")
                        })
                    elif resultado == "no_lo_hace":
                        resumen["no_lo_hace"] += 1
                        resumen["lista_no_lo_hace"].append({
                            "pregunta_id": respuesta.pregunta.id,
                            "pregunta": respuesta.pregunta.texto,
                            "aid_id": data.get("aid_id"),
                            "aid_text": data.get("aid_text")
                        })

                    if resultado in ["en_proceso", "no_lo_hace"] and data.get("aid_id"):
                        resumen["ayudas"].append({
                            "pregunta_id": respuesta.pregunta.id,
                            "pregunta": respuesta.pregunta.texto,
                            "aid_id": data.get("aid_id"),
                            "aid_text": data.get("aid_text")
                        })

                except json.JSONDecodeError:
                    continue

        return Response(resumen, status=status.HTTP_200_OK)

######## final para percentiles ###


class EvaluacionPorUsuarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        usuario_id = request.query_params.get("usuario_id")
        if not usuario_id:
            return Response({"error": "Se requiere un usuario_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Call the central utility function
            evaluation_summary = get_user_evaluation_summary(
                usuario_id=usuario_id,
                query_params=request.query_params
            )
            return Response(evaluation_summary, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error en EvaluacionPorUsuarioView: {e}")
            return Response({"error": f"Ocurrió un error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


 # funcion para control de versiones       
class CuestionariosPorUsuarioView(APIView):
    """
    Devuelve, por usuario, los cuestionarios resueltos con:
    - id y nombre del cuestionario
    - cantidad de respuestas respondidas vs. total desbloqueadas
    - si está finalizado o no
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, usuario_id):
        print(f"🔍 Consultando progreso para usuario ID: {usuario_id}")
        respuestas_usuario = Respuesta.objects.filter(usuario_id=usuario_id).select_related('cuestionario', 'pregunta')
        cuestionarios_ids = respuestas_usuario.values_list('cuestionario_id', flat=True).distinct()
        print(f"🧾 Cuestionarios con respuestas: {list(cuestionarios_ids)}")

        resultado = []

        for cuestionario_id in cuestionarios_ids:
            cuestionario = Cuestionario.objects.get(id=cuestionario_id)
            preguntas_totales = cuestionario.preguntas.all()
            respuestas = respuestas_usuario.filter(cuestionario_id=cuestionario_id)
            print(f"➡️ Cuestionario: {cuestionario.nombre} (ID: {cuestionario.id})")
            print(f"   Preguntas totales: {preguntas_totales.count()}")
            print(f"   Respuestas encontradas: {respuestas.count()}")

            preguntas_desbloqueadas = set()
            respuestas_dict = {r.pregunta_id: r for r in respuestas}

            for pregunta in preguntas_totales:
                if pregunta.desbloqueos_recibidos.exists():
                    for desbloqueo in pregunta.desbloqueos_recibidos.all():
                        origen = desbloqueo.pregunta_origen
                        opcion = desbloqueo.opcion_desbloqueadora
                        respuesta_origen = respuestas_dict.get(origen.id)
                        if respuesta_origen and str(opcion.valor) in str(respuesta_origen.respuesta):
                            preguntas_desbloqueadas.add(pregunta)
                else:
                    preguntas_desbloqueadas.add(pregunta)

            print(f"   Preguntas desbloqueadas: {len(preguntas_desbloqueadas)}")
            preguntas_desbloqueadas_ids = {p.id for p in preguntas_desbloqueadas}
            respuestas_validas = [r for r in respuestas if r.pregunta_id in preguntas_desbloqueadas_ids]
            print(f"   Respuestas válidas: {len(respuestas_validas)}")

            estado_obj = EstadoCuestionario.objects.filter(usuario_id=usuario_id, cuestionario=cuestionario).first()
            finalizado = estado_obj.estado == 'finalizado' if estado_obj else False

            resultado.append({
                "cuestionario_id": cuestionario.id,
                "cuestionario_nombre": cuestionario.nombre,
                "base_cuestionario_id": cuestionario.base_cuestionario.id if cuestionario.base_cuestionario else None,
                "base_cuestionario_nombre": cuestionario.base_cuestionario.nombre if cuestionario.base_cuestionario else None,
                "respuestas_contestadas": len(respuestas_validas),
                "preguntas_desbloqueadas": len(preguntas_desbloqueadas),
                "finalizado": finalizado
            })

        print(f"✅ Total cuestionarios procesados: {len(resultado)}")
        return Response(resultado, status=status.HTTP_200_OK)
    


def ver_imagen_pregunta(request, pregunta_id):
    print(f"🔍 Buscando imagen para pregunta ID: {pregunta_id}")

    try:
        pregunta = Pregunta.objects.get(id=pregunta_id)
        print(f"✅ Pregunta encontrada: {pregunta.texto}")

        imagen_opciones = ImagenOpcion.objects.filter(pregunta=pregunta)
        print(f"🖼️ Opciones de imagen encontradas: {imagen_opciones.count()}")

        imagen_opcion = imagen_opciones.first()

        if imagen_opcion:
            print(f"✅ Primera imagen asociada encontrada: {imagen_opcion.imagen.name}")
            if imagen_opcion.imagen and imagen_opcion.imagen.storage.exists(imagen_opcion.imagen.name):
                print(f"📦 Imagen existe físicamente en el sistema de archivos.")
                return FileResponse(imagen_opcion.imagen.open(), content_type='image/jpeg')
            else:
                print(f"❌ La imagen está registrada pero no existe físicamente en el sistema de archivos.")
        else:
            print(f"⚠️ No hay imágenes asociadas a esta pregunta.")

        raise Http404("No hay imagen asociada a esta pregunta.")

    except Pregunta.DoesNotExist:
        print(f"❌ Pregunta con ID {pregunta_id} no encontrada.")
        raise Http404("Pregunta no encontrada.")

class PrecargaCuestionarioView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print("\n📥 Datos crudos recibidos en la precarga:")
        for key in request.POST:
            print(f"{key}: {request.POST[key]}")
        print("\n📥 Archivos recibidos:")
        for file_key in request.FILES:
            print(f"{file_key}: {request.FILES[file_key].name}")

        excel_file = request.FILES.get("file")
        tipo_cuestionario = request.data.get("tipo_cuestionario")
        import json
        tipos_raw = request.POST.get("tipos_permitidos", "[]")
        try:
            tipos_pregunta_permitidos = json.loads(tipos_raw)
        except json.JSONDecodeError:
            return Response(
                {"error": "El campo tipos_permitidos no es un JSON válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        print("📥 Tipos de pregunta permitidos recibidos:", tipos_pregunta_permitidos)

        # Validar que la lista de tipos permitidos no esté vacía
        if not tipos_pregunta_permitidos:
            return Response({
                "error": "Debe especificar al menos un tipo de pregunta permitido. Tipos válidos: ['abierta', 'opcion_multiple', 'sis', 'sis2', 'ch', 'canalizacion', ...]"
            }, status=status.HTTP_400_BAD_REQUEST)

        if not excel_file or not tipo_cuestionario:
            return Response({"error": "Archivo o tipo de cuestionario faltante"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resultado = procesar_archivo_precarga(excel_file, tipo_cuestionario, tipos_pregunta_permitidos)
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class GuardarCuestionarioView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            data = request.data
            preguntas = data.get("preguntas", [])
            cuestionario_id = data.get("cuestionario_id")


            # print("📝 Mis preguntitas:", preguntas)
            # print("Cuestionario ID:", cuestionario_id)
            if not preguntas:
                return Response({"error": "No se proporcionaron preguntas"}, status=status.HTTP_400_BAD_REQUEST)

            resultado = guardar_cuestionario_desde_json(preguntas, cuestionario_id)
            return Response(resultado, status=status.HTTP_200_OK)

        except Exception as e:
            print("❌ Error al guardar:", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReporteCuestionariosView(APIView):
    """
    Vista para generar reportes de cuestionarios con información detallada:
    - cuestionario_nombre
    - base_cuestionario
    - texto_pregunta
    - tipo_pregunta
    - respuesta
    
    No requiere parámetros obligatorios, pero se pueden filtrar por:
    - usuario_id: Filtrar por usuario específico
    - cuestionario_id: Filtrar por cuestionario específico
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Obtener parámetros opcionales
        usuario_id = request.query_params.get('usuario_id')
        cuestionario_id = request.query_params.get('cuestionario_id')

        # Obtener todas las respuestas
        respuestas = Respuesta.objects.select_related(
            'usuario', 
            'cuestionario', 
            'cuestionario__base_cuestionario',
            'pregunta'
        ).all()

        # Filtrar por usuario_id si está presente
        if usuario_id:
            try:
                usuario = get_object_or_404(CustomUser, id=usuario_id)
                respuestas = respuestas.filter(usuario=usuario)
            except ValueError:
                return Response(
                    {"detail": "El usuario_id debe ser un número entero válido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Filtrar por cuestionario_id si está presente
        if cuestionario_id:
            try:
                cuestionario = get_object_or_404(Cuestionario, id=cuestionario_id)
                respuestas = respuestas.filter(cuestionario=cuestionario)
            except ValueError:
                return Response(
                    {"detail": "El cuestionario_id debe ser un número entero válido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Serializar las respuestas
        serializer = ReporteCuestionariosSerializer(respuestas, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


def procesar_respuesta_para_tipo(respuesta, tipo):
    """Procesa la respuesta según el tipo para asegurar compatibilidad con Azure SQL"""
    
    if tipo == 'abierta':
        if isinstance(respuesta, str):
            return {
                'texto': respuesta,
                'valor_original': respuesta
            }
        elif isinstance(respuesta, dict):
            return {
                'texto': respuesta.get('texto', respuesta.get('valor_original', str(respuesta))),
                'valor_original': respuesta.get('valor_original', respuesta.get('texto', str(respuesta)))
            }
        else:
            return {
                'texto': str(respuesta),
                'valor_original': str(respuesta)
            }
    
    elif tipo == 'numero':
        if isinstance(respuesta, (int, float)):
            return {
                'valor': respuesta,
                'valor_original': respuesta
            }
        else:
            try:
                valor = float(respuesta)
                return {
                    'valor': valor,
                    'valor_original': respuesta
                }
            except:
                return {
                    'valor': 0,
                    'valor_original': respuesta
                }
    
    elif tipo == 'checkbox':
        if isinstance(respuesta, list):
            return {
                'opciones': respuesta,
                'valor_original': respuesta,
                'texto': f"Opciones seleccionadas: {len(respuesta)}"
            }
        elif isinstance(respuesta, dict):
            return {
                'opciones': respuesta.get('opciones', []),
                'texto': respuesta.get('texto', ''),
                'valor_original': respuesta
            }
        else:
            return {
                'opciones': [],
                'valor_original': respuesta,
                'texto': 'Sin opciones'
            }
    
    elif tipo in ['multiple', 'dropdown']:
        if isinstance(respuesta, (int, str)):
            try:
                indice = int(respuesta)
                return {
                    'indice': indice,
                    'valor_original': respuesta,
                    'texto': f"Opción {indice}"
                }
            except:
                return {
                    'indice': 0,
                    'valor_original': respuesta,
                    'texto': 'Opción por defecto'
                }
        elif isinstance(respuesta, dict):
            return {
                'indice': respuesta.get('indice', 0),
                'texto': respuesta.get('texto', ''),
                'id': respuesta.get('id', 0),
                'valor_original': respuesta
            }
        else:
            return {
                'indice': 0,
                'valor_original': respuesta,
                'texto': 'Opción por defecto'
            }
    
    elif tipo == 'binaria':
        if isinstance(respuesta, bool):
            return {
                'valor': respuesta,
                'valor_original': respuesta,
                'texto': 'Sí' if respuesta else 'No'
            }
        elif isinstance(respuesta, str):
            valor = respuesta.lower() in ['true', '1', 'sí', 'si', 'yes']
            return {
                'valor': valor,
                'valor_original': respuesta,
                'texto': 'Sí' if valor else 'No'
            }
        else:
            valor = bool(respuesta)
            return {
                'valor': valor,
                'valor_original': respuesta,
                'texto': 'Sí' if valor else 'No'
            }
    
    elif tipo == 'fecha':
        if isinstance(respuesta, str):
            return {
                'fecha': respuesta,
                'valor_original': respuesta,
                'formato': 'YYYY-MM-DD'
            }
        elif isinstance(respuesta, date):
            return {
                'fecha': respuesta.isoformat(),
                'valor_original': str(respuesta),
                'formato': 'YYYY-MM-DD'
            }
        elif isinstance(respuesta, dict):
            return {
                'fecha': respuesta.get('fecha', ''),
                'formato': respuesta.get('formato', 'YYYY-MM-DD'),
                'valor_original': respuesta
            }
        else:
            return {
                'fecha': str(respuesta),
                'valor_original': respuesta,
                'formato': 'YYYY-MM-DD'
            }
    
    elif tipo == 'fecha_hora':
        if isinstance(respuesta, str):
            return {
                'fecha_hora': respuesta,
                'valor_original': respuesta,
                'formato': 'ISO'
            }
        elif isinstance(respuesta, datetime):
            return {
                'fecha_hora': respuesta.isoformat(),
                'valor_original': str(respuesta),
                'formato': 'ISO'
            }
        elif isinstance(respuesta, dict):
            return {
                'fecha_hora': respuesta.get('fecha_hora', ''),
                'formato': respuesta.get('formato', 'ISO'),
                'valor_original': respuesta
            }
        else:
            return {
                'fecha_hora': str(respuesta),
                'valor_original': respuesta,
                'formato': 'ISO'
            }
    
    # Para tipos complejos (sis, sis2, canalizacion, etc.), mantener la estructura original
    elif tipo in ['sis', 'sis2', 'canalizacion', 'canalizacion_centro', 'ch', 'ed', 'meta', 
                  'datos_personales', 'datos_domicilio', 'datos_medicos', 'contactos', 
                  'tipo_discapacidad', 'imagen']:
        if isinstance(respuesta, dict):
            return respuesta
        else:
            return {
                'valor_original': respuesta,
                'texto': str(respuesta)
            }
    
    # Para cualquier otro tipo, devolver como está
    else:
        if isinstance(respuesta, (dict, list)):
            return respuesta
        else:
            return {
                'valor_original': respuesta,
                'texto': str(respuesta)
            }

class CuestionariosConRespuestasView(APIView):
    """
    Devuelve los cuestionarios activos del usuario:
    - Cuestionarios con respuestas del usuario (prioridad)
    - Cuestionarios activos sin respuestas del usuario
    Con el estado de finalización pero sin las preguntas.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, usuario_id):
        print(f"🔍 Consultando cuestionarios para usuario ID: {usuario_id}")
        
        # Obtener cuestionarios que tengan respuestas del usuario
        cuestionarios_con_respuestas = Respuesta.objects.filter(
            usuario_id=usuario_id
        ).values('cuestionario_id').annotate(
            respuestas_count=models.Count('id')
        ).filter(
            respuestas_count__gt=0
        ).values_list('cuestionario_id', flat=True)
        
        print(f"🧾 Cuestionarios con respuestas: {list(cuestionarios_con_respuestas)}")
        
        # Obtener todos los cuestionarios activos
        cuestionarios_activos = Cuestionario.objects.filter(activo=True)
        
        resultado = []
        cuestionarios_procesados = set()
        
        # Primero procesar los cuestionarios con respuestas
        for cuestionario_id in cuestionarios_con_respuestas:
            cuestionario = Cuestionario.objects.get(id=cuestionario_id)
            
            # Obtener el estado de finalización
            estado_obj = EstadoCuestionario.objects.filter(
                usuario_id=usuario_id, 
                cuestionario=cuestionario
            ).first()
            
            finalizado = estado_obj.estado == 'finalizado' if estado_obj else False
            
            resultado.append({
                "id": cuestionario.id,
                "nombre": cuestionario.nombre,
                "version": cuestionario.version,
                "activo": cuestionario.activo,
                "fecha_creacion": cuestionario.fecha_creacion,
                "base_cuestionario_id": cuestionario.base_cuestionario.id if cuestionario.base_cuestionario else None,
                "base_cuestionario_nombre": cuestionario.base_cuestionario.nombre if cuestionario.base_cuestionario else None,
                "estado_desbloqueo": cuestionario.base_cuestionario.estado_desbloqueo if cuestionario.base_cuestionario else None,
                "responsable": cuestionario.base_cuestionario.responsable if cuestionario.base_cuestionario else None,
                "inicio": cuestionario.base_cuestionario.inicio if cuestionario.base_cuestionario else None,
                "finalizado": finalizado,
                "estado": estado_obj.estado if estado_obj else "inactivo",
                "tiene_respuestas": True
            })
            
            cuestionarios_procesados.add(cuestionario.base_cuestionario.id if cuestionario.base_cuestionario else None)
        
        # Luego agregar los cuestionarios activos sin respuestas
        for cuestionario in cuestionarios_activos:
            base_cuestionario_id = cuestionario.base_cuestionario.id if cuestionario.base_cuestionario else None
            
            # Solo agregar si no se procesó ya (no tiene respuestas)
            if base_cuestionario_id not in cuestionarios_procesados:
                # Obtener el estado de finalización
                estado_obj = EstadoCuestionario.objects.filter(
                    usuario_id=usuario_id, 
                    cuestionario=cuestionario
                ).first()
                
                finalizado = estado_obj.estado == 'finalizado' if estado_obj else False
                
                resultado.append({
                    "id": cuestionario.id,
                    "nombre": cuestionario.nombre,
                    "version": cuestionario.version,
                    "activo": cuestionario.activo,
                    "fecha_creacion": cuestionario.fecha_creacion,
                    "base_cuestionario_id": base_cuestionario_id,
                    "base_cuestionario_nombre": cuestionario.base_cuestionario.nombre if cuestionario.base_cuestionario else None,
                    "estado_desbloqueo": cuestionario.base_cuestionario.estado_desbloqueo if cuestionario.base_cuestionario else None,
                    "responsable": cuestionario.base_cuestionario.responsable if cuestionario.base_cuestionario else None,
                    "inicio": cuestionario.base_cuestionario.inicio if cuestionario.base_cuestionario else None,
                    "finalizado": finalizado,
                    "estado": estado_obj.estado if estado_obj else "inactivo",
                    "tiene_respuestas": False
                })
        
        print(f"✅ Total cuestionarios procesados: {len(resultado)}")
        return Response(resultado, status=status.HTTP_200_OK)