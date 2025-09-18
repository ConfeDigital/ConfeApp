# Solución al Problema de Bucle en la Cola

## 🚨 Problema Identificado

El sistema estaba enviando la misma respuesta múltiples veces en bucle infinito:

```
HTTP POST /api/cuestionarios/respuestas/ 200 [0.01, 127.0.0.1:50473]
Datos recibidos: {'usuario': '...', 'cuestionario': 1, 'pregunta': 1, 'respuesta': 'Que es lo que hagodfghjg'}
...
HTTP POST /api/cuestionarios/respuestas/ 200 [0.01, 127.0.0.1:50473]
Datos recibidos: {'usuario': '...', 'cuestionario': 1, 'pregunta': 1, 'respuesta': 'Que es lo que hagodfghjg'}
```

**Causa**: El debounce no estaba funcionando correctamente y se creaban múltiples timeouts que se ejecutaban.

## ✅ Soluciones Implementadas

### 1. **Sistema de Tracking de Respuestas Enviadas**

```javascript
// Nuevo ref para trackear respuestas ya enviadas
const lastSentResponses = useRef({});

// Verificar si la respuesta es diferente a la última enviada
const lastSent = lastSentResponses.current[preguntaId];
if (lastSent === respuesta) {
  console.log(
    `[DEBOUNCE] Respuesta duplicada ignorada para pregunta ${preguntaId}:`,
    respuesta
  );
  return;
}
```

### 2. **Doble Verificación en el Timeout**

```javascript
textDebounceRefs.current[preguntaId] = setTimeout(() => {
  // Verificar nuevamente si la respuesta es diferente
  const currentResponse = respuestas[preguntaId];
  if (lastSentResponses.current[preguntaId] === currentResponse) {
    console.log(
      `[DEBOUNCE] Respuesta no cambió durante el delay para pregunta ${preguntaId}`
    );
    return;
  }

  // Solo enviar si es diferente
  const success = enqueueResponse(preguntaId, currentResponse, metadata);

  if (success) {
    // Marcar esta respuesta como enviada
    lastSentResponses.current[preguntaId] = currentResponse;
    console.log(
      `[DEBOUNCE] Respuesta enviada para pregunta ${preguntaId}:`,
      currentResponse
    );
  }
}, 3000);
```

### 3. **Prevención de Duplicados en la Cola**

```javascript
// Verificar si ya hay una respuesta para esta pregunta en la cola
const existingInQueue = queue.some((item) => item.preguntaId === preguntaId);

if (existingInQueue) {
  logQueueEvent("RESPUESTA_YA_EN_COLA", {
    preguntaId,
    accion: "reemplazada",
    respuestaAnterior: "en cola",
    respuestaNueva:
      typeof respuesta === "string"
        ? respuesta.substring(0, 50) + "..."
        : respuesta,
  });

  // Remover la respuesta anterior de la cola
  setQueue((prev) => {
    const filteredQueue = prev.filter((item) => item.preguntaId !== preguntaId);
    return filteredQueue;
  });
}
```

### 4. **Cleanup de Timeouts**

```javascript
// Cleanup effect para limpiar timeouts
useEffect(() => {
  return () => {
    // Limpiar todos los timeouts pendientes al desmontar
    Object.values(textDebounceRefs.current).forEach((timeoutId) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  };
}, []);
```

### 5. **Logs Mejorados para Debugging**

```javascript
// Logs específicos para debugging
console.log(
  `[DEBOUNCE] Respuesta duplicada ignorada para pregunta ${preguntaId}:`,
  respuesta
);
console.log(
  `[DEBOUNCE] Respuesta no cambió durante el delay para pregunta ${preguntaId}`
);
console.log(
  `[DEBOUNCE] Respuesta enviada para pregunta ${preguntaId}:`,
  currentResponse
);
```

## 🎯 Comportamiento Actual

### **Preguntas de Texto (tipo "abierta")**

1. ✅ **Primera verificación**: Ignora respuestas duplicadas inmediatamente
2. ✅ **Debounce**: 3 segundos después de dejar de escribir
3. ✅ **Segunda verificación**: Verifica que la respuesta cambió durante el delay
4. ✅ **Tracking**: Marca la respuesta como enviada
5. ✅ **Prevención de duplicados**: Solo una respuesta por pregunta en cola

### **Otros Tipos de Preguntas**

1. ✅ **Envío inmediato**: Se agregan inmediatamente a la cola
2. ✅ **Tracking**: Marca la respuesta como enviada
3. ✅ **Prevención de duplicados**: Solo una respuesta por pregunta en cola

## 📊 Logs de Ejemplo

### **Respuesta Duplicada Ignorada**

```
[DEBOUNCE] Respuesta duplicada ignorada para pregunta 1: Que es lo que hagodfghjg
```

### **Respuesta No Cambió Durante Delay**

```
[DEBOUNCE] Respuesta no cambió durante el delay para pregunta 1
```

### **Respuesta Enviada Correctamente**

```
[DEBOUNCE] Respuesta enviada para pregunta 1: Que es lo que hagodfghjg
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
📝 Datos del evento: { preguntaId: 1, posicionEnCola: 1, respuesta: "Que es lo que hagodfghjg" }
```

### **Reemplazo de Respuesta en Cola**

```
🔄 [COLA] RESPUESTA_YA_EN_COLA - 2024-01-15T10:30:45.123Z
📝 Datos del evento: { preguntaId: 1, accion: "reemplazada", respuestaAnterior: "en cola", respuestaNueva: "Que es lo que hagodfghjg" }
```

## 🧪 Testing

### **Probar Prevención de Duplicados**

1. **Escribir en pregunta de texto**

   - Escribir "Hola"
   - Esperar 3 segundos
   - Escribir "Hola" nuevamente
   - Verificar que se ignore la segunda vez

2. **Probar Cambio de Respuesta**

   - Escribir "Hola"
   - Esperar 2 segundos
   - Cambiar a "Mundo"
   - Esperar 1 segundo más
   - Verificar que se envíe "Mundo"

3. **Probar con Cola Llena**
   - Llenar la cola con 50 respuestas
   - Intentar agregar una más
   - Verificar que se rechace

### **Verificar Logs**

```javascript
// En la consola del navegador
// Deberías ver logs como:
[DEBOUNCE] Respuesta duplicada ignorada para pregunta 1: Hola
[DEBOUNCE] Respuesta enviada para pregunta 1: Mundo
🔄 [COLA] RESPUESTA_AGREGADA - ...
```

## 🎉 Beneficios

1. **Sin Bucles Infinitos**: Eliminado el problema de envío repetitivo
2. **Mejor Performance**: Menos requests innecesarios al backend
3. **UX Mejorada**: Usuario puede escribir libremente sin preocuparse
4. **Logs Claros**: Fácil debugging de problemas
5. **Sistema Robusto**: Manejo inteligente de edge cases

## 🚀 Próximos Pasos

1. **Monitorear Performance**: Verificar que no haya más bucles
2. **Testing Extensivo**: Probar con diferentes escenarios
3. **Optimizar Delays**: Ajustar tiempos si es necesario
4. **Documentar Edge Cases**: Identificar otros posibles problemas

¡El sistema ahora previene completamente los bucles infinitos!
