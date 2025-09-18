# Sistema de Lag para Testing

## ⚠️ Estado Actual: LAG DESHABILITADO

**El sistema de lag simulado está actualmente DESHABILITADO** para uso en producción. Las respuestas se procesan sin delay simulado.

## 🌐 Simulación de Lag de Red

El sistema de cola incluye un sistema de simulación de lag de red que te permite probar cómo se comporta el sistema con diferentes velocidades de conexión. **Actualmente está deshabilitado**.

## ⚙️ Configuración

### Configuración por Defecto

```javascript
const QUEUE_CONFIG = {
  simulateNetworkLag: false, // ❌ DESHABILITADO - Sin lag simulado
  networkLagMs: 0, // Lag base: 0 segundos
  randomLagVariation: 0, // Variación aleatoria: 0ms adicionales
};
```

### Cómo Funciona

- **Lag Base**: Tiempo mínimo de delay (ej: 0ms - DESHABILITADO)
- **Variación Aleatoria**: Tiempo adicional aleatorio (ej: 0ms - DESHABILITADO)
- **Lag Total**: Sin delay simulado - Respuestas se procesan inmediatamente

## 🎮 Control desde la Consola

### Funciones Disponibles

```javascript
// Acceder al control de lag
window.queueLagControl;
```

### Comandos Básicos

#### 1. **Configurar Lag Personalizado**

```javascript
// Lag de 1 segundo base + 500ms variación
window.queueLagControl.setLag(1000, 500);

// Solo lag base, sin variación
window.queueLagControl.setLag(2000, 0);
```

#### 2. **Presets Predefinidos**

```javascript
// Conexión rápida (500ms + 200ms variación)
window.queueLagControl.fast();

// Conexión normal (1.5s + 500ms variación)
window.queueLagControl.normal();

// Conexión lenta (3s + 1s variación)
window.queueLagControl.slow();

// Conexión muy lenta (5s + 2s variación)
window.queueLagControl.verySlow();
```

#### 3. **Habilitar/Deshabilitar**

```javascript
// Habilitar simulación de lag
window.queueLagControl.enable();

// Deshabilitar simulación de lag
window.queueLagControl.disable();
```

#### 4. **Ver Configuración Actual**

```javascript
// Ver configuración actual
window.queueLagControl.getConfig();
```

## 📊 Logs de Lag

Cuando el lag está habilitado, verás logs adicionales en la consola:

```
🔄 [COLA] SIMULANDO_LAG - 2024-01-15T10:30:45.123Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { lagBase: 2000, lagVariacion: 750, lagTotal: 2750 }

🔄 [COLA] ENVIANDO_AL_BACKEND - 2024-01-15T10:30:47.873Z
📊 Estado de la cola: { itemsEnCola: 1, procesando: true, estados: {"123": "processing"} }
📝 Datos del evento: { preguntaId: 123, url: "/api/cuestionarios/respuestas/", payload: {...} }
```

## 🧪 Casos de Prueba

### 1. **Probar Cola con Lag Normal**

```javascript
// Configurar lag normal
window.queueLagControl.normal();

// Responder 3-4 preguntas rápidamente
// Observar que se procesan en orden con delay
```

### 2. **Probar Cola con Lag Muy Lento**

```javascript
// Configurar lag muy lento
window.queueLagControl.verySlow();

// Responder múltiples preguntas
// Ver cómo se acumula la cola
// Observar los estados visuales
```

### 3. **Probar Sin Lag (Conexión Rápida)**

```javascript
// Deshabilitar lag
window.queueLagControl.disable();

// Responder preguntas
// Ver procesamiento inmediato
```

### 4. **Probar Variación de Lag**

```javascript
// Lag con mucha variación
window.queueLagControl.setLag(1000, 2000);

// Responder preguntas
// Observar tiempos variables (1-3 segundos)
```

## 🎯 Escenarios de Testing

### Escenario 1: Usuario con Conexión Lenta

```javascript
// Simular conexión lenta
window.queueLagControl.slow();

// Usuario responde 5 preguntas seguidas
// Observar:
// - Cola se llena
// - Estados visuales cambian
// - Logs muestran procesamiento secuencial
// - Tiempo total: ~15-20 segundos
```

### Escenario 2: Usuario con Conexión Intermitente

```javascript
// Simular conexión con mucha variación
window.queueLagControl.setLag(2000, 3000);

// Usuario responde preguntas
// Observar:
// - Tiempos variables (2-5 segundos por respuesta)
// - Cola se procesa de forma irregular
// - Estados visuales reflejan la variabilidad
```

### Escenario 3: Usuario con Conexión Rápida

```javascript
// Sin lag
window.queueLagControl.disable();

// Usuario responde preguntas
// Observar:
// - Procesamiento inmediato
// - Cola se vacía rápidamente
// - Estados cambian instantáneamente
```

## 📈 Métricas a Observar

### 1. **Tiempo de Procesamiento**

- Tiempo desde que se agrega a la cola hasta que se completa
- Variación en los tiempos
- Efecto del lag en la experiencia del usuario

### 2. **Comportamiento de la Cola**

- Número máximo de items en cola
- Tiempo que permanecen en cola
- Orden de procesamiento

### 3. **Estados Visuales**

- Duración de cada estado
- Transiciones entre estados
- Persistencia de estados

### 4. **Logs de Performance**

```javascript
// Ver estadísticas después de testing
getQueueStats();

// Exportar logs para análisis
exportLogs();
```

## 🔧 Configuración Avanzada

### Modificar Configuración en Código

```javascript
// En useResponseQueue.js
const QUEUE_CONFIG = {
  simulateNetworkLag: true,
  networkLagMs: 3000, // 3 segundos base
  randomLagVariation: 2000, // 0-2 segundos adicionales
};
```

### Simular Errores de Red

```javascript
// Para simular errores, puedes modificar temporalmente
// la función sendResponseToAPI para lanzar errores aleatorios
```

## 🎉 Beneficios del Sistema de Lag

1. **Testing Realista**: Simula condiciones reales de red
2. **Validación de UX**: Verifica que la experiencia sea buena con conexiones lentas
3. **Debugging**: Identifica problemas de timing y sincronización
4. **Optimización**: Encuentra oportunidades de mejora en el sistema
5. **Documentación**: Genera logs detallados para análisis

## 🚀 Comandos Rápidos

```javascript
// Setup rápido para testing
window.queueLagControl.slow(); // Lag lento
window.queueLagControl.enable(); // Asegurar que esté habilitado
window.queueLagControl.getConfig(); // Verificar configuración

// Limpiar después de testing
window.queueLagControl.disable(); // Deshabilitar lag
clearOldLogs(); // Limpiar logs
```

¡Ahora puedes probar el sistema de cola con diferentes velocidades de red y ver cómo se comporta en condiciones reales!
