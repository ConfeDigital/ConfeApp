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

const CandidateMatchingDialog = ({ open, candidate, onClose }) => {
  const [matchingData, setMatchingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && candidate) {
      loadMatchingJobs();
    }
  }, [open, candidate]);

  const loadMatchingJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/agencia/candidatos/${candidate.id}/matching-jobs/`);
      setMatchingData(response.data);
    } catch (error) {
      console.error('Error al cargar empleos matching:', error);
      setError('Error al cargar los empleos que coinciden con este candidato');
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
          <PersonIcon />
          Empleos que Coinciden - {candidate?.user?.first_name} {candidate?.user?.last_name}
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
            {/* Información del candidato */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {matchingData.candidato.nombre}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  CURP: {matchingData.candidato.curp}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Habilidades Evaluadas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {matchingData.habilidades_evaluadas.map((habilidad) => (
                    <Chip
                      key={habilidad.id}
                      label={`${habilidad.nombre} (${habilidad.nivel_competencia})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Resultados de matching */}
            <Typography variant="h6" gutterBottom>
              Empleos Encontrados ({matchingData.total_empleos})
            </Typography>

            {matchingData.empleos_matching.length === 0 ? (
              <Alert severity="info">
                No se encontraron empleos que coincidan con las habilidades de este candidato.
              </Alert>
            ) : (
              <Box>
                {matchingData.empleos_matching.map((empleo, index) => (
                  <Card key={empleo.empleo.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6">
                            {empleo.empleo.name}
                          </Typography>
                          <Typography color="text.secondary">
                            Empresa: {empleo.empleo.company}
                          </Typography>
                          {empleo.empleo.location && (
                            <Typography color="text.secondary">
                              Ubicación: {empleo.empleo.location}
                            </Typography>
                          )}
                          {empleo.empleo.vacancies && (
                            <Typography color="text.secondary">
                              Vacantes: {empleo.empleo.vacancies}
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={getMatchingLabel(empleo.matching_percentage)}
                            color={getMatchingColor(empleo.matching_percentage)}
                            variant="filled"
                          />
                          <Typography variant="h6" sx={{ mt: 1 }}>
                            {empleo.matching_percentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={empleo.matching_percentage}
                            color={getMatchingColor(empleo.matching_percentage)}
                            sx={{ mt: 1, width: 100 }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {empleo.habilidades_coincidentes_count} de {empleo.total_habilidades_requeridas} habilidades requeridas
                      </Typography>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2">
                            Habilidades Coincidentes ({empleo.habilidades_coincidentes.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {empleo.habilidades_coincidentes.map((habilidad, idx) => (
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

                      {empleo.habilidades_faltantes.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="error">
                              Habilidades Faltantes ({empleo.habilidades_faltantes.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {empleo.habilidades_faltantes.map((habilidad, idx) => (
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

export default CandidateMatchingDialog;
