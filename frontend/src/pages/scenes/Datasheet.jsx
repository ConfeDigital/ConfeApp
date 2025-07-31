// ==========================================
// Datasheet Component
// Displays candidate profile, progress timeline, and deliverables
// ==========================================

import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Box,
  Typography,
  Backdrop,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Link,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import AssistWalkerIcon from "@mui/icons-material/AssistWalker";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api";
import dayjs from "dayjs";
import "dayjs/locale/es";
import DatasheetSkeleton from "../../components/datasheet/DatasheetSkeleton";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import ContactList from "../../components/candidate_create/ContactList";
const InterviewDialog = lazy(() =>
  import("../../components/candidate_create/InterviewModal")
);

import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import CandidateDetails from "../../components/candidate_create/DetailSection";
import LoadingPopup from "../../components/LoadingPopup";

// Define the ordered stages based on your Django STAGE_CHOICES with subphases for Capacitación.
const stageOrder = [
  { code: "Reg", label: "Registro" },
  { code: "Pre", label: "Preentrevista" },
  { code: "Can", label: "Canalización" },
  { code: "Ent", label: "Entrevista" },
  { code: "Cap", label: "Capacitación", subphases: ["SIS", "ED", "PA", "PV"] },
  { code: "Agn", label: "Agencia" },
];

// Helper: returns button props given a relative index and active group value.
const getButtonProps = (index, activeGroup) => {
  if (activeGroup < 0) {
    return { variant: "outlined", color: undefined };
  }
  if (index < activeGroup) {
    return { variant: "contained", color: "success" };
  } else if (index === activeGroup) {
    return { variant: "contained", color: "info" };
  } else {
    return { variant: "outlined", color: undefined };
  }
};

