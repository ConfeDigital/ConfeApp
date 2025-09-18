import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description"; // Icon for survey
import UploadFileIcon from "@mui/icons-material/UploadFile"; // Icon for upload
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Icon for accordion
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Icon for completed
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked"; // Icon for pending
import PlayCircleIcon from "@mui/icons-material/PlayCircle"; // Icon for in progress
import { Link, useNavigate } from "react-router-dom"; // For navigation
import NavBar from "../../components/NavBar"; // Assuming NavBar exists at this path
import axios from "../../api";

// Define the ordered stages
const stageOrder = [
  { code: "Reg", label: "Registro" },
  { code: "Pre", label: "Preentrevista" },
  { code: "Can", label: "Canalización" },
  { code: "Ent", label: "Entrevista" },
  { code: "Cap", label: "Capacitación", subphases: ["SIS", "ED", "PA", "PV"] },
  { code: "Agn", label: "Agencia" },
];

function DashboardCandidato() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load candidate data and questionnaires
  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        setLoading(true);

        // Get candidate profile
        const profileResponse = await axios.get("/api/candidatos/profiles/me/");
        setCandidateProfile(profileResponse.data);

        // Get questionnaires for the user
        const questionnairesResponse = await axios.get(
          `/api/cuestionarios/usuario/${profileResponse.data.user.id}/cuestionarios-con-respuestas/`
        );
        setQuestionnaires(questionnairesResponse.data);
      } catch (error) {
        console.error("Error obteniendo datos del candidato:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, []);

  // Helper function to get questionnaire status
  const getQuestionnaireStatus = (questionnaire) => {
    if (questionnaire.finalizado) {
      return {
        status: "completed",
        icon: <CheckCircleIcon />,
        color: "success",
        text: "Completado",
      };
    } else if (questionnaire.tiene_respuestas) {
      return {
        status: "in_progress",
        icon: <PlayCircleIcon />,
        color: "warning",
        text: "En progreso",
      };
    } else {
      return {
        status: "pending",
        icon: <RadioButtonUncheckedIcon />,
        color: "default",
        text: "Pendiente",
      };
    }
  };

  // Helper function to get questionnaires by stage
  const getQuestionnairesByStage = (stageCode) => {
    return questionnaires.filter(
      (q) => q.estado_desbloqueo === stageCode && q.responsable === "PCD"
    );
  };

  // Helper function to navigate to questionnaire
  const handleQuestionnaireClick = (questionnaireId) => {
    if (candidateProfile) {
      navigate(`/candidato/${candidateProfile.user.id}/${questionnaireId}`);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      console.log("Simulating file upload:", selectedFile.name);
      // Placeholder for actual API call
      // In a real application, you would send selectedFile to your backend
      // Example: api.post('/api/upload-files/', formData);

      setUploadMessage({
        open: true,
        type: "success",
        text: `"${selectedFile.name}" subido simuladamente.`,
      });
      setSelectedFile(null); // Clear selected file after "upload"
    } else {
      setUploadMessage({
        open: true,
        type: "warning",
        text: "Por favor, selecciona un archivo primero.",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setUploadMessage({ ...uploadMessage, open: false });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background:
          "linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)",
      }}
    >
      <NavBar /> {/* Your navigation bar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* Welcome Section */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ mb: 4, textAlign: "center", color: "white" }}
        >
          ¡Bienvenido/a al Panel de Candidato!
        </Typography>

        {/* Process Explanation Section */}
        <Paper
          elevation={4}
          sx={{ mb: 4, borderRadius: 3, overflow: "hidden" }}
        >
          <Accordion disableGutters sx={{ "&:before": { display: "none" } }}>
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: "primary.contrastText" }} />
              }
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{
                bgcolor: "primary.main", // Dark blue background for summary
                color: "primary.contrastText", // White text
                "& .MuiAccordionSummary-content": {
                  my: 2, // Vertical padding
                },
              }}
            >
              <Typography variant="h5" component="h2">
                Entiende el Proceso de Capacitación
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                ¡Hola, candidato! En esta sección te explicamos los pasos clave
                de nuestro proceso de capacitación para que sepas qué esperar en
                cada etapa.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>1. Cuestionario de Preentrevista:</strong> Es el primer
                paso importante. Responde con sinceridad para que podamos
                conocerte mejor y entender tus habilidades, experiencia y
                necesidades.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>2. Revisión de Documentos:</strong> Una vez completado
                el cuestionario, te pediremos que subas algunos documentos
                necesarios. Asegúrate de que estén actualizados y sean legibles.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>3. Entrevistas:</strong> Si tu perfil avanza, serás
                contactado/a para una serie de entrevistas.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>4. Capacitación:</strong> Deberás acudir al centro más
                cercano para completar tu capacitación.
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                Te notificaremos por correo electrónico cada vez que haya una
                actualización en tu estado o un nuevo paso disponible en tu
                panel. ¡Mucha suerte!
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Cards Section */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid
            container
            spacing={4}
            justifyContent="center"
            alignItems="stretch"
          >
            {/* Dynamic Questionnaires by Stage */}
            {stageOrder.map((stage, stageIndex) => {
              const stageQuestionnaires = getQuestionnairesByStage(stage.code);
              const currentStageIndex = stageOrder.findIndex(
                (s) => s.code === candidateProfile?.stage
              );

              // Only show the current stage questionnaires
              if (stageIndex !== currentStageIndex) {
                return null;
              }

              if (stageQuestionnaires.length === 0) {
                return null;
              }

              return (
                <Grid
                  item
                  xs={12}
                  sm={10}
                  md={8}
                  lg={6}
                  xl={4}
                  key={stage.code}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Card
                    elevation={4}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      width: "100%",
                      maxWidth: { xs: "100%", sm: "500px", md: "600px" },
                      borderRadius: 3,
                      transition:
                        "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: 8,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <DescriptionIcon
                          sx={{ fontSize: 60, color: "secondary.main" }}
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        sx={{ textAlign: "center", fontWeight: "bold" }}
                      >
                        Cuestionarios de {stage.label}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ textAlign: "center", mb: 3 }}
                      >
                        ¡Es tu momento de brillar! Completa estos cuestionarios
                        para continuar con tu proceso.
                      </Typography>

                      {/* Questionnaire List */}
                      <Box sx={{ mb: 3 }}>
                        {stageQuestionnaires.map((questionnaire) => {
                          const status = getQuestionnaireStatus(questionnaire);
                          return (
                            <Box
                              key={questionnaire.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: { xs: 1.5, sm: 2 },
                                mb: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                bgcolor:
                                  status.status === "completed"
                                    ? "success.light"
                                    : "background.paper",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  width: { xs: "100%", sm: "auto" },
                                  justifyContent: {
                                    xs: "center",
                                    sm: "flex-start",
                                  },
                                }}
                              >
                                {status.icon}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "medium",
                                    textAlign: { xs: "center", sm: "left" },
                                    fontSize: {
                                      xs: "0.875rem",
                                      sm: "0.875rem",
                                    },
                                  }}
                                >
                                  {questionnaire.nombre}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  width: { xs: "100%", sm: "auto" },
                                  justifyContent: {
                                    xs: "center",
                                    sm: "flex-end",
                                  },
                                  flexDirection: { xs: "column", sm: "row" },
                                }}
                              >
                                <Chip
                                  label={status.text}
                                  color={status.color}
                                  size="small"
                                  sx={{
                                    width: { xs: "fit-content", sm: "auto" },
                                    mb: { xs: 1, sm: 0 },
                                  }}
                                />
                                {status.status !== "completed" && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      handleQuestionnaireClick(questionnaire.id)
                                    }
                                    sx={{
                                      ml: { xs: 0, sm: 1 },
                                      width: { xs: "100%", sm: "auto" },
                                      minWidth: { xs: "120px", sm: "auto" },
                                    }}
                                  >
                                    {status.status === "in_progress"
                                      ? "Continuar"
                                      : "Iniciar"}
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Overall Stage Status */}
                      {/* <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: "auto",
                        }}
                      >
                        <Chip
                          label="Etapa Actual"
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Box> */}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
      {/* Snackbar for upload messages */}
      <Snackbar
        open={uploadMessage.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={uploadMessage.type}
          sx={{ width: "100%" }}
        >
          {uploadMessage.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DashboardCandidato;
