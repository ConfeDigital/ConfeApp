import React, { useEffect, useState, useCallback } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Paper,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Switch,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  useTheme
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import axios from "../../api";
import ExportarApoyosPDF from "./ExportarApoyosPDF";


import { tokens } from "../../theme";

const normalizarClave = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const AyudaItem = React.memo(
  ({
    ayuda,
    estado,
    onToggleActiva,
    onResultadoChange,
    onComentarioChange,
  }) => {
    const isActiva = estado.activo || false;

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          my: 1.5,
          borderLeft: isActiva ? "6px solid" : "6px solid",
          borderColor: isActiva ? "info.dark" : "neutral.main",
          backgroundColor: isActiva ? "background.paper" : "background.default",
          transition: "all 0.3s ease",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={9}>
            <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
              {ayuda.descripcion}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isActiva}
                  onChange={() => onToggleActiva()}
                  color="primary"
                />
              }
              label="Activo"
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
              value={estado?.resultado || ""}
              onChange={onResultadoChange}
            >
              <FormControlLabel
                value="funciono"
                control={<Radio color="success" />}
                label="Le funcionó"
              />
              <FormControlLabel
                value="intentando"
                control={<Radio color="warning" />}
                label="En Proceso"
              />
              <FormControlLabel
                value="no_funciono"
                control={<Radio color="error" />}
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

