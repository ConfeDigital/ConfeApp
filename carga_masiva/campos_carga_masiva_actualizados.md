# 📋 Campos Disponibles para Carga Masiva de Candidatos

## 🎯 **Información General**

Este documento lista **todos los campos disponibles** para la carga masiva de candidatos usando archivos Excel. El sistema asigna automáticamente el centro del usuario que sube el archivo.

---

## 👤 **Campos del Usuario (User)**

| Campo Excel | Descripción | Requerido | Tipo |
|-------------|-------------|-----------|------|
| `first_name` | Nombre | ✅ | Texto |
| `last_name` | Apellido paterno | ✅ | Texto |
| `second_last_name` | Apellido materno | ❌ | Texto |
| `email` | Correo electrónico | ❌ (se genera automáticamente) | Email |
| `password` | Contraseña | ❌ (se genera automáticamente) | Texto |

---

## 📋 **Campos del Perfil (UserProfile)**

| Campo Excel | Descripción | Requerido | Tipo |
|-------------|-------------|-----------|------|
| `birth_date` | Fecha de nacimiento | ❌ | Fecha (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY) |
| `gender` | Género | ❌ | Texto (M/F/O) |
| `curp` | CURP | ❌ | Texto |
| `phone_number` | Teléfono | ✅ | Texto |
| `stage` | Etapa | ❌ (se asigna "Ent" automáticamente) | Texto |
| `disability` | Discapacidades | ❌ | Texto (nombres separados por comas) |

---

## ✅ **Campos Booleanos**

| Campo Excel | Descripción | Valores Aceptados |
|-------------|-------------|-------------------|
| `has_disability_certificate` | Tiene certificado de discapacidad | true/false, si/no, 1/0, x |
| `has_interdiction_judgment` | Tiene sentencia de interdicción | true/false, si/no, 1/0, x |
| `receives_psychological_care` | Recibe atención psicológica | true/false, si/no, 1/0, x |
| `receives_psychiatric_care` | Recibe atención psiquiátrica | true/false, si/no, 1/0, x |
| `has_seizures` | Tiene convulsiones | true/false, si/no, 1/0, x |

---

## 💰 **Campos de Pensiones y Seguridad Social**

| Campo Excel | Descripción | Opciones |
|-------------|-------------|----------|
| `receives_pension` | Recibe pensión | No, Bienestar, Orfandad, Otra |
| `social_security` | Seguridad social | IMSS, ISSSTE, PEMEX, IMSS-Bienestar, Particular, Otro, Ninguno |

---

## 🏥 **Campos Médicos**

| Campo Excel | Descripción | Tipo |
|-------------|-------------|------|
| `blood_type` | Tipo de sangre | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `allergies` | Alergias | Texto |
| `dietary_restrictions` | Restricciones dietéticas | Texto |
| `physical_restrictions` | Restricciones físicas | Texto |
| `medications` | Medicamentos | Texto (nombres separados por comas) |

---

## 🏢 **Campos de Agencia**

| Campo Excel | Descripción | Opciones |
|-------------|-------------|----------|
| `agency_state` | Estado en agencia | Bolsa de Trabajo, Empleado, Desempleado |
| `current_job` | Trabajo actual | Texto |

---

## 🏠 **Campos de Domicilio (Domicile)**

| Campo Excel | Descripción | Tipo |
|-------------|-------------|------|
| `address_road` | Calle | Texto |
| `address_number` | Número exterior | Texto |
| `address_number_int` | Número interior | Texto |
| `address_PC` | Código postal | Texto |
| `address_municip` | Municipio | Texto |
| `address_col` | Colonia | Texto |
| `address_state` | Estado | Texto |
| `address_city` | Ciudad | Texto |
| `address_lat` | Latitud | Número decimal |
| `address_lng` | Longitud | Número decimal |
| `residence_type` | Tipo de residencia | Casa, Departamento, Albergue, Institución, Otro |

---

## 🚨 **Campos de Contacto de Emergencia (EmergencyContact)**

### **Formato Individual (Legacy)**

| Campo Excel | Descripción | Requerido | Tipo |
|-------------|-------------|-----------|------|
| `emergency_first_name` | Nombre del contacto | ❌ | Texto |
| `emergency_last_name` | Apellido del contacto | ❌ | Texto |
| `emergency_second_last_name` | Segundo apellido | ❌ | Texto |
| `emergency_relationship` | Relación | ❌ | Padre, Madre, Hermano, Hermana, Pareja, Abuelo, Abuela, Hijo, Hija, Otro Familiar, Amigo, Amiga, Otro |
| `emergency_phone` | Teléfono del contacto | ❌ | Texto |
| `emergency_email` | Email del contacto | ❌ | Email |

