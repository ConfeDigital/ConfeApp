import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, Alert,
  Typography, Box, Grid
} from '@mui/material';
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Asignar empleo a {candidate?.nombre_completo}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Left panel */}
          <Grid item xs={12} md={5}>
            {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="job-select-label">Empleo</InputLabel>
              <Select
                labelId="job-select-label"
                value={selectedJob}
                label="Empleo"
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
            <DatePicker
              label="Fecha de Inicio"
              value={startDate}
              onChange={v => setStartDate(v)}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              sx={{ mt: 2 }}
            />

            {selectedJob && (
              <Box mt={1}>
                <Typography variant="h5" gutterBottom>Detalles del Empleo</Typography>
                <Typography>
                  <strong>Ubicación:</strong>{' '}
                  {(() => {
                    const loc = filteredJobs.find(j => j.id === selectedJob).location_details;
                    return `${loc.address_road} ${loc.address_number}, ${loc.address_municip}, ${loc.address_state}, CP ${loc.address_PC}`;
                  })()}
                </Typography>
                <Typography>
                  <strong>Empresa:</strong> {filteredJobs.find(j => j.id === selectedJob).company_name}
                </Typography>
                <Typography>
                  <strong>Descripción:</strong> {filteredJobs.find(j => j.id === selectedJob).job_description}
                </Typography>

                <Typography variant="subtitle1" mt={2}>Tiempos de viaje:</Typography>
                {modes.map(m => (
                  <Typography key={m.value}>
                    <strong>{m.label}:</strong> {durations[m.value] || 'Calculando...'}
                  </Typography>
                ))}

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="mode-select-label">Modo de Transporte</InputLabel>
                  <Select
                    labelId="mode-select-label"
                    value={routeMode}
                    label="Modo de Transporte"
                    onChange={e => setRouteMode(e.target.value)}
                  >
                    {modes.map(m => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {!showRoute && (
                  <Button variant="contained" sx={{ mt: 1 }} onClick={handleShowRoute}>
                    Mostrar ruta
                  </Button>
                )}
              </Box>
            )}
          </Grid>

          {/* Right panel: Map */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mt: 2 }}>
              {isLoaded && !loadError ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
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
                      <Box sx={{ maxWidth: 200 }}>
                        <Typography variant="subtitle2">
                          <strong>{availableJobs.find(j => j.id === hoveredMarker.id)?.name}</strong>
                        </Typography>
                        <Typography variant="body2">
                          {availableJobs.find(j => j.id === hoveredMarker.id)?.company_name}
                        </Typography>
                      </Box>
                    </InfoWindow>
                  )}

                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              ) : (
                <Typography>Cargando mapa...</Typography>
              )}
            </Box>

            {/* Legend */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="Seleccionado" />
                <Typography variant="body2">Empleo seleccionado</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="Disponible" />
                <Typography variant="body2">Empleos disponibles</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <img src="http://maps.google.com/mapfiles/ms/icons/homegardenbusiness.png" alt="Candidato" />
                <Typography variant="body2">Candidato</Typography>
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
