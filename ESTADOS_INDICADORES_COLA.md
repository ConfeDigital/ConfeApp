# Estados e Indicadores del Sistema de Cola

## Estados de Respuesta

### 1. `pending` - En Cola

**Descripción**: La respuesta está en la cola esperando ser procesada.

**Indicador Visual**:

- 🕐 Ícono: `HourglassEmptyIcon` (color: warning.main)
- 📝 Texto: "En cola" + posición en cola si aplica
- 🎨 Color: Naranja/Amarillo

**Comportamiento**:

- Se muestra cuando la respuesta se agrega a la cola
- Puede mostrar la posición en la cola (ej: "En cola (3)")
- Persiste hasta que comience el procesamiento

### 2. `processing` - Procesando

**Descripción**: La respuesta está siendo enviada al backend.

**Indicador Visual**:

- 🔄 Ícono: `CircularProgress` (spinner)
- 📝 Texto: "Guardando..."
- 🎨 Color: Gris/Neutral

**Comportamiento**:

- Se muestra durante el envío HTTP
- Duración típica: 200-2000ms dependiendo de la red
- Se reemplaza por `success` o `error` al finalizar

### 3. `success` - Exitoso

**Descripción**: La respuesta se guardó correctamente en el backend.

**Indicador Visual**:

- ✅ Ícono: `CheckCircleIcon` (color: success.main)
- 📝 Texto: "Guardado"
- 🎨 Color: Verde

**Comportamiento**:

- Se muestra cuando el POST es exitoso
- **Persiste permanentemente** (no desaparece)
- Indica que la respuesta está segura en el backend

### 4. `retrying` - Reintentando

**Descripción**: Hubo un error y se está reintentando el envío.

**Indicador Visual**:

- 🔄 Ícono: `RefreshIcon` (color: warning.main)
- 📝 Texto: "Reintentando..."
- 🎨 Color: Naranja/Amarillo

**Comportamiento**:

- Se muestra después de un error, antes del reintento
- Duración: 1-3 segundos (delay de reintento)
- Se convierte en `processing` durante el reintento

### 5. `error` - Error Permanente

**Descripción**: Error después de agotar todos los reintentos.

**Indicador Visual**:

- ❌ Ícono: `ErrorIcon` (color: error.main)
- 📝 Texto: "Error al guardar"
- 🎨 Color: Rojo

**Comportamiento**:

- Se muestra cuando se agotan los reintentos (máximo 3)
- **Persiste hasta nueva acción del usuario**
- Requiere intervención manual para resolver

## Flujo de Estados

```
Usuario responde → pending → processing → success
                                    ↓
                              error → retrying → processing → success
                                    ↓
                              error (máximo reintentos)
```

## Indicadores Adicionales

### Queue Status (Estado de la Cola)

**Ubicación**: Esquina inferior derecha (fixed position)

**Estados**:

1. **Cola Vacía**: No se muestra
2. **Elementos en Cola**:
   - 📊 Texto: "X respuestas en cola"
   - 📈 Barra de progreso estática
3. **Procesando**:
   - 🔄 Texto: "Procesando..."
   - 📈 Barra de progreso animada

### Posición en Cola

**Cuándo se muestra**: Solo para estado `pending`

**Formato**: "En cola (2)" donde 2 es la posición

**Lógica**:

- Posición 0: "Procesando..."
- Posición 1: "En cola (1)"
- Posición 2: "En cola (2)"
- etc.

## Configuración de Tiempos

### Delays Configurables

```javascript
const TIMING_CONFIG = {
  processDelay: 100, // ms entre procesamiento de items
  retryDelay: 1000, // ms antes de reintentar
  successDisplayTime: -1, // -1 = permanente, >0 = segundos
  errorDisplayTime: -1, // -1 = permanente, >0 = segundos
  queueUpdateInterval: 100, // ms para actualizar posición en cola
};
```

### Tiempos Típicos

- **pending → processing**: 0-100ms
- **processing → success**: 200-2000ms (depende de red)
- **error → retrying**: 1000ms
- **retrying → processing**: 0-100ms

## Casos Especiales

### Respuestas Rápidas Consecutivas

```
Usuario: Pregunta 1 → Pregunta 2 → Pregunta 3 (en 1 segundo)

Cola:
1. Pregunta 1: pending → processing → success
2. Pregunta 2: pending → processing → success
3. Pregunta 3: pending → processing → success

Indicadores:
- Pregunta 1: ✅ Guardado
- Pregunta 2: ✅ Guardado
- Pregunta 3: ✅ Guardado
```

### Error de Red

```
Usuario: Pregunta 1 → Pregunta 2

Cola:
1. Pregunta 1: pending → processing → error → retrying → processing → success
2. Pregunta 2: pending → processing → success

Indicadores:
- Pregunta 1: ✅ Guardado (después de reintento)
- Pregunta 2: ✅ Guardado
```

### Error Permanente

```
Usuario: Pregunta 1

Cola:
1. Pregunta 1: pending → processing → error → retrying → processing → error → retrying → processing → error

Indicadores:
- Pregunta 1: ❌ Error al guardar (después de 3 reintentos)
```

## Accesibilidad

### ARIA Labels

```javascript
const getAriaLabel = (state, queuePosition) => {
  switch (state) {
    case "pending":
      return `Respuesta en cola, posición ${queuePosition}`;
    case "processing":
      return "Guardando respuesta";
    case "success":
      return "Respuesta guardada exitosamente";
    case "retrying":
      return "Reintentando guardar respuesta";
    case "error":
      return "Error al guardar respuesta";
    default:
      return "";
  }
};
```

### Colores Accesibles

- **Success**: Verde con contraste 4.5:1 mínimo
- **Warning**: Naranja con contraste 3:1 mínimo
- **Error**: Rojo con contraste 4.5:1 mínimo
- **Neutral**: Gris con contraste 3:1 mínimo

## Responsive Design

### Mobile

- Indicadores más pequeños (16px icons)
- Texto más corto ("En cola" vs "En cola (3)")
- Queue status en bottom center

### Desktop

- Indicadores estándar (20px icons)
- Texto completo con posición
- Queue status en bottom right
