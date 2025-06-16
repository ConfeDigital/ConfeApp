// src/pages/Settings.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Grid,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Save,
  Delete,
  Notifications,
  Security,
  Language,
  ColorLens,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";

export default function Settings() {
  useDocumentTitle("Configuración");

  // State for settings
  const [settings, setSettings] = useState({
    // General
    language: "es",
    darkMode: false,
    notifications: true,

    // Security
    twoFactorAuth: false,
    changePassword: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",

    // Privacy
    dataSharing: true,
    analytics: true,

    // Appearance
    fontSize: "medium",
    colorTheme: "default",

    // Notification settings
    emailNotifications: true,
    soundAlerts: false,
  });

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Handle settings changes
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings({
      ...settings,
      [name]: event.target.type === "checkbox" ? checked : value,
    });
  };

  // Save settings
  const saveSettings = () => {
    // Here you would typically save to localStorage, context, or make an API call
    localStorage.setItem("appSettings", JSON.stringify(settings));
    setSnackbar({
      open: true,
      message: "Configuración guardada correctamente",
      severity: "success",
    });
  };

  // Reset settings
  const resetSettings = () => {
    setConfirmDialog(false);
    // Reset to default values
    const defaultSettings = {
      language: "es",
      darkMode: false,
      notifications: true,
      twoFactorAuth: false,
      changePassword: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      dataSharing: true,
      analytics: true,
      fontSize: "medium",
      colorTheme: "default",
      emailNotifications: true,
      soundAlerts: false,
    };
    setSettings(defaultSettings);
    localStorage.setItem("appSettings", JSON.stringify(defaultSettings));
    setSnackbar({
      open: true,
      message: "Configuración restablecida a valores predeterminados",
      severity: "info",
    });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Typography>
        Esta página todavía no sirve, lo que estaba en configuración ahora esta
        en configuración del centro, en el menú del usuario
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <Language sx={{ mr: 1 }} /> General
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Idioma
              </Typography>
              <Select
                fullWidth
                name="language"
                value={settings.language}
                onChange={handleChange}
              >
                <MenuItem value="es">Español</MenuItem>
                {/* <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem> */}
              </Select>
            </Box>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
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
                  checked={settings.notifications}
                  onChange={handleChange}
                  name="notifications"
                />
              }
              label="Habilitar notificaciones"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  name="emailNotifications"
                />
              }
              label="Notificaciones por correo electrónico"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundAlerts}
                  onChange={handleChange}
                  name="soundAlerts"
                />
              }
              label="Alertas sonoras"
            />
          </Paper>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: "flex", alignItems: "center", mb: 2 }}
            >
              <ColorLens sx={{ mr: 1 }} /> Apariencia
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tamaño de fuente
              </Typography>
              <Select
                fullWidth
                name="fontSize"
                value={settings.fontSize}
                onChange={handleChange}
              >
                {/* <MenuItem value="small">Pequeño</MenuItem> */}
                <MenuItem value="medium">Mediano</MenuItem>
                {/* <MenuItem value="large">Grande</MenuItem> */}
              </Select>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tema de color
              </Typography>
              <Select
                fullWidth
                name="colorTheme"
                value={settings.colorTheme}
                onChange={handleChange}
              >
                <MenuItem value="default">Predeterminado</MenuItem>
                {/* <MenuItem value="blue">Azul</MenuItem>
                <MenuItem value="green">Verde</MenuItem>
                <MenuItem value="purple">Púrpura</MenuItem> */}
              </Select>
            </Box>
          </Paper>
        </Grid>

        {/* Security Settings */}
        {/* <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1 }} /> Seguridad y Privacidad
            </Typography>
            <Divider sx={{ mb: 2 }} />
          
            <FormControlLabel
              control={
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={handleChange}
                  name="twoFactorAuth"
                />
              }
              label="Autenticación de dos factores"
            />
          
            <FormControlLabel
              control={
                <Switch
                  checked={settings.changePassword}
                  onChange={handleChange}
                  name="changePassword"
                />
              }
              label="Cambiar contraseña"
            />
          
            {settings.changePassword && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  name="currentPassword"
                  label="Contraseña actual"
                  type={showPassword ? "text" : "password"}
                  value={settings.currentPassword}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  name="newPassword"
                  label="Nueva contraseña"
                  type={showPassword ? "text" : "password"}
                  value={settings.newPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  name="confirmPassword"
                  label="Confirmar nueva contraseña"
                  type={showPassword ? "text" : "password"}
                  value={settings.confirmPassword}
                  onChange={handleChange}
                />
              </Box>
            )}
          
            <Divider sx={{ my: 2 }} />
          
            <Typography variant="subtitle1" gutterBottom>Privacidad</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataSharing}
                  onChange={handleChange}
                  name="dataSharing"
                />
              }
              label="Compartir datos de uso"
            />
          
            <FormControlLabel
              control={
                <Switch
                  checked={settings.analytics}
                  onChange={handleChange}
                  name="analytics"
                />
              }
              label="Permitir analíticas"
            />
          </Paper>
        </Grid> */}
      </Grid>

      {/* Actions */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={saveSettings}
        >
          Guardar configuración
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => setConfirmDialog(true)}
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
