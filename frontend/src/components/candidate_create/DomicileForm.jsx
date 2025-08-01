import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import axios from '../../api';

const DomicileForm = ({ setDomicileFormLoaded }) => {
  const { control, setValue, watch } = useFormContext();
  const postalCode = watch('address_PC');
  const [postalData, setPostalData] = useState(null);

  useEffect(() => {
    if (postalCode && postalCode.length === 5) {
      axios.get(`/api/postal-code/${postalCode}/`)
        .then((res) => {
          setPostalData(res.data);
          setValue('address_municip', res.data.municipio);
          setValue('address_state', res.data.estado);
          setValue('address_city', res.data.ciudad);
          // Reset colonia if postal code changes
          setValue('address_col', '');
          if(setDomicileFormLoaded){
            setDomicileFormLoaded(true)
          }
        })
        .catch((err) => {
          console.error(err);
          setPostalData(null);
          if(setDomicileFormLoaded){
            setDomicileFormLoaded(true)
          }
        });
    } else {
      setPostalData(null);
      setValue('address_municip', '');
      setValue('address_state', '');
      setValue('address_city', '');
      setValue('address_col', '');
    }
  }, [postalCode, setValue]);

  return (
    <Grid container spacing={2}>
      <Grid xs={12} sm={6}>
        <Controller
          name="address_PC"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Código Postal" {...field} error={!!error} helperText={error ? error.message : null} />
          )}
        />
      </Grid>
      <Grid xs={12} sm={4}>
        <Controller
          name="address_state"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Estado" {...field} error={!!error} helperText={error ? error.message : null} disabled />
          )}
        />
      </Grid>
      <Grid xs={12} sm={4}>
        <Controller
          name="address_city"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Ciudad" {...field} error={!!error} helperText={error ? error.message : null} disabled />
          )}
        />
      </Grid>
      <Grid xs={12} sm={4}>
        <Controller
          name="address_municip"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Municipio" {...field} error={!!error} helperText={error ? error.message : null} disabled />
          )}
        />
      </Grid>
      <Grid xs={12} sm={4}>
        {postalData && postalData.colonias ? (
          <Controller
            name="address_col"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                <InputLabel id="colonia-label">Colonia</InputLabel>
                <Select labelId="colonia-label" {...field} label="Colonia">
                  {postalData.colonias.map((col, index) => (
                    <MenuItem key={index} value={col}>{col}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        ) : (
          <Controller
            name="address_col"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField fullWidth label="Colonia" {...field} error={!!error} helperText={error ? error.message : null} />
            )}
          />
        )}
      </Grid>
      <Grid xs={12} sm={6}>
        <Controller
          name="address_road"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Calle" {...field} error={!!error} helperText={error ? error.message : null} />
          )}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <Controller
          name="address_number"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Número" {...field} error={!!error} helperText={error ? error.message : null} />
          )}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <Controller
          name="address_number_int"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField fullWidth label="Número Interior" {...field} error={!!error} helperText={error ? error.message : null} />
          )}
        />
      </Grid>
      <Grid xs={12} sm={8} sx={{ width: 223.667 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Tipo de Residencia</InputLabel>
            <Controller
              name="residence_type"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Tipo de Residencia">
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
    </Grid>
  );
};

export default DomicileForm;
