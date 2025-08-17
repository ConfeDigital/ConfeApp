# data_fillers.py
import json
from collections import defaultdict
from copy import deepcopy
from django.core.files.storage import default_storage
from cuestionarios.models import Cuestionario, Respuesta, Pregunta, Opcion
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from cuestionarios.utils import get_user_evaluation_summary
from django.db.models import Q

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
        
            if isinstance(r.respuesta, dict):
                resp = r.respuesta.get("texto", "")
            elif isinstance(r.respuesta, str):
                resp = r.respuesta.strip()
            else:
                resp = str(r.respuesta).strip()
        
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
    
    # Obtener respuestas procesadas directamente de la base de datos
    try:
        print("🔍 OBTENIENDO RESPUESTAS PROCESADAS DESDE LA BD:")
        print("=" * 50)
        
        # Obtener respuestas del cuestionario "Evaluación Diagnóstica" con búsqueda flexible
        diagnostica_cuestionario = None
        
        # Intentar diferentes variaciones del nombre
        posibles_nombres = [
            "Evaluación Diagnóstica",
            "evaluacion diagnostica", 
            "Evaluacion Diagnostica",
            "evaluación diagnóstica",
            "EVALUACIÓN DIAGNÓSTICA",
            "EVALUACION DIAGNOSTICA"
        ]
        
        for nombre in posibles_nombres:
            diagnostica_cuestionario = Cuestionario.objects.filter(
                nombre__iexact=nombre, 
                activo=True
            ).first()
            if diagnostica_cuestionario:
                print(f"✅ Cuestionario encontrado: '{diagnostica_cuestionario.nombre}'")
                break
        
        # Si no se encuentra con nombres exactos, buscar con contains usando Q objects
        if not diagnostica_cuestionario:
            diagnostica_cuestionario = Cuestionario.objects.filter(
                Q(nombre__icontains="evaluacion") & Q(nombre__icontains="diagnostica"),
                activo=True
            ).first()
            if diagnostica_cuestionario:
                print(f"✅ Cuestionario encontrado con búsqueda parcial: '{diagnostica_cuestionario.nombre}'")
        
        # Si aún no se encuentra, buscar cualquier cuestionario que contenga "diagnostica"
        if not diagnostica_cuestionario:
            diagnostica_cuestionario = Cuestionario.objects.filter(
                nombre__icontains="diagnostica",
                activo=True
            ).first()
            if diagnostica_cuestionario:
                print(f"✅ Cuestionario encontrado con búsqueda por 'diagnostica': '{diagnostica_cuestionario.nombre}'")
        
        if not diagnostica_cuestionario:
            print("❌ No se encontró ningún cuestionario de evaluación diagnóstica")
            print("📋 Cuestionarios disponibles:")
            todos_cuestionarios = Cuestionario.objects.filter(activo=True)
            for c in todos_cuestionarios:
                print(f"   - {c.nombre}")
            return tables
        
        respuestas = Respuesta.objects.filter(
            usuario=profile.user,
            cuestionario=diagnostica_cuestionario
        ).select_related('pregunta')
        
        print(f"📊 Encontradas {respuestas.count()} respuestas para el cuestionario")
        
        # Crear diccionario de respuestas procesadas
        respuestas_dict = {}
        for respuesta in respuestas:
            pregunta_texto = respuesta.pregunta.texto.strip()
            respuesta_raw = respuesta.respuesta
            
            print(f"📝 Procesando: {pregunta_texto}")
            print(f"   Respuesta raw: {respuesta_raw}")
            
            # Procesar la respuesta según el formato
            if isinstance(respuesta_raw, str):
                try:
                    # Intentar parsear como JSON
                    parsed = json.loads(respuesta_raw)
                    if isinstance(parsed, dict) and 'texto' in parsed:
                        # Es una respuesta procesada
                        respuesta_text = parsed['texto']
                        print(f"   ✅ Respuesta procesada encontrada: {respuesta_text}")
                    else:
                        # Es una respuesta simple
                        respuesta_text = str(parsed)
                        print(f"   📄 Respuesta simple: {respuesta_text}")
                except json.JSONDecodeError:
                    # No es JSON, usar como string
                    respuesta_text = respuesta_raw
                    print(f"   📄 Respuesta string: {respuesta_text}")
            elif isinstance(respuesta_raw, dict):
                # Es un diccionario (respuesta procesada)
                respuesta_text = respuesta_raw.get('texto', str(respuesta_raw))
                print(f"   ✅ Respuesta procesada (dict): {respuesta_text}")
            else:
                # Otro tipo de dato
                respuesta_text = str(respuesta_raw)
                print(f"   📄 Respuesta otro tipo: {respuesta_text}")
            
            respuestas_dict[pregunta_texto] = respuesta_text
            print("-" * 30)
        
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error obteniendo respuestas procesadas: {e}")
        respuestas_dict = {}
    
    # Mapeo de preguntas para la tabla de Evaluación Diagnóstica
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

    # Llenar la tabla de Evaluación Diagnóstica
    if "Evaluación Diagnóstica" in tables:
        print("📋 LLENANDO TABLA EVALUACIÓN DIAGNÓSTICA:")
        print("=" * 50)
        
        for i in range(1, len(tables["Evaluación Diagnóstica"])):
            row_label = tables["Evaluación Diagnóstica"][i][0]
            question_text = diagnostica_mapping.get(row_label)
            
            if not question_text:
                continue

            # Obtener la respuesta procesada
            respuesta_text = respuestas_dict.get(question_text, "No especificado")
            
            print(f"🔍 Fila: {row_label}")
            print(f"   Pregunta: {question_text}")
            print(f"   Respuesta: {respuesta_text}")
            
            # Asignar la respuesta a la tabla
            tables["Evaluación Diagnóstica"][i][1] = respuesta_text
            print(f"   ✅ Asignado: {respuesta_text}")
            print("-" * 30)
        
        print("=" * 50)
        
        # Mostrar tabla final
        print("📋 TABLA EVALUACIÓN DIAGNÓSTICA FINAL:")
        print("=" * 50)
        for i, row in enumerate(tables["Evaluación Diagnóstica"]):
            print(f"Row {i}: {row}")
        print("=" * 50)

    # Construir otras tablas
    from .data_fillers import build_tabla_salud_necesidades_conductuales, build_proyecto_vida_table
    
    tables["Necesidades Médicas y Conductuales"] = build_tabla_salud_necesidades_conductuales(profile)
    
    # Tabla de Protección y Defensa
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

    # Tabla de Proyecto de Vida
    pv_table = build_proyecto_vida_table(profile)
    tables["Proyecto de Vida"] = pv_table if pv_table else [["📘 Proyecto de Vida", "No hay respuestas registradas."]]

    return tables