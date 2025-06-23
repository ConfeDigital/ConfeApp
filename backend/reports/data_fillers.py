# data_fillers.py
import json
import requests
from collections import defaultdict
from copy import deepcopy
from django.core.files.storage import default_storage
from cuestionarios.models import Cuestionario, Respuesta, Pregunta, Opcion
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from cuestionarios.utils import get_user_evaluation_summary

def get_pv_answers(profile):
    """Retrieves Proyecto de Vida answers."""
    pv_cuestionario = Cuestionario.objects.filter(nombre__iexact="Proyecto de Vida", activo=True).first()
    if not pv_cuestionario:
        return {}
    preguntas = Pregunta.objects.filter(cuestionario=pv_cuestionario)
    respuestas = Respuesta.objects.filter(usuario=profile.user, pregunta__in=preguntas).select_related("pregunta")
    answers = {}
    for r in respuestas:
        if r.pregunta.texto.lower().startswith("pasos para"):
            answers[r.pregunta.texto.strip()] = "N/A"
        else:
            answers[r.pregunta.texto.strip()] = r.respuesta.strip() if r.respuesta else "No especificado"
    return answers

def map_answers_to_template(answers_dict):
    mapped_data = {
        "title_page": {
            "name": answers_dict.get("Nombre Completo", "N/A"),
            "date": answers_dict.get("Fecha", "N/A"),
        },
        "support_group": {
            "group": answers_dict.get("Mi grupo de apoyo", "N/A"),
        },
        "talents": {
            "personal": answers_dict.get("Mis talentos personales", "N/A"),
            "support_group": answers_dict.get("Talentos de mi grupo de apoyo", "N/A"),
        },
        "preferences": {
            "important_for_me": answers_dict.get("Lo más importante para mí", "N/A"),
            "likes_dislikes": answers_dict.get("Cosas sobre mí", "N/A"),
        },
        "support_needs": {
            "needs": answers_dict.get("Apoyos que necesito", "N/A"),
        },
        "goals": {
            "goal_1": answers_dict.get("Meta 1", "N/A"),
            "goal_2": answers_dict.get("Meta 2", "N/A"),
            "goal_3": answers_dict.get("Meta 3", "N/A"),
            "steps_1": answers_dict.get("Pasos para alcanzar Meta 1", "N/A"),
            "steps_2": answers_dict.get("Pasos para alcanzar Meta 2", "N/A"),
            "steps_3": answers_dict.get("Pasos para alcanzar Meta 3", "N/A"),
        }
    }
    return mapped_data

def build_proyecto_vida_table(profile):
    from collections import defaultdict
    try:
        pv_cuestionario = Cuestionario.objects.get(nombre__iexact="Proyecto de Vida", activo=True)
        preguntas = Pregunta.objects.filter(cuestionario=pv_cuestionario)
        respuestas = Respuesta.objects.filter(usuario=profile.user, pregunta__in=preguntas).select_related("pregunta")
        if not respuestas.exists():
            return []
        preguntas_textuales = {
            "Grandes cosas sobre mi": None,
            "Lo más importante para mi": None,
            "Meta 1": None,
            "Meta 2": None,
            "Meta 3": None
        }
        talentos_por_seccion = defaultdict(list)
        for r in respuestas:
            texto = r.pregunta.texto.strip()
            section = r.pregunta.nombre_seccion.strip() or "Sin sección"
            resp = r.respuesta.strip()
            if texto in preguntas_textuales:
                preguntas_textuales[texto] = resp
            elif "talento" in texto.lower():
                talentos_por_seccion[section].append(resp)
        table = []
        for key, val in preguntas_textuales.items():
            if val and val.strip().startswith("{"):
                try:
                    meta_data = json.loads(val)
                    table.append([key, meta_data.get("meta", "(sin meta)")])
                    for paso in meta_data.get("pasos", []):
                        descripcion = paso.get("descripcion", "")
                        encargado = paso.get("encargado", "")
                        table.append(["→ Paso:", f"{descripcion} (Encargado: {encargado})"])
                    table.append(["", ""])
                except Exception as e:
                    table.append([key, val])
            else:
                table.append([key, val or "No respondido"])
        table.append(["", ""])
        for section, talentos in talentos_por_seccion.items():
            table.append([f"Talentos en {section}", ", ".join(talentos) if talentos else "No especificado"])
            table.append(["", ""])
        return table
    except Cuestionario.DoesNotExist:
        return []


