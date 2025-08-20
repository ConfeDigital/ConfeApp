# 📊 Sistema de Carga Masiva de Respuestas a Cuestionarios

## 🎯 Descripción

Este sistema permite cargar respuestas a cuestionarios de forma masiva desde archivos Excel, vinculando las respuestas a usuarios existentes en la plataforma.

## 📋 Características

- ✅ **Carga masiva de respuestas** desde archivos Excel
- ✅ **Validación previa** del formato del archivo
- ✅ **Búsqueda inteligente** de usuarios por nombre completo
- ✅ **Soporte para múltiples cuestionarios** activos
- ✅ **Opciones de sobrescritura** de respuestas existentes
- ✅ **Reportes detallados** de resultados
- ✅ **Interfaz intuitiva** con vista previa del archivo

## 📁 Formato del Archivo Excel

### Estructura Requerida

```
| nombre | Pregunta 1 | Pregunta 2 | Pregunta 3 | ... |
|--------|------------|------------|------------|-----|
| Juan Pérez García | Respuesta 1 | Respuesta 2 | Respuesta 3 | ... |
| María López | Respuesta 1 | Respuesta 2 | Respuesta 3 | ... |
```

### Columnas Especiales

- **`nombre`** (o el nombre que especifiques): Contiene el nombre completo del usuario
- **Otras columnas**: Deben coincidir exactamente con el texto de las preguntas del cuestionario

## 🚀 Cómo Usar

### 1. Acceder al Sistema
- Inicia sesión como administrador
- Ve al menú lateral y selecciona **"Carga Masiva Respuestas"**

### 2. Seleccionar Archivo
- Haz clic en **"Seleccionar Archivo Excel"**
- Elige tu archivo Excel (.xlsx o .xls)
- Selecciona el **cuestionario** al que pertenecen las respuestas
- Especifica el nombre de la columna que contiene los nombres de usuario (default: "nombre")

### 3. Validar Archivo
- Haz clic en **"Validar Archivo"**
- El sistema verificará:
  - Que el cuestionario existe y está activo
  - Que las preguntas coinciden con el cuestionario
  - Que la columna de nombres existe
  - Que el formato es correcto

### 4. Subir Respuestas
- Si la validación es exitosa, selecciona si quieres sobrescribir respuestas existentes
- Haz clic en **"Subir Respuestas"**
- El sistema procesará el archivo y mostrará los resultados

## 🔍 Búsqueda de Usuarios

El sistema busca usuarios de la siguiente manera:

1. **Por nombre completo**: Divide el nombre en partes y busca coincidencias parciales
2. **Campos de búsqueda**:
   - `first_name` (nombre)
   - `last_name` (apellido paterno)
   - `second_last_name` (apellido materno)

### Ejemplos de Búsqueda

| Nombre en Excel | Búsqueda Realizada |
|-----------------|-------------------|
| "Juan Pérez García" | `first_name` contiene "Juan" Y `last_name` contiene "Pérez" |
| "María López" | `first_name` contiene "María" Y `last_name` contiene "López" |
| "Carlos" | `first_name` contiene "Carlos" |

## ⚙️ Configuración

### Parámetros del Sistema

- **`cuestionario_nombre`**: Nombre exacto del cuestionario (ej: "Preentrevista")
- **`nombre_column`**: Nombre de la columna con nombres de usuario (default: "nombre")
- **`overwrite`**: Si sobrescribir respuestas existentes (default: false)

### Validaciones

- ✅ Cuestionario debe existir y estar activo
- ✅ Preguntas deben coincidir exactamente con el cuestionario
- ✅ Usuarios deben existir en la base de datos
- ✅ Formato de archivo debe ser Excel válido

## 📊 Reportes de Resultados

### Estadísticas Mostradas

- **Total de filas**: Número total de filas en el archivo
- **Usuarios encontrados**: Usuarios que se encontraron en la base de datos
- **Respuestas creadas**: Nuevas respuestas agregadas
- **Respuestas actualizadas**: Respuestas existentes que se actualizaron
- **Errores**: Lista detallada de errores encontrados

### Tipos de Errores

- **Usuario no encontrado**: El nombre no coincide con ningún usuario
- **Pregunta no encontrada**: La columna no corresponde a una pregunta del cuestionario
- **Error de formato**: Problemas con el archivo Excel
- **Error de validación**: Datos inválidos en las respuestas

## 🔧 API Endpoints

### Validación
```
POST /api/cuestionarios/validar-respuestas-excel/
```

### Carga
```
POST /api/cuestionarios/carga-masiva-respuestas/
```

### Consulta de Cuestionarios
```
GET /api/cuestionarios/carga-masiva-respuestas/
```

## 🛠️ Solución de Problemas

### Error: "Usuario no encontrado"
- Verifica que el nombre en el Excel coincida con el nombre en la base de datos
- Asegúrate de incluir nombre completo (nombre + apellidos)
- Revisa que no haya espacios extra o caracteres especiales

### Error: "Pregunta no encontrada"
- Verifica que el texto de la pregunta coincida exactamente con el cuestionario
- Revisa mayúsculas/minúsculas y espacios
- Asegúrate de que el cuestionario seleccionado sea el correcto

### Error: "Cuestionario no encontrado"
- Verifica que el nombre del cuestionario sea exacto
- Asegúrate de que el cuestionario esté activo
- Revisa la lista de cuestionarios disponibles

## 📝 Notas Importantes

- **Solo cuestionarios activos** pueden recibir respuestas
- **Los nombres de usuario** deben existir previamente en la plataforma
- **Las preguntas** deben coincidir exactamente con el cuestionario
- **Las respuestas existentes** solo se sobrescriben si `overwrite=true`
- **El sistema es case-sensitive** para nombres de preguntas

## 🎨 Interfaz de Usuario

La interfaz incluye:
- **Vista previa del archivo**: Muestra las primeras 5 filas del Excel
- **Validación en tiempo real**: Verifica el formato antes de procesar
- **Reportes visuales**: Estadísticas con iconos y colores
- **Manejo de errores**: Mensajes claros y específicos
- **Progreso visual**: Indicadores de carga y estado 