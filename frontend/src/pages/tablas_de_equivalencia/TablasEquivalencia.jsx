import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
  Snackbar,
  Alert,
} from "@mui/material";
import api from "../../api";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const TablasEquivalencia = () => {
  useDocumentTitle('Tablas de Equivalencia');
  
  const [tablas, setTablas] = useState([]);
  const [baseCuestionarios, setBaseCuestionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [newTabla, setNewTabla] = useState({ base_cuestionario_id: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getTablas();
    getBaseCuestionarios();
  }, []);

  const getTablas = () => {
    api
      .get("/api/tablas-de-equivalencia/percentiles/")
      .then((res) => setTablas(res.data))
      .catch((err) => console.error("Error al obtener tablas:", err));
  };

  const getBaseCuestionarios = () => {
    api
      .get("/api/cuestionarios/")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBaseCuestionarios(res.data);
        } else {
          console.error("La API no retornó un array válido:", res.data);
        }
      })
      .catch((err) =>
        console.error("Error al obtener Base Cuestionarios:", err)
      );
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (event) => {
    setNewTabla({ ...newTabla, [event.target.name]: event.target.value });
  };

  const handleSubmit = () => {
    const exists = tablas.some(
      (tabla) => tabla.base_cuestionario_id === newTabla.base_cuestionario_id
    );

    if (exists) {
      setErrorMessage("Ya existe una tabla con este Base Cuestionario.");
      setOpenSnackbar(true);
      return;
    }

    api
      .post("/api/tablas-de-equivalencia/percentiles/", newTabla)
      .then(() => {
        getTablas();
        handleClose();
      })
      .catch((err) => {
        console.error("Error al crear tabla:", err);
        setErrorMessage("Error!!! Ya existe una tabla con este nombre!");
        setOpenSnackbar(true);
      });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <TextField
          label="Buscar tablas..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "70%" }}
        />
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FaPlus />}
          onClick={handleOpen}
        >
          Crear Tabla
        </Button>
      </Box>

      <Box>
        {tablas.length > 0 ? (
          <List>
            {tablas
              .filter((tabla) =>
                tabla.base_cuestionario
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((tabla) => (
                <ListItem
                  key={tabla.id}
                  onClick={() =>
                    navigate(`/tablas-de-equivalencia/${tabla.id}`)
                  }
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    marginBottom: 1,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <ListItemText primary={tabla.base_cuestionario} />
                </ListItem>
              ))}
          </List>
        ) : (
          <Typography variant="body1">No hay tablas registradas.</Typography>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Nueva Tabla de Equivalencia</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Base Cuestionario</InputLabel>
            <Select
              name="base_cuestionario_id"
              value={newTabla.base_cuestionario_id}
              onChange={handleChange}
            >
              {baseCuestionarios.map((cuestionario) => (
                <MenuItem key={cuestionario.id} value={cuestionario.id}>
                  {cuestionario.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TablasEquivalencia;
