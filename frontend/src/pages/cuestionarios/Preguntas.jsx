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
}) => {
  // Estados principales
  const [respuestas, setRespuestas] = useState({});
  const [unlockedQuestions, setUnlockedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [preguntasEditables, setPreguntasEditables] = useState(new Set());
  const [preguntasEditables, setPreguntasEditables] = useState([]);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const accordionRefs = useRef({});
  const topRef = useRef(null);
  // const [subitems, setSubitems] = useState([]);

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

  // Cargar respuestas existentes
  useEffect(() => {
    const fetchRespuestas = async () => {
      try {
        const response = await api.get("/api/cuestionarios/respuestas/", {
          params: { usuario, cuestionario: cuestionario.id },
        });

        const respuestasMap = {};
        response.data.forEach((respuesta) => {
          try {
            respuestasMap[respuesta.pregunta] =
              typeof respuesta.respuesta === "string" &&
              respuesta.respuesta.startsWith("{")
                ? JSON.parse(respuesta.respuesta)
                : respuesta.respuesta;
          } catch (error) {
            console.error("Error parsing respuesta:", error);
            respuestasMap[respuesta.pregunta] = respuesta.respuesta;
          }
        });

        setRespuestas(respuestasMap);
        setUnlockedQuestions(calculateUnlockedQuestions(respuestasMap));
      } catch (error) {
        console.error("Error fetching respuestas:", error);
        setError("Error al cargar las respuestas");
      } finally {
        setLoading(false);
      }
    };

    fetchRespuestas();
  }, [usuario, cuestionario]);

  // Calcular preguntas desbloqueadas
  const calculateUnlockedQuestions = useCallback(
    (respuestas) => {
      const unlocked = new Set();
      Object.entries(respuestas).forEach(([preguntaId, respuesta]) => {
        const pregunta = cuestionario.preguntas.find(
          (p) => p.id === parseInt(preguntaId, 10)
        );
        if (pregunta?.opciones) {
          const opcionSeleccionada = pregunta.opciones[parseInt(respuesta, 10)];
          opcionSeleccionada?.desbloqueos?.forEach((desbloqueo) => {
            unlocked.add(desbloqueo.pregunta_desbloqueada);
          });
        }
      });
      return unlocked;
    },
    [cuestionario]
  );

  // Handler para cambios en respuestas
  const handleRespuestaChange = useCallback(
    debounce(async (preguntaId, respuesta) => {
      try {
        await api.post("/api/cuestionarios/respuestas/", {
          usuario,
          cuestionario: cuestionario.id,
          pregunta: preguntaId,
          respuesta: JSON.stringify(respuesta),
        });

        // Actualizar preguntas desbloqueadas
        setUnlockedQuestions((prev) => {
          const nuevos = new Set(prev);
          const pregunta = cuestionario.preguntas.find(
            (p) => p.id === preguntaId
          );
          // Eliminar posibles desbloqueos antiguos
          pregunta?.opciones?.forEach((op) => {
            op.desbloqueos?.forEach((d) =>
              nuevos.delete(d.pregunta_desbloqueada)
            );
          });
          // Agregar desbloqueos de la opción seleccionada
          const opcionSeleccionada = pregunta?.opciones?.[respuesta];
          opcionSeleccionada?.desbloqueos?.forEach((d) =>
            nuevos.add(d.pregunta_desbloqueada)
          );
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
    [usuario, cuestionario]
  );

  // Función para obtener preguntas visibles que no tienen respuesta
  const getUnansweredQuestions = () => {
    // 1. Obtener todas las preguntas VISIBLES según tus reglas de desbloqueo
    const preguntasVisibles = Object.values(groupedQuestions)
      .flat()
      .filter((pregunta) => {
        // Si la pregunta no recibe ningún "desbloqueo" (no depende de otra), es visible por defecto
        if (pregunta.desbloqueos_recibidos.length === 0) return true;
        // De lo contrario, es visible solo si está en la lista de 'unlockedQuestions'
        return pregunta.desbloqueos_recibidos.some((desbloqueo) =>
          unlockedQuestions.has(desbloqueo.pregunta_desbloqueada)
        );
      });

    // 2. Filtrar las que no tienen respuesta "válida" (tomando en cuenta checkboxes vacíos, strings vacíos, etc.)
    const unanswered = preguntasVisibles.filter((pregunta) => {
      const respuesta = respuestas[pregunta.id];
      if (respuesta === undefined || respuesta === null || respuesta === "") {
        return true;
      }
      // Si es un arreglo (ej. checkbox), verificar si está vacío
      if (Array.isArray(respuesta) && respuesta.length === 0) {
        return true;
      }
      return false;
    });

    return unanswered;
  };

  // Verificar si todas las preguntas visibles están respondidas
  const todasPreguntasRespondidas = () => {
    const unanswered = getUnansweredQuestions();
    return unanswered.length === 0;
  };

  // Finalizar cuestionario
  const handleFinalizarCuestionario = async () => {
    // Primero, revisamos cuáles preguntas no están respondidas
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0) {
      // Armamos una lista con el texto de cada pregunta (o el ID, o lo que prefieras)
      const listaPreguntas = unanswered.map((p) => `- ${p.texto}`).join("\n");

      setNotificacion({
        mensaje: `Por favor, responde todas las preguntas visibles antes de finalizar. Te faltó contestar:\n${listaPreguntas}`,
        tipo: "error",
      });
      return;
    }

    try {
      await api.post("/api/cuestionarios/validar-estado-cuestionario/", {
        usuario,
        cuestionario: cuestionario.id,
        estado: "finalizado",
        fecha_finalizado: new Date().toISOString(),
      });
      setCuestionarioFinalizado(true);
      setNotificacion({
        mensaje: "Cuestionario finalizado con éxito!",
        tipo: "exito",
      });

      // ✅ Usa navigate() en lugar de useNavigate()
      navigate(`/candidatos/${usuario}`)
      // window.location.href = `/candidatos/${usuario}`;
      // window.location.reload();

      // navigate(`/candidatos/${usuario}`);
    } catch (error) {
      console.error("Error finalizando cuestionario:", error);
      setNotificacion({
        mensaje: "Error al finalizar el cuestionario",
        tipo: "error",
      });
    }
  };

  // Manejar edición de preguntas
  // const toggleEdicionPregunta = (preguntaId) => {
  //   setPreguntasEditables((prev) => {
  //     const nuevas = new Set(prev);
  //     nuevas.has(preguntaId)
  //       ? nuevas.delete(preguntaId)
  //       : nuevas.add(preguntaId);
  //     return nuevas;
  //   });
  // };

  const toggleEdicionPregunta = (preguntaId) => {
    setPreguntasEditables((prev) => {
      if (prev.includes(preguntaId)) {
        return prev.filter((id) => id !== preguntaId);
      } else {
        return [...prev, preguntaId];
      }
    });
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
  console.log("preguntas especiales:", specialQuestions.length);

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
                  Respondidas:{" "}
                  {
                    Object.keys(respuestas).filter((id) => {
                      const r = respuestas[id];
                      return (
                        r !== null &&
                        r !== "" &&
                        (!Array.isArray(r) || r.length > 0)
                      );
                    }).length
                  }{" "}
                  / {Object.values(groupedQuestions).flat().length}
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
              Respondidas:{" "}
              {
                Object.keys(respuestas).filter((id) => {
                  const r = respuestas[id];
                  return (
                    r !== null &&
                    r !== "" &&
                    (!Array.isArray(r) || r.length > 0)
                  );
                }).length
              }{" "}
              / {Object.values(groupedQuestions).flat().length}
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
                            }}
                            unlockedQuestions={unlockedQuestions}
                            cuestionarioFinalizado={cuestionarioFinalizado}
                            usuario={usuario}
                            cuestionario={cuestionario}
                            esEditable={esEditable}
                            onGuardarCambios={async (id) => {
                              toggleEdicionPregunta(id);
                              try {
                                const response = await api.get(
                                  "/api/cuestionarios/finalizar-cuestionario/",
                                  {
                                    params: {
                                      usuario,
                                      cuestionario: cuestionario.id,
                                    },
                                  }
                                );
                                const estado = response.data?.[0]?.estado;
                                if (estado === "finalizado") {
                                  setCuestionarioFinalizado(true);
                                }
                              } catch (error) {
                                console.error(
                                  "Error verificando finalización:",
                                  error
                                );
                              }
                            }}
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
                  Respondidas:{" "}
                  {
                    Object.keys(respuestas).filter((id) => {
                      const r = respuestas[id];
                      return (
                        r !== null &&
                        r !== "" &&
                        (!Array.isArray(r) || r.length > 0)
                      );
                    }).length
                  }{" "}
                  / {Object.values(groupedQuestions).flat().length}
                </Typography>
              </Box>
            </>
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
              Respondidas:{" "}
              {
                Object.keys(respuestas).filter((id) => {
                  const r = respuestas[id];
                  return (
                    r !== null &&
                    r !== "" &&
                    (!Array.isArray(r) || r.length > 0)
                  );
                }).length
              }{" "}
              / {Object.values(groupedQuestions).flat().length}
            </Typography>
          </Box>
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
