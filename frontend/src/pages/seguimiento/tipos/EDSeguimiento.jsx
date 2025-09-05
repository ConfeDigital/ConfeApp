import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../api";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField, // Keep TextField for Autocomplete's renderInput
  Checkbox,
  FormControlLabel,
  Autocomplete, // Keep Autocomplete
  FormControl, // Still needed for FormControlLabel maybe elsewhere
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import * as Yup from "yup";

import useDocumentTitle from "../../../hooks/useDocumentTitle";

const CandidateAidHistoryPage = () => {
  useDocumentTitle("Historial de Apoyos");

  // Obtener el id del candidato desde los parámetros de la URL
  const { uid: candidateId } = useParams();
  const navigate = useNavigate();

  // Sólo Apoyos Evaluación Diagnóstica (TAid)

  // Historial de Apoyos Evaluación Diagnóstica (TAid)
  const [taidHistories, setTaidHistories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState();
  const [openDialog, setOpenDialog] = useState(false);
  // Cuando editingEntry es null se está creando una nueva entrada
  const [editingEntry, setEditingEntry] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    aid: "", // This will store the ID of the selected aid
    is_active: true,
    start_date: null,
    end_date: null,
    is_successful: false,
    comments: "",
  });

  // Lista de apoyos disponibles
  const [technicalAids, setTechnicalAids] = useState([]);

  // Endpoint para el historial de candidatos
  const tAidHistoryEndpoint = "/api/candidatos/historial-apoyos/";

  // Endpoint para el detalle del candidato
  const candidateEndpoint = "/api/auth/users/";

  // Endpoint para la lista de apoyos
  const technicalAidsEndpoint = "/api/discapacidad/technical-aids/";

  const formSchema = Yup.object({
    aid: Yup.number().nullable(false).typeError("Debe seleccionar un apoyo"),
    start_date: Yup.date()
      .nullable()
      // If end_date is present, then start_date becomes required
      .when("end_date", {
        is: (end) => !!end,
        then: (s) =>
          s.required(
            "Debe ingresar fecha de inicio cuando hay fecha de término"
          ),
        otherwise: (s) => s,
      }),

    end_date: Yup.date()
      .nullable()
      // If you do provide end_date, it must be ≥ start_date
      .min(
        Yup.ref("start_date"),
        "La fecha de término debe ser posterior o igual a la fecha de inicio"
      ),
  });

  // Función para obtener el historial de apoyos filtrados por candidato
  const fetchData = async () => {
    setLoading(true);
    try {
      const taidResponse = await axios.get(
        `${tAidHistoryEndpoint}?candidate=${candidateId}`
      );
      setTaidHistories(taidResponse.data);
    } catch (error) {
      console.error("Error fetching histories:", error);
    }
    setLoading(false);
  };

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${candidateEndpoint}${candidateId}/`);
      setCandidate(response.data);
    } catch (error) {
      console.error("Error fetching candidate:", error);
    }
    setLoading(false);
  };

  // Obtener la lista de apoyos
  const fetchAids = async () => {
    try {
      const techResponse = await axios.get(technicalAidsEndpoint);
      setTechnicalAids(techResponse.data);
    } catch (error) {
      console.error("Error fetching aids lists:", error);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchCandidate();
      fetchData();
    }
  }, [candidateId]);

  useEffect(() => {
    fetchAids();
  }, []);

  // (Ya no se necesita handleTabChange ni selectedTab)

  // Abrir diálogo para crear o editar una entrada
  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        // Store the ID from the nested aid object if it exists
        aid: entry.aid && entry.aid.id ? entry.aid.id : "",
        is_active: entry.is_active,
        start_date: entry.start_date ? dayjs(entry.start_date) : null,
        end_date: entry.end_date ? dayjs(entry.end_date) : null,
        is_successful: entry.is_successful,
        comments: entry.comments || "",
      });
    } else {
      setEditingEntry(null);
      setFormData({
        aid: "", // Reset to empty string for new entry
        is_active: true,
        start_date: null,
        end_date: null,
        is_successful: false,
        comments: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Actualizar datos del formulario al cambiar (for non-Autocomplete fields)
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Envío del formulario para crear o actualizar
  const handleFormSubmit = async () => {
    try {
      await formSchema.validate(formData, { abortEarly: false });
      setErrorMsg("");
    } catch (err) {
      if (err.inner?.length) {
        setErrorMsg(err.inner.map((e) => e.message).join(". "));
      } else {
        setErrorMsg(err.message);
      }
      return;
    }

    const formattedStartDate = formData.start_date
      ? formData.start_date.format("YYYY-MM-DD")
      : null;
    const formattedEndDate = formData.end_date
      ? formData.end_date.format("YYYY-MM-DD")
      : null;

    const endpoint = tAidHistoryEndpoint;
    const method = editingEntry ? "put" : "post";
    const url = editingEntry ? `${endpoint}${editingEntry.id}/` : endpoint;

    const payload = {
      candidate: candidateId,
      aid_id: formData.aid,
      is_active: formData.is_active,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      is_successful: formData.is_successful,
      comments: formData.comments,
    };

    try {
      if (editingEntry) {
        await axios.put(url, payload);
      } else {
        await axios.post(url, payload);
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error
      );
    }
  };

  // --- renderTable remains the same ---
  // Función para renderizar la tabla con el historial según el tipo
  const renderTable = (data) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Apoyo</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell>Fecha Inicio</TableCell>
            <TableCell>Fecha Fin</TableCell>
            <TableCell>¿Funcionó?</TableCell>
            <TableCell>Comentarios</TableCell>
            <TableCell>Editar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {/* Display logic based on the structure of the 'aid' object */}
                {
                  entry.aid?.name // Common case or fallback for TAid/CH?
                    ? selectedTab === 2 && entry.aid.group // CH specific?
                      ? `[${entry.aid.group.name}] ${entry.aid.name}`
                      : selectedTab === 0 &&
                        entry.aid.impediments &&
                        entry.aid.impediments.length > 0 // TAid specific?
                      ? `[${entry.aid.impediments
                          .map((imp) => imp.impediment.name)
                          .join(", ")}] ${entry.aid.name}`
                      : entry.aid.name // Default to name if specific structure doesn't match
                    : selectedTab === 1 && entry.aid?.item // SIS specific?
                    ? `[${entry.aid.item?.group?.name || "N/A"} - ${
                        entry.aid.item?.name || "N/A"
                      }] → ${entry.aid.sub_item}: ${entry.aid.descripcion}`
                    : "N/A" // Fallback if no name or sub_item
                }
              </TableCell>
              <TableCell>
                {entry.is_active ? (
                  <Tooltip title="Sí">
                    <CheckCircleIcon sx={{ color: "success.main" }} />
                  </Tooltip>
                ) : (
                  <Tooltip title="No">
                    <CancelIcon sx={{ color: "error.main" }} />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>{entry.start_date || "-"}</TableCell>
              <TableCell>{entry.end_date || "-"}</TableCell>
              <TableCell>
                {entry.is_successful ? (
                  <Tooltip title="Sí">
                    <CheckCircleIcon sx={{ color: "success.main" }} />
                  </Tooltip>
                ) : (
                  <Tooltip title="No">
                    <CancelIcon sx={{ color: "error.main" }} />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>{entry.comments}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenDialog(entry)}
                >
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );


  // Seleccionar los historiales y la lista de apoyos (solo Diagnóstica)
  const currentHistories = taidHistories;
  const currentAids = technicalAids;

  // Helper function to get the display label for an aid item (solo Diagnóstica)
  const getAidOptionLabel = (option) => {
    if (!option) return "";
    if (option.impediments && option.impediments.length > 0) {
      return `[${option.impediments
        .map((imp) => imp.impediment?.name || "N/A")
        .join(", ")}] ${option.name || "Unnamed Aid"}`;
    } else {
      return option.name || "Unnamed Aid";
    }
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          sx={{ mb: 2 }}
          endIcon={<AddCircleOutlineIcon />}
        >
          Agregar Entrada
        </Button>
        {loading ? <p>Loading...</p> : renderTable(currentHistories)}
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingEntry ? "Editar Entrada" : "Agregar Nueva Entrada"}
        </DialogTitle>
        <DialogContent>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}
          {/* === Autocomplete Component for selecting aid === */}
          <Autocomplete
            options={currentAids}
            getOptionLabel={getAidOptionLabel}
            value={
              currentAids.find((option) => option.id === formData.aid) || null
            }
            onChange={(event, newValue) => {
              setFormData((prevState) => ({
                ...prevState,
                aid: newValue ? newValue.id : "",
              }));
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {getAidOptionLabel(option)}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Apoyo" margin="dense" fullWidth />
            )}
            sx={{ mt: 1, mb: 1 }}
          />
          {/* === End of Autocomplete === */}

          <FormControlLabel
            control={
              <Checkbox
                name="is_active"
                checked={formData.is_active}
                onChange={handleFormChange}
              />
            }
            label="Activo"
          />
          <DatePicker
            margin="dense"
            label="Fecha Inicio"
            name="start_date"
            value={formData.start_date}
            onChange={(newValue) =>
              setFormData({ ...formData, start_date: newValue })
            }
            slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
          />
          <DatePicker
            margin="dense"
            label="Fecha Fin"
            name="end_date"
            value={formData.end_date}
            onChange={(newValue) =>
              setFormData({ ...formData, end_date: newValue })
            }
            slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="is_successful"
                checked={formData.is_successful}
                onChange={handleFormChange}
              />
            }
            label="Funcionó"
          />
          <TextField
            margin="dense"
            label="Comentarios"
            name="comments"
            fullWidth
            multiline
            rows={3}
            value={formData.comments}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleFormSubmit} variant="contained">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateAidHistoryPage;
