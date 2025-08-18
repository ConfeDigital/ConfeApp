# 📤 Carga Masiva de Candidatos

## 🎯 Descripción

Sistema completo para la carga masiva de candidatos con soporte para todos los campos disponibles y procesamiento de respuestas de cuestionarios.

## 🚀 Características

### ✅ Funcionalidades Implementadas

1. **Carga Masiva Completa de Candidatos**
   - Soporte para todos los campos del modelo UserProfile
   - Validación automática de datos
   - Manejo de errores detallado
   - Creación automática de registros relacionados (domicilio, contactos de emergencia, etc.)

2. **Procesamiento de Respuestas de Cuestionarios**
   - Carga de respuestas en formato JSON
   - Mapeo automático de preguntas
   - Validación de datos existentes

3. **Interfaz Web Mejorada**
   - Proceso paso a paso con stepper
   - Mapeo visual de campos
   - Vista previa de datos
   - Reportes de resultados

## 📋 Campos Soportados

### 👤 Campos Básicos del Usuario
- `first_name` - Nombre
- `last_name` - Apellido paterno
- `second_last_name` - Apellido materno
- `email` - Correo electrónico
- `password` - Contraseña

### 📊 Campos del Perfil
- `birth_date` - Fecha de nacimiento (YYYY-MM-DD)
- `gender` - Género (M/F/O)
- `curp` - CURP
- `phone_number` - Teléfono
- `stage` - Etapa (Reg/Pre/Ent/Cap/Agn/Can)
- `disability` - Discapacidad (lista)
- `cycle` - Ciclo/Generación

### ✅ Campos Booleanos
- `has_disability_certificate` - Certificado de discapacidad
- `has_interdiction_judgment` - Juicio de interdicción
- `has_documentation_list` - Lista de documentación
- `has_socioeconomic_study` - Estudio socioeconómico
- `receives_psychological_care` - Cuidado psicológico
- `receives_psychiatric_care` - Cuidado psiquiátrico
- `has_seizures` - Convulsiones

### 💰 Campos de Pensiones y Seguridad Social
- `receives_pension` - Recibe pensión (No/Bie/Orf/Otr)
- `social_security` - Seguridad social (IMSS/ISSSTE/PEMEX/etc.)

### 🏥 Campos Médicos
- `blood_type` - Tipo de sangre (A+/A-/B+/B-/AB+/AB-/O+/O-)
- `allergies` - Alergias
- `dietary_restrictions` - Restricciones dietéticas
- `physical_restrictions` - Restricciones físicas
- `medications` - Medicamentos (JSON)

### 🏢 Campos de Agencia
- `agency_state` - Estado en agencia (Bol/Emp/Des)
- `current_job` - Trabajo actual (ID)

### 🏠 Campos de Domicilio
- `address_road` - Calle
- `address_number` - Número exterior
- `address_number_int` - Número interior
- `address_PC` - Código postal
- `address_municip` - Municipio
- `address_col` - Colonia
- `address_state` - Estado
- `address_city` - Ciudad
- `address_lat` - Latitud
- `address_lng` - Longitud
- `residence_type` - Tipo de residencia

### 🆘 Campos de Contacto de Emergencia
- `emergency_first_name` - Nombre del contacto
- `emergency_last_name` - Apellido paterno del contacto
- `emergency_second_last_name` - Apellido materno del contacto
- `emergency_relationship` - Relación (PADRE/MADRE/HERMANO/etc.)
- `emergency_phone` - Teléfono del contacto
- `emergency_email` - Email del contacto
- `emergency_lives_same_address` - Vive en la misma dirección

## 🛠️ Instalación y Configuración

### 1. Generar Plantilla de Excel

```bash
# Desde el directorio backend
python manage.py generar_plantilla_candidatos

# O con ruta personalizada
python manage.py generar_plantilla_candidatos --output mi_plantilla.xlsx
```

### 2. Endpoints Disponibles

#### Carga Masiva de Candidatos
```
POST /api/candidatos/crear_masiva_completa/
Content-Type: multipart/form-data
Body: file (Excel file)
```

#### Carga de Respuestas de Cuestionarios
```
POST /api/candidatos/respuestas_cuestionarios/
Content-Type: application/json
Body: {
  "responses": [
    {
      "candidate_id": 1,
      "cuestionario_id": 1,
      "pregunta_id": 5,
      "respuesta": "Respuesta del candidato"
    }
  ]
}
```

#### Obtener Mapeo de Cuestionarios
```
GET /api/candidatos/mapeo_cuestionarios/
```

## 📝 Formato del Excel

### Estructura Básica
El Excel debe contener columnas con los nombres exactos de los campos. Ejemplo:

| first_name | last_name | email | phone_number | stage | disability |
|------------|-----------|-------|--------------|-------|------------|
| Juan | Pérez | juan@email.com | 5551234567 | Reg | Intelectual |
| María | García | maria@email.com | 5559876543 | Pre | Física |

### Valores Especiales

#### Campos Booleanos
Aceptan: `true`, `si`, `sí`, `1`, `x`, `en trámite`, `yes`

