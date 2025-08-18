import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  Tab,
  Box,
  useMediaQuery,
  Typography,
  Button
} from "@mui/material";
import GeneralAidHistory from "./aids/GeneralAidHistory";
import CuadroHabilidadesAidHistory from "../seguimiento/tipos/CuadroHabilidadesAidHistory";
import EvaluacionDiagnosticaAidHistory from "../seguimiento/tipos/EvaluacionDiagnosticaAidHistory";
import Header from "../../components/Header";
import axios from "../../api"
import { generarReporteApoyos } from "../seguimiento/funciones/generarReporteApoyos";

const PlanApoyosSeguimiento = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [candidate, setCandidate] = useState(null);
  
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const candidateResp = await axios.get(`/api/auth/users/${uid}/`);
        setCandidate(candidateResp.data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setCandidate(null);
      }
    };

    if (uid) fetchCandidate();
  }, [uid]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const descargarReportePDF = async () => {
    try {
      const [sisRes, chRes, edRes] = await Promise.all([
        axios.get(`/api/candidatos/seguimiento/sis-aid/${uid}/`),
        axios.get(`/api/candidatos/seguimiento/ch-aid/${uid}/`),
        axios.get(`/api/candidatos/seguimiento/ed-aid/${uid}/`),
      ]);
  
      const apoyosTotales = [
        ...sisRes.data.map((a) => ({ ...a, fuente: "Apoyos del SIS" })),
        ...chRes.data.map((a) => ({ ...a, fuente: "Cuadro de Habilidades" })),
        ...edRes.data.map((a) => ({ ...a, fuente: "Evaluación Diagnóstica" })),
      ];
  
      await generarReporteApoyos(apoyosTotales, candidate);
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Header
        subtitle={
          candidate
            ? `${candidate.first_name} ${candidate.last_name} ${
                candidate.second_last_name || ""
              }`
            : ""
        }
        actionButton={
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/candidatos/${uid}`)}
          >
            Volver al Perfil
          </Button>
        }
        

      />
      {isMobile ? (
        <Box mb={2} display="flex" flexDirection="column" gap={1}>
          <Typography
            variant="button"
            onClick={() => setTabValue(0)}
            sx={{
              p: 1.5,
              backgroundColor: tabValue === 0 ? "primary.main" : "grey.400",
              color: tabValue === 0 ? "white" : "black",
              borderRadius: 1,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Apoyos SIS
          </Typography>
          <Typography
            variant="button"
            onClick={() => setTabValue(1)}
            sx={{
              p: 1.5,
              backgroundColor: tabValue === 1 ? "primary.main" : "grey.400",
              color: tabValue === 1 ? "white" : "black",
              borderRadius: 1,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Cuadro de Habilidades
          </Typography>
          <Typography
            variant="button"
            onClick={() => setTabValue(2)}
            sx={{
              p: 1.5,
              backgroundColor: tabValue === 2 ? "primary.main" : "grey.400",
              color: tabValue === 2 ? "white" : "black",
              borderRadius: 1,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Evaluación Diagnóstica
          </Typography>
        </Box>
      ) : (
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Apoyos SIS" />
          <Tab label="Evaluación Diagnóstica" />
          <Tab label="Cuadro de Habilidades" />
        </Tabs>
      )}

      {tabValue === 0 && (
        <GeneralAidHistory documentTitle="Apoyos del SIS" />
      )}
      {tabValue === 1 && (
        <EvaluacionDiagnosticaAidHistory documentTitle="Apoyos de Evaluación Diagnóstica"/>
      )}
      {tabValue === 2 && (
        <CuadroHabilidadesAidHistory documentTitle="Apoyos de Cuadro de Habilidades"/>
      )}
    </Box>
  );
};

export default React.memo(PlanApoyosSeguimiento);
