// src/pages/Profile.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  Grid,
  Chip,
  useTheme
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useSelector, useDispatch } from "react-redux";
import axios from "../../api";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import { tokens } from "../../theme";
// import your auth actions, e.g.:
import { setUser } from "../../features/auth/authSlice";
import { AUTH_TYPE } from "../../constants"
import { translateGroupName } from "../../components/settings/groupsUtils";

function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name, size, fontsize) {
  const [first, last] = name.split(" ");
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: size,
      height: size,
      fontSize: fontsize,
      mr: 2,
      fontWeight: 500
    },
    children: `${first?.[0] || ""}${last?.[0] || ""}`,
  };
}

export default function Profile() {
  useDocumentTitle("Mi Perfil");
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { user, isLoading, error } = useSelector((state) => state.auth);
  const authType = sessionStorage.getItem(AUTH_TYPE);

  // dialog & form state
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  // prefill form when user loads or opens dialog
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
  }, [user]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
    };

    try {
      const { data } = await axios.put("/api/auth/users/me/", payload);
      dispatch(setUser(data));
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error guardando perfil");
    }
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box flex={1} p={4}>
      {/* Profile Header */}
      <Box
        display="flex"
        alignItems="center"
        p={3}
        boxShadow={2}
        borderRadius={2}
        mb={4}
      >
        <Avatar
          {...stringAvatar(
            `${user.first_name} ${user.last_name}`,
            80,
            "3rem"
          )}
        />
        <Box flex={1}>
          <Typography variant="h5">
            {user.first_name} {user.last_name}
          </Typography>
          <Typography color="textSecondary">{user.email}</Typography>
          <Typography color="textSecondary">
            {user.is_staff ? "Administrador" : "Usuario"}
          </Typography>
        </Box>
        {(authType === "djoser") &&(
          <IconButton color='primary' onClick={handleOpen}>
            <EditIcon />
          </IconButton>
        )}
      </Box>

      <Box p={3} boxShadow={2} borderRadius={2} mb={2}>
        <Typography variant="h4">
          Centro / Institución
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h5">
          {user.center?.name} 
        </Typography>
        <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Dirección</Typography>
        <Typography color="textSecondary">
          {user.center?.location_details
            ? `${user.center?.location_details.address_road} ${user.center?.location_details.address_number}, ${user.center?.location_details.address_municip}, ${user.center?.location_details.address_city}`
            : 'N/A'}
        </Typography>
        </Box>
      </Box>

      {/* Personal Information */}
      <Box p={3} boxShadow={2} borderRadius={2}>
        <Typography variant="h4" gutterBottom>
          Información Personal
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Nombre</Typography>
            <Typography>{user.first_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Apellidos</Typography>
            <Typography>{user.last_name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Correo Electrónico</Typography>
            <Typography>{user.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Grupos</Typography>
            {user.groups && user.groups.length > 0 ? (
              user.groups.map((group) => (
                <Chip
                  key={group.id}
                  label={translateGroupName(group.name)}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))
            ) : (
              <Typography>Sin grupos asignados</Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Editar Mi Perfil</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre"
              name="first_name"
              size="small"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Apellidos"
              name="last_name"
              size="small"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              name="email"
              size="small"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              disabled
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}