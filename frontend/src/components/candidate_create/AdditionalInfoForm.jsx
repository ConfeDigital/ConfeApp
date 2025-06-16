import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Box } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import axios from '../../api';

const AdditionalInfoForm = () => {
  const { control } = useFormContext();
  const [disabilities, setDisabilities] = useState([]);
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    axios.get('/api/discapacidad/disabilities/')
      .then(res => setDisabilities(res.data))
      .catch(err => console.error(err));
    axios.get('/api/candidatos/ciclos/')
      .then(res => setCycles(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid xs={12} sm={6}>
        <Controller
          name="disability"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth error={!!error} sx={{ minWidth: 220 }}>
              <InputLabel id="disability-label">Discapacidad (Opcional)</InputLabel>
              <Select
                labelId="disability-label"
                multiple
                {...field}
                input={<OutlinedInput label="Discapacidad (Opcional)" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const disObj = disabilities.find((d) => d.id === value);
                      return <Chip key={value} label={disObj ? disObj.name : value} />;
                    })}
                  </Box>
                )}
              >
                {disabilities.map((dis) => (
                  <MenuItem key={dis.id} value={dis.id}>
                    {dis.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <Controller
          name="cycle"
          control={control}
          defaultValue=''
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth error={!!error} sx={{ minWidth: 150 }}>
              <InputLabel id="cycle-label">Ciclo (Opcional)</InputLabel>
              <Select
                labelId="cycle-label"
                {...field}
                label="Ciclo (Opcional)"
              >
                <MenuItem value={undefined}>Ninguno</MenuItem>
                {cycles.map((cyc) => (
                  <MenuItem key={cyc.id} value={cyc.id}>
                    {cyc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default AdditionalInfoForm;
