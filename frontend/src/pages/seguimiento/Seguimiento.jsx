import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  Select,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api";
import ProyectoDeVidaSeguimiento from "./ProyectoDeVidaSeguimiento";
import PlanApoyosSeguimiento from "./PlanApoyosSeguimiento";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";

import ApoyosSeguimientoGeneral from "./ApoyosSeguimientoGeneral";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const Seguimiento = () => {
  useDocumentTitle("Seguimiento del Candidato");

  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  useEffect(() => {
    axios
      .get(`/api/candidatos/profiles/${uid}/`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
  }, [uid]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!profile) return <Typography>Cargando...</Typography>;

  return (
    <Box m={{ xs: 2, md: 4 }}>
      {/* Perfil del candidato */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              src={profile.photo || undefined}
              sx={{ width: 100, height: 100 }}
            >
              {!profile.photo && profile.user.first_name.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" fontWeight="bold">
              {profile.user.first_name} {profile.user.last_name}{" "}
              {profile.user.second_last_name}
            </Typography>
            <Typography variant="subtitle1">
              {profile.disability_name}
            </Typography>
            <Typography variant="body2">
              Edad:{" "}
              {profile.birth_date
                ? `${
                    new Date().getFullYear() -
                    new Date(profile.birth_date).getFullYear()
                  } años`
                : "N/A"}
            </Typography>
            <Typography variant="body2">
              Correo: {profile.user.email}
            </Typography>
            <Typography variant="body2">
              Teléfono: {formatCanonicalPhoneNumber(profile.phone_number)}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/candidatos/historial-apoyos/${uid}`)}
            >
              Ir a Apoyos Perfil
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs de navegación */}
      {isMobile ? (
        <Box mb={2} display="flex" flexDirection="column" gap={1}>
          <Button
            variant={tabValue === 0 ? "contained" : "outlined"}
            color="primary"
            onClick={() => setTabValue(0)}
          >
            Plan Personalizado de Apoyo
          </Button>
          {/* <Button
            variant={tabValue === 1 ? "contained" : "outlined"}
            color="primary"
            onClick={() => setTabValue(1)}
          >
            Cuadro de Habilidades
          </Button> */}
          {/* <Button
            variant={tabValue === 2 ? "contained" : "outlined"}
            color="primary"
            onClick={() => setTabValue(2)}
          >
            Evaluación diagnóstica
          </Button> */}
          <Button
            variant={tabValue === 1 ? "contained" : "outlined"}
            color="primary"
            onClick={() => setTabValue(3)}
          >
            Proyecto de Vida
          </Button>
        </Box>
      ) : (
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="secondary"
          textColor="inherit"
          sx={{
            mb: 3,
            borderRadius: 2,
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: 2,
            },
          }}
        >
          <Tab
            label="Plan Personalizado de Apoyo"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              // color: tabValue === 0 ? "primary.main" : "text.secondary",
              // "&:hover": {
              //   color: "primary.main",
              //   backgroundColor: "rgba(25, 118, 210, 0.08)",
              // },
            }}
          />
          {/* <Tab
            label="Cuadro de Habilidades"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              color: tabValue === 1 ? "primary.main" : "text.secondary",
              "&:hover": {
                color: "primary.main",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            }}
          /> */}
          {/* <Tab
            label="Evaluación diagnóstica"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              color: tabValue === 2 ? "primary.main" : "text.secondary",
              "&:hover": {
                color: "primary.main",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            }}
          /> */}
          <Tab
            label="Proyecto de Vida"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              // color: tabValue === 3 ? "primary.main" : "text.secondary",
              // "&:hover": {
              //   color: "primary.main",
              //   backgroundColor: "rgba(25, 118, 210, 0.08)",
              // },
            }}
          />
        </Tabs>
      )}

      {/* Contenido de los tabs */}
      {tabValue === 0 && (
        <Box>
          <PlanApoyosSeguimiento uid={uid} />
        </Box>
      )}
      {/* {tabValue === 1 && (
        <Box>
          <ApoyosSeguimientoGeneral uid={uid} tipo="ch" />
        </Box>
      )} */}
      {/* {tabValue === 2 && (
        <Box>
          <ApoyosSeguimientoGeneral uid={uid} tipo="ed" />
        </Box>
      )} */}
      {tabValue === 1 && (
        <Box>
          <ProyectoDeVidaSeguimiento uid={uid} />
        </Box>
      )}
    </Box>
  );
};

export default Seguimiento;
