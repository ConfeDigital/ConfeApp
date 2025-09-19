import React from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Grid,
} from "@mui/material";
import {
  ExpandMore,
  Dashboard,
  People,
  CalendarMonth,
  Assessment,
  Settings,
  Notifications,
  Help,
  CheckCircle,
  Info,
  Warning,
} from "@mui/icons-material";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function UserGuide() {
  useDocumentTitle("Guía de Usuario");

  const sections = [
    {
      title: "Dashboard Principal",
      icon: <Dashboard />,
      content: [
        "El dashboard es tu centro de control principal donde puedes ver un resumen de todas las actividades importantes.",
        "Aquí encontrarás estadísticas clave, notificaciones recientes y acceso rápido a las funciones más utilizadas.",
        "Usa los widgets personalizables para organizar la información según tus necesidades.",
      ],
    },
    {
      title: "Gestión de Candidatos",
      icon: <People />,
      content: [
        "Registra nuevos candidatos con información completa de contacto y perfil profesional.",
        "Gestiona el historial laboral y las habilidades evaluadas de cada candidato.",
        "Realiza seguimiento del progreso y estado de cada candidato en el proceso de selección.",
        "Utiliza las herramientas de búsqueda y filtrado para encontrar candidatos específicos.",
      ],
    },
    {
      title: "Calendario y Citas",
      icon: <CalendarMonth />,
      content: [
        "Programa entrevistas y citas con candidatos y empleadores.",
        "Sincroniza con tu calendario personal para evitar conflictos de horarios.",
        "Recibe recordatorios automáticos de citas próximas.",
        "Gestiona diferentes tipos de eventos: entrevistas, reuniones, capacitaciones.",
      ],
    },
    {
      title: "Reportes y Análisis",
      icon: <Assessment />,
      content: [
        "Genera reportes detallados sobre el rendimiento de candidatos y procesos.",
        "Visualiza estadísticas de colocación laboral y tiempos de proceso.",
        "Exporta datos en diferentes formatos (PDF, Excel) para presentaciones.",
        "Configura reportes automáticos que se envíen periódicamente.",
      ],
    },
    {
      title: "Configuración del Sistema",
      icon: <Settings />,
      content: [
        "Personaliza la interfaz según tus preferencias (tema, tamaño de fuente, contraste).",
        "Configura notificaciones y alertas del sistema.",
        "Gestiona usuarios y permisos de acceso.",
        "Ajusta configuraciones de seguridad y privacidad.",
      ],
    },
    {
      title: "Notificaciones",
      icon: <Notifications />,
      content: [
        "Recibe alertas en tiempo real sobre actividades importantes.",
        "Configura qué tipo de notificaciones deseas recibir.",
        "Gestiona notificaciones por email, SMS o dentro de la aplicación.",
        "Revisa el historial de notificaciones cuando sea necesario.",
      ],
    },
  ];

  const tips = [
    {
      icon: <CheckCircle color="success" />,
      text: "Usa los atajos de teclado para navegar más rápido por la aplicación.",
    },
    {
      icon: <Info color="info" />,
      text: "Guarda tu trabajo frecuentemente para evitar pérdida de datos.",
    },
    {
      icon: <Warning color="warning" />,
      text: "Mantén actualizada tu información de contacto para recibir notificaciones importantes.",
    },
  ];

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Guía de Usuario
      </Typography>

      {/* Introduction */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bienvenido a ConfeApp
        </Typography>
        <Typography variant="body1" paragraph>
          Esta guía te ayudará a aprovechar al máximo todas las funcionalidades de
          ConfeApp. Aquí encontrarás información detallada sobre cómo usar cada
          sección de la aplicación para gestionar eficientemente tus procesos de
          reclutamiento y selección.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Puedes usar el menú de navegación lateral para acceder rápidamente
          a cualquier sección de la aplicación.
        </Typography>
      </Paper>

      {/* Main Sections */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Funcionalidades Principales
      </Typography>

      {sections.map((section, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {section.icon}
              <Typography variant="h6">{section.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {section.content.map((item, itemIndex) => (
                <ListItem key={itemIndex}>
                  <ListItemIcon>
                    <CheckCircle color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Tips Section */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Consejos Útiles
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {tips.map((tip, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {tip.icon}
                <Typography variant="body2">{tip.text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>


      {/* Contact Support */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: "primary.light", color: "primary.contrastText" }}>
        <Typography variant="h6" gutterBottom>
          ¿Necesitas más ayuda?
        </Typography>
        <Typography variant="body2" paragraph>
          Si no encuentras la información que buscas en esta guía, no dudes en
          contactar a nuestro equipo de soporte.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Help />}
          onClick={() => navigate("/help/faq")}
        >
          Ver Preguntas Frecuentes
        </Button>
      </Paper>
    </Box>
  );
}
