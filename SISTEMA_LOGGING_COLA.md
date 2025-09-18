# Sistema de Logging para la Cola de Respuestas

## Visión General

El sistema de logging proporciona visibilidad completa del flujo de la cola de respuestas, permitiendo monitorear en tiempo real cómo se procesan las respuestas del usuario.

## Características del Sistema de Logging

### 🔍 **Logging Detallado**

- Cada evento de la cola se registra con timestamp
- Información completa del estado de la cola
- Datos específicos de cada operación
- Agrupación visual con `console.group()`

### 📊 **Métricas en Tiempo Real**

- Tiempo de procesamiento por respuesta
- Número de reintentos realizados
- Estado actual de cada pregunta
- Longitud de la cola en cada momento

### 🎯 **Eventos Rastreados**

| Evento                     | Descripción                            | Cuándo se Dispara                 |
| -------------------------- | -------------------------------------- | --------------------------------- |
| `RESPUESTA_AGREGADA`       | Nueva respuesta agregada a la cola     | Usuario responde una pregunta     |
| `INICIANDO_PROCESAMIENTO`  | Comienza a procesar una respuesta      | Se toma el primer item de la cola |
| `ENVIANDO_AL_BACKEND`      | Enviando request HTTP al backend       | Antes de hacer el POST            |
| `RESPUESTA_EXITOSA`        | Respuesta guardada exitosamente        | POST exitoso                      |
| `ERROR_EN_ENVIO`           | Error durante el envío                 | POST falla                        |
| `PROGRAMANDO_REINTENTO`    | Programando reintento después de error | Antes de reintentar               |
| `ERROR_PERMANENTE`         | Error después de agotar reintentos     | Máximo de reintentos alcanzado    |
| `PROCESAMIENTO_COMPLETADO` | Terminó de procesar un item            | Después de éxito o error          |

## Formato de los Logs

### Estructura Base

```javascript
🔄 [COLA] EVENTO - TIMESTAMP
📊 Estado de la cola: { ... }
📝 Datos del evento: { ... }
```

### Ejemplo Real

```javascript
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: {
  itemsEnCola: 2,
  procesando: false,
  estados: { "123": "pending", "124": "pending" }
}
📝 Datos del evento: {
  preguntaId: 125,
  posicionEnCola: 3,
  respuesta: "Sí",
  colaCompleta: [
    { id: "123_1642245045123", preguntaId: 123, retryCount: 0 },
    { id: "124_1642245045456", preguntaId: 124, retryCount: 0 },
    { id: "125_1642245045789", preguntaId: 125, retryCount: 0 }
  ]
}
```

## Configuración del Logging

### Configuración Básica

```javascript
const LOGGING_CONFIG = {
  enabled: true, // Habilitar/deshabilitar logs
  logLevel: "detailed", // 'minimal', 'detailed', 'debug'
  showTimestamps: true, // Mostrar timestamps
  showQueueState: true, // Mostrar estado completo de la cola
  showPayloads: true, // Mostrar payloads de requests
  groupLogs: true, // Agrupar logs con console.group
  maxLogHistory: 100, // Máximo número de logs en memoria
  logToServer: false, // Enviar logs al servidor
  logErrorsOnly: false, // Solo logear errores
};
```

### Niveles de Logging

#### `minimal`

- Solo eventos críticos (errores, éxitos)
- Información básica
- Sin detalles de payload

#### `detailed` (Recomendado)

- Todos los eventos importantes
- Estado de la cola
- Información de timing
- Payloads de requests

#### `debug`

- Información completa
- Estados internos
- Datos de debugging
- Logs de performance

## Utilidades de Debugging

### 1. Estadísticas de la Cola

```javascript
const getQueueStats = () => {
  const stats = {
    totalProcessed: 0,
    totalErrors: 0,
    totalRetries: 0,
    averageProcessingTime: 0,
    currentQueueLength: queue.length,
    processingStates: Object.values(responseStates).reduce((acc, state) => {
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {}),
  };

  console.log("📊 Estadísticas de la Cola:", stats);
  return stats;
};
```

### 2. Limpiar Logs

```javascript
const clearOldLogs = () => {
  console.clear();
  console.log("🧹 Logs de la cola limpiados");
};
```

### 3. Exportar Logs

```javascript
const exportLogs = () => {
  const logs = getLogHistory();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cola-logs-${Date.now()}.json`;
  link.click();
};
```

### 4. Monitoreo en Tiempo Real

```javascript
const startRealTimeMonitoring = () => {
  setInterval(() => {
    const stats = getQueueStats();
    if (stats.currentQueueLength > 0) {
      console.log(
        `⏱️ [MONITOR] Cola activa: ${stats.currentQueueLength} items`
      );
    }
  }, 5000); // Cada 5 segundos
};
```

## Casos de Uso del Logging

### 1. **Debugging de Problemas**

```javascript
// Usuario reporta que una respuesta no se guardó
// Revisar logs para ver:
// - ¿Se agregó a la cola?
// - ¿Se procesó?
// - ¿Hubo errores?
// - ¿Se reintentó?
```

### 2. **Optimización de Performance**

```javascript
// Analizar tiempos de procesamiento
// Identificar cuellos de botella
// Optimizar delays y timeouts
```

### 3. **Monitoreo de Errores**

```javascript
// Detectar patrones de errores
// Identificar problemas de red
// Monitorear reintentos
```

### 4. **Validación de Flujo**

```javascript
// Verificar que las respuestas se procesen en orden
// Confirmar que no se pierdan respuestas
// Validar estados de UI
```

## Ejemplos de Flujos Completos

### Flujo Exitoso

```
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, posicionEnCola: 1, respuesta: "Sí" }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { preguntaId: 123, tiempoEnCola: 77, colaRestante: 0 }