const Datasheet = () => {
  useDocumentTitle("Expediente del Candidato");

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { uid } = useParams();
  const navigate = useNavigate();
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(null);
  const [viewMode, setViewMode] = useState("fases");
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [cuestionariosBotonesVisualizar, setCuestionariosBotonesVisualizar] =
    useState(null);
  const [questionnaires, setQuestionnaires] = useState([]); // Added questionnaires state
  const [questionnaireStatus, setQuestionnaireStatus] = useState([]);
  const [openViewer, setOpenViewer] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [interviewAppointment, setInterviewAppointment] = useState(null);
  const [openInterviewDialog, setOpenInterviewDialog] = useState(false);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [datasheetLoading, setDatasheetLoading] = useState(true);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = (event, newValue) => setSelectedTab(newValue);

  dayjs.locale("es");

  const fetchInterviewAppointment = async () => {
    if (!candidateProfile) return;
    const category = "Entrevista";
    try {
      const res = await axios.get(`api/candidatos/appointments/${uid}/`, {
        params: { category },
      });
      // Si se encontró un appointment, guardarlo en el estado
      if (res.data) {
        setInterviewAppointment(res.data);
      } else {
        setInterviewAppointment(null);
      }
    } catch (error) {
      console.error("Error fetching interview appointment:", error);
    }
  };

  useEffect(() => {
    const fetchCandidateData = async () => {
      // console.log("🚀 Iniciando carga del datasheet...");
      setDatasheetLoading(true);

      // Delay mínimo para que se vea el loading
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        // console.log("📡 Obteniendo perfil del candidato...");
        const profileResponse = await axios.get(
          `/api/candidatos/profiles/${uid}/`
        );
        setCandidateProfile(profileResponse.data);

        // console.log("📡 Obteniendo cuestionarios del usuario...");
        // Obtener solo los cuestionarios que tengan respuestas del usuario
        const questionnairesResponse = await axios.get(
          `/api/cuestionarios/usuario/${profileResponse.data.user.id}/cuestionarios-con-respuestas/`
        );
        setQuestionnaires(questionnairesResponse.data);

        // Usar los mismos datos para el estado de cuestionarios
        setQuestionnaireStatus(questionnairesResponse.data);

        // 🔍 Obtener la etapa actual del usuario
        const currentStage = profileResponse.data.stage;

        // 🔍 Filtrar los cuestionarios de la etapa actual
        const currentStageQuestionnaires = questionnairesResponse.data.filter(
          (q) => q.estado_desbloqueo === currentStage && q.activo
        );

        const stageIdx = stageOrder.findIndex((stage) => stage.code === currentStage);
        setCurrentStageIndex(stageIdx);

        if (!currentStageQuestionnaires.length) return; // 🚨 Si no hay cuestionarios, salir

        // 🔍 Validar si TODOS los cuestionarios activos están finalizados
        const allFinalized = currentStageQuestionnaires.every(
          (q) => q.finalizado === true
        );

        // 📌 Si todos los cuestionarios están finalizados, avanzar de etapa
        if (allFinalized && stageIdx >= 0) {
          const nextStage = stageOrder[stageIdx + 1];
        
          if (nextStage) {
            console.log("✅ Avanzando a la siguiente etapa:", nextStage.code);
            try {
              await axios.put(`/api/candidatos/editar/${uid}/`, {
                stage: nextStage.code,
                email: profileResponse.data.user.email,
              });
        
              setCandidateProfile({
                ...profileResponse.data,
                stage: nextStage.code,
              });
        
              setCurrentStageIndex(stageIdx + 1);
            } catch (error) {
              console.error("❌ Error al actualizar la etapa del candidato:", error);
            }
          }
        }

        // console.log("✅ Datasheet cargado exitosamente");
      } catch (error) {
        console.error("❌ Error obteniendo datos del candidato:", error);
      } finally {
        // console.log("🏁 Finalizando loading del datasheet");
        setDatasheetLoading(false);
      }
    };

    fetchCandidateData();
  }, [uid]);

  useEffect(() => {
    if (candidateProfile) {
      fetchInterviewAppointment();
    }
  }, [candidateProfile, uid]);

  const buildDynamicStageOrder = (questionnairesData) => {
    const stages = {};

    questionnairesData.forEach((questionnaire) => {
      const stageCode = questionnaire.estado_desbloqueo;
      if (stageCode) {
        if (!stages[stageCode]) {
          stages[stageCode] = {
            code: stageCode,
            subphases: [],
            label: getStageLabel(stageCode),
          };
        }
        if (questionnaire.nombre) {
          stages[stageCode].subphases.push({
            id: questionnaire.id,
            name: questionnaire.nombre,
          });
        }
      }
    });

    const stageOrderArray = Object.values(stages).sort((a, b) => {
      // Sort the stages based on your desired order (e.g., alphabetical or a custom order)
      return a.code.localeCompare(b.code);
    });

    // Update the stageOrder with the dynamically built array
    setDynamicStageOrder(stageOrderArray);
  };

  const getStageLabel = (stageCode) => {
    // Define a mapping of stage codes to labels or fetch from an API
    const stageLabels = {
      Reg: "Registro",
      Pre: "Preentrevista",
      Ent: "Entrevista",
      Cap: "Capacitación",
      Agn: "Agencia",
      Can: "Canalización",
    };
    return stageLabels[stageCode] || stageCode; // Return the code if label is not found
  };

  const [dynamicStageOrder, setDynamicStageOrder] = useState([]);

  if (!candidateProfile || datasheetLoading) {
    return <DatasheetSkeleton />;
  }

  // Global active step (0 to 5)
  const activeStep = stageOrder.findIndex(
    (stage) => stage.code === candidateProfile.stage
  );

  const handleStageClick = (stageCode) => {
    // 🔍 Filtrar solo los cuestionarios de la etapa actual
    const filteredQuestionnaires = questionnaires.filter(
      (q) => q.estado_desbloqueo === stageCode && q.activo
    );

    // console.log(
    //   "🔍 Cuestionarios activos encontrados:",
    //   filteredQuestionnaires
    // );

    if (filteredQuestionnaires.length === 0) {
      console.log("❌ No hay cuestionarios activos en esta etapa.");
      return;
    }

    // 📌 Si solo hay un cuestionario activo, abrirlo directamente
    if (filteredQuestionnaires.length === 1) {
      handleOpenDialog(candidateProfile.user.id, filteredQuestionnaires[0].id);
    } else {
      // 📌 Si hay más de un cuestionario, expandir la lista para mostrar botones
      setExpandedPhase(expandedPhase === stageCode ? null : stageCode);
      // Nueva lógica: construir subfases visuales usando questionnaireStatus
      // console.log("🧩 Subfases visuales:");
      const subfasesVisuales = filteredQuestionnaires.map((q) => {
        let colorFinal = "primary";
        let targetId = q.id;

        if (q.finalizado) {
          colorFinal = "success";
          targetId = q.id;
        } else if (q.tiene_respuestas) {
          colorFinal = "info";
          targetId = q.id;
        } else {
          colorFinal = undefined; // outlined (gris)
          targetId = q.id;
        }

        // console.log(
        //   `🟦 Subfase: ${q.nombre}, id: ${q.id}, color: ${colorFinal}, tiene_respuestas: ${q.tiene_respuestas}`
        // );

        return {
          ...q,
          color: colorFinal,
          targetId,
        };
      });
      setCuestionariosBotonesVisualizar(subfasesVisuales);
    }
  };

  const handleSubPhaseClick = (questionnaireId) => {
    handleOpenDialog(candidateProfile.user.id, questionnaireId);
  };

  const handleOpenDialog = (userId, questionnaireId) => {
    navigate(`/candidatos/${userId}/${questionnaireId}`);
  };

  const REPORT_TYPES = ["ficha_tecnica", "habilidades", "proyecto_vida"];

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const reportType = REPORT_TYPES[selectedTab];
      if (!reportType) {
        console.error("Invalid report type selected.");
        return;
      }

      console.log("Downloading report:", reportType);

      // Primero genera el archivo en el backend
      // await axios.get(`/api/reports/generate/${uid}/${reportType}/`);

      // Descarga el archivo generado
      const downloadResponse = await axios.get(
        `/api/reports/download/${uid}/${reportType}/`,
        {
          responseType: "blob",
        }
      );

      // Determina el tipo MIME y extensión correctos
      const fileTypes = {
        ficha_tecnica: { mime: "application/pdf", ext: "pdf" },
        habilidades: { mime: "application/pdf", ext: "pdf" },
        plan_apoyos: { mime: "application/pdf", ext: "pdf" },
        proyecto_vida: {
          mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ext: "pptx",
        },
      };

      const { mime, ext } = fileTypes[reportType] || {
        mime: "application/octet-stream",
        ext: "bin",
      };

      const blob = new Blob([downloadResponse.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-${candidateProfile.user.first_name}_${candidateProfile.user.last_name}_${candidateProfile.user.second_last_name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Download failed:", error);
    }
    setDownloadLoading(false);
  };

  const handleOpenInterviewDialog = () => {
    setOpenInterviewDialog(true);
  };

  const handleCloseInterviewDialog = () => {
    setOpenInterviewDialog(false);
    fetchInterviewAppointment();
  };

  const getAppointments = () => {
    // Función para refrescar la data, si es necesaria
  };

  return (
    <Box m={{ xs: 1, sm: 2, md: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: "12px",
        }}
      >
        {/* Header Section */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems="center"
            gap={2}
            mb={{ xs: 2, sm: 0 }}
          >
            <Avatar
              src={candidateProfile.photo || undefined}
              sx={{
                width: { xs: 100, sm: 140, md: 180 },
                height: { xs: 100, sm: 140, md: 180 },
                border: `4px solid ${theme.palette.primary.main}`,
              }}
            >
              {!candidateProfile.photo &&
                candidateProfile.user.first_name.charAt(0)}
            </Avatar>
            <Box textAlign={{ xs: "center", sm: "left" }}>
              <Typography variant="h4" fontWeight="bold">
                {candidateProfile.user.first_name}{" "}
                {candidateProfile.user.last_name}{" "}
                {candidateProfile.user.second_last_name}{" "}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {candidateProfile.disability_name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Contacto:{" "}
                <Link
                  href={`tel:${candidateProfile.phone_number}`}
                  sx={{ fontWeight: "bold" }}
                >
                  {formatCanonicalPhoneNumber(candidateProfile.phone_number)}
                </Link>{" "}
                ,{" "}
                <Link
                  href={`mailto:${candidateProfile.user.email}`}
                  sx={{ fontWeight: "bold" }}
                >
                  {candidateProfile.user.email}
                </Link>
              </Typography>
              {candidateProfile.cycle ? (
                <Tooltip
                  title={`De ${dayjs(candidateProfile.cycle.start_date).format(
                    "LL"
                  )} a ${dayjs(candidateProfile.cycle.end_date).format("LL")}`}
                >
                  <Typography variant="subtitle1" color="textSecondary">
                    {candidateProfile.cycle.name}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography variant="subtitle1" color="textSecondary">
                  Sin ciclo
                </Typography>
              )}
            </Box>
          </Box>
          {/* Right Side: Edit Button and Status */}
          <Box gap={2}>
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              alignItems="center"
              gap={1}
            >
              <Chip
                label={candidateProfile.user.is_active ? "ACTIVO" : "INACTIVO"}
                color={candidateProfile.user.is_active ? "success" : "error"}
                sx={{
                  fontWeight: "bold",
                  py: 1,
                  minWidth: "120px",
                }}
              />
              <Button
                variant="outlined"
                endIcon={<Edit />}
                onClick={() => navigate(`/candidatos/editar/${uid}`)}
                sx={{
                  minWidth: "120px",
                  // fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Editar
              </Button>
            </Box>
            <Box
              display="flex"
              flexDirection={{ sm: "row" }}
              alignItems="center"
              sx={{ marginTop: 1 }}
              gap={1}
            >
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<AssistWalkerIcon />}
                onClick={() => navigate(`/candidatos/historial-apoyos/${uid}`)}
                sx={{
                  minWidth: "120px",
                  // fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
                disabled={
                  candidateProfile.stage != "Agn" &&
                  candidateProfile.stage != "Cap"
                }
              >
                Apoyos
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<WorkOutlineIcon />}
                onClick={() => navigate(`/candidatos/historial-empleos/${uid}`)}
                sx={{
                  minWidth: "120px",
                  // fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
                disabled={candidateProfile.stage != "Agn"}
              >
                Empleo
              </Button>
            </Box>
            <Box
              display="flex"
              flexDirection={{ sm: "row" }}
              alignItems="center"
              justifyContent="center"
              sx={{ marginTop: 1 }}
              gap={1}
            >
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<FlagOutlinedIcon />}
                onClick={() => navigate(`/candidatos/proyecto-vida/${uid}`)}
                sx={{
                  minWidth: "120px",
                }}
                disabled={
                  candidateProfile.stage != "Agn" &&
                  candidateProfile.stage != "Cap"
                }
              >
                Proyecto de Vida
              </Button>
            </Box>
          </Box>
        </Box>

        <ContactList emergency_contacts={candidateProfile.emergency_contacts} />

        <CandidateDetails candidateProfile={candidateProfile} />

        <Divider sx={{ my: { xs: 2, md: 3 } }} />

        {/* View Mode Toggle */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          mb={2}
          gap={1}
        >
          {/* <Button
            variant={viewMode === "fases" ? "contained" : "outlined"}
            onClick={() => setViewMode("fases")}
            sx={{ minWidth: "140px" }}
          >
            Vista por Fases
          </Button> */}

          <Button variant="contained" color="primary" onClick={handleOpen}>
            REPORTES / ENTREGABLES
          </Button>
        </Box>

        {/* Timeline View */}
        {viewMode === "fases" &&
          (isSmallScreen ? (
            // === Fases para móviles ===
            <Stepper
              orientation="vertical"
              activeStep={stageOrder.findIndex(
                (s) => s.code === candidateProfile.stage
              )}
              sx={{
                background: "transparent",
                px: 1,
                // Asegura los mismos estilos de color que en escritorio
                "& .MuiStepLabel-root .MuiButton-root": {
                  // fontWeight: "bold",
                  fontSize: "0.9rem",
                  letterSpacing: 1,
                },
              }}
            >
              {stageOrder.map((stage, index) => {
                const stageQuestionnaires = questionnaires.filter(
                  (q) => q.estado_desbloqueo === stage.code && q.activo
                );

                const isStageCompleted =
                  stageQuestionnaires.length > 0 &&
                  stageQuestionnaires.every((q) => q.finalizado === true);

                // Mobile: use same color logic as desktop
                // Previous steps: green, current: blue, next: outlined
                return (
                  <Step key={index} completed={isStageCompleted}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor:
                              index < activeStep
                                ? "success.main"
                                : index === activeStep
                                ? "primary.main"
                                : "transparent",
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "bold",
                            border: index >= activeStep ? "2px solid" : "none",
                            borderColor:
                              index >= activeStep
                                ? "primary.main"
                                : "transparent",
                          }}
                        >
                          {index < activeStep ? "✓" : index + 1}
                        </Box>
                      )}
                    >
                      {/* === Fases para móviles (colores igual que escritorio) === */}
                      <Button
                        fullWidth
                        variant={
                          index < activeStep
                            ? "contained"
                            : index === activeStep
                            ? "contained"
                            : "outlined"
                        }
                        color={
                          index < activeStep
                            ? "success"
                            : index === activeStep
                            ? "info"
                            : "primary"
                        }
                        size="small"
                        sx={{ my: 0.5 }}
                        onClick={() => handleStageClick(stage.code)}
                      >
                        {stage.label.toUpperCase()}
                      </Button>
                      {expandedPhase === stage.code && (
                        <Box mt={1}>
                          {stage.code === "Ent" && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleOpenInterviewDialog}
                            >
                              {interviewAppointment
                                ? "Editar Entrevista"
                                : "Agendar Entrevista"}
                            </Button>
                          )}
                          {interviewAppointment && stage.code === "Ent" && (
                            <Box display="flex" flexDirection="column">
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {`(${dayjs(
                                  interviewAppointment.start_time
                                ).format("DD/MM/YYYY HH:mm")} - ${dayjs(
                                  interviewAppointment.end_time
                                ).format("HH:mm")})`}
                              </Typography>
                            </Box>
                          )}
                          {cuestionariosBotonesVisualizar?.map((sub) => (
                            <Button
                              key={sub.id}
                              variant={sub.color ? "contained" : "outlined"}
                              size="small"
                              sx={{ m: 0.5, fontSize: "0.75rem" }}
                              color={sub.color || "primary"}
                              onClick={() =>
                                handleOpenDialog(
                                  candidateProfile.user.id,
                                  sub.targetId
                                )
                              }
                            >
                              {sub.nombre}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          ) : (
            // For larger screens, render a single Stepper.
            <Stepper
              alternativeLabel
              sx={{
                background: "transparent",
                maxWidth: { xs: "100%", sm: "95%", md: "900px" },
                margin: "auto",
                mt: 2,
              }}
              activeStep={activeStep}
            >
              {stageOrder.map((stage, index) => {
                const stageIndex = stageOrder.findIndex(
                  (s) => s.code === stage.code
                );
                const btnProps = getButtonProps(index, activeStep);
                return (
                  <Step key={index} completed={index < activeStep}>
                    <StepLabel>
                      <Button
                        variant={btnProps.variant}
                        // color={btnProps.color}
                        size={expandedPhase === stage.code ? "medium" : "small"}
                        sx={{
                          backgroundColor:
                            expandedPhase === stage.code
                              ? btnProps.color + ".dark"
                              : btnProps.color + ".main",
                          color:
                            expandedPhase === stage.code
                              ? expandedPhase === candidateProfile.stage &&
                                "white"
                              : btnProps.color + ".contrastText",
                        }}
                        onClick={() => handleStageClick(stage.code)}
                        disabled={currentStageIndex < stageIndex}
                      >
                        {`${stage.label.toUpperCase()}`}
                      </Button>
                      {expandedPhase === stage.code && (
                        <Box mt={1}>
                          {stage.code === "Ent" && (
                            <Button
                              variant={
                                interviewAppointment ? "contained" : "outlined"
                              }
                              size="small"
                              onClick={handleOpenInterviewDialog}
                              sx={{ my: 0.5 }}
                            >
                              {interviewAppointment
                                ? "Editar Entrevista"
                                : "Agendar Entrevista"}
                            </Button>
                          )}
                          {/* Si existe la entrevista, se puede mostrar la fecha/hora */}
                          {interviewAppointment && stage.code === "Ent" && (
                            <Box display="flex" flexDirection="column">
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {`(${dayjs(
                                  interviewAppointment.start_time
                                ).format("DD/MM/YYYY")})`}
                              </Typography>
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {`${dayjs(
                                  interviewAppointment.start_time
                                ).format("HH:mm")} - ${dayjs(
                                  interviewAppointment.end_time
                                ).format("HH:mm")}`}
                              </Typography>
                            </Box>
                          )}
                          {cuestionariosBotonesVisualizar?.map((sub) => (
                            <Button
                              key={sub.id}
                              variant={sub.color ? "contained" : "outlined"}
                              size="small"
                              sx={{
                                m: 0.5,
                                // fontSize: { sm: "0.5rem", md: "0.65rem" },
                              }}
                              color={sub.color || "primary"}
                              onClick={() =>
                                handleOpenDialog(
                                  candidateProfile.user.id,
                                  sub.targetId
                                )
                              }
                            >
                              {sub.nombre}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          ))}

        {/* PDF Download */}

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Seleccione el documento</DialogTitle>
          <DialogContent>
            <Box display="flex" justifyContent="center" gap={2} mt={1}>
              <Button
                variant={selectedTab === 0 ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSelectedTab(0)}
                endIcon={<PictureAsPdfIcon />}
              >
                Ficha Técnica
              </Button>
              <Button
                variant={selectedTab === 1 ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSelectedTab(1)}
                endIcon={<PictureAsPdfIcon />}
              >
                Habilidades
              </Button>
              <Button
                variant={selectedTab === 2 ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSelectedTab(2)}
                endIcon={<FileDownloadIcon />}
              >
                Proyecto de Vida
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary">
              Cerrar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleDownload()}
            >
              Descargar PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
      {/* Integración del Dialog para agendar la entrevista */}
      {openInterviewDialog && (
        <Suspense fallback={<CircularProgress sx={{ mt: 2 }} />}>
          <InterviewDialog
            uid={uid}
            open={openInterviewDialog}
            handleClose={handleCloseInterviewDialog}
            getData={getAppointments}
            candidateProfile={candidateProfile}
          />
        </Suspense>
      )}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 2 }}
        open={downloadLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Loading popup para el datasheet */}
      {/* {console.log("🔍 Estado datasheetLoading:", datasheetLoading)}
      <LoadingPopup
        open={datasheetLoading}
        message="Cargando expediente del candidato..."
        zIndex={9998}
      /> */}
    </Box>
  );
};

export default Datasheet;
