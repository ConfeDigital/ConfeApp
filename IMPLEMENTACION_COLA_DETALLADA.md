# Implementación Detallada del Sistema de Cola

## Arquitectura del Sistema

### 1. ResponseQueue Hook

```javascript
const useResponseQueue = () => {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [responseStates, setResponseStates] = useState({});

  // Sistema de logging para la cola
  const logQueueEvent = (event, data = {}) => {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event,
      queueLength: queue.length,
      processing,
      ...data,
    };

    console.group(`🔄 [COLA] ${event} - ${timestamp}`);
    console.log("📊 Estado de la cola:", {
      itemsEnCola: queue.length,
      procesando: processing,
      estados: responseStates,
    });
    console.log("📝 Datos del evento:", logData);
    console.groupEnd();
  };

  // Agregar respuesta a la cola
  const enqueueResponse = (preguntaId, respuesta, metadata) => {
    const queueItem = {
      id: `${preguntaId}_${Date.now()}`,
      preguntaId,
      respuesta,
      metadata,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    setQueue((prev) => {
      const newQueue = [...prev, queueItem];
      logQueueEvent("RESPUESTA_AGREGADA", {
        preguntaId,
        posicionEnCola: newQueue.length,
        respuesta:
          typeof respuesta === "object" ? JSON.stringify(respuesta) : respuesta,
        colaCompleta: newQueue.map((item) => ({
          id: item.id,
          preguntaId: item.preguntaId,
          retryCount: item.retryCount,
        })),
      });
      return newQueue;
    });

    setResponseStates((prev) => ({
      ...prev,
      [preguntaId]: "pending",
    }));
  };

  // Procesar siguiente elemento de la cola
  const processNext = async () => {
    if (processing || queue.length === 0) return;

    setProcessing(true);
    const currentItem = queue[0];

    logQueueEvent("INICIANDO_PROCESAMIENTO", {
      preguntaId: currentItem.preguntaId,
      itemId: currentItem.id,
      retryCount: currentItem.retryCount,
      tiempoEnCola: Date.now() - currentItem.timestamp,
      colaRestante: queue.length - 1,
    });

    try {
      setResponseStates((prev) => ({
        ...prev,
        [currentItem.preguntaId]: "processing",
      }));

      logQueueEvent("ENVIANDO_AL_BACKEND", {
        preguntaId: currentItem.preguntaId,
        url: "/api/cuestionarios/respuestas/",
        payload: {
          usuario: currentItem.metadata.usuario,
          cuestionario: currentItem.metadata.cuestionario.id,
          pregunta: currentItem.preguntaId,
          respuesta: currentItem.respuesta,
        },
      });

      await sendResponseToAPI(currentItem);

      // Éxito: remover de la cola y marcar como exitoso
      setQueue((prev) => prev.slice(1));
      setResponseStates((prev) => ({
        ...prev,
        [currentItem.preguntaId]: "success",
      }));

      logQueueEvent("RESPUESTA_EXITOSA", {
        preguntaId: currentItem.preguntaId,
        tiempoTotal: Date.now() - currentItem.timestamp,
        colaRestante: queue.length - 1,
        siguienteEnCola: queue.length > 1 ? queue[1].preguntaId : null,
      });
    } catch (error) {
      // Error: incrementar contador de reintentos
      const updatedItem = {
        ...currentItem,
        retryCount: currentItem.retryCount + 1,
      };

      logQueueEvent("ERROR_EN_ENVIO", {
        preguntaId: currentItem.preguntaId,
        error: error.message,
        statusCode: error.response?.status,
        retryCount: updatedItem.retryCount,
        maxRetries: updatedItem.maxRetries,
        tiempoEnProcesamiento: Date.now() - currentItem.timestamp,
      });

      if (updatedItem.retryCount >= updatedItem.maxRetries) {
        // Máximo de reintentos alcanzado: marcar como error permanente
        setQueue((prev) => prev.slice(1));
        setResponseStates((prev) => ({
          ...prev,
          [currentItem.preguntaId]: "error",
        }));

        logQueueEvent("ERROR_PERMANENTE", {
          preguntaId: currentItem.preguntaId,
          reintentosRealizados: updatedItem.retryCount,
          tiempoTotal: Date.now() - currentItem.timestamp,
          colaRestante: queue.length - 1,
        });
      } else {
        // Reintentar: actualizar item en la cola
        setQueue((prev) => [updatedItem, ...prev.slice(1)]);
        setResponseStates((prev) => ({
          ...prev,
          [currentItem.preguntaId]: "retrying",
        }));

        logQueueEvent("PROGRAMANDO_REINTENTO", {
          preguntaId: currentItem.preguntaId,
          reintentoNumero: updatedItem.retryCount,
          delayReintento: 1000,
          nuevaPosicionEnCola: 1,
        });
      }
    } finally {
      setProcessing(false);
      // Procesar siguiente elemento después de un breve delay
      setTimeout(() => {
        logQueueEvent("PROCESAMIENTO_COMPLETADO", {
          colaRestante: queue.length - 1,
          procesandoSiguiente: queue.length > 1,
        });
        processNext();
      }, 100);
    }
  };

  return {
    enqueueResponse,
    responseStates,
    queueLength: queue.length,
    isProcessing: processing,
  };
};
```

