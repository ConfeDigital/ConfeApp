import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Card,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import api from "../../api";
import CargaMasivaCuestionario from "../cuestionarios/CargaMasivaCuestionario";
import CargaMasivaPuntuaciones from "./CargaMasivaPuntuaciones";
import CargaMasivaIndiceApoyo from "./CargaMasivaIndiceApoyo";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const TablaDetalle = () => {
  useDocumentTitle('Detalles de la Tabla');

  const { id } = useParams();
  const navigate = useNavigate();

  const [tabla, setTabla] = useState(null);
  const [cuestionarios, setCuestionarios] = useState([]);
  const [cuestionarioSeleccionado, setCuestionarioSeleccionado] = useState(null);
  const [seccionesCuestionario, setSeccionesCuestionario] = useState([]);
  const [seccionesPercentiles, setSeccionesPercentiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [newSeccion, setNewSeccion] = useState({
    nombre_seccion: "",
    grupo: "todos",
    version_cuestionario: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [openCargaMasiva, setOpenCargaMasiva] = useState(false);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);
  const [openIndiceApoyo, setOpenIndiceApoyo] = useState(false);

  useEffect(() => {
    obtenerTabla();
  }, [id]);

  const obtenerTabla = () => {
    api
      .get(`/api/tablas-de-equivalencia/percentiles/${id}/`)
      .then((res) => {
        setTabla(res.data);
        obtenerCuestionarios(res.data.base_cuestionario);
        setSeccionesPercentiles(res.data.secciones_percentiles);
      })
      .catch((err) => console.error("Error al obtener la tabla:", err));
  };

  const obtenerCuestionarios = (baseCuestionarioNombre) => {
    api
      .get(`/api/cuestionarios/`)
      .then((res) => {
        const cuestionariosFiltrados = res.data
          .filter((base) => base.nombre === baseCuestionarioNombre)
          .flatMap((base) => base.cuestionarios);

        setCuestionarios(cuestionariosFiltrados);

        const cuestionarioActivo = cuestionariosFiltrados.find((c) => c.activo);
        if (cuestionarioActivo) {
          setCuestionarioSeleccionado(cuestionarioActivo);
          setSeccionesCuestionario(extraerSecciones(cuestionarioActivo));
          setNewSeccion((prev) => ({
            ...prev,
            version_cuestionario: cuestionarioActivo.version,
          }));
        }
      })
      .catch((err) => console.error("Error al obtener cuestionarios:", err));
  };

  const extraerSecciones = (cuestionario) => {
    const seccionesUnicas = [
      ...new Set(
        cuestionario.preguntas.map((pregunta) => pregunta.nombre_seccion)
      ),
    ];
    return seccionesUnicas.map((seccion) => ({
      nombre: seccion,
      version: cuestionario.version,
    }));
  };

  const handleCuestionarioChange = (event) => {
    const cuestionarioId = event.target.value;
    const cuestionarioSeleccionado = cuestionarios.find(
      (c) => c.id === cuestionarioId
    );

    if (cuestionarioSeleccionado) {
      setCuestionarioSeleccionado(cuestionarioSeleccionado);
      setSeccionesCuestionario(extraerSecciones(cuestionarioSeleccionado));
      setNewSeccion((prev) => ({
        ...prev,
        version_cuestionario: cuestionarioSeleccionado.version,
      }));
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (event) => {
    setNewSeccion({ ...newSeccion, [event.target.name]: event.target.value });
  };

  const handleSubmit = () => {
    const existeSeccion = seccionesPercentiles.some(
      (s) =>
        s.nombre_seccion === newSeccion.nombre_seccion &&
        s.version_cuestionario === newSeccion.version_cuestionario
    );

    if (existeSeccion) {
      setErrorMessage("Esta sección ya existe en la tabla de equivalencia.");
      setOpenSnackbar(true);
      return;
    }

    api
      .post(`/api/tablas-de-equivalencia/percentiles/${id}/secciones/`, {
        ...newSeccion,
        percentiles_cuestionario: id,
      })
      .then(() => {
        obtenerTabla();
        handleClose();
      })
      .catch((err) => {
        console.error("Error al crear sección:", err);
        setErrorMessage(
          err.response?.data?.error ||
            "No se pudo crear la sección. Verifica los datos."
        );
        setOpenSnackbar(true);
      });
  };

  const handleSeccionClick = (seccion) => {
    if (!seccion.id) return;
    setSeccionSeleccionada(seccion);
    setOpenCargaMasiva(true);
  };

  return (
    <Box sx={{ padding: 3, minHeight: "100vh" }}>
      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/tablas-de-equivalencia")}
        sx={{ marginBottom: 2 }}
      >
        Regresar
      </Button>

      <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: 3 }}>
        {tabla?.base_cuestionario} - Tabla de Equivalencia (ID: {id})
      </Typography>

      <FormControl fullWidth margin="dense">
        <InputLabel>Selecciona la versión del cuestionario</InputLabel>
        <Select
          value={cuestionarioSeleccionado?.id || ""}
          onChange={handleCuestionarioChange}
          label='Selecciona la versión del cuestionario'
        >
          {cuestionarios.map((cuestionario) => (
            <MenuItem key={cuestionario.id} value={cuestionario.id}>
              {cuestionario.nombre} - Versión {cuestionario.version}{" "}
              {cuestionario.activo && "(Activo)"}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddCircleOutlineIcon />}
        onClick={handleOpen}
        sx={{ marginTop: 2 }}
      >
        Agregar Sección de Percentiles
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() => {
          const nombreSeccionTotal = `Total - ${cuestionarioSeleccionado.nombre} v${cuestionarioSeleccionado.version}`;

          const yaExiste = seccionesPercentiles.some(
            (s) =>
              s.nombre_seccion === nombreSeccionTotal &&
              s.version_cuestionario === cuestionarioSeleccionado.version
          );

          if (yaExiste) {
            setErrorMessage("Ya existe una sección Total para este cuestionario.");
            setOpenSnackbar(true);
            return;
          }

          api
            .post(`/api/tablas-de-equivalencia/percentiles/${id}/secciones/`, {
              nombre_seccion: nombreSeccionTotal,
              grupo: "total",
              version_cuestionario: cuestionarioSeleccionado.version,
              percentiles_cuestionario: id,
            })
            .then(() => obtenerTabla())
            .catch((err) => {
              console.error("Error al crear sección Total:", err);
              setErrorMessage("No se pudo crear la sección Total.");
              setOpenSnackbar(true);
            });
        }}
        sx={{ marginTop: 2, marginLeft: 2 }}
      >
        Crear sección de Total
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={() => setOpenIndiceApoyo(true)}
        sx={{ marginTop: 2, marginLeft: 2 }}
      >
        Gestionar Índice de Apoyo
      </Button>

      <Box sx={{ marginTop: 3 }}>
        {seccionesPercentiles.length > 0 ? (
          <Box>
            {seccionesPercentiles.map((seccion, index) => (
              <Card
                key={index}
                sx={{
                  marginBottom: 2,
                  boxShadow: 3,
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#f0f0f0" },
                }}
                onClick={() => handleSeccionClick(seccion)}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {seccion.nombre_seccion} | Versión: {seccion.version_cuestionario}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Grupo: {seccion.grupo}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography variant="body1">No hay secciones registradas.</Typography>
        )}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Nueva Sección de Percentiles</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Sección del Cuestionario</InputLabel>
            <Select
              name="nombre_seccion"
              value={newSeccion.nombre_seccion}
              onChange={handleChange}
              label='Sección de Cuestionario'
            >
              {seccionesCuestionario.map((seccion) => (
                <MenuItem key={seccion.nombre} value={seccion.nombre}>
                  {seccion.nombre} | Versión: {seccion.version}
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

      <Dialog
        open={openCargaMasiva}
        onClose={() => setOpenCargaMasiva(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Gestión de Puntuaciones</DialogTitle>
        <DialogContent>
          {seccionSeleccionada && (
            <>
              <Typography variant="h6">
                Sección: {seccionSeleccionada.nombre_seccion} | Versión:{" "}
                {seccionSeleccionada.version_cuestionario}
              </Typography>

              <CargaMasivaPuntuaciones
                open={openCargaMasiva}
                onClose={() => setOpenCargaMasiva(false)}
                seccionId={seccionSeleccionada.id}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCargaMasiva(false)} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openIndiceApoyo}
        onClose={() => setOpenIndiceApoyo(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Índice de Necesidades de Apoyo</DialogTitle>
        <DialogContent>
          <CargaMasivaIndiceApoyo cuestionarioId={id} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIndiceApoyo(false)} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TablaDetalle;
