import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description"; // Icon for survey
import UploadFileIcon from "@mui/icons-material/UploadFile"; // Icon for upload
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Icon for accordion
import { Link } from "react-router-dom"; // For navigation
import NavBar from "../../components/NavBar"; // Assuming NavBar exists at this path

function DashboardCandidato() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({ open: false, type: "success", text: "" });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      console.log("Simulating file upload:", selectedFile.name);
      // Placeholder for actual API call
      // In a real application, you would send selectedFile to your backend
      // Example: api.post('/api/upload-files/', formData);

      setUploadMessage({
        open: true,
        type: "success",
        text: `"${selectedFile.name}" subido simuladamente.`,
      });
      setSelectedFile(null); // Clear selected file after "upload"
    } else {
      setUploadMessage({
        open: true,
        type: "warning",
        text: "Por favor, selecciona un archivo primero.",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setUploadMessage({ ...uploadMessage, open: false });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: 'linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)' }}>
      <NavBar /> {/* Your navigation bar */}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto", width: "100%" }}>
        {/* Welcome Section */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center", color: "white" }}>
          ¡Bienvenido/a al Panel de Candidato!
        </Typography>

        {/* Process Explanation Section */}
        <Paper elevation={4} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
          <Accordion disableGutters sx={{ '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'primary.contrastText' }} />}
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{
                bgcolor: "primary.main", // Dark blue background for summary
                color: "primary.contrastText", // White text
                "& .MuiAccordionSummary-content": {
                  my: 2, // Vertical padding
                },
              }}
            >
              <Typography variant="h5" component="h2">
                Entiende el Proceso de Capacitación
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="subtitle1" sx={{ mb: 2}}>
                ¡Hola, candidato! En esta sección te explicamos los pasos clave de nuestro proceso de capacitación para que sepas qué esperar en cada etapa.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2}}>
                <strong>1.  Cuestionario de Preentrevista:</strong> Es el primer paso importante. Responde con sinceridad para que podamos conocerte mejor y entender tus habilidades, experiencia y necesidades.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2}}>
                <strong>2.  Revisión de Documentos:</strong> Una vez completado el cuestionario, te pediremos que subas algunos documentos necesarios. Asegúrate de que estén actualizados y sean legibles.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2}}>
                <strong>3.  Entrevistas:</strong> Si tu perfil avanza, serás contactado/a para una serie de entrevistas.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2}}>
                <strong>4.  Capacitación:</strong> Deberás acudir al centro más cercano para completar tu capacitación.
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                Te notificaremos por correo electrónico cada vez que haya una actualización en tu estado o un nuevo paso disponible en tu panel. ¡Mucha suerte!
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Cards Section */}
        <Grid container spacing={4}>
          {/* Preentrevista Survey Card */}
          <Grid item xs={12} md={12}>
            <Card
              elevation={4}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: 3,
                transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <DescriptionIcon sx={{ fontSize: 60, color: "secondary.main" }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "center", fontWeight: "bold" }}>
                  Cuestionario de Preentrevista
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
                  ¡Es tu momento de brillar! Completa este cuestionario inicial para que podamos conocerte.
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mt: "auto" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    component={Link} // Use Link component from react-router-dom
                    to="/candidato/preentrevista" // Target URL
                    sx={{ borderRadius: 2, px: 4, py: 1.5 }}
                  >
                    Iniciar Cuestionario
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* File Upload Card */}
          {/* <Grid item xs={12} md={6}>
            <Card
              elevation={4}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: 3,
                transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <UploadFileIcon sx={{ fontSize: 60, color: "info.main" }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "center", fontWeight: "bold" }}>
                  Subir Documentos Necesarios
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
                  Por favor, sube aquí tu...
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: "auto" }}>
                  <input
                    accept="application/pdf,image/*,.doc,.docx" // Example accepted file types
                    style={{ display: "none" }}
                    id="raised-button-file"
                    multiple
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="raised-button-file">
                    <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                      {selectedFile ? selectedFile.name : "Seleccionar Archivo"}
                    </Button>
                  </label>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={!selectedFile}
                    onClick={handleUploadClick}
                    sx={{ borderRadius: 2, px: 4, py: 1.5 }}
                  >
                    Simular Subida
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
      </Box>

      {/* Snackbar for upload messages */}
      <Snackbar
        open={uploadMessage.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={uploadMessage.type} sx={{ width: "100%" }}>
          {uploadMessage.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DashboardCandidato;