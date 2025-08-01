import React, { useEffect, useRef, useState } from 'react';
import {
  Grid2 as Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Button,
  Box
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { useFormContext, Controller } from 'react-hook-form';
import {
  useJsApiLoader,
  Autocomplete,
  GoogleMap,
  Marker
} from '@react-google-maps/api';
import axios from '../api';

const libraries = ['places'];
const round6 = n => Math.round(n * 1e6) / 1e6;

export default function AddressAutoCompleteForm({ prefix, setDomicileFormLoaded }) {
  const { control, setValue, watch } = useFormContext();
  const ref = useRef(null);
  const postal = watch(`${prefix}.address_PC`);
  const lat = watch(`${prefix}.address_lat`);
  const lng = watch(`${prefix}.address_lng`);
  const [colonias, setColonias] = useState([]);
  const [addressSearched, setAddressSearched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [markerPosition, setMarkerPosition] = useState({ lat: 0, lng: 0 });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'es'
  });

  const residenceType = watch("residence_type");

  const onPlaceChanged = () => {
    const place = ref.current.getPlace();
    if (!place?.address_components) return;
    const comp = place.address_components;
    const get = type => {
      const o = comp.find(c => c.types.includes(type));
      return o ? o.long_name : '';
    };
    setValue(`${prefix}.address_road`, get('route'), { shouldDirty: true });
    setValue(`${prefix}.address_number`, get('street_number'), { shouldDirty: true });
    setValue(`${prefix}.address_number_int`, get('subpremise') || '', { shouldDirty: true });
    setValue(`${prefix}.address_PC`, get('postal_code'), { shouldDirty: true });
    setValue(`${prefix}.address_col`, get('sublocality') || '', { shouldDirty: true });
    const loc = place.geometry.location;
    const newLat = round6(loc.lat());
    const newLng = round6(loc.lng());
    setValue(`${prefix}.address_lat`, newLat, { shouldDirty: true });
    setValue(`${prefix}.address_lng`, newLng, { shouldDirty: true });
    setMarkerPosition({ lat: newLat, lng: newLng });

    setAddressSearched(true);
    if (setDomicileFormLoaded) setDomicileFormLoaded(true);
  };

  useEffect(() => {
    if (postal?.length === 5) {
      axios
        .get(`/api/postal-code/${postal}/`)
        .then(res => {
          const d = res.data;
          setColonias(d.colonias || []);
          setValue(`${prefix}.address_municip`, d.municipio, { shouldDirty: true });
          setValue(`${prefix}.address_city`, d.ciudad, { shouldDirty: true });
          setValue(`${prefix}.address_state`, d.estado, { shouldDirty: true });
        })
        .catch(() => setColonias([]));
    } else {
      setColonias([]);
      setValue(`${prefix}.address_municip`, '', { shouldDirty: true });
      setValue(`${prefix}.address_city`, '', { shouldDirty: true });
      setValue(`${prefix}.address_state`, '', { shouldDirty: true });
    }
  }, [postal, prefix, setValue]);

  useEffect(() => {
    if (lat != null && lng != null && lat !== '' && lng !== '') {
      setMarkerPosition({
        lat: typeof lat === 'string' ? parseFloat(lat) : lat,
        lng: typeof lng === 'string' ? parseFloat(lng) : lng
      });
    }
  }, [lat, lng]);

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Paper sx={{ p: 2 }} elevation={1}>
        {isLoaded && (
          <Controller
            name={`${prefix}.address_search`}
            control={control}
            render={() => (
              <Autocomplete onLoad={c => (ref.current = c)} onPlaceChanged={onPlaceChanged}>
                <TextField
                  label="Buscar dirección"
                  fullWidth
                  size="small"
                  margin="dense"
                />
              </Autocomplete>
            )}
          />
        )}
      </Paper>
      {!addressSearched && (
        <Typography variant='caption' color='textSecondary' sx={{ ml: 2 }}>
          *Utiliza el buscador para obtener la dirección completa
        </Typography>
      )}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid xs={12} sm={6}>
          <Controller
            name={`${prefix}.address_road`}
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Calle" margin="dense" />
            )}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <Controller
            name={`${prefix}.address_number`}
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Número" margin="dense" />
            )}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <Controller
            name={`${prefix}.address_number_int`}
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Número Interior" margin="dense" />
            )}
          />
        </Grid>
        {residenceType && (
          <Grid xs={12} sm={8} sx={{ width: 223.667 }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Tipo de Residencia</InputLabel>
              <Controller
                name={`${prefix}.residence_type`}
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Tipo de Residencia">
                    <MenuItem value="">No sé</MenuItem>
                    <MenuItem value="CASA">Casa</MenuItem>
                    <MenuItem value="DEPARTAMENTO">Departamento</MenuItem>
                    <MenuItem value="ALBERGUE">Albergue</MenuItem>
                    <MenuItem value="INSTITUCION">Institución (asilo, centro de atención, etc.)</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
        )}
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_PC`}
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Código Postal" margin="dense" />
            )}
          />
        </Grid>
        <Grid xs={12} sm={8} sx={{ width: 223.667 }}>
          <FormControl fullWidth margin="dense" >
            <InputLabel>Colonia</InputLabel>
            <Controller
              name={`${prefix}.address_col`}
              control={control}
              render={({ field }) => (
                <Select {...field} label="Colonia">
                  {colonias.map((c, i) => (
                    <MenuItem key={i} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_municip`}
            control={control}
            render={({ field }) => (
              <TextField {...field} disabled fullWidth label="Municipio" margin="dense" />
            )}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_city`}
            control={control}
            render={({ field }) => (
              <TextField {...field} disabled fullWidth label="Ciudad" margin="dense" />
            )}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_state`}
            control={control}
            render={({ field }) => (
              <TextField {...field} disabled fullWidth label="Estado" margin="dense" />
            )}
          />
        </Grid>
      </Grid>

      {/** Map Toggle + Map View */}
      {isLoaded && lat && lng && (
        <>
          <Button
            variant="outlined"
            onClick={() => setShowMap(!showMap)}
            endIcon={<MapIcon/>}
            sx={{ mt: 2 }}
          >
            {showMap ? 'Ocultar Mapa' : 'Mostrar en Mapa'}
          </Button>

          {showMap && (
            <Box sx={{ height: 400, mt: 2 }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={markerPosition}
                zoom={16}
                onClick={e => {
                  const newPos = {
                    lat: round6(e.latLng.lat()),
                    lng: round6(e.latLng.lng())
                  };
                  setMarkerPosition(newPos);
                  setValue(`${prefix}.address_lat`, newPos.lat, { shouldDirty: true });
                  setValue(`${prefix}.address_lng`, newPos.lng, { shouldDirty: true });
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable
                  onDragEnd={e => {
                    const newPos = {
                      lat: round6(e.latLng.lat()),
                      lng: round6(e.latLng.lng())
                    };
                    setMarkerPosition(newPos);
                    setValue(`${prefix}.address_lat`, newPos.lat, { shouldDirty: true });
                    setValue(`${prefix}.address_lng`, newPos.lng, { shouldDirty: true });
                  }}
                />
              </GoogleMap>
            </Box>
          )}

          {showMap && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Latitud: {markerPosition.lat} | Longitud: {markerPosition.lng}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
