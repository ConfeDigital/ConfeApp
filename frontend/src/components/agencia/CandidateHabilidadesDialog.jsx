import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Box, Typography, Chip, Autocomplete, Divider, Alert
} from '@mui/material';
import api from '../../api';

const CandidateHabilidadesDialog = ({ open, candidate, onClose, onSubmit }) => {
  const [habilidades, setHabilidades] = useState([]);
  const [candidatoHabilidades, setCandidatoHabilidades] = useState([]);
  const [selectedHabilidad, setSelectedHabilidad] = useState(null);
  const [nivelCompetencia, setNivelCompetencia] = useState('basico');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nivelesCompetencia = [
    { value: 'basico', label: 'Básico' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
    { value: 'experto', label: 'Experto' }
  ];

  useEffect(() => {
    if (open && candidate) {
      loadHabilidades();
      loadCandidatoHabilidades();
    }
  }, [open, candidate]);

  const loadHabilidades = async () => {
    try {
      const response = await api.get('/api/agencia/habilidades/');
      setHabilidades(response.data);
    } catch (error) {
      console.error('Error al cargar habilidades:', error);
      setError('Error al cargar las habilidades disponibles');
    }
  };

  const loadCandidatoHabilidades = async () => {
    try {
      const response = await api.get(`/api/agencia/candidato-habilidades/?candidato_id=${candidate.id}`);
      setCandidatoHabilidades(response.data);
    } catch (error) {
      console.error('Error al cargar habilidades del candidato:', error);
    }
  };

  const handleAddHabilidad = async () => {
    if (!selectedHabilidad) {
      setError('Por favor selecciona una habilidad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        candidato: candidate.id,
        habilidad: selectedHabilidad.id,
        nivel_competencia: nivelCompetencia,
        observaciones: observaciones
      };

      await api.post('/api/agencia/candidato-habilidades/', payload);
      
      // Recargar las habilidades del candidato
      await loadCandidatoHabilidades();
      
      // Limpiar formulario
      setSelectedHabilidad(null);
      setNivelCompetencia('basico');
      setObservaciones('');
      
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Error al agregar habilidad:', error);
      setError('Error al agregar la habilidad');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHabilidad = async (habilidadId) => {
    try {
      await api.delete(`/api/agencia/candidato-habilidades/${habilidadId}/`);
      await loadCandidatoHabilidades();
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Error al eliminar habilidad:', error);
      setError('Error al eliminar la habilidad');
    }
  };

  const handleClose = () => {
    setSelectedHabilidad(null);
    setNivelCompetencia('basico');
    setObservaciones('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        Evaluar Habilidades - {candidate?.user?.first_name} {candidate?.user?.last_name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Habilidades Evaluadas
        </Typography>
        
        {candidatoHabilidades.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Este candidato no tiene habilidades evaluadas aún.
          </Typography>
        ) : (
          <Box sx={{ mb: 3 }}>
            {candidatoHabilidades.map((ch) => (
              <Chip
                key={ch.id}
                label={`${ch.habilidad_nombre} - ${ch.nivel_competencia}`}
                onDelete={() => handleRemoveHabilidad(ch.id)}
                color="primary"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Agregar Nueva Habilidad
        </Typography>

        <Autocomplete
          options={habilidades}
          getOptionLabel={(option) => `${option.nombre} (${option.categoria})`}
          value={selectedHabilidad}
          onChange={(event, newValue) => {
            setSelectedHabilidad(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Habilidad"
              placeholder="Buscar habilidad para evaluar"
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Nivel de Competencia</InputLabel>
          <Select
            value={nivelCompetencia}
            onChange={(e) => setNivelCompetencia(e.target.value)}
            label="Nivel de Competencia"
          >
            {nivelesCompetencia.map((nivel) => (
              <MenuItem key={nivel.value} value={nivel.value}>
                {nivel.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Notas adicionales sobre la evaluación de esta habilidad"
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={handleClose}>
          Cerrar
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAddHabilidad}
          disabled={loading || !selectedHabilidad}
        >
          {loading ? 'Agregando...' : 'Agregar Habilidad'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateHabilidadesDialog;
