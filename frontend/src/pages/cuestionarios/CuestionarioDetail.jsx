import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate, useParams } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Fab,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  FaPencilAlt,
  FaDownload,
  FaPlus,
  FaFileExcel,
  FaEllipsisV,
} from "react-icons/fa";
import api from "../../api";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const CuestionarioDetail = () => {
  const { id: baseCuestionarioId } = useParams();
  useDocumentTitle("Detalles del Cuestionario");

  const location = useLocation();
  const [baseCuestionario, setBaseCuestionario] = useState(
    location.state?.baseCuestionario || null
  );
  const [cuestionarios, setCuestionarios] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Always fetch the data when the component mounts or baseCuestionarioId changes
    api
      .get(`/api/cuestionarios/base/${baseCuestionarioId}/`)
      .then((res) => {
        console.log("Fetched questionnaire data:", res.data);
        setBaseCuestionario(res.data);
        setCuestionarios(res.data.cuestionarios || []);
      })
      .catch((err) => {
        console.error("Error al cargar el baseCuestionario:", err);
      });
  }, [baseCuestionarioId]); // Only depend on baseCuestionarioId

  if (!baseCuestionario) {
    return <Typography>Cargando cuestionario...</Typography>;
  }

  const handleVersionClick = (version) => {
    api
      .get(`/api/cuestionarios/${version.id}/preguntas/`)
      .then((response) => {
        setSelectedVersion({ ...version, preguntas: response.data });
        setError(""); // Reset error message when opening the dialog
      })
      .catch((error) => {
        console.error("Error al obtener las preguntas:", error);
        setError("Error al obtener las preguntas del cuestionario.");
      });
  };

  const handleClose = () => {
    setSelectedVersion(null);
    setError(""); // Reset error message when closing the dialog
    setFile(null); // Reset file state
    setFileInfo(""); // Reset file info state
  };

  const handleDownload = (versionId) => {
    // Lógica para descargar el Excel
    console.log(`Descargar Excel para la versión ${versionId}`);
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    setFileInfo(
      uploadedFile ? `${uploadedFile.name} (${uploadedFile.size} bytes)` : ""
    );
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadTemplate = () => {
    api
      .get("/api/cuestionarios/descargar-plantilla/", {
        responseType: "blob", // Importante para manejar archivos binarios
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "plantilla_de_carga_CUESTIONARIOS.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => {
        console.error("Error al descargar la plantilla:", error);
        setSnackbarMessage("Error al descargar la plantilla");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });

    handleMenuClose();
  };

  const handleLoadCuestionario = () => {
    if (!file) {
      setError("Por favor, selecciona un archivo Excel.");
      return;
    }

    if (selectedVersion.preguntas.length > 0) {
      setError(
        "Ya existen preguntas. Debe crear una nueva versión para cargar el cuestionario."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Validar columnas del archivo
    api
      .post("/api/cuestionarios/validar-columnas-excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((validacionResponse) => {
        if (validacionResponse.data.status === "success") {
          // Subir archivo si la validación es exitosa
          formData.append("cuestionario_id", selectedVersion.id);
          return api.post("/api/cuestionarios/upload_excel/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          throw new Error(validacionResponse.data.message);
        }
      })
      .then((uploadResponse) => {
        setSnackbarMessage("Cuestionario cargado exitosamente");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        // Actualizar selectedVersion con las nuevas preguntas
        handleVersionClick(selectedVersion);
      })
      .catch((error) => {
        setSnackbarMessage(error.message || "Error al cargar el cuestionario");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        console.error("Error al cargar el cuestionario:", error);
      });
  };

  const handleToggleActive = (id) => {
    api
      .post(`/api/cuestionarios/crear-cuestionario/${id}/activar/`)
      .then((res) => {
        setCuestionarios((prevCuestionarios) =>
          prevCuestionarios.map((cuestionario) =>
            cuestionario.id === id
              ? { ...cuestionario, activo: true }
              : { ...cuestionario, activo: false }
          )
        );
      })
      .catch((err) => {
        console.error("Error activando cuestionario:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const handleCreateNewVersion = () => {
    const currentCuestionario = cuestionarios[0]; // Assuming the first cuestionario is the current one
    console.log("Creating new version from:", currentCuestionario);

    api
      .post(
        `/api/cuestionarios/crear-cuestionario/${currentCuestionario.id}/nueva-version/`
      )
      .then((res) => {
        console.log("New version created:", res.data);
        // The new version is in res.data, we can navigate directly to it
        const newVersionId = res.data.id;
        console.log("Navigating to new version:", newVersionId);
        navigate(`/baseCuestionarios/${baseCuestionarioId}/${newVersionId}`);

        // Then refresh the list
        return api.get(`/api/cuestionarios/base/${baseCuestionarioId}/`);
      })
      .then((res) => {
        console.log("Updated questionnaire data:", res.data);
        setBaseCuestionario(res.data);
        setCuestionarios(res.data.cuestionarios || []);
      })
      .catch((err) => {
        console.error("Error creando nueva versión:", err);
        alert(
          `Error: ${err.response?.status} - ${
            err.response?.data?.message || err.message
          }`
        );
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter both the base questionnaire list and the selected version's questions
  const filteredCuestionarios = cuestionarios.filter((cuestionario) =>
    `Versión ${cuestionario.version}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredPreguntas = selectedVersion
    ? selectedVersion.preguntas.filter((pregunta) =>
        pregunta.texto.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Box
      sx={{
        padding: 2,
        border: "1px solid #ddd",
        borderRadius: 2,
        position: "relative",
        margin: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        {baseCuestionario.nombre}
      </Typography>
      <Button component={Link} to="/baseCuestionarios" color="primary">
        Regresar a Base de Cuestionarios
      </Button>
      <Box sx={{ marginTop: 2, maxHeight: 300, overflowY: "auto" }}>
        <TextField
          label="Buscar versión..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          size="small"
          fullWidth
          sx={{ marginBottom: 2 }}
        />
        {filteredCuestionarios && filteredCuestionarios.length > 0 ? (
          <List>
            {filteredCuestionarios.map((cuestionario) => (
              <ListItem
                key={cuestionario.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  marginBottom: 2,
                  padding: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={cuestionario.activo}
                      onChange={() => handleToggleActive(cuestionario.id)}
                    />
                  }
                  label="Activar"
                  labelPlacement="top"
                />
                <ListItemText
                  primary={`Versión ${cuestionario.version}`}
                  secondary={`Fecha de creación: ${new Date(
                    cuestionario.fecha_creacion
                  ).toLocaleDateString()}`}
                />
                <Box>
                  <IconButton
                    color="primary"
                    component={Link}
                    to={`/baseCuestionarios/${baseCuestionarioId}/${cuestionario.id}`}
                  >
                    <FaPencilAlt />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No hay cuestionarios disponibles.</Typography>
        )}
      </Box>

      {selectedVersion && (
        <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Detalles del Cuestionario</DialogTitle>
          <DialogContent>
            <Typography variant="h6">
              Versión {selectedVersion.version}
            </Typography>
            <Typography>
              Cantidad de preguntas: {selectedVersion.preguntas.length}
            </Typography>
            <Typography>
              Fecha de creación:{" "}
              {new Date(selectedVersion.fecha_creacion).toLocaleDateString()}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", marginTop: 2 }}>
              <Box>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="upload-excel"
                />
                <label htmlFor="upload-excel">
                  <Button
                    variant="contained"
                    color="primary"
                    component="span"
                    startIcon={<FaFileExcel />}
                  >
                    Cargar Cuestionario
                  </Button>
                </label>
                {fileInfo && (
                  <Typography variant="body2" sx={{ marginTop: 1 }}>
                    {fileInfo}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLoadCuestionario}
                  sx={{ marginLeft: 1 }}
                >
                  Enviar
                </Button>
              </Box>
              <IconButton
                color="primary"
                onClick={handleMenuClick}
                sx={{ marginLeft: 1 }}
              >
                <FaEllipsisV />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleDownloadTemplate}>
                  Descargar Plantilla de Carga
                </MenuItem>
              </Menu>
            </Box>
            <Box sx={{ maxHeight: 300, overflowY: "auto", marginTop: 2 }}>
              <TableContainer component={Paper}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Pregunta
                        <IconButton
                          onClick={() => setShowSearch(!showSearch)}
                          sx={{ marginLeft: 1 }}
                        >
                          <FaChevronDown />
                        </IconButton>
                        {showSearch && (
                          <Box sx={{ marginTop: 1 }}>
                            <TextField
                              label="Buscar..."
                              variant="outlined"
                              value={searchTerm}
                              onChange={handleSearch}
                              size="small"
                              fullWidth
                            />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>Tipo de Pregunta</TableCell>
                      <TableCell>Opciones</TableCell>
                      <TableCell>Pregunta que Desbloquea</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPreguntas.map((pregunta) => (
                      <TableRow key={pregunta.id}>
                        <TableCell>{pregunta.texto}</TableCell>
                        <TableCell>{pregunta.tipo}</TableCell>
                        <TableCell>
                          {pregunta.opciones.map((opcion) => (
                            <Typography key={opcion.id}>
                              {opcion.texto}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>
                          {pregunta.desbloqueos_recibidos.map((desbloqueo) => (
                            <div key={desbloqueo.id}>
                              <Typography>{`Pregunta: ${desbloqueo.pregunta_origen}`}</Typography>
                              <Typography>{`Opción: ${desbloqueo.opcion_desbloqueadora}`}</Typography>
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            {error && (
              <Typography color="error" sx={{ marginTop: 2 }}>
                {error}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={handleCreateNewVersion}
      >
        <FaPlus />
      </Fab>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CuestionarioDetail;