#### Etapas
- `registro` → `Reg`
- `preentrevista` → `Pre`
- `entrevista` → `Ent`
- `capacitación` → `Cap`
- `agencia` → `Agn`
- `canalización` → `Can`

#### Géneros
- `masculino` → `M`
- `femenino` → `F`
- `otro` → `O`

#### Pensiones
- `no` → `No`
- `bienestar` → `Bie`
- `orfandad` → `Orf`
- `otra` → `Otr`

#### Seguridad Social
- `imss` → `IMSS`
- `issste` → `ISSSTE`
- `pemex` → `PEMEX`
- `imss-bienestar` → `IMSS-BIENESTAR`
- `particular` → `PARTICULAR`
- `otro` → `OTRO`
- `ninguno` → `NINGUNO`

#### Estados de Agencia
- `bolsa` → `Bol`
- `empleado` → `Emp`
- `desempleado` → `Des`

#### Tipos de Residencia
- `casa` → `CASA`
- `departamento` → `DEPARTAMENTO`
- `albergue` → `ALBERGUE`
- `institución` → `INSTITUCION`
- `otro` → `OTRO`

#### Relaciones de Emergencia
- `padre` → `PADRE`
- `madre` → `MADRE`
- `hermano` → `HERMANO`
- `hermana` → `HERMANA`
- `pareja` → `PAREJA`
- `abuelo` → `ABUELO`
- `abuela` → `ABUELA`
- `hijo` → `HIJO`
- `hija` → `HIJA`
- `otro familiar` → `OTRO FAM`
- `amigo` → `AMIGO`
- `amiga` → `AMIGA`
- `otro` → `OTRO`

## 🔄 Proceso de Carga Masiva

### Paso 1: Subir Excel de Candidatos
1. Selecciona el archivo Excel con los datos de candidatos
2. El sistema procesa y valida los datos
3. Se muestran los resultados de la carga

### Paso 2: Mapear Campos de Cuestionarios
1. El sistema presenta todos los cuestionarios disponibles
2. Asigna las preguntas de tu Excel a los campos correspondientes
3. Define qué columnas corresponden a qué preguntas

### Paso 3: Subir Respuestas de Cuestionarios
1. Revisa las respuestas extraídas del Excel
2. El sistema convierte y sube las respuestas al formato correcto
3. Se muestran los resultados del procesamiento

### Paso 4: Resumen Final
1. Vista completa de los resultados
2. Estadísticas de candidatos y respuestas procesadas
3. Opción para comenzar una nueva carga

## 📊 Manejo de Errores

### Errores de Validación
- Campos requeridos faltantes
- Formatos de fecha inválidos
- Valores no permitidos en campos específicos
- Emails duplicados

### Errores de Procesamiento
- Archivos corruptos
- Problemas de conexión
- Errores de base de datos

### Reporte de Errores
El sistema proporciona un reporte detallado con:
- Número de candidatos procesados exitosamente
- Lista de errores por fila
- Descripción específica de cada error

## 🎨 Interfaz de Usuario

### Componentes Principales
- **Stepper**: Proceso paso a paso
- **File Upload**: Carga de archivos Excel
- **Field Mapping**: Mapeo visual de campos
- **Data Preview**: Vista previa de datos
- **Results Summary**: Resumen de resultados

### Características de UX
- Validación en tiempo real
- Indicadores de progreso
- Mensajes de error claros
- Navegación intuitiva
- Diseño responsivo

## 🔧 Personalización

### Agregar Nuevos Campos
1. Actualizar el modelo `UserProfile`
2. Modificar `utils.py` para incluir el nuevo campo
3. Actualizar `CompleteBulkCandidateCreateSerializer`
4. Agregar el campo a la plantilla de Excel

### Modificar Validaciones
1. Editar las funciones de mapeo en `utils.py`
2. Actualizar los serializers según sea necesario
3. Modificar el frontend para nuevos tipos de campos

## 🚨 Consideraciones Importantes

### Rendimiento
- El sistema procesa archivos de hasta 1000 filas eficientemente
- Para archivos más grandes, considera dividirlos en lotes

### Seguridad
- Validación estricta de tipos de archivo
- Sanitización de datos de entrada
- Verificación de permisos de usuario

### Datos Sensibles
- Los emails se generan automáticamente si no se proporcionan
- Las contraseñas se hashean automáticamente
- Los datos médicos se manejan con confidencialidad

## 📞 Soporte

Para problemas o preguntas sobre la carga masiva:
1. Revisa los logs del sistema
2. Verifica el formato del Excel
3. Consulta la documentación de la API
4. Contacta al equipo de desarrollo

## 🔄 Actualizaciones Futuras

### Próximas Mejoras
- [ ] Soporte para archivos CSV
- [ ] Validación en tiempo real en el frontend
- [ ] Plantillas personalizables por centro
- [ ] Exportación de resultados a Excel
- [ ] Integración con sistemas externos
- [ ] Backup automático de datos
- [ ] Reportes avanzados de carga
- [ ] Notificaciones por email de resultados 