def build_tabla_proteccion_defensa(profile):
    tabla = [["Actividad", "Puntaje Directo"]]

    try:
        uid = profile.user.id
        
        evaluation_summary = get_user_evaluation_summary(usuario_id=uid, query_params={})

        secciones = evaluation_summary.get("detalles_por_seccion", [])

        for seccion in secciones:
            nombre = seccion.get("nombre_seccion", "").strip().lower()
            if nombre != "actividades de protección y defensa":
                continue

            items = seccion.get("items", {}) # items is a dictionary, not a list
            
            # Convert dictionary values to a list for sorting
            items_list = list(items.values()) 
            items_ordenados = sorted(items_list, key=lambda i: i.get("total_item", 0), reverse=True)

            for item in items_ordenados:
                actividad = item.get("item", "").strip()
                puntaje = item.get("total_item", 0)
                tabla.append([actividad, str(puntaje)])

            break  # only process one section

    except Exception as e:
        print(f"⚠️ Error procesando Protección y Defensa: {e}")

    return tabla



def build_tabla_salud_necesidades_conductuales(profile):
    from collections import defaultdict
    respuestas = Respuesta.objects.filter(
        usuario=profile.user,
        pregunta__tipo__in=["sis", "sis2"]
    ).select_related("pregunta")
    def get_totales_por_seccion(nombre_seccion):
        items = defaultdict(lambda: {"frecuencia": 0, "tiempo_apoyo": 0, "tipo_apoyo": 0})
        for r in respuestas:
            if r.pregunta.nombre_seccion.strip().lower() != nombre_seccion.lower():
                continue
            try:
                datos = json.loads(r.respuesta)
                items[r.pregunta.texto]["frecuencia"] += int(datos.get("frecuencia", 0))
                items[r.pregunta.texto]["tiempo_apoyo"] += int(datos.get("tiempo_apoyo", 0))
                items[r.pregunta.texto]["tipo_apoyo"] += int(datos.get("tipo_apoyo", 0))
            except Exception as e:
                continue
        return list(items.values())
    def resumen_totales(item_list):
        total = sum(i["frecuencia"] + i["tiempo_apoyo"] + i["tipo_apoyo"] for i in item_list)
        hay_2 = any(i["frecuencia"] == 2 or i["tiempo_apoyo"] == 2 or i["tipo_apoyo"] == 2 for i in item_list)
        return total, hay_2
    med_items = get_totales_por_seccion("Necesidades de Apoyo Médicas")
    total_med, hay_2_med = resumen_totales(med_items)
    con_items = get_totales_por_seccion("Necesidades de Apoyo Conductuales")
    total_con, hay_2_con = resumen_totales(con_items)
    tabla = [
        ["Pregunta", "Respuesta"],
        ["Introduzca la puntuación total de la sección 3a", str(total_med)],
        ["¿Es la puntuación total mayor a 5?", "SÍ" if total_med > 5 else "NO"],
        ["¿Hay al menos un '2' para necesidades médicas?", "SÍ" if hay_2_med else "NO"],
        ["Introduzca la puntuación total de la sección 3b", str(total_con)],
        ["¿Es la puntuación mayor que 5?", "SÍ" if total_con > 5 else "NO"],
        ["¿Hay al menos un '2' para necesidades conductuales?", "SÍ" if hay_2_con else "NO"]
    ]
    return tabla

