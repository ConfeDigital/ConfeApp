from django.db import IntegrityError, transaction, models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.views import APIView
from .funciones.guardar_cuestionario import guardar_cuestionario_desde_json
from .precargacuestionario import procesar_archivo_precarga
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import generics
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.models import CustomUser
from datetime import datetime, date
import json
from django.http import FileResponse, FileResponse, Http404
import unicodedata
import re
import traceback
import uuid

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
    BulkRespuestasUploadSerializer, RespuestaBulkSerializer,
    PreguntaImagenSerializer,
)

from .utils import (
    cargar_cuestionarios_desde_excel,
    evaluar_rango,
    descargar_plantilla_cuestionario,
    get_resumen_sis,
    get_user_evaluation_summary,
    validar_columnas_excel,
    procesar_respuestas_excel,
    validar_formato_respuestas_excel
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
    """
    Lista todos los cuestionarios, opcionalmente filtrados por 'estado_desbloqueo'
    o un cuestionario específico por ID.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, id=None):
        if id:
            # Handle request for a single item by ID
            base_cuestionario = get_object_or_404(BaseCuestionarios, id=id)
            serializer = BaseCuestionariosSerializer(base_cuestionario)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Handle list request, with optional filtering
            base_cuestionarios = BaseCuestionarios.objects.all()
            
            # Get the 'estado_desbloqueo' parameter from the URL query string
            estado_desbloqueo = request.query_params.get('estado_desbloqueo', None)
            
            # If the parameter exists, filter the queryset
            if estado_desbloqueo:
                base_cuestionarios = base_cuestionarios.filter(estado_desbloqueo=estado_desbloqueo)

            # Serialize the filtered or complete queryset
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

class CopiarVersionCuestionario(APIView):
    """Obtiene la estructura completa de un cuestionario para copiar en el editor"""
    def get(self, request, cuestionario_id):
        try:
            # Obtener el cuestionario original
            cuestionario_original = Cuestionario.objects.get(id=cuestionario_id)
            
            # Obtener todas las preguntas del cuestionario original
            preguntas_originales = Pregunta.objects.filter(cuestionario=cuestionario_original)
            
            # Construir la estructura de datos para el editor
            estructura_cuestionario = {
                'base_cuestionario_id': cuestionario_original.base_cuestionario.id,
                'nombre': cuestionario_original.nombre,
                'nueva_version': cuestionario_original.version + 1,
                'preguntas': []
            }
            
            # Procesar cada pregunta
            for pregunta in preguntas_originales:
                pregunta_data = {
                    'texto': pregunta.texto,
                    'tipo': pregunta.tipo,
                    'seccion_sis': pregunta.seccion_sis,
                    'nombre_seccion': pregunta.nombre_seccion,
                    'profile_field_path': pregunta.profile_field_path,
                    'profile_field_config': pregunta.profile_field_config,
                    'opciones': [],
                    'imagenes': []
                }
                
                # Obtener opciones de la pregunta
                opciones = Opcion.objects.filter(pregunta=pregunta)
                for opcion in opciones:
                    pregunta_data['opciones'].append({
                        'texto': opcion.texto,
                        'valor': opcion.valor
                    })
                
                # Obtener imágenes de la pregunta
                imagenes = ImagenOpcion.objects.filter(pregunta=pregunta)
                for imagen in imagenes:
                    pregunta_data['imagenes'].append({
                        'imagen': imagen.imagen.url if imagen.imagen else None,
                        'descripcion': imagen.descripcion
                    })
                
                estructura_cuestionario['preguntas'].append(pregunta_data)
            
            # Obtener lógica de desbloqueo
            desbloqueos = DesbloqueoPregunta.objects.filter(cuestionario=cuestionario_original)
            estructura_cuestionario['desbloqueos'] = []
            
            for desbloqueo in desbloqueos:
                # Encontrar los índices de las preguntas en la lista
                pregunta_origen_index = None
                pregunta_desbloqueada_index = None
                
                for i, p in enumerate(preguntas_originales):
                    if p.id == desbloqueo.pregunta_origen.id:
                        pregunta_origen_index = i
                    if p.id == desbloqueo.pregunta_desbloqueada.id:
                        pregunta_desbloqueada_index = i
                
                if pregunta_origen_index is not None and pregunta_desbloqueada_index is not None:
                    estructura_cuestionario['desbloqueos'].append({
                        'pregunta_origen_index': pregunta_origen_index,
                        'pregunta_desbloqueada_index': pregunta_desbloqueada_index,
                        'opcion_valor': desbloqueo.opcion_desbloqueadora.valor,
                        'opcion_texto': desbloqueo.opcion_desbloqueadora.texto
                    })
            
            return Response(estructura_cuestionario, status=status.HTTP_200_OK)
                
        except Cuestionario.DoesNotExist:
            return Response({"error": "Cuestionario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error al obtener estructura del cuestionario: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    permission_classes = [permissions.IsAuthenticated]

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
        elif pregunta_tipo in ['numero', 'imagen']:
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

    def validar_respuesta_para_sql_server(self, respuesta):
        """Valida y limpia la respuesta para compatibilidad con Microsoft SQL Server"""
        try:
            # Si la respuesta es None, devolver None
            if respuesta is None:
                return None
            
            # Si es un string vacío, devolver string vacío
            if respuesta == "":
                return ""
            
            # Para Microsoft SQL Server, asegurar que los valores numéricos sean JSON válidos
            if isinstance(respuesta, (int, float)):
                # Convertir a string para evitar problemas con CHECK constraints
                return str(respuesta)
            
            # Si es un booleano, mantener como booleano
            if isinstance(respuesta, bool):
                return respuesta
            
            # Si es una lista, validar que contenga solo tipos básicos
            if isinstance(respuesta, list):
                lista_validada = []
                for item in respuesta:
                    if isinstance(item, (str, int, float, bool)):
                        lista_validada.append(item)
                    else:
                        lista_validada.append(str(item))
                return lista_validada
            
            # Si es un diccionario, validar que contenga solo tipos básicos
            if isinstance(respuesta, dict):
                dict_validado = {}
                for key, value in respuesta.items():
                    if isinstance(key, str):
                        if isinstance(value, (str, int, float, bool, list)):
                            dict_validado[key] = value
                        else:
                            dict_validado[key] = str(value)
                return dict_validado
            
            # Para cualquier otro tipo, convertir a string
            return str(respuesta)
            
        except Exception as e:
            print(f"Error validando respuesta para SQL Server: {e}")
            # En caso de error, devolver string vacío
            return ""

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
                # Para Azure SQL Server, simplificar el procesamiento y evitar objetos complejos
                if pregunta.tipo == 'numero':
                    valor = float(respuesta_limpia) if respuesta_limpia else 0
                    respuesta_procesada = str(valor)  # Convertir a string para SQL Server
                elif pregunta.tipo in ['multiple', 'dropdown']:
                    valor = int(respuesta_limpia) if respuesta_limpia else 0
                    respuesta_procesada = str(valor)  # Convertir a string para SQL Server
                elif pregunta.tipo == 'binaria':
                    respuesta_procesada = respuesta_limpia in [True, 'true', '1', 'sí', 'si']
                elif pregunta.tipo == 'imagen':
                    valor = float(respuesta_limpia) if respuesta_limpia else 0
                    respuesta_procesada = str(valor)  # Convertir a string para SQL Server
                elif pregunta.tipo == 'checkbox':
                    # Para checkbox, mantener como array simple
                    if isinstance(respuesta_limpia, list):
                        respuesta_procesada = respuesta_limpia
                    elif isinstance(respuesta_limpia, str):
                        try:
                            respuesta_procesada = json.loads(respuesta_limpia)
                        except json.JSONDecodeError:
                            respuesta_procesada = [respuesta_limpia]
                    else:
                        respuesta_procesada = [respuesta_limpia] if respuesta_limpia else []
                elif pregunta.tipo == 'abierta':
                    # Para preguntas abiertas, mantener como string simple
                    respuesta_procesada = str(respuesta_limpia) if respuesta_limpia else ""
                elif pregunta.tipo in ['fecha', 'fecha_hora']:
                    # Para fechas, mantener como string ISO
                    respuesta_procesada = str(respuesta_limpia) if respuesta_limpia else ""
                elif pregunta.tipo in ['sis', 'sis2', 'canalizacion', 'canalizacion_centro', 'ch', 'ed', 'meta', 
                                       'datos_personales', 'datos_domicilio', 'datos_medicos', 'contactos', 
                                       'tipo_discapacidad']:
                    # Para preguntas complejas, mantener la estructura original sin wrapper
                    respuesta_procesada = respuesta_limpia if respuesta_limpia else {}
                else:
                    # Para otros tipos, usar procesamiento simplificado
                    respuesta_procesada = procesar_respuesta_simplificada(respuesta_limpia, pregunta.tipo)
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
                    # Validar que la respuesta sea compatible con Microsoft SQL Server
                    respuesta_validada = self.validar_respuesta_para_sql_server(respuesta_procesada)
                    print(f"Respuesta validada para SQL Server: {respuesta_validada}")
                    print(f"Tipo de respuesta validada: {type(respuesta_validada)}")
                    
                    respuesta_obj, created = Respuesta.objects.update_or_create(
                        usuario=usuario,
                        cuestionario=cuestionario,
                        pregunta=pregunta,
                        defaults={'respuesta': respuesta_validada}
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
                    print(f"🔍 Pregunta ID: {pregunta.id}")
                    print(f"🔍 Texto de la pregunta: {pregunta.texto}")
                    print(f"🔍 Tipo de pregunta: {pregunta.tipo}")
                    print(f"🔍 Respuesta recibida: {respuesta_limpia}")
                    print(f"🔍 Tipo de respuesta: {type(respuesta_limpia)}")
                    
                    try:
                        # First, remove all existing unlocked questions for this pregunta_origen
                        # to handle changes in responses
                        desbloqueos_existentes = DesbloqueoPregunta.objects.filter(
                            cuestionario=cuestionario,
                            pregunta_origen=pregunta
                        )
                        
                        print(f"🗑️ Desbloqueos existentes encontrados: {desbloqueos_existentes.count()}")
                        
                        # Get all questions that were unlocked by this pregunta_origen
                        preguntas_desbloqueadas = []
                        for desbloqueo in desbloqueos_existentes:
                            preguntas_desbloqueadas.append(desbloqueo.pregunta_desbloqueada)
                            print(f"🗑️ Pregunta desbloqueada existente: {desbloqueo.pregunta_desbloqueada.texto}")
                        
                        # Remove responses for questions that were unlocked by this pregunta_origen
                        if preguntas_desbloqueadas:
                            respuestas_eliminadas = Respuesta.objects.filter(
                                usuario=usuario,
                                cuestionario=cuestionario,
                                pregunta__in=preguntas_desbloqueadas
                            ).delete()
                            print(f"🗑️ Respuestas eliminadas: {respuestas_eliminadas}")
                        
                        if pregunta.tipo == 'checkbox':
                            print("🔘 Procesando pregunta tipo CHECKBOX")
                            
                            todas_opciones = Opcion.objects.filter(pregunta=pregunta)
                            print(f"🔘 Todas las opciones disponibles para la pregunta {pregunta.id}:")
                            for op in todas_opciones:
                                print(f"  - ID: {op.id}, Valor: {op.valor}, Texto: {op.texto}")
                            
                            if isinstance(respuesta_limpia, str):
                                try:
                                    opciones_seleccionadas = json.loads(respuesta_limpia)
                                    print(f"🔘 Opciones seleccionadas (JSON parseado): {opciones_seleccionadas}")
                                except json.JSONDecodeError:
                                    opciones_seleccionadas = []
                                    print("❌ Error al parsear JSON, opciones_seleccionadas = []")
                            else:
                                opciones_seleccionadas = respuesta_limpia if isinstance(respuesta_limpia, list) else []
                                print(f"🔘 Opciones seleccionadas (directo): {opciones_seleccionadas}")

                            print(f"🔘 Total de opciones seleccionadas: {len(opciones_seleccionadas)}")

                            for valor in opciones_seleccionadas:
                                print(f"🔘 Procesando valor: {valor}")
                                opciones = Opcion.objects.filter(
                                    pregunta=pregunta,
                                    id=valor
                                )
                                print(f"🔘 Opciones encontradas para ID {valor}: {opciones.count()}")
                                
                                for opcion in opciones:
                                    print(f"🔘 Procesando opción: {opcion.texto} (ID: {opcion.id}, valor: {opcion.valor})")
                                    desbloqueos = DesbloqueoPregunta.objects.filter(
                                        cuestionario=cuestionario,
                                        pregunta_origen=pregunta,
                                        opcion_desbloqueadora=opcion
                                    )
                                    print(f"🔘 Desbloqueos encontrados para esta opción: {desbloqueos.count()}")
                                    
                                    for desbloqueo in desbloqueos:
                                        print(f"🔓 Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                                        try:
                                            resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                                usuario=usuario,
                                                cuestionario=cuestionario,
                                                pregunta=desbloqueo.pregunta_desbloqueada,
                                                defaults={'respuesta': None}  # Use None instead of empty string
                                            )
                                            print(f"🔓 Respuesta de desbloqueo creada: {created_desbloqueo}")
                                        except IntegrityError as e:
                                            print(f"❌ Error al crear respuesta de desbloqueo: {e}")
                                            continue

                        elif pregunta.tipo in ['multiple', 'dropdown']:
                            print(f"🔘 Procesando pregunta tipo: {pregunta.tipo}")
                            
                            # Mostrar todas las opciones disponibles
                            todas_opciones = Opcion.objects.filter(pregunta=pregunta)
                            print(f"🔘 Todas las opciones disponibles:")
                            for op in todas_opciones:
                                print(f"  - ID: {op.id}, Valor: {op.valor}, Texto: {op.texto}")
                            
                            if isinstance(respuesta_limpia, (str, int)) and str(respuesta_limpia).isdigit():
                                valor_respuesta = int(respuesta_limpia)
                                print(f"🔘 Buscando opción con valor: {valor_respuesta}")
                                print(f"🔘 Tipo de valor_respuesta: {type(valor_respuesta)}")
                                
                                opciones_seleccionadas = Opcion.objects.filter(
                                    pregunta=pregunta,
                                    valor=valor_respuesta
                                )
                                print(f"🔘 Opciones encontradas para respuesta {respuesta_limpia}: {opciones_seleccionadas.count()}")
                                
                                # Verificar cada opción individualmente
                                for op in todas_opciones:
                                    print(f"🔘 Comparando: op.valor ({op.valor}) == valor_respuesta ({valor_respuesta}) = {op.valor == valor_respuesta}")

                                for opcion_seleccionada in opciones_seleccionadas:
                                    print(f"🔘 Procesando opción: {opcion_seleccionada.texto} (ID: {opcion_seleccionada.id}, valor: {opcion_seleccionada.valor})")
                                    desbloqueos = DesbloqueoPregunta.objects.filter(
                                        cuestionario=cuestionario,
                                        pregunta_origen=pregunta,
                                        opcion_desbloqueadora=opcion_seleccionada
                                    )
                                    print(f"🔘 Desbloqueos encontrados: {desbloqueos.count()}")

                                    for desbloqueo in desbloqueos:
                                        print(f"🔓 Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                                        try:
                                            resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                                usuario=usuario,
                                                cuestionario=cuestionario,
                                                pregunta=desbloqueo.pregunta_desbloqueada,
                                                defaults={'respuesta': None}  # Use None instead of empty string
                                            )
                                            print(f"🔓 Respuesta de desbloqueo creada: {created_desbloqueo}")
                                        except IntegrityError as e:
                                            print(f"❌ Error al crear respuesta de desbloqueo: {e}")
                                            continue
                            else:
                                print(f"❌ Respuesta no es un número válido: {respuesta_limpia}")
                                print(f"❌ Tipo de respuesta_limpia: {type(respuesta_limpia)}")

                        elif pregunta.tipo == 'binaria':
                            # Para preguntas binarias, buscar opciones por texto
                            if isinstance(respuesta_limpia, bool):
                                # Convertir booleano a texto
                                texto_buscar = "Sí" if respuesta_limpia else "No"
                            elif isinstance(respuesta_limpia, str):
                                # Si ya es un string, usarlo directamente
                                texto_buscar = respuesta_limpia
                            else:
                                # Para otros tipos, convertir a booleano
                                texto_buscar = "Sí" if bool(respuesta_limpia) else "No"
                            
                            # Buscar opciones por texto
                            opciones_seleccionadas = Opcion.objects.filter(
                                pregunta=pregunta,
                                texto=texto_buscar
                            )

                            for opcion_seleccionada in opciones_seleccionadas:
                                desbloqueos = DesbloqueoPregunta.objects.filter(
                                    cuestionario=cuestionario,
                                    pregunta_origen=pregunta,
                                    opcion_desbloqueadora=opcion_seleccionada
                                )

                                for desbloqueo in desbloqueos:
                                    try:
                                        resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                            usuario=usuario,
                                            cuestionario=cuestionario,
                                            pregunta=desbloqueo.pregunta_desbloqueada,
                                            defaults={'respuesta': None}  # Use None instead of empty string
                                        )
                                    except IntegrityError as e:
                                        continue

                        else:
                            print(f"🔘 Procesando pregunta tipo: {pregunta.tipo}")
                            
                            # Mostrar todas las opciones disponibles
                            todas_opciones = Opcion.objects.filter(pregunta=pregunta)
                            print(f"🔘 Todas las opciones disponibles:")
                            for op in todas_opciones:
                                print(f"  - ID: {op.id}, Valor: {op.valor}, Texto: {op.texto}")
                            
                            if isinstance(respuesta_limpia, (str, int)) and str(respuesta_limpia).isdigit():
                                valor_respuesta = int(respuesta_limpia)
                                print(f"🔘 Buscando opción con valor: {valor_respuesta}")
                                
                                opciones_seleccionadas = Opcion.objects.filter(
                                    pregunta=pregunta,
                                    valor=valor_respuesta
                                )
                                print(f"🔘 Opciones encontradas para respuesta {respuesta_limpia}: {opciones_seleccionadas.count()}")

                                for opcion_seleccionada in opciones_seleccionadas:
                                    print(f"🔘 Procesando opción: {opcion_seleccionada.texto} (ID: {opcion_seleccionada.id}, valor: {opcion_seleccionada.valor})")
                                    desbloqueos = DesbloqueoPregunta.objects.filter(
                                        cuestionario=cuestionario,
                                        pregunta_origen=pregunta,
                                        opcion_desbloqueadora=opcion_seleccionada
                                    )
                                    print(f"🔘 Desbloqueos encontrados: {desbloqueos.count()}")

                                    for desbloqueo in desbloqueos:
                                        print(f"🔓 Desbloqueando pregunta: {desbloqueo.pregunta_desbloqueada.texto}")
                                        try:
                                            resp_desbloqueada, created_desbloqueo = Respuesta.objects.get_or_create(
                                                usuario=usuario,
                                                cuestionario=cuestionario,
                                                pregunta=desbloqueo.pregunta_desbloqueada,
                                                defaults={'respuesta': None}  # Use None instead of empty string
                                            )
                                            print(f"🔓 Respuesta de desbloqueo creada: {created_desbloqueo}")
                                        except IntegrityError as e:
                                            print(f"❌ Error al crear respuesta de desbloqueo: {e}")
                                            continue
                            else:
                                print(f"❌ Respuesta no es un número válido: {respuesta_limpia}")

                    except Exception as e:
                        print(f"❌ Error al procesar desbloqueos: {str(e)}")
                        traceback.print_exc()
                        # Don't fail the whole request if unlocking fails
                        pass

            print("=== FIN PROCESO DE GUARDADO ===")
            serializer = RespuestaSerializer(respuesta_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            print(f"Error general en el proceso: {str(e)}")
            traceback.print_exc()
            return Response(
                {"error": "An unexpected error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class RespuestaActualizacion(generics.UpdateAPIView):
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
class EditarCuestionarioView(generics.UpdateAPIView):
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
    

class RespuestasUnlockedPathView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        otros_filtros = {
            key: value for key, value in request.query_params.items()
            if key not in ['desbloqueada', 'usuario_id', 'cuestionario_id']
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
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usuario_id = request.query_params.get("usuario_id")
        if not usuario_id:
            return Response({"error": "Se requiere usuario_id"}, status=status.HTTP_400_BAD_REQUEST)

        respuestas = Respuesta.objects.filter(
            usuario_id=usuario_id,
            pregunta__tipo="ch"
        ).select_related('pregunta')

        resumen = {
            "usuario_id": usuario_id,
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

class PreguntaImagenUploadAPIView(generics.UpdateAPIView):
    """
    Vista para subir imágenes de preguntas tipo "imagen"
    Similar a CandidatePhotoUploadAPIView
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PreguntaImagenSerializer

    def get_object(self):
        # Usar el pregunta_id pasado en la URL para obtener la pregunta
        pregunta_id = self.kwargs.get('pregunta_id')
        try:
            # Buscar si ya existe una ImagenOpcion para esta pregunta
            imagen_opcion = ImagenOpcion.objects.get(pregunta_id=pregunta_id)
            return imagen_opcion
        except ImagenOpcion.DoesNotExist:
            # Si no existe, crear una nueva
            pregunta = get_object_or_404(Pregunta, id=pregunta_id)
            return ImagenOpcion.objects.create(
                pregunta=pregunta,
                descripcion=f'Imagen para pregunta: {pregunta.texto}'
            )

    def update(self, request, *args, **kwargs):
        # Esta vista espera solo la imagen en el payload
        instance = self.get_object()
        partial = kwargs.pop('partial', True)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PrecargaCuestionarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print("\n📥 Datos crudos recibidos en la precarga:")
        for key in request.POST:
            print(f"{key}: {request.POST[key]}")
        print("\n📥 Archivos recibidos:")
        for file_key in request.FILES:
            print(f"{file_key}: {request.FILES[file_key].name}")

        excel_file = request.FILES.get("file")
        tipo_cuestionario = request.data.get("tipo_cuestionario")

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
    permission_classes = [permissions.IsAuthenticated]
    
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
    permission_classes = [permissions.IsAuthenticated]

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


def procesar_respuesta_simplificada(respuesta, tipo):
    """Procesa la respuesta de forma simplificada para compatibilidad con Microsoft SQL Server"""
    
    # Para Azure SQL Server, evitar objetos complejos y usar tipos básicos
    if tipo == 'abierta':
        return str(respuesta) if respuesta else ""
    
    elif tipo == 'numero':
        try:
            valor = float(respuesta) if respuesta else 0
            return str(valor)  # Convertir a string para SQL Server
        except (ValueError, TypeError):
            return "0"
    
    elif tipo == 'imagen':
        try:
            valor = float(respuesta) if respuesta else 0
            return str(valor)  # Convertir a string para SQL Server
        except (ValueError, TypeError):
            return "0"
    
    elif tipo == 'checkbox':
        if isinstance(respuesta, list):
            return respuesta
        elif isinstance(respuesta, str):
            try:
                return json.loads(respuesta)
            except json.JSONDecodeError:
                return [respuesta] if respuesta else []
        else:
            return [respuesta] if respuesta else []
    
    elif tipo in ['multiple', 'dropdown']:
        try:
            valor = int(respuesta) if respuesta else 0
            return str(valor)  # Convertir a string para SQL Server
        except (ValueError, TypeError):
            return "0"
    
    elif tipo == 'binaria':
        if isinstance(respuesta, bool):
            return respuesta
        elif isinstance(respuesta, str):
            return respuesta.lower() in ['true', '1', 'sí', 'si', 'yes']
        else:
            return bool(respuesta)
    
    elif tipo == 'fecha':
        return str(respuesta) if respuesta else ""
    
    elif tipo == 'fecha_hora':
        return str(respuesta) if respuesta else ""
    
    # Para tipos complejos, mantener la estructura original sin wrapper
    elif tipo in ['sis', 'sis2', 'canalizacion', 'canalizacion_centro', 'ch', 'ed', 'meta', 
                  'datos_personales', 'datos_domicilio', 'datos_medicos', 'contactos', 
                  'tipo_discapacidad']:
        # Mantener la estructura original para todos los tipos complejos
        return respuesta if respuesta else {}
    
    # Para cualquier otro tipo, convertir a string
    else:
        return str(respuesta) if respuesta else ""

def procesar_respuesta_para_tipo(respuesta, tipo):
    """Procesa la respuesta según el tipo para asegurar compatibilidad con Azure SQL"""
    
    if tipo == 'abierta':
        # For abierta questions, keep it simple - just return the text directly
        return str(respuesta) if respuesta else ""
    
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
    
    elif tipo == 'imagen':
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
                  'tipo_discapacidad']:
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
    Devuelve los base_cuestionarios disponibles para el usuario,
    opcionalmente filtrados por 'estado_desbloqueo'.
    """
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]

    def get(self, request, usuario_id):
        # print(f"🔍 Consultando cuestionarios para usuario ID: {usuario_id}")

        # Get the 'estado_desbloqueo' parameter from the URL query string
        estado_desbloqueo_filter = request.query_params.get('estado_desbloqueo', None)

        # Get all base_cuestionarios, applying the filter if it exists
        base_cuestionarios = BaseCuestionarios.objects.all()
        if estado_desbloqueo_filter:
            base_cuestionarios = base_cuestionarios.filter(estado_desbloqueo=estado_desbloqueo_filter)

        # print(f"🔍 Total de base_cuestionarios a procesar: {base_cuestionarios.count()}")
        
        # Obtener cuestionarios que tengan respuestas del usuario
        cuestionarios_con_respuestas = Respuesta.objects.filter(
            usuario_id=usuario_id
        ).values('cuestionario_id').annotate(
            respuestas_count=models.Count('id')
        ).filter(
            respuestas_count__gt=0
        ).values_list('cuestionario_id', flat=True)
        
        # print(f"🧾 Cuestionarios con respuestas: {list(cuestionarios_con_respuestas)}")
        
        resultado = []
        
        # Procesar cada base_cuestionario filtrado
        for base_cuestionario in base_cuestionarios:
            # The rest of your existing logic remains unchanged
            # It will now operate on the filtered `base_cuestionarios` queryset
            
            # Buscar cuestionarios de este base_cuestionario que tengan respuestas
            cuestionarios_con_respuestas_de_base = Cuestionario.objects.filter(
                base_cuestionario=base_cuestionario,
                id__in=cuestionarios_con_respuestas
            )
            
            if cuestionarios_con_respuestas_de_base.exists():
                cuestionario_seleccionado = cuestionarios_con_respuestas_de_base.order_by('-version').first()
                tiene_respuestas = True
                # print(f"✅ Base '{base_cuestionario.nombre}': usando cuestionario con respuestas (ID: {cuestionario_seleccionado.id})")
            else:
                cuestionario_activo = Cuestionario.objects.filter(
                    base_cuestionario=base_cuestionario,
                    activo=True
                ).first()
                
                if cuestionario_activo:
                    cuestionario_seleccionado = cuestionario_activo
                    tiene_respuestas = False
                    # print(f"📋 Base '{base_cuestionario.nombre}': usando cuestionario activo (ID: {cuestionario_activo.id})")
                else:
                    cuestionario_seleccionado = Cuestionario.objects.filter(
                        base_cuestionario=base_cuestionario
                    ).order_by('-version').first()
                    tiene_respuestas = False
                    # print(f"⚠️ Base '{base_cuestionario.nombre}': usando cuestionario más reciente (ID: {cuestionario_seleccionado.id})")
            
            if cuestionario_seleccionado:
                estado_obj = EstadoCuestionario.objects.filter(
                    usuario_id=usuario_id, 
                    cuestionario=cuestionario_seleccionado
                ).first()
                
                finalizado = estado_obj.estado == 'finalizado' if estado_obj else False
                
                resultado.append({
                    "id": cuestionario_seleccionado.id,
                    "nombre": cuestionario_seleccionado.nombre,
                    "version": cuestionario_seleccionado.version,
                    "activo": cuestionario_seleccionado.activo,
                    "fecha_creacion": cuestionario_seleccionado.fecha_creacion,
                    "base_cuestionario_id": base_cuestionario.id,
                    "base_cuestionario_nombre": base_cuestionario.nombre,
                    "estado_desbloqueo": base_cuestionario.estado_desbloqueo,
                    "responsable": base_cuestionario.responsable,
                    "inicio": base_cuestionario.inicio,
                    "finalizado": finalizado,
                    "estado": estado_obj.estado if estado_obj else "inactivo",
                    "tiene_respuestas": tiene_respuestas
                })
        
        # print(f"✅ Total base_cuestionarios procesados: {len(resultado)}")
        return Response(resultado, status=status.HTTP_200_OK)

class CargaMasivaRespuestasView(APIView):
    """
    Vista para carga masiva de respuestas a cuestionarios
    """
    permission_classes = [permissions.IsAuthenticated]
    # permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Procesa un archivo Excel con respuestas a cuestionarios
        """
        print("DEBUG: Iniciando procesamiento de carga masiva")
        try:
            # Validar datos de entrada
            print("DEBUG: Validando datos de entrada")
            serializer = BulkRespuestasUploadSerializer(data=request.data)
            if not serializer.is_valid():
                print("DEBUG: Error en validación del serializer:", serializer.errors)
                return Response({
                    'error': 'Datos inválidos',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            excel_file = serializer.validated_data['excel_file']
            cuestionario_nombre = serializer.validated_data['cuestionario_nombre']
            nombre_column = serializer.validated_data['nombre_column']
            overwrite = serializer.validated_data['overwrite']
            
            print(f"DEBUG: Datos recibidos - cuestionario: {cuestionario_nombre}, columna: {nombre_column}, overwrite: {overwrite}")
            
            # Validar formato del archivo
            validacion = validar_formato_respuestas_excel(
                excel_file, 
                cuestionario_nombre, 
                nombre_column
            )
            
            if not validacion['valido']:
                return Response({
                    'error': 'Archivo inválido',
                    'validation': validacion
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Procesar el archivo
            print("DEBUG: Iniciando procesamiento del archivo")
            stats = procesar_respuestas_excel(
                excel_file,
                cuestionario_nombre,
                nombre_column,
                overwrite
            )
            
            print("DEBUG: Procesamiento completado, estadísticas:", stats)
            return Response({
                'success': True,
                'message': 'Archivo procesado correctamente',
                'stats': stats,
                'validation': validacion
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error procesando el archivo',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """
        Obtiene información sobre cuestionarios disponibles para carga masiva
        """
        try:
            from .models import Cuestionario
            
            cuestionarios = Cuestionario.objects.filter(activo=True).select_related('base_cuestionario')
            
            cuestionarios_info = []
            for cuestionario in cuestionarios:
                preguntas = cuestionario.preguntas.all()
                cuestionarios_info.append({
                    'id': cuestionario.id,
                    'nombre': cuestionario.nombre,
                    'version': cuestionario.version,
                    'base_cuestionario': cuestionario.base_cuestionario.nombre,
                    'total_preguntas': preguntas.count(),
                    'preguntas': [p.texto for p in preguntas]
                })
            
            return Response({
                'cuestionarios': cuestionarios_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error obteniendo información de cuestionarios',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ValidarRespuestasExcelView(APIView):
    """
    Vista para validar el formato de un archivo Excel antes de procesarlo
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Valida el formato de un archivo Excel con respuestas
        """
        try:
            # Validar datos de entrada
            serializer = BulkRespuestasUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'error': 'Datos inválidos',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            excel_file = serializer.validated_data['excel_file']
            cuestionario_nombre = serializer.validated_data['cuestionario_nombre']
            nombre_column = serializer.validated_data['nombre_column']
            
            # Validar formato del archivo
            validacion = validar_formato_respuestas_excel(
                excel_file, 
                cuestionario_nombre, 
                nombre_column
            )
            
            return Response({
                'validation': validacion
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error validando el archivo',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)