# 📋 Campos Mínimos Requeridos para Carga Masiva de Candidatos

## 🎯 Campos Obligatorios para Crear un Candidato

### 1. **Campos del Usuario (User)**
Estos campos son **OBLIGATORIOS** para crear un candidato:

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `first_name` | String | ✅ **SÍ** | Nombre del candidato | "Juan" |
| `last_name` | String | ✅ **SÍ** | Apellido paterno | "García" |
| `second_last_name` | String | ❌ No | Apellido materno | "López" |
| `email` | String | ❌ No | Correo electrónico | "juan.garcia@email.com" |
| `password` | String | ❌ No | Contraseña | "password123" |

**Notas importantes:**
- Si no se proporciona `email`, se genera automáticamente como `{first_name}.{last_name}@placeholder.com`
- Si el email ya existe, se agrega un número incremental (ej: `juan.garcia1@placeholder.com`)
- Si no se proporciona `password`, se genera automáticamente una contraseña aleatoria de 12 caracteres
- Las contraseñas generadas automáticamente incluyen letras, números y caracteres especiales

### 2. **Campos del Perfil (UserProfile)**
Estos campos son **OPCIONALES** pero recomendados:

| Campo | Tipo | Requerido | Descripción | Valores Válidos |
|-------|------|-----------|-------------|-----------------|
| `birth_date` | Date | ❌ No | Fecha de nacimiento | "1990-05-15", "15/05/1990" |
| `gender` | String | ❌ No | Género | "M", "F", "O" |
| `phone_number` | String | ❌ No | Número de teléfono | "5512345678" |
| `curp` | String | ❌ No | CURP | "GALJ900515HDFXXX01" |

## 🔄 **Asignación Automática**

### **Ciclo Automático**
- **Todos los candidatos** creados por carga masiva se asignan automáticamente al ciclo **"carga_masiva"**
- Este ciclo se crea automáticamente si no existe
- Fecha de inicio: Fecha actual
- Fecha de fin: Sin fecha (abierto)

### **Etapa Automática**
- **Todos los candidatos** se asignan automáticamente a la etapa **"Pre"** (preentrevista)
- Esto permite un flujo de trabajo consistente

### **Proceso Automático**
1. **Crear candidato** → Se asigna a ciclo "carga_masiva"
2. **Crear candidato** → Se asigna a etapa "Pre"
3. **Actualizar candidato existente** → Se mantiene el ciclo si ya tiene uno, o se asigna "carga_masiva"
4. **Actualizar candidato existente** → Se mantiene la etapa si ya tiene una, o se asigna "Pre"

## 🔧 Tipos de Datos y Conversiones Automáticas

### **Campos Booleanos**
Se convierten automáticamente de texto a boolean:
- `True`: "true", "1", "yes", "si", "sí", "verdadero"
- `False`: "false", "0", "no", "falso"

### **Campos de Fecha**
Formatos soportados:
- `YYYY-MM-DD` (ISO)
- `DD/MM/YYYY`
- `MM/DD/YYYY`
- `DD-MM-YYYY`
- `MM-DD-YYYY`

### **Campos de Género**
- `"M"` o `"MASCULINO"` → `"M"`
- `"F"` o `"FEMENINO"` → `"F"`
- `"O"` o `"OTRO"` → `"O"`

### **Campos de Etapa**
- `"registro"` → `"Reg"`
- `"preentrevista"` → `"Pre"`
- `"entrevista"` → `"Ent"`
- `"capacitacion"` → `"Cap"`
- `"agencia"` → `"Agn"`
- `"canalizacion"` → `"Can"`

### **Campos de Tipo de Sangre**
- `"A+"`, `"A-"`, `"B+"`, `"B-"`, `"AB+"`, `"AB-"`, `"O+"`, `"O-"`

## 📊 Ejemplo de Archivo Excel Mínimo

### **Fila 1 (Headers):**
```
Nombre | Apellido Paterno | Apellido Materno | Fecha de Nacimiento | Género | Teléfono
```

### **Fila 2 (Datos):**
```
Juan | García | López | 1990-05-15 | M | 5512345678
```

### **Fila 3 (Datos):**
```
María | Rodríguez | Martínez | 1985-12-03 | F | 5598765432
```