const PlanApoyosSeguimiento = ({ uid }) => {
  const [profile, setProfile] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [estadoPorAyuda, setEstadoPorAyuda] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);
  const [historialAyuda, setHistorialAyuda] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `/api/cuestionarios/resumen-sis/?usuario_id=${uid}`
      );

      const dataTransformada = res.data.map((seccion) => ({
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

      setSecciones(dataTransformada);
    } catch (err) {
      console.error("Error al cargar resumen SIS:", err);
      setError("Error al cargar los datos. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!uid) return;
    // Cargar el estado inicial de apoyos directamente con axios
    axios
      .get(`/api/candidatos/seguimiento/sis-aid/${uid}/`)
      .then((res) => {
        console.log("📥 Estado recibido:", res.data);
        const nuevoEstado = {};
        res.data.forEach((registro) => {
          const ayudaId =
            typeof registro.aid === "object" ? registro.aid.id : registro.aid;
          const subitemKey = `${registro.item}_${ayudaId}`;
          nuevoEstado[ayudaId] = {
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
      })
      .catch((err) => {
        console.error("Error al cargar estado de apoyos:", err);
      });
  }, [uid]);

  const handleExpand = useCallback(
    (index) => {
      setExpandedItem(expandedItem === index ? null : index);
    },
    [expandedItem]
  );

  const fetchHistorial = async (ayudaId) => {
    try {
      const res = await axios.get(
        `/api/candidatos/seguimiento/sis-aid/${uid}/history/`
      );
      const filtrado = res.data.filter((entry) => entry.aid === ayudaId);
      setHistorialAyuda(filtrado);
      setDialogTitle(`Historial de ayuda ${ayudaId}`);
      setDialogOpen(true);
    } catch (err) {
      console.error("Error al obtener historial:", err);
    }
  };

  const handleSetActiva = useCallback(
    (subitemKey, ayudaId) => {
      setEstadoPorAyuda((prev) => {
        const anterior = prev[ayudaId] || { subitem_key: subitemKey };
        const nuevoEstado = {
          ...anterior,
          subitem_key: subitemKey,
          activo: !anterior.activo,
        };
        return {
          ...prev,
          [ayudaId]: nuevoEstado,
        };
      });
      // Postpone POST after state update
      setTimeout(() => {
        const estado = estadoPorAyuda[ayudaId] || {};
        const nuevoActivo = !(estado.activo || false);
        const subitem_key = subitemKey;
        let seccionNombre = "";
        let itemNombre = "";
        let subitemTexto = "";
        for (const seccion of secciones) {
          for (const item of seccion.items) {
            for (const subitem of item.subitems) {
              const key = `${item.item}_${subitem.sub_item_id}`;
              if (key === subitem_key) {
                seccionNombre = seccion.nombre_seccion;
                itemNombre = item.item;
                subitemTexto = subitem.sub_item;
                break;
              }
            }
          }
        }
        const payload = {
          candidate: uid,
          aid_id: ayudaId,
          is_active: nuevoActivo,
          seccion: seccionNombre,
          item: itemNombre,
          subitem: subitemTexto,
          is_successful: estado.resultado || "intentando",
          comments: estado.comentario ?? "",
        };
        console.log("📤 Enviando POST desde activa:", payload);
        axios
          .post("/api/candidatos/seguimiento/sis-aid/", payload)
          .then(() => {
            console.log("✅ POST exitoso");
          })
          .catch((err) => {
            console.error("❌ Error en POST:", err);
          });
      }, 0);
    },
    [estadoPorAyuda, secciones, uid]
  );

  const handleResultado = useCallback(
    (ayudaId, valor) => {
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
      // Postpone POST after state update
      setTimeout(() => {
        const estado = estadoPorAyuda[ayudaId] || {};
        const subitemKey = estado.subitem_key || "";
        let seccionNombre = "";
        let itemNombre = "";
        let subitemTexto = "";
        for (const seccion of secciones) {
          for (const item of seccion.items) {
            for (const subitem of item.subitems) {
              const key = `${item.item}_${subitem.sub_item_id}`;
              if (key === subitemKey) {
                seccionNombre = seccion.nombre_seccion;
                itemNombre = item.item;
                subitemTexto = subitem.sub_item;
                break;
              }
            }
          }
        }
        const payload = {
          candidate: uid,
          aid_id: ayudaId,
          is_active: estado.activo ?? true,
          seccion: seccionNombre,
          item: itemNombre,
          subitem: subitemTexto,
          is_successful: valor || "intentando",
          comments: estado.comentario ?? "",
        };
        console.log("📤 Enviando POST desde resultado:", payload);
        axios
          .post("/api/candidatos/seguimiento/sis-aid/", payload)
          .then(() => {
            console.log("✅ POST exitoso");
          })
          .catch((err) => {
            console.error("❌ Error en POST:", err);
          });
      }, 0);
    },
    [estadoPorAyuda, secciones, uid]
  );

  const handleComentario = useCallback(
    (ayudaId, texto) => {
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

      // Postpone el POST para que se haga después del setState
      setTimeout(() => {
        const estado = estadoPorAyuda[ayudaId] || {};
        const subitemKey = estado.subitem_key || "";

        let seccionNombre = "";
        let itemNombre = "";
        let subitemTexto = "";

        for (const seccion of secciones) {
          for (const item of seccion.items) {
            for (const subitem of item.subitems) {
              const key = `${item.item}_${subitem.sub_item_id}`;
              if (key === subitemKey) {
                seccionNombre = seccion.nombre_seccion;
                itemNombre = item.item;
                subitemTexto = subitem.sub_item;
                break;
              }
            }
          }
        }

        const payload = {
          candidate: uid,
          aid_id: ayudaId,
          is_active: estado.activo ?? true,
          seccion: seccionNombre,
          item: itemNombre,
          subitem: subitemTexto,
          is_successful: estado.resultado || "intentando",
          comments: texto,
        };
        console.log("📤 Enviando POST desde comentario:", payload);
        axios
          .post("/api/candidatos/seguimiento/sis-aid/", payload)
          .then(() => {
            console.log("✅ POST exitoso");
          })
          .catch((err) => {
            console.error("❌ Error en POST:", err);
          });
      }, 0);
    },
    [estadoPorAyuda, secciones, uid]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/candidatos/profiles/${uid}/`);
        setProfile(res.data);
      } catch (err) {
        console.error("Error al cargar perfil del usuario:", err);
      }
    };

    if (uid) {
      fetchProfile();
    }
  }, [uid]);

  if (loading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;




  return (
    <Box sx={{ p: 2 }}>
      <Box >
        <ExportarApoyosPDF
          secciones={secciones}
          estadoPorAyuda={estadoPorAyuda}
          profile={profile}
        />
      </Box>

      {secciones.map((seccion, index) => (
        <Accordion
          key={index}
          expanded={expandedItem === index}
          onChange={() => handleExpand(index)}
          sx={{
            // backgroundColor: "#f7fafd",
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
                      label={<Typography variant="h5">{item.item}</Typography>}
                      color="primary"
                    />
                  </Divider>

                  {item.subitems.map((subitem, subIndex) => {
                    const subitemKey = `${item.item}_${subitem.sub_item_id}`;

                    return (
                      <Box
                        key={subitemKey}
                        sx={{
                          p: 2,
                          mb: 2,
                          backgroundColor: colors.lightBlue[700],
                          borderRadius: 2,
                          border: "2px solid",
                          borderColor: colors.lightBlue[500],
                          cursor: "pointer",
                          transition: "0.2s",
                          "&:hover": {
                            backgroundColor: colors.lightBlue[600],
                          },
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
                          return (
                            <Box key={ayuda.id}>
                              <AyudaItem
                                ayuda={ayuda}
                                estado={estado}
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
      ))}
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
          Cambios guardados correctamente
        </Alert>
      </Snackbar>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {historialAyuda.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay historial disponible.
            </Typography>
          ) : (
            historialAyuda.map((h, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {h.history_date} —{" "}
                  <strong>
                    {{
                      funciono: "Le funcionó",
                      no_funciono: "No le funcionó",
                      intentando: "Intentando",
                    }[h.is_successful] || "Desconocido"}
                  </strong>
                </Typography>
                {h.comments && (
                  <Typography variant="body2" color="text.secondary">
                    {h.comments}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(PlanApoyosSeguimiento);
