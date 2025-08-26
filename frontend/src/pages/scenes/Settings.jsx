// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Paper,
  Grid2 as Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Save,
  Delete,
  Notifications,
  ColorLens,
  SettingsBackupRestore,
} from "@mui/icons-material";
import axios from "../../api";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import { SOUND_ALERT, THEME_FAMILY } from "../../constants";

// Define a default state object that matches the backend model's fields
const defaultSettings = {
  receive_notifications: true,
  receive_forum_notifications: true,
  receive_announcement_notifications: true,
  receive_emails: true,
  // This setting is only saved in local storage, not the backend
  soundAlerts: true,
  themeFamily: "confe", // local only
};

export default function Settings() {
  useDocumentTitle("Configuración");

  // State for backend and local settings
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Fetch settings from the backend on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/notifications/settings/");

        // Local-only settings
        const localSoundAlerts = JSON.parse(localStorage.getItem(SOUND_ALERT));
        const localThemeFamily =
          localStorage.getItem(THEME_FAMILY) || defaultSettings.themeFamily;

        setSettings({
          ...response.data,
          soundAlerts:
            localSoundAlerts !== null
              ? localSoundAlerts
              : defaultSettings.soundAlerts,
          themeFamily: localThemeFamily,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError(
          "Error al cargar la configuración. Por favor, inténtelo de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle settings changes
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: checked,
    }));
  };

  // Handle theme family toggle
  const toggleThemeFamily = () => {
    setSettings((prev) => {
      const nextFamily = prev.themeFamily === "confe" ? "alt" : "confe";
      localStorage.setItem(THEME_FAMILY, nextFamily);
      return { ...prev, themeFamily: nextFamily };
    });
  };

  // Save settings to backend and local storage
  const saveSettings = async () => {
    try {
      // Separate backend settings from local-only settings
      const { soundAlerts, themeFamily, ...backendSettings } = settings;

      // Save backend settings via PATCH request
      await axios.patch("/api/notifications/settings/", backendSettings);

      // Save local-only settings
      localStorage.setItem(SOUND_ALERT, JSON.stringify(soundAlerts));
      localStorage.setItem(THEME_FAMILY, themeFamily);

      setSnackbar({
        open: true,
        message: "Configuración guardada correctamente.",
        severity: "success",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      setSnackbar({
        open: true,
        message:
          "Error al guardar la configuración. Por favor, inténtelo de nuevo.",
        severity: "error",
      });
    }
  };

  // Reset settings to default values
  const resetSettings = async () => {
    setConfirmDialog(false);
    try {
      // Send a PATCH request with default backend values
      const { soundAlerts, themeFamily, ...backendDefaults } = defaultSettings;
      await axios.patch("/api/notifications/settings/", backendDefaults);

      // Reset local-only settings
      localStorage.setItem(
        SOUND_ALERT,
        JSON.stringify(defaultSettings.soundAlerts)
      );
      localStorage.setItem(THEME_FAMILY, defaultSettings.themeFamily);

      setSettings(defaultSettings);
      setSnackbar({
        open: true,
        message: "Configuración restablecida a valores predeterminados.",
        severity: "info",
      });
    } catch (err) {
      console.error("Error resetting settings:", err);
      setSnackbar({
        open: true,
        message:
          "Error al restablecer la configuración. Por favor, inténtelo de nuevo.",
        severity: "error",
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, maxWidth: "300px" }}>
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <Notifications sx={{ mr: 1 }} /> Notificaciones
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.receive_notifications}
                  onChange={handleChange}
                  name="receive_notifications"
                />
              }
              label="Habilitar todas las notificaciones"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.receive_forum_notifications}
                  onChange={handleChange}
                  name="receive_forum_notifications"
                  disabled={!settings.receive_notifications}
                />
              }
              label="Notificaciones del foro"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.receive_announcement_notifications}
                  onChange={handleChange}
                  name="receive_announcement_notifications"
                  disabled={!settings.receive_notifications}
                />
              }
              label="Notificaciones de anuncios"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundAlerts}
                  onChange={handleChange}
                  name="soundAlerts"
                  disabled={!settings.receive_notifications}
                />
              }
              label="Alertas sonoras"
            />
          </Paper>
        </Grid>

        {/* Theme Family Settings */}
        {/* <Grid xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <ColorLens sx={{ mr: 1 }} /> Tema
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.themeFamily === "alt"}
                  onChange={toggleThemeFamily}
                />
              }
              label={
                settings.themeFamily === "alt"
                  ? "Tema Alternativo"
                  : "Tema Confe"
              }
            />
          </Paper>
        </Grid> */}
      </Grid>

      {/* Actions */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "left",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={saveSettings}
          disabled={isLoading}
        >
          Guardar configuración
        </Button>
        <Button
          variant="outlined"
          color="info"
          startIcon={<SettingsBackupRestore />}
          onClick={() => setConfirmDialog(true)}
          disabled={isLoading}
        >
          Restablecer valores predeterminados
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirmar acción</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas restablecer todas las configuraciones a
            sus valores predeterminados? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={resetSettings} color="error">
            Restablecer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