## ⚠️ Manejo de Errores

### **Valores Nulos/Vacíos**
- Los campos vacíos se convierten a `None`
- Los campos con solo espacios se convierten a `None`
- Los campos con valores inválidos se convierten a `None`

### **Campos Faltantes**
- Si faltan `first_name` o `last_name`, se asignan como "Sin especificar"
- Si falta `email`, se genera automáticamente un email único
- Si falta `password`, se genera automáticamente una contraseña aleatoria segura

### **Validación de Datos**
- Las fechas inválidas se convierten a `None`
- Los números inválidos se convierten a `None`
- Los valores de enumeración inválidos se convierten a `None`

## 🚀 Campos Adicionales Opcionales

### **Campos Booleanos**
- `has_disability_certificate`
- `has_interdiction_judgment`
- `has_documentation_list`
- `has_socioeconomic_study`
- `receives_psychological_care`
- `receives_psychiatric_care`
- `has_seizures`

### **Campos de Pensiones y Seguridad Social**
- `receives_pension`: "No", "Bie", "Orf", "Otr"
- `social_security`: "IMSS", "ISSSTE", "PEMEX", "IMSS-BIENESTAR", "PARTICULAR", "OTRO", "NINGUNO"

### **Campos Médicos**
- `blood_type`: "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
- `allergies`: Texto libre
- `dietary_restrictions`: Texto libre
- `physical_restrictions`: Texto libre

### **Campos de Domicilio**
- `address_road`
- `address_number`
- `address_number_int`
- `address_PC`
- `address_municip`
- `address_col`
- `address_state`
- `address_city`
- `address_lat`
- `address_lng`
- `residence_type`: "CASA", "DEPARTAMENTO", "ALBERGUE", "INSTITUCION", "OTRO"

### **Campos de Contacto de Emergencia**
- `emergency_first_name`
- `emergency_last_name`
- `emergency_second_last_name`
- `emergency_relationship`
- `emergency_phone`
- `emergency_email`
- `emergency_lives_same_address`

## 🔍 Mapeo de Preguntas del Excel

### **Proceso de Mapeo**
1. **Subir Excel**: El sistema lee la primera fila como preguntas
2. **Mapear Campos**: El usuario asigna cada pregunta a un campo de la base de datos
3. **Procesar Datos**: El sistema convierte automáticamente los tipos de datos
4. **Crear Candidatos**: Se crean los usuarios y perfiles en la base de datos
5. **Asignar Automáticamente**: Ciclo "carga_masiva" y etapa "Pre"

### **Ejemplo de Mapeo**
```
Pregunta del Excel → Campo de Base de Datos
"Nombre del candidato" → first_name
"Apellido paterno" → last_name
"Fecha de nacimiento" → birth_date
"Género" → gender
"Teléfono" → phone_number
```

## ✅ Verificación de Datos

### **Antes de Subir**
1. ✅ Verificar que la primera fila contenga los nombres de las preguntas
2. ✅ Asegurar que haya al menos un campo mapeado a `first_name` o `last_name`
3. ✅ Verificar que los datos no estén completamente vacíos
4. ✅ Revisar que el formato de fechas sea consistente

### **Después de Subir**
1. ✅ Revisar los logs de procesamiento
2. ✅ Verificar que se crearon los candidatos esperados
3. ✅ Revisar los errores reportados
4. ✅ Confirmar que los tipos de datos se convirtieron correctamente
5. ✅ Verificar que todos están en ciclo "carga_masiva" y etapa "Pre"

## 📋 **Resumen del Flujo Automático**

### **Para Candidatos Nuevos:**
1. Se crea el usuario con los datos proporcionados
2. Se asigna automáticamente al grupo "candidatos"
3. Se crea el perfil con ciclo "carga_masiva"
4. Se asigna automáticamente a etapa "Pre"
5. Se procesan todos los campos adicionales

### **Para Candidatos Existentes:**
1. Se actualiza el perfil con los nuevos datos
2. Si no tiene ciclo, se asigna "carga_masiva"
3. Si no tiene etapa, se asigna "Pre"
4. Se mantienen los valores existentes si ya los tienen 