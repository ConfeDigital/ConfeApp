import pandas as pd
import logging
import json
from .models import BaseCuestionarios, Cuestionario, Pregunta, Opcion, DesbloqueoPregunta, Respuesta
from discapacidad.models import SISAid
from tablas_de_equivalencia.models import CalculoDeIndiceDeNecesidadesDeApoyo
from tablas_de_equivalencia.utils import get_filtered_and_formatted_puntuaciones
from io import BytesIO
from django.http import JsonResponse, HttpResponse
import re
import os
from django.conf import settings
from django.shortcuts import get_object_or_404

from openpyxl import load_workbook
from openpyxl.drawing.image import Image as OpenpyxlImage
from django.core.files.base import ContentFile
import io
from django.db.models import Q


logger = logging.getLogger(__name__)

def validar_columnas_excel(ruta_archivo):
    """
    Valida si el archivo Excel tiene las columnas requeridas.

    Columnas requeridas:
    - Pregunta
    - Sección
    - Tipo de Pregunta
    - ¿Se incluye en ficha técnica?
    - ¿Es información personal?
    - Opcion (si aplica)
    - Valor de la Opcion (si aplica)
    - Pregunta que desbloquea
    """
    required_columns = [
        "Pregunta","Sección", "Tipo de Pregunta", "¿Se incluye en ficha técnica? (si/no)",    
        "Campo en Ficha tecnica (si aplica)",   "¿Es información personal? (si,no)",    
        "Campo en Informacion Personal  (si aplica)",   "Opcion (si aplica)",   "Valor de la Opcion (si aplica)",   
        "Pregunta que desbloquea",
    ]

    try:
        df = pd.read_excel(ruta_archivo, sheet_name='Cuestionario')
        df = df.where(pd.notnull(df), None)

        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {
                'status': 'error',
                'message': f"Columnas faltantes en el Excel: {', '.join(missing_columns)}"
            }

        return {'status': 'success', 'message': 'El archivo tiene las columnas correctas.'}

    except Exception as e:
        return {'status': 'error', 'message': str(e)}
    


def limpiar_texto_celda(valor):
    if isinstance(valor, str):
        valor = valor.strip()  # quita espacios iniciales/finales
        valor = re.sub(r'\s+', ' ', valor)  # reemplaza espacios múltiples, tabs, saltos de línea, etc.
    return valor


