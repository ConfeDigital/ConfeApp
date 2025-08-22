import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../api"; // Assuming this is your configured Axios instance
import { useSelector } from "react-redux";
import NavBar from "../../components/NavBar";
import DespliegueCuestionario from "./DespliegueCuestionarioCandidato";

function Preentrevista() {
  // State for the authenticated user and questionnaire data
  const [candidato, setCandidato] = useState(null);
  const [cuestionario, setCuestionario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for managing existing responses and questionnaire completion status
  const [respuestas, setRespuestas] = useState([]);
  const [cuestionarioFinalizado, setCuestionarioFinalizado] = useState(false);

  // State for UI feedback
  const [showError, setShowError] = useState(false);

  // Get authenticated user ID from Redux
  const { uid } = useSelector((state) => ({
    uid: state.auth.user?.id,
  }));

  // --- Helper Functions for Data Fetching ---

  // Fetches existing responses for the user and questionnaire
  const fetchExistingResponses = useCallback(
    async (userId, questionnaireId) => {
      try {
        const response = await api.get("/api/cuestionarios/respuestas/", {
          params: { usuario: userId, cuestionario: questionnaireId },
        });
        setRespuestas(response.data);
      } catch (error) {
        console.error("Error fetching existing answers:", error);
        setShowError(true); // Show error for user feedback
      }
    },
    []
  );

  // Fetches the completion status of the questionnaire for the user
  const fetchEstadoCuestionario = useCallback(
    async (userId, questionnaireId) => {
      try {
        const response = await api.get("/api/cuestionarios/finalizar-cuestionario/", {
          params: { usuario: userId, cuestionario: questionnaireId },
        });
        // Assuming the response is an array and the first item contains the status
        if (response.data && response.data.length > 0) {
          setCuestionarioFinalizado(response.data[0].usuario.finalizado === true);
        }
      } catch (error) {
        console.error("Error fetching questionnaire status:", error);
        setShowError(true); // Show error for user feedback
      }
    },
    []
  );

  // --- Main Data Fetching Effect ---
  useEffect(() => {
    const loadPreentrevistaData = async () => {
      if (!uid) {
        setIsLoading(false); // If no user ID, nothing to load
        return;
      }

      setIsLoading(true);
      try {
        // 1. Fetch User Data
        const candidatoResponse = await api.get('/api/candidatos/profiles/me/');
        setCandidato(candidatoResponse.data);

        // 2. Fetch all questionnaires and find the active Preentrevista
        const cuestionariosResponse = await api.get(`/api/cuestionarios/`);
        const preentrevistaCuestionarioType = cuestionariosResponse.data.find(
          (c) => c.estado_desbloqueo === "Pre" && c.inicio === true
        );

        if (preentrevistaCuestionarioType) {
          const activeCuestionarioInstance =
            preentrevistaCuestionarioType.cuestionarios.find(
              (q) => q.activo === true
            );

          if (activeCuestionarioInstance) {
            setCuestionario(activeCuestionarioInstance);
            // console.log("Active Preentrevista Cuestionario found:", activeCuestionarioInstance);

            // 3. Fetch existing responses and questionnaire status for the found questionnaire
            await fetchExistingResponses(uid, activeCuestionarioInstance.id);
            await fetchEstadoCuestionario(uid, activeCuestionarioInstance.id);
          } else {
            console.warn("No active questionnaire instance found for Preentrevista type.");
            setCuestionario(null); // Ensure state is clear if no active instance
          }
        } else {
          console.warn("No Preentrevista questionnaire type found with inicio = true.");
          setCuestionario(null); // Ensure state is clear if no type found
        }
      } catch (error) {
        console.error("Error loading preentrevista data:", error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreentrevistaData();
  }, [uid, fetchExistingResponses, fetchEstadoCuestionario]); // Dependencies for useEffect

  useEffect(() => {
    if(!candidato) return;
    if(candidato.stage == "Reg"){
      api.patch(`/api/candidatos/me/datos-medicos/`, {stage: "Pre"});
    }
  }, [candidato]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh", // Use minHeight for full screen loading
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user or active questionnaire not found after loading
  if (!candidato || !cuestionario) {
    return (
      <>
        <NavBar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)", // Adjust for NavBar height
            p: 3,
          }}
        >
          <Typography variant="h6">
            {showError
              ? "Ocurrió un error al cargar los datos."
              : "No se encontraron datos del candidato o cuestionario activo."}
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <Box>
      <NavBar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          p: 3,
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        {/* Message if questionnaire is finished */}
        {cuestionarioFinalizado && (
          <Alert severity="success" >
              ¡Felicidades! Has completado el cuestionario de preentrevista.
          </Alert>
        )}

        {!cuestionario?.preguntas && (
          <Typography>Cargando preguntas...</Typography>
        )}

        {/* Main component for displaying and interacting with the questionnaire */}
        <DespliegueCuestionario
          usuarioId={uid}
          cuestionario={cuestionario} // Pass the entire questionnaire object
          respuestas={respuestas} // Pass existing answers for pre-filling
          setCuestionarioFinalizado={setCuestionarioFinalizado} // Allow DespliegueCuestionario to update status
          preentrevista={true}
          // If DespliegueCuestionario needs to update answers, you'll need to pass a setter:
          // onAnswerUpdate={(updatedResp) => setRespuestas(updatedResp)}
          // And potentially a callback for when an answer is saved:
          // onAnswerSaved={() => fetchExistingResponses(uid, cuestionario.id)}
        />

        {/* Error Snackbar */}
        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
        >
          <Alert severity="error" onClose={() => setShowError(false)}>
            ¡Ocurrió un error al cargar o procesar los datos!
          </Alert>
        </Snackbar>

        {/* Message if questionnaire is finished */}
        {cuestionarioFinalizado && (
            <Alert severity="success" >
                ¡Felicidades! Has completado el cuestionario de preentrevista.
            </Alert>
        )}
      </Box>
    </Box>
  );
}

export default Preentrevista;