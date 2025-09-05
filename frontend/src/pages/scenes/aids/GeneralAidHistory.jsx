import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../api";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  ButtonGroup,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import ManageAidsDialog from "./ManageAidsDialog";

const GeneralAidHistory = ({
  documentTitle = "Seguimiento de Apoyos",
}) => {
  useDocumentTitle(documentTitle);
  const { uid } = useParams();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [groupedEntries, setGroupedEntries] = useState({});
  const [mostrarSoloActuales, setMostrarSoloActuales] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  
  // New state for individual aid editing
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAid, setEditingAid] = useState(null);
  
  // New state for section-specific add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [targetSection, setTargetSection] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/candidatos/seguimiento/sis-aid/${uid}/`);
      const latestByAidId = {};

      res.data.forEach((entry) => {
        const aidId =
          typeof entry.aid === "object" ? entry.aid.id : entry.aid;
        if (!latestByAidId[aidId] || latestByAidId[aidId].id < entry.id) {
          latestByAidId[aidId] = entry;
        }
      });

      const entriesArray = Object.values(latestByAidId);
      setEntries(entriesArray);
      
      // Group entries by section > item > subitem
      const grouped = {};
      entriesArray.forEach((entry) => {
        const seccion = entry.seccion || "Sin Sección";
        const item = entry.item || "Sin Item";
        const subitem = entry.subitem || "Sin Subitem";
        
        if (!grouped[seccion]) {
          grouped[seccion] = {};
        }
        if (!grouped[seccion][item]) {
          grouped[seccion][item] = {};
        }
        if (!grouped[seccion][item][subitem]) {
          grouped[seccion][item][subitem] = [];
        }
        
        grouped[seccion][item][subitem].push(entry);
      });
      
      setGroupedEntries(grouped);
    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
      setEntries([]);
      setGroupedEntries({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (uid) fetchData();
  }, [uid]);

  const handleManageDialogSuccess = () => {
    fetchData(); // Refresh data after saving
    setManageDialogOpen(false); // Close dialog after successful save
  };

  const handleManageDialogClose = () => {
    setManageDialogOpen(false);
  };

  // Handler for individual aid editing
  const handleEditAid = (entry) => {
    setEditingAid(entry);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingAid(null);
  };

  const handleEditDialogSuccess = () => {
    fetchData();
    setEditDialogOpen(false);
    setEditingAid(null);
  };

  // Handler for section-specific add
  const handleAddToSection = (sectionName) => {
    setTargetSection(sectionName);
    setAddDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
    setTargetSection(null);
  };

  const handleAddDialogSuccess = () => {
    fetchData();
    setAddDialogOpen(false);
    setTargetSection(null);
  };

  const getStatusIcon = (entry) => {
    if (!entry.is_active) {
      return null;
    }
    
    switch (entry.is_successful) {
      case "funciono":
        return <CheckCircleIcon sx={{ color: "success.main", fontSize: 24, mr: 1 }} />;
      case "no_funciono":
        return <ErrorIcon sx={{ color: "error.main", fontSize: 24, mr: 1 }} />;
      case "intentando":
        return <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 24, mr: 1 }} />;
      default:
        return <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 24, mr: 1 }} />;
    }
  };

  const getStatusText = (entry) => {
    if (!entry.is_active) {
      return "Inactivo";
    }
    
    switch (entry.is_successful) {
      case "funciono":
        return "Le funcionó";
      case "no_funciono":
        return "No le funcionó";
      case "intentando":
        return "En Proceso";
      default:
        return "En Proceso";
    }
  };

  const filterEntries = (entriesArray) => {
    return entriesArray.filter((entry) => {
      const texto = `${entry.aid?.descripcion || ""} ${entry.item || ""} ${entry.subitem || ""}`.toLowerCase();
      const matchesBusqueda = texto.includes(busqueda.toLowerCase());
      const matchesActivos = mostrarSoloActuales ? entry.is_active : true;
      return matchesBusqueda && matchesActivos;
    });
  };

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <TextField
          label="Buscar apoyo"
          variant="outlined"
          fullWidth
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <FormControlLabel
          control={
            <Switch
              checked={mostrarSoloActuales}
              onChange={() => setMostrarSoloActuales(!mostrarSoloActuales)}
            />
          }
          label="Solo apoyos activos"
        />
      </Box>

      <ButtonGroup sx={{ mb: 3 }} variant="contained">
        {/* <Button
          color="primary"
          onClick={() => navigate(`/seguimiento-candidatos/${uid}`)}
          startIcon={<EditIcon />}
        >
          Editar Seguimiento
        </Button> */}
        <Button
          color="secondary"
          onClick={() => setManageDialogOpen(true)}
          startIcon={<AddCircleOutlineIcon />}
        >
          Gestionar Todos los Apoyos
        </Button>
      </ButtonGroup>

      {/* Grouped entries view */}
      <Box sx={{ mt: 2 }}>
        {Object.keys(groupedEntries).length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No se encontraron apoyos que coincidan con los filtros.
          </Typography>
        ) : (
          Object.entries(groupedEntries).map(([seccion, items], seccionIndex) => (
            <Accordion
              key={seccion}
              expanded={expandedGroup === seccionIndex}
              onChange={() => setExpandedGroup(expandedGroup === seccionIndex ? null : seccionIndex)}
              sx={{
                mb: 2,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary.main">
                      SECCIÓN
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {seccion}
                    </Typography>
                  </Box>
                  <Tooltip title={`Agregar apoyo a ${seccion}`}>
                    <IconButton
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToSection(seccion);
                      }}
                      sx={{ mr: 2 }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                {Object.entries(items).map(([item, subitems]) => (
                  <Box key={item} sx={{ mb: 3 }}>
                    <Divider textAlign="left" sx={{ mb: 2 }}>
                      <Chip
                        label={<Typography variant="h6">{item}</Typography>}
                        color="primary"
                      />
                    </Divider>
                    
                    {Object.entries(subitems).map(([subitem, subitemEntries]) => (
                      <Box key={subitem} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color="text.primary"
                          sx={{ mb: 1, pl: 1 }}
                        >
                          {subitem}
                        </Typography>
                        
                        {filterEntries(subitemEntries).map((entry) => (
                          <Paper
                            key={entry.id}
                            variant="outlined"
                            sx={{
                              p: 2,
                              ml: 2,
                              mb: 1,
                              borderLeft: "4px solid",
                              borderColor: !entry.is_active
                                ? "grey.400"
                                : entry.is_successful === "funciono"
                                  ? "success.main"
                                  : entry.is_successful === "no_funciono"
                                    ? "error.main"
                                    : "warning.main",
                              backgroundColor: !entry.is_active 
                                ? "background.default" 
                                : "background.paper",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography variant="body1" fontWeight="medium">
                                {entry.aid?.descripcion || "Descripción no disponible"}
                              </Typography>
                              
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                {getStatusIcon(entry)}
                                <Typography variant="body2" fontWeight="medium">
                                  {getStatusText(entry)}
                                </Typography>
                              </Box>
                            </Box>

                            {entry.comments && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ mb: 1, fontStyle: "italic" }}
                              >
                                "{entry.comments}"
                              </Typography>
                            )}

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1,
                              }}
                            >
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  size="small"
                                  startIcon={<InfoOutlinedIcon />}
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setInfoDialogOpen(true);
                                  }}
                                >
                                  Más información
                                </Button>
                                
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleEditAid(entry)}
                                  color="primary"
                                >
                                  Editar
                                </Button>
                              </Box>
                              
                              <Box sx={{ display: "flex", gap: 2 }}>
                                {entry.start_date && (
                                  <Typography variant="caption" color="text.secondary">
                                    Inicio: {entry.start_date}
                                  </Typography>
                                )}
                                {entry.end_date && (
                                  <Typography variant="caption" color="text.secondary">
                                    Fin: {entry.end_date}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    ))}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalles del Apoyo</DialogTitle>
        <DialogContent dividers>
          {selectedEntry ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                ID del Registro:
              </Typography>
              <Typography sx={{ mb: 1 }}>{selectedEntry.id}</Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Descripción del Apoyo:
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {selectedEntry.aid?.descripcion}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Item:
              </Typography>
              <Typography sx={{ mb: 1 }}>{selectedEntry.item}</Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Subitem:
              </Typography>
              <Typography sx={{ mb: 1 }}>{selectedEntry.subitem}</Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Grupo:
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {selectedEntry.aid?.item?.group?.name || "No especificado"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                ¿Está activo?
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {selectedEntry.is_active ? "Sí" : "No"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Resultado:
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {{
                  funciono: "Le funcionó",
                  no_funciono: "No le funcionó",
                  intentando: "En Proceso",
                }[selectedEntry.is_successful] || "No especificado"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Comentarios:
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {selectedEntry.comments || "Sin comentarios"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Fecha de inicio:
              </Typography>
              <Typography sx={{ mb: 1 }}>
                {selectedEntry.start_date || "No especificada"}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Fecha de fin:
              </Typography>
              <Typography>
                {selectedEntry.end_date || "No especificada"}
              </Typography>
            </Box>
          ) : (
            <Typography>No hay datos disponibles.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Global Manage Aids Dialog */}
      <ManageAidsDialog
        open={manageDialogOpen}
        onClose={handleManageDialogClose}
        uid={uid}
        onSaveSuccess={handleManageDialogSuccess}
      />

      {/* Individual Aid Edit Dialog */}
      <ManageAidsDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        uid={uid}
        onSaveSuccess={handleEditDialogSuccess}
        editMode={true}
        targetAid={editingAid}
        dialogTitle="Editar Apoyo Individual"
      />

      {/* Section-specific Add Dialog */}
      <ManageAidsDialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        uid={uid}
        onSaveSuccess={handleAddDialogSuccess}
        addMode={true}
        targetSection={targetSection}
        dialogTitle={`Agregar Apoyo a ${targetSection}`}
      />
    </Box>
  );
};

export default GeneralAidHistory;