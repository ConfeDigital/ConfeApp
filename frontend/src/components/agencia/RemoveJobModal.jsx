// src/components/agencia/RemoveJobModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import api from '../../api';

const RemoveJobModal = ({ open, candidate, onClose, onRemoved }) => { // Removed jobComments prop
  const [endDate, setEndDate] = useState(null);
  // Renamed state to reflect backend expectation (comment_for_removal)
  const [removalComment, setRemovalComment] = useState("");
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (open) {
      setEndDate(null);
      setRemovalComment(""); // Reset comment field on open
      setAlert(null);
    }
  }, [open]);

  const handleRemove = async () => {
    // Basic validation
    if (!endDate) {
      setAlert({ severity: "error", message: "Debes seleccionar la fecha de finalización." });
      return;
    }
    // Convert to dayjs object before comparison if it's not already
    const selectedEndDate = dayjs(endDate);
    const jobStartDate = dayjs(candidate.current_job_start);

    if (selectedEndDate.isBefore(jobStartDate, 'day')) { // Compare only dates, ignoring time
      setAlert({ severity: "error", message: "La fecha de finalización debe ser posterior o igual a la fecha de inicio." });
      return;
    }

    try {
      await api.patch(`/api/candidatos/employment/remove/${candidate.id}/`, {
        end_date: selectedEndDate.format('YYYY-MM-DD'), // Use selectedEndDate
        comment_for_removal: removalComment // Send the new field name
      });
      setAlert({ severity: "success", message: "Empleo removido correctamente." });
      onRemoved(); // Trigger re-fetch in parent
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error removing job", error.response?.data || error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] || "Hubo un error al remover el empleo.";
      setAlert({ severity: "error", message: errorMessage });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Quitar Empleo de {candidate?.nombre_completo || 'Candidato'}</DialogTitle>
      <DialogContent>
        {alert && (
          <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}
        <Typography variant='h5'>
          Empleo Actual: {candidate?.current_job?.name || 'N/A'}
        </Typography>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Fecha de Inicio: {candidate ? dayjs(candidate.current_job_start).format('DD-MM-YYYY') : 'N/A'}
        </Typography>
        <DatePicker
          label="Fecha de Finalización"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
          sx={{ mt: 2 }}
        />
        <TextField
          label="Comentarios de remoción (opcional)" // Changed label for clarity
          value={removalComment} // Use new state variable
          onChange={(e) => setRemovalComment(e.target.value)} // Update new state variable
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleRemove} variant="contained" color="primary">Quitar Empleo</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveJobModal;