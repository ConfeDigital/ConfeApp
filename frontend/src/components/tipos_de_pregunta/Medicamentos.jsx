import React, { useEffect, useState, useRef } from "react";
import { Box, Stack, TextField, Button, Typography, CircularProgress } from "@mui/material";
import { useForm, FormProvider, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import axios from "../../api";

const Medicamentos = ({ usuarioId, disabled = false, seleccionOpcion, setSeleccionOpcion }) => {
  const [autoSave, setAutoSave] = useState(false);
  const [error, setError] = useState("");
  
  const usuarioActualId = useSelector((state) => state.auth.user.id);
  const debounceRef = useRef();

  const endpoint =
    usuarioId === usuarioActualId
      ? "/api/candidatos/me/datos-medicos/"
      : `/api/candidatos/${usuarioId}/datos-medicos/`;

  const methods = useForm({
    defaultValues: {
      medications: [{ name: "", dose: "", reason: "" }],
    },
    mode: "onChange",
  });

  const { reset, control, formState, getValues, setValue } = methods;
  const watchedValues = useWatch({ control });

  const { fields, append, remove } = useFieldArray({
    name: "medications",
    control,
  });

  // Load initial data from API
  useEffect(() => {
    axios
      .get(endpoint)
      .then((res) => {
        const d = res.data;
        reset({
          medications: d.medications && d.medications.length > 0 
            ? d.medications 
            : [{ name: "", dose: "", reason: "" }],
        });
      })
      .catch((e) => {
        console.error(e);
        setError("Error obteniendo datos de medicamentos.");
      });
  }, [usuarioId, reset, endpoint]);

  // Auto-save on change
  useEffect(() => {
    if (disabled || !formState.isDirty || !formState.isValid) return;

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setAutoSave(true);
      try {
        // Filter out empty medications
        const filteredMedications = (watchedValues.medications || []).filter(
          med => med.name.trim() !== "" || med.dose.trim() !== "" || med.reason.trim() !== ""
        );

        await axios.put(endpoint, {
          medications: filteredMedications,
        });
        setSeleccionOpcion("Respondido");
        setError("")
      } catch (err) {
        console.error(err);
        setError("Error actualizando medicamentos.");
      } finally {
        setAutoSave(false);
      }
    }, 2000);

    return () => clearTimeout(debounceRef.current);
  }, [watchedValues, formState.isDirty, formState.isValid, disabled, endpoint]);

  const handleRemoveMedication = (index) => {
    setValue(`medications.${index}.name`, "");
    setValue(`medications.${index}.dose`, "");
    setValue(`medications.${index}.reason`, "");
    remove(index);
  };

  const handleAddMedication = () => {
    append({ name: "", dose: "", reason: "" }, { shouldFocus: false, shouldDirty: false });
    const currentValues = getValues();
    reset(currentValues, { keepDirty: false, keepTouched: true });
  };

  return (
    <FormProvider {...methods}>
      <Box sx={{ mb: 4, px: 1 }}>
        {error && (
          <Typography color="error" variant="body2" gutterBottom>
            {error}
          </Typography>
        )}
        
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
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="¿Nombre del medicamento?"
                      placeholder="e.g., Ibuprofeno"
                      disabled={disabled}
                      slotProps={{
                        input: {
                          style: { fontSize: '1rem' }
                        },
                        inputLabel: {
                          style: { fontSize: '1rem' }
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name={`medications.${index}.dose`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="¿Qué dosis?"
                      placeholder="e.g., 200 mg"
                      disabled={disabled}
                      slotProps={{
                        input: {
                          style: { fontSize: '1rem' }
                        },
                        inputLabel: {
                          style: { fontSize: '1rem' }
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name={`medications.${index}.reason`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      label="¿Para qué lo tomas?"
                      placeholder="e.g., Dolor de cabeza"
                      disabled={disabled}
                      slotProps={{
                        input: {
                          style: { fontSize: '1rem' }
                        },
                        inputLabel: {
                          style: { fontSize: '1rem' }
                        },
                      }}
                    />
                  )}
                />

                <Box sx={{ textAlign: 'right' }}>
                  <Button
                    onClick={() => handleRemoveMedication(index)}
                    startIcon={<RemoveCircle />}
                    variant="outlined"
                    size="small"
                    color='error'
                    aria-label="Eliminar este medicamento"
                    disabled={disabled}
                  >
                    Eliminar Medicamento
                  </Button>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={handleAddMedication}
          sx={{ mt: 2 }}
          disabled={disabled}
        >
          Añadir medicamento
        </Button>

        {autoSave && (
          <Box display="flex" alignItems="center" mt={2}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Guardando medicamentos…</Typography>
          </Box>
        )}
      </Box>
    </FormProvider>
  );
};

export default Medicamentos;