import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Header from "../../components/Header";
import axios from "../../api";
import dayjs from "dayjs";
import 'dayjs/locale/es';
import DatasheetSkeleton from "../../components/datasheet/DatasheetSkeleton";
import NavBar from "../../components/NavBar";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import ContactList from "../../components/candidate_create/ContactList";
import DetailSection from "../../components/candidate_create/DetailSection"

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
  
  dayjs.locale('es');

  useEffect(() => {
    axios
      .get("/api/candidatos/profiles/me/")
      .then((res) => setCandidateProfile(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!candidateProfile) {
    return <DatasheetSkeleton />;
  }

  let age = "";
  if (candidateProfile.birth_date) {
    const birth = dayjs(candidateProfile.birth_date);
    const now = dayjs();
    age = now.diff(birth, "year") + " años";
  }

  const activeStep = stageOrder.findIndex(
    (stage) => stage.code === candidateProfile.stage
  );

  return (
    <Box>
      <NavBar />
      <Box m="20px">
        <Header title="Tu Expediente" />
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
            <Chip
              label={candidateProfile.user.is_active ? "ACTIVO" : "INACTIVO"}
              color={candidateProfile.user.is_active ? "success" : "error"}
              sx={{ fontWeight: "bold", p: "8px 16px" }}
            />
          </Box>

          <ContactList
            emergency_contacts={candidateProfile.emergency_contacts}
          />
          <DetailSection candidateProfile={candidateProfile}/>

          <Divider sx={{ my: 2 }} />

          <Stepper
            alternativeLabel
            orientation={isSmallScreen ? "vertical": "horizontal"}
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
    </Box>
  );
};

export default CandidateDatasheet;
