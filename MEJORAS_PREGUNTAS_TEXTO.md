# Mejoras para Preguntas de Texto

## 🚨 Problema Identificado

Las preguntas de texto (tipo "abierta") estaban causando problemas porque:

1. **Spam de Requests**: Cada carácter escrito generaba un request al backend
2. **Bloqueo de Base de Datos**: SQLite se bloqueaba con `database is locked`
3. **Múltiples Respuestas en Cola**: La misma pregunta tenía múltiples respuestas pendientes

## ✅ Soluciones Implementadas

### 1. **Debounce Agresivo para Texto**

```javascript
// Para preguntas de texto, usar debounce más agresivo
if (preguntaActual.tipo === "abierta") {
  // Limpiar timeout anterior si existe
  if (textDebounceRefs.current[preguntaId]) {
    clearTimeout(textDebounceRefs.current[preguntaId]);
  }

  // Crear nuevo timeout con delay más largo para texto
  textDebounceRefs.current[preguntaId] = setTimeout(() => {
    // Agregar a la cola solo después de 3 segundos sin escribir
    enqueueResponse(preguntaId, respuesta, metadata);
  }, 3000); // 3 segundos de delay
}
```

### 2. **Prevención de Duplicados en Cola**

```javascript
// Para preguntas de texto, verificar si ya hay una respuesta pendiente
if (preguntaActual && preguntaActual.tipo === "abierta") {
  const existingInQueue = queue.some((item) => item.preguntaId === preguntaId);
  if (existingInQueue) {
    // Remover la respuesta anterior de la cola
    setQueue((prev) => {
      const filteredQueue = prev.filter(
        (item) => item.preguntaId !== preguntaId
      );
      return filteredQueue;
    });
  }
}
```

### 3. **Logs Mejorados para Texto**

```javascript
logQueueEvent("RESPUESTA_TEXTO_YA_EN_COLA", {
  preguntaId,
  accion: "reemplazada",
  respuestaAnterior: "en cola",
  respuestaNueva:
    typeof respuesta === "string"
      ? respuesta.substring(0, 50) + "..."
      : respuesta,
});
```

### 4. **Truncamiento de Texto en Logs**

```javascript
respuesta: typeof respuesta === "string" && respuesta.length > 50
  ? respuesta.substring(0, 50) + "..."
  : respuesta;
```

## 🎯 Comportamiento Actual

### **Preguntas de Texto (tipo "abierta")**

- ✅ **Debounce**: 3 segundos después de dejar de escribir
- ✅ **Prevención de duplicados**: Solo una respuesta por pregunta en cola
- ✅ **Reemplazo inteligente**: Nueva respuesta reemplaza la anterior
- ✅ **Logs truncados**: Texto largo se muestra como "primeros 50 caracteres..."

### **Otros Tipos de Preguntas**

- ✅ **Sin debounce**: Se agregan inmediatamente a la cola
- ✅ **Procesamiento normal**: FIFO como antes

### **Preguntas SIS (observaciones)**

- ✅ **Debounce**: 2 segundos después de dejar de escribir
- ✅ **Sistema de cola**: Usa el mismo sistema que las demás

## 📊 Logs de Ejemplo

### **Pregunta de Texto Normal**

```
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, posicionEnCola: 1, respuesta: "Esta es mi respuesta..." }
```

### **Reemplazo de Respuesta de Texto**

```
🔄 [COLA] RESPUESTA_TEXTO_YA_EN_COLA - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, accion: "reemplazada", respuestaAnterior: "en cola", respuestaNueva: "Esta es mi nueva respuesta más larga..." }

🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.200Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: false, estados: {"123": "pending"} }
📝 Datos del evento: { preguntaId: 123, posicionEnCola: 1, respuesta: "Esta es mi nueva respuesta más larga..." }
```

## 🔧 Configuración

### **Delays Configurables**

```javascript
// En Preguntas.jsx
setTimeout(() => {
  // Agregar a cola
}, 3000); // 3 segundos para preguntas de texto

// En handleSISTextChange
setTimeout(() => {
  // Agregar a cola
}, 2000); // 2 segundos para observaciones SIS
```

### **Límites de Cola**

```javascript
// En useResponseQueue.js
const QUEUE_CONFIG = {
  maxQueueSize: 50, // Máximo 50 items en cola
  maxRetries: 3, // Máximo 3 reintentos
};
```

## 🧪 Testing

### **Probar Preguntas de Texto**

1. **Escribir texto rápidamente**

   - Escribir varios caracteres seguidos
   - Verificar que no se generen múltiples requests
   - Confirmar que solo se envía después de 3 segundos sin escribir

2. **Probar reemplazo de respuestas**

   - Escribir una respuesta
   - Esperar a que se agregue a la cola
   - Escribir una nueva respuesta antes de que se procese
   - Verificar que la anterior se reemplace

3. **Probar con lag simulado**
   ```javascript
   window.queueLagControl.slow();
   // Escribir en pregunta de texto
   // Observar logs de reemplazo
   ```

### **Probar Otros Tipos de Preguntas**

1. **Preguntas de opción múltiple**

   - Seleccionar opciones rápidamente
   - Verificar que se procesen inmediatamente
   - Confirmar orden FIFO

2. **Preguntas SIS**
   - Escribir en observaciones
   - Verificar debounce de 2 segundos
   - Confirmar procesamiento en cola

## 🎉 Beneficios

1. **Sin Bloqueos de BD**: Eliminado el error `database is locked`
2. **Menos Requests**: Reducción drástica de requests para texto
3. **Mejor UX**: Usuario puede escribir libremente sin interrupciones
4. **Logs Limpios**: Información clara sobre reemplazos y procesamiento
5. **Sistema Robusto**: Manejo inteligente de diferentes tipos de preguntas

## 🚀 Próximos Pasos

1. **Monitorear Performance**: Verificar que no haya más bloqueos de BD
2. **Ajustar Delays**: Si es necesario, modificar los tiempos de debounce
3. **Optimizar Logs**: Considerar truncamiento más inteligente
4. **Testing Extensivo**: Probar con diferentes tipos de preguntas y usuarios

¡El sistema ahora maneja las preguntas de texto de manera inteligente y eficiente!
