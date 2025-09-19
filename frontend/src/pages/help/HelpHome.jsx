import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  Help,
  QuestionAnswer,
  BugReport,
  Feedback,
  Search,
  Book,
  Support,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function HelpHome() {
  useDocumentTitle("Centro de Ayuda - ConfeApp");
  const navigate = useNavigate();

  const helpSections = [
    {
      title: "Guía de Usuario",
      description: "Aprende a usar todas las funcionalidades de ConfeApp con nuestra guía completa paso a paso.",
      icon: <Book />,
      path: "/help/user-guide",
      color: "primary",
      features: ["Tutoriales detallados", "Capturas de pantalla", "Consejos útiles"],
    },
    {
      title: "Preguntas Frecuentes",
      description: "Encuentra respuestas rápidas a las preguntas más comunes sobre ConfeApp.",
      icon: <QuestionAnswer />,
      path: "/help/faq",
      color: "secondary",
      features: ["Búsqueda inteligente", "Categorías organizadas", "Respuestas detalladas"],
    },
    {
      title: "Reportar Error",
      description: "¿Encontraste un problema? Ayúdanos a solucionarlo reportando el error.",
      icon: <BugReport />,
      path: "/help/report-bug",
      color: "error",
      features: ["Formulario detallado", "Seguimiento del estado", "Respuesta rápida"],
    },
    {
      title: "Enviar Comentarios",
      description: "Comparte tus ideas y sugerencias para mejorar ConfeApp.",
      icon: <Feedback />,
      path: "/help/feedback",
      color: "success",
      features: ["Calificación del sistema", "Sugerencias de mejora", "Comentarios generales"],
    },
  ];

  const quickActions = [
    {
      title: "¿Cómo registro un candidato?",
      path: "/help/user-guide",
      category: "Candidatos",
    },
    {
      title: "¿Cómo programo una entrevista?",
      path: "/help/user-guide",
      category: "Calendario",
    },
    {
      title: "¿Cómo cambio el tema de la aplicación?",
      path: "/help/faq",
      category: "Configuración",
    },
    {
      title: "¿Cómo genero un reporte?",
      path: "/help/user-guide",
      category: "Reportes",
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Support sx={{ fontSize: 48, color: "primary.main" }} />
        </Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Centro de Ayuda
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Bienvenido al centro de ayuda de ConfeApp. Aquí encontrarás toda la información
          que necesitas para aprovechar al máximo nuestra plataforma.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Search />}
            onClick={() => navigate("/help/faq")}
          >
            Buscar en FAQ
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Book />}
            onClick={() => navigate("/help/user-guide")}
          >
            Ver Guía
          </Button>
        </Box>
      </Paper>

      {/* Help Sections */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Recursos de Ayuda
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {helpSections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card 
              sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: `${section.color}.light`,
                      color: `${section.color}.contrastText`,
                      mr: 2,
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Typography variant="h6" component="h2">
                    {section.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {section.description}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {section.features.map((feature, featureIndex) => (
                    <Chip
                      key={featureIndex}
                      label={feature}
                      size="small"
                      variant="outlined"
                      color={section.color}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color={section.color}
                  onClick={() => navigate(section.path)}
                  sx={{ ml: 1 }}
                >
                  Acceder
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Acciones Rápidas
      </Typography>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {action.title}
                    </Typography>
                    <Chip
                      label={action.category}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                  <Button size="small" variant="text">
                    Ver →
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Contact Information */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: "primary.light", color: "primary.contrastText" }}>
        <Typography variant="h6" gutterBottom>
          ¿Necesitas Ayuda Personalizada?
        </Typography>
        <Typography variant="body2" paragraph>
          Si no encuentras lo que buscas en nuestro centro de ayuda, nuestro equipo de soporte
          está aquí para ayudarte.
        </Typography>
        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.3)" }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="medium">
              📧 Email de Soporte
            </Typography>
            <Typography variant="body2">
              soporte@confeapp.com
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="medium">
              📞 Teléfono
            </Typography>
            <Typography variant="body2">
              +52 (55) 1234-5678
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="medium">
              🕒 Horario
            </Typography>
            <Typography variant="body2">
              Lunes a Viernes<br />
              9:00 AM - 6:00 PM
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
