import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import EditIcon from "@mui/icons-material/Edit";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import api from "../../api";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const BaseCuestionarios = () => {
  useDocumentTitle("Base Cuestionarios");

  const [baseCuestionarios, setBaseCuestionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [newCuestionario, setNewCuestionario] = useState({
    nombre: "",
    etapa: "",
    responsable: "Psi",
    inicio: false,
  });
  const [editCuestionario, setEditCuestionario] = useState({
    nombre: "",
    etapa: "",
    responsable: "Psi",
    inicio: false,
  });
  const [etapas, setEtapas] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getBaseCuestionarios();
    getEtapas();
  }, []);

  const getBaseCuestionarios = () => {
    api
      .get("/api/cuestionarios/")
      .then((res) => res.data)
      .then((data) => {
        if (Array.isArray(data)) {
          setBaseCuestionarios(data);
        } else {
          console.error("La respuesta de la API no es un array:", data);
        }
      })
      .catch((err) => {
        console.error("Error buscando base de cuestionarios:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const getEtapas = () => {
    api
      .get("/api/cuestionarios/etapas-cuestionario/")
      .then((res) => res.data)
      .then((data) => {
        setEtapas(data);
      })
      .catch((err) => {
        console.error("Error buscando etapas:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredBaseCuestionarios = baseCuestionarios.filter(
    (baseCuestionario) =>
      baseCuestionario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClickOpen = () => {
    setOpen(true);
    setError("");
    // Reset form state when opening the dialog
    setNewCuestionario({
      nombre: "",
      etapa: "",
      responsable: "Psi",
      inicio: false,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setError("");
  };

  const handleClickOpenEdit = (cuestionario) => {
    // Create a new object to avoid direct state mutation
    setEditCuestionario({
      ...cuestionario,
      etapa: cuestionario.estado_desbloqueo,
      inicio: cuestionario.inicio || false,
    });
    setOpenEdit(true);
    setError("");
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setNewCuestionario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleChangeEdit = (event) => {
    const { name, value, checked, type } = event.target;
    setEditCuestionario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!newCuestionario.nombre.trim()) {
      setError("El nombre del cuestionario no puede estar vacío.");
      return;
    }

    const cuestionarioExistente = baseCuestionarios.find(
      (cuestionario) =>
        cuestionario.nombre.toLowerCase() ===
        newCuestionario.nombre.toLowerCase()
    );

    if (cuestionarioExistente) {
      setError("Ya existe un cuestionario con ese nombre.");
      return;
    }

    // Ensure we're sending the correct data structure that matches the backend expectations
    const cuestionarioData = {
      nombre: newCuestionario.nombre,
      etapa: newCuestionario.etapa,
      responsable: newCuestionario.responsable,
      inicio: newCuestionario.inicio,
    };

    console.log("Sending new questionnaire data:", cuestionarioData);

    api
      .post("/api/cuestionarios/crear-cuestionario/", cuestionarioData)
      .then((res) => {
        console.log("Creation response:", res.data);
        // Refresh the entire list to ensure we have the latest data
        return api.get("/api/cuestionarios/");
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBaseCuestionarios(res.data);
        } else {
          console.error("La respuesta de la API no es un array:", res.data);
        }
        setOpen(false);
        setError(""); // Limpiar errores al cerrar exitosamente
        setNewCuestionario({
          nombre: "",
          etapa: "",
          responsable: "Psi",
          inicio: false,
        });
      })
      .catch((err) => {
        console.error("Error creando cuestionario:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const handleSubmitEdit = () => {
    if (!editCuestionario.nombre.trim()) {
      setError("El nombre del cuestionario no puede estar vacío.");
      return;
    }

    // Verificar si existe otro cuestionario con el mismo nombre (excluyendo el actual)
    const cuestionarioExistente = baseCuestionarios.find(
      (cuestionario) =>
        cuestionario.id !== editCuestionario.id &&
        cuestionario.nombre.toLowerCase() ===
          editCuestionario.nombre.toLowerCase()
    );

    if (cuestionarioExistente) {
      setError("Ya existe otro cuestionario con ese nombre.");
      return;
    }

    const datosActualizados = {
      ...editCuestionario,
      estado_desbloqueo: editCuestionario.etapa,
      responsable: editCuestionario.responsable,
      inicio: editCuestionario.inicio,
    };

    api
      .put(
        `/api/cuestionarios/editar/${editCuestionario.id}/`,
        datosActualizados
      )
      .then((res) => {
        // Usar los datos que regresa el backend (que incluyen el nombre normalizado)
        const cuestionarioActualizado = res.data;

        // Update the state with the data from the backend response
        const updatedCuestionarios = baseCuestionarios.map((cuestionario) =>
          cuestionario.id === editCuestionario.id
            ? {
                ...cuestionario,
                nombre: cuestionarioActualizado.nombre, // Usar el nombre normalizado del backend
                estado_desbloqueo: cuestionarioActualizado.estado_desbloqueo,
                responsable: cuestionarioActualizado.responsable,
                inicio: cuestionarioActualizado.inicio,
              }
            : cuestionario
        );

        setBaseCuestionarios(updatedCuestionarios);
        setOpenEdit(false);
        setError(""); // Limpiar errores al cerrar exitosamente
      })
      .catch((err) => {
        console.error("Error editando cuestionario:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const handleNavigate = (baseCuestionario) => {
    navigate(`/baseCuestionarios/${baseCuestionario.id}`, {
      state: { baseCuestionario },
    });
  };

  const getResponsableName = (responsable) => {
    switch (responsable) {
      case "PCD":
        return "PCD";
      case "Psi":
        return "Psicólogo";
      default:
        return responsable;
    }
  };

  const groupedCuestionarios = filteredBaseCuestionarios.reduce(
    (acc, cuestionario) => {
      const key = `${cuestionario.responsable}-${cuestionario.estado_desbloqueo}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(cuestionario);
      return acc;
    },
    {}
  );

  return (
    <Box
      sx={{
        padding: 2,
        border: "1px solid #ddd",
        borderRadius: 2,
        margin: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <TextField
          label="Buscar cuestionarios..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: "70%" }}
        />
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FaPlus />}
          onClick={handleClickOpen}
        >
          Crear Cuestionario
        </Button>
      </Box>
      <Box>
        {Object.keys(groupedCuestionarios).length > 0 ? (
          Object.keys(groupedCuestionarios).map((key) => (
            <Box key={key}>
              <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1 }}>
                {getResponsableName(key.split("-")[0])} - {key.split("-")[1]}
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />
              <List>
                {groupedCuestionarios[key].map((baseCuestionario) => (
                  <ListItem
                    key={baseCuestionario.id}
                    button={true}
                    onClick={() => handleNavigate(baseCuestionario)}
                    sx={{
                      border: "1px solid #ddd",
                      borderRadius: 2,
                      marginBottom: 1,
                      "&:hover": {
                        borderColor: "#aaa",
                      },
                    }}
                  >
                    <ListItemText
                      primary={baseCuestionario.nombre}
                      secondary={`Responsable: ${getResponsableName(
                        baseCuestionario.responsable
                      )} - Estado: ${
                        baseCuestionario.estado_desbloqueo || "No definido"
                      }`}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClickOpenEdit(baseCuestionario);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))
        ) : (
          <Typography variant="body1">No existen cuestionarios.</Typography>
        )}
      </Box>

      {/* Diálogo para crear un nuevo cuestionario */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Nuevo Cuestionario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nombre"
            label="Nombre de Cuestionario"
            type="text"
            fullWidth
            variant="outlined"
            value={newCuestionario.nombre}
            onChange={handleChange}
            error={!!error}
            helperText={error}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Etapa de Cuestionario</InputLabel>
            <Select
              name="etapa"
              value={newCuestionario?.etapa || ""}
              onChange={handleChange}
              label="Etapa de Cuestionario"
            >
              {etapas.map((etapa) => (
                <MenuItem key={etapa.value} value={etapa.value}>
                  {etapa.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Responsable</InputLabel>
            <Select
              name="responsable"
              value={newCuestionario.responsable}
              onChange={handleChange}
              label="Responsable"
            >
              <MenuItem value="PCD">Persona con Discapacidad</MenuItem>
              <MenuItem value="Psi">Psicólogo</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                name="inicio"
                checked={newCuestionario.inicio}
                onChange={handleChange}
              />
            }
            label="Es para el inicio"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar un cuestionario */}
      <Dialog open={openEdit} onClose={handleCloseEdit}>
        <DialogTitle>Editar Cuestionario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nombre"
            label="Nombre de Cuestionario"
            type="text"
            fullWidth
            variant="outlined"
            value={editCuestionario?.nombre || ""}
            onChange={handleChangeEdit}
            error={!!error}
            helperText={error}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Etapa de Cuestionario</InputLabel>
            <Select
              name="etapa"
              value={editCuestionario?.etapa || ""}
              onChange={handleChangeEdit}
              label="Etapa de Cuestionario"
            >
              {etapas.map((etapa) => (
                <MenuItem key={etapa.value} value={etapa.value}>
                  {etapa.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Responsable</InputLabel>
            <Select
              name="responsable"
              value={editCuestionario?.responsable || "Psi"}
              onChange={handleChangeEdit}
              label="Responsable"
            >
              <MenuItem value="PCD">Persona con Discapacidad</MenuItem>
              <MenuItem value="Psi">Psicólogo</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                name="inicio"
                checked={editCuestionario?.inicio || false}
                onChange={handleChangeEdit}
              />
            }
            label="Es para el inicio"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmitEdit} color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseCuestionarios;
