from cuestionarios.models import Pregunta, Opcion, DesbloqueoPregunta, Cuestionario
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

        pregunta_obj = Pregunta.objects.create(
            cuestionario=cuestionario,
            texto=texto,
            tipo=tipo,
            nombre_seccion=seccion,
            seccion_sis=1,  # o asignar dinámicamente si se requiere
            ficha_tecnica=False,
            actualiza_usuario=False,
            campo_ficha_tecnica="",
            campo_datos_personales=""
        )

        preguntas_dict[texto] = pregunta_obj

        for opcion_texto in pregunta.get("opciones", []):
            opcion_obj = Opcion.objects.create(
                pregunta=pregunta_obj,
                texto=opcion_texto,
                valor=0
            )
            opciones_dict[(texto, opcion_texto)] = opcion_obj

    # Segundo: crear desbloqueos
    for idx, pregunta in enumerate(preguntas):
        desbloqueos = pregunta.get("desbloqueo", [])
        for desbloq in desbloqueos:
            origen_idx = desbloq["pregunta_id"]
            opcion = desbloq["opcion"]
            pregunta_origen_texto = preguntas[origen_idx]["texto"]
            pregunta_desbloqueada = preguntas_dict[pregunta["texto"]]

            try:
                pregunta_origen = preguntas_dict[pregunta_origen_texto]
                opcion_desbloqueadora = opciones_dict[(pregunta_origen_texto, opcion)]

                DesbloqueoPregunta.objects.create(
                    cuestionario=cuestionario,
                    pregunta_origen=pregunta_origen,
                    opcion_desbloqueadora=opcion_desbloqueadora,
                    pregunta_desbloqueada=pregunta_desbloqueada
                )
            except KeyError:
                print(f"⚠️ No se encontró la opción desbloqueadora: {pregunta_origen_texto} / {opcion}")
                continue

    return {
        "status": "success",
        "cuestionario": cuestionario.nombre,
        "preguntas_creadas": len(preguntas_dict),
        "opciones_creadas": len(opciones_dict),
        "desbloqueos_creados": DesbloqueoPregunta.objects.filter(cuestionario=cuestionario).count()
    }