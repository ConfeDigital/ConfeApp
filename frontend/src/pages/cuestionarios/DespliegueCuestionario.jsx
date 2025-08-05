import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../api";
import Preguntas from "./Preguntas";
import SeleccionCuestionarioVisualizacion from "./seleccionCuestionarioVisualizacion";
import { useNavigate } from "react-router-dom";
import LoadingPopup from "../../components/LoadingPopup";

function DespliegueCuestionario({
  usuarioId,
  cuestionarioId,
  onClose,
  showUserSelection = true,
  preentrevista = false,
}) {
  // Estados principales
  const [usuario, setUsuario] = useState(null);
  const [cuestionario, setCuestionario] = useState(null);
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [lastAnsweredQuestionIndex, setLastAnsweredQuestionIndex] =
    useState(-1);
  const [cuestionarioFinalizado, setCuestionarioFinalizado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [respuestas, setRespuestas] = useState([]);
  const [showError, setShowError] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [cuestionariosFinalizados, setCuestionariosFinalizados] = useState([]);
  const [respuestasCuestionarioFinalizado, setRespuestasCuestionarioFinalizado] = useState([]);
  const [modoEdicionGlobal, setModoEdicionGlobal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subitems, setSubitems] = useState([]);
  const [technicalAids, setTechnicalAids] = useState([]);
  const [chAids, setCHAids] = useState([]);
  const [unlockedQuestions, setUnlockedQuestions] = useState(new Set());
  const [totalUnlockedQuestions, setTotalUnlockedQuestions] = useState(0);
  const [answeredUnlockedQuestions, setAnsweredUnlockedQuestions] = useState(0);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [finalizingLoading, setFinalizingLoading] = useState(false);

  const navigate = useNavigate();



  useEffect(() => {
    const fetchSISAids = async () => {
      try {
        const response = await api.get("/api/discapacidad/sis-aids-view/");

        // 🔹 Agrupamos los subitems por item.name
        const subitemsMap = Object.entries(response.data).reduce(
          (acc, [itemName, subitems]) => {
            acc[itemName] = subitems;
            return acc;
          },
          {}
        );

        setSubitems(subitemsMap);
      } catch (error) {
        console.error("🔥 Error fetching SIS aids:", error);
        if (error.response) {
          console.error("📥 Backend response error:", error.response.data);
        }

        // Error loading SIS aids
      }
    };

    const fetchTechnicalAids = async () => {
      try {
        const response = await api.get(
          "/api/discapacidad/technical-aids-view/"
        );
        const aidsMap = Object.entries(response.data).reduce(
          (acc, [itemName, aids]) => {
            acc[itemName] = aids;
            return acc;
          },
          {}
        );
        setTechnicalAids(aidsMap);
      } catch (error) {
        console.error("🔥 Error fetching Technical Aids:", error);
      }
    };

    const fetchCHAids = async () => {
      try {
        const response = await api.get("/api/discapacidad/ch-items-view/");
        const aidsMap = Object.entries(response.data).reduce(
          (acc, [itemName, aids]) => {
            acc[itemName] = aids;
            return acc;
          },
          {}
        );
        setCHAids(aidsMap);
      } catch (error) {
        console.error("🔥 Error fetching CH Aids:", error);
      }
    };

    fetchSISAids();
    fetchTechnicalAids();
    fetchCHAids();
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setQuestionnaireLoading(true);

      // Delay mínimo para que se vea el loading
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        if (usuarioId && cuestionarioId) {
          const usuarioResponse = await api.get(`/api/usuarios/${usuarioId}/`);
          setUsuario(usuarioResponse.data);

          const cuestionarioResponse = await api.get(
            `/api/cuestionarios/${cuestionarioId}/`
          );
          setCuestionario(cuestionarioResponse.data);

          // Llamar a fetchExistingResponses con los datos correctos
          await fetchExistingResponses(
            usuarioResponse.data,
            cuestionarioResponse.data
          );
          await fetchEstadoCuestionario(
            usuarioResponse.data,
            cuestionarioResponse.data
          );
          await fetchCuestionariosFinalizados();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
        setQuestionnaireLoading(false);
      }
    };

    fetchData();
  }, [usuarioId, cuestionarioId]);

  // Removido useEffect duplicado - ya se maneja en el useEffect principal

  // Función para obtener respuestas existentes
  const fetchExistingResponses = async (usuario, cuestionario) => {
    try {
      const existingResponses = await api.get(
        "/api/cuestionarios/respuestas/",
        {
          params: {
            usuario: usuario.id,
            cuestionario: cuestionario.id,
          },
        }
      );

      // Filtrar respuestas específicas para este usuario y cuestionario
      const respuestasFiltradas = existingResponses.data.filter(
        (respuesta) =>
          respuesta.usuario === usuario.id &&
          respuesta.cuestionario === cuestionario.id
      );

      setRespuestas(respuestasFiltradas);

      // Obtener las preguntas respondidas
      const answeredQuestions = respuestasFiltradas.map(
        (respuesta) => respuesta.pregunta
      );

      if (answeredQuestions.length > 0) {
        const lastAnsweredQuestionId =
          answeredQuestions[answeredQuestions.length - 1];
        const lastAnsweredQuestionIndex = cuestionario.preguntas.findIndex(
          (pregunta) => pregunta.id === lastAnsweredQuestionId
        );

        if (lastAnsweredQuestionIndex !== -1) {
          setLastAnsweredQuestionIndex(lastAnsweredQuestionIndex);
          setPreguntaIndex(lastAnsweredQuestionIndex);
        }
      }
    } catch (error) {
      console.error("Error fetching existing answers:", error);
    }
  };

  // Función para obtener el estado del cuestionario
  const fetchEstadoCuestionario = async (usuario, cuestionario) => {
    try {
      const estadoCuestionario = await api.get(
        "/api/cuestionarios/finalizar-cuestionario/",
        {
          params: {
            usuario: usuario.id,
            cuestionario: cuestionario.id,
          },
        }
      );

      if (estadoCuestionario.data[0].usuario.finalizado === true) {
        setCuestionarioFinalizado(true);
      } else {
        setCuestionarioFinalizado(false);
      }
    } catch (error) {
      console.error("Error fetching estado del cuestionario:", error);
    }
  };

  // Función para obtener cuestionarios finalizados
  const fetchCuestionariosFinalizados = async () => {
    if (!usuarioId) return;
    try {
      const response = await api.get(
        "/api/cuestionarios/finalizar-cuestionario/",
        {
          params: { usuario: usuarioId },
        }
      );
      const nombresFinalizados = response.data.map((item) => {
        return {
          id: item.cuestionario.id, // Extraer el id correctamente
          nombre: item.cuestionario.nombre, // Extraer el nombre correctamente
        };
      });

      setCuestionariosFinalizados(nombresFinalizados);
    } catch (error) {
      console.error("Error fetching cuestionarios finalizados:", error);
    }
  };



  // Función para obtener el texto de la respuesta
  const obtenerRespuestaTexto = (respuesta) => {
    try {
      // Si no hay respuesta, retornar "Sin respuesta"
      if (!respuesta.respuesta) {
        return "Sin respuesta";
      }

      // Si es un string directo, retornarlo
      if (typeof respuesta.respuesta === "string") {
        return respuesta.respuesta;
      }

      // Si es un objeto JSON (parseado)
      if (typeof respuesta.respuesta === "object") {
        // Para respuestas tipo checkbox
        if (respuesta.tipo_pregunta === "checkbox") {
          return Array.isArray(respuesta.respuesta)
            ? respuesta.respuesta.map((opcion) => opcion.texto).join(", ")
            : "Sin respuesta";
        }

        // Para respuestas tipo SIS
        if (respuesta.tipo_pregunta === "sis") {
          if (respuesta.respuesta && typeof respuesta.respuesta === "object") {
            const { frecuencia, tiempo_apoyo, tipo_apoyo } =
              respuesta.respuesta;
            return `F:${frecuencia || ""}, T:${tiempo_apoyo || ""}, A:${
              tipo_apoyo || ""
            }`;
          }
          return "Sin respuesta";
        }

        // Para respuestas tipo multiple o dropdown
        if (
          respuesta.tipo_pregunta === "multiple" ||
          respuesta.tipo_pregunta === "dropdown"
        ) {
          return respuesta.respuesta.texto || "Sin respuesta";
        }

        // Para otros tipos de respuestas con texto
        if (respuesta.respuesta.texto) {
          return respuesta.respuesta.texto;
        }
      }

      // Si es un array
      if (Array.isArray(respuesta.respuesta)) {
        return respuesta.respuesta.join(", ");
      }

      // Si no se pudo procesar la respuesta
      return "Sin respuesta";
    } catch (error) {
      console.error("Error al procesar respuesta:", error);
      return "Error al procesar la respuesta";
    }
  };

  // Función para obtener respuestas de un cuestionario finalizado
  const fetchRespuestasCuestionarioFinalizado = async (cuestionario_Id) => {
    if (!usuarioId) return;

    try {
      const response = await api.get(
        `/api/cuestionarios/usuario/respuestas-unlocked-path/?cuestionario_id=${cuestionario_Id}&usuario_id=${usuarioId}`
      );
      setRespuestasCuestionarioFinalizado(response.data);
    } catch (error) {
      console.error(
        "Error fetching respuestas del cuestionario finalizado:",
        error
      );
    }
  };

  // Función para cambiar el cuestionario finalizado seleccionado
  const handleChangeCuestionarioFinalizado = async (event) => {
    const cuestionario_Id = event.target.value;
    fetchRespuestasCuestionarioFinalizado(cuestionario_Id);
  };

  // Función para alternar la vista de reporte
  const toggleReportView = () => {
    setShowReport(!showReport);
  };

  // Función para manejar el guardado de cambios (reemplaza window.location.reload())
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Refetch existing responses to get the updated data
      await fetchExistingResponses(usuario, cuestionario);

      // Refetch the questionnaire status
      await fetchEstadoCuestionario(usuario, cuestionario);

      // Exit edit mode
      setModoEdicionGlobal(false);

      // Show success message
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Función para actualizar el estado de desbloqueo de una pregunta
  const updateQuestionUnlockStatus = (questionId, isUnlocked) => {
    if (questionId === "counter") {
      // Actualizar contadores
      setTotalUnlockedQuestions(isUnlocked.total);
      setAnsweredUnlockedQuestions(isUnlocked.answered);
    } else {
      // Actualizar preguntas desbloqueadas
      setUnlockedQuestions((prev) => {
        const newUnlocked = new Set(prev);
        if (isUnlocked) {
          newUnlocked.add(questionId);
        } else {
          newUnlocked.delete(questionId);
        }

        return newUnlocked;
      });
    }
  };

  // Renderizado condicional mientras se cargan los datos
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Renderizado condicional si no hay datos
  if (!usuario || !cuestionario) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography variant="h6">No se encontraron datos.</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box
        sx={{
          display: { xs: "block", md: "flex" },
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          minHeight: "70vh",
        }}
      >
        {/* Report Panel (left) */}
        {showReport && (
          <Box
            sx={{
              width: { xs: "100%", md: 340 },
              minWidth: { md: 300 },
              maxWidth: { md: 400 },
              flexShrink: 0,
              mb: { xs: 2, md: 0 },
              mx: { md: 2 },
              height: "85vh",
              overflowY: "auto",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 3,
                borderRadius: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: 6,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "primary.main",
                  letterSpacing: 1,
                }}
              >
                Respuestas Guardadas
              </Typography>
              <SeleccionCuestionarioVisualizacion
                cuestionariosFinalizados={cuestionariosFinalizados}
                handleChangeCuestionarioFinalizado={
                  handleChangeCuestionarioFinalizado
                }
                sx={{ mb: 3 }}
              />
              {respuestasCuestionarioFinalizado.length > 0 && (
                <List
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    "::-webkit-scrollbar": { width: "8px" },
                    "::-webkit-scrollbar-thumb": {
                      background: "#e0e7ef",
                      borderRadius: "8px",
                    },
                  }}
                >
                  {respuestasCuestionarioFinalizado
                    .filter((respuesta) => {
                      const respuestaTexto = obtenerRespuestaTexto(respuesta);
                      return (
                        respuestaTexto &&
                        respuestaTexto !== "Sin respuesta" &&
                        respuestaTexto !== "Error al procesar la respuesta"
                      );
                    })
                    .map((respuesta, idx) => (
                      <React.Fragment key={idx}>
                        <ListItem
                          sx={{
                            mb: 2,
                            pb: 2,
                            borderRadius: 3,
                            background: "#fff",
                            boxShadow: 1,
                            transition: "box-shadow 0.2s, background 0.2s",
                            "&:hover": {
                              background: "#f1f5fb",
                              boxShadow: 3,
                            },
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 32,
                                minHeight: 32,
                                bgcolor: "primary.light",
                                color: "primary.main",
                                fontWeight: "bold",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 2,
                                fontSize: "1.1rem",
                                boxShadow: 1,
                              }}
                            >
                              {idx + 1}
                            </Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: "bold",
                                color: "#1a237e",
                                fontSize: { xs: "1rem", sm: "1.1rem" },
                              }}
                            >
                              {respuesta.pregunta_texto}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              backgroundColor: "#f3f6fa",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              width: "100%",
                              textAlign: "left",
                              wordWrap: "break-word",
                              fontSize: { xs: "0.98rem", sm: "1.05rem" },
                              color: "#374151",
                              fontFamily: "inherit",
                            }}
                          >
                            {`Respuesta: ${obtenerRespuestaTexto(respuesta)}`}
                          </Typography>
                        </ListItem>
                        {idx !==
                          respuestasCuestionarioFinalizado.filter((r) => {
                            const rt = obtenerRespuestaTexto(r);
                            return (
                              rt &&
                              rt !== "Sin respuesta" &&
                              rt !== "Error al procesar la respuesta"
                            );
                          }).length -
                            1 && <Divider sx={{ my: 1, width: "100%" }} />}
                      </React.Fragment>
                    ))}
                </List>
              )}
            </Paper>
          </Box>
        )}

        {/* Main Content (right) */}
        <Box
          sx={{
            flex: 1,
            width: "100%",
            minWidth: 0,
            margin: 2,
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              mb: 2,
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                onClick={toggleReportView}
              >
                {showReport ? "Ocultar Respuestas" : "Ver Respuestas Guardadas"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/candidatos/${usuarioId}`)}
              >
                Volver al perfil
              </Button>
            </Box>
            
            <Box
              sx={{
                display: "flex",
                gap: 1,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {!modoEdicionGlobal && cuestionarioFinalizado && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setModoEdicionGlobal(true)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Editar cuestionario
                </Button>
              )}
              {modoEdicionGlobal && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              width: "100%",
              overflowY: "auto",
              px: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 3 },
            }}
          >
            <Preguntas
              key={`${usuario?.id}-${cuestionario?.id}`}
              cuestionario={cuestionario}
              usuario={usuario?.id}
              preentrevista={preentrevista}
              preguntaIndex={preguntaIndex}
              setPreguntaIndex={setPreguntaIndex}
              questionsPerPage={1}
              lastAnsweredQuestionIndex={lastAnsweredQuestionIndex}
              cuestionarioFinalizado={cuestionarioFinalizado}
              setCuestionarioFinalizado={setCuestionarioFinalizado}
              subitems={subitems}
              technicalAids={technicalAids}
              chAids={chAids}
              esEditable={modoEdicionGlobal}
              onQuestionUnlock={updateQuestionUnlockStatus}
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Preguntas respondidas: {answeredUnlockedQuestions} de{" "}
            {totalUnlockedQuestions}
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          ¡Debes responder todas las preguntas antes de finalizar el
          cuestionario!
        </Alert>
      </Snackbar>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSaveSuccess(false)}>
          ¡Cambios guardados correctamente!
        </Alert>
      </Snackbar>

      {/* Loading popup para el cuestionario */}
      <LoadingPopup
        open={questionnaireLoading}
        message="Cargando cuestionario..."
        zIndex={9997}
      />

      {/* Loading popup para finalización */}
      <LoadingPopup
        open={finalizingLoading}
        message="Finalizando cuestionario..."
        zIndex={9996}
      />
    </div>
  );
}

export default DespliegueCuestionario;
