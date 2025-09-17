import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
} from "@mui/material";
import Header from "../../components/Header";
import axios from "../../api";
import dayjs from "dayjs";
import 'dayjs/locale/es';
import DatasheetSkeleton from "../../components/datasheet/DatasheetSkeleton";
import NavBar from "../../components/NavBar";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import ContactList from "../../components/candidate_create/ContactList";
import DetailSection from "../../components/candidate_create/DetailSection"
import AssistWalkerIcon from "@mui/icons-material/AssistWalker";

const stageOrder = [
  { code: "Reg", label: "Registro" },
  { code: "Pre", label: "Preentrevista" },
  { code: "Can", label: "Canalización" },
  { code: "Ent", label: "Entrevista" },
  { code: "Cap", label: "Capacitación", subphases: ["SIS", "ED", "PA", "PV"] },
  { code: "Agn", label: "Agencia" },
];

const CandidateDatasheet = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [candidateProfile, setCandidateProfile] = useState(null);

  const navigate = useNavigate();

  dayjs.locale('es');

  useEffect(() => {
    axios
      .get("/api/candidatos/profiles/me/")
      .then((res) => setCandidateProfile(res.data))
      .catch((err) => console.error(err));
  }, []);

  const activeStep = stageOrder.findIndex(
    (stage) => stage.code === candidateProfile?.stage
  );

  return (
    <Box sx={{ background: 'linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)', height: "100%" }}>
      <NavBar />
      {!candidateProfile ? (
        <DatasheetSkeleton />
      ) : (
        <Box sx={{ m: "20px" }}>
          <Header title="Tu Expediente" titleColor="white" />
          <Paper
            elevation={3}
            sx={{ p: { xs: "20px", md: "40px" }, borderRadius: "12px" }}
          >
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
                    width: 120,
                    height: 120,
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
                    {candidateProfile.user.second_last_name}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    {candidateProfile.disability_name}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Contacto:{" "}
                    {formatCanonicalPhoneNumber(candidateProfile.phone_number)},{" "}
                    {candidateProfile.user.email}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" gap={1}>
                <Chip
                  label={candidateProfile.user.is_active ? "ACTIVO" : "INACTIVO"}
                  color={candidateProfile.user.is_active ? "success" : "error"}
                  sx={{ fontWeight: "bold", p: "8px 16px" }}
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<AssistWalkerIcon />}
                  onClick={() => navigate('/candidato/apoyos')}
                  sx={{
                    minWidth: "120px",
                  }}
                  disabled={
                    candidateProfile.stage != "Agn" &&
                    candidateProfile.stage != "Cap"
                  }
                >
                  Apoyos
                </Button>
              </Box>
            </Box>

            <ContactList
              emergency_contacts={candidateProfile.emergency_contacts}
            />
            <DetailSection candidateProfile={candidateProfile} />

            <Divider sx={{ my: 2 }} />

            <Stepper
              alternativeLabel
              orientation={isSmallScreen ? "vertical" : "horizontal"}
              activeStep={activeStep}
              sx={{ background: "transparent" }}
            >
              {stageOrder.map((stage, index) => (
                <Step key={index} completed={index < activeStep}>
                  <StepLabel>{stage.label.toUpperCase()}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CandidateDatasheet;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   Chip,
//   Paper,
//   Stepper,
//   Step,
//   StepLabel,
//   Avatar,
//   Divider,
//   useTheme,
//   useMediaQuery,
//   Button,
//   Link,
//   Tooltip,
// } from "@mui/material";
// import Header from "../../components/Header";
// import axios from "../../api";
// import dayjs from "dayjs";
// import "dayjs/locale/es";
// import DatasheetSkeleton from "../../components/datasheet/DatasheetSkeleton";
// import NavBar from "../../components/NavBar";
// import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
// import ContactList from "../../components/candidate_create/ContactList";
// import DetailSection from "../../components/candidate_create/DetailSection";
// import AssistWalkerIcon from "@mui/icons-material/AssistWalker";

// const stageOrder = [
//   { code: "Reg", label: "Registro" },
//   { code: "Pre", label: "Preentrevista" },
//   { code: "Can", label: "Canalización" },
//   { code: "Ent", label: "Entrevista" },
//   { code: "Cap", label: "Capacitación", subphases: ["SIS", "ED", "PA", "PV"] },
//   { code: "Agn", label: "Agencia" },
// ];

// const CandidateDatasheet = () => {
//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
//   const [candidateProfile, setCandidateProfile] = useState(null);
//   const [questionnaires, setQuestionnaires] = useState([]);
//   const [expandedPhase, setExpandedPhase] = useState(null);
//   const [cuestionariosBotonesVisualizar, setCuestionariosBotonesVisualizar] =
//     useState(null);

//   const navigate = useNavigate();

//   dayjs.locale("es");

//   useEffect(() => {
//     const fetchCandidateData = async () => {
//       try {
//         // Obtener perfil del candidato
//         const profileResponse = await axios.get("/api/candidatos/profiles/me/");
//         setCandidateProfile(profileResponse.data);

//         // Obtener cuestionarios disponibles para el usuario
//         const questionnairesResponse = await axios.get(
//           `/api/cuestionarios/usuario/${profileResponse.data.user.id}/cuestionarios-con-respuestas/`
//         );
//         setQuestionnaires(questionnairesResponse.data);

//         // Auto-expandir la etapa actual del candidato
//         const currentStage = profileResponse.data.stage;
//         if (currentStage) {
//           setExpandedPhase(currentStage);

//           // Filtrar cuestionarios de la etapa actual que sean responsabilidad del PCD
//           const filteredQuestionnaires = questionnairesResponse.data.filter(
//             (q) =>
//               q.estado_desbloqueo === currentStage && q.responsable === "PCD"
//           );

//           if (filteredQuestionnaires.length > 0) {
//             // Construir subfases visuales con información detallada
//             const subfasesVisuales = filteredQuestionnaires.map((q) => {
//               let colorFinal = "primary";
//               let targetId = q.id;

//               if (q.finalizado) {
//                 colorFinal = "success"; // Verde - Finalizado
//                 targetId = q.id;
//               } else if (q.tiene_respuestas) {
//                 colorFinal = "info"; // Azul - Con respuestas
//                 targetId = q.id;
//               } else {
//                 colorFinal = undefined; // Gris - Sin respuestas
//                 targetId = q.id;
//               }

//               return {
//                 ...q,
//                 color: colorFinal,
//                 targetId,
//               };
//             });
//             setCuestionariosBotonesVisualizar(subfasesVisuales);
//           }
//         }
//       } catch (error) {
//         console.error("Error obteniendo datos del candidato:", error);
//       }
//     };

//     fetchCandidateData();
//   }, []);

//   const activeStep = stageOrder.findIndex(
//     (stage) => stage.code === candidateProfile?.stage
//   );

//   // Helper: check if a stage is completed based on questionnaires
//   const isStageCompleted = (stageCode, questionnaires) => {
//     const stageQuestionnaires = questionnaires.filter(
//       (q) =>
//         q.estado_desbloqueo === stageCode && q.activo && q.responsable === "PCD"
//     );

//     return (
//       stageQuestionnaires.length > 0 &&
//       stageQuestionnaires.every((q) => q.finalizado === true)
//     );
//   };

//   const handleStageClick = (stageCode) => {
//     // Filtrar cuestionarios de la etapa actual que sean responsabilidad del PCD
//     const filteredQuestionnaires = questionnaires.filter(
//       (q) => q.estado_desbloqueo === stageCode && q.responsable === "PCD"
//     );

//     if (filteredQuestionnaires.length === 0) {
//       return;
//     }

//     // Solo permitir expandir, no colapsar
//     if (expandedPhase !== stageCode) {
//       setExpandedPhase(stageCode);

//       // Construir subfases visuales con información detallada
//       const subfasesVisuales = filteredQuestionnaires.map((q) => {
//         let colorFinal = "primary";
//         let targetId = q.id;

//         if (q.finalizado) {
//           colorFinal = "success"; // Verde - Finalizado
//           targetId = q.id;
//         } else if (q.tiene_respuestas) {
//           colorFinal = "info"; // Azul - Con respuestas
//           targetId = q.id;
//         } else {
//           colorFinal = undefined; // Gris - Sin respuestas
//           targetId = q.id;
//         }

//         return {
//           ...q,
//           color: colorFinal,
//           targetId,
//         };
//       });
//       setCuestionariosBotonesVisualizar(subfasesVisuales);
//     } else {
//       setExpandedPhase(null);
//     }
//   };

//   const handleOpenDialog = (userId, questionnaireId) => {
//     navigate(`/candidato/${userId}/${questionnaireId}`);
//   };

//   return (
//     <Box
//       sx={{
//         background:
//           "linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)",
//         height: "100%",
//       }}
//     >
//       <NavBar />
//       {!candidateProfile ? (
//         <DatasheetSkeleton />
//       ) : (
//         <Box sx={{ m: { xs: 1, sm: 2, md: 3 } }}>
//           <Header title="Tu Expediente" titleColor="white" />
//           <Paper
//             elevation={3}
//             sx={{
//               p: { xs: 2, sm: 3, md: 4 },
//               borderRadius: "12px",
//             }}
//           >
//             {/* Header Section */}
//             <Box
//               display="flex"
//               flexDirection={{ xs: "column", sm: "row" }}
//               alignItems="center"
//               justifyContent="space-between"
//               mb={3}
//               gap={2}
//             >
//               <Box
//                 display="flex"
//                 flexDirection={{ xs: "column", sm: "row" }}
//                 alignItems="center"
//                 gap={2}
//                 mb={{ xs: 2, sm: 0 }}
//               >
//                 <Avatar
//                   src={candidateProfile.photo || undefined}
//                   sx={{
//                     width: { xs: 100, sm: 140, md: 180 },
//                     height: { xs: 100, sm: 140, md: 180 },
//                     border: `4px solid ${theme.palette.primary.main}`,
//                   }}
//                 >
//                   {!candidateProfile.photo &&
//                     candidateProfile.user.first_name.charAt(0)}
//                 </Avatar>
//                 <Box textAlign={{ xs: "center", sm: "left" }}>
//                   <Typography variant="h4" fontWeight="bold">
//                     {candidateProfile.user.first_name}{" "}
//                     {candidateProfile.user.last_name}{" "}
//                     {candidateProfile.user.second_last_name}{" "}
//                   </Typography>
//                   <Typography variant="subtitle1" color="textSecondary">
//                     {candidateProfile.disability_name}
//                   </Typography>
//                   <Typography variant="subtitle1" color="textSecondary">
//                     Contacto:{" "}
//                     <Link
//                       href={`tel:${candidateProfile.phone_number}`}
//                       sx={{ fontWeight: "bold" }}
//                     >
//                       {formatCanonicalPhoneNumber(
//                         candidateProfile.phone_number
//                       )}
//                     </Link>{" "}
//                     ,{" "}
//                     <Link
//                       href={`mailto:${candidateProfile.user.email}`}
//                       sx={{ fontWeight: "bold" }}
//                     >
//                       {candidateProfile.user.email}
//                     </Link>
//                   </Typography>
//                   {candidateProfile.cycle ? (
//                     <Tooltip
//                       title={`De ${dayjs(
//                         candidateProfile.cycle.start_date
//                       ).format("LL")} a ${dayjs(
//                         candidateProfile.cycle.end_date
//                       ).format("LL")}`}
//                     >
//                       <Typography variant="subtitle1" color="textSecondary">
//                         {candidateProfile.cycle.name}
//                       </Typography>
//                     </Tooltip>
//                   ) : (
//                     <Typography variant="subtitle1" color="textSecondary">
//                       Sin ciclo
//                     </Typography>
//                   )}
//                 </Box>
//               </Box>
//               {/* Right Side: Status and Actions */}
//               <Box gap={2}>
//                 <Box
//                   display="flex"
//                   flexDirection={{ xs: "column", sm: "row" }}
//                   alignItems="center"
//                   gap={1}
//                 >
//                   <Chip
//                     label={
//                       candidateProfile.user.is_active ? "ACTIVO" : "INACTIVO"
//                     }
//                     color={
//                       candidateProfile.user.is_active ? "success" : "error"
//                     }
//                     sx={{
//                       fontWeight: "bold",
//                       py: 1,
//                       minWidth: "120px",
//                     }}
//                   />
//                 </Box>
//                 <Box
//                   display="flex"
//                   flexDirection={{ xs: "column", sm: "row" }}
//                   alignItems="center"
//                   sx={{ marginTop: 1 }}
//                   gap={1}
//                 >
//                   <Button
//                     variant="outlined"
//                     color="secondary"
//                     endIcon={<AssistWalkerIcon />}
//                     onClick={() => navigate("/candidato/apoyos")}
//                     sx={{
//                       minWidth: "120px",
//                     }}
//                     disabled={
//                       candidateProfile.stage != "Agn" &&
//                       candidateProfile.stage != "Cap"
//                     }
//                   >
//                     Apoyos
//                   </Button>
//                 </Box>
//               </Box>
//             </Box>

//             <ContactList
//               emergency_contacts={candidateProfile.emergency_contacts}
//             />
//             <DetailSection candidateProfile={candidateProfile} />

//             <Divider sx={{ my: { xs: 2, md: 3 } }} />

//             {/* Timeline View */}

//             {isSmallScreen ? (
//               // === Fases para móviles ===
//               <Stepper
//                 orientation="vertical"
//                 activeStep={activeStep}
//                 sx={{
//                   background: "transparent",
//                   px: 1,
//                   // Asegura los mismos estilos de color que en escritorio
//                   "& .MuiStepLabel-root .MuiButton-root": {
//                     // fontWeight: "bold",
//                     fontSize: "0.9rem",
//                     letterSpacing: 1,
//                   },
//                 }}
//               >
//                 {stageOrder.map((stage, index) => {
//                   const stageQuestionnaires = questionnaires.filter(
//                     (q) =>
//                       q.estado_desbloqueo === stage.code &&
//                       q.activo &&
//                       q.responsable === "PCD"
//                   );
//                   const stageIndex = stageOrder.findIndex(
//                     (s) => s.code === stage.code
//                   );

//                   const isStageCompleted =
//                     stageQuestionnaires.length > 0 &&
//                     stageQuestionnaires.every((q) => q.finalizado === true);

//                   // Mobile: use same color logic as desktop
//                   // Previous steps: green, current: blue, next: outlined
//                   return (
//                     <Step key={index} completed={isStageCompleted}>
//                       <StepLabel
//                         StepIconComponent={() => (
//                           <Box
//                             sx={{
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               width: 24,
//                               height: 24,
//                               borderRadius: "50%",
//                               bgcolor:
//                                 index < activeStep
//                                   ? "success.main"
//                                   : index === activeStep
//                                   ? "primary.main"
//                                   : isStageCompleted
//                                   ? "success.main"
//                                   : "transparent",
//                               color: "#fff",
//                               fontSize: 14,
//                               fontWeight: "bold",
//                               border:
//                                 index >= activeStep ? "2px solid" : "none",
//                               borderColor:
//                                 index >= activeStep
//                                   ? "primary.main"
//                                   : "transparent",
//                             }}
//                           >
//                             {index < activeStep ? "✓" : index + 1}
//                           </Box>
//                         )}
//                       >
//                         {/* === Fases para móviles (colores igual que escritorio) === */}
//                         <Button
//                           fullWidth
//                           variant={
//                             index < activeStep
//                               ? "contained"
//                               : index === activeStep
//                               ? "contained"
//                               : isStageCompleted
//                               ? "contained"
//                               : "outlined"
//                           }
//                           color={
//                             index < activeStep
//                               ? "success"
//                               : index === activeStep
//                               ? "info"
//                               : isStageCompleted
//                               ? "success"
//                               : "primary"
//                           }
//                           size="small"
//                           sx={{ my: 0.5 }}
//                           onClick={() => handleStageClick(stage.code)}
//                           disabled={activeStep < index}
//                         >
//                           {stage.label.toUpperCase()}
//                         </Button>
//                         {expandedPhase === stage.code && (
//                           <Box mt={1}>
//                             {cuestionariosBotonesVisualizar?.map((sub) => (
//                               <Button
//                                 key={sub.id}
//                                 variant={sub.color ? "contained" : "outlined"}
//                                 size="small"
//                                 sx={{ m: 0.5, fontSize: "0.75rem" }}
//                                 color={sub.color || "primary"}
//                                 onClick={() =>
//                                   handleOpenDialog(
//                                     candidateProfile.user.id,
//                                     sub.targetId
//                                   )
//                                 }
//                               >
//                                 {sub.nombre}
//                               </Button>
//                             ))}
//                           </Box>
//                         )}
//                       </StepLabel>
//                     </Step>
//                   );
//                 })}
//               </Stepper>
//             ) : (
//               // For larger screens, render a single Stepper.
//               <Stepper
//                 alternativeLabel
//                 sx={{
//                   background: "transparent",
//                   maxWidth: { xs: "100%", sm: "95%", md: "900px" },
//                   margin: "auto",
//                   mt: 2,
//                 }}
//                 activeStep={activeStep}
//               >
//                 {stageOrder.map((stage, index) => {
//                   const stageQuestionnaires = questionnaires.filter(
//                     (q) =>
//                       q.estado_desbloqueo === stage.code &&
//                       q.activo &&
//                       q.responsable === "PCD"
//                   );
//                   const stageIndex = stageOrder.findIndex(
//                     (s) => s.code === stage.code
//                   );
//                   const isStageCompleted =
//                     stageQuestionnaires.length > 0 &&
//                     stageQuestionnaires.every((q) => q.finalizado === true);

//                   return (
//                     <Step key={index} completed={index < activeStep}>
//                       <StepLabel>
//                         <Button
//                           variant={
//                             index < activeStep
//                               ? "contained"
//                               : index === activeStep
//                               ? "contained"
//                               : isStageCompleted
//                               ? "contained"
//                               : "outlined"
//                           }
//                           color={
//                             index < activeStep
//                               ? "success"
//                               : index === activeStep
//                               ? "info"
//                               : isStageCompleted
//                               ? "success"
//                               : "primary"
//                           }
//                           size="small"
//                           onClick={() => handleStageClick(stage.code)}
//                           disabled={activeStep < index}
//                           sx={{ mb: 1 }}
//                         >
//                           {stage.label.toUpperCase()}
//                         </Button>
//                         {expandedPhase === stage.code && (
//                           <Box mt={1}>
//                             {cuestionariosBotonesVisualizar?.map((sub) => (
//                               <Button
//                                 key={sub.id}
//                                 variant={sub.color ? "contained" : "outlined"}
//                                 size="small"
//                                 sx={{
//                                   m: 0.5,
//                                   fontSize: { sm: "0.5rem", md: "0.65rem" },
//                                 }}
//                                 color={sub.color || "primary"}
//                                 onClick={() =>
//                                   handleOpenDialog(
//                                     candidateProfile.user.id,
//                                     sub.targetId
//                                   )
//                                 }
//                               >
//                                 {sub.nombre}
//                               </Button>
//                             ))}
//                           </Box>
//                         )}
//                       </StepLabel>
//                     </Step>
//                   );
//                 })}
//               </Stepper>
//             )}
//           </Paper>
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default CandidateDatasheet;