🔄 [COLA] ENVIANDO_AL_BACKEND - 2024-01-15T10:30:45.250Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { preguntaId: 123, url: "/api/cuestionarios/respuestas/", payload: {...} }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:46.100Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"123": "success"} }
📝 Datos del evento: { preguntaId: 123, tiempoTotal: 900, colaRestante: 0 }

🔄 [COLA] PROCESAMIENTO_COMPLETADO - 2024-01-15T10:30:46.200Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"123": "success"} }
📝 Datos del evento: { colaRestante: 0, procesandoSiguiente: false }
```

### Flujo con Error y Reintento

```
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"124": "pending"} }
📝 Datos del evento: { preguntaId: 124, posicionEnCola: 1, respuesta: "No" }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"124": "processing"} }
📝 Datos del evento: { preguntaId: 124, tiempoEnCola: 77, colaRestante: 0 }

🔄 [COLA] ENVIANDO_AL_BACKEND - 2024-01-15T10:30:45.250Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"124": "processing"} }
📝 Datos del evento: { preguntaId: 124, url: "/api/cuestionarios/respuestas/", payload: {...} }

🔄 [COLA] ERROR_EN_ENVIO - 2024-01-15T10:30:46.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"124": "retrying"} }
📝 Datos del evento: { preguntaId: 124, error: "Network Error", retryCount: 1, maxRetries: 3 }

🔄 [COLA] PROGRAMANDO_REINTENTO - 2024-01-15T10:30:46.250Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"124": "retrying"} }
📝 Datos del evento: { preguntaId: 124, reintentoNumero: 1, delayReintento: 1000 }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:47.250Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"124": "processing"} }
📝 Datos del evento: { preguntaId: 124, tiempoEnCola: 2127, colaRestante: 0 }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:48.100Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"124": "success"} }
📝 Datos del evento: { preguntaId: 124, tiempoTotal: 2977, colaRestante: 0 }
```

### Flujo con Múltiples Respuestas

```
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, posicionEnCola: 1, respuesta: "Sí" }

🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: false, estados: {"123": "pending", "124": "pending"} }
📝 Datos del evento: { preguntaId: 124, posicionEnCola: 2, respuesta: "No" }

🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.300Z
📊 Estado de la cola: { itemsEnCola: 3, procesando: false, estados: {"123": "pending", "124": "pending", "125": "pending"} }
📝 Datos del evento: { preguntaId: 125, posicionEnCola: 3, respuesta: "Tal vez" }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:45.400Z
📊 Estado de la cola: { itemsEnCola: 3, procesando: true, estados: {"123": "processing", "124": "pending", "125": "pending"} }
📝 Datos del evento: { preguntaId: 123, tiempoEnCola: 277, colaRestante: 2 }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:46.200Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: false, estados: {"123": "success", "124": "pending", "125": "pending"} }
📝 Datos del evento: { preguntaId: 123, tiempoTotal: 1000, colaRestante: 2, siguienteEnCola: 124 }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:46.300Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: true, estados: {"123": "success", "124": "processing", "125": "pending"} }
📝 Datos del evento: { preguntaId: 124, tiempoEnCola: 1100, colaRestante: 1 }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:47.100Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "success", "124": "success", "125": "pending"} }
📝 Datos del evento: { preguntaId: 124, tiempoTotal: 1900, colaRestante: 1, siguienteEnCola: 125 }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:47.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "success", "124": "success", "125": "processing"} }
📝 Datos del evento: { preguntaId: 125, tiempoEnCola: 1900, colaRestante: 0 }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:48.000Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"123": "success", "124": "success", "125": "success"} }
📝 Datos del evento: { preguntaId: 125, tiempoTotal: 2700, colaRestante: 0, siguienteEnCola: null }
```

## Beneficios del Sistema de Logging

1. **🔍 Debugging Eficiente**: Identificación rápida de problemas
2. **📊 Monitoreo en Tiempo Real**: Visibilidad completa del flujo
3. **📈 Análisis de Performance**: Métricas detalladas de timing
4. **🛠️ Troubleshooting**: Información completa para resolver issues
5. **📋 Auditoría**: Registro completo de todas las operaciones
6. **🎯 Optimización**: Datos para mejorar el sistema
7. **📱 Soporte al Usuario**: Información para ayudar con problemas reportados
