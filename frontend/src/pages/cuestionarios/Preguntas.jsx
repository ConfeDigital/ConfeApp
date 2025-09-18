import React, { useState, useEffect, useCallback, useRef, useMemo, startTransition } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import TiposDePregunta from "./TiposDePregunta";
import ControlSIS from "./ControlSIS"; // Importar el nuevo componente
import CH_0a4 from "../../components/tipos_de_pregunta/CH";
import api from "../../api";
import NotificacionCuestionarios from "./NotificacionCuestionarios";
import BotonFinCuestionario from "./BotonFinCuestionario";
import { useNavigate } from "react-router-dom";

const MemoizedTiposDePregunta = React.memo(TiposDePregunta);

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
  const [unifiedSections, setUnifiedSections] = useState([]);
  const [preguntasNoRespondidas, setPreguntasNoRespondidas] = useState(
    new Set()
  );
  // Estado para rastrear el estado de envío de cada pregunta
  const [questionSubmitStates, setQuestionSubmitStates] = useState({});
  const topRef = useRef(null);

  const navigate = useNavigate();
  // Notificaciones
  const [notificacion, setNotificacion] = useState({
    mensaje: null,
    tipo: null,
  });

  // Componente para mostrar el indicador de estado de envío
  const QuestionSubmitIndicator = ({ preguntaId }) => {
    const submitState = questionSubmitStates[preguntaId];

    if (!submitState) return null;

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
        {submitState === "loading" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Guardando...
            </Typography>
          </Box>
        )}
        {submitState === "success" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="caption" color="success.main">
              Guardado
            </Typography>
          </Box>
        )}
        {submitState === "error" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon sx={{ color: "error.main", fontSize: 20 }} />
            <Typography variant="caption" color="error.main">
              Error al guardar
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Los estados ahora persisten hasta que se haga una nueva acción
  // No hay limpieza automática de estados

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

  // Efecto para crear secciones unificadas
  useEffect(() => {
    const specialQuestions = Object.values(groupedQuestions)
      .flat()
      .filter((pregunta) => pregunta.tipo === "ed" || pregunta.tipo === "ch");
    
    const specialSections = specialQuestions.reduce((acc, pregunta) => {
      const section = pregunta.nombre_seccion || "Sin sección";
      if (!acc[section]) acc[section] = [];
      acc[section].push(pregunta);
      return acc;
    }, {});

    const regularSections = Object.entries(groupedQuestions).reduce((acc, [section, preguntas]) => {
      const regularPreguntas = preguntas.filter(
        (pregunta) =>
          pregunta.tipo !== "sis" &&
          pregunta.tipo !== "sis2" &&
          pregunta.tipo !== "ed" &&
          pregunta.tipo !== "ch"
      );
      if (regularPreguntas.length > 0) {
        acc[section] = regularPreguntas;
      }
      return acc;
    }, {});

    // Combine sections: special sections first, then regular sections
    const unified = [
      ...Object.keys(specialSections).map(section => ({ name: section, type: 'special', questions: specialSections[section] })),
      ...Object.keys(regularSections).map(section => ({ name: section, type: 'regular', questions: regularSections[section] }))
    ];

    setUnifiedSections(unified);
  }, [groupedQuestions]);

  // Efecto para seleccionar automáticamente el primer tab de sección
  useEffect(() => {
    if (unifiedSections.length > 0 && !expandedSection) {
      setExpandedSection(unifiedSections[0].name);
    }
  }, [unifiedSections, expandedSection]);

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
                // console.error("❌ Error parsing checkbox response:", error);
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
          } else if (
            pregunta.tipo === "multiple" ||
            pregunta.tipo === "dropdown"
          ) {
            // Para preguntas tipo multiple y dropdown
            const opcionSeleccionada = pregunta.opciones.find(
              (op) => op.valor === parseInt(respuesta, 10)
            );

            if (opcionSeleccionada?.desbloqueos) {
              opcionSeleccionada.desbloqueos.forEach((desbloqueo) => {
                unlocked.add(desbloqueo.pregunta_desbloqueada);
              });
            }
          } else if (
            pregunta.tipo === "binaria" ||
            pregunta.tipo === "profile_field_boolean" ||
            (pregunta.profile_field_path &&
              pregunta.profile_field_metadata?.type === "boolean") ||
            (pregunta.opciones.length === 2 &&
              pregunta.opciones.some((op) => op.texto === "Sí") &&
              pregunta.opciones.some((op) => op.texto === "No"))
          ) {

            // Para preguntas binarias, buscar por texto de la opción
            const opcionSeleccionada = pregunta.opciones.find(
              (op) => op.texto === respuesta
            );

            if (opcionSeleccionada?.desbloqueos) {
              opcionSeleccionada.desbloqueos.forEach((desbloqueo) => {
                unlocked.add(desbloqueo.pregunta_desbloqueada);
              });
            }
          } else if (
            pregunta.tipo === "profile_field_choice" ||
            (pregunta.profile_field_path &&
              pregunta.profile_field_metadata?.type === "choice")
          ) {
            // Para preguntas de campo de perfil tipo choice, usar valor numérico
            const opcionSeleccionada = pregunta.opciones.find(
              (op) => op.valor === parseInt(respuesta, 10)
            );

            if (opcionSeleccionada?.desbloqueos) {
              opcionSeleccionada.desbloqueos.forEach((desbloqueo) => {
                unlocked.add(desbloqueo.pregunta_desbloqueada);
              });
            }
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

  // Función para cargar valores de profile fields para cálculo de desbloqueos
  const loadProfileFieldValues = async () => {
    const profileFieldQuestions = cuestionario.preguntas.filter(
      (p) => p.profile_field_path
    );

    const profileFieldValues = {};

    for (const pregunta of profileFieldQuestions) {
      try {
        const response = await api.get(
          `/api/cuestionarios/profile-fields/user/${usuario}/value/${pregunta.profile_field_path}/`
        );

        if (response.data.success && response.data.value !== null) {
          let displayValue = response.data.value;
          const fieldMetadata =
            pregunta.profile_field_metadata || pregunta.profile_field_config;

          // Convert actual profile values to option indices for display (same logic as ProfileField)
          if (fieldMetadata?.type === "choice" && pregunta.opciones) {
            const choiceIndex = fieldMetadata.choices?.findIndex(
              ([val, label]) => val === response.data.value
            );
            if (choiceIndex >= 0 && pregunta.opciones[choiceIndex]) {
              displayValue = pregunta.opciones[choiceIndex].valor;
            }
          } else if (fieldMetadata?.type === "boolean") {
            const boolValue = response.data.value;
            // For unlocking logic, we need the text value that matches the option text
            if (
              boolValue === true ||
              boolValue === "true" ||
              boolValue === 1 ||
              boolValue === "1"
            ) {
              displayValue = "Sí"; // Text value for unlocking logic
            } else if (
              boolValue === false ||
              boolValue === "false" ||
              boolValue === 0 ||
              boolValue === "0"
            ) {
              displayValue = "No"; // Text value for unlocking logic
            } else {
              console.warn("Unexpected boolean value:", boolValue);
              displayValue = null;
            }
          }

          if (displayValue !== null) {
            profileFieldValues[pregunta.id] = displayValue;
            // console.log(`Loaded profile field value for question ${pregunta.id}:`, displayValue);
          }
        }
      } catch (error) {
        console.error(
          `Error loading profile field value for question ${pregunta.id}:`,
          error
        );
      }
    }

    return profileFieldValues;
  };

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

  // Función para validar que los desbloqueos estén correctos
  const validateUnlocks = useCallback(() => {
    const unlocked = calculateUnlockedQuestions(respuestas);
    setUnlockedQuestions(unlocked);
  }, [respuestas, calculateUnlockedQuestions]);

  // Efecto para validar desbloqueos cuando se cargan las respuestas
  useEffect(() => {
    if (Object.keys(respuestas).length > 0) {
      validateUnlocks();
    }
  }, [respuestas, validateUnlocks]);

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
          // console.error("Error parsing respuesta:", error);
          respuestasMap[respuesta.pregunta] = respuesta.respuesta;
        }
      });

      // Load profile field values and merge them with regular responses
      const profileFieldValues = await loadProfileFieldValues();
      const mergedRespuestas = { ...respuestasMap, ...profileFieldValues };

      setRespuestas(mergedRespuestas);
    } catch (error) {
      // console.error("Error fetching respuestas:", error);
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
  const isRespuestaValida = useCallback(
    (respuesta, tipoPregunta, pregunta = null) => {
      // Special handling for profile field questions
      if (pregunta && pregunta.profile_field_path) {
        // For profile field questions, any non-null, non-undefined value is valid
        // This includes 0, false (which are valid for choice and boolean fields)
        // Only exclude null, undefined, and empty strings
        if (respuesta === null || respuesta === undefined) {
          return false;
        }
        // For choice and boolean fields, 0 is a valid value
        if (typeof respuesta === "number" || typeof respuesta === "boolean") {
          return true;
        }
        // For string values, check if not empty
        if (typeof respuesta === "string") {
          return respuesta.trim() !== "";
        }
        // For other types, consider valid if not null/undefined
        return true;
      }

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
          return (
            respuestaParaValidar === true || respuestaParaValidar === false
          );

        case "imagen":
          // Para preguntas de imagen (slider), debe ser un número válido
          return (
            !isNaN(Number(respuestaParaValidar)) &&
            respuestaParaValidar !== null &&
            respuestaParaValidar !== undefined
          );

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
    },
    []
  );

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

        // Use the centralized validation function
        return isRespuestaValida(respuesta, pregunta.tipo, pregunta);
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
          // For abierta questions, send as simple string
          return respuesta || "";

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
          return respuesta; // Mantener la estructura original para datos especializados

        case "imagen":
          // Para preguntas de imagen (slider), retornar el valor numérico
          const valorImagen = parseFloat(respuesta) || 0;
          return {
            valor: valorImagen,
            valor_original: respuesta,
          };

        default:
          return respuesta;
      }
    } catch (error) {
      // console.error("Error procesando respuesta:", error);
      return {
        valor_original: respuesta,
        texto: `Error procesando respuesta: ${error.message}`,
        opciones_info: [],
      };
    }
  };

