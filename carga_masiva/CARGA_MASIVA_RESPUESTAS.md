# 📋 Carga Masiva de Respuestas a Cuestionarios

## 🎯 **Descripción**

El sistema de carga masiva de respuestas permite subir archivos Excel con respuestas de usuarios a cuestionarios específicos. El sistema procesa automáticamente las respuestas y las asocia con los usuarios correctos usando similitud de nombres.

## 🔧 **Funcionalidades**

### **✅ Características Principales:**
- **Búsqueda por similitud**: Encuentra usuarios con 80% de similitud en nombres
- **Búsqueda de preguntas por similitud**: Encuentra preguntas con 90% de similitud
- **Validación automática**: Verifica formato del archivo y datos
- **Procesamiento inteligente**: Maneja diferentes tipos de preguntas
- **Sobrescritura opcional**: Permite actualizar respuestas existentes
- **Estadísticas detalladas**: Reporta resultados del procesamiento

### **✅ Tipos de Preguntas Soportados:**
- **Número**: Convierte a entero
- **Opción múltiple**: Maneja JSON y valores simples
- **Checkbox**: Procesa arrays de selecciones
- **Binaria**: Convierte a boolean (Sí/No)
- **SIS/SIS2**: Mantiene formato JSON
- **Abierta**: Mantiene como texto

## 📊 **Formato del Archivo Excel**

### **Estructura Requerida:**

| Columna | Descripción | Requerido | Ejemplo |
|---------|-------------|-----------|---------|
| `nombre` | Nombre completo del usuario | ✅ | "Juan García López" |
| `Pregunta 1` | Texto de la primera pregunta | ❌ | "Sí" |
| `Pregunta 2` | Texto de la segunda pregunta | ❌ | "25" |
| `Pregunta 3` | Texto de la tercera pregunta | ❌ | `["opción1", "opción2"]` |

### **Ejemplo de Archivo Excel:**

```
| nombre           | ¿Tiene experiencia laboral? | ¿Cuántos años de experiencia? | ¿Qué áreas conoce? |
|------------------|------------------------------|--------------------------------|-------------------|
| Juan García López| Sí                          | 5                              | ["Administración", "Ventas"] |
| María Pérez      | No                          | 0                              | []                |
| Carlos Martínez  | Sí                          | 3                              | ["Tecnología"]    |
```

## 🔍 **Procesamiento de Datos**

### **1. Búsqueda de Usuarios**
- **Algoritmo**: Fuzzy string matching (similitud 80%)
- **Campos comparados**: Nombre completo del Excel vs nombre en BD
- **Formato BD**: `first_name + last_name + second_last_name`

### **2. Búsqueda de Preguntas**
- **Algoritmo**: Fuzzy string matching (similitud 90%)
- **Proceso**: 
  1. Primero busca coincidencia exacta
  2. Si no encuentra, busca por similitud del 90%
- **Casos manejados**: Diferencias en puntuación, espacios, mayúsculas/minúsculas
- **Ejemplos de coincidencias**:
  - `"¿Tiene experiencia laboral?"` ↔ `"¿Tiene experiencia laboral?"` (100%)
  - `"Tiene experiencia laboral"` ↔ `"¿Tiene experiencia laboral?"` (95%)
  - `"Experiencia laboral"` ↔ `"¿Tiene experiencia laboral?"` (90%)

### **3. Procesamiento de Respuestas**
- **Validación**: Verifica que las preguntas existan en el cuestionario
- **Conversión**: Aplica conversiones según tipo de pregunta
- **Almacenamiento**: Guarda en formato JSON en la base de datos

### **4. Manejo de Errores**
- **Usuarios no encontrados**: Reporta en estadísticas
- **Preguntas no encontradas**: Ignora y reporta (si similitud < 90%)
- **Errores de formato**: Mantiene valor original

## 📋 **API Endpoints**

### **POST /api/cuestionarios/carga-masiva-respuestas/**

