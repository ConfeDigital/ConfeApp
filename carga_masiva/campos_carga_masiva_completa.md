# 📋 Campos Completos para Carga Masiva

## 🎯 **Configuración Automática**
- **Etapa**: Todos los candidatos se asignan automáticamente a **"ENTREVISTA"**
- **Center**: Se asigna automáticamente el center del usuario que sube el archivo
- **Email**: Se genera automáticamente si no se proporciona
- **Password**: Se genera automáticamente si no se proporciona

## 📊 **Campos Disponibles**

### **1. Campos del Usuario (User)**
| Campo Excel | Descripción | Requerido | Ejemplo |
|-------------|-------------|-----------|---------|
| `first_name` | Nombre | ✅ | Juan |
| `last_name` | Apellido paterno | ✅ | García |
| `second_last_name` | Apellido materno | ❌ | López |
| `email` | Correo electrónico | ❌ | juan.garcia@email.com |
| `password` | Contraseña | ❌ | MiContraseña123 |

### **2. Campos del Perfil (UserProfile)**
| Campo Excel | Descripción | Requerido | Ejemplo |
|-------------|-------------|-----------|---------|
| `birth_date` | Fecha de nacimiento | ❌ | 1990-01-01 |
| `gender` | Género (M/F) | ❌ | M |
| `curp` | CURP | ❌ | ABC123456789 |
| `phone_number` | Número de teléfono | ❌ | 555-1234 |
| `blood_type` | Tipo de sangre | ❌ | O+ |
| `allergies` | Alergias | ❌ | Polen, polvo |
| `dietary_restrictions` | Restricciones dietéticas | ❌ | Sin gluten |
| `physical_restrictions` | Restricciones físicas | ❌ | No puede levantar peso |
| `agency_state` | Estado de agencia | ❌ | Activo |
| `current_job` | Trabajo actual | ❌ | Desarrollador |

### **3. Campos Booleanos**
| Campo Excel | Descripción | Valores | Ejemplo |
|-------------|-------------|---------|---------|
| `has_disability_certificate` | Tiene certificado de discapacidad | true/false/si/no/1/0 | true |
| `has_interdiction_judgment` | Tiene juicio de interdicción | true/false/si/no/1/0 | false |
| `has_documentation_list` | Tiene lista de documentación | true/false/si/no/1/0 | true |
| `has_socioeconomic_study` | Tiene estudio socioeconómico | true/false/si/no/1/0 | false |
| `receives_psychological_care` | Recibe atención psicológica | true/false/si/no/1/0 | true |
| `receives_psychiatric_care` | Recibe atención psiquiátrica | true/false/si/no/1/0 | false |
| `has_seizures` | Tiene convulsiones | true/false/si/no/1/0 | false |

### **4. Campos de Pensiones y Seguridad Social**
| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `receives_pension` | Recibe pensión | Sí, recibe pensión por discapacidad |
| `social_security` | Seguridad social | IMSS |

### **5. Campos de Domicilio (Domicile)**
| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `address_road` | Calle | Calle Principal |
| `address_number` | Número | 123 |
| `address_number_int` | Número interior | A |
| `address_PC` | Código postal | 12345 |
| `address_municip` | Municipio | Municipio |
| `address_col` | Colonia | Colonia Centro |
| `address_state` | Estado | Estado de México |
| `address_city` | Ciudad | Ciudad de México |
| `address_lat` | Latitud | 19.4326 |
| `address_lng` | Longitud | -99.1332 |
| `residence_type` | Tipo de residencia | Casa propia |

### **6. Campos de Contacto de Emergencia (EmergencyContact)**

#### **Formato Individual (Legacy):**
| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `emergency_first_name` | Nombre del contacto | María |
| `emergency_last_name` | Apellido del contacto | García |
| `emergency_second_last_name` | Apellido materno del contacto | López |
| `emergency_relationship` | Relación con el contacto | Madre |
| `emergency_phone` | Teléfono del contacto | 555-5678 |
| `emergency_email` | Email del contacto | maria@email.com |
| `emergency_lives_same_address` | Vive en la misma dirección | true |

#### **Formato Múltiple (Nuevo - Hasta 5 contactos):**
| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `emergency_first_name_1` | Nombre del contacto 1 | María |
| `emergency_last_name_1` | Apellido del contacto 1 | García |
| `emergency_relationship_1` | Relación con el contacto 1 | Madre |
| `emergency_phone_1` | Teléfono del contacto 1 | 555-5678 |
| `emergency_first_name_2` | Nombre del contacto 2 | Pedro |
| `emergency_last_name_2` | Apellido del contacto 2 | García |
| `emergency_relationship_2` | Relación con el contacto 2 | Padre |
| `emergency_phone_2` | Teléfono del contacto 2 | 555-9012 |
| `emergency_first_name_3` | Nombre del contacto 3 | Ana |
| `emergency_last_name_3` | Apellido del contacto 3 | López |
| `emergency_relationship_3` | Relación con el contacto 3 | Hermana |
| `emergency_phone_3` | Teléfono del contacto 3 | 555-3456 |