### **Formato Múltiple (Nuevo)**

Para múltiples contactos de emergencia, usa el formato con sufijos:

| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `emergency_first_name_1` | Nombre del contacto 1 | Juan |
| `emergency_last_name_1` | Apellido del contacto 1 | Pérez |
| `emergency_relationship_1` | Relación del contacto 1 | Padre |
| `emergency_phone_1` | Teléfono del contacto 1 | 5551234567 |
| `emergency_first_name_2` | Nombre del contacto 2 | María |
| `emergency_last_name_2` | Apellido del contacto 2 | García |
| `emergency_relationship_2` | Relación del contacto 2 | Madre |
| `emergency_phone_2` | Teléfono del contacto 2 | 5559876543 |

**Hasta 5 contactos** (sufijos del 1 al 5).

**Nota**: El campo `lives_at_same_address` se establece automáticamente como `False` para todos los contactos de emergencia.

---

## 🔄 **Campos Relacionales**

| Campo Excel | Descripción | Tipo |
|-------------|-------------|------|
| `cycle` | Ciclo | Número de ID o nombre del ciclo |

---

## 📝 **Campos Legacy (Compatibilidad)**

| Campo Excel | Se Mapea A | Descripción |
|-------------|------------|-------------|
| `Generación` | `cycle` | Ciclo |
| `Nombre tutor / Institución` | `emergency_first_name` | Nombre del contacto de emergencia |
| `relationship` | `emergency_relationship` | Relación del contacto |
| `municipio` | `address_municip` | Municipio |

---

## ⚙️ **Comportamiento Automático**

### **✅ Asignación Automática:**
- **Centro**: Se asigna automáticamente el centro del usuario que sube el archivo
- **Etapa**: Se asigna automáticamente "ENTREVISTA" (`Ent`)
- **Email**: Se genera automáticamente si no se proporciona
- **Contraseña**: Se genera automáticamente si no se proporciona
- **Grupo**: Se asigna automáticamente al grupo "candidatos"

### **🔄 Procesamiento Inteligente:**
- **Discapacidades**: Se convierten automáticamente de nombres a IDs
- **Medicamentos**: Se crean automáticamente si no existen
- **Contactos múltiples**: Se procesan automáticamente hasta 5 contactos
- **Valores booleanos**: Se convierten automáticamente de varios formatos

---

## 📊 **Ejemplo de Excel**

| first_name | last_name | email | phone_number | birth_date | gender | emergency_first_name | emergency_relationship | emergency_phone | address_road | address_number | address_municip |
|------------|-----------|-------|--------------|------------|--------|---------------------|----------------------|-----------------|--------------|----------------|-----------------|
| Juan | Pérez | juan.perez@email.com | 5551234567 | 1990-01-01 | M | María | Madre | 5559876543 | Av. Principal | 123 | Centro |
| Ana | García | ana.garcia@email.com | 5552345678 | 1985-05-15 | F | Carlos | Padre | 5558765432 | Calle Secundaria | 456 | Norte |

---

## 📅 **Formatos de Fecha Aceptados**

El campo `birth_date` acepta los siguientes formatos:

| Formato | Ejemplo | Descripción |
|---------|---------|-------------|
| `YYYY-MM-DD` | `1990-01-15` | Formato ISO estándar |
| `DD/MM/YYYY` | `15/01/1990` | Formato europeo |
| `MM/DD/YYYY` | `01/15/1990` | Formato americano |

**Nota**: Si la fecha no se puede convertir a ninguno de estos formatos, se establecerá como `None`.

---

## 🎯 **Notas Importantes**

1. **Solo se procesan columnas que existen** en el Excel
2. **Se ignoran columnas vacías** automáticamente
3. **El centro se asigna automáticamente** del usuario que sube
4. **Todos los candidatos van a etapa "ENTREVISTA"** automáticamente
5. **Se pueden subir múltiples contactos de emergencia** usando sufijos (_1, _2, etc.)
6. **Los valores booleanos aceptan múltiples formatos** (true/false, si/no, 1/0, x)
7. **Las discapacidades se crean automáticamente** si no existen en la base de datos
8. **Las fechas se convierten automáticamente** al formato YYYY-MM-DD 