// Enhanced debounce function with request cancellation
function debounce(fn, delay) {
  let timer;
  let controller;
  
  return (...args) => {
    // Cancel previous request if still pending
    if (controller) {
      controller.abort();
    }
    
    clearTimeout(timer);
    controller = new AbortController();
    
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// Create debounced function outside of useCallback to prevent recreation
const debouncedSaveRef = useRef();

if (!debouncedSaveRef.current) {
  debouncedSaveRef.current = debounce(async (preguntaId, respuesta, context) => {
    const { 
      usuario, 
      cuestionario, 
      isRespuestaValida, 
      procesarRespuesta,
      setQuestionSubmitStates,
      setNotificacion,
      setUnlockedQuestions,
      setPreguntasNoRespondidas 
    } = context;
    
    try {
      const preguntaActual = cuestionario.preguntas.find(
        (p) => p.id === preguntaId
      );

      // For profile field questions, no API save needed
      if (preguntaActual.profile_field_path) {
        return;
      }

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

      if (
        !isRespuestaValida(respuesta, preguntaActual.tipo, preguntaActual)
      ) {
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

      // Establecer estado de carga para esta pregunta
      setQuestionSubmitStates((prev) => ({
        ...prev,
        [preguntaId]: "loading",
      }));

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
        // Para binarias, enviar la opción seleccionada directamente
        if (
          respuesta === true ||
          respuesta === "true" ||
          respuesta === "1" ||
          respuesta === "sí" ||
          respuesta === "si"
        ) {
          respuestaParaEnviar = "Sí";
        } else {
          respuestaParaEnviar = "No";
        }
      } else if (preguntaActual.tipo === "checkbox") {
        // Para checkbox, enviar el array de IDs
        respuestaParaEnviar = Array.isArray(respuesta) ? respuesta : [];
      } else if (preguntaActual.tipo === "imagen") {
        // Para preguntas de imagen (slider), enviar el valor numérico
        respuestaParaEnviar = parseFloat(respuesta) || 0;
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

      // Establecer estado de éxito para esta pregunta
      setQuestionSubmitStates((prev) => ({
        ...prev,
        [preguntaId]: "success",
      }));

      // Actualizar preguntas desbloqueadas
      setUnlockedQuestions((prev) => {
        const nuevos = new Set(prev);
        const pregunta = cuestionario.preguntas.find(
          (p) => p.id === preguntaId
        );

        // Eliminar posibles desbloqueos antiguos de esta pregunta
        pregunta?.opciones?.forEach((op) => {
          op.desbloqueos?.forEach((d) => {
            nuevos.delete(d.pregunta_desbloqueada);
          });
        });

        // Agregar desbloqueos de las opciones seleccionadas
        if (pregunta?.tipo === "checkbox") {
          // Para checkbox, respuesta es un array de opciones seleccionadas
          if (Array.isArray(respuesta)) {
            respuesta.forEach((opcionSeleccionada) => {
              const opcion = pregunta.opciones?.find(
                (op) => op.id === opcionSeleccionada
              );

              if (opcion?.desbloqueos) {
                opcion.desbloqueos.forEach((d) => {
                  nuevos.add(d.pregunta_desbloqueada);
                });
              }
            });
          }
        } else if (
          pregunta?.tipo === "multiple" ||
          pregunta?.tipo === "dropdown"
        ) {
          // Para preguntas tipo multiple y dropdown
          const opcionSeleccionada = pregunta?.opciones?.find(
            (op) => op.valor === parseInt(respuesta, 10)
          );

          if (opcionSeleccionada?.desbloqueos) {
            opcionSeleccionada.desbloqueos.forEach((d) => {
              nuevos.add(d.pregunta_desbloqueada);
            });
          }
        } else if (
          pregunta?.tipo === "binaria" ||
          (pregunta?.tipo === "multiple" &&
            pregunta?.opciones?.length === 2 &&
            pregunta?.opciones?.some((op) => op.texto === "Sí") &&
            pregunta?.opciones?.some((op) => op.texto === "No"))
        ) {
          // Para preguntas binarias, convertir la respuesta al texto correcto
          let respuestaTexto;
          if (
            respuesta === true ||
            respuesta === "true" ||
            respuesta === "1" ||
            respuesta === "sí" ||
            respuesta === "si"
          ) {
            respuestaTexto = "Sí";
          } else {
            respuestaTexto = "No";
          }

          const opcionSeleccionada = pregunta?.opciones?.find(
            (op) => op.texto === respuestaTexto
          );

          if (opcionSeleccionada?.desbloqueos) {
            opcionSeleccionada.desbloqueos.forEach((d) => {
              nuevos.add(d.pregunta_desbloqueada);
            });
          }
        } else {
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

      // Establecer estado de error para esta pregunta
      setQuestionSubmitStates((prev) => ({
        ...prev,
        [preguntaId]: "error",
      }));

      setNotificacion({
        mensaje: "Error al guardar la respuesta",
        tipo: "error",
      });
    }
  }, 1500);
}

// Handler para cambios en respuestas
const handleRespuestaChange = useCallback((preguntaId, respuesta) => {
  try {
    // Validar la respuesta antes de guardar
    const preguntaActual = cuestionario.preguntas.find(
      (p) => p.id === preguntaId
    );

    // Always update local state immediately for responsive UI
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: respuesta,
    }));

    // For profile field questions, just update local state for validation purposes
    if (preguntaActual.profile_field_path) {
      // Remove from unanswered questions if the response is valid
      if (
        isRespuestaValida(respuesta, preguntaActual.tipo, preguntaActual)
      ) {
        setPreguntasNoRespondidas((prev) => {
          const newSet = new Set(prev);
          newSet.delete(preguntaId);
          return newSet;
        });
      }
      return;
    }

    // For regular questions, use the debounced API save
    const context = {
      usuario,
      cuestionario,
      isRespuestaValida,
      procesarRespuesta,
      setQuestionSubmitStates,
      setNotificacion,
      setUnlockedQuestions,
      setPreguntasNoRespondidas
    };

    debouncedSaveRef.current(preguntaId, respuesta, context);
    
  } catch (error) {
    console.error("Error in handleRespuestaChange:", error);
  }
}, [usuario, cuestionario, isRespuestaValida, procesarRespuesta]);

// Memoized calculations to prevent unnecessary recalculations
const memoizedCalculations = useMemo(() => {
  const todasLasPreguntas = Object.values(groupedQuestions).flat();
  
  const preguntasNoVisibles = todasLasPreguntas.filter(
    (p) => p.desbloqueos_recibidos.length > 0 && !unlockedQuestions.has(p.id)
  );
  
  const totalPreguntas = todasLasPreguntas.length - preguntasNoVisibles.length + unlockedQuestions.size;
  
  const respondidas = Object.entries(respuestas).filter(([preguntaId, respuesta]) => {
    const pregunta = todasLasPreguntas.find((p) => p.id === parseInt(preguntaId));
    return pregunta && isRespuestaValida(respuesta, pregunta.tipo, pregunta);
  }).length;
  
  return { totalPreguntas, respondidas, todasLasPreguntas };
}, [groupedQuestions, unlockedQuestions, respuestas, isRespuestaValida]);

// Optimized effect for question counter updates
useEffect(() => {
  if (onQuestionUnlock) {
    onQuestionUnlock("counter", {
      total: memoizedCalculations.totalPreguntas,
      answered: memoizedCalculations.respondidas,
    });
  }
}, [memoizedCalculations, onQuestionUnlock]);

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
      return !isRespuestaValida(respuesta, pregunta.tipo, pregunta);
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
      return pregunta && isRespuestaValida(respuesta, pregunta.tipo, pregunta);
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
      return !isRespuestaValida(respuesta, pregunta.tipo, pregunta);
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
      if (!isRespuestaValida(respuesta, pregunta.tipo, pregunta)) {
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
      if (!isRespuestaValida(respuesta, tipoPregunta, pregunta)) {
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
      return !isRespuestaValida(respuesta, pregunta.tipo, pregunta);
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
      await api.post("/api/cuestionarios/finalizar-cuestionario/", {
        usuario: usuario,
        cuestionario: cuestionario.id,
      });
      setCuestionarioFinalizado(true);
      setNotificacion({
        mensaje: "Cuestionario finalizado con éxito!",
        tipo: "exito",
      });

      // Refrescar los datos del candidato para actualizar el estado
      try {
        await api.get(`/api/candidatos/profiles/${usuario}/`);
      } catch (refreshError) {
        console.error("Error refrescando datos del candidato:", refreshError);
      }

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
        {/* Navegación unificada de secciones */}
        {unifiedSections.length > 0 && (
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
                  {unifiedSections.findIndex(s => s.name === expandedSection) + 1} de{" "}
                  {unifiedSections.length}
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
                    unifiedSections.findIndex(s => s.name === expandedSection) === 0
                  }
                  onClick={() => {
                    const index =
                      unifiedSections.findIndex(s => s.name === expandedSection);
                    if (index > 0) {
                      const nuevaSeccion =
                        unifiedSections[index - 1].name;
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
                  {unifiedSections.findIndex(s => s.name === expandedSection) + 1} de{" "}
                  {unifiedSections.length}
                </Typography>

                <IconButton
                  disabled={
                    unifiedSections.findIndex(s => s.name === expandedSection) ===
                    unifiedSections.length - 1
                  }
                  onClick={() => {
                    const index =
                      unifiedSections.findIndex(s => s.name === expandedSection);
                    if (index < unifiedSections.length - 1) {
                      const nuevaSeccion =
                        unifiedSections[index + 1].name;
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

        {/* Preguntas SIS - solo para cuestionarios SIS puros */}
        {sisQuestions.length > 0 && specialQuestions.length === 0 && (
          <Box sx={{ width: "100%" }}>
            <ControlSIS
              preguntas={sisQuestions}
              respuestas={respuestas}
              setRespuestas={setRespuestas}
              handleRespuestaChange={handleRespuestaChange}
              subitems={subitems}
              cuestionarioFinalizado={cuestionarioFinalizado}
              esEditable={esEditable}
              questionSubmitStates={questionSubmitStates}
              QuestionSubmitIndicator={QuestionSubmitIndicator}
            />
          </Box>
        )}

        {/* Secciones agrupadas: solo mostrar contenido de la sección activa */}
        {unifiedSections.length > 0 && (
          <Box sx={{ width: "100%", overflowY: "auto", mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", px: 2 }}>
              {expandedSection}
            </Typography>
            {unifiedSections.map((sectionData) =>
              expandedSection === sectionData.name ? (
                <Box key={sectionData.name}>
                  {sectionData.type === 'special' ? (
                    // Render special questions directly
                    <Box sx={{ width: "100%" }}>
                      {sectionData.questions.some(p => p.tipo === "ed") && (
                        <Box sx={{ mb: 2 }}>
                          {sectionData.questions
                            .filter(p => p.tipo === "ed")
                            .map((pregunta) => (
                              <Box key={pregunta.id} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Pregunta ED: {pregunta.texto}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      )}
                      {sectionData.questions.some(p => p.tipo === "ch") && (
                        <CH_0a4
                          preguntas={sectionData.questions.filter(p => p.tipo === "ch")}
                          respuestas={respuestas}
                          setRespuestas={setRespuestas}
                          handleRespuestaChange={handleRespuestaChange}
                          disabled={cuestionarioFinalizado && !esEditable}
                          chAids={chAids}
                          questionSubmitStates={questionSubmitStates}
                          QuestionSubmitIndicator={QuestionSubmitIndicator}
                        />
                      )}
                    </Box>
                  ) : (
                    // Render regular questions
                    sectionData.questions
                      .filter((pregunta) => isQuestionVisible(pregunta))
                      .map((pregunta) => (
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
                            p: 2,
                            borderRadius: 2,
                            border: preguntasNoRespondidas.has(pregunta.id)
                              ? "2px solid #ff1744"
                              : "2px solid transparent",
                            backgroundColor: preguntasNoRespondidas.has(
                              pregunta.id
                            )
                              ? "rgba(255, 23, 68, 0.05)"
                              : "background.paper",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              boxShadow: preguntasNoRespondidas.has(pregunta.id)
                                ? "0 0 0 2px rgba(255, 23, 68, 0.2)"
                                : "0 2px 8px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <Box sx={{ width: "100%" }}>
                            <MemoizedTiposDePregunta
                              pregunta={pregunta}
                              respuesta={respuestas[pregunta.id]}
                              onRespuestaChange={(resp) => {
                                setRespuestas((prev) => ({
                                  ...prev,
                                  [pregunta.id]: resp,
                                }));
                                handleRespuestaChange(pregunta.id, resp);
                                validarPregunta(
                                  pregunta.id,
                                  resp,
                                  pregunta.tipo
                                );
                              }}
                              unlockedQuestions={unlockedQuestions}
                              cuestionarioFinalizado={cuestionarioFinalizado}
                              usuario={usuario}
                              cuestionario={cuestionario}
                              esEditable={esEditable}
                              onGuardarCambios={handleGuardarCambios}
                            />
                            <QuestionSubmitIndicator preguntaId={pregunta.id} />
                          </Box>
                        </Paper>
                      </Box>
                    ))
                  )}
                </Box>
              ) : null
            )}
          </Box>
        )}

        {/* Bloque de navegación y resumen inferior */}
        {unifiedSections.length > 0 && (
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
                    unifiedSections.findIndex(s => s.name === expandedSection) === 0
                  }
                  onClick={() => {
                    const index =
                      unifiedSections.findIndex(s => s.name === expandedSection);
                    if (index > 0) {
                      const nuevaSeccion =
                        unifiedSections[index - 1].name;
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
                  {unifiedSections.findIndex(s => s.name === expandedSection) + 1} de{" "}
                  {unifiedSections.length}
                </Typography>

                <IconButton
                  disabled={
                    unifiedSections.findIndex(s => s.name === expandedSection) ===
                    unifiedSections.length - 1
                  }
                  onClick={() => {
                    const index =
                      unifiedSections.findIndex(s => s.name === expandedSection);
                    if (index < unifiedSections.length - 1) {
                      const nuevaSeccion =
                        unifiedSections[index + 1].name;
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
                  {unifiedSections.findIndex(s => s.name === expandedSection) + 1} de{" "}
                  {unifiedSections.length}
                </Typography>
                <Typography variant="body1">
                  Respondidas: {getAnsweredUnlockedQuestions()} /{" "}
                  {getTotalUnlockedQuestions()}
                </Typography>
              </Box>
            </>
          )}

        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
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
