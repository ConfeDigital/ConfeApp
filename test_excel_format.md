# 🧪 Prueba del Formato de Excel

## 📋 Instrucciones para Probar

### 1. Crear un archivo Excel de prueba

Crea un archivo Excel con la siguiente estructura:

**Hoja 1: Preentrevistas**
```
| Nombre | Apellido Paterno | Apellido Materno | Fecha de Nacimiento | Género | CURP |
|--------|------------------|------------------|-------------------|--------|------|
| Juan   | García           | López            | 1990-05-15        | M      | GALJ900515HDFXXX01 |
| María  | Rodríguez        | Martínez         | 1985-12-03        | F      | ROMA851203MDFXXX02 |
```

**Hoja 2: Entrevistas**
```
| Nombre | ¿Cuál es su nivel de escolaridad? | ¿Tiene experiencia laboral previa? | ¿Qué tipo de trabajo busca? |
|--------|-----------------------------------|-----------------------------------|------------------------------|
| Juan García López | Licenciatura | Sí | Administrativo |
| María Rodríguez Martínez | Bachillerato | Sí | Atención al cliente |
```

**Hoja 3: Estudios Socioeconómicos**
```
| Nombre | ¿Cuál es su estado civil? | ¿Cuántas personas viven en su hogar? | ¿Cuál es el ingreso mensual familiar? |
|--------|---------------------------|-------------------------------------|--------------------------------------|
| Juan García López | Soltero | 3 | $25,000 |
| María Rodríguez Martínez | Casada | 4 | $35,000 |
```

### 2. Verificar el formato

**Importante:**
- ✅ La **primera fila** debe contener los nombres de las preguntas
- ✅ Las **filas siguientes** contienen las respuestas de cada candidato
- ✅ La **primera columna** debe ser el nombre del candidato
- ✅ Los **nombres deben coincidir exactamente** entre archivos

### 3. Probar en el sistema

1. **Paso 1**: Subir archivo de preentrevistas
   - Debería detectar las preguntas: "Nombre", "Apellido Paterno", "Apellido Materno", etc.
   - Mapear "Nombre" → `first_name`
   - Mapear "Apellido Paterno" → `last_name`
   - etc.

2. **Paso 2**: Subir archivo de entrevistas
   - Debería detectar las preguntas: "¿Cuál es su nivel de escolaridad?", etc.
   - Los candidatos "Juan García López" y "María Rodríguez Martínez" deben existir

3. **Paso 3**: Subir archivo de estudios socioeconómicos
   - Debería detectar las preguntas económicas
   - Los candidatos deben existir del paso anterior

### 4. Verificar logs

Abre la consola del navegador (F12) y verifica que aparezcan los logs:

```
📊 Procesando archivo Excel: preentrevistas.xlsx
📋 Hojas disponibles: ["Hoja1"]
✅ Lectura con header automático exitosa
📄 Filas leídas: 2
📋 Primera fila: {Nombre: "Juan", Apellido Paterno: "García", ...}
🔍 Procesando primera fila: {Nombre: "Juan", Apellido Paterno: "García", ...}
➕ Pregunta encontrada: Nombre
➕ Pregunta encontrada: Apellido Paterno
➕ Pregunta encontrada: Apellido Materno
➕ Pregunta encontrada: Fecha de Nacimiento
➕ Pregunta encontrada: Género
➕ Pregunta encontrada: CURP
👤 Candidato encontrado: Juan
👤 Candidato encontrado: María
📊 Resumen:
- Preguntas encontradas: 6
- Candidatos encontrados: 2
- Preguntas: ["Nombre", "Apellido Paterno", "Apellido Materno", "Fecha de Nacimiento", "Género", "CURP"]
```

### 5. Problemas comunes

**Si no se detectan preguntas:**

1. **Verificar formato del archivo:**
   - Asegúrate de que sea un archivo Excel (.xlsx o .xls)
   - No un archivo CSV convertido a Excel

2. **Verificar primera fila:**
   - La primera fila debe contener texto (nombres de preguntas)
   - No debe estar vacía
   - No debe contener solo números

3. **Verificar estructura:**
   - No debe haber filas vacías al inicio
   - La primera fila debe ser la que contiene los nombres de las preguntas

4. **Verificar codificación:**
   - El archivo debe estar guardado en formato UTF-8
   - Evitar caracteres especiales en los nombres de las preguntas

### 6. Archivo de ejemplo

Aquí tienes un ejemplo de cómo debería verse el contenido del Excel:

**Preentrevistas.xlsx:**
```
A1: Nombre
B1: Apellido Paterno
C1: Apellido Materno
D1: Fecha de Nacimiento
E1: Género
F1: CURP

A2: Juan
B2: García
C2: López
D2: 1990-05-15
E2: M
F2: GALJ900515HDFXXX01

A3: María
B3: Rodríguez
C3: Martínez
D3: 1985-12-03
E3: F
F3: ROMA851203MDFXXX02
```

### 7. Comandos de depuración

Si tienes acceso al backend, puedes ejecutar:

```bash
# Verificar que el comando funciona
python manage.py generar_plantilla_candidatos --tipo preentrevista

# Verificar logs del servidor
python manage.py runserver --verbosity=2
```

### 8. Contacto

Si sigues teniendo problemas, proporciona:
1. Una captura de pantalla del archivo Excel
2. Los logs de la consola del navegador
3. El formato exacto de tu archivo 