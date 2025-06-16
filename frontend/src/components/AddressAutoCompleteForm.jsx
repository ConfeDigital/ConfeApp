import React, { useEffect, useRef, useState } from 'react';
import { Grid2 as Grid, TextField, FormControl, InputLabel, Select, MenuItem, Paper, Typography } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import axios from '../api';

const libraries = ['places'];
const round6 = n => Math.round(n * 1e6) / 1e6;

export default function AddressAutoCompleteForm({ prefix, setDomicileFormLoaded }) {
  const { control, setValue, watch } = useFormContext();
  const ref = useRef(null);
  const postal = watch(`${prefix}.address_PC`);
  const [colonias, setColonias] = useState([]);
  // This state will indicate whether an address has been selected.
  const [addressSearched, setAddressSearched] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'es'
  });

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
    setValue(`${prefix}.address_lat`, round6(loc.lat()), { shouldDirty: true });
    setValue(`${prefix}.address_lng`, round6(loc.lng()), { shouldDirty: true });

    // Mark the address as searched (and loaded)
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

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        {isLoaded && (
          <Controller
            name={`${prefix}.address_search`}
            control={control}
            render={() => (
              <Autocomplete
                onLoad={c => (ref.current = c)}
                onPlaceChanged={onPlaceChanged}
              >
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
      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <Controller
            name={`${prefix}.address_road`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={!addressSearched}
                fullWidth
                label="Calle"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <Controller
            name={`${prefix}.address_number`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={!addressSearched}
                fullWidth
                label="Número"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <Controller
            name={`${prefix}.address_number_int`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={!addressSearched}
                fullWidth
                label="Número Interior"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_PC`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled={!addressSearched}
                fullWidth
                label="Código Postal"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={8} sx={{ width: 223.667 }}>
          <FormControl fullWidth margin="dense" disabled={!addressSearched}>
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
              <TextField
                {...field}
                disabled
                fullWidth
                label="Municipio"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_city`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Ciudad"
                margin="dense"
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <Controller
            name={`${prefix}.address_state`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Estado"
                margin="dense"
              />
            )}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}