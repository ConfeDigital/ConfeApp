import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Paper,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TiposDePregunta from "./TiposDePregunta";
import ControlSIS from "./ControlSIS"; // Importar el nuevo componente
import ControlCuestionariosEspeciales from "./ControlCuestionariosEspeciales";
import api from "../../api";
import debounce from "lodash/debounce";
import NotificacionCuestionarios from "./NotificacionCuestionarios";
import BotonFinCuestionario from "./BotonFinCuestionario";
import { useNavigate } from "react-router-dom";

const Preguntas = ({
  cuestionario,
  usuario,
  preentrevista = false,
  preguntaIndex,
  setPreguntaIndex,
  questionsPerPage,
  lastAnsweredQuestionIndex,
  cuestionarioFinalizado,
  setCuestionarioFinalizado,
  subitems,
  technicalAids,
  chAids,
  esEditable,
  onQuestionUnlock,
}) => {
  // Estados principales
  const [respuestas, setRespuestas] = useState({});
  const [unlockedQuestions, setUnlockedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preguntasEditables, setPreguntasEditables] = useState([]);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const [preguntasNoRespondidas, setPreguntasNoRespondidas] = useState(
    new Set()
  );
  const accordionRefs = useRef({});
  const topRef = useRef(null);

  const navigate = useNavigate();
  // Notificaciones
  const [notificacion, setNotificacion] = useState({
    mensaje: null,
    tipo: null,
  });

  // Efecto para agrupar preguntas por sección
  useEffect(() => {
    const grouped = cuestionario.preguntas.reduce((acc, pregunta) => {
      const section = pregunta.nombre_seccion || "Sin sección";
      if (!acc[section]) acc[section] = [];
      acc[section].push(pregunta);
      return acc;
    }, {});
    setGroupedQuestions(grouped);
  }, [cuestionario]);

  // Efecto para seleccionar automáticamente el primer tab de sección
  useEffect(() => {
    const secciones = Object.keys(groupedQuestions).filter((section) =>
      groupedQuestions[section].some(
        (pregunta) => pregunta.tipo !== "sis" && pregunta.tipo !== "sis2"
      )
    );
    if (secciones.length > 0 && !expandedSection) {
      setExpandedSection(secciones[0]);
    }
  }, [groupedQuestions, expandedSection]);

  // Efecto para hacer scroll al tope de la ventana cuando cambia expandedSection
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [expandedSection]);

  // Calcular preguntas desbloqueadas
  const calculateUnlockedQuestions = useCallback(
    (respuestas) => {
      const unlocked = new Set();
      Object.entries(respuestas).forEach(([preguntaId, respuesta]) => {
        const pregunta = cuestionario.preguntas.find(
          (p) => p.id === parseInt(preguntaId, 10)
        );

        if (pregunta?.opciones) {
          if (pregunta.tipo === "checkbox") {
            // Para checkbox, la respuesta es un array de IDs de opciones
            let opcionesSeleccionadas = [];
            // Manejar tanto strings JSON como arrays nativos (para compatibilidad)
            if (typeof respuesta === "string") {
              try {
                opcionesSeleccionadas = JSON.parse(respuesta);
              } catch (error) {
                console.error("Error parsing checkbox response:", error);
              }
            } else if (Array.isArray(respuesta)) {
              opcionesSeleccionadas = respuesta;
            } else if (respuesta && typeof respuesta === "object") {
              // Si es un objeto, intentar extraer el array de opciones
              opcionesSeleccionadas =
                respuesta.opciones || respuesta.valor_original || [];
            }

            // Buscar cada opción por ID y procesar sus desbloqueos
            opcionesSeleccionadas.forEach((opcionId) => {
              const opcion = pregunta.opciones.find((op) => op.id === opcionId);
              if (opcion?.desbloqueos) {
                opcion.desbloqueos.forEach((desbloqueo) => {
                  unlocked.add(desbloqueo.pregunta_desbloqueada);
                });
              }
            });
          } else {
            // Para otros tipos de preguntas, usar la lógica original
            const opcionSeleccionada = pregunta.opciones.find(
              (op) => op.valor === parseInt(respuesta, 10)
            );
            opcionSeleccionada?.desbloqueos?.forEach((desbloqueo) => {
              unlocked.add(desbloqueo.pregunta_desbloqueada);
            });
          }
        }
      });
      return unlocked;
    },
    [cuestionario]
  );

  // Efecto para recargar respuestas cuando cambien
  useEffect(() => {
    if (usuario && cuestionario) {
      // Limpiar respuestas anteriores antes de cargar nuevas
      setRespuestas({});
      fetchRespuestas();
    }
  }, [usuario, cuestionario]);

  // Efecto para actualizar preguntas desbloqueadas cuando cambien las respuestas
  useEffect(() => {
    const unlocked = calculateUnlockedQuestions(respuestas);
    setUnlockedQuestions(unlocked);
  }, [respuestas, cuestionario.id]); // Solo depender del ID del cuestionario

  // Cargar respuestas existentes
  const fetchRespuestas = async () => {
    try {
      const response = await api.get("/api/cuestionarios/respuestas/", {
        params: { usuario, cuestionario: cuestionario.id },
      });

      const respuestasMap = {};
      response.data.forEach((respuesta) => {
        try {
          let respuestaParseada;

          // Intentar parsear la respuesta JSON si es string
          if (
            typeof respuesta.respuesta === "string" &&
            respuesta.respuesta.startsWith("{")
          ) {
            respuestaParseada = JSON.parse(respuesta.respuesta);
          } else {
            respuestaParseada = respuesta.respuesta;
          }

          // Si es una respuesta procesada (nuevo formato), extraer el valor_original
          if (
            respuestaParseada &&
            typeof respuestaParseada === "object" &&
            respuestaParseada.valor_original !== undefined
          ) {
            respuestasMap[respuesta.pregunta] =
              respuestaParseada.valor_original;
          } else if (
            respuestaParseada &&
            typeof respuestaParseada === "object" &&
            respuestaParseada.valor !== undefined
          ) {
            // Para respuestas numéricas procesadas
            respuestasMap[respuesta.pregunta] = respuestaParseada.valor;
          } else if (
            respuestaParseada &&
            typeof respuestaParseada === "object" &&
            respuestaParseada.texto !== undefined
          ) {
            // Para respuestas de texto procesadas
            respuestasMap[respuesta.pregunta] = respuestaParseada.texto;
          } else if (
            respuestaParseada &&
            typeof respuestaParseada === "object" &&
            respuestaParseada.opciones !== undefined
          ) {
            // Para respuestas de checkbox procesadas
            respuestasMap[respuesta.pregunta] = respuestaParseada.opciones;
          } else if (
            respuestaParseada &&
            typeof respuestaParseada === "object" &&
            respuestaParseada.indice !== undefined
          ) {
            // Para respuestas de dropdown/multiple procesadas
            respuestasMap[respuesta.pregunta] = respuestaParseada.indice;
          } else {
            // Respuesta en formato simple, usar tal como está
            respuestasMap[respuesta.pregunta] = respuestaParseada;
          }
        } catch (error) {
          console.error("Error parsing respuesta:", error);
          respuestasMap[respuesta.pregunta] = respuesta.respuesta;
        }
      });

      setRespuestas(respuestasMap);
    } catch (error) {
      console.error("Error fetching respuestas:", error);
      setError("Error al cargar las respuestas");
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar si una pregunta debe mostrarse
  const isQuestionVisible = useCallback(
    (pregunta) => {
      // Si la pregunta no tiene desbloqueos recibidos, siempre es visible
      if (pregunta.desbloqueos_recibidos.length === 0) return true;
      // Si tiene desbloqueos, solo es visible si está en unlockedQuestions
      return unlockedQuestions.has(pregunta.id);
    },
    [unlockedQuestions]
  );

  // Función para validar si una respuesta es válida
  const isRespuestaValida = useCallback((respuesta, tipoPregunta) => {
    // Validación base para respuestas nulas o indefinidas
    if (respuesta === undefined || respuesta === null) {
      return false;
    }

    // Si es una respuesta procesada (nuevo formato), extraer el valor_original
    let respuestaParaValidar = respuesta;
    if (
      respuesta &&
      typeof respuesta === "object" &&
      respuesta.valor_original !== undefined
    ) {
      respuestaParaValidar = respuesta.valor_original;
    }

    // Validaciones específicas por tipo de pregunta
    switch (tipoPregunta) {
      case "abierta":
        // Para preguntas abiertas, el texto no puede estar vacío y debe tener al menos un carácter
        return (
          typeof respuestaParaValidar === "string" &&
          respuestaParaValidar.trim().length > 0
        );

      case "numero":
        // Para preguntas numéricas, debe ser un número válido y no estar vacío
        return (
          !isNaN(Number(respuestaParaValidar)) &&
          respuestaParaValidar !== "" &&
          respuestaParaValidar !== null
        );

      case "multiple":
      case "dropdown":
        // Para opciones múltiples y dropdown, debe tener un valor seleccionado
        return (
          respuestaParaValidar !== "" &&
          respuestaParaValidar !== null &&
          respuestaParaValidar !== undefined
        );

      case "checkbox":
        // Para checkbox, debe tener al menos una opción seleccionada
        if (Array.isArray(respuestaParaValidar)) {
          return respuestaParaValidar.length > 0;
        }
        // Si es un string (JSON), intentar parsearlo
        if (typeof respuestaParaValidar === "string") {
          try {
            const parsed = JSON.parse(respuestaParaValidar);
            return Array.isArray(parsed) && parsed.length > 0;
          } catch {
            return false;
          }
        }
        // Si es un objeto, verificar que tenga al menos una propiedad
        if (typeof respuestaParaValidar === "object") {
          return Object.keys(respuestaParaValidar).length > 0;
        }
        return false;

      case "fecha":
      case "fecha_hora":
        // Para fechas, debe ser una fecha válida
        if (respuestaParaValidar instanceof Date) {
          return !isNaN(respuestaParaValidar.getTime());
        }
        // Si es un string, intentar convertirlo a fecha
        if (typeof respuestaParaValidar === "string") {
          const date = new Date(respuestaParaValidar);
          return !isNaN(date.getTime());
        }
        return false;

      case "sis":
      case "sis2":
        // Para preguntas SIS, debe tener al menos un valor seleccionado
        return (
          typeof respuestaParaValidar === "object" &&
          respuestaParaValidar !== null &&
          Object.keys(respuestaParaValidar).length > 0
        );

      case "ed":
      case "ch":
        // Para preguntas especiales, debe tener al menos un valor seleccionado
        return (
          typeof respuestaParaValidar === "object" &&
          respuestaParaValidar !== null &&
          Object.keys(respuestaParaValidar).length > 0
        );

      case "binaria":
        // Para preguntas binarias, debe tener un valor seleccionado
        return respuestaParaValidar === true || respuestaParaValidar === false;

      default:
        // Para otros tipos, validación genérica
        if (typeof respuestaParaValidar === "string") {
          return respuestaParaValidar.trim().length > 0;
        }
        if (Array.isArray(respuestaParaValidar)) {
          return respuestaParaValidar.length > 0;
        }
        if (typeof respuestaParaValidar === "object") {
          return (
            respuestaParaValidar !== null &&
            Object.keys(respuestaParaValidar).length > 0
          );
        }
        return false;
    }
  }, []);

  // Efecto para actualizar el contador cuando cambian las respuestas o las preguntas desbloqueadas
  useEffect(() => {
    // Obtener todas las preguntas
    const todasLasPreguntas = Object.values(groupedQuestions).flat();

    // Obtener preguntas no visibles (las que tienen desbloqueos pero no están desbloqueadas)
    const preguntasNoVisibles = todasLasPreguntas.filter(
      (p) => p.desbloqueos_recibidos.length > 0 && !unlockedQuestions.has(p.id)
    );

    // Calcular el total de preguntas a considerar
    const totalPreguntas =
      todasLasPreguntas.length -
      preguntasNoVisibles.length +
      unlockedQuestions.size;

    // Contar todas las respuestas válidas (validación inline para evitar dependencias)
    const respondidas = Object.entries(respuestas).filter(
      ([preguntaId, respuesta]) => {
        const pregunta = todasLasPreguntas.find(
          (p) => p.id === parseInt(preguntaId)
        );
        if (!pregunta) return false;

        // Validación inline para evitar dependencias
        const respuestaParaValidar = respuesta;
        if (
          respuestaParaValidar === null ||
          respuestaParaValidar === undefined
        ) {
          return false;
        }

        if (pregunta.tipo === "abierta") {
          return (
            typeof respuestaParaValidar === "string" &&
            respuestaParaValidar.trim() !== ""
          );
        }

        if (pregunta.tipo === "checkbox") {
          if (Array.isArray(respuestaParaValidar)) {
            return respuestaParaValidar.length > 0;
          }
          if (typeof respuestaParaValidar === "string") {
            try {
              const parsed = JSON.parse(respuestaParaValidar);
              return Array.isArray(parsed) && parsed.length > 0;
            } catch {
              return false;
            }
          }
          return false;
        }

        if (pregunta.tipo === "numero") {
          return (
            !isNaN(parseFloat(respuestaParaValidar)) &&
            parseFloat(respuestaParaValidar) !== 0
          );
        }

        if (typeof respuestaParaValidar === "object") {
          return (
            respuestaParaValidar !== null &&
            Object.keys(respuestaParaValidar).length > 0
          );
        }

        return (
          respuestaParaValidar !== "" &&
          respuestaParaValidar !== null &&
          respuestaParaValidar !== undefined
        );
      }
    ).length;

    // Notificar al componente padre sobre el cambio en el contador
    if (onQuestionUnlock) {
      onQuestionUnlock("counter", {
        total: totalPreguntas,
        answered: respondidas,
      });
    }
  }, [unlockedQuestions, respuestas, groupedQuestions, onQuestionUnlock]);

  // Función para procesar respuestas y agregar información adicional
  const procesarRespuesta = (respuesta, pregunta) => {
    try {
      // Procesar según el tipo de pregunta para asegurar compatibilidad con Azure SQL
      switch (pregunta.tipo) {
        case "abierta":
          return {
            texto: respuesta,
            valor_original: respuesta,
          };

        case "numero":
          const valorNumerico = parseFloat(respuesta) || 0;
          return {
            valor: valorNumerico,
            valor_original: respuesta,
          };

        case "binaria":
          const valorBooleano =
            respuesta === true ||
            respuesta === "true" ||
            respuesta === "1" ||
            respuesta === "sí" ||
            respuesta === "si";
          return {
            valor: valorBooleano,
            valor_original: respuesta,
            texto: valorBooleano ? "Sí" : "No",
          };

        case "fecha":
          return {
            fecha: respuesta,
            valor_original: respuesta,
            formato: "YYYY-MM-DD",
          };

        case "fecha_hora":
          return {
            fecha_hora: respuesta,
            valor_original: respuesta,
            formato: "ISO",
          };

        case "checkbox":
          // Para checkbox, respuesta es un array de IDs de opciones seleccionadas
          const opcionesSeleccionadas = Array.isArray(respuesta)
            ? respuesta
            : [];

          const opciones_info = opcionesSeleccionadas.map((opcionId) => {
            const opcion = pregunta.opciones.find((op) => op.id === opcionId);
            const indice = pregunta.opciones.findIndex(
              (op) => op.id === opcionId
            );

            return {
              id: opcionId,
              texto: opcion ? opcion.texto : "Opción no encontrada",
              valor: opcion ? opcion.valor : null,
              indice: indice >= 0 ? indice : null,
            };
          });

          return {
            opciones: opcionesSeleccionadas,
            valor_original: respuesta,
            texto: opciones_info.map((op) => op.texto).join(", "),
            opciones_info: opciones_info,
          };

        case "multiple":
        case "dropdown":
          // Para opciones múltiples y dropdown
          const opcionSeleccionada = pregunta.opciones.find(
            (op) => op.valor === respuesta
          );
          return {
            indice: respuesta,
            valor_original: respuesta,
            texto: opcionSeleccionada
              ? opcionSeleccionada.texto
              : `Opción ${respuesta}`,
            id: opcionSeleccionada ? opcionSeleccionada.id : null,
          };

        case "sis":
        case "sis2":
          return respuesta; // Mantener la estructura original para SIS

        case "canalizacion":
        case "canalizacion_centro":
          return respuesta; // Mantener la estructura original para canalización

        case "ch":
          return respuesta; // Mantener la estructura original para CH

        case "ed":
          return respuesta; // Mantener la estructura original para ED

        case "meta":
          return respuesta; // Mantener la estructura original para meta

        case "datos_personales":
        case "datos_domicilio":
        case "datos_medicos":
        case "contactos":
        case "tipo_discapacidad":
        case "imagen":
          return respuesta; // Mantener la estructura original para datos especializados

        default:
          return respuesta;
      }
    } catch (error) {
      console.error("Error procesando respuesta:", error);
      return {
        valor_original: respuesta,
        texto: `Error procesando respuesta: ${error.message}`,
        opciones_info: [],
      };
    }
  };

  // Handler para cambios en respuestas
  const handleRespuestaChange = useCallback(
    debounce(async (preguntaId, respuesta) => {
      try {
        // Validar la respuesta antes de guardar
        const preguntaActual = cuestionario.preguntas.find(
          (p) => p.id === preguntaId
        );

        // Validación específica para preguntas abiertas
        if (
          preguntaActual.tipo === "abierta" &&
          (!respuesta || respuesta.trim() === "")
        ) {
          setPreguntasNoRespondidas((prev) => new Set([...prev, preguntaId]));
          setNotificacion({
            mensaje: `La pregunta "${preguntaActual.texto}" no puede quedar sin respuesta. Por favor, ingresa un texto.`,
            tipo: "error",
          });
          return;
        }

        if (!isRespuestaValida(respuesta, preguntaActual.tipo)) {
          setPreguntasNoRespondidas((prev) => new Set([...prev, preguntaId]));
          setNotificacion({
            mensaje: `La pregunta "${preguntaActual.texto}" no puede quedar sin respuesta. Por favor, completa la respuesta antes de continuar.`,
            tipo: "error",
          });
          return;
        }

        // Si la respuesta es válida, remover de preguntas no respondidas
        setPreguntasNoRespondidas((prev) => {
          const newSet = new Set(prev);
          newSet.delete(preguntaId);
          return newSet;
        });

        // Para ciertos tipos de preguntas, enviar el valor simple al backend
        let respuestaParaEnviar = respuesta;

        if (preguntaActual.tipo === "numero") {
          // Para números, enviar solo el valor numérico
          respuestaParaEnviar = parseFloat(respuesta) || 0;
        } else if (
          preguntaActual.tipo === "multiple" ||
          preguntaActual.tipo === "dropdown"
        ) {
          // Para dropdowns, enviar solo el valor/índice
          respuestaParaEnviar = respuesta;
        } else if (preguntaActual.tipo === "binaria") {
          // Para binarias, enviar solo el valor booleano
          respuestaParaEnviar =
            respuesta === true ||
            respuesta === "true" ||
            respuesta === "1" ||
            respuesta === "sí" ||
            respuesta === "si";
        } else if (preguntaActual.tipo === "checkbox") {
          // Para checkbox, enviar el array de IDs
          respuestaParaEnviar = Array.isArray(respuesta) ? respuesta : [];
        } else {
          // Para otros tipos, procesar la respuesta
          respuestaParaEnviar = procesarRespuesta(respuesta, preguntaActual);
        }

        await api.post("/api/cuestionarios/respuestas/", {
          usuario: usuario,
          cuestionario: cuestionario.id,
          pregunta: preguntaId,
          respuesta: respuestaParaEnviar,
        });

        // Actualizar respuestas locales (mantener la respuesta original para el frontend)
        setRespuestas((prev) => ({
          ...prev,
          [preguntaId]: respuesta,
        }));

        // Actualizar preguntas desbloqueadas
        setUnlockedQuestions((prev) => {
          const nuevos = new Set(prev);
          const pregunta = cuestionario.preguntas.find(
            (p) => p.id === preguntaId
          );

          // Eliminar posibles desbloqueos antiguos
          pregunta?.opciones?.forEach((op) => {
            op.desbloqueos?.forEach((d) => {
              nuevos.delete(d.pregunta_desbloqueada);
            });
          });

          // Agregar desbloqueos de las opciones seleccionadas
          if (pregunta?.tipo === "checkbox") {
            // console.log("Procesando desbloqueos para CHECKBOX");
            // console.log("Respuesta checkbox:", respuesta);

            // Mostrar todas las opciones de la pregunta
            // console.log("Todas las opciones de la pregunta:");
            pregunta.opciones?.forEach((op, index) => {
              // console.log(
              //   `  - Índice: ${index}, Valor: ${op.valor}, Texto: ${op.texto}`
              // );
            });

            // Para checkbox, respuesta es un array de opciones seleccionadas
            if (Array.isArray(respuesta)) {
              // console.log("Respuesta es un array, procesando...");
              respuesta.forEach((opcionSeleccionada) => {
                // console.log(
                //   "Procesando opción seleccionada:",
                //   opcionSeleccionada
                // );
                // Buscar por ID de la opción en lugar de por valor
                const opcion = pregunta.opciones?.find(
                  (op) => op.id === opcionSeleccionada
                );
                // console.log("Opción encontrada:", opcion?.texto);
                // console.log("Desbloqueos de esta opción:", opcion?.desbloqueos);
                if (opcion?.desbloqueos) {
                  opcion.desbloqueos.forEach((d) => {
                    // console.log(
                    //   "Agregando desbloqueo:",
                    //   d.pregunta_desbloqueada
                    // );
                    nuevos.add(d.pregunta_desbloqueada);
                  });
                }
              });
            } else {
              // console.log("Respuesta no es un array:", respuesta);
            }
          } else {
            // Para otros tipos de preguntas
            const opcionSeleccionada = pregunta?.opciones?.find(
              (op) => op.valor === respuesta
            );
            if (opcionSeleccionada?.desbloqueos) {
              opcionSeleccionada.desbloqueos.forEach((d) => {
                nuevos.add(d.pregunta_desbloqueada);
              });
            }
          }

          return nuevos;
        });
      } catch (error) {
        console.error("Error updating respuesta:", error);
        setNotificacion({
          mensaje: "Error al guardar la respuesta",
          tipo: "error",
        });
      }
    }, 600),
    [usuario, cuestionario, isRespuestaValida]
  );

  // Función para obtener preguntas visibles que no tienen respuesta
  const getUnansweredQuestions = () => {
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    return todasLasPreguntas.filter((pregunta) => {
      // Si la pregunta no es visible, no la contamos
      if (
        pregunta.desbloqueos_recibidos.length > 0 &&
        !unlockedQuestions.has(pregunta.id)
      ) {
        return false;
      }

      // Validar la respuesta según el tipo de pregunta
      const respuesta = respuestas[pregunta.id];
      return !isRespuestaValida(respuesta, pregunta.tipo);
    });
  };

  // Función para obtener el total de preguntas visibles
  const getTotalUnlockedQuestions = () => {
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    const preguntasNoVisibles = todasLasPreguntas.filter(
      (p) => p.desbloqueos_recibidos.length > 0 && !unlockedQuestions.has(p.id)
    );
    return (
      todasLasPreguntas.length -
      preguntasNoVisibles.length +
      unlockedQuestions.size
    );
  };

  // Función para obtener el total de respuestas válidas
  const getAnsweredUnlockedQuestions = () => {
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    return Object.entries(respuestas).filter(([preguntaId, respuesta]) => {
      const pregunta = todasLasPreguntas.find(
        (p) => p.id === parseInt(preguntaId)
      );
      return pregunta && isRespuestaValida(respuesta, pregunta.tipo);
    }).length;
  };

  // Verificar si todas las preguntas visibles están respondidas
  const todasPreguntasRespondidas = () => {
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    const preguntasNoRespondidas = todasLasPreguntas.filter((pregunta) => {
      // Solo considerar preguntas visibles
      if (
        pregunta.desbloqueos_recibidos.length > 0 &&
        !unlockedQuestions.has(pregunta.id)
      ) {
        return false;
      }
      const respuesta = respuestas[pregunta.id];
      return !isRespuestaValida(respuesta, pregunta.tipo);
    });
    return preguntasNoRespondidas.length === 0;
  };

  // Función para validar todas las preguntas antes de guardar
  const validarPreguntasAntesDeGuardar = useCallback(() => {
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    const noRespondidas = new Set();

    todasLasPreguntas.forEach((pregunta) => {
      // Si la pregunta no es visible, no la validamos
      if (
        pregunta.desbloqueos_recibidos.length > 0 &&
        !unlockedQuestions.has(pregunta.id)
      ) {
        return;
      }

      const respuesta = respuestas[pregunta.id];
      if (!isRespuestaValida(respuesta, pregunta.tipo)) {
        noRespondidas.add(pregunta.id);
      }
    });

    setPreguntasNoRespondidas(noRespondidas);
    return noRespondidas.size === 0;
  }, [groupedQuestions, unlockedQuestions, respuestas, isRespuestaValida]);

  // Función para validar una pregunta individual
  const validarPregunta = useCallback(
    (preguntaId, respuesta, tipoPregunta) => {
      const pregunta = cuestionario.preguntas.find((p) => p.id === preguntaId);
      if (!isRespuestaValida(respuesta, tipoPregunta)) {
        setPreguntasNoRespondidas((prev) => new Set([...prev, preguntaId]));

        // Mensaje específico según el tipo de pregunta
        let mensajeError = `La pregunta "${pregunta.texto}" no puede quedar sin respuesta. `;
        switch (tipoPregunta) {
          case "abierta":
            mensajeError += "Por favor, ingresa un texto para esta pregunta.";
            break;
          case "numero":
            mensajeError += "Por favor, ingresa un número válido.";
            break;
          case "multiple":
          case "dropdown":
            mensajeError += "Por favor, selecciona una opción.";
            break;
          case "checkbox":
            mensajeError += "Por favor, selecciona al menos una opción.";
            break;
          case "sis":
          case "sis2":
            mensajeError += "Por favor, selecciona al menos un valor.";
            break;
          case "ed":
          case "ch":
            mensajeError += "Por favor, selecciona al menos un valor.";
            break;
          case "binaria":
            mensajeError += "Por favor, selecciona una opción (Sí/No).";
            break;
          default:
            mensajeError += "Por favor, completa la respuesta.";
        }

        setNotificacion({
          mensaje: mensajeError,
          tipo: "error",
        });
      } else {
        setPreguntasNoRespondidas((prev) => {
          const newSet = new Set(prev);
          newSet.delete(preguntaId);
          return newSet;
        });
      }
    },
    [isRespuestaValida, cuestionario]
  );

  // Finalizar cuestionario
  const handleFinalizarCuestionario = async () => {
    // Obtener el total de preguntas a responder
    const todasLasPreguntas = Object.values(groupedQuestions).flat();
    const preguntasNoVisibles = todasLasPreguntas.filter(
      (p) => p.desbloqueos_recibidos.length > 0 && !unlockedQuestions.has(p.id)
    );
    const totalPreguntas =
      todasLasPreguntas.length -
      preguntasNoVisibles.length +
      unlockedQuestions.size;

    // Obtener las preguntas no respondidas
    const preguntasNoRespondidas = todasLasPreguntas.filter((pregunta) => {
      // Solo considerar preguntas visibles
      if (
        pregunta.desbloqueos_recibidos.length > 0 &&
        !unlockedQuestions.has(pregunta.id)
      ) {
        return false;
      }
      const respuesta = respuestas[pregunta.id];
      return !isRespuestaValida(respuesta, pregunta.tipo);
    });

    // Si hay preguntas no respondidas
    if (preguntasNoRespondidas.length > 0) {
      // Marcar las preguntas no respondidas
      setPreguntasNoRespondidas(
        new Set(preguntasNoRespondidas.map((p) => p.id))
      );

      // Crear mensaje detallado con el tipo de respuesta esperada
      const mensajeFaltantes = preguntasNoRespondidas
        .map((pregunta, index) => {
          let tipoRespuesta = "";
          switch (pregunta.tipo) {
            case "abierta":
              tipoRespuesta = " (requiere texto)";
              break;
            case "numero":
              tipoRespuesta = " (requiere número)";
              break;
            case "multiple":
            case "dropdown":
              tipoRespuesta = " (requiere selección)";
              break;
            case "checkbox":
              tipoRespuesta = " (requiere al menos una opción)";
              break;
            case "sis":
            case "sis2":
              tipoRespuesta = " (requiere al menos un valor)";
              break;
            case "ed":
            case "ch":
              tipoRespuesta = " (requiere al menos un valor)";
              break;
            case "binaria":
              tipoRespuesta = " (requiere Sí/No)";
              break;
          }
          return `${index + 1}. ${pregunta.texto}${tipoRespuesta}`;
        })
        .join("\n");

      setNotificacion({
        mensaje: `No se puede finalizar el cuestionario. Faltan ${preguntasNoRespondidas.length} preguntas por responder:\n\n${mensajeFaltantes}`,
        tipo: "error",
      });

      // Encontrar la sección de la primera pregunta no respondida
      const primeraPreguntaFaltante = preguntasNoRespondidas[0];
      if (primeraPreguntaFaltante) {
        const seccionFaltante = Object.entries(groupedQuestions).find(
          ([_, preguntas]) =>
            preguntas.some((p) => p.id === primeraPreguntaFaltante.id)
        )?.[0];

        if (seccionFaltante) {
          setExpandedSection(seccionFaltante);
          // Hacer scroll hasta la pregunta después de que se expanda la sección
          setTimeout(() => {
            const preguntaElement = document.getElementById(
              `pregunta-${primeraPreguntaFaltante.id}`
            );
            if (preguntaElement) {
              preguntaElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 300);
        }
      }

      return;
    }

    try {
      await api.post("/api/cuestionarios/validar-estado-cuestionario/", {
        usuario: usuario,
        cuestionario: cuestionario.id,
        estado: "finalizado",
        fecha_finalizado: new Date().toISOString(),
      });
      setCuestionarioFinalizado(true);
      setNotificacion({
        mensaje: "Cuestionario finalizado con éxito!",
        tipo: "exito",
      });
      navigate(`/candidatos/${usuario}`);
    } catch (error) {
      console.error("Error finalizando cuestionario:", error);
      setNotificacion({
        mensaje: "Error al finalizar el cuestionario",
        tipo: "error",
      });
    }
  };

  // Manejar edición de preguntas
  const toggleEdicionPregunta = (preguntaId) => {
    setPreguntasEditables((prev) => {
      if (prev.includes(preguntaId)) {
        return prev.filter((id) => id !== preguntaId);
      } else {
        return [...prev, preguntaId];
      }
    });
  };

  // Modificar también la función onGuardarCambios
  const handleGuardarCambios = async (id) => {
    toggleEdicionPregunta(id);
    try {
      const response = await api.get(
        "/api/cuestionarios/finalizar-cuestionario/",
        {
          params: {
            usuario: usuario,
            cuestionario: cuestionario.id,
          },
        }
      );
      const estado = response.data?.[0]?.estado;
      if (estado === "finalizado") {
        setCuestionarioFinalizado(true);
      }
    } catch (error) {
      console.error("Error verificando finalización:", error);
    }
  };

  if (loading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  // Separar preguntas de tipo "sis" y "sis2"
  const sisQuestions = Object.values(groupedQuestions)
    .flat()
    .filter((pregunta) => pregunta.tipo === "sis" || pregunta.tipo === "sis2");
  const specialQuestions = Object.values(groupedQuestions)
    .flat()
    .filter((pregunta) => pregunta.tipo === "ed" || pregunta.tipo === "ch");

  const otherQuestions = Object.entries(groupedQuestions).reduce(
    (acc, [section, preguntas]) => {
      acc[section] = preguntas.filter(
        (pregunta) =>
          pregunta.tipo !== "sis" &&
          pregunta.tipo !== "sis2" &&
          pregunta.tipo !== "ed" &&
          pregunta.tipo !== "ch"
      );
      return acc;
    },
    {}
  );

  const handleAccordionChange = (section) => (_, isExpanded) => {
    if (isExpanded) {
      setExpandedSection(section);

      // Esperar un poco más para asegurar que el acordeón se abra visualmente
      setTimeout(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }, 300); // tiempo aproximado de la animación de Accordion de MUI
    } else {
      setExpandedSection(null);
    }
  };

  /////////////////////// control para los subitems ///////////////

  return (
    <div ref={topRef}>
      <Box
        sx={{
          width: "100%",
          // px: { xs: 1, sm: 2, md: 3 },
          // py: { xs: 1, sm: 2 },
        }}
      >
        {/* Único bloque de navegación de secciones, solo si hay otherQuestions, justo antes de las preguntas que no son SIS */}
        {!(sisQuestions.length || specialQuestions.length > 0) &&
          Object.keys(otherQuestions).length > 0 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  mb: 1,
                }}
              >
                <Typography variant="body1">
                  Sección{" "}
                  {Object.keys(otherQuestions).indexOf(expandedSection) + 1} de{" "}
                  {Object.keys(otherQuestions).length}
                </Typography>
                <Typography variant="body1">
                  Respondidas: {getAnsweredUnlockedQuestions()} /{" "}
                  {getTotalUnlockedQuestions()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  px: 2,
                }}
              >
                <IconButton
                  disabled={
                    Object.keys(otherQuestions).indexOf(expandedSection) === 0
                  }
                  onClick={() => {
                    const index =
                      Object.keys(otherQuestions).indexOf(expandedSection);
                    if (index > 0) {
                      const nuevaSeccion =
                        Object.keys(otherQuestions)[index - 1];
                      setExpandedSection(nuevaSeccion);
                      setTimeout(() => {
                        if (topRef.current) {
                          topRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }
                  }}
                  sx={{
                    fontSize: "1.25rem",
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>

                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Sección{" "}
                  {Object.keys(otherQuestions).indexOf(expandedSection) + 1} de{" "}
                  {Object.keys(otherQuestions).length}
                </Typography>

                <IconButton
                  disabled={
                    Object.keys(otherQuestions).indexOf(expandedSection) ===
                    Object.keys(otherQuestions).length - 1
                  }
                  onClick={() => {
                    const index =
                      Object.keys(otherQuestions).indexOf(expandedSection);
                    if (index < Object.keys(otherQuestions).length - 1) {
                      const nuevaSeccion =
                        Object.keys(otherQuestions)[index + 1];
                      setExpandedSection(nuevaSeccion);
                      setTimeout(() => {
                        if (topRef.current) {
                          topRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }
                  }}
                  sx={{
                    fontSize: "1.25rem",
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
            </>
          )}
        {/* Notificación */}
        {notificacion.mensaje && (
          <NotificacionCuestionarios
            mensaje={notificacion.mensaje}
            tipo={notificacion.tipo}
            onClose={() => setNotificacion({ mensaje: null, tipo: null })}
          />
        )}

        {/* Conteo de preguntas respondidas para SIS y especiales */}
        {(sisQuestions.length || specialQuestions.length > 0) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              px: 2,
              mb: 1,
            }}
          >
            <Typography variant="body1">
              Respondidas: {getAnsweredUnlockedQuestions()} /{" "}
              {getTotalUnlockedQuestions()}
            </Typography>
          </Box>
        )}
        {/* Preguntas SIS, SIS2, y especiales */}
        {(sisQuestions.length || specialQuestions.length > 0) && (
          <Box sx={{ width: "100%" }}>
            {sisQuestions.length > 0 && (
              <ControlSIS
                preguntas={sisQuestions}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
                handleRespuestaChange={handleRespuestaChange}
                subitems={subitems}
                cuestionarioFinalizado={cuestionarioFinalizado}
                esEditable={esEditable}
              />
            )}
            {specialQuestions.length > 0 && (
              <>
                {specialQuestions.some((p) => p.tipo === "ed") && (
                  <ControlCuestionariosEspeciales
                    preguntas={specialQuestions.filter((p) => p.tipo === "ed")}
                    respuestas={respuestas}
                    setRespuestas={setRespuestas}
                    handleRespuestaChange={handleRespuestaChange}
                    technicalAids={technicalAids}
                    chAids={chAids}
                    cuestionarioFinalizado={cuestionarioFinalizado}
                    esEditable={esEditable}
                  />
                )}
                {specialQuestions.some((p) => p.tipo === "ch") && (
                  <ControlCuestionariosEspeciales
                    preguntas={specialQuestions.filter((p) => p.tipo === "ch")}
                    respuestas={respuestas}
                    setRespuestas={setRespuestas}
                    handleRespuestaChange={handleRespuestaChange}
                    technicalAids={technicalAids}
                    chAids={chAids}
                    cuestionarioFinalizado={cuestionarioFinalizado}
                    esEditable={esEditable}
                  />
                )}
              </>
            )}
          </Box>
        )}

        {/* Secciones agrupadas: solo mostrar contenido de la sección activa */}
        {!(sisQuestions.length || specialQuestions.length > 0) && (
          <Box sx={{ width: "100%", overflowY: "auto", mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", px: 2 }}>
              {expandedSection}
            </Typography>
            {Object.entries(otherQuestions).map(([section, preguntas]) =>
              expandedSection === section ? (
                <Box key={section}>
                  {preguntas.map((pregunta) => (
                    <Box
                      key={pregunta.id}
                      id={`pregunta-${pregunta.id}`}
                      sx={{
                        width: "100%",
                        my: 3,
                        overflow: "visible",
                        position: "relative",
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          border: preguntasNoRespondidas.has(pregunta.id)
                            ? "2px solid #ff1744"
                            : "2px solid transparent",
                          backgroundColor: preguntasNoRespondidas.has(
                            pregunta.id
                          )
                            ? "rgba(255, 23, 68, 0.05)"
                            : "white",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: preguntasNoRespondidas.has(pregunta.id)
                              ? "0 0 0 2px rgba(255, 23, 68, 0.2)"
                              : "0 2px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <TiposDePregunta
                            pregunta={pregunta}
                            respuesta={respuestas[pregunta.id]}
                            onRespuestaChange={(resp) => {
                              setRespuestas((prev) => ({
                                ...prev,
                                [pregunta.id]: resp,
                              }));
                              handleRespuestaChange(pregunta.id, resp);
                              validarPregunta(pregunta.id, resp, pregunta.tipo);
                            }}
                            unlockedQuestions={unlockedQuestions}
                            cuestionarioFinalizado={cuestionarioFinalizado}
                            usuario={usuario}
                            cuestionario={cuestionario}
                            esEditable={esEditable}
                            onGuardarCambios={handleGuardarCambios}
                          />
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              ) : null
            )}
          </Box>
        )}

        {/* Bloque de navegación y resumen inferior */}
        {!(sisQuestions.length || specialQuestions.length > 0) &&
          Object.keys(otherQuestions).length > 0 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  px: 2,
                }}
              >
                <IconButton
                  disabled={
                    Object.keys(otherQuestions).indexOf(expandedSection) === 0
                  }
                  onClick={() => {
                    const index =
                      Object.keys(otherQuestions).indexOf(expandedSection);
                    if (index > 0) {
                      const nuevaSeccion =
                        Object.keys(otherQuestions)[index - 1];
                      setExpandedSection(nuevaSeccion);
                      setTimeout(() => {
                        if (topRef.current) {
                          topRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }
                  }}
                  sx={{
                    fontSize: "1.25rem",
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>

                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Sección{" "}
                  {Object.keys(otherQuestions).indexOf(expandedSection) + 1} de{" "}
                  {Object.keys(otherQuestions).length}
                </Typography>

                <IconButton
                  disabled={
                    Object.keys(otherQuestions).indexOf(expandedSection) ===
                    Object.keys(otherQuestions).length - 1
                  }
                  onClick={() => {
                    const index =
                      Object.keys(otherQuestions).indexOf(expandedSection);
                    if (index < Object.keys(otherQuestions).length - 1) {
                      const nuevaSeccion =
                        Object.keys(otherQuestions)[index + 1];
                      setExpandedSection(nuevaSeccion);
                      setTimeout(() => {
                        if (topRef.current) {
                          topRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }
                  }}
                  sx={{
                    fontSize: "1.25rem",
                    color: "primary.main",
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  mb: 1,
                }}
              >
                <Typography variant="body1">
                  Sección{" "}
                  {Object.keys(otherQuestions).indexOf(expandedSection) + 1} de{" "}
                  {Object.keys(otherQuestions).length}
                </Typography>
                <Typography variant="body1">
                  Respondidas: {getAnsweredUnlockedQuestions()} /{" "}
                  {getTotalUnlockedQuestions()}
                </Typography>
              </Box>
            </>
          )}

        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <BotonFinCuestionario
            handleFinalizarCuestionario={handleFinalizarCuestionario}
            disabled={!todasPreguntasRespondidas() || cuestionarioFinalizado}
          />
        </Box>
      </Box>
    </div>
  );
};

export default Preguntas;