def cargar_cuestionarios_desde_excel(ruta_archivo, cuestionario_id):
    try:
        # Leer el archivo Excel
        df = pd.read_excel(ruta_archivo, sheet_name='Cuestionario')
        df = df.where(pd.notnull(df), None)

        # Limpiar espacios en columnas de texto
        # Aplica la limpieza a todo el DataFrame
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].apply(limpiar_texto_celda)

        columnas_a_rellenar = [
            "Pregunta", "Sección", "Tipo de Pregunta", "¿Se incluye en ficha técnica? (si/no)",
            "Campo en Ficha tecnica (si aplica)", "¿Es información personal? (si,no)",
            "Campo en Informacion Personal  (si aplica)"
        ]
        df[columnas_a_rellenar] = df[columnas_a_rellenar].ffill()

        df['Valor de la Opcion (si aplica)'] = df['Valor de la Opcion (si aplica)'].fillna(0)
        df['Opcion (si aplica)'] = df['Opcion (si aplica)'].fillna('')
        df['Campo en Ficha tecnica (si aplica)'] = df['Campo en Ficha tecnica (si aplica)'].fillna('')
        df['Campo en Informacion Personal  (si aplica)'] = df['Campo en Informacion Personal  (si aplica)'].fillna('')
        df['Sección'] = df['Sección'].fillna('')

        required_columns = [
            "Pregunta", "Sección", "Tipo de Pregunta", "¿Se incluye en ficha técnica? (si/no)",
            "Campo en Ficha tecnica (si aplica)", "¿Es información personal? (si,no)",
            "Campo en Informacion Personal  (si aplica)", "Opcion (si aplica)", "Valor de la Opcion (si aplica)",
            "Pregunta que desbloquea"
        ]

        if not all(col in df.columns for col in required_columns):
            missing = [col for col in required_columns if col not in df.columns]
            raise ValueError(f"Columnas faltantes en el Excel: {', '.join(missing)}")

        # Cargar imágenes desde el archivo Excel
        workbook = load_workbook(filename=ruta_archivo)
        worksheet = workbook['Cuestionario']
        imagenes_en_excel = {}
        for image in worksheet._images:
            try:
                if hasattr(image.anchor, 'cell'):
                    cell = image.anchor.cell
                    cell_address = cell.coordinate
                else:
                    cell = image.anchor._from
                    col_letter = chr(65 + cell.col)
                    row_number = cell.row + 1
                    cell_address = f"{col_letter}{row_number}"

                img_bytes = io.BytesIO()
                image.ref.save(img_bytes, format='PNG')
                imagenes_en_excel[cell_address] = img_bytes.getvalue()
            except Exception as e:
                logger.warning(f"⚠️ No se pudo leer imagen de Excel: {e}")

        # Obtener el cuestionario
        cuestionario = Cuestionario.objects.get(id=cuestionario_id)
        preguntas_dict = {}
        opciones_dict = {}
        secciones_dict = {}
        seccion_counter = 1

        for _, row in df.iterrows():
            nombre_seccion = row['Sección']
            if nombre_seccion:
                if nombre_seccion not in secciones_dict:
                    secciones_dict[nombre_seccion] = seccion_counter
                    seccion_counter += 1
                seccion_sis = secciones_dict[nombre_seccion]
            else:
                seccion_sis = 0
                nombre_seccion = ''

            TIPOS_VALIDOS = [
                "abierta", "numero", "multiple", "checkbox", "binaria", "dropdown", "numero_telefono",
                "fecha", "fecha_hora", "meta", "sis", "sis2", "ed", "ch",
                "datos_domicilio", "datos_medicos", "contactos", "canalizacion", "canalizacion_centro",
                "imagen"
            ]

            tipo = row['Tipo de Pregunta'].strip().lower()
            if tipo not in TIPOS_VALIDOS:
                raise ValueError(f"Tipo de pregunta inválido: '{tipo}' en pregunta '{row['Pregunta']}'")

            if row['Pregunta'] not in preguntas_dict:
                # === Buscar imagen si tipo == imagen ===
                imagen_pregunta = None
                if tipo == "imagen" and "Imagen" in df.columns:
                    try:
                        col_idx = df.columns.get_loc("Imagen")
                        row_idx = df.index.get_loc(_) + 2
                        col_letter = chr(65 + col_idx)
                        cell_address = f"{col_letter}{row_idx}"
                        if cell_address in imagenes_en_excel:
                            img_content = imagenes_en_excel[cell_address]
                            imagen_pregunta = ContentFile(img_content, name=f"pregunta_img_{row_idx}.png")
                    except Exception as e:
                        logger.warning(f"⚠️ No se pudo asignar imagen para pregunta '{row['Pregunta']}': {e}")

                pregunta_actual = Pregunta(
                    cuestionario=cuestionario,
                    texto=row['Pregunta'],
                    tipo=tipo,
                    seccion_sis=seccion_sis,
                    nombre_seccion=nombre_seccion,
                    ficha_tecnica=row["¿Se incluye en ficha técnica? (si/no)"] == 'Sí',
                    actualiza_usuario=row["¿Es información personal? (si,no)"] == 'Sí',
                    campo_ficha_tecnica=row["Campo en Ficha tecnica (si aplica)"],
                    campo_datos_personales=row["Campo en Informacion Personal  (si aplica)"]
                )

                if imagen_pregunta:
                    pregunta_actual.imagen.save(f"pregunta_img_{row_idx}.png", imagen_pregunta)

                pregunta_actual.save()
                preguntas_dict[row['Pregunta']] = pregunta_actual
            else:
                pregunta_actual = preguntas_dict[row['Pregunta']]

            if row['Opcion (si aplica)']:
                opcion = Opcion(
                    pregunta=pregunta_actual,
                    texto=row['Opcion (si aplica)'],
                    valor=int(row['Valor de la Opcion (si aplica)'])
                )
                opcion.save()
                opciones_dict[(pregunta_actual.texto, row['Opcion (si aplica)'])] = opcion

        # Procesar desbloqueos
        for _, row in df.iterrows():
            if row['Pregunta que desbloquea']:
                pregunta_origen = preguntas_dict[row['Pregunta']]
                opcion_desbloqueadora = opciones_dict[(row['Pregunta'], row['Opcion (si aplica)'])]

                preguntas_desbloqueadas = row['Pregunta que desbloquea'].split(',')
                for pregunta_desbloqueada_texto in preguntas_desbloqueadas:
                    pregunta_desbloqueada_texto = pregunta_desbloqueada_texto.strip()
                    if pregunta_desbloqueada_texto in preguntas_dict:
                        pregunta_desbloqueada = preguntas_dict[pregunta_desbloqueada_texto]
                        DesbloqueoPregunta.objects.create(
                            cuestionario=cuestionario,
                            pregunta_origen=pregunta_origen,
                            opcion_desbloqueadora=opcion_desbloqueadora,
                            pregunta_desbloqueada=pregunta_desbloqueada
                        )
                        print(f"{pregunta_origen.texto} -> {opcion_desbloqueadora.texto} -> {pregunta_desbloqueada.texto}")

        return {
            'status': 'success',
            'cuestionario': cuestionario.nombre,
            'preguntas_creadas': Pregunta.objects.filter(cuestionario=cuestionario).count(),
            'opciones_creadas': Opcion.objects.filter(pregunta__cuestionario=cuestionario).count(),
            'desbloqueos_creados': DesbloqueoPregunta.objects.filter(cuestionario=cuestionario).count()
        }

    except Cuestionario.DoesNotExist:
        logger.error(f"Cuestionario con ID {cuestionario_id} no encontrado")
        return {'status': 'error', 'message': f"Cuestionario con ID {cuestionario_id} no encontrado"}

    except Exception as e:
        logger.error(f"Error al cargar el archivo Excel: {str(e)}")
        return {'status': 'error', 'message': str(e)}
    
