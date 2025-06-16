from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
import hashlib
from discapacidad.serializers import TechnicalAidSerializer

from .utils import get_suggested_technical_aids_grouped
from .models import SeguimientoApoyos, SeguimientoProyectoVida
from .serializers import SeguimientoProyectoVidaSerializer
from .serializers import SeguimientoApoyosSerializer


class GuardarSeguimientoApoyos(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        usuario_id = request.data.get('usuario_id')
        secciones = request.data.get('secciones', [])
        estado_por_ayuda = request.data.get('estado_por_ayuda', {})

        hora_actual = timezone.now()
        sesion_id = self.generar_sesion_id(usuario_id, hora_actual)

        print("📥 POST recibido:", {
            "usuario_id": usuario_id,
            "estado_por_ayuda": estado_por_ayuda,
        })

        try:
            for ayuda_id_str, estado in estado_por_ayuda.items():
                ayuda_id = int(ayuda_id_str)
                if not estado.get("activo"):
                    continue  # solo guardar ayudas activas

                subitem_key = estado.get("subitem_key")
                resultado = estado.get("resultado", "no_especificado")
                comentario = estado.get("comentario", "")
                
                # buscar la ayuda y su contexto
                for seccion in secciones:
                    for item in seccion.get("items", []):
                        for subitem in item.get("subitems", []):
                            current_key = f"{item.get('item')}_{subitem.get('sub_item_id')}"
                            if current_key != subitem_key:
                                continue

                            ayuda = next((a for a in subitem.get("ayudas", []) if a["id"] == ayuda_id), None)
                            if not ayuda:
                                continue

                            SeguimientoApoyos.objects.create(
                                usuario_id=usuario_id,
                                seccion=seccion.get("nombre_seccion"),
                                item=item.get("item"),
                                subitem=subitem.get("sub_item"),
                                ayuda_id=ayuda_id,
                                ayuda_descripcion=ayuda.get("descripcion", ""),
                                resultado=resultado,
                                comentario=comentario,
                                sesion_seguimiento=sesion_id
                            )

                            print("✅ Registro guardado:", {
                                "usuario": usuario_id,
                                "seccion": seccion.get("nombre_seccion"),
                                "item": item.get("item"),
                                "subitem": subitem.get("sub_item"),
                                "ayuda_id": ayuda_id,
                                "resultado": resultado,
                                "comentario": comentario,
                                "sesion": sesion_id
                            })

            return Response({'status': 'success', 'sesion_id': sesion_id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        registros = SeguimientoApoyos.objects.all().order_by('-fecha_sesion')
        serializer = SeguimientoApoyosSerializer(registros, many=True)
        return Response(serializer.data, status=200)

    def generar_sesion_id(self, usuario_id, timestamp):
        hora_redondeada = timestamp.replace(minute=0, second=0, microsecond=0)
        return hashlib.md5(f"{usuario_id}_{hora_redondeada}".encode()).hexdigest()


class GuardarSeguimientoProyectoVida(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario_id = request.data.get('usuario_id')
        metas = request.data.get('metas', [])

        if not usuario_id:
            return Response({'error': 'usuario_id requerido'}, status=400)

        try:
            # Siempre guardar como nuevo registro
            SeguimientoProyectoVida.objects.create(
                usuario_id=usuario_id,
                metas=metas,
                comentarios=request.data.get('comentarios', '')
            )
            return Response({'status': 'success'}, status=201)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)


class ObtenerSeguimientoProyectoVida(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        seguimientos = SeguimientoProyectoVida.objects.filter(usuario_id=usuario_id).order_by('-fecha_actualizacion')

        if not seguimientos.exists():
            return Response([], status=status.HTTP_200_OK)

        serializer = SeguimientoProyectoVidaSerializer(seguimientos, many=True)
        return Response(serializer.data)


class ObtenerUltimoSeguimientoProyectoVida(APIView):
    """
    Devuelve solo el último seguimiento guardado de Proyecto de Vida.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        seguimiento = SeguimientoProyectoVida.objects.filter(usuario_id=usuario_id).order_by('-fecha_actualizacion').first()

        if not seguimiento:
            return Response({}, status=status.HTTP_200_OK)

        serializer = SeguimientoProyectoVidaSerializer(seguimiento)
        return Response(serializer.data)


class ObtenerUltimosSeguimientosApoyos(APIView):
    """
    Devuelve los registros más recientes de apoyos por usuario y sesión más nueva.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        # Buscar la sesión más reciente
        ultima = SeguimientoApoyos.objects.filter(usuario_id=usuario_id).order_by('-fecha_sesion').first()
        if not ultima:
            return Response([], status=status.HTTP_200_OK)

        # Obtener todos los apoyos de esa sesión
        registros = SeguimientoApoyos.objects.filter(
            usuario_id=usuario_id,
            sesion_seguimiento=ultima.sesion_seguimiento
        ).order_by('seccion', 'item', 'subitem')

        serializer = SeguimientoApoyosSerializer(registros, many=True)
        return Response(serializer.data)

class ObtenerSeguimientoApoyosActual(APIView):
    """
    Devuelve el último estado de cada ayuda activa por subitem.
    """
    permission_classes = [AllowAny]

    def get(self, request, usuario_id):
        registros = SeguimientoApoyos.objects.filter(usuario_id=usuario_id).order_by('-fecha_sesion')

        vistos = set()
        estado = {}

        for reg in registros:
            if reg.ayuda_id in vistos:
                continue

            vistos.add(reg.ayuda_id)
            subitem_key = f"{reg.item}_{reg.subitem}"  # usando subitem textual

            estado[str(reg.ayuda_id)] = {
                "activo": True,
                "subitem_key": subitem_key,
                "resultado": reg.resultado,
                "comentario": reg.comentario,
            }

        return Response(estado, status=200)
    

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_technical_aids_grouped(request, usuario_id):
    """
    Returns technical aids grouped by impediments, excluding aids already assigned to the candidate.
    
    Response format:
    {
        "Lectura y Escritura": [
            {
                "aid": {aid_data},
                "description": "Description for this specific impediment"
            }
        ],
        "Comunicación": [...]
    }
    """
    grouped_aids = get_suggested_technical_aids_grouped(usuario_id)
    
    result = {}
    for impediment_name, aids_data in grouped_aids.items():
        result[impediment_name] = []
        for aid_data in aids_data:
            serialized_aid = TechnicalAidSerializer(aid_data['aid']).data
            result[impediment_name].append({
                'aid': serialized_aid,
                'description': aid_data['description']
            })
    
    return Response(result)

# Keep the original endpoint for backward compatibility
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_technical_aids(request, usuario_id):
    """Original endpoint - returns flat list of aids"""
    grouped_aids = get_suggested_technical_aids_grouped(usuario_id)
    
    # Flatten the grouped aids to maintain backward compatibility
    all_aids = []
    seen_aid_ids = set()
    
    for impediment_name, aids_data in grouped_aids.items():
        for aid_data in aids_data:
            if aid_data['aid'].id not in seen_aid_ids:
                all_aids.append(aid_data['aid'])
                seen_aid_ids.add(aid_data['aid'].id)
    
    serializer = TechnicalAidSerializer(all_aids, many=True)
    return Response(serializer.data)