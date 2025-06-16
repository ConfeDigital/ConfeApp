// src/components/agencia/AssignJobModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, Alert, 
  FormControlLabel, Checkbox, Typography, Box, Grid, Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import api from '../../api';

const postalFilterOptions = [
  { value: 0, label: 'Ninguno' },
  { value: 'exact', label: 'Exacto' },
  { value: 3, label: '3 dígitos' },
  { value: 4, label: '4 dígitos' },
];

const AssignJobModal = ({ open, candidate, availableJobs, onClose, onAssigned }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [alert, setAlert] = useState(null);

  // Recomendaciones siempre visibles
  const [sameMunicipio, setSameMunicipio] = useState(true);
  const [postalFilter, setPostalFilter] = useState(0);

  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    if (open) {
      setSelectedJob('');
      setStartDate(null);
      setAlert(null);
      setSameMunicipio(true);
      setPostalFilter(0);
    }
  }, [open]);

  // Filtrado
  useEffect(() => {
    if (candidate?.domicile) {
      const { address_municip, address_PC } = candidate.domicile;
      let arr = availableJobs.filter(job => {
        if (!job.location_details) return false;
        const lm = job.location_details.address_municip;
        const pc = job.location_details.address_PC;
        let ok = true;
        if (sameMunicipio) ok = ok && (lm === address_municip);
        if (postalFilter === 'exact') ok = ok && (pc === address_PC);
        else if (postalFilter > 0) ok = ok && (pc?.slice(0, postalFilter) === address_PC?.slice(0, postalFilter));
        return ok;
      });
      // Ordenar por cercanía en CP (valor numérico absoluto menor)
      arr.sort((a,b)=>{
        const pa = Number(a.location_details.address_PC);
        const pb = Number(b.location_details.address_PC);
        const ca = Number(address_PC);
        return Math.abs(pa - ca) - Math.abs(pb - ca);
      });
      setFilteredJobs(arr);
    } else {
      setFilteredJobs(availableJobs);
    }
  }, [sameMunicipio, postalFilter, candidate, availableJobs]);

  const handleAssign = async () => {
    if (!selectedJob || !startDate) {
      setAlert({ severity: 'error', message: 'Selecciona empleo y fecha de inicio.' });
      return;
    }
    try {
      await api.patch(`/api/candidatos/employment/${candidate.id}/`, {
        current_job: selectedJob,
        start_date: startDate.format('YYYY-MM-DD')
      });
      setAlert({ severity: 'success', message: 'Empleo asignado correctamente.' });
      onAssigned();
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
      setAlert({ severity: 'error', message: 'Error al asignar el empleo.' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Asignar Empleo a {candidate?.nombre_completo}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Izquierda */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p:2, mb:2 }} elevation={1}>
              <Typography variant="subtitle1" gutterBottom>Filtros</Typography>
              <FormControlLabel
                control={<Checkbox checked={sameMunicipio} onChange={e=>setSameMunicipio(e.target.checked)}/>}
                label="Mismo Municipio"
              />
              <FormControl fullWidth sx={{ mt:1 }}>
                <InputLabel>Código Postal</InputLabel>
                <Select
                  value={postalFilter}
                  label="Código Postal"
                  onChange={e=>setPostalFilter(e.target.value)}
                >
                  {postalFilterOptions.map(o=>(
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
            {alert && <Alert severity={alert.severity} sx={{ mb:2 }}>{alert.message}</Alert>}
            <FormControl fullWidth sx={{ mt:1 }}>
              <InputLabel>Empleo</InputLabel>
              <Select
                value={selectedJob}
                  label="Empleo"
                  onChange={e=>setSelectedJob(e.target.value)}
              >
                {filteredJobs.map(job=>(
                  <MenuItem key={job.id} value={job.id}>
                    {job.name} — {job.company_name} (CP {job.location_details.address_PC})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Fecha de Inicio"
              value={startDate}
              onChange={v=>setStartDate(v)}
              slotProps={{ textField:{fullWidth:true,margin:'dense'} }}
              sx={{ mt:2 }}
            />
          </Grid>
          {/* Derecha: detalles sin mapa */}
          <Grid item xs={12} md={7}>
            {selectedJob && (()=> {
              const job = availableJobs.find(j=>j.id===selectedJob);
              const loc = job.location_details;
              return (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Detalles del Empleo</Typography>
                  <Typography><strong>Empresa:</strong> {job.company_name}</Typography>
                  <Typography><strong>Descripción:</strong> {job.job_description}</Typography>
                  {loc && <>
                    <Typography><strong>Municipio:</strong> {loc.address_municip}</Typography>
                    <Typography><strong>CP:</strong> {loc.address_PC}</Typography>
                    <Typography><strong>Calle:</strong> {loc.address_road} #{loc.address_number}</Typography>
                  </>}
                </Box>
              )
            })()}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleAssign} variant="contained">Asignar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignJobModal;
