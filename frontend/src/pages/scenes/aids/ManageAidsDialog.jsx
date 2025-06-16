import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Switch,
  Grid,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { tokens } from "../../../theme";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import axios from "../../../api"; // Ensure this axios instance is correctly configured for your backend

// AyudaItem component remains mostly the same, no changes needed here.
// However, ensure it receives `isEditing` prop if you want to visibly
// mark which aids are currently being modified (beyond just `isHighlighted`).
const AyudaItem = React.memo(
  ({
    ayuda,
    estado,
    onToggleActiva,
    onResultadoChange,
    onComentarioChange,
    isNew = false,
    isEditing = false, // Added for potential future use or specific styling
    isHighlighted = false,
  }) => {
    const isActiva = estado.activo || false;
    const theme = useTheme(); // Use theme for Radio colors
    const colors = tokens(theme.palette.mode);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          my: 1.5,
          borderLeft: "6px solid",
          borderColor: isHighlighted
            ? theme.palette.primary.main
            : isNew
            ? theme.palette.success.main
            : isActiva
            ? theme.palette.info.dark
            : theme.palette.grey[400], // Changed neutral.main to grey.400 for consistency
          backgroundColor: isHighlighted
            ? colors.lightBlue[800]
            : isNew
            ? colors.lightGreen[800]
            : isActiva
            ? theme.palette.background.paper
            : theme.palette.background.default,
          transition: "all 0.3s ease",
          opacity: isNew || isHighlighted ? 0.9 : 1,
          boxShadow: isHighlighted ? 3 : 1,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={9}>
            <Typography
              sx={{
                fontSize: "1rem",
                lineHeight: 1.6,
                fontWeight: isNew || isHighlighted ? "bold" : "normal",
              }}
            >
              {ayuda.descripcion}
              {isNew && (
                <Chip
                  label="NUEVO"
                  size="small"
                  color="success"
                  sx={{ ml: 1 }}
                />
              )}
              {isHighlighted && (
                <Chip
                  label="EDITANDO"
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isActiva}
                  onChange={() => onToggleActiva()}
                  color="primary"
                />
              }
              label={isActiva ? "Activo" : "Inactivo"}
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={3} textAlign={{ xs: "left", sm: "right" }}>
            {estado?.activo ? (
              estado.resultado === "funciono" ? (
                <CheckCircleIcon sx={{ fontSize: 28, color: "success.main" }} />
              ) : estado.resultado === "no_funciono" ? (
                <HighlightOffIcon sx={{ fontSize: 28, color: "error.main" }} />
              ) : (
                <HourglassEmptyIcon sx={{ fontSize: 28, color: "warning.main" }} />
              )
            ) : (
              <RemoveCircleOutlineIcon sx={{ fontSize: 28, color: "grey" }} />
            )}
          </Grid>
        </Grid>

        {isActiva && (
          <Box mt={2}>
            <RadioGroup
              row
              value={estado?.resultado || "intentando"}
              onChange={onResultadoChange}
            >
              <FormControlLabel
                value="funciono"
                control={
                  <Radio
                    sx={{
                      color: theme.palette.success.main,
                      "&.Mui-checked": {
                        color: theme.palette.success.main,
                      },
                    }}
                  />
                }
                label="Le funcionó"
              />
              <FormControlLabel
                value="intentando"
                control={
                  <Radio
                    sx={{
                      color: theme.palette.warning.main,
                      "&.Mui-checked": {
                        color: theme.palette.warning.main,
                      },
                    }}
                  />
                }
                label="En Proceso"
              />
              <FormControlLabel
                value="no_funciono"
                control={
                  <Radio
                    sx={{
                      color: theme.palette.error.main,
                      "&.Mui-checked": {
                        color: theme.palette.error.main,
                      },
                    }}
                  />
                }
                label="No le funcionó"
              />
            </RadioGroup>
            <TextField
              fullWidth
              multiline
              label="Comentario"
              placeholder="Agrega una observación aquí..."
              minRows={2}
              sx={{ mt: 2 }}
              value={estado?.comentario || ""}
              onChange={onComentarioChange}
            />
          </Box>
        )}
      </Paper>
    );
  }
);


