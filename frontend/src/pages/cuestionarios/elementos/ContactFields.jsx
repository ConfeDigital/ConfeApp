import React, { useEffect, useState } from "react";
import {
  Grid2 as Grid,
  TextField,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  useFieldArray,
  useFormContext,
  Controller,
  useWatch,
} from "react-hook-form";
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import axios from "../../../api";
import MyPhoneField from "../../../components/phone_number/MyPhoneField";
import AddressAutocompleteForm from "../../../components/AddressAutoCompleteForm";

const ContactFields = () => {
  const { control, setValue, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: "emergency_contacts",
    control,
  });
  const emergencyContactsValues = useWatch({
    control,
    name: "emergency_contacts",
    defaultValue: [],
  });

  // Confirmation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDeleteIndex, setToDeleteIndex] = useState(null);

  const handleRemoveClick = (index) => {
    setToDeleteIndex(index);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (toDeleteIndex !== null) {
      remove(toDeleteIndex);
    }
    setDialogOpen(false);
    setToDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setToDeleteIndex(null);
  };

  // Watch postal codes to auto-fill address parts
  const [postalDataMap, setPostalDataMap] = useState({});
  const postalCodes = emergencyContactsValues.map(
    (c) => c?.domicile?.address_PC
  );

  useEffect(() => {
    // fetch postal data when code changes
    postalCodes.forEach((postalCode, index) => {
      if (postalCode?.length === 5 && !postalDataMap[index]) {
        axios.get(`/api/postal-code/${postalCode}/`)
          .then((res) => {
            const data = res.data;
            setPostalDataMap((prev) => ({ ...prev, [index]: data }));
            ['municipio', 'estado', 'ciudad'].forEach((key) => {
              setValue(
                `emergency_contacts.${index}.domicile.address_${key}`,
                data[key]
              );
            });
          })
          .catch(() => {
            setPostalDataMap((prev) => ({ ...prev, [index]: null }));
          });
      }
    });
  }, [postalCodes.join(',')]);

  const renderContactFields = (field, index) => {
    const livesAtSame = emergencyContactsValues[index]?.lives_at_same_address ?? true;
    const contactErrors = errors.emergency_contacts?.[index];

    return (
      <Grid
        container
        spacing={2}
        key={field.id}
        sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}
      >
        <Grid xs={12} container spacing={2}>
          <Grid xs={12} sm={4}>
            <Controller
              name={`emergency_contacts.${index}.first_name`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  fullWidth
                  label="Nombre"
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <Controller
              name={`emergency_contacts.${index}.last_name`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  fullWidth
                  label="Apellido Paterno"
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <Controller
              name={`emergency_contacts.${index}.second_last_name`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  fullWidth
                  label="Apellido Materno"
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <Controller
              name={`emergency_contacts.${index}.relationship`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                  <InputLabel>Relación</InputLabel>
                  <Select {...field} label="Relación">
                    <MenuItem value={undefined}>Seleccionar</MenuItem>
                    <MenuItem value="PADRE">Padre</MenuItem>
                    <MenuItem value="MADRE">Madre</MenuItem>
                    <MenuItem value="HERMANO">Hermano</MenuItem>
                    <MenuItem value="HERMANA">Hermana</MenuItem>
                    <MenuItem value="PAREJA">Pareja</MenuItem>
                    <MenuItem value="ABUELO">Abuelo</MenuItem>
                    <MenuItem value="ABUELA">Abuela</MenuItem>
                    <MenuItem value="HIJO">Hijo</MenuItem>
                    <MenuItem value="HIJA">Hija</MenuItem>
                    <MenuItem value="OTRO FAM">Otro Familiar</MenuItem>
                    <MenuItem value="AMIGO">Amigo</MenuItem>
                    <MenuItem value="AMIGA">Amiga</MenuItem>
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </Select>
                  <Typography variant="caption" color="error">
                    {error?.message}
                  </Typography>
                </FormControl>
              )}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <MyPhoneField
              label="Teléfono"
              name={`emergency_contacts.${index}.phone_number`}
              control={control}
              fullWidth
              sx={{ width: 223 }}
              size="small"
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <Controller
              name={`emergency_contacts.${index}.email`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  {...field}
                  error={!!error}
                  helperText={error ? error.message : null}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid xs={12}>
          <Controller
            name={`emergency_contacts.${index}.lives_at_same_address`}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label="¿Vive en el mismo domicilio?"
              />
            )}
          />
        </Grid>

        {!livesAtSame && (
          <Box
            sx={{
              borderLeft: '2px solid #ddd',
              pl: 2,
              mb: 2,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Typography variant="h4" mb={1}>
              Ingresa su domicilio
            </Typography>
            <AddressAutocompleteForm prefix={`emergency_contacts.${index}.domicile`} domicile={true} errors={contactErrors?.domicile} />
          </Box>
        )}

        <Grid xs={12} display="flex" justifyContent="flex-end">
          <Button
            onClick={() => handleRemoveClick(index)}
            color="error"
            variant="outlined"
            startIcon={<RemoveCircle />}
          >
            Eliminar Contacto
          </Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Grid container spacing={3}>
        {fields.map((field, index) => (
          <Grid xs={12} key={field.id}>
            {renderContactFields(field, index)}
          </Grid>
        ))}

        <Grid xs={12}>
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={() =>
              append({
                first_name: "",
                last_name: "",
                second_last_name: "",
                relationship: "",
                phone_number: "",
                email: "",
                lives_at_same_address: true,
                domicile: {
                  address_PC: "",
                  address_road: "",
                  address_municip: "",
                  address_state: "",
                  address_city: "",
                  address_col: "",
                  address_number: "",
                  address_number_int: "",
                  residence_type: "",
                },
              })
            }
          >
            Agregar Contacto
          </Button>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar este contacto de emergencia?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={handleCancelDelete}>Cancelar</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContactFields;
