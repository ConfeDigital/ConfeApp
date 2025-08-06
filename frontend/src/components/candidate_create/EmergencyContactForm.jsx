import React, { useEffect, useState } from "react";
import {
  Grid2 as Grid,
  TextField,
  IconButton,
  Button,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import {
  useFieldArray,
  useFormContext,
  Controller,
  useWatch,
} from "react-hook-form";
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import axios from "../../api";
import MyPhoneField from "../phone_number/MyPhoneField";
import AddressAutocompleteForm from "../AddressAutoCompleteForm";

const EmergencyContactsForm = () => {
  const { control, setValue, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: "emergency_contacts",
    control,
  });
  const [postalDataMap, setPostalDataMap] = useState({});

  // Watch all emergency contacts
  const emergencyContactsValues = useWatch({
    control,
    name: "emergency_contacts",
    defaultValue: [],
  });

  // Use a specific watch for postal codes to prevent infinite loops
  const postalCodes = emergencyContactsValues.map(
    (contact) => contact?.domicile?.address_PC
  );

  useEffect(() => {
    const fetchPostalData = async (postalCode, index) => {
      if (
        postalCode &&
        postalCode.length === 5 &&
        !postalDataMap[index]?.postalCode
      ) {
        try {
          const res = await axios.get(`/api/postal-code/${postalCode}/`);
          setPostalDataMap((prev) => ({
            ...prev,
            [index]: { ...res.data, postalCode },
          }));
          setValue(
            `emergency_contacts.${index}.domicile.address_municip`,
            res.data.municipio
          );
          setValue(
            `emergency_contacts.${index}.domicile.address_state`,
            res.data.estado
          );
          setValue(
            `emergency_contacts.${index}.domicile.address_city`,
            res.data.ciudad
          );
        } catch (err) {
          console.error(err);
          setPostalDataMap((prev) => ({
            ...prev,
            [index]: null,
          }));
        }
      }
    };

    postalCodes.forEach((postalCode, index) => {
      if (postalCode && postalCode.length === 5) {
        fetchPostalData(postalCode, index);
      }
    });
  }, [postalCodes.join(",")]); // Only depend on the postal codes string

  const renderContactFields = (field, index) => {
    const livesAtSame =
      emergencyContactsValues[index]?.lives_at_same_address ?? true;
    const currentPostalData = postalDataMap[index];

    const contactErrors = errors.emergency_contacts?.[index];

    return (
      <Grid
        container
        spacing={2}
        sx={{ mb: 4, p: 2, border: "1px solid", borderRadius: "4px", borderColor: 'neutral.dark' }}
      >
        <Grid xs={12}>
          <Grid container spacing={2}>
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
                    helperText={error ? error.message : null}
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
                    helperText={error ? error.message : null}
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
                    helperText={error ? error.message : null}
                  />
                )}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <Controller
                name={`emergency_contacts.${index}.relationship`}
                control={control}
                defaultValue=""
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
                  </FormControl>
                )}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <MyPhoneField label="Teléfono" name={`emergency_contacts.${index}.phone_number`} control={control} fullWidth sx={{ width: 223 }} />
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
        </Grid>

        <Grid xs={12}>
          <Controller
            name={`emergency_contacts.${index}.lives_at_same_address`}
            control={control}
            defaultValue={true}
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
            <Typography variant="subtitle1" gutterBottom>
              Domicilio del Contacto
            </Typography>
            <Box sx={{ width: '100%' }}>
              <AddressAutocompleteForm
                prefix={`emergency_contacts.${index}.domicile`}
                setDomicileFormLoaded={() => { }}
                domicile={true}
                errors={contactErrors?.domicile}
              />
            </Box>
          </Box>
        )}

        <Grid xs={12} display="flex" justifyContent="flex-end">
          <Button
            onClick={() => remove(index)}
            color="error"
            variant="outlined"
            aria-label="remove-contact"
            startIcon={<RemoveCircle />}
          >
            Eliminar Contacto
          </Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <Grid container spacing={3}>
      {fields.map((field, index) => (
        <Grid xs={12} key={field.id}>
          {renderContactFields(field, index)}
        </Grid>
      ))}

      <Grid xs={12}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircle />}
          onClick={() =>
            append({
              first_name: "",
              last_name: "",
              second_last_name: "",
              relationship: undefined,
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
              },
            })
          }
        >
          Agregar Contacto
        </Button>
      </Grid>
    </Grid>
  );
};

export default EmergencyContactsForm;
