import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../api";
import Preguntas from "./Preguntas";

function DespliegueCuestionario({
  usuarioId,
  cuestionario: initialCuestionario, // Renamed to avoid collision with local state
  onClose,
  showUserSelection = true, // Not used in provided code, can be removed if always false
  preentrevista = false,
  respuestas: initialRespuestas = [], // Received from parent (Preentrevista)
  setCuestionarioFinalizado: setParentCuestionarioFinalizado, // Setter from parent
}) {
  // Core states that might be managed locally if not fully passed down
  const [cuestionario, setCuestionario] = useState(initialCuestionario);
  const [respuestas, setRespuestas] = useState(initialRespuestas);
  const [cuestionarioFinalizado, setCuestionarioFinalizado] = useState(false); // Local state for questionnaire completion

  // States for UI feedback and optional features
  const [showError, setShowError] = useState(false);
  const [modoEdicionGlobal, setModoEdicionGlobal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sisAids, setSisAids] = useState({}); // Renamed from subitems for clarity
  const [technicalAids, setTechnicalAids] = useState({});
  const [chAids, setCHAids] = useState({});

  // Memoized callback for fetching existing responses
  const fetchExistingResponses = useCallback(
    async (userId, questionnaireData) => {
      if (!userId || !questionnaireData?.id) return;
      try {
        const response = await api.get("/api/cuestionarios/respuestas/", {
          params: { usuario: userId, cuestionario: questionnaireData.id },
        });
        setRespuestas(
          response.data.filter(
            (respuesta) =>
              respuesta.usuario === userId &&
              respuesta.cuestionario === questionnaireData.id
          )
        );
      } catch (error) {
        console.error("Error fetching existing answers:", error);
        setShowError(true);
      }
    },
    [] // Dependencies: None, as it uses arguments directly
  );

  // Memoized callback for fetching questionnaire status
  const fetchEstadoCuestionario = useCallback(
    async (userId, questionnaireData) => {
      if (!userId || !questionnaireData?.id) return;
      try {
        const response = await api.get(
          "/api/cuestionarios/finalizar-cuestionario/",
          {
            params: { usuario: userId, cuestionario: questionnaireData.id },
          }
        );
        const estado = response.data?.[0]?.estado;
        const finalizadoStatus =
          response.data?.[0]?.usuario?.finalizado === true;

        setCuestionarioFinalizado(finalizadoStatus);
        // If parent also needs this status, call its setter
        if (setParentCuestionarioFinalizado) {
          setParentCuestionarioFinalizado(finalizadoStatus);
        }
      } catch (error) {
        console.error("Error al obtener el estado del cuestionario:", error);
        setShowError(true);
      }
    },
    [setParentCuestionarioFinalizado] // Dependency: parent's setter
  );

  // Effect to sync `cuestionario` and `respuestas` from parent props
  useEffect(() => {
    setCuestionario(initialCuestionario);
    setRespuestas(initialRespuestas);
    // If the questionnaire or responses change from parent, refetch status
    if (usuarioId && initialCuestionario?.id) {
      fetchEstadoCuestionario(usuarioId, initialCuestionario);
    }
  }, [
    usuarioId,
    initialCuestionario,
    initialRespuestas,
    fetchEstadoCuestionario,
  ]);

  // Effect for fetching global aids data (SIS, Technical, CH) - runs once
  useEffect(() => {
    const fetchAidsData = async () => {
      try {
        const [sisRes, techRes, chRes] = await Promise.all([
          api.get("/api/discapacidad/sis-aids-view/"),
          api.get("/api/discapacidad/technical-aids-view/"),
          api.get("/api/discapacidad/ch-items-view/"),
        ]);

        const processAidsResponse = (response) =>
          Object.entries(response.data).reduce((acc, [itemName, aids]) => {
            acc[itemName] = aids;
            return acc;
          }, {});

        setSisAids(processAidsResponse(sisRes));
        setTechnicalAids(processAidsResponse(techRes));
        setCHAids(processAidsResponse(chRes));

      } catch (error) {
        console.error("🔥 Error fetching Aids data:", error);
        setShowError(true);
      }
    };
    fetchAidsData();
  }, []); // Empty dependency array means this runs once on mount

  // Handler for finalizing the questionnaire
  const handleFinalizarCuestionario = async () => {
    if (!cuestionario || !cuestionario.preguntas || !usuarioId) {
      console.warn("Cannot finalize: Missing questionnaire data or user ID.");
      setShowError(true); // Indicate a more general error
      return;
    }

    // Get IDs of questions that *must* be answered
    const requiredQuestionIds = cuestionario.preguntas.map((q) => q.id);

    // Get IDs of questions that have been answered
    const answeredQuestionIds = new Set(
      respuestas
        .filter((r) => r.cuestionario === cuestionario.id)
        .map((r) => r.pregunta)
    );

    // Check if all required questions have corresponding answers
    const allRequiredAnswered = requiredQuestionIds.every((qId) =>
      answeredQuestionIds.has(qId)
    );

    if (!allRequiredAnswered) {
      setShowError(true); // Use the specific error message from the Snackbar
      return;
    }

    try {
      await api.post("/api/cuestionarios/finalizar-cuestionario/", {
        usuario: usuarioId,
        cuestionario: cuestionario.id,
        finalizado: true,
      });

      setCuestionarioFinalizado(true);
      // Trigger parent's update if provided
      if (setParentCuestionarioFinalizado) {
        setParentCuestionarioFinalizado(true);
      }
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al finalizar el cuestionario:", error);
      setShowError(true);
    }
  };

  // Helper function to get answer text for display
  const obtenerRespuestaTexto = (respuesta) => {
    if (respuesta.tipo_pregunta === "checkbox") {
      return respuesta.respuesta.map((opcion) => opcion.texto).join(", ");
    } else if (respuesta.tipo_pregunta === "sis") {
      // Format SIS answers more nicely
      if (respuesta.respuesta && typeof respuesta.respuesta === "object") {
        const { frecuencia, tiempo_apoyo, tipo_apoyo } = respuesta.respuesta;
        return `F:${frecuencia || ""}, T:${tiempo_apoyo || ""}, A:${
          tipo_apoyo || ""
        }`;
      }
      return "Sin respuesta";
    } else if (
      respuesta.tipo_pregunta === "multiple" ||
      respuesta.tipo_pregunta === "dropdown"
    ) {
      return respuesta.respuesta.texto;
    } else if (respuesta.respuesta) {
      return String(respuesta.respuesta); // Ensure it's a string
    } else {
      return "Sin respuesta";
    }
  };

  // Handle saving changes in edit mode
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Re-fetch existing responses and status after changes to reflect latest data
      await fetchExistingResponses(usuarioId, cuestionario);
      await fetchEstadoCuestionario(usuarioId, cuestionario);
      setModoEdicionGlobal(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving changes:", error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading indicator for `DespliegueCuestionario` itself
  // This component now relies on props being available, so `isLoading` is not strictly needed
  // for the *initial* fetch of questionnaire data (that's parent's job).
  // However, it might be used for internal fetches like aids or when saving.
  // For the initial mount, the parent (`Preentrevista`) handles `isLoading`.

  // If the essential props are not yet available, show a loading/no data message
  if (!usuarioId || !cuestionario) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px", // Or appropriate height for this section
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Cargando datos del cuestionario...
        </Typography>
      </Box>
    );
  }

  // If initialCuestionario is null or incomplete, show a message
  if (!cuestionario?.preguntas) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <Typography variant="h6" color="textSecondary">
          No se encontraron preguntas para este cuestionario.
        </Typography>
      </Box>
    );
  }

  const [preguntaIndex, setPreguntaIndex] = useState(0); // Keeping local for navigation
  const [selectedQuestion, setSelectedQuestion] = useState(""); // Keeping local for dropdown

  const handleQuestionChange = (event) => {
    setSelectedQuestion(event.target.value);
    const index = cuestionario.preguntas.findIndex(
      (q) => q.id === event.target.value
    );
    if (index !== -1) {
      setPreguntaIndex(index);
      setTimeout(() => {
        const scrollContainer =
          document.querySelector(".MuiDialog-scrollPaper") ||
          document.documentElement;
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "100%",
          p: { xs: 1, sm: 2, md: 3 },
          overflowY: "auto",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1, md: 3 },
            borderRadius: 3,
            bgcolor: "background.default",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {cuestionario.nombre}
          </Typography>

          <Grid
            container
            spacing={2}
            sx={{ mt: 2, flexDirection: { xs: "column", md: "row" }, gap: 2 }}
          >
            <Grid item xs={12} md={12} sx={{ width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mb: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                }}
              >
                {!modoEdicionGlobal && cuestionarioFinalizado && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setModoEdicionGlobal(true)}
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
                  >
                    {isSaving ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                )}
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
                  cuestionario={cuestionario} // Pass the full questionnaire object
                  preentrevista={preentrevista}
                  usuario={usuarioId} // Pass userId directly
                  cuestionarioFinalizado={cuestionarioFinalizado}
                  setCuestionarioFinalizado={setCuestionarioFinalizado}
                  subitems={sisAids} // Use renamed state
                  esEditable={modoEdicionGlobal}
                  technicalAids={technicalAids}
                  chAids={chAids}
                  // Prop to update responses from child components (e.g., when an answer is saved)
                  onAnswerSaved={(updatedResponse) => {
                    // Update responses in state
                    setRespuestas((prevResponses) => {
                      const existingIndex = prevResponses.findIndex(
                        (r) => r.id === updatedResponse.id
                      );
                      if (existingIndex !== -1) {
                        return prevResponses.map((r, idx) =>
                          idx === existingIndex ? updatedResponse : r
                        );
                      }
                      return [...prevResponses, updatedResponse];
                    });
                  }}
                  // If you only display one question at a time based on `preguntaIndex`
                  // pass the current question to `Preguntas`
                  currentQuestion={cuestionario.preguntas[preguntaIndex]}
                  // Also pass existing answers relevant to the current question
                  currentAnswers={respuestas.filter(
                    (r) =>
                      r.pregunta === cuestionario.preguntas[preguntaIndex]?.id
                  )}
                />
              </Box>
            </Grid>
          </Grid>

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
        </Paper>
      </Box>
    </div>
  );
}

export default DespliegueCuestionario;