const ManageAidsDialog = ({
  open,
  onClose,
  uid,
  onSaveSuccess,
  editMode = false,
  targetAid = null, // When in editMode, this will be the specific aid object to edit
  addMode = false,
  targetSection = null,
  dialogTitle = "Gestionar Apoyos",
}) => {
  const [secciones, setSecciones] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [estadoPorAyuda, setEstadoPorAyuda] = useState({});
  const [originalEstadoPorAyuda, setOriginalEstadoPorAyuda] = useState({}); // To track original state for comparison
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);
  const [newAids, setNewAids] = useState(new Set()); // Aids activated for the first time in this session
  const [highlightedAid, setHighlightedAid] = useState(null);

  const theme = useTheme();

  const fetchData = useCallback(async () => {
    if (!uid || !open) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch SIS data (structure of aids)
      const res = await axios.get(
        `/api/cuestionarios/resumen-sis/?usuario_id=${uid}`
      );

      let dataTransformada = res.data.map((seccion) => ({
        nombre_seccion: seccion.nombre_seccion,
        items: seccion.ayudas.map((item) => ({
          item: item.item,
          subitems: item.subitems.map((sub) => ({
            sub_item: sub.sub_item,
            sub_item_id: sub.sub_item_id,
            ayudas: sub.ayudas || [],
          })),
        })),
      }));

      // Filter by target section if in addMode
      if (addMode && targetSection) {
        dataTransformada = dataTransformada.filter(
          (seccion) => seccion.nombre_seccion === targetSection
        );
        // Auto-expand the target section
        setExpandedItem(0); // Assuming the filtered section will be the first
      }

      setSecciones(dataTransformada);

      // Fetch current aid states for the candidate
      const stateRes = await axios.get(
        `/api/candidatos/seguimiento/sis-aid/${uid}/`
      );
      const nuevoEstado = {};
      stateRes.data.forEach((registro) => {
        const ayudaId =
          typeof registro.aid === "object" ? registro.aid.id : registro.aid;
        const subitemKey = `${registro.item}_${registro.subitem_id}`; // Use subitem_id for key consistency
        nuevoEstado[ayudaId] = {
          id: registro.id, // Store the Django record ID for patching
          subitem_key: subitemKey,
          activo: registro.is_active,
          resultado:
            registro.is_successful === "funciono"
              ? "funciono"
              : registro.is_successful === "no_funciono"
              ? "no_funciono"
              : "intentando",
          comentario: registro.comments || "",
        };
      });
      setEstadoPorAyuda(nuevoEstado);
      // Store the initial state to compare for changes later
      setOriginalEstadoPorAyuda(JSON.parse(JSON.stringify(nuevoEstado)));

      // Handle edit mode - highlight target aid and pre-expand section
      if (editMode && targetAid) {
        const targetAidId = typeof targetAid.aid === "object" ? targetAid.aid.id : targetAid.aid;
        setHighlightedAid(targetAidId);

        // Find and expand the section containing the target aid
        dataTransformada.forEach((seccion, seccionIndex) => {
          seccion.items.forEach((item) => {
            item.subitems.forEach((subitem) => {
              if (subitem.ayudas.some((ayuda) => ayuda.id === targetAidId)) {
                setExpandedItem(seccionIndex);
              }
            });
          });
        });
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los datos. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [uid, open, editMode, targetAid, addMode, targetSection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Reset states when dialog closes
    if (!open) {
      setNewAids(new Set());
      setHighlightedAid(null);
      setExpandedItem(null);
      setEstadoPorAyuda({});
      setOriginalEstadoPorAyuda({});
      setError(null);
      setMensajeGuardado(false);
    }
  }, [open]);

  const handleExpand = useCallback(
    (index) => {
      setExpandedItem(expandedItem === index ? null : index);
    },
    [expandedItem]
  );

  const handleSetActiva = useCallback((subitemKey, ayudaId) => {
    setEstadoPorAyuda((prev) => {
      const anterior = prev[ayudaId] || { subitem_key: subitemKey, id: null }; // Ensure id is null for new
      const nuevoEstado = {
        ...anterior,
        activo: !anterior.activo,
      };

      // If activating a new aid (that wasn't active before), add it to newAids set
      if (nuevoEstado.activo && !anterior.activo && !originalEstadoPorAyuda[ayudaId]?.activo) {
        setNewAids((prevNew) => new Set([...prevNew, ayudaId]));
      }

      return {
        ...prev,
        [ayudaId]: nuevoEstado,
      };
    });
  }, [originalEstadoPorAyuda]);

  const handleResultado = useCallback((ayudaId, valor) => {
    setEstadoPorAyuda((prev) => {
      const anterior = prev[ayudaId] || {};
      const nuevoEstado = {
        ...anterior,
        resultado: valor,
      };
      return {
        ...prev,
        [ayudaId]: nuevoEstado,
      };
    });
  }, []);

  const handleComentario = useCallback((ayudaId, texto) => {
    setEstadoPorAyuda((prev) => {
      const anterior = prev[ayudaId] || {};
      const nuevoEstado = {
        ...anterior,
        comentario: texto,
      };
      return {
        ...prev,
        [ayudaId]: nuevoEstado,
      };
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const promises = [];

      // Determine which aids need to be processed
      let aidsToProcess = Object.keys(estadoPorAyuda);

      // If in editMode, only process the highlighted aid
      if (editMode && highlightedAid) {
        aidsToProcess = [highlightedAid];
      }

      for (const ayudaId of aidsToProcess) {
        const currentEstado = estadoPorAyuda[ayudaId];
        const originalEstado = originalEstadoPorAyuda[ayudaId];

        // Skip if no state exists for this aid or if no subitem_key is set
        if (!currentEstado || !currentEstado.subitem_key) continue;

        // Determine section, item, subitem names from the `secciones` data
        let seccionNombre = "";
        let itemNombre = "";
        let subitemTexto = "";
        let found = false;

        for (const seccion of secciones) {
          for (const item of seccion.items) {
            for (const subitem of item.subitems) {
              // Note: The key for subitem in your `fetchData` was `${registro.item}_${registro.subitem_id}`
              // Ensure consistency here or find by ayuda.id
              if (subitem.ayudas.some(a => a.id === parseInt(ayudaId))) {
                 seccionNombre = seccion.nombre_seccion;
                 itemNombre = item.item;
                 subitemTexto = subitem.sub_item;
                 found = true;
                 break;
              }
            }
            if(found) break;
          }
          if(found) break;
        }

        const payload = {
          candidate: uid,
          aid_id: parseInt(ayudaId),
          is_active: currentEstado.activo ?? false,
          seccion: seccionNombre,
          item: itemNombre,
          subitem: subitemTexto,
          is_successful: currentEstado.resultado || "intentando",
          comments: currentEstado.comentario ?? "",
        };
        
        // --- Logic for POST (Create) vs. PATCH (Update) ---
        // Case 1: Brand new aid, activated in this session
        if (newAids.has(parseInt(ayudaId))) {
          console.log(`Sending POST for new aid: ${ayudaId}`, payload);
          promises.push(axios.post("/api/candidatos/seguimiento/sis-aid/", payload));
        }
        // Case 2: Existing aid, whose state has changed
        else if (originalEstado && (
            originalEstado.activo !== currentEstado.activo ||
            originalEstado.resultado !== currentEstado.resultado ||
            originalEstado.comentario !== currentEstado.comentario
        )) {
            // Only update if there's an actual change
            console.log(`Sending PATCH for existing aid: ${ayudaId}`, payload);
            // Ensure you have the record ID from the backend for the PATCH request
            if (currentEstado.id) {
                promises.push(axios.patch(`/api/candidatos/seguimiento/sis-aid/detail/${currentEstado.id}/`, payload));
            } else {
                console.warn(`Attempted to PATCH aid ${ayudaId} but no record ID found.`);
                // You might want to handle this as an error or decide to POST instead if record ID is missing.
                // For now, it will just skip the update for this specific aid if no ID.
            }
        }
        // Case 3: Existing aid that was active but is now de-activated
        // This is implicitly handled by the payload's `is_active` field when patching an existing record.
        // If an aid was active and is now set to inactive, the PATCH request with `is_active: false` will update it.
      }

      await Promise.all(promises);
      setMensajeGuardado(true);
      setNewAids(new Set()); // Clear new aids after saving

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Error al guardar:", err.response ? err.response.data : err);
      setError("Error al guardar los cambios. Por favor intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset states on close to ensure fresh load next time
    setNewAids(new Set());
    setEstadoPorAyuda({});
    setOriginalEstadoPorAyuda({}); // Reset original state
    setExpandedItem(null);
    setHighlightedAid(null);
    setError(null);
    setMensajeGuardado(false);
    onClose();
  };

  const getButtonText = () => {
    if (saving) return "Guardando...";
    if (editMode) return "Guardar Cambio";
    if (addMode) return "Agregar Apoyo";
    return "Guardar Cambios";
  };

  const getSaveIcon = () => {
    if (saving) return <CircularProgress size={20} color="inherit" />; // color="inherit" ensures it matches button text color
    if (editMode) return <SaveIcon />;
    return <AddCircleOutlineIcon />;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando apoyos...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: { minHeight: "80vh" },
        }}
      >
        <DialogTitle>
          {dialogTitle}
          <Typography variant="body2" color="text.secondary">
            {editMode
              ? "Modifica el estado del apoyo seleccionado"
              : addMode
              ? `Agrega nuevos apoyos a la sección: ${targetSection}`
              : "Activa/desactiva apoyos y registra su progreso"}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {secciones.length === 0 && !loading ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No se encontraron secciones disponibles.
            </Typography>
          ) : (
            secciones.map((seccion, index) => (
              <Accordion
                key={index}
                expanded={expandedItem === index}
                onChange={() => handleExpand(index)}
                sx={{
                  borderRadius: 2,
                  mb: 2,
                  boxShadow: 2,
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary.main">
                      SECCIÓN
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {seccion.nombre_seccion}
                    </Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  {seccion.items.every((item) =>
                    item.subitems.every((subitem) => subitem.ayudas.length === 0)
                  ) ? (
                    <Typography sx={{ px: 2, py: 1 }} color="text.secondary">
                      Esta sección no requiere apoyos.
                    </Typography>
                  ) : (
                    seccion.items.map((item, itemIndex) => (
                      <Box key={`${index}-${itemIndex}`} mb={4}>
                        <Divider textAlign="left" sx={{ mb: 2 }}>
                          <Chip
                            label={<Typography variant="h6">{item.item}</Typography>}
                            color="primary"
                          />
                        </Divider>

                        {item.subitems.map((subitem, subIndex) => {
                          // The subitemKey used here for state was ${item.item}_${subitem.sub_item_id}
                          // This is important for mapping aids to their correct subitem context.
                          const subitemKey = `${item.item}_${subitem.sub_item_id}`;

                          return (
                            <Box
                              key={subitemKey} // Key for the subitem container
                              sx={{
                                p: 2,
                                mb: 2,
                                backgroundColor: "background.paper",
                                borderRadius: 2,
                                border: "2px solid",
                                borderColor: "neutral.dark",
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                color="text.primary"
                                sx={{ mb: 1, fontSize: "1.1rem" }}
                              >
                                {subitem.sub_item}
                              </Typography>

                              {subitem.ayudas.map((ayuda) => {
                                const estado = estadoPorAyuda[ayuda.id] || {};
                                const isNewAid = newAids.has(ayuda.id);
                                const isHighlightedAid = highlightedAid === ayuda.id;
                                
                                // Only show aids relevant to edit/add mode if specified
                                if (editMode && !isHighlightedAid) return null;
                                if (addMode && !isNewAid && estado.activo) return null; // In addMode, only show new OR active aids

                                return (
                                  <Box key={ayuda.id}>
                                    <AyudaItem
                                      ayuda={ayuda}
                                      estado={estado}
                                      isNew={isNewAid}
                                      isHighlighted={isHighlightedAid}
                                      onToggleActiva={() =>
                                        handleSetActiva(subitemKey, ayuda.id)
                                      }
                                      onResultadoChange={(e) =>
                                        handleResultado(ayuda.id, e.target.value)
                                      }
                                      onComentarioChange={(e) =>
                                        handleComentario(ayuda.id, e.target.value)
                                      }
                                    />
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                    ))
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={saving} color='secondary'>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={getSaveIcon()}
          >
            {getButtonText()}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={mensajeGuardado}
        autoHideDuration={3000}
        onClose={() => setMensajeGuardado(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setMensajeGuardado(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {editMode
            ? "Apoyo actualizado correctamente"
            : addMode
            ? "Apoyo agregado correctamente"
            : "Cambios guardados correctamente"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ManageAidsDialog;