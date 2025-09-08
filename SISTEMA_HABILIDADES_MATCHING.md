# Sistema de Habilidades y Matching - Agencia Laboral

## Descripción General

Este sistema implementa un mecanismo de habilidades para empleos y candidatos que permite hacer matching automático entre ofertas de trabajo y candidatos basado en sus competencias evaluadas.

## Componentes del Sistema

### 1. Modelos de Datos

#### Habilidad
- **Ubicación**: `agencia/models.py`
- **Descripción**: Representa las habilidades disponibles en el sistema
- **Campos**:
  - `nombre`: Nombre de la habilidad
  - `descripcion`: Descripción detallada
  - `categoria`: Categoría (técnica, blanda, física, cognitiva, social)
  - `es_activa`: Estado activo/inactivo
  - `fecha_creacion`: Fecha de creación

#### JobHabilidadRequerida
- **Ubicación**: `agencia/models.py`
- **Descripción**: Modelo intermedio que relaciona empleos con habilidades requeridas
- **Campos**:
  - `job`: Referencia al empleo
  - `habilidad`: Referencia a la habilidad
  - `nivel_importancia`: Esencial, Importante, Deseable
  - `fecha_asignacion`: Fecha de asignación

#### CandidatoHabilidadEvaluada
- **Ubicación**: `candidatos/models.py`
- **Descripción**: Modelo intermedio que relaciona candidatos con habilidades evaluadas
- **Campos**:
  - `candidato`: Referencia al candidato
  - `habilidad`: Referencia a la habilidad
  - `nivel_competencia`: Básico, Intermedio, Avanzado, Experto
  - `fecha_evaluacion`: Fecha de evaluación
  - `evaluado_por`: Usuario que realizó la evaluación
  - `observaciones`: Notas adicionales
  - `es_activa`: Estado activo/inactivo

### 2. API Endpoints

#### Gestión de Habilidades
- `GET /api/agencia/habilidades/` - Listar todas las habilidades
- `POST /api/agencia/habilidades/` - Crear nueva habilidad
- `GET /api/agencia/habilidades/{id}/` - Obtener habilidad específica
- `PUT /api/agencia/habilidades/{id}/` - Actualizar habilidad
- `DELETE /api/agencia/habilidades/{id}/` - Eliminar habilidad

#### Gestión de Habilidades de Empleos
- `GET /api/agencia/job-habilidades/` - Listar habilidades de empleos
- `POST /api/agencia/job-habilidades/` - Asignar habilidad a empleo
- `GET /api/agencia/job-habilidades/?job_id={id}` - Habilidades de un empleo específico

#### Gestión de Habilidades de Candidatos
- `GET /api/agencia/candidato-habilidades/` - Listar habilidades evaluadas
- `POST /api/agencia/candidato-habilidades/` - Evaluar habilidad de candidato
- `GET /api/agencia/candidato-habilidades/?candidato_id={id}` - Habilidades de un candidato específico

#### Matching
- `GET /api/agencia/jobs/{job_id}/matching-candidates/` - Candidatos que coinciden con un empleo
- `GET /api/agencia/candidatos/{candidato_id}/matching-jobs/` - Empleos que coinciden con un candidato

### 3. Algoritmo de Matching

El sistema utiliza un algoritmo de puntuación que considera:

1. **Nivel de Competencia del Candidato**:
   - Básico: 1 punto
   - Intermedio: 2 puntos
   - Avanzado: 3 puntos
   - Experto: 4 puntos

2. **Nivel de Importancia del Empleo**:
   - Esencial: 3 puntos
   - Importante: 2 puntos
   - Deseable: 1 punto

3. **Cálculo de Puntuación**:
   ```
   Puntuación = Nivel_Competencia × Nivel_Importancia
   ```

4. **Porcentaje de Matching**:
   ```
   Porcentaje = (Puntuación_Total / Puntuación_Máxima_Posible) × 100
   ```

### 4. Habilidades Iniciales

El sistema incluye 10 habilidades predefinidas:

1. **Comunicación Efectiva** (Blanda)
2. **Trabajo en Equipo** (Social)
3. **Resolución de Problemas** (Cognitiva)
4. **Adaptabilidad** (Blanda)
5. **Organización** (Cognitiva)
6. **Atención al Detalle** (Cognitiva)
7. **Manejo de Herramientas Básicas** (Técnica)
8. **Capacidad Física** (Física)
9. **Iniciativa** (Blanda)
10. **Puntualidad** (Blanda)

## Instalación y Configuración

### 1. Ejecutar Migraciones
```bash
python manage.py migrate
```

### 2. Poblar Habilidades Iniciales
```bash
python manage.py populate_habilidades
```

### 3. Configurar Permisos
- Los empleadores pueden gestionar habilidades de sus empleos
- El personal de agencia puede evaluar habilidades de candidatos
- Los candidatos pueden ver sus habilidades evaluadas

## Uso del Sistema

### Para Empleadores

1. **Crear Empleo con Habilidades**:
   ```json
   POST /api/agencia/jobs/
   {
     "name": "Asistente Administrativo",
     "company": 1,
     "job_description": "Apoyo en tareas administrativas",
     "habilidades_ids": [1, 2, 5, 6, 10]
   }
   ```

2. **Ver Candidatos Matching**:
   ```
   GET /api/agencia/jobs/1/matching-candidates/
   ```

### Para Personal de Agencia

1. **Evaluar Habilidades de Candidato**:
   ```json
   POST /api/agencia/candidato-habilidades/
   {
     "candidato": 1,
     "habilidad": 1,
     "nivel_competencia": "intermedio",
     "observaciones": "Se comunica bien en español"
   }
   ```

2. **Ver Empleos Matching para Candidato**:
   ```
   GET /api/agencia/candidatos/1/matching-jobs/
   ```

## Administración Django

### Habilidades
- Lista todas las habilidades con filtros por categoría
- Permite activar/desactivar habilidades
- Búsqueda por nombre y descripción

### Habilidades de Empleos
- Muestra empleos con sus habilidades requeridas
- Filtros por nivel de importancia y categoría
- Autocompletado para empleos y habilidades

### Habilidades de Candidatos
- Lista evaluaciones de habilidades por candidato
- Filtros por nivel de competencia y categoría
- Búsqueda por candidato y habilidad

## Consideraciones Técnicas

### Rendimiento
- Las consultas de matching utilizan `select_related` para optimizar
- Se filtran solo candidatos en estado 'Bol' (bolsa de trabajo)
- Los resultados se ordenan por puntuación de matching

### Seguridad
- Permisos específicos para empleadores y personal de agencia
- Validación de datos en serializers
- Filtrado por empresa para empleadores

### Escalabilidad
- El sistema está diseñado para manejar múltiples categorías de habilidades
- Fácil extensión para agregar nuevas habilidades
- Algoritmo de matching configurable

## Próximos Pasos

1. **Validación con Cliente**: Confirmar las 10 habilidades iniciales
2. **Interfaz de Usuario**: Desarrollar componentes frontend para gestión
3. **Reportes**: Implementar reportes de matching y estadísticas
4. **Notificaciones**: Sistema de alertas para nuevos matches
5. **Historial**: Tracking de cambios en habilidades y evaluaciones
