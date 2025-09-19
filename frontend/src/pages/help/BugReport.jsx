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
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  Grid,
  Divider,
} from "@mui/material";
import {
  BugReport as BugReportIcon,
  Send,
  Info,
  Warning,
  Error,
  CheckCircle,
} from "@mui/icons-material";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function BugReport() {
  useDocumentTitle("Reportar Error");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    steps: "",
    expectedBehavior: "",
    actualBehavior: "",
    severity: "",
    browser: "",
    operatingSystem: "",
    url: "",
    screenshots: false,
    contactEmail: "",
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

  const handleCheckboxChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.checked,
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "low":
        return <Info color="info" />;
      case "medium":
        return <Warning color="warning" />;
      case "high":
        return <Error color="error" />;
      case "critical":
        return <Error color="error" />;
      default:
        return <Info color="info" />;
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
        message: "Error reportado exitosamente. Te contactaremos pronto.",
        severity: "success",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        steps: "",
        expectedBehavior: "",
        actualBehavior: "",
        severity: "",
        browser: "",
        operatingSystem: "",
        url: "",
        screenshots: false,
        contactEmail: "",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al enviar el reporte. Inténtalo de nuevo.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityOptions = [
    { value: "low", label: "Bajo - Funcionalidad menor afectada" },
    { value: "medium", label: "Medio - Funcionalidad importante afectada" },
    { value: "high", label: "Alto - Funcionalidad crítica afectada" },
    { value: "critical", label: "Crítico - Aplicación no funciona" },
  ];

  return (
    <Box sx={{ width: "100%", p: 3, maxWidth: "800px", mx: "auto" }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Reportar Error
      </Typography>

      {/* Instructions */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BugReportIcon color="primary" />
          Información Importante
        </Typography>
        <Typography variant="body2" paragraph>
          Para ayudarnos a resolver el problema más rápidamente, por favor proporciona
          la mayor cantidad de detalles posible. La información que nos proporciones
          nos ayudará a reproducir y solucionar el error.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Si puedes tomar una captura de pantalla del error,
            será de gran ayuda para nuestro equipo de desarrollo.
          </Typography>
        </Alert>
      </Paper>

      {/* Form */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título del Error"
                value={formData.title}
                onChange={handleChange("title")}
                required
                placeholder="Describe brevemente el error"
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
                placeholder="Describe el error en detalle. ¿Qué estaba haciendo cuando ocurrió?"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severidad</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={handleChange("severity")}
                  label="Severidad"
                >
                  {severityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {getSeverityIcon(option.value)}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL donde ocurrió el error"
                value={formData.url}
                onChange={handleChange("url")}
                placeholder="https://confeapp.com/..."
              />
            </Grid>

            {/* Steps to Reproduce */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pasos para Reproducir
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Pasos para Reproducir el Error"
                value={formData.steps}
                onChange={handleChange("steps")}
                required
                placeholder="1. Ir a la página de candidatos&#10;2. Hacer clic en 'Crear Nuevo'&#10;3. Llenar el formulario&#10;4. Hacer clic en 'Guardar'"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comportamiento Esperado"
                value={formData.expectedBehavior}
                onChange={handleChange("expectedBehavior")}
                placeholder="¿Qué debería haber pasado?"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comportamiento Actual"
                value={formData.actualBehavior}
                onChange={handleChange("actualBehavior")}
                placeholder="¿Qué pasó realmente?"
              />
            </Grid>

            {/* Technical Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información Técnica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Navegador"
                value={formData.browser}
                onChange={handleChange("browser")}
                placeholder="Chrome 120, Firefox 119, Safari 17, etc."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sistema Operativo"
                value={formData.operatingSystem}
                onChange={handleChange("operatingSystem")}
                placeholder="Windows 11, macOS 14, Ubuntu 22.04, etc."
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Información de Contacto
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email de Contacto (Opcional)"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange("contactEmail")}
                placeholder="tu@email.com"
                helperText="Si proporcionas tu email, te notificaremos cuando el error sea solucionado."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.screenshots}
                    onChange={handleCheckboxChange("screenshots")}
                  />
                }
                label="Tengo capturas de pantalla del error que puedo enviar"
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
                  {isSubmitting ? "Enviando..." : "Enviar Reporte"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
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
