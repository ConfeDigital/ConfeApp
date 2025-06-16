import pandas as pd
from io import BytesIO

def procesar_archivo_precarga(file, tipo_cuestionario, tipos_permitidos):
    try:
        df = pd.read_excel(BytesIO(file.read()))
    except Exception:
        raise ValueError("No se pudo leer el archivo. Asegúrate de que sea un Excel válido.")

    columnas_esperadas = [
        "Número de pregunta",
        "Pregunta",
        "Sección",
        "Tipo",
        "Opciones (si aplica)",
        "Pregunta que la desbloquea",
        "Opción que la desbloquea",
    ]
    for col in columnas_esperadas:
        if col not in df.columns:
            raise ValueError(f"Falta la columna obligatoria: {col}")

    errores = []

    # Validación de número de pregunta único
    if df["Número de pregunta"].duplicated().any():
        errores.append("Hay números de pregunta repetidos.")

    # Validación de texto de pregunta duplicado
    if df["Pregunta"].duplicated().any():
        errores.append("Hay preguntas con texto duplicado.")

    if df['Pregunta'].isnull().any():
        errores.append("Hay preguntas sin vacías.")


    preguntas_dict = {}
    for i, row in df.iterrows():
        numero = row["Número de pregunta"]
        texto = str(row["Pregunta"]).strip()
        seccion = str(row["Sección"]).strip() if pd.notna(row["Sección"]) else "General"
        tipo = str(row["Tipo"]).strip().lower()

        if tipo not in tipos_permitidos:
            errores.append(
                f"Fila {i + 2}: El tipo '{tipo}' no está permitido para el cuestionario '{tipo_cuestionario}'. "
                f"Tipos permitidos: {', '.join(tipos_permitidos)}"
            )

        opciones = []
        if pd.notna(row["Opciones (si aplica)"]):
            opciones = [o.strip() for o in str(row["Opciones (si aplica)"]).split(";")]

        preguntas_dict[numero] = {
            "texto": texto,
            "seccion": seccion,
            "tipo": tipo,
            "opciones": opciones,
        }

    preguntas = []
    for i, row in df.iterrows():
        numero = row["Número de pregunta"]
        texto = str(row["Pregunta"]).strip()
        seccion = str(row["Sección"]).strip() if pd.notna(row["Sección"]) else "General"
        tipo = str(row["Tipo"]).strip().lower()

        opciones = []
        if pd.notna(row["Opciones (si aplica)"]):
            opciones = [o.strip() for o in str(row["Opciones (si aplica)"]).split(";")]

        desbloqueo = []
        if pd.notna(row["Pregunta que la desbloquea"]):
            desbloq_num = int(row["Pregunta que la desbloquea"])
            if desbloq_num not in preguntas_dict:
                errores.append(f"Fila {i + 2}: La pregunta de desbloqueo N°{desbloq_num} no existe.")
            else:
                desbloq_opciones = preguntas_dict[desbloq_num]["opciones"]
                opcion = str(row["Opción que la desbloquea"]).strip() if pd.notna(row["Opción que la desbloquea"]) else ""
                if opcion and opcion not in desbloq_opciones:
                    # Permitir "Sí"/"No" si la pregunta desbloqueante es tipo binaria
                    desbloq_tipo = preguntas_dict[desbloq_num]["tipo"]
                    if desbloq_tipo == "binaria" and opcion.lower() in ["sí", "si", "no"]:
                        pass  # permitido
                    else:
                        errores.append(
                            f"Fila {i + 2}: La opcion '{opcion}' no está en las opciones de la pregunta desbloqueante N°{desbloq_num}."
                        )
                desbloqueo.append({
                    "pregunta_id": desbloq_num - 1,
                    "opcion": opcion,
                    # ++"descripcion": "",  # se actualizará luego en frontend
                })

        pregunta = {
            "texto": texto,
            "seccion": seccion,
            "tipo": tipo,
            "opciones": opciones,
            "desbloqueo": desbloqueo,
        }
        preguntas.append(pregunta)

    if errores:
        raise ValueError("Errores encontrados en el archivo:\n" + "\n".join(errores))

    # Asignar opciones por defecto a preguntas binarias sin opciones
    for pregunta in preguntas:
        if pregunta["tipo"] == "binaria" and not pregunta["opciones"]:
            pregunta["opciones"] = ["Sí", "No"]

    return preguntas