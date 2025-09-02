from cuestionarios.models import Pregunta, Opcion, DesbloqueoPregunta, Cuestionario, ImagenOpcion
import json

def guardar_cuestionario_desde_json(preguntas, cuestionario_id):
    """
    Crea un cuestionario desde un JSON de preguntas y guarda en la base de datos.
    """
    print(json.dumps(preguntas, indent=2, ensure_ascii=False))

    try:
        cuestionario = Cuestionario.objects.get(id=cuestionario_id)
    except Cuestionario.DoesNotExist:
        return {"status": "error", "message": f"Cuestionario con ID {cuestionario_id} no encontrado"}

    preguntas_dict = {}
    opciones_dict = {}

    # Primero: crear todas las preguntas y opciones
    for pregunta in preguntas:
        texto = pregunta["texto"]
        seccion = pregunta.get("seccion", "")
        tipo = pregunta.get("tipo", "abierta")

        # Handle profile field attributes
        profile_field_path = pregunta.get("profile_field_path")
        profile_field_config = pregunta.get("profile_field_config")
        
        pregunta_obj = Pregunta.objects.create(
            cuestionario=cuestionario,
            texto=texto,
            tipo=tipo,
            nombre_seccion=seccion,
            seccion_sis=1,  # o asignar dinámicamente si se requiere
            ficha_tecnica=False,
            actualiza_usuario=False,
            campo_ficha_tecnica="",
            campo_datos_personales="",
            profile_field_path=profile_field_path,
            profile_field_config=profile_field_config
        )

        preguntas_dict[texto] = pregunta_obj

        # Manejar opciones según el tipo de pregunta
        # Skip creating Opcion objects for profile field questions - they store choices in config
        if not tipo.startswith("profile_field"):
            opciones = pregunta.get("opciones", [])
            for i, opcion in enumerate(opciones):
                # Determinar el valor de la opción
                if tipo == "multiple" and len(opciones) == 2 and "Sí" in opciones and "No" in opciones:
                    # Es una pregunta binaria convertida a multiple
                    valor = 0 if opcion == "Sí" else 1
                    opcion_texto = opcion
                elif isinstance(opcion, dict):
                    # Si la opción es un objeto, usar su valor
                    valor = opcion.get("valor", i)
                    opcion_texto = opcion.get("texto", str(opcion))
                else:
                    # Para otros tipos, usar el índice
                    valor = i
                    opcion_texto = str(opcion)  # Asegurar que sea string
                
                opcion_obj = Opcion.objects.create(
                    pregunta=pregunta_obj,
                    texto=opcion_texto,
                    valor=valor
                )
                opciones_dict[(texto, opcion_texto)] = opcion_obj

    # Segundo: crear desbloqueos
    for idx, pregunta in enumerate(preguntas):
        desbloqueos = pregunta.get("desbloqueo", [])
        for desbloq in desbloqueos:
            origen_idx = desbloq.get("origenIndex", 0)
            opcion_idx = desbloq.get("opcionIndex", 0)
            valor = desbloq.get("valor", "")
            pregunta_origen_texto = preguntas[origen_idx]["texto"]
            pregunta_desbloqueada = preguntas_dict[pregunta["texto"]]

            try:
                pregunta_origen = preguntas_dict[pregunta_origen_texto]
                
                # Buscar la opción correcta
                opcion_desbloqueadora = None
                for opcion_key, opcion_obj in opciones_dict.items():
                    if opcion_key[0] == pregunta_origen_texto and opcion_key[1] == valor:
                        opcion_desbloqueadora = opcion_obj
                        break
                
                if opcion_desbloqueadora:
                    DesbloqueoPregunta.objects.create(
                        cuestionario=cuestionario,
                        pregunta_origen=pregunta_origen,
                        opcion_desbloqueadora=opcion_desbloqueadora,
                        pregunta_desbloqueada=pregunta_desbloqueada
                    )
                else:
                    print(f"⚠️ No se encontró la opción desbloqueadora: {pregunta_origen_texto} / {valor}")
            except KeyError:
                print(f"⚠️ No se encontró la pregunta origen: {pregunta_origen_texto}")
                continue

    return {
        "status": "success",
        "cuestionario": cuestionario.nombre,
        "preguntas_creadas": len(preguntas_dict),
        "opciones_creadas": len(opciones_dict),
        "desbloqueos_creados": DesbloqueoPregunta.objects.filter(cuestionario=cuestionario).count()
    }