**Parámetros:**
```json
{
    "excel_file": "archivo.xlsx",
    "cuestionario_nombre": "Nombre del Cuestionario",
    "nombre_column": "nombre",
    "overwrite": false
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Archivo procesado correctamente",
    "stats": {
        "total_filas": 10,
        "usuarios_encontrados": 8,
        "usuarios_no_encontrados": 2,
        "respuestas_creadas": 24,
        "respuestas_actualizadas": 0,
        "respuestas_ignoradas": 5,
        "preguntas_procesadas": 29,
        "preguntas_no_encontradas": 3,
        "errores": [
            "Fila 3: Usuario con nombre 'Pedro López' no encontrado (mejor coincidencia < 80%)",
            "Fila 5: Pregunta 'Pregunta inexistente' no encontrada en el cuestionario (mejor coincidencia < 90%)"
        ],
        "coincidencias_similitud": [
            {
                "nombre_excel": "Juan García López",
                "nombre_bd": "Juan García López",
                "similitud": 100
            }
        ],
        "coincidencias_preguntas": [
            {
                "columna_excel": "Tiene experiencia laboral",
                "pregunta_bd": "¿Tiene experiencia laboral?",
                "similitud": 95
            }
        ]
    }
}
```

### **GET /api/cuestionarios/carga-masiva-respuestas/**

**Respuesta:**
```json
{
    "cuestionarios": [
        {
            "id": 1,
            "nombre": "Cuestionario de Evaluación",
            "version": 2,
            "base_cuestionario": "Evaluación Inicial",
            "total_preguntas": 15,
            "preguntas": [
                "¿Tiene experiencia laboral?",
                "¿Cuántos años de experiencia?",
                "¿Qué áreas conoce?"
            ]
        }
    ]
}
```

## 🛠️ **Configuración**

### **Dependencias Requeridas:**
```bash
pip install fuzzywuzzy python-Levenshtein pandas openpyxl
```

### **Configuración de Similitud:**
- **Usuarios**: 80% de similitud mínima
- **Preguntas**: 90% de similitud mínima
- **Algoritmo**: Levenshtein distance
- **Normalización**: Convertir a minúsculas

## 📝 **Casos de Uso**

### **1. Carga Inicial de Respuestas**
```python
# Subir archivo con respuestas nuevas
POST /api/cuestionarios/carga-masiva-respuestas/
{
    "excel_file": "respuestas_nuevas.xlsx",
    "cuestionario_nombre": "Evaluación Inicial",
    "overwrite": false
}
```

### **2. Actualización de Respuestas**
```python
# Actualizar respuestas existentes
POST /api/cuestionarios/carga-masiva-respuestas/
{
    "excel_file": "respuestas_actualizadas.xlsx",
    "cuestionario_nombre": "Evaluación Inicial",
    "overwrite": true
}
```

### **3. Verificación de Cuestionarios**
```python
# Obtener información de cuestionarios disponibles
GET /api/cuestionarios/carga-masiva-respuestas/
```

## ⚠️ **Limitaciones y Consideraciones**

### **Limitaciones:**
- **Similitud mínima usuarios**: 80%
- **Similitud mínima preguntas**: 90%
- **Tamaño de archivo**: Limitado por configuración del servidor
- **Tipos de datos**: Algunos formatos complejos pueden requerir preprocesamiento

### **Consideraciones:**
- **Backup**: Siempre hacer backup antes de cargas masivas
- **Validación**: Revisar estadísticas después del procesamiento
- **Pruebas**: Probar con archivos pequeños antes de cargas grandes

## 🔧 **Solución de Problemas**

### **Errores Comunes:**

1. **"Usuario no encontrado"**
   - Verificar que el nombre en Excel coincida con la BD
   - Revisar formato del nombre (apellidos incluidos)

2. **"Pregunta no encontrada"**
   - Verificar que el texto de la pregunta tenga al menos 90% de similitud
   - Usar GET endpoint para ver preguntas disponibles
   - Revisar diferencias en puntuación o espacios

3. **"Error de formato"**
   - Verificar que el archivo sea Excel válido
   - Revisar que las columnas tengan nombres correctos

### **Debug:**
- Revisar logs del servidor para detalles
- Verificar estadísticas en la respuesta
- Usar archivos de prueba pequeños

## 📈 **Mejoras Futuras**

- **Interfaz web**: Formulario de carga con preview
- **Validación en tiempo real**: Verificar datos antes de procesar
- **Plantillas descargables**: Generar Excel con estructura correcta
- **Reportes detallados**: Exportar estadísticas a PDF/Excel
- **Búsqueda mejorada**: Usar email o ID en lugar de solo nombre

---

**Estado**: ✅ Funcional  
**Versión**: 1.1  
**Última actualización**: $(date)
