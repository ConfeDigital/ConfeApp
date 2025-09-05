import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api";
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
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Header from "../../components/Header";
import useDocumentTitle from "../../hooks/useDocumentTitle";

/**
 * PlanApoyosSeguimiento (adapted as CandidateAidHistory)
 * Shows the current active SIS aids for a candidate and allows navigation to the edit page.
 */
const PlanApoyosSeguimiento = () => {
  useDocumentTitle("Seguimiento de Apoyos SIS");
  const { uid } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [sisAids, setSisAids] = useState([]);
  const [mostrarSoloActuales, setMostrarSoloActuales] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // Fetch candidate info and current active SIS aids only (not historical)
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const candidateResp = await axios.get(`/api/auth/users/${uid}/`);
        setCandidate(candidateResp.data);
        axios.get(`/api/candidatos/seguimiento/sis-aid/${uid}/`).then((res) => {
          console.log("📥 Estado recibido:", res.data);
          const latestByAidId = {};

          res.data.forEach((entry) => {
            const aidId =
              typeof entry.aid === "object" ? entry.aid.id : entry.aid;
            if (!latestByAidId[aidId] || latestByAidId[aidId].id < entry.id) {
              latestByAidId[aidId] = entry;
            }
          });

          const filtered = Object.values(latestByAidId);
          console.log("🧠 Apoyos únicos más recientes:", filtered);
          setSisAids(filtered);
        });
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setCandidate(null);
        setSisAids([]);
      }
      setLoading(false);
    };
    if (uid) fetchAll();
  }, [uid]);

  const handleEditSeguimiento = () => {
    navigate(`/seguimiento-candidatos/${uid}`);
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Header
        subtitle={
          candidate
            ? `${candidate.first_name} ${candidate.last_name} ${
                candidate.second_last_name || ""
              }`
            : ""
        }
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
      <Typography variant="h5" sx={{ mb: 2 }}>
        Apoyos SIS
      </Typography>
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
          label="Solo actuales"
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleEditSeguimiento}
        sx={{ mb: 3 }}
      >
        Editar Seguimiento
      </Button>
      {loading ? (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {(() => {
            const filtrados = sisAids
              .filter((entry) => {
                const texto = `${entry.aid?.descripcion || ""} ${
                  entry.item || ""
                } ${entry.subitem || ""}`.toLowerCase();
                return texto.includes(busqueda.toLowerCase());
              })
              .filter((entry) =>
                mostrarSoloActuales ? entry.is_active : true
              );
            if (filtrados.length === 0) {
              return (
                <Typography variant="body1" color="text.secondary">
                  No se encontraron apoyos SIS que coincidan con los filtros.
                </Typography>
              );
            }
            return filtrados.map((entry) => (
              <Paper
                key={entry.id}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderLeft: "6px solid",
                  borderColor: !entry.is_active
                    ? "grey.400"
                    : entry.is_successful === "funciono"
                    ? "success.main"
                    : entry.is_successful === "no_funciono"
                    ? "error.main"
                    : "warning.main",
                  backgroundColor: !entry.is_active ? "#f0f0f0" : "#f7f9fc",
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {entry.aid?.descripcion || "Descripción no disponible"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    {entry.item}
                    <br />
                    <em>{entry.subitem}</em>
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      alignSelf: { xs: "flex-end", sm: "unset" },
                    }}
                  >
                    {entry.is_successful === "funciono" && (
                      <>
                        <CheckCircleIcon
                          sx={{ color: "success.main", fontSize: 28, mr: 1 }}
                        />
                        <Typography variant="subtitle1">Le funcionó</Typography>
                      </>
                    )}
                    {entry.is_successful === "no_funciono" && (
                      <>
                        <ErrorIcon
                          sx={{ color: "error.main", fontSize: 28, mr: 1 }}
                        />
                        <Typography variant="subtitle1">
                          No le funcionó
                        </Typography>
                      </>
                    )}
                    {entry.is_successful === "intentando" && (
                      <>
                        <WarningAmberIcon
                          sx={{ color: "warning.main", fontSize: 28, mr: 1 }}
                        />
                        <Typography variant="subtitle1">En Proceso</Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    mt: 1,
                    gap: 1,
                  }}
                >
                  {entry.comments && (
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
                  )}
                  <Box>
                    {entry.start_date && (
                      <Typography variant="caption" color="text.secondary">
                        Inicio: {entry.start_date}
                      </Typography>
                    )}
                    {entry.end_date && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 2 }}
                      >
                        Fin: {entry.end_date}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            ));
          })()}
        </Box>
      )}
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
    </Box>
  );
};

export default React.memo(PlanApoyosSeguimiento);
