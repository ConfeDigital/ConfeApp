# Sistema de Cola para Respuestas de Cuestionarios

## Problema Actual

Actualmente, cuando un usuario responde múltiples preguntas rápidamente, las respuestas se envían al backend de forma paralela o con debounce individual, lo que puede causar:

- Respuestas llegando fuera de orden
- Conflictos en el backend
- Estados inconsistentes
- Pérdida de respuestas si hay errores de red

## Solución Propuesta: Sistema de Cola

### Concepto

Implementar una cola (queue) que procese las respuestas de forma secuencial, garantizando que:

1. Las respuestas se envíen en el orden correcto
2. Solo se procese una respuesta a la vez
3. Si hay un error, se reintente automáticamente
4. El usuario vea el estado de cada respuesta en tiempo real

### Flujo de Trabajo

```
Usuario responde Pregunta 1 → Se agrega a la cola
Usuario responde Pregunta 2 → Se agrega a la cola
Usuario responde Pregunta 3 → Se agrega a la cola

Cola procesa:
1. Envía Pregunta 1 → ✅ Éxito → Siguiente
2. Envía Pregunta 2 → ✅ Éxito → Siguiente
3. Envía Pregunta 3 → ❌ Error → Reintenta → ✅ Éxito
```

## Componentes del Sistema

### 1. Queue Manager

- Gestiona la cola de respuestas pendientes
- Controla el procesamiento secuencial
- Maneja reintentos en caso de error

### 2. Response State Manager

- Rastrea el estado de cada respuesta individual
- Muestra indicadores visuales (cargando, éxito, error)
- Persiste estados hasta que se complete el envío

### 3. Retry Logic

- Reintenta automáticamente respuestas fallidas
- Límite máximo de reintentos
- Backoff exponencial para evitar spam

## Beneficios

1. **Orden Garantizado**: Las respuestas siempre se procesan en el orden correcto
2. **Confiabilidad**: Sistema robusto con reintentos automáticos
3. **UX Mejorada**: Usuario ve el progreso de cada respuesta
4. **Prevención de Conflictos**: Evita condiciones de carrera en el backend
5. **Recuperación de Errores**: Manejo inteligente de fallos de red

## Implementación Técnica

### Estructura de la Cola

```javascript
const responseQueue = {
  items: [], // Array de respuestas pendientes
  processing: false, // Flag para controlar procesamiento
  currentItem: null, // Respuesta siendo procesada actualmente
};
```

### Estados de Respuesta

- `pending`: En cola, esperando procesamiento
- `processing`: Siendo enviada al backend
- `success`: Enviada exitosamente
- `error`: Error en el envío, pendiente de reintento
- `retrying`: Reintentando después de un error

### Indicadores Visuales

- 🔄 **Cargando**: Respuesta siendo procesada
- ✅ **Éxito**: Respuesta guardada correctamente
- ❌ **Error**: Error en el envío, se reintentará
- ⏳ **En Cola**: Respuesta esperando su turno
