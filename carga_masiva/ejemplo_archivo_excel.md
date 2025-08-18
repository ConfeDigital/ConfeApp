# 📋 Crear Archivo Excel de Prueba

## 🎯 Instrucciones Paso a Paso

### 1. Crear un archivo Excel nuevo

1. Abre Excel, Google Sheets, o cualquier editor de hojas de cálculo
2. Crea un nuevo archivo
3. Guarda como `.xlsx`

### 2. Estructura del archivo

**IMPORTANTE**: La primera fila debe contener los nombres de las preguntas

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

### 3. Verificar el formato

✅ **Correcto:**
- Primera fila: Nombres de preguntas
- Filas siguientes: Datos de candidatos
- Sin filas vacías al inicio
- Sin columnas vacías

❌ **Incorrecto:**
- Primera fila vacía
- Nombres de preguntas en la segunda fila
- Filas vacías al inicio
- Columnas sin datos

### 4. Guardar el archivo

1. Guarda como `.xlsx` (no .csv)
2. Asegúrate de que no haya filas vacías al inicio
3. Verifica que la primera fila contenga texto

### 5. Probar en el sistema

1. Ve a la página de carga masiva
2. Selecciona el archivo
3. Abre la consola del navegador (F12)
4. Revisa los logs

### 6. Logs esperados

Si el archivo está correcto, deberías ver:

```
📊 Procesando archivo Excel: tu_archivo.xlsx
📋 Hojas disponibles: ["Hoja1"]
📄 Rango de datos: A1:F3
📏 Rango decodificado: {s: {r: 0, c: 0}, e: {r: 2, c: 5}}
📊 Filas: 3 Columnas: 6
🔍 Primeras celdas:
  Fila 1: {A1: "Nombre", B1: "Apellido Paterno", C1: "Apellido Materno", D1: "Fecha de Nacimiento", E1: "Género"}
  Fila 2: {A2: "Juan", B2: "García", C2: "López", D2: "1990-05-15", E2: "M"}
  Fila 3: {A3: "María", B3: "Rodríguez", C3: "Martínez", D3: "1985-12-03", E3: "F"}
✅ Lectura con header automático exitosa
📄 Filas leídas: 2
📋 Primera fila: {Nombre: "Juan", Apellido Paterno: "García", Apellido Materno: "López", Fecha de Nacimiento: "1990-05-15", Género: "M"}
🔍 Procesando primera fila: {Nombre: "Juan", Apellido Paterno: "García", Apellido Materno: "López", Fecha de Nacimiento: "1990-05-15", Género: "M"}
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

### 7. Si hay problemas

**Problema**: "No se encontraron preguntas"
**Solución**: Verifica que la primera fila contenga texto

**Problema**: "string indices must be integers"
**Solución**: El archivo se está leyendo incorrectamente, verifica el formato

**Problema**: Logs vacíos
**Solución**: El archivo puede estar corrupto, crea uno nuevo

### 8. Archivo de ejemplo completo

Aquí tienes el contenido exacto que debes copiar en Excel:

**Fila 1 (A1:F1):**
```
Nombre | Apellido Paterno | Apellido Materno | Fecha de Nacimiento | Género | CURP
```

**Fila 2 (A2:F2):**
```
Juan | García | López | 1990-05-15 | M | GALJ900515HDFXXX01
```

**Fila 3 (A3:F3):**
```
María | Rodríguez | Martínez | 1985-12-03 | F | ROMA851203MDFXXX02
```

### 9. Verificación final

Antes de subir:
1. ✅ Primera fila tiene nombres de preguntas
2. ✅ No hay filas vacías al inicio
3. ✅ Archivo es .xlsx
4. ✅ Hay al menos 2 filas de datos
5. ✅ Los nombres de preguntas no están vacíos

### 10. Contacto

Si sigues teniendo problemas:
1. Comparte los logs de la consola
2. Describe el formato exacto de tu archivo
3. Menciona qué editor usaste para crear el archivo 