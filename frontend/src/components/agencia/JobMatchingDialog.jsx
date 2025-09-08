import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Chip, Card, CardContent,
  LinearProgress, Alert, CircularProgress, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem,
  ListItemText, Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Person as PersonIcon, Work as WorkIcon } from '@mui/icons-material';
import api from '../../api';

const JobMatchingDialog = ({ open, job, onClose }) => {
  const [matchingData, setMatchingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && job) {
      loadMatchingCandidates();
    }
  }, [open, job]);

  const loadMatchingCandidates = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/agencia/jobs/${job.id}/matching-candidates/`);
      setMatchingData(response.data);
    } catch (error) {
      console.error('Error al cargar candidatos matching:', error);
      setError('Error al cargar los candidatos que coinciden con este empleo');
    } finally {
      setLoading(false);
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

  const handleClose = () => {
    setMatchingData(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WorkIcon />
          Candidatos que Coinciden - {job?.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {matchingData && !loading && (
          <Box>
            {/* Información del empleo */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {matchingData.job.name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Empresa: {matchingData.job.company}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Habilidades Requeridas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {matchingData.habilidades_requeridas.map((habilidad) => (
                    <Chip
                      key={habilidad.id}
                      label={`${habilidad.nombre} (${habilidad.nivel_importancia})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Resultados de matching */}
            <Typography variant="h6" gutterBottom>
              Candidatos Encontrados ({matchingData.total_candidatos})
            </Typography>

            {matchingData.candidatos_matching.length === 0 ? (
              <Alert severity="info">
                No se encontraron candidatos que coincidan con las habilidades requeridas para este empleo.
              </Alert>
            ) : (
              <Box>
                {matchingData.candidatos_matching.map((candidato, index) => (
                  <Card key={candidato.candidato.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6">
                            {candidato.candidato.nombre}
                          </Typography>
                          <Typography color="text.secondary">
                            CURP: {candidato.candidato.curp}
                          </Typography>
                          <Typography color="text.secondary">
                            Email: {candidato.candidato.email}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={getMatchingLabel(candidato.matching_percentage)}
                            color={getMatchingColor(candidato.matching_percentage)}
                            variant="filled"
                          />
                          <Typography variant="h6" sx={{ mt: 1 }}>
                            {candidato.matching_percentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={candidato.matching_percentage}
                            color={getMatchingColor(candidato.matching_percentage)}
                            sx={{ mt: 1, width: 100 }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {candidato.habilidades_coincidentes_count} de {candidato.total_habilidades_requeridas} habilidades requeridas
                      </Typography>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2">
                            Habilidades Coincidentes ({candidato.habilidades_coincidentes.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {candidato.habilidades_coincidentes.map((habilidad, idx) => (
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

                      {candidato.habilidades_faltantes.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="error">
                              Habilidades Faltantes ({candidato.habilidades_faltantes.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {candidato.habilidades_faltantes.map((habilidad, idx) => (
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
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={handleClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobMatchingDialog;
