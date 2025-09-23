import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, Alert,
  Typography, Box, Grid, Chip, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Star as StarIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  GoogleMap, Marker, InfoWindow,
  DirectionsRenderer, useJsApiLoader
} from '@react-google-maps/api';
import api from '../../api';

// Haversine formula to compute distance between two coordinates.
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: 8 };
const defaultCenter = { lat: 19.398658121403923, lng: -99.21102574697615 };

// Modos de transporte disponibles
const modes = [
  { label: 'Conducción', value: 'DRIVING' },
  { label: 'Caminando', value: 'WALKING' },
  { label: 'Bicicleta', value: 'BICYCLING' },
  { label: 'Transporte público', value: 'TRANSIT' }
];

const AssignJobModal = ({ open, candidate, availableJobs, onClose, onAssigned }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [alert, setAlert] = useState(null);
  const [durations, setDurations] = useState({});
  const [directions, setDirections] = useState(null);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeMode, setRouteMode] = useState('DRIVING');
  const [matchingData, setMatchingData] = useState(null);
  const [loadingMatching, setLoadingMatching] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    language: 'es'
  });

  // Reset modal state on open
  useEffect(() => {
    if (open) {
      setSelectedJob('');
      setStartDate(null);
      setAlert(null);
      setDurations({});
      setDirections(null);
      setShowRoute(false);
      setRouteMode('DRIVING');
      setMatchingData(null);
    }
  }, [open]);

  // Filter & sort jobs by distance
  useEffect(() => {
    if (candidate?.domicile) {
      const { address_lat, address_lng } = candidate.domicile;
      const enriched = availableJobs.map(job => {
        const loc = job.location_details;
        if (loc?.address_lat && loc?.address_lng) {
          const dist = haversineDistance(
            address_lat, address_lng,
            loc.address_lat, loc.address_lng
          );
          return { ...job, distance: dist };
        }
        return { ...job, distance: null };
      });
      const sorted = enriched.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
      setFilteredJobs(sorted);
    } else {
      setFilteredJobs([]);
    }
  }, [candidate, availableJobs]);

  // Create markers
  useEffect(() => {
    if (!isLoaded) return;
    const geocoder = new window.google.maps.Geocoder();
    const jobPromises = filteredJobs.map(job =>
      getCoordinates(job.location_details, geocoder)
        .then(pos => ({ id: job.id, position: pos }))
        .catch(() => null)
    );
    const candPromise = candidate?.domicile
      ? getCoordinates(candidate.domicile, geocoder)
        .then(pos => ({ id: 'cand', position: pos }))
        .catch(() => null)
      : Promise.resolve(null);
    Promise.all([...jobPromises, candPromise])
      .then(arr => setMarkers(arr.filter(x => x)));
  }, [isLoaded, filteredJobs, candidate]);

  // Fetch durations for all modes on job change
  useEffect(() => {
    const fetchAll = async () => {
      if (!selectedJob || !candidate?.domicile) return;
      const job = filteredJobs.find(j => j.id === selectedJob);
      if (!job?.location_details) return;
      const origin = {
        lat: parseFloat(candidate.domicile.address_lat),
        lng: parseFloat(candidate.domicile.address_lng)
      };
      const destination = {
        lat: parseFloat(job.location_details.address_lat),
        lng: parseFloat(job.location_details.address_lng)
      };
      const results = await Promise.all(
        modes.map(async m => {
          const res = await fetchDirections(origin, destination, m.value);
          const dur = res ? res.routes[0].legs[0].duration.text : 'N/D';
          return [m.value, dur];
        })
      );
      setDurations(Object.fromEntries(results));
      setShowRoute(false);
      setDirections(null);
    };
    if (isLoaded) fetchAll();
  }, [selectedJob, candidate, filteredJobs, isLoaded]);

  // Refresh route if mode changes and route is visible
  useEffect(() => {
    if (showRoute) handleShowRoute();
  }, [routeMode]);

  // Show route in selected mode
  const handleShowRoute = async () => {
    if (!selectedJob || !candidate?.domicile) return;
    const job = filteredJobs.find(j => j.id === selectedJob);
    const origin = {
      lat: parseFloat(candidate.domicile.address_lat),
      lng: parseFloat(candidate.domicile.address_lng)
    };
    const destination = {
      lat: parseFloat(job.location_details.address_lat),
      lng: parseFloat(job.location_details.address_lng)
    };
    const result = await fetchDirections(origin, destination, routeMode);
    if (result) {
      setDirections(result);
      setShowRoute(true);
    }
  };

  // Cargar matching cuando se selecciona un empleo
  useEffect(() => {
    if (selectedJob && candidate) {
      loadMatchingData();
    }
  }, [selectedJob, candidate]);

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

  // Assign job
  const handleAssign = async () => {
    if (!selectedJob) return setAlert({ severity: 'error', message: 'Selecciona un empleo.' });
    if (!startDate) return setAlert({ severity: 'error', message: 'Selecciona una fecha de inicio.' });
    try {
      await api.patch(
        `/api/candidatos/employment/${candidate.id}/`,
        { current_job: selectedJob, start_date: startDate.format('YYYY-MM-DD') }
      );
      setAlert({ severity: 'success', message: 'Empleo asignado correctamente.' });
      onAssigned();
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
      setAlert({ severity: 'error', message: 'Error al asignar el empleo.' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Asignar empleo a {candidate?.nombre_completo}</DialogTitle>
      <DialogContent sx={{ 
        height: { xs: '90vh', md: '85vh' }, 
        overflow: { xs: 'auto', md: 'hidden' },
        p: { xs: 2, md: 3 }
      }}>
        {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}
        
        {/* Job Selection Section */}
        <Box sx={{ mb: 3, mt: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="job-select-label">Seleccionar Empleo</InputLabel>
                <Select
                  labelId="job-select-label"
                  value={selectedJob}
                  label="Seleccionar Empleo"
                  onChange={e => setSelectedJob(e.target.value)}
                >
                  {filteredJobs.map(job => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.name} — {job.company_name}
                      {job.distance != null && ` (${job.distance.toFixed(1)} km)`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Fecha de Inicio"
                value={startDate}
                onChange={v => setStartDate(v)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Main Content Area */}
        <Grid container spacing={3} sx={{ 
          height: { xs: 'auto', md: 'calc(100% - 100px)' },
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Left panel: Job Details and Matching - Scrollable */}
          <Grid item xs={12} md={6} sx={{ 
            height: { xs: 'auto', md: '100%' }, 
            overflow: { xs: 'visible', md: 'auto' }, 
            pr: { xs: 0, md: 1 },
            mb: { xs: 2, md: 0 },
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0,0,0,0.3)',
            },
          }}>

            {selectedJob && (
              <Box>
                {(() => {
                  const job = filteredJobs.find(j => j.id === selectedJob);
                  const loc = job.location_details;
                  return (
                    <>
                      {/* Job Overview Card */}
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2, 
                        mb: 3,
                        bgcolor: 'background.paper'
                      }}>
                        <Typography variant="h6" gutterBottom color="primary">
                          {job.name}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          {job.company_name}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Ubicación:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {`${loc.address_road} ${loc.address_number}, ${loc.address_municip}`}
                            </Typography>
                            <Typography variant="body2">
                              {`${loc.address_state}, CP ${loc.address_PC}`}
                            </Typography>
                          </Grid>
                          {job.distance != null && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Distancia:</strong>
                              </Typography>
                              <Typography variant="body2">
                                {job.distance.toFixed(1)} km
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        {/* Job Details Grid */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                          {job.horario && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Horario:</strong>
                              </Typography>
                              <Typography variant="body2">{job.horario}</Typography>
                            </Grid>
                          )}
                          {job.sueldo_base && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Sueldo Base:</strong>
                              </Typography>
                              <Typography variant="body2">
                                ${job.sueldo_base.toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {job.prestaciones && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Prestaciones:</strong>
                              </Typography>
                              <Typography variant="body2">{job.prestaciones}</Typography>
                            </Grid>
                          )}
                        </Grid>

                        {/* Job Description */}
                        {job.job_description && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Descripción:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {job.job_description}
                            </Typography>
                          </Box>
                        )}

                        {/* Required Skills */}
                        {job.habilidades_requeridas && job.habilidades_requeridas.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Habilidades Requeridas:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {job.habilidades_requeridas.map((habilidad, index) => (
                                <Chip
                                  key={index}
                                  label={`${habilidad.habilidad_nombre} (${habilidad.nivel_importancia})`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </>
                  );
                })()}

                {/* Matching Analysis Card */}
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  mb: 3,
                  bgcolor: 'background.paper'
                }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <StarIcon color="primary" />
                    <Typography variant="h6">
                      Análisis de Coincidencia
                    </Typography>
                  </Box>

                  {loadingMatching ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <LinearProgress sx={{ flexGrow: 1 }} />
                      <Typography variant="body2">Analizando coincidencias...</Typography>
                    </Box>
                  ) : matchingData ? (
                    <Box>
                      {/* Matching Score Display */}
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: getMatchingColor(matchingData.matching_percentage) === 'success' ? 'success.light' : 
                                getMatchingColor(matchingData.matching_percentage) === 'warning' ? 'warning.light' : 'error.light',
                        mb: 2
                      }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="h4" fontWeight="bold">
                            {matchingData.matching_percentage}%
                          </Typography>
                          <Chip
                            label={getMatchingLabel(matchingData.matching_percentage)}
                            color={getMatchingColor(matchingData.matching_percentage)}
                            variant="filled"
                            size="medium"
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={matchingData.matching_percentage}
                          color={getMatchingColor(matchingData.matching_percentage)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                          {matchingData.habilidades_coincidentes_count} de {matchingData.total_habilidades_requeridas} habilidades requeridas
                        </Typography>
                      </Box>

                      {/* Skills Details */}
                      {matchingData.habilidades_coincidentes.length > 0 && (
                        <Accordion sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" color="success.main">
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
                            <Typography variant="subtitle2" color="error.main">
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

                {/* Travel Times and Route Controls */}
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Información de Viaje
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {modes.map(m => (
                      <Grid item xs={6} sm={3} key={m.value}>
                        <Box sx={{ textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {m.label}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {durations[m.value] || 'Calculando...'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="mode-select-label">Modo de Transporte para Ruta</InputLabel>
                    <Select
                      labelId="mode-select-label"
                      value={routeMode}
                      label="Modo de Transporte para Ruta"
                      onChange={e => setRouteMode(e.target.value)}
                    >
                      {modes.map(m => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!showRoute && (
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={handleShowRoute}
                      startIcon={<StarIcon />}
                    >
                      Mostrar Ruta en Mapa
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Right panel: Map - Fixed */}
          <Grid item xs={12} md={6} sx={{ 
            height: { xs: '400px', md: '100%' },
            minHeight: { xs: '400px', md: 'auto' }
          }}>
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2, 
              overflow: 'hidden',
              height: { xs: '400px', md: '100%' },
              position: { xs: 'relative', md: 'sticky' },
              top: 0
            }}>
              {/* Map Header */}
              <Box sx={{ 
                p: 1.5, 
                bgcolor: 'background.paper', 
                borderBottom: '1px solid', 
                borderColor: 'divider' 
              }}>
                <Typography variant="h6" color="primary">
                  Mapa de Ubicaciones
                </Typography>
              </Box>

              {/* Map Container */}
              <Box sx={{ 
                height: { xs: 'calc(400px - 60px)', md: 'calc(100% - 60px)' }, 
                position: 'relative',
                minHeight: { xs: '340px', md: 'auto' }
              }}>
                {isLoaded && !loadError ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={
                      selectedJob
                        ? markers.find(m => m.id === selectedJob)?.position
                        : markers.find(m => m.id === 'cand')?.position || defaultCenter
                    }
                    zoom={12}
                  >
                    {markers.map(m => (
                      <Marker
                        key={m.id}
                        position={m.position}
                        icon={
                          m.id === 'cand'
                            ? 'http://maps.google.com/mapfiles/ms/icons/homegardenbusiness.png'
                            : m.id === selectedJob
                              ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                              : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        }
                        onClick={() => {
                          if (m.id !== 'cand') setSelectedJob(m.id);
                          setHoveredMarker(m);
                        }}
                      />
                    ))}

                    {hoveredMarker && hoveredMarker.id !== 'cand' && (
                      <InfoWindow
                        position={hoveredMarker.position}
                        onCloseClick={() => setHoveredMarker(null)}
                      >
                        <Box sx={{ maxWidth: 220 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <img
                              src={availableJobs.find(j => j.id === hoveredMarker.id)?.company_logo}
                              alt="Company Logo"
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "contain",
                                borderRadius: "50%",
                              }}
                            />
                            <Typography variant="body2" color="black">
                              {availableJobs.find(j => j.id === hoveredMarker.id)?.company_name}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" color="black" fontWeight="bold">
                            {availableJobs.find(j => j.id === hoveredMarker.id)?.name}
                          </Typography>
                        </Box>
                      </InfoWindow>
                    )}

                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    bgcolor: 'grey.100'
                  }}>
                    <Typography>Cargando mapa...</Typography>
                  </Box>
                )}
              </Box>

              {/* Legend */}
              <Box sx={{ 
                p: 1.5, 
                bgcolor: 'background.paper', 
                borderTop: '1px solid', 
                borderColor: 'divider',
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img src="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="Seleccionado" width="16" height="16" />
                  <Typography variant="caption">Seleccionado</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="Disponible" width="16" height="16" />
                  <Typography variant="caption">Disponibles</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img src="http://maps.google.com/mapfiles/ms/icons/homegardenbusiness.png" alt="Candidato" width="16" height="16" />
                  <Typography variant="caption">Candidato</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleAssign} variant="contained" disabled={!selectedJob}>
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignJobModal;

// Helper: obtener coordenadas de una ubicación
async function getCoordinates(loc, geocoder) {
  return new Promise((resolve, reject) => {
    const latNum = parseFloat(loc.address_lat);
    const lngNum = parseFloat(loc.address_lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      return resolve({ lat: latNum, lng: lngNum });
    }
    const address = `${loc.address_road} ${loc.address_number}, CP ${loc.address_PC}, ${loc.address_municip}, ${loc.address_state}`;
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        resolve({ lat: lat(), lng: lng() });
      } else {
        reject(new Error(`Geocode failed for address: ${address} - ${status}`));
      }
    });
  });
}

// fetchDirections con modo dinámico
async function fetchDirections(origin, destination, travelMode = 'DRIVING') {
  return new Promise(resolve => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.DirectionsTravelMode[travelMode] || window.google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK || status === 'OK') {
          resolve(result);
        } else {
          console.error('DirectionsService failed:', status);
          resolve(null);
        }
      }
    );
  });
}