### 2. Enhanced QuestionSubmitIndicator

```javascript
const QuestionSubmitIndicator = ({
  preguntaId,
  responseState,
  queuePosition,
}) => {
  const getIndicatorContent = () => {
    switch (responseState) {
      case "pending":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="caption" color="warning.main">
              En cola {queuePosition > 0 ? `(${queuePosition})` : ""}
            </Typography>
          </Box>
        );

      case "processing":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Guardando...
            </Typography>
          </Box>
        );

      case "success":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="caption" color="success.main">
              Guardado
            </Typography>
          </Box>
        );

      case "retrying":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RefreshIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="caption" color="warning.main">
              Reintentando...
            </Typography>
          </Box>
        );

      case "error":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon sx={{ color: "error.main", fontSize: 20 }} />
            <Typography variant="caption" color="error.main">
              Error al guardar
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: 1,
        py: 0.5,
      }}
    >
      {getIndicatorContent()}
    </Box>
  );
};
```

### 3. Queue Status Component

```javascript
const QueueStatus = ({ queueLength, isProcessing }) => {
  if (queueLength === 0 && !isProcessing) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        bgcolor: "background.paper",
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        zIndex: 1000,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {isProcessing ? "Procesando..." : `${queueLength} respuestas en cola`}
      </Typography>
      {queueLength > 0 && (
        <LinearProgress
          variant="determinate"
          value={isProcessing ? 50 : 0}
          sx={{ mt: 1, width: 200 }}
        />
      )}
    </Box>
  );
};
```

## Flujo de Datos

### 1. Usuario Responde Pregunta

```javascript
const handleRespuestaChange = (preguntaId, respuesta) => {
  // Actualizar estado local inmediatamente
  setRespuestas((prev) => ({
    ...prev,
    [preguntaId]: respuesta,
  }));

  // Agregar a la cola para envío al backend
  enqueueResponse(preguntaId, respuesta, {
    usuario,
    cuestionario,
    timestamp: Date.now(),
  });
};
```

### 2. Procesamiento de la Cola

```javascript
// Efecto que inicia el procesamiento cuando hay elementos en la cola
useEffect(() => {
  if (queue.length > 0 && !processing) {
    processNext();
  }
}, [queue.length, processing]);
```

### 3. Envío al Backend

```javascript
const sendResponseToAPI = async (queueItem) => {
  const { preguntaId, respuesta, metadata } = queueItem;

  // Procesar respuesta según el tipo de pregunta
  const respuestaParaEnviar = procesarRespuesta(respuesta, preguntaId);

  // Enviar al backend
  await api.post("/api/cuestionarios/respuestas/", {
    usuario: metadata.usuario,
    cuestionario: metadata.cuestionario.id,
    pregunta: preguntaId,
    respuesta: respuestaParaEnviar,
  });

  // Actualizar preguntas desbloqueadas
  updateUnlockedQuestions(preguntaId, respuesta);
};
```

## Configuración y Personalización

### Parámetros Configurables

```javascript
const QUEUE_CONFIG = {
  maxRetries: 3, // Máximo número de reintentos
  retryDelay: 1000, // Delay entre reintentos (ms)
  processDelay: 100, // Delay entre procesamiento de items (ms)
  maxQueueSize: 50, // Tamaño máximo de la cola
  autoRetry: true, // Reintento automático habilitado
  showQueueStatus: true, // Mostrar estado de la cola
};
```

### Manejo de Errores

```javascript
const handleQueueError = (error, queueItem) => {
  console.error(`Error procesando respuesta ${queueItem.preguntaId}:`, error);

  // Notificar al usuario sobre el error
  setNotificacion({
    mensaje: `Error al guardar la respuesta. Reintentando...`,
    tipo: "warning",
  });

  // Log para debugging
  if (error.response) {
    console.error("Backend response:", error.response.data);
  }
};
```

## Sistema de Logging Detallado

### Eventos de Log Registrados

El sistema registra los siguientes eventos en la consola del navegador:

