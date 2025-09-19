import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Grid,
  Divider,
} from "@mui/material";
import {
  ExpandMore,
  Search,
  BugReport,
  Feedback,
  QuestionAnswer,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function FAQ() {
  useDocumentTitle("Preguntas Frecuentes");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      category: "General",
      color: "primary",
      questions: [
        {
          question: "¿Qué es ConfeApp?",
          answer: "ConfeApp es una plataforma integral para la gestión de candidatos y procesos de reclutamiento. Te permite registrar candidatos, gestionar entrevistas, realizar seguimiento del progreso y generar reportes detallados.",
        },
        {
          question: "¿Cómo puedo acceder a mi cuenta?",
          answer: "Puedes acceder a tu cuenta usando tu email y contraseña en la página de inicio de sesión. Si olvidaste tu contraseña, puedes usar la opción 'Recuperar contraseña' para restablecerla.",
        },
        {
          question: "¿La aplicación es segura?",
          answer: "Sí, ConfeApp utiliza encriptación de extremo a extremo y cumple con los estándares de seguridad más altos para proteger tu información y la de tus candidatos.",
        },
      ],
    },
    {
      category: "Candidatos",
      color: "secondary",
      questions: [
        {
          question: "¿Cómo registro un nuevo candidato?",
          answer: "Ve a la sección 'Candidatos' y haz clic en 'Crear Nuevo Candidato'. Completa el formulario con la información básica del candidato y guarda los cambios.",
        },
        {
          question: "¿Puedo importar candidatos desde un archivo Excel?",
          answer: "Sí, puedes usar la función de 'Carga Masiva' para importar múltiples candidatos desde un archivo Excel. Asegúrate de que el archivo tenga el formato correcto.",
        },
        {
          question: "¿Cómo evalúo las habilidades de un candidato?",
          answer: "En el perfil del candidato, ve a la sección 'Evaluación de Habilidades' donde puedes agregar, editar y eliminar habilidades evaluadas con sus respectivos niveles de competencia.",
        },
        {
          question: "¿Puedo hacer seguimiento del historial laboral?",
          answer: "Sí, cada candidato tiene una sección de 'Historial Laboral' donde puedes registrar sus empleos anteriores, fechas de inicio y fin, y comentarios adicionales.",
        },
      ],
    },
    {
      category: "Calendario",
      color: "success",
      questions: [
        {
          question: "¿Cómo programo una entrevista?",
          answer: "Ve a la sección 'Calendario' y haz clic en la fecha deseada. Selecciona 'Nueva Entrevista' y completa los detalles: candidato, empleador, hora y tipo de entrevista.",
        },
        {
          question: "¿Puedo sincronizar con mi calendario personal?",
          answer: "Sí, ConfeApp se integra con calendarios externos como Google Calendar y Outlook para mantener sincronizados todos tus eventos.",
        },
        {
          question: "¿Cómo recibo recordatorios de citas?",
          answer: "Puedes configurar recordatorios automáticos en la sección de Configuración. Los recordatorios se envían por email y notificaciones dentro de la aplicación.",
        },
      ],
    },
    {
      category: "Reportes",
      color: "warning",
      questions: [
        {
          question: "¿Qué tipos de reportes puedo generar?",
          answer: "Puedes generar reportes de colocación laboral, estadísticas de candidatos, tiempos de proceso, y reportes personalizados según tus necesidades específicas.",
        },
        {
          question: "¿En qué formatos puedo exportar los reportes?",
          answer: "Los reportes se pueden exportar en formato PDF, Excel (XLSX) y CSV para facilitar el análisis y presentación de datos.",
        },
        {
          question: "¿Puedo programar reportes automáticos?",
          answer: "Sí, puedes configurar reportes que se generen y envíen automáticamente en intervalos regulares (diario, semanal, mensual).",
        },
      ],
    },
    {
      category: "Configuración",
      color: "info",
      questions: [
        {
          question: "¿Cómo cambio el tema de la aplicación?",
          answer: "Ve a Configuración > Accesibilidad y usa el botón de tema en la barra superior para cambiar entre modo claro, oscuro y daltónico.",
        },
        {
          question: "¿Puedo ajustar el tamaño de la fuente?",
          answer: "Sí, en la sección de Accesibilidad puedes seleccionar entre diferentes tamaños de fuente: pequeño, mediano, grande y extra grande.",
        },
        {
          question: "¿Cómo configuro las notificaciones?",
          answer: "En la sección de Notificaciones puedes habilitar o deshabilitar diferentes tipos de alertas y elegir cómo recibirlas (email, SMS, aplicación).",
        },
        {
          question: "¿Qué es el modo de alto contraste?",
          answer: "El modo de alto contraste aumenta la diferencia entre colores para mejorar la legibilidad, especialmente útil para usuarios con problemas de visión.",
        },
      ],
    },
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Preguntas Frecuentes
      </Typography>

      {/* Search */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Buscar en las Preguntas Frecuentes
        </Typography>
        <TextField
          fullWidth
          placeholder="Buscar preguntas o respuestas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* FAQ Categories */}
      {filteredFAQs.length > 0 ? (
        filteredFAQs.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Chip
                label={category.category}
                color={category.color}
                icon={<QuestionAnswer />}
              />
              <Typography variant="h6">
                {category.category}
              </Typography>
            </Box>

            {category.questions.map((faq, faqIndex) => (
              <Accordion key={faqIndex} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))
      ) : (
        <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No se encontraron resultados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intenta con otros términos de búsqueda o explora las categorías disponibles.
          </Typography>
        </Paper>
      )}


      {/* Contact Support */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          ¿No encuentras la respuesta que buscas?
        </Typography>
        <Typography variant="body2" paragraph>
          Si tu pregunta no está en esta lista, puedes contactarnos directamente.
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<BugReport />}
              onClick={() => navigate("/help/report-bug")}
            >
              Reportar un Error
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Feedback />}
              onClick={() => navigate("/help/feedback")}
            >
              Enviar Comentarios
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
