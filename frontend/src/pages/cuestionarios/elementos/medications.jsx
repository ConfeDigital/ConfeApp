import React from "react";
import { Box, Stack, TextField, IconButton, Button, Typography } from "@mui/material";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";

const MedicationsForm = () => {
  const { control, formState: { errors }} = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: "medications",
    control,
  });

  return (
    <Box sx={{ mb: 4, px: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontSize: '1.1rem' }}>
        Medicamentos que tomas
      </Typography>
      <Stack spacing={2}>
        {fields.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              border: '1px solid #ccc',
              p: 2,
              borderRadius: 2,
            }}
          >
            <Stack spacing={1}>
              <Controller
                name={`medications.${index}.name`}
                control={control}
                defaultValue={item.name || ''}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="¿Nombre del medicamento?"
                    placeholder="e.g., Ibuprofeno"
                    error={!!errors?.medications?.[index]?.name}
                    helperText={errors?.medications?.[index]?.name?.message}
                  />
                )}
              />

              <Controller
                name={`medications.${index}.dose`}
                control={control}
                defaultValue={item.dose || ''}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="¿Qué dosis?"
                    placeholder="e.g., 200 mg"
                    error={!!errors?.medications?.[index]?.dose}
                    helperText={errors?.medications?.[index]?.dose?.message}
                  />
                )}
              />

              <Controller
                name={`medications.${index}.reason`}
                control={control}
                defaultValue={item.reason || ''}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="¿Para qué lo tomas?"
                    placeholder="e.g., Dolor de cabeza"
                    error={!!errors?.medications?.[index]?.reason}
                    helperText={errors?.medications?.[index]?.reason?.message}
                  />
                )}
              />

              <Box sx={{ textAlign: 'right' }}>
                <Button
                  onClick={() => remove(index)}
                  startIcon={<RemoveCircle />}
                  variant="outlined"
                  size="small"
                  color='error'
                  aria-label="Eliminar este medicamento"
                >
                  Eliminar
                </Button>
              </Box>
            </Stack>
          </Box>
        ))}

        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => append({ name: '', dose: '', reason: '' })}
        >
          Añadir medicamento
        </Button>
      </Stack>
    </Box>
  );
};

export default MedicationsForm;