def fill_table_data(profile, TABLE_TEMPLATES):
    from copy import deepcopy
    tables = deepcopy(TABLE_TEMPLATES)
    
    # Obtener datos desde la API en lugar de la base de datos
    try:
        # Hacer GET request al endpoint de reportes
        response = requests.get(
            f'http://127.0.0.1:8000/api/cuestionarios/kiki/reportes/',
            params={'usuario_id': profile.user.id}
        )
        response.raise_for_status()
        api_data = response.json()
        
        print("🔍 DATOS OBTENIDOS DESDE LA API:")
        print("=" * 50)
        for item in api_data:
            print(f"Cuestionario: {item.get('cuestionario_nombre', 'N/A')}")
            print(f"Pregunta: {item.get('texto_pregunta', 'N/A')}")
            print(f"Respuesta: {item.get('respuesta', 'N/A')}")
            print("-" * 30)
        print("=" * 50)
        
        # Crear diccionario de respuestas desde la API
        respuestas_dict = {}
        for item in api_data:
            if item.get('cuestionario_nombre', '').lower() == 'evaluación diagnóstica':
                respuesta_raw = item.get('respuesta', '')
                # Manejar diferentes formatos de respuesta
                if isinstance(respuesta_raw, dict):
                    # Si es un diccionario, extraer el valor original (número)
                    respuesta_text = respuesta_raw.get('texto', str(respuesta_raw))
                    valor_original = respuesta_raw.get('valor_original', '')
                    print(f"🔍 Procesando respuesta: {item.get('texto_pregunta', '')}")
                    print(f"   Respuesta raw: {respuesta_raw}")
                    print(f"   Texto extraído: {respuesta_text}")
                    print(f"   Valor original: {valor_original}")
                    # Usar el valor original (número) en lugar del texto
                    respuestas_dict[item.get('texto_pregunta', '').strip()] = respuesta_text
                elif isinstance(respuesta_raw, str):
                    # Si es string, intentar parsear como JSON
                    try:
                        import json
                        parsed = json.loads(respuesta_raw)
                        respuesta_text = parsed.get('texto', respuesta_raw)
                    except:
                        respuesta_text = respuesta_raw
                else:
                    respuesta_text = str(respuesta_raw)
                
                respuestas_dict[item.get('texto_pregunta', '').strip()] = respuesta_text
        
    except Exception as e:
        print(f"❌ Error obteniendo datos desde API: {e}")
        # Fallback a consulta directa de base de datos
        respuestas = Respuesta.objects.filter(usuario=profile.user)
        respuestas_dict = {r.pregunta.texto.strip(): r.respuesta for r in respuestas}
    
    preguntas_map = {}
    preguntas = Pregunta.objects.filter(cuestionario__nombre__iexact="Evaluación Diagnóstica").prefetch_related("opciones")
    for pregunta in preguntas:
        opciones_list = sorted(pregunta.opciones.all(), key=lambda x: x.id)
        opciones_dict = {str(i): opcion.texto for i, opcion in enumerate(opciones_list)}
        preguntas_map[pregunta.texto] = opciones_dict
    from .data_fillers import build_tabla_salud_necesidades_conductuales, build_proyecto_vida_table
    tables["Necesidades Médicas y Conductuales"] = build_tabla_salud_necesidades_conductuales(profile)
    tabla_pd = [["Actividad", "Puntaje Directo"]]
    items_con_puntaje = {}
    respuestas_sis = Respuesta.objects.filter(
        usuario=profile.user,
        pregunta__nombre_seccion="Actividades de protección y defensa",
        pregunta__tipo__in=["sis", "sis2"]
    ).select_related("pregunta")
    for r in respuestas_sis:
        item_name = r.pregunta.texto.strip()
        try:
            datos = json.loads(r.respuesta)
            frecuencia = int(datos.get("frecuencia", 0))
            tiempo_apoyo = int(datos.get("tiempo_apoyo", 0))
            tipo_apoyo = int(datos.get("tipo_apoyo", 0))
            total = frecuencia + tiempo_apoyo + tipo_apoyo
            if item_name in items_con_puntaje:
                items_con_puntaje[item_name] += total
            else:
                items_con_puntaje[item_name] = total
        except Exception as e:
            continue
    top_3 = sorted(items_con_puntaje.items(), key=lambda x: x[1], reverse=True)[:3]
    top_items = {item for item, _ in top_3}
    for item, score in sorted(items_con_puntaje.items(), key=lambda x: x[1], reverse=True):
        if item in top_items:
            tabla_pd.append([f"<b>{item}</b>", f"<b>{score}</b>"])
        else:
            tabla_pd.append([item, score])
    tables["Protección y Defensa"] = tabla_pd
    if "Evaluación Diagnóstica" in tables:
        diagnostica_mapping = {
            "Lectura": "Describe el nivel de lectura del/la candidato/a",
            "Escritura": "Describe el nivel de escritura del/la candidato/a",
            "Números": "Describe el conocimiento de números del/la candidato/a",
            "Suma": "Describe el nivel de suma del/la candidato/a",
            "Resta": "Describe el nivel de resta del/la candidato/a",
            "Manejo de Dinero": "Describe el nivel de manejo de dinero del/la candidato/a",
            "Cruzar la Calle": "Describe el nivel de cruzar la calle del/la candidato/a",
            "Transporte": "Describe el nivel de uso de transporte del/la candidato/a",
            "Comunicación": "Describe como se comunica el/la candidato/a",
        }

        for i in range(1, len(tables["Evaluación Diagnóstica"])):
            row_label = tables["Evaluación Diagnóstica"][i][0]
            question_text = diagnostica_mapping.get(row_label)
            if not question_text:
                continue

            raw_respuesta = respuestas_dict.get(question_text, "")
            # Asegurar que raw_respuesta sea string antes de hacer strip
            if isinstance(raw_respuesta, str):
                raw_respuesta = raw_respuesta.strip()
            else:
                raw_respuesta = str(raw_respuesta)
            
            opciones_dict = preguntas_map.get(question_text, {})

            # Debug: Mostrar el mapping de opciones
            print(f"🔍 Procesando fila: {row_label}")
            print(f"   Pregunta buscada: {question_text}")
            print(f"   Respuesta raw: {raw_respuesta}")
            print(f"   Opciones disponibles: {opciones_dict}")
            
            if not opciones_dict:
                respuesta_text = raw_respuesta or "No especificado"
                print(f"   No hay opciones, usando respuesta directa: {respuesta_text}")
            elif question_text == "Describir el nivel de sumar y restar":
                try:
                    import json
                    id_list = json.loads(raw_respuesta) if raw_respuesta else []
                    selected_texts = [opciones_dict.get(str(i), f"ID {i}") for i in id_list]
                    respuesta_text = ", ".join(selected_texts) if selected_texts else "No especificado"
                    print(f"   Pregunta especial (suma/resta), respuesta: {respuesta_text}")
                except Exception:
                    respuesta_text = "No especificado"
                    print(f"   Error procesando suma/resta: {respuesta_text}")
            else:
                # Preguntas de opción única
                respuesta_text = opciones_dict.get(raw_respuesta, raw_respuesta or "No especificado")
                print(f"   Usando mapping de opciones, respuesta final: {respuesta_text}")

            print(f"   Asignando a tabla[{i}][1] = {respuesta_text}")
            print("-" * 30)

            tables["Evaluación Diagnóstica"][i][1] = respuesta_text

    # Debug: Mostrar la tabla final completa
    print("📋 TABLA EVALUACIÓN DIAGNÓSTICA FINAL:")
    print("=" * 50)
    for i, row in enumerate(tables["Evaluación Diagnóstica"]):
        print(f"Row {i}: {row}")
    print("=" * 50)

    pv_table = build_proyecto_vida_table(profile)
    tables["Proyecto de Vida"] = pv_table if pv_table else [["📘 Proyecto de Vida", "No hay respuestas registradas."]]

    # Reemplazamos o añadimos "Protección y Defensa" desde el API dinámicamente
    tables["Protección y Defensa"] = build_tabla_proteccion_defensa(profile)
    return tables