// src/components/agencia/AssignCandidateModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import api from '../../api';

const AssignCandidateModal = ({ open, job, onClose, onAssigned }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [alert, setAlert] = useState(null); // { severity: "error" | "success", message: string }

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/api/candidatos/lista-agencia/?agency_state=Bol');
      setCandidates(response.data);
    } catch (error) {
      console.error("Error fetching candidates", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCandidates();
      setSelectedCandidate('');
      setStartDate(null);
      setAlert(null);
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selectedCandidate || !startDate) {
      setAlert({ severity: "error", message: "Debes seleccionar un candidato y establecer la fecha de inicio." });
      return;
    }
    try {
      await api.patch(`/api/candidatos/employment/${selectedCandidate}/`, {
        current_job: job.id,
        start_date: startDate.format('YYYY-MM-DD')
      });
      setAlert({ severity: "success", message: "Candidato asignado al empleo correctamente." });
      onAssigned(); // Refresh candidate list if needed
      // Optionally close the modal after a short delay so the user can see the success alert
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error assigning candidate", error.response?.data || error);
      setAlert({ severity: "error", message: "Hubo un error al asignar el candidato." });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Asignar Candidato al Empleo: {job.name}</DialogTitle>
      <DialogContent>
        {alert && (
          <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="candidate-select-label">Candidato (Bolsa de Trabajo)</InputLabel>
          <Select
            labelId="candidate-select-label"
            value={selectedCandidate}
            label="Candidato (Bolsa de Trabajo)"
            onChange={(e) => setSelectedCandidate(e.target.value)}
          >
            {candidates.map((cand) => (
              <MenuItem key={cand.id} value={cand.id}>
                {cand.nombre_completo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DatePicker
          label="Fecha de Inicio"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleAssign} variant="contained" color="primary">
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignCandidateModal;
