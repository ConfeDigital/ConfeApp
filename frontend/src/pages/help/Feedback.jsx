import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Alert,
  Snackbar,
  Grid,
  Divider,
  Chip,
} from "@mui/material";
import {
  BugReport,
  Feedback,
  Send,
  Star,
  ThumbUp,
  ThumbDown,
  Lightbulb,
} from "@mui/icons-material";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function FeedbackPage() {
  useDocumentTitle("Enviar Comentarios");
  const [formData, setFormData] = useState({
    type: "",
    rating: 0,
    title: "",
    description: "",
    suggestions: "",
    contactEmail: "",
    allowContact: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      rating: newValue,
    });
  };

  const feedbackTypes = [
    {
      value: "feature",
      label: "Sugerencia de Funcionalidad",
      icon: <Lightbulb color="primary" />,
      description: "Tienes una idea para mejorar la aplicación",
    },
    {
      value: "improvement",
      label: "Mejora de Funcionalidad Existente",
      icon: <ThumbUp color="success" />,
      description: "Quieres mejorar algo que ya existe",
    },
    {
      value: "bug",
      label: "Reporte de Error",
      icon: <BugReport color="error" />,
      description: "Encontraste un problema o error",
    },
    {
      value: "general",
      label: "Comentario General",
      icon: <Feedback color="info" />,
      description: "Comentarios generales sobre la aplicación",
    },
  ];

  const getRatingText = (rating) => {
    switch (rating) {
      case 1:
        return "Muy Malo";
      case 2:
        return "Malo";
      case 3:
        return "Regular";
      case 4:
        return "Bueno";
      case 5:
        return "Excelente";
      default:
        return "Sin calificar";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar({
        open: true,
        message: "¡Gracias por tu comentario! Lo revisaremos y te contactaremos si es necesario.",
        severity: "success",
      });

      // Reset form
      setFormData({
        type: "",
        rating: 0,
        title: "",
        description: "",
        suggestions: "",
        contactEmail: "",
        allowContact: false,
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al enviar el comentario. Inténtalo de nuevo.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 3, maxWidth: "800px", mx: "auto" }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Enviar Comentarios
      </Typography>

      {/* Instructions */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Feedback color="primary" />
          Tu Opinión es Importante
        </Typography>
        <Typography variant="body2" paragraph>
          Valoramos mucho tus comentarios y sugerencias. Nos ayudan a mejorar ConfeApp
          y hacer que sea una mejor herramienta para todos los usuarios.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Sé específico en tus comentarios. Mientras más detalles
            nos proporciones, mejor podremos entender y implementar tus sugerencias.
          </Typography>
        </Alert>
      </Paper>

      {/* Form */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Rating */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Calificación General
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Rating
                  name="rating"
                  value={formData.rating}
                  onChange={handleRatingChange}
                  size="large"
                  icon={<Star fontSize="inherit" />}
                />
                <Typography variant="body1" color="text.secondary">
                  {getRatingText(formData.rating)}
                </Typography>
              </Box>
            </Grid>

            {/* Feedback Type */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tipo de Comentario
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Comentario</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleChange("type")}
                  label="Tipo de Comentario"
                >
                  {feedbackTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                        {type.icon}
                        <Box>
                          <Typography variant="body1">{type.label}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información del Comentario
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={handleChange("title")}
                required
                placeholder="Resume tu comentario en pocas palabras"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción Detallada"
                value={formData.description}
                onChange={handleChange("description")}
                required
                placeholder="Describe tu comentario, sugerencia o experiencia en detalle..."
              />
            </Grid>

            {/* Suggestions */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Sugerencias de Mejora (Opcional)"
                value={formData.suggestions}
                onChange={handleChange("suggestions")}
                placeholder="Si tienes ideas específicas sobre cómo mejorar algo, compártelas aquí..."
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información de Contacto (Opcional)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email de Contacto"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange("contactEmail")}
                placeholder="tu@email.com"
                helperText="Si proporcionas tu email, podremos contactarte para más detalles o para informarte sobre actualizaciones relacionadas con tu comentario."
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  disabled={isSubmitting}
                  sx={{ minWidth: 200 }}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Comentario"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>


      {/* Thank You Message */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: "primary.light", color: "primary.contrastText" }}>
        <Typography variant="h6" gutterBottom>
          ¡Gracias por tu Tiempo!
        </Typography>
        <Typography variant="body2">
          Cada comentario que recibimos nos ayuda a hacer ConfeApp mejor. 
          Revisamos todos los comentarios y los consideramos seriamente para futuras mejoras.
        </Typography>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
