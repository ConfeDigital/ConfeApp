# Sistema de Debounce Inteligente

## 🎯 Objetivo

Implementar un sistema que permita escribir libremente en preguntas de texto sin que se ignoren las respuestas por throttling, pero que espere a que el usuario deje de escribir antes de enviar.

## 🚨 Problema Anterior

El sistema de throttling ignoraba respuestas si se enviaban muy rápido, lo que causaba que las respuestas se perdieran cuando el usuario escribía continuamente.

```javascript
// PROBLEMA: Throttling ignoraba respuestas
if (lastTime && timeSinceLastEnqueue < 2000) {
  console.log("Respuesta ignorada por throttling");
  return; // ← Se perdía la respuesta
}
```

## ✅ Nueva Solución: Debounce Inteligente

### **1. Sistema Diferenciado por Tipo de Pregunta**

```javascript
// Para preguntas de texto (tipo "abierta")
if (preguntaActual.tipo === "abierta") {
  // Usar debounce - esperar a que deje de escribir
  // ...
} else {
  // Para otros tipos, usar throttling
  // ...
}
```

### **2. Debounce para Preguntas de Texto**

```javascript
// Limpiar timeout anterior si existe
if (textDebounceRefs.current[preguntaId]) {
  clearTimeout(textDebounceRefs.current[preguntaId]);
}

// Marcar que hay una respuesta pendiente
pendingResponses.current[preguntaId] = {
  respuesta,
  timestamp: now,
  metadata: {
    /* ... */
  },
};

// Crear nuevo timeout con delay
textDebounceRefs.current[preguntaId] = setTimeout(() => {
  // Procesar la respuesta pendiente
  const pending = pendingResponses.current[preguntaId];
  if (pending) {
    enqueueResponse(preguntaId, pending.respuesta, pending.metadata);
  }
}, 2000); // 2 segundos de delay
```

### **3. Throttling para Otros Tipos**

```javascript
// Para preguntas de opción múltiple, etc.
const timeSinceLastEnqueue = now - (lastTime || 0);

// Throttling: solo permitir envío cada 1 segundo
if (lastTime && timeSinceLastEnqueue < 1000) {
  console.log("Respuesta ignorada por throttling");
  return;
}
```

## 🎯 Comportamiento Actual

### **Preguntas de Texto (tipo "abierta")**

1. ✅ **Debounce**: Espera 2 segundos después de dejar de escribir
2. ✅ **No se ignoran**: Todas las respuestas se guardan como pendientes
3. ✅ **Última respuesta**: Solo se envía la última versión
4. ✅ **Logs claros**: "Respuesta pendiente" → "Respuesta enviada"

### **Otros Tipos de Preguntas**

1. ✅ **Throttling**: Solo permite envío cada 1 segundo
2. ✅ **Prevención de duplicados**: Ignora respuestas idénticas
3. ✅ **Envío inmediato**: Se procesan sin delay

## 📊 Logs de Ejemplo

### **Pregunta de Texto - Escribiendo Continuamente**

```
[DEBOUNCE] Respuesta pendiente para pregunta 1: H...
[DEBOUNCE] Respuesta pendiente para pregunta 1: Ho...
[DEBOUNCE] Respuesta pendiente para pregunta 1: Hol...
[DEBOUNCE] Respuesta pendiente para pregunta 1: Hola...
[DEBOUNCE] Respuesta enviada para pregunta 1: Hola...
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
```

### **Pregunta de Opción Múltiple - Selección Rápida**

```
[THROTTLE] Respuesta ignorada por throttling para pregunta 2. Tiempo desde último envío: 500ms
[COLA] Respuesta agregada para pregunta 2: opcion1
🔄 [COLA] RESPUESTA_AGREGADA - 2024-01-15T10:30:45.123Z
```

## 🔧 Configuración

### **Delays Configurables**

```javascript
// Para preguntas de texto
const DEBOUNCE_DELAY = 2000; // 2 segundos

// Para otros tipos
const THROTTLE_DELAY = 1000; // 1 segundo
```

### **Estados de Respuestas**

```javascript
const pendingResponses = useRef({}); // Respuestas pendientes
const textDebounceRefs = useRef({}); // Timeouts de debounce
const lastSentResponses = useRef({}); // Últimas respuestas enviadas
```

## 🧪 Testing

### **Probar Preguntas de Texto**

1. **Escribir continuamente**

   - Escribir "H" → "Ho" → "Hol" → "Hola"
   - Verificar que se muestren logs de "Respuesta pendiente"
   - Esperar 2 segundos sin escribir
   - Verificar que se envíe solo "Hola"

2. **Cambiar de pregunta**

   - Escribir en pregunta 1
   - Cambiar a pregunta 2
   - Verificar que pregunta 1 se envíe automáticamente

3. **Verificar logs**
   ```
   [DEBOUNCE] Respuesta pendiente para pregunta 1: H...
   [DEBOUNCE] Respuesta pendiente para pregunta 1: Ho...
   [DEBOUNCE] Respuesta enviada para pregunta 1: Ho...
   ```

### **Probar Otros Tipos de Preguntas**

1. **Seleccionar opciones rápidamente**

   - Seleccionar opción 1
   - Inmediatamente seleccionar opción 2
   - Verificar que solo se envíe opción 2

2. **Verificar logs**
   ```
   [THROTTLE] Respuesta ignorada por throttling para pregunta 2. Tiempo desde último envío: 500ms
   [COLA] Respuesta agregada para pregunta 2: opcion2
   ```

## 🎉 Beneficios

### **1. Mejor UX para Texto**

- ✅ **Escribir libremente**: Usuario puede escribir sin preocuparse
- ✅ **No se pierden respuestas**: Todas se guardan como pendientes
- ✅ **Última versión**: Solo se envía la versión final

### **2. Performance Optimizada**

- ✅ **Menos requests**: Solo se envía la respuesta final
- ✅ **Throttling inteligente**: Diferentes estrategias por tipo
- ✅ **Cleanup automático**: Timeouts se limpian correctamente

### **3. Logs Informativos**

- ✅ **Debugging fácil**: Logs claros de cada paso
- ✅ **Monitoreo**: Fácil identificar problemas
- ✅ **Transparencia**: Usuario puede ver qué está pasando

## 🚀 Próximos Pasos

1. **Monitorear Performance**: Verificar que funciona correctamente
2. **Ajustar Delays**: Modificar tiempos si es necesario
3. **Testing Extensivo**: Probar con diferentes escenarios
4. **Optimizar Logs**: Reducir verbosidad si es necesario

## 💡 Casos de Uso

### **Escenario 1: Usuario Escribiendo Rápidamente**

```
Usuario escribe: "H" → "Ho" → "Hol" → "Hola" → "Hola mundo"
Sistema: Guarda "Hola mundo" como pendiente
Después de 2 segundos: Envía "Hola mundo"
```

### **Escenario 2: Usuario Cambiando de Pregunta**

```
Usuario escribe: "Test" en pregunta 1
Usuario cambia a pregunta 2
Sistema: Envía "Test" inmediatamente
```

### **Escenario 3: Usuario Seleccionando Opciones**

```
Usuario selecciona: Opción A → Opción B (rápidamente)
Sistema: Ignora Opción A, envía Opción B
```

¡El sistema ahora maneja inteligentemente diferentes tipos de preguntas con estrategias optimizadas para cada caso!