def descargar_plantilla_cuestionario():
    """
    Función para descargar la plantilla de precarga de cuestionarios.
    Retorna un HttpResponse con el archivo Excel o un JsonResponse con error.
    """
    try:
        # Construir la ruta absoluta al archivo
        template_path = os.path.join(settings.BASE_DIR, 'cuestionarios', 'plantilla', 'Plantilla_cuestionarios_precarga.xlsx')
        
        # Verificar si el archivo existe
        if not os.path.exists(template_path):
            logger.error(f"Archivo de plantilla no encontrado en: {template_path}")
            return JsonResponse({
                'error': 'Archivo de plantilla no encontrado',
                'detalle': 'La plantilla no está disponible en el servidor'
            }, status=404)

        # Leer el archivo
        with open(template_path, 'rb') as excel_file:
            response = HttpResponse(
                excel_file.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
            # Configurar los headers para la descarga
            response['Content-Disposition'] = 'attachment; filename=Plantilla_cuestionarios_precarga.xlsx'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            return response

    except Exception as e:
        logger.error(f"Error al procesar la plantilla: {str(e)}")
        return JsonResponse({
            'error': 'Error al procesar la plantilla',
            'detalle': str(e)
        }, status=500)

def get_resumen_sis(usuario_id=None):
    """
    Obtiene el resumen de respuestas SIS agrupado por usuario y sección,
    con totales y ayudas, similar a la lógica de ResumenSISView.

    Args:
        usuario_id (int, optional): El ID del usuario para filtrar las respuestas.
                                    Si es None, se obtienen respuestas para todos los usuarios.

    Returns:
        list: Una lista de diccionarios, donde cada diccionario representa
              el resumen SIS para una sección de un usuario, incluyendo totales
              y detalles de ayudas por ítem.
    """
    filtros = {"pregunta__tipo__in": ["sis", "sis2"]}

    if usuario_id:
        filtros["usuario_id"] = usuario_id

    respuestas = Respuesta.objects.filter(**filtros).select_related('pregunta', 'usuario')

    datos_agrupados = {}

    # Pre-fetch SISAid and its related 'ayudas' to avoid N+1 queries in the loop
    # This is a crucial optimization for performance.
    sis_aids = SISAid.objects.select_related('item').prefetch_related('ayudas').in_bulk()


    for respuesta in respuestas:
        usuario = respuesta.usuario.id
        seccion = respuesta.pregunta.nombre_seccion

        try:
            # Manejar tanto objetos JSON nativos como strings JSON (para compatibilidad)
            if isinstance(respuesta.respuesta, str):
                datos_respuesta = json.loads(respuesta.respuesta)
            else:
                datos_respuesta = respuesta.respuesta
            
            frecuencia = int(datos_respuesta.get("frecuencia", 0))
            tiempo_apoyo = int(datos_respuesta.get("tiempo_apoyo", 0))
            tipo_apoyo = int(datos_respuesta.get("tipo_apoyo", 0))
            
            # Manejar subitems que pueden ser IDs simples o objetos con id y texto
            subitems_raw = datos_respuesta.get("subitems", [])
            subitems_ids = []
            for item in subitems_raw:
                if isinstance(item, dict) and 'id' in item:
                    subitems_ids.append(int(item['id']))
                elif isinstance(item, (int, str)):
                    subitems_ids.append(int(item))
        except (json.JSONDecodeError, ValueError, TypeError):
            frecuencia, tiempo_apoyo, tipo_apoyo, subitems_ids = 0, 0, 0, []

        clave = (usuario, seccion)

        if clave not in datos_agrupados:
            datos_agrupados[clave] = {
                "usuario_id": usuario,
                "nombre_seccion": seccion,
                "total_frecuencia": 0,
                "total_tiempo_apoyo": 0,
                "total_tipo_apoyo": 0,
                "total_general": 0,
                "ayudas": {},
                "items": {}
            }

        datos_agrupados[clave]["total_frecuencia"] += frecuencia
        datos_agrupados[clave]["total_tiempo_apoyo"] += tiempo_apoyo
        datos_agrupados[clave]["total_tipo_apoyo"] += tipo_apoyo
        datos_agrupados[clave]["total_general"] += (frecuencia + tiempo_apoyo + tipo_apoyo)

        # Process subitems using the pre-fetched data
        for subitem_id in subitems_ids:
            subitem = sis_aids.get(subitem_id) # Get from pre-fetched bulk
            if subitem:
                item_name = subitem.item.name
                
                # Ensure 'ayudas' structure is initialized for the item_name
                if item_name not in datos_agrupados[clave]["ayudas"]:
                    datos_agrupados[clave]["ayudas"][item_name] = [] # Changed to list of subitems under item_name

                datos_agrupados[clave]["ayudas"][item_name].append({
                    "sub_item": subitem.sub_item,
                    "sub_item_id": subitem.id,
                    "ayudas": [
                        {"id": ayuda.id, "descripcion": ayuda.descripcion}
                        for ayuda in subitem.ayudas.all()
                    ]
                })

                # Desglose por ítem
                if item_name not in datos_agrupados[clave]["items"]:
                    datos_agrupados[clave]["items"][item_name] = {
                        "item": item_name,
                        "frecuencia": 0,
                        "tiempo_apoyo": 0,
                        "tipo_apoyo": 0,
                        "total_item": 0
                    }

                datos_agrupados[clave]["items"][item_name]["frecuencia"] += frecuencia
                datos_agrupados[clave]["items"][item_name]["tiempo_apoyo"] += tiempo_apoyo
                datos_agrupados[clave]["items"][item_name]["tipo_apoyo"] += tipo_apoyo
                datos_agrupados[clave]["items"][item_name]["total_item"] += (frecuencia + tiempo_apoyo + tipo_apoyo)

    # Convertir a lista de diccionarios para la salida final
    datos_finales = list(datos_agrupados.values())

    return datos_finales


def evaluar_rango(valor, rango_str):
    """
    Evalúa si un valor numérico cae dentro de un rango especificado como cadena.
    Soporta formatos como "x-y", "<z", ">w", o un valor único "v".

    Args:
        valor (int or float): El valor numérico a evaluar.
        rango_str (str): La cadena que representa el rango (ej. "1-5", "<10", ">50", "90").

    Returns:
        bool: True si el valor está dentro del rango, False en caso contrario.
    """
    try:
        # Normaliza cualquier guión raro a guion normal
        rango_str = rango_str.replace('–', '-').replace('—', '-').replace('−', '-').strip()

        # Caso especial: menor que
        if rango_str.startswith('<'):
            return valor < float(rango_str[1:].strip())

        # Caso especial: mayor que
        if rango_str.startswith('>'):
            return valor > float(rango_str[1:].strip())

        # Caso normal: rango tipo "x-y"
        if '-' in rango_str:
            minimo, maximo = map(float, rango_str.split('-'))
            return minimo <= valor <= maximo

        # Caso puntual (valor único tipo "90")
        return valor == float(rango_str)
    except (ValueError, TypeError) as e:
        print(f"⚠️ Error al evaluar rango '{rango_str}' con valor {valor}: {e}")
        return False


def get_user_evaluation_summary(usuario_id, query_params=None):
    """
    Obtiene el resumen completo de la evaluación de un usuario,
    incluyendo puntuaciones por sección, totales y el índice de necesidades de apoyo.

    Args:
        usuario_id (int): El ID del usuario.
        query_params (dict or QueryDict, optional): Parámetros de consulta
                                                    para filtrar las puntuaciones.
                                                    Defaults to None.

    Returns:
        dict: Un diccionario con "resumen_global" y "detalles_por_seccion".
    """
    if query_params is None:
        query_params = {}

    puntuaciones_data = get_filtered_and_formatted_puntuaciones(query_params)
    datos_resumen = get_resumen_sis(usuario_id=usuario_id)

    resultados = []
    total_estandar = 0

    for seccion_usuario in datos_resumen:
        nombre_seccion = seccion_usuario["nombre_seccion"]
        seccion_total = seccion_usuario["total_general"]

        puntuaciones_seccion = [
            p for p in puntuaciones_data if p["nombre_seccion"] == nombre_seccion
        ]

        puntuaciones_match = []
        for p in puntuaciones_seccion:
            if evaluar_rango(seccion_total, p["puntuacion_directa"]):
                puntuaciones_match.append(p)

        puntuacion_seleccionada = max(puntuaciones_match, key=lambda x: x["puntuacion_estandar"], default=None)

        if puntuacion_seleccionada:
            total_estandar += puntuacion_seleccionada["puntuacion_estandar"]

        resultados.append({
            "usuario_id": usuario_id,
            "base_cuestionario": puntuacion_seleccionada["base_cuestionario"] if puntuacion_seleccionada else None,
            "nombre_seccion": nombre_seccion,
            "total_general": seccion_total,
            "puntuacion_directa": puntuacion_seleccionada["puntuacion_directa"] if puntuacion_seleccionada else None,
            "puntuacion_estandar": puntuacion_seleccionada["puntuacion_estandar"] if puntuacion_seleccionada else None,
            "percentil": puntuacion_seleccionada["percentil"] if puntuacion_seleccionada else None,
            "tiene_puntuacion": puntuacion_seleccionada is not None,
        })

    registro_indice = CalculoDeIndiceDeNecesidadesDeApoyo.objects.filter(
        total_suma_estandar=total_estandar
    ).first()

    resumen_global = {
        "usuario_id": usuario_id,
        "total_general": total_estandar,
        "indice_de_necesidades_de_apoyo": registro_indice.indice_de_necesidades_de_apoyo if registro_indice else None,
        "percentil": registro_indice.percentil if registro_indice else None
    }

    for seccion in resultados:
        seccion_detalle = next((s for s in datos_resumen if s["nombre_seccion"] == seccion["nombre_seccion"]), None)
        if seccion_detalle:
            seccion["ayudas"] = seccion_detalle.get("ayudas", {})
            seccion["items"] = seccion_detalle.get("items", {})
        else:
            seccion["ayudas"] = {}
            seccion["items"] = {}

    return {
        "resumen_global": resumen_global,
        "detalles_por_seccion": resultados
    }

def get_texto_respuesta_transformada(respuesta_obj):
    """
    Retorna el texto legible de una respuesta, extrayendo el campo 'texto' si la respuesta es un JSON.
    """
    raw = respuesta_obj.respuesta
    tipo = respuesta_obj.pregunta.tipo

    if not raw:
        return ""

    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "texto" in data:
            return data["texto"]
        elif isinstance(data, list):  # checkbox u otro tipo con múltiples opciones
            opciones = respuesta_obj.pregunta.opciones
            textos = [o["texto"] for o in opciones if o["id"] in data]
            return ", ".join(textos)
    except Exception:
        pass  # Si no es JSON o falla, sigue abajo

    # Si no es JSON o no tiene campo 'texto', devuelve tal cual
    return str(raw).strip()


def get_resumen_cuestionarios_completo(usuario_id):
    """
    Devuelve:
    - respuestas_crudas: lista de todas las respuestas para inspección general
    - entrevista: preguntas clave
    - proyecto_vida: textos, metas desanidadas y talentos agrupados
    - evaluacion_diagnostica: respuestas clave para habilidades básicas
    """
    resumen_general = {
        "respuestas_crudas": [],
        "entrevista": {
            "futuro_usuario": None,
            "futuro_hijo": None,
            "observaciones_entrevistador": None,
            "talentos_familia": None
        },
        "proyecto_vida": {
            "lo_mas_importante": None,
            "me_gusta": None,
            "metas": [],
            "talentos": {}
        },
        "evaluacion_diagnostica": {}
    }

    preguntas_entrevista = {
        "futuro_usuario": "Necesidades de apoyo según la familia",
        "futuro_hijo": "Necesidades de apoyo según el candidato",
        "observaciones_entrevistador": "Necesidades de apoyo según el entrevistador",
        "talentos_familia": "Comentarios de la familia sobre los talentos del candidato"
    }

    preguntas_texto_pv = {
        "lo_mas_importante": "Lo más importante para mi",
        "me_gusta": "Me gusta, me tranquiliza, me hace sentir bien, me divierte"
    }

    preguntas_talento = [
        "Talentos - Relaciones", "Talentos - Gustos", "Talentos - Historia",
        "Talentos - Salud", "Talentos - Seguridad", "Talentos - Emociones", "Talentos - Elecciones"
    ]

    diagnostica_mapping = {
        "Lectura": "Describe el nivel de lectura del/la candidato/a",
        "Escritura": "Describe el nivel de escritura del/la candidato/a",
        "Números": "Describe el conocimiento de números del/la candidato/a",
        "Suma": "Describe el nivel de suma del/la candidato/a",
        "Resta": "Describe el nivel de resta del/la candidato/a",
        "Manejo de Dinero": "Describe el nivel de manejo de dinero del/la candidato/a",
        "Cruzar la Calle": "Describe el nivel de cruzar la calle del/la candidato/a",
        "Transporte": "Describe el nivel de uso de transporte del/la candidato/a",
        "Comunicación": "Describe como se comunica el/la candidato/a"
    }

    respuestas = Respuesta.objects.select_related(
        "pregunta", "cuestionario", "cuestionario__base_cuestionario"
    ).filter(usuario_id=usuario_id)

    for r in respuestas:
        pregunta = r.pregunta
        texto_pregunta = pregunta.texto.strip()
        tipo_pregunta = pregunta.tipo
        texto_respuesta = get_texto_respuesta_transformada(r)

        # Acumulador general
        resumen_general["respuestas_crudas"].append({
            "cuestionario_nombre": r.cuestionario.nombre,
            "base_cuestionario": r.cuestionario.base_cuestionario.nombre if r.cuestionario.base_cuestionario else None,
            "texto_pregunta": texto_pregunta,
            "tipo_pregunta": tipo_pregunta,
            "respuesta": texto_respuesta
        })

        # ENTREVISTA
        if "entrevista" in r.cuestionario.nombre.lower():
            for key, expected in preguntas_entrevista.items():
                if texto_pregunta == expected:
                    resumen_general["entrevista"][key] = texto_respuesta

        # PROYECTO DE VIDA
        elif "pv" in r.cuestionario.nombre.lower():
            if texto_pregunta == preguntas_texto_pv.get("lo_mas_importante"):
                resumen_general["proyecto_vida"]["lo_mas_importante"] = texto_respuesta
            elif texto_pregunta == preguntas_texto_pv.get("me_gusta"):
                resumen_general["proyecto_vida"]["me_gusta"] = texto_respuesta
            elif tipo_pregunta == "meta":
                try:
                    meta_obj = json.loads(texto_respuesta)
                    if meta_obj.get("meta") and meta_obj.get("pasos"):
                        pasos = meta_obj["pasos"]
                        resumen_general["proyecto_vida"]["metas"].append({
                            "meta": meta_obj["meta"],
                            "pasos": pasos
                        })
                except Exception:
                    pass
            elif texto_pregunta in preguntas_talento:
                if texto_pregunta not in resumen_general["proyecto_vida"]["talentos"]:
                    resumen_general["proyecto_vida"]["talentos"][texto_pregunta] = []
                resumen_general["proyecto_vida"]["talentos"][texto_pregunta].append(texto_respuesta)

        # EVALUACIÓN DIAGNÓSTICA
        elif "evaluación diagnóstica" in r.cuestionario.nombre.lower():
            for key, label in diagnostica_mapping.items():
                if texto_pregunta == label:
                    resumen_general["evaluacion_diagnostica"][key] = texto_respuesta
                    print(f"texto_respuesta: {texto_respuesta}")
    

    return resumen_general