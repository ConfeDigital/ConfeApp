import React, { useState, useCallback, useRef, useEffect } from "react";
import api from "../api";

// Configuración del sistema de logging
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

// Configuración de la cola
const QUEUE_CONFIG = {
  maxRetries: 3, // Máximo número de reintentos
  retryDelay: 1000, // Delay entre reintentos (ms)
  processDelay: 100, // Delay entre procesamiento de items (ms)
  maxQueueSize: 50, // Tamaño máximo de la cola
  autoRetry: true, // Reintento automático habilitado
  showQueueStatus: true, // Mostrar estado de la cola
  // Configuración de lag para testing
  simulateNetworkLag: false, // Habilitar simulación de lag
  networkLagMs: 0, // Lag simulado en milisegundos (0 segundos)
  randomLagVariation: 0, // Variación aleatoria del lag (0ms adicionales)
};

const useResponseQueue = () => {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [responseStates, setResponseStates] = useState({});
  const logHistoryRef = useRef([]);

  // Sistema de logging para la cola
  const logQueueEvent = useCallback(
    (event, data = {}) => {
      if (!LOGGING_CONFIG.enabled) return;

      const timestamp = new Date().toISOString();
      const logData = {
        timestamp,
        event,
        queueLength: queue.length,
        processing,
        ...data,
      };

      // Agregar al historial de logs
      logHistoryRef.current.push(logData);
      if (logHistoryRef.current.length > LOGGING_CONFIG.maxLogHistory) {
        logHistoryRef.current.shift();
      }

      if (LOGGING_CONFIG.groupLogs) {
        console.group(`🔄 [COLA] ${event} - ${timestamp}`);
      } else {
        console.log(`🔄 [COLA] ${event} - ${timestamp}`);
      }

      if (LOGGING_CONFIG.showQueueState) {
        console.log("📊 Estado de la cola:", {
          itemsEnCola: queue.length,
          procesando: processing,
          estados: responseStates,
        });
      }

      console.log("📝 Datos del evento:", logData);

      if (LOGGING_CONFIG.groupLogs) {
        console.groupEnd();
      }
    },
    [queue.length, processing, responseStates]
  );

  // Función para simular lag de red
  const simulateNetworkLag = useCallback(async () => {
    if (!QUEUE_CONFIG.simulateNetworkLag) return;

    const baseLag = QUEUE_CONFIG.networkLagMs;
    const randomVariation = Math.random() * QUEUE_CONFIG.randomLagVariation;
    const totalLag = baseLag + randomVariation;

    logQueueEvent("SIMULANDO_LAG", {
      lagBase: baseLag,
      lagVariacion: randomVariation,
      lagTotal: totalLag,
    });

    await new Promise((resolve) => setTimeout(resolve, totalLag));
  }, []);

  // Función para procesar respuesta según el tipo de pregunta
  const procesarRespuesta = useCallback((respuesta, preguntaActual) => {
    if (preguntaActual.tipo === "numero") {
      return parseFloat(respuesta) || 0;
    } else if (
      preguntaActual.tipo === "multiple" ||
      preguntaActual.tipo === "dropdown"
    ) {
      return respuesta;
    } else if (preguntaActual.tipo === "binaria") {
      if (
        respuesta === true ||
        respuesta === "true" ||
        respuesta === "1" ||
        respuesta === "sí" ||
        respuesta === "si"
      ) {
        return "Sí";
      } else {
        return "No";
      }
    } else if (preguntaActual.tipo === "checkbox") {
      return Array.isArray(respuesta) ? respuesta : [];
    } else if (preguntaActual.tipo === "imagen") {
      return parseFloat(respuesta) || 0;
    } else {
      // Para otros tipos, retornar la respuesta tal como está
      return respuesta;
    }
  }, []);

  // Función para enviar respuesta al backend
  const sendResponseToAPI = useCallback(
    async (queueItem, metadata) => {
      const { preguntaId, respuesta } = queueItem;

      // Procesar respuesta según el tipo de pregunta
      const respuestaParaEnviar = procesarRespuesta(
        respuesta,
        metadata.preguntaActual
      );

      // Simular lag de red antes del envío
      await simulateNetworkLag();

      // Enviar al backend
      await api.post("/api/cuestionarios/respuestas/", {
        usuario: metadata.usuario,
        cuestionario: metadata.cuestionario.id,
        pregunta: preguntaId,
        respuesta: respuestaParaEnviar,
      });
    },
    [procesarRespuesta, simulateNetworkLag]
  );

  // Agregar respuesta a la cola
  const enqueueResponse = useCallback(
    (preguntaId, respuesta, metadata) => {
      // Verificar límite de cola
      if (queue.length >= QUEUE_CONFIG.maxQueueSize) {
        logQueueEvent("COLA_LLENA", {
          preguntaId,
          maxSize: QUEUE_CONFIG.maxQueueSize,
          accion: "rechazada",
        });
        return false;
      }

      // Verificar si ya hay una respuesta para esta pregunta en la cola
      const existingInQueue = queue.some(
        (item) => item.preguntaId === preguntaId
      );

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
          const filteredQueue = prev.filter(
            (item) => item.preguntaId !== preguntaId
          );
          return filteredQueue;
        });
      }

      // Verificar si ya está siendo procesada
      if (responseStates[preguntaId] === "processing") {
        logQueueEvent("RESPUESTA_EN_PROCESO", {
          preguntaId,
          accion: "ignorada",
          estado: "processing",
        });
        return false;
      }

      const queueItem = {
        id: `${preguntaId}_${Date.now()}`,
        preguntaId,
        respuesta,
        metadata,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: QUEUE_CONFIG.maxRetries,
      };

      setQueue((prev) => {
        const newQueue = [...prev, queueItem];
        logQueueEvent("RESPUESTA_AGREGADA", {
          preguntaId,
          posicionEnCola: newQueue.length,
          respuesta:
            typeof respuesta === "object"
              ? JSON.stringify(respuesta)
              : typeof respuesta === "string" && respuesta.length > 50
              ? respuesta.substring(0, 50) + "..."
              : respuesta,
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

      return true;
    },
    [queue.length, logQueueEvent, responseStates]
  );

  // Procesar siguiente elemento de la cola
  const processNext = useCallback(async () => {
    if (processing) return;

    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;

      const currentItem = currentQueue[0];
      setProcessing(true);

      // Procesar de forma asíncrona
      (async () => {
        logQueueEvent("INICIANDO_PROCESAMIENTO", {
          preguntaId: currentItem.preguntaId,
          itemId: currentItem.id,
          retryCount: currentItem.retryCount,
          tiempoEnCola: Date.now() - currentItem.timestamp,
          colaRestante: currentQueue.length - 1,
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

          await sendResponseToAPI(currentItem, currentItem.metadata);

          // Éxito: remover de la cola y marcar como exitoso
          setQueue((prev) => prev.slice(1));
          setResponseStates((prev) => ({
            ...prev,
            [currentItem.preguntaId]: "success",
          }));

          logQueueEvent("RESPUESTA_EXITOSA", {
            preguntaId: currentItem.preguntaId,
            tiempoTotal: Date.now() - currentItem.timestamp,
            colaRestante: currentQueue.length - 1,
            siguienteEnCola:
              currentQueue.length > 1 ? currentQueue[1].preguntaId : null,
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
              colaRestante: currentQueue.length - 1,
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
              delayReintento: QUEUE_CONFIG.retryDelay,
              nuevaPosicionEnCola: 1,
            });
          }
        } finally {
          setProcessing(false);
          // Procesar siguiente elemento después de un breve delay
          setTimeout(() => {
            logQueueEvent("PROCESAMIENTO_COMPLETADO", {
              colaRestante: currentQueue.length - 1,
              procesandoSiguiente: currentQueue.length > 1,
            });
            processNext();
          }, QUEUE_CONFIG.processDelay);
        }
      })();

      return currentQueue;
    });
  }, [processing, logQueueEvent, sendResponseToAPI]);

  // Efecto para iniciar el procesamiento cuando hay elementos en la cola
  useEffect(() => {
    if (queue.length > 0 && !processing) {
      // Usar setTimeout para evitar bucle infinito
      const timeoutId = setTimeout(() => {
        processNext();
      }, QUEUE_CONFIG.processDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [queue.length, processing]); // Remover processNext de las dependencias

  // Utilidades de debugging
  const getQueueStats = useCallback(() => {
    const stats = {
      totalProcessed: logHistoryRef.current.filter(
        (log) => log.event === "RESPUESTA_EXITOSA"
      ).length,
      totalErrors: logHistoryRef.current.filter(
        (log) => log.event === "ERROR_PERMANENTE"
      ).length,
      totalRetries: logHistoryRef.current.filter(
        (log) => log.event === "PROGRAMANDO_REINTENTO"
      ).length,
      averageProcessingTime: 0,
      currentQueueLength: queue.length,
      processingStates: Object.values(responseStates).reduce((acc, state) => {
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {}),
    };

    console.log("📊 Estadísticas de la Cola:", stats);
    return stats;
  }, [queue.length, responseStates]);

  const clearOldLogs = useCallback(() => {
    logHistoryRef.current = [];
    console.clear();
    console.log("🧹 Logs de la cola limpiados");
  }, []);

  const exportLogs = useCallback(() => {
    const logs = logHistoryRef.current;
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cola-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Funciones para controlar el lag dinámicamente
  const setNetworkLag = useCallback((lagMs, variationMs = 0) => {
    QUEUE_CONFIG.networkLagMs = lagMs;
    QUEUE_CONFIG.randomLagVariation = variationMs;
    console.log(
      `🌐 [LAG] Configurado: ${lagMs}ms base + ${variationMs}ms variación`
    );
  }, []);

  const enableNetworkLag = useCallback(() => {
    QUEUE_CONFIG.simulateNetworkLag = true;
    console.log("🌐 [LAG] Simulación de lag HABILITADA");
  }, []);

  const disableNetworkLag = useCallback(() => {
    QUEUE_CONFIG.simulateNetworkLag = false;
    console.log("🌐 [LAG] Simulación de lag DESHABILITADA");
  }, []);

  const getLagConfig = useCallback(() => {
    const config = {
      enabled: QUEUE_CONFIG.simulateNetworkLag,
      baseLag: QUEUE_CONFIG.networkLagMs,
      variation: QUEUE_CONFIG.randomLagVariation,
    };
    console.log("🌐 [LAG] Configuración actual:", config);
    return config;
  }, []);

  // Exponer funciones de lag en el objeto window para acceso desde consola
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.queueLagControl = {
        setLag: setNetworkLag,
        enable: enableNetworkLag,
        disable: disableNetworkLag,
        getConfig: getLagConfig,
        // Presets útiles
        fast: () => setNetworkLag(500, 200),
        normal: () => setNetworkLag(1500, 500),
        slow: () => setNetworkLag(3000, 1000),
        verySlow: () => setNetworkLag(5000, 2000),
      };
    }
  }, [setNetworkLag, enableNetworkLag, disableNetworkLag, getLagConfig]);

  return {
    enqueueResponse,
    responseStates,
    queueLength: queue.length,
    isProcessing: processing,
    getQueueStats,
    clearOldLogs,
    exportLogs,
    // Funciones de lag
    setNetworkLag,
    enableNetworkLag,
    disableNetworkLag,
    getLagConfig,
  };
};

export default useResponseQueue;