#### 1. **RESPUESTA_AGREGADA**

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

#### 2. **INICIANDO_PROCESAMIENTO**

```javascript
🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 3, procesando: true, estados: {...} }
📝 Datos del evento: {
  preguntaId: 123,
  itemId: "123_1642245045123",
  retryCount: 0,
  tiempoEnCola: 77,
  colaRestante: 2
}
```

#### 3. **ENVIANDO_AL_BACKEND**

```javascript
🔄 [COLA] ENVIANDO_AL_BACKEND - 2024-01-15T10:30:45.250Z
📊 Estado de la cola: { itemsEnCola: 3, procesando: true, estados: {...} }
📝 Datos del evento: {
  preguntaId: 123,
  url: "/api/cuestionarios/respuestas/",
  payload: {
    usuario: 456,
    cuestionario: 789,
    pregunta: 123,
    respuesta: "Sí"
  }
}
```

#### 4. **RESPUESTA_EXITOSA**

```javascript
🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:46.100Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: false, estados: {...} }
📝 Datos del evento: {
  preguntaId: 123,
  tiempoTotal: 900,
  colaRestante: 2,
  siguienteEnCola: 124
}
```

#### 5. **ERROR_EN_ENVIO**

```javascript
🔄 [COLA] ERROR_EN_ENVIO - 2024-01-15T10:30:46.200Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: false, estados: {...} }
📝 Datos del evento: {
  preguntaId: 124,
  error: "Network Error",
  statusCode: undefined,
  retryCount: 1,
  maxRetries: 3,
  tiempoEnProcesamiento: 150
}
```

#### 6. **PROGRAMANDO_REINTENTO**

```javascript
🔄 [COLA] PROGRAMANDO_REINTENTO - 2024-01-15T10:30:46.250Z
📊 Estado de la cola: { itemsEnCola: 2, procesando: false, estados: {...} }
📝 Datos del evento: {
  preguntaId: 124,
  reintentoNumero: 1,
  delayReintento: 1000,
  nuevaPosicionEnCola: 1
}
```

#### 7. **ERROR_PERMANENTE**

```javascript
🔄 [COLA] ERROR_PERMANENTE - 2024-01-15T10:30:50.000Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {...} }
📝 Datos del evento: {
  preguntaId: 124,
  reintentosRealizados: 3,
  tiempoTotal: 5000,
  colaRestante: 1
}
```

#### 8. **PROCESAMIENTO_COMPLETADO**

```javascript
🔄 [COLA] PROCESAMIENTO_COMPLETADO - 2024-01-15T10:30:46.350Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {...} }
📝 Datos del evento: {
  colaRestante: 1,
  procesandoSiguiente: true
}
```

### Configuración de Logging

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

### Utilidades de Debugging

```javascript
// Función para obtener estadísticas de la cola
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

// Función para limpiar logs antiguos
const clearOldLogs = () => {
  console.clear();
  console.log("🧹 Logs de la cola limpiados");
};

// Función para exportar logs
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

### Ejemplo de Flujo Completo en Consola

```
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, posicionEnCola: 1, respuesta: "Sí", colaCompleta: [...] }

🔄 [COLA] INICIANDO_PROCESAMIENTO - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { preguntaId: 123, itemId: "123_1642245045123", retryCount: 0, tiempoEnCola: 77, colaRestante: 0 }

🔄 [COLA] ENVIANDO_AL_BACKEND - 2024-01-15T10:30:45.250Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { preguntaId: 123, url: "/api/cuestionarios/respuestas/", payload: {...} }

🔄 [COLA] RESPUESTA_EXITOSA - 2024-01-15T10:30:46.100Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"123": "success"} }
📝 Datos del evento: { preguntaId: 123, tiempoTotal: 900, colaRestante: 0, siguienteEnCola: null }

🔄 [COLA] PROCESAMIENTO_COMPLETADO - 2024-01-15T10:30:46.200Z
📊 Estado de la cola: { itemsEnCola: 0, procesando: false, estados: {"123": "success"} }
📝 Datos del evento: { colaRestante: 0, procesandoSiguiente: false }
```

## Beneficios de la Implementación

1. **Garantía de Orden**: Las respuestas se procesan secuencialmente
2. **Confiabilidad**: Sistema robusto con reintentos automáticos
3. **Feedback Visual**: Usuario ve el estado de cada respuesta
4. **Prevención de Pérdidas**: No se pierden respuestas por errores de red
5. **Escalabilidad**: Maneja múltiples respuestas simultáneas eficientemente
6. **Debugging Avanzado**: Sistema de logging detallado para troubleshooting
7. **Monitoreo en Tiempo Real**: Visibilidad completa del flujo de la cola
