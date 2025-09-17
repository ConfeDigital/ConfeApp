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
import Preguntas from "../cuestionarios/Preguntas";

function DespliegueCuestionarioCandidato({
  usuarioId,
  cuestionarioId,
  onClose,
}) {
  // Core states
  const [cuestionario, setCuestionario] = useState(null);
  const [cuestionarioFinalizado, setCuestionarioFinalizado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);

  // Aids data
  const [sisAids, setSisAids] = useState({});
  const [technicalAids, setTechnicalAids] = useState({});
  const [chAids, setCHAids] = useState({});

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
        const finalizadoStatus =
          response.data?.[0]?.usuario?.finalizado === true;

        setCuestionarioFinalizado(finalizadoStatus);
      } catch (error) {
        console.error("Error al obtener el estado del cuestionario:", error);
        setShowError(true);
      }
    },
    []
  );

  // Effect to fetch questionnaire data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get questionnaire data
        const questionnaireResponse = await api.get(
          `/api/cuestionarios/${cuestionarioId}/`
        );
        setCuestionario(questionnaireResponse.data);

        // Get questionnaire status
        await fetchEstadoCuestionario(usuarioId, questionnaireResponse.data);
      } catch (error) {
        console.error("Error fetching questionnaire data:", error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [usuarioId, cuestionarioId, fetchEstadoCuestionario]);

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
    try {
      const response = await api.post(
        "/api/cuestionarios/finalizar-cuestionario/",
        {
          usuario: usuarioId,
          cuestionario: cuestionario.id,
          finalizado: true,
        }
      );

      if (response.status === 200) {
        setCuestionarioFinalizado(true);
        // Show success message or redirect
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error finalizando cuestionario:", error);
      setShowError(true);
    }
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If no questionnaire data, show error
  if (!cuestionario) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          No se encontraron datos
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          No se pudieron cargar los datos del cuestionario.
        </Typography>
        <Button variant="contained" color="primary" onClick={onClose}>
          Volver
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {cuestionario.nombre}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Completa este cuestionario para continuar con tu proceso
            </Typography>
          </Box>
          <Button variant="outlined" onClick={onClose}>
            Volver
          </Button>
        </Box>
      </Paper>

      {/* Questions Section */}
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            width: "100%",
            overflowY: "auto",
            px: { xs: 0, sm: 2 },
            mb: { xs: 1, sm: 3 },
          }}
        >
          <Preguntas
            cuestionario={cuestionario}
            preentrevista={false}
            usuario={usuarioId}
            cuestionarioFinalizado={cuestionarioFinalizado}
            setCuestionarioFinalizado={setCuestionarioFinalizado}
            subitems={sisAids}
            esEditable={true}
            technicalAids={technicalAids}
            chAids={chAids}
            // NO pasar respuestas existentes - esto hace que no se muestren las respuestas guardadas
            respuestas={[]}
            // Callback para cuando se guarda una respuesta
            onAnswerSaved={() => {
              // Opcional: actualizar algún estado si es necesario
              console.log("Respuesta guardada");
            }}
          />
        </Box>

        {/* Finalize Button */}
        {/* {!cuestionarioFinalizado && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleFinalizarCuestionario}
              sx={{ px: 4, py: 1.5 }}
            >
              Finalizar Cuestionario
            </Button>
          </Box>
        )} */}

        {cuestionarioFinalizado && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Typography
              variant="h6"
              color="success.main"
              sx={{ fontWeight: "bold" }}
            >
              ✅ Cuestionario Completado
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert onClose={() => setShowError(false)} severity="error">
          Error al cargar los datos. Por favor, inténtalo de nuevo.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DespliegueCuestionarioCandidato;
