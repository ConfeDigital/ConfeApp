// src/components/agencia/AssignJobModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, Alert, 
  FormControlLabel, Checkbox, Typography, Box, Grid, Paper,
  Chip, LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { ExpandMore as ExpandMoreIcon, Star as StarIcon } from '@mui/icons-material';
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
  const [matchingData, setMatchingData] = useState(null);
  const [loadingMatching, setLoadingMatching] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedJob('');
      setStartDate(null);
      setAlert(null);
      setSameMunicipio(true);
      setPostalFilter(0);
      setMatchingData(null);
    }
  }, [open]);

  // Cargar matching cuando se selecciona un empleo
  useEffect(() => {
    if (selectedJob && candidate) {
      loadMatchingData();
    }
  }, [selectedJob, candidate]);

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

  const loadMatchingData = async () => {
    setLoadingMatching(true);
    try {
      const response = await api.get(`/api/agencia/candidatos/${candidate.id}/matching-jobs/`);
      const matchingJobs = response.data.empleos_matching || [];
      const selectedJobMatching = matchingJobs.find(job => job.empleo.id === parseInt(selectedJob));
      setMatchingData(selectedJobMatching);
    } catch (error) {
      console.error('Error al cargar matching:', error);
      setMatchingData(null);
    } finally {
      setLoadingMatching(false);
    }
  };

  const getMatchingColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getMatchingLabel = (percentage) => {
    if (percentage >= 80) return 'Excelente coincidencia';
    if (percentage >= 60) return 'Buena coincidencia';
    if (percentage >= 40) return 'Coincidencia moderada';
    return 'Coincidencia baja';
  };

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
          {/* Derecha: detalles y matching */}
          <Grid item xs={12} md={7}>
            {selectedJob && (()=> {
              const job = availableJobs.find(j=>j.id===selectedJob);
              const loc = job.location_details;
              return (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Detalles del Empleo</Typography>
                  <Typography><strong>Empresa:</strong> {job.company_name}</Typography>
                  <Typography><strong>Descripción:</strong> {job.job_description}</Typography>
                  {job.horario && <Typography><strong>Horario:</strong> {job.horario}</Typography>}
                  {job.sueldo_base && <Typography><strong>Sueldo Base:</strong> ${job.sueldo_base.toLocaleString()}</Typography>}
                  {job.prestaciones && <Typography><strong>Prestaciones:</strong> {job.prestaciones}</Typography>}
                  {loc && <>
                    <Typography><strong>Municipio:</strong> {loc.address_municip}</Typography>
                    <Typography><strong>CP:</strong> {loc.address_PC}</Typography>
                    <Typography><strong>Calle:</strong> {loc.address_road} #{loc.address_number}</Typography>
                  </>}
                  
                  {/* Habilidades requeridas */}
                  {job.habilidades_requeridas && job.habilidades_requeridas.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Habilidades Requeridas:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {job.habilidades_requeridas.map((habilidad, index) => (
                          <Chip
                            key={index}
                            label={`${habilidad.habilidad_nombre} (${habilidad.nivel_importancia})`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Análisis de Matching */}
                  <Typography variant="subtitle1" gutterBottom>
                    <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Análisis de Coincidencia
                  </Typography>
                  
                  {loadingMatching ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <LinearProgress sx={{ flexGrow: 1 }} />
                      <Typography variant="body2">Analizando coincidencias...</Typography>
                    </Box>
                  ) : matchingData ? (
                    <Box>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Chip
                          label={getMatchingLabel(matchingData.matching_percentage)}
                          color={getMatchingColor(matchingData.matching_percentage)}
                          variant="filled"
                        />
                        <Typography variant="h6">
                          {matchingData.matching_percentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={matchingData.matching_percentage}
                          color={getMatchingColor(matchingData.matching_percentage)}
                          sx={{ flexGrow: 1 }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {matchingData.habilidades_coincidentes_count} de {matchingData.total_habilidades_requeridas} habilidades requeridas
                      </Typography>

                      {matchingData.habilidades_coincidentes.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                              Habilidades Coincidentes ({matchingData.habilidades_coincidentes.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {matchingData.habilidades_coincidentes.map((habilidad, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={habilidad.habilidad}
                                    secondary={`Requerido: ${habilidad.nivel_requerido} | Candidato: ${habilidad.nivel_candidato} | Puntuación: ${habilidad.puntuacion}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {matchingData.habilidades_faltantes.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="error">
                              Habilidades Faltantes ({matchingData.habilidades_faltantes.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {matchingData.habilidades_faltantes.map((habilidad, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={habilidad.habilidad}
                                    secondary={`Requerido: ${habilidad.nivel_requerido}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      No se pudo cargar el análisis de coincidencias.
                    </Typography>
                  )}
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