**Nota:** Puedes usar hasta 5 contactos de emergencia por candidato (del 1 al 5). Solo se crearán los contactos que tengan nombre, apellido y relación completos.

### **7. Campos Relacionales**
| Campo Excel | Descripción | Ejemplo |
|-------------|-------------|---------|
| `disability` | Lista de discapacidades | ["Discapacidad física", "Discapacidad visual"] |
| `cycle` | ID del ciclo | 1 |
| `medications` | Lista de medicamentos | ["Paracetamol", "Ibuprofeno"] |

## 📄 **Ejemplo de Excel**

```
| first_name | last_name | second_last_name | email | phone_number | birth_date | gender | curp | address_road | address_number | address_PC | address_municip | address_col | address_state | address_city | emergency_first_name_1 | emergency_last_name_1 | emergency_relationship_1 | emergency_phone_1 | emergency_first_name_2 | emergency_last_name_2 | emergency_relationship_2 | emergency_phone_2 | has_disability_certificate | has_interdiction_judgment | receives_psychological_care | has_seizures | receives_pension | social_security | blood_type | allergies | dietary_restrictions | physical_restrictions | agency_state | current_job |
|------------|-----------|------------------|-------|--------------|------------|--------|------|--------------|----------------|------------|-----------------|-------------|---------------|--------------|---------------------|---------------------|------------------------|------------------|---------------------|---------------------|------------------------|------------------|---------------------------|---------------------------|---------------------------|--------------|------------------|-----------------|------------|----------|---------------------|----------------------|--------------|-------------|
| Juan | García | López | juan@email.com | 555-1234 | 1990-01-01 | M | ABC123456789 | Calle Principal | 123 | 12345 | Municipio | Colonia | Estado | Ciudad | María | García | Madre | 555-5678 | Pedro | García | Padre | 555-9012 | true | false | true | false | Sí, recibe pensión | IMSS | O+ | Polen | Sin gluten | No puede levantar peso | Activo | Desarrollador |
| Ana | Martínez | González | ana@email.com | 555-5678 | 1985-05-15 | F | DEF987654321 | Calle Secundaria | 456 | 54321 | Municipio2 | Colonia2 | Estado2 | Ciudad2 | Pedro | Martínez | Padre | 555-9012 | | | | | false | false | false | false | No recibe | Sin seguridad social | A+ | Ninguna | Sin restricciones | Sin restricciones | Inactivo | Desempleada |
```

## 🔧 **Campos Legacy (Compatibilidad)**
Para mantener compatibilidad con archivos existentes, estos campos también funcionan:

| Campo Legacy | Se mapea a | Descripción |
|--------------|------------|-------------|
| `Generación` | `cycle` | ID del ciclo |
| `Nombre tutor / Institución` | `emergency_first_name` | Nombre del contacto de emergencia |
| `relationship` | `emergency_relationship` | Relación con el contacto |
| `Lista de documentación` | `has_documentation_list` | Tiene lista de documentación |
| `Estudio socieconómico` | `has_socioeconomic_study` | Tiene estudio socioeconómico |
| `municipio` | `address_municip` | Municipio |

## ✅ **Características del Sistema**

### **Asignación Automática:**
- **Etapa**: Todos los candidatos se asignan a **"ENTREVISTA"** automáticamente
- **Center**: Se asigna el center del usuario que sube el archivo
- **Email**: Se genera automáticamente si no se proporciona (formato: nombre.apellido@placeholder.com)
- **Password**: Se genera automáticamente si no se proporciona (12 caracteres aleatorios)

### **Validación:**
- **Campos requeridos**: Solo `first_name` y `last_name` son obligatorios
- **Campos booleanos**: Acepta true/false, si/no, 1/0, x
- **Fechas**: Formato YYYY-MM-DD
- **Género**: M o F

### **Procesamiento:**
- **Domicilio**: Se crea automáticamente si se proporcionan datos de dirección
- **Contacto de emergencia**: Se crea automáticamente si se proporcionan datos
- **Medicamentos**: Se procesan como lista
- **Discapacidades**: Se procesan como lista

## 🚀 **Uso**

1. **Crear Excel** con las columnas que necesites
2. **Subir archivo** a través del sistema de carga masiva
3. **Los candidatos se crearán** automáticamente en etapa "ENTREVISTA"
4. **Verificar** en la plataforma que aparezcan correctamente

**¡Sistema listo para usar con todos los campos disponibles!** 🎯 