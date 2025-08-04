import React from 'react';
import { Grid2 as Grid, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import MedicationsForm from './MedicationsForm'; // Adjust path if needed

const MedicalInfoForm = () => {
  const { control } = useFormContext();
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Controller
          name="has_disability_certificate"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Certificado de discapacidad"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="has_interdiction_judgment"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Juicio de interdicción"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="receives_pension"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
              <InputLabel id="blood-type-label">Recibe Pensión</InputLabel>
              <Select labelId="blood-type-label" label="Recibe Pensión" {...field}>
                <MenuItem value={undefined}>No sé</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Bie">Del Bienestar</MenuItem>
                <MenuItem value="Orf">De Orfandad</MenuItem>
                <MenuItem value="Otr">Otra</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="social_security"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
              <InputLabel id="blood-type-label">Recibe Pensión</InputLabel>
              <Select labelId="blood-type-label" label="Recibe Pensión" {...field}>
                <MenuItem value={undefined}>No sé</MenuItem>
                <MenuItem value="NINGUNO">Ninguno</MenuItem>
                <MenuItem value="IMSS">IMSS</MenuItem>
                <MenuItem value="ISSSTE">ISSSTE</MenuItem>
                <MenuItem value="PEMEX">PEMEX</MenuItem>
                <MenuItem value="IMSS-BIENESTAR">IMSS-Bienestar</MenuItem>
                <MenuItem value="PARTICULAR">Particular</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="receives_psychological_care"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Atención psicológica"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="receives_psychiatric_care"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Atención psiquiátrica"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="has_seizures"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Presenta convulsiones"
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller
          name="blood_type"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
              <InputLabel id="blood-type-label">Tipo de Sangre</InputLabel>
              <Select labelId="blood-type-label" label="Tipo de Sangre" {...field}>
                <MenuItem value={undefined}>No sé</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="allergies"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              label="Alergias"
              {...field}
              error={!!error}
              helperText={error ? error.message : null}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="dietary_restrictions"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              label="Restricciones alimentarias"
              {...field}
              error={!!error}
              helperText={error ? error.message : null}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller
          name="physical_restrictions"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              fullWidth
              label="Restricciones físicas"
              {...field}
              error={!!error}
              helperText={error ? error.message : null}
            />
          )}
        />
      </Grid>
      {/* Use the MedicationsForm component instead of a single text field */}
      <Grid item xs={12}>
        <MedicationsForm />
      </Grid>
    </Grid>
  );
};

export default MedicalInfoForm;
