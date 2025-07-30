import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axios from "../../api";
import { obtenerUltimoSeguimientoProyectoVida } from "./funciones/obtenerUltimoSeguimientoProyectoVida";
import { guardarSeguimientoProyectoVida } from "./funciones/guardarSeguimientoProyectoVida";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";

const estadosPaso = {
  success: {
    label: "Logrado",
    color: "success",
    icon: <CheckCircleIcon color="success" />,
  },
  in_progress: {
    label: "En Progreso",
    color: "warning",
    icon: <AutorenewIcon color="warning" />,
  },
  failed: {
    label: "No logrado",
    color: "error",
    icon: <CancelIcon color="error" />,
  },
};

const ProyectoDeVidaSeguimiento = () => {
  const uid = useParams().uid;

  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [observacionesAbiertas, setObservacionesAbiertas] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState("");
  const [editPasoTexto, setEditPasoTexto] = useState("");
  const [pasoSeleccionado, setPasoSeleccionado] = useState(null);
  const [metaSeleccionada, setMetaSeleccionada] = useState(null);
  const [candidate, setCandidate] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const candidateResp = await axios.get(`/api/auth/users/${uid}/`);
        setCandidate(candidateResp.data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setCandidate(null);
      }
    };
    const fetchMetas = async () => {
      try {
        setLoading(true);

        // Cargar metas desde el cuestionario (como antes)
        const res = await axios.get(
          `/api/cuestionarios/usuario/respuestas-unlocked-path/?usuario_id=${uid}`
        );

        const metasCuestionario = res.data
          .filter((item) => item.tipo_pregunta === "meta")
          .map((item) => {
            try {
              // Manejar tanto objetos JSON nativos como strings JSON (para compatibilidad)
              const respuesta =
                typeof item.respuesta === "string"
                  ? JSON.parse(item.respuesta)
                  : item.respuesta;

              return {
                id: item.pregunta_id,
                titulo: respuesta.meta || item.pregunta_texto,
                pasos: (respuesta.pasos || []).map((paso, index) => ({
                  id: index,
                  titulo: paso.descripcion,
                  estado: "in_progress",
                  observacion: "",
                  encargado: paso.encargado || "",
                })),
              };
            } catch (e) {
              console.error(
                "Error parsing respuesta JSON en pregunta",
                item.pregunta_id,
                e
              );
              return {
                id: item.pregunta_id,
                titulo: item.pregunta_texto,
                pasos: [],
              };
            }
          });

        // Cargar historial de metas
        const historial = await obtenerUltimoSeguimientoProyectoVida(uid);
        const metasHistorial = Array.isArray(historial?.metas)
          ? historial.metas
          : [];

        // Aplicar estado/observación desde historial a pasos por coincidencia de título
        const metasConHistorial = metasCuestionario.map((meta) => {
          const metaHist = metasHistorial.find((m) => m.titulo === meta.titulo);
          if (!metaHist) return meta;

          const pasosActualizados = meta.pasos.map((paso) => {
            const pasoHist = metaHist.pasos?.find(
              (p) => p.titulo === paso.titulo
            );
            return pasoHist
              ? {
                  ...paso,
                  estado: pasoHist.estado,
                  observacion: pasoHist.observacion || "",
                }
              : paso;
          });

          return { ...meta, pasos: pasosActualizados };
        });

        setMetas(metasConHistorial);
      } catch (err) {
        console.error("Error al cargar metas y su historial:", err);
        setError("Error al cargar las metas del proyecto de vida");
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchMetas();
      fetchCandidate();
    }
  }, [uid]);

  useEffect(() => {
    if (!uid || metas.length === 0) return;

    const timeout = setTimeout(() => {
      guardarSeguimientoProyectoVida({
        usuarioId: uid,
        metas,
      })
        .then(() => {
          console.log("Seguimiento de metas guardado automáticamente.");
        })
        .catch((err) => {
          console.error("Error al guardar seguimiento de metas:", err);
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [metas]);

  const toggleObservacion = (metaId, pasoId) => {
    const key = `${metaId}_${pasoId}`;
    setObservacionesAbiertas((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getEstadoMeta = (pasos) => {
    if (pasos.length === 0) return { label: "Sin pasos", color: "grey" };
    if (pasos.every((p) => p.estado === "success")) {
      return { label: "Meta completada", color: "success.main" };
    }
    if (pasos.some((p) => p.estado === "in_progress")) {
      return { label: "Meta en progreso", color: "warning.main" };
    }
    return { label: "Meta no alcanzada", color: "error.main" };
  };

  const handleEstadoPaso = (metaId, pasoId, nuevoEstado) => {
    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaId
          ? {
              ...meta,
              pasos: meta.pasos.map((paso) =>
                paso.id === pasoId ? { ...paso, estado: nuevoEstado } : paso
              ),
            }
          : meta
      )
    );
  };

  const handleObservacionPaso = (metaId, pasoId, texto) => {
    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaId
          ? {
              ...meta,
              pasos: meta.pasos.map((paso) =>
                paso.id === pasoId ? { ...paso, observacion: texto } : paso
              ),
            }
          : meta
      )
    );
  };

  const abrirDialogoAgregar = (metaId) => {
    setMetaSeleccionada(metaId);
    setNuevoPasoTexto("");
    setDialogOpen(true);
  };

  const agregarPaso = () => {
    if (!nuevoPasoTexto.trim()) return;
    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaSeleccionada
          ? {
              ...meta,
              pasos: [
                ...meta.pasos,
                {
                  id: Date.now(),
                  titulo: nuevoPasoTexto,
                  estado: "in_progress",
                  observacion: "",
                  encargado: "",
                },
              ],
            }
          : meta
      )
    );
    setDialogOpen(false);
  };

  const abrirDialogoEditar = (metaId, paso) => {
    setMetaSeleccionada(metaId);
    setPasoSeleccionado(paso);
    setEditPasoTexto(paso.titulo);
    setDialogEditOpen(true);
  };

  const editarPaso = () => {
    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaSeleccionada
          ? {
              ...meta,
              pasos: meta.pasos.map((p) =>
                p.id === pasoSeleccionado.id
                  ? { ...p, titulo: editPasoTexto }
                  : p
              ),
            }
          : meta
      )
    );
    setDialogEditOpen(false);
  };

  const abrirDialogoEliminar = (metaId, paso) => {
    setMetaSeleccionada(metaId);
    setPasoSeleccionado(paso);
    setDialogDeleteOpen(true);
  };

  const eliminarPaso = () => {
    setMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaSeleccionada
          ? {
              ...meta,
              pasos: meta.pasos.filter((p) => p.id !== pasoSeleccionado.id),
            }
          : meta
      )
    );
    setDialogDeleteOpen(false);
  };

  const moverPaso = (metaId, index, direccion) => {
    setMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        const pasos = [...meta.pasos];
        const nuevoIndex = direccion === "arriba" ? index - 1 : index + 1;
        if (nuevoIndex < 0 || nuevoIndex >= pasos.length) return meta;
        [pasos[index], pasos[nuevoIndex]] = [pasos[nuevoIndex], pasos[index]];
        return { ...meta, pasos };
      })
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (metas.length === 0) {
    return (
      <Box p={2}>
        <Typography>No se encontraron metas para este usuario.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Header
        subtitle={`${candidate?.first_name} ${candidate?.last_name} ${candidate?.second_last_name}`}
        actionButton={
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/candidatos/${uid}`)}
          >
            Volver al Perfil
          </Button>
        }
      />
      {metas.map((meta) => {
        const estado = getEstadoMeta(meta.pasos);
        return (
          <Paper
            key={meta.id}
            elevation={3}
            sx={{
              p: 3,
              mb: 3,
              borderLeft: `6px solid ${estado.color}`,
            }}
          >
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {meta.titulo}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ color: estado.color }}
              >
                {estado.label}
              </Typography>
            </Box>

            {meta.pasos.map((paso, index) => {
              const key = `${meta.id}_${paso.id}`;
              const config = estadosPaso[paso.estado];
              return (
                <Box
                  key={paso.id}
                  mb={2}
                  p={2}
                  border="1px solid"
                  borderColor="grey"
                  borderRadius={2}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Paso {index + 1}: {paso.titulo}
                      </Typography>
                      {paso.encargado && (
                        <Typography variant="body2" color="text.secondary">
                          Encargado: {paso.encargado}
                        </Typography>
                      )}
                      <Box display="flex" alignItems="center" mt={0.5}>
                        {config.icon}
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={config.color}
                          ml={0.5}
                        >
                          {config.label}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      {/* <IconButton
                        onClick={() => moverPaso(meta.id, index, "arriba")}
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => moverPaso(meta.id, index, "abajo")}
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => abrirDialogoEditar(meta.id, paso)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => abrirDialogoEliminar(meta.id, paso)}
                      >
                        <DeleteIcon />
                      </IconButton> */}
                      <IconButton
                        onClick={() => toggleObservacion(meta.id, paso.id)}
                      >
                        {observacionesAbiertas[key] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} mt={2} mb={1}>
                    <Button
                      variant={
                        paso.estado === "success" ? "contained" : "outlined"
                      }
                      color="success"
                      onClick={() =>
                        handleEstadoPaso(meta.id, paso.id, "success")
                      }
                      startIcon={<CheckCircleIcon />}
                    >
                      Logrado
                    </Button>
                    <Button
                      variant={
                        paso.estado === "in_progress" ? "contained" : "outlined"
                      }
                      color="warning"
                      onClick={() =>
                        handleEstadoPaso(meta.id, paso.id, "in_progress")
                      }
                      startIcon={<AutorenewIcon />}
                    >
                      En Progreso
                    </Button>
                    <Button
                      variant={
                        paso.estado === "failed" ? "contained" : "outlined"
                      }
                      color="error"
                      onClick={() =>
                        handleEstadoPaso(meta.id, paso.id, "failed")
                      }
                      startIcon={<CancelIcon />}
                    >
                      No logrado
                    </Button>
                  </Box>

                  <Collapse in={observacionesAbiertas[key]}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Observación"
                      value={paso.observacion}
                      onChange={(e) =>
                        handleObservacionPaso(meta.id, paso.id, e.target.value)
                      }
                    />
                  </Collapse>
                </Box>
              );
            })}

            {/* <Box mt={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => abrirDialogoAgregar(meta.id)}
              >
                Agregar paso
              </Button>
            </Box> */}
          </Paper>
        );
      })}

      {/* Dialog Agregar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Agregar nuevo paso</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Título del paso"
            value={nuevoPasoTexto}
            onChange={(e) => setNuevoPasoTexto(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={agregarPaso} variant="contained">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditOpen} onClose={() => setDialogEditOpen(false)}>
        <DialogTitle>Editar paso</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={editPasoTexto}
            onChange={(e) => setEditPasoTexto(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditOpen(false)}>Cancelar</Button>
          <Button onClick={editarPaso} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog
        open={dialogDeleteOpen}
        onClose={() => setDialogDeleteOpen(false)}
      >
        <DialogTitle>¿Eliminar paso?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este paso?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={eliminarPaso} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProyectoDeVidaSeguimiento;
