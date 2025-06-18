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
            datos_respuesta = json.loads(respuesta.respuesta)
            frecuencia = int(datos_respuesta.get("frecuencia", 0))
            tiempo_apoyo = int(datos_respuesta.get("tiempo_apoyo", 0))
            tipo_apoyo = int(datos_respuesta.get("tipo_apoyo", 0))
            subitems_ids = [int(sid) for sid in datos_respuesta.get("subitems", []) if sid is not None]
        except (json.JSONDecodeError, ValueError):
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

def get_resumen_entrevista(usuario_id):
    """
    Extrae las tres preguntas clave del cuestionario ENTREVISTA para la ficha técnica - NECESIDAD DE APOYOS.

    Args:
        usuario_id (int): ID del usuario.

    Returns:
        dict: Diccionario con las respuestas a las preguntas clave.
    """

    preguntas_clave = {
        "futuro_usuario": "¿Cómo te ves en tu futuro? ¿Qué metas te gustaría cumplir?",
        "futuro_hijo": "¿A futuro cómo le gustaría ver a su hijo/hija?",
        "observaciones_entrevistador": "Observaciones del entrevistador (Observaciones conductuales, de dinámica familiar, necesidades de apoyo, entre otras)"
    }

    # Acepta cualquier variante del nombre "ENTREVISTA"
    cuestionarios_entrevista = Cuestionario.objects.filter(nombre__icontains="entrevista")

    if not cuestionarios_entrevista.exists():
        return {k: None for k in preguntas_clave.keys()}

    entrevista_ids = cuestionarios_entrevista.values_list('id', flat=True)

    respuestas = Respuesta.objects.filter(
        usuario_id=usuario_id,
        pregunta__texto__in=preguntas_clave.values(),
        pregunta__cuestionario_id__in=entrevista_ids
    ).select_related('pregunta')

    resultado = {k: None for k in preguntas_clave.keys()}

    for r in respuestas:
        texto = r.pregunta.texto.strip()
        for key, expected in preguntas_clave.items():
            if texto == expected:
                resultado[key] = r.respuesta.strip() if r.respuesta else None

    return resultado


def get_resumen_proyecto_vida(usuario_id):
    """
    Extrae respuestas clave del cuestionario Proyecto de Vida:
    - Dos preguntas textuales.
    - Todas las metas desanidadas (tipo "meta").
    - Talentos agrupados por sección (tipo "abierta").
    """
    preguntas_texto = {
        "lo_mas_importante": "Lo más importante para mi",
        "me_gusta": "Me gusta, me tranquiliza, me hace sentir bien, me divierte"
    }

    resumen = {
        "lo_mas_importante": None,
        "me_gusta": None,
        "metas": [],
        "talentos": {}  # agrupados por nombre_seccion
    }

    # Encuentra cuestionarios que contienen "proyecto de vida"
    cuestionarios_pv = Cuestionario.objects.filter(nombre__icontains="proyecto de vida")
    if not cuestionarios_pv.exists():
        return resumen

    cuestionario_ids = cuestionarios_pv.values_list("id", flat=True)

    respuestas = Respuesta.objects.filter(
        usuario_id=usuario_id,
        pregunta__cuestionario_id__in=cuestionario_ids
    ).select_related("pregunta")

    for r in respuestas:
        pregunta = r.pregunta
        texto_pregunta = pregunta.texto.strip()
        tipo_pregunta = pregunta.tipo
        seccion = pregunta.nombre_seccion or "Sin sección"

        # Parte 1: Preguntas clave textuales
        if texto_pregunta == preguntas_texto["lo_mas_importante"]:
            resumen["lo_mas_importante"] = r.respuesta.strip() if r.respuesta else ""
        elif texto_pregunta == preguntas_texto["me_gusta"]:
            resumen["me_gusta"] = r.respuesta.strip() if r.respuesta else ""

        # Parte 2: Preguntas tipo "meta" con JSON
        elif tipo_pregunta == "meta":
            try:
                metas_json = json.loads(r.respuesta)
                meta_texto = metas_json.get("meta", "").strip()
                pasos = metas_json.get("pasos", [])
                encargado = metas_json.get("encargado", "").strip()

                pasos_list = [p.get("paso", "").strip() for p in pasos if isinstance(p, dict)]

                resumen["metas"].append({
                    "meta": meta_texto,
                    "pasos": pasos_list,
                    "encargado": encargado
                })
            except Exception:
                continue

        # Parte 3: Talentos = todas las preguntas tipo "abierta" excepto las clave
        elif tipo_pregunta == "abierta" and texto_pregunta not in preguntas_texto.values():
            if seccion not in resumen["talentos"]:
                resumen["talentos"][seccion] = []
            if r.respuesta and r.respuesta.strip():
                resumen["talentos"][seccion].append(r.respuesta.strip())

    return resumen