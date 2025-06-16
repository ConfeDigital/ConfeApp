import React from 'react';
import { Grid2 as Grid, TextField, IconButton, Button } from '@mui/material';
import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import AddCircle from '@mui/icons-material/AddCircle';
import RemoveCircle from '@mui/icons-material/RemoveCircle';

const MedicationsForm = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name: 'medications', control });

  const renderMedicationFields = (field, index) => {
    return (
      <Grid
        container
        spacing={2}
        key={field.id}
        sx={{ border: '1px solid', p: 2, mb: 2, borderRadius: '4px', borderColor: 'neutral.dark' }}
      >
        <Grid item xs={12} sm={4}>
          <Controller
            name={`medications.${index}.name`}
            control={control}
            defaultValue={field.name || ''}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                label="Nombre del Medicamento"
                {...field}
                error={!!error}
                helperText={error ? error.message : ''}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name={`medications.${index}.dose`}
            control={control}
            defaultValue={field.dose || ''}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                label="Dosis"
                {...field}
                error={!!error}
                helperText={error ? error.message : ''}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name={`medications.${index}.reason`}
            control={control}
            defaultValue={field.reason || ''}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                label="Razón"
                {...field}
                error={!!error}
                helperText={error ? error.message : ''}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
            <Button 
                onClick={() => remove(index)} 
                color="error" 
                variant='outlined'
                aria-label="remove-medication"
                startIcon={<RemoveCircle/>}
            >
                Eliminar Medicamento
            </Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <Grid container spacing={2}>
      {fields.map((field, index) => renderMedicationFields(field, index))}
      <Grid item xs={12}>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => append({ name: '', dose: '', reason: '' })}
        >
          Agregar Medicamento
        </Button>
      </Grid>
    </Grid>
  );
};

export default MedicationsForm;
