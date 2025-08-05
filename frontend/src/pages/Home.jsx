import React, { useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useSelector } from "react-redux";
import LoadingPopup from "../components/LoadingPopup"

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Detect mobile screens

  const { isAuthenticated, loading, user, isStaff } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    isStaff: state.auth.user?.is_staff,
    loading: state.auth.isLoading,
    user: state.auth.user,
  }));

  const handleGetStarted = () => {
    navigate("/info");
  };

  const handlePreentrevista = () => {
    if (user) {
      navigate('/candidato/dashboard/');
    } else {
      console.error("User is not available");
    }
  };

  useEffect(() => {
    document.title = "Confe";
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Top Bar */}
      <NavBar />

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          px: 3,
          py: 6,
          textAlign: isMobile ? "center" : "left",
        }}
      >
        {/* Left Text Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: isMobile ? "center" : "flex-start",
            pr: isMobile ? 0 : 4,
            maxWidth: isMobile ? "90%" : "50%",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            CONFE
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, color: theme.palette.text.secondary }}
          >
            La Confederación Mexicana de Organizaciones en favor de la Persona
            con Discapacidad Intelectual, CONFE, es una asociación civil sin
            fines de lucro que afilia a 114 organizaciones del país con quienes
            trabajamos por la defensa de los derechos de las personas con
            discapacidad intelectual, sensibilizando a la sociedad y
            participando en políticas públicas conjuntamente con otras
            organizaciones de y para personas con discapacidad intelectual.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, mb: 3 }}
          >
            En nuestro Centro Nacional de Capacitación CONFE, brindamos
            servicios de intervención temprana y estimulación multisensorial a
            bebés de 45 días de nacidos a 6 años de edad, y capacitación e
            inclusión laboral a adultos de 15 a 50 años.
          </Typography>

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
            }}
          >
            {!isAuthenticated || isStaff ? (
              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: "none", fontWeight: "bold" }}
                onClick={handleGetStarted}
              >
                Información
              </Button>
            ) : null}

            {isAuthenticated && 
             !isStaff && 
             user?.groups?.some(group => group.name === "candidatos") && (
              <Button
                variant="contained"
                color="secondary"
                sx={{ textTransform: "none", fontWeight: "bold" }}
                onClick={handlePreentrevista}
              >
                Iniciar Proceso
              </Button>
            )}
          </Box>
        </Box>

        {/* Right Illustration Section */}
        <Box
          component="img"
          src="../../assets/ilustracionDisc.webp"
          alt="Illustration"
          sx={{
            flex: 1,
            maxWidth: isMobile ? "80%" : "60%",
            height: "auto",
            borderRadius: "30%",
            mt: isMobile ? 4 : 0,
          }}
        />
      </Box>
      <LoadingPopup
        open={loading}
      />
    </Box>
  );
};

export default Home;
