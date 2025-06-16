import React, { useEffect, useState } from "react";
import {
  Box,
  Grid2 as Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "../../api";
import MyPhoneField from "../phone_number/MyPhoneField";
import dayjs from "dayjs";

const PersonalInfoForm = ({
  editMode = false,
  preentrevista = false,
  ciclo = true,
}) => {
  const { control, watch } = useFormContext();
  const [disabilities, setDisabilities] = useState([]);
  const [cycles, setCycles] = useState([]);
  // Watch the current photo value
  const photoValue = watch("photo");

  useEffect(() => {
    axios
      .get("/api/discapacidad/disabilities/")
      .then((res) => setDisabilities(res.data))
      .catch((err) => console.error(err));
    axios
      .get("/api/candidatos/ciclos/")
      .then((res) => setCycles(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                label="Correo"
                type="email"
                {...field}
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <Controller
            name="first_name"
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
        <Grid xs={12} sm={6}>
          <Controller
            name="last_name"
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
        <Grid xs={12} sm={6}>
          <Controller
            name="second_last_name"
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
        {/* Only render the password field if not in edit mode */}
        {!editMode && (
          <Grid xs={12} sm={6}>
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  autoComplete="new-password"
                  {...field}
                  error={!!error}
                  helperText={error ? error.message : null}
                  sx={{ width: 223 }}
                />
              )}
            />
          </Grid>
        )}
        <Grid xs={12} sm={6}>
          <Controller
            name="birth_date"
            control={control}
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <DatePicker
                label="Fecha de Nacimiento"
                sx={{ width: 223 }}
                value={value ? dayjs(value) : null}
                onChange={(newValue) => {
                  // Convert dayjs object to JavaScript Date for yup validation
                  const dateValue = newValue ? newValue.toDate() : null;
                  onChange(dateValue);
                }}
                onClose={onBlur} // Trigger validation when picker closes
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error,
                    helperText: error ? error.message : null,
                    onBlur: onBlur, // Also trigger validation on input blur
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <Controller
            name="gender"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                <InputLabel id="gender-label">Género</InputLabel>
                <Select labelId="gender-label" label="Género" {...field}>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                  <MenuItem value="O">Otro</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid xs={12}>
          <Controller
            name="curp"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                fullWidth
                label="CURP"
                {...field}
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <MyPhoneField label="Teléfono" name="phone_number" control={control} fullWidth sx={{ width: 223 }}/>
        </Grid>
        <Grid xs={12} sm={6}>
          {!preentrevista && (
            <Controller
              name="cycle"
              control={control}
              defaultValue=""
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                  <InputLabel id="cycle-label">Ciclo</InputLabel>
                  <Select labelId="cycle-label" {...field} label="Ciclo">
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
          )}
        </Grid>
        {!preentrevista && (
          <Grid xs={12} sm={6}>
            <Controller
              name="stage"
              control={control}
              defaultValue="Reg"
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                  <InputLabel id="stage-label">Etapa (Opcional)</InputLabel>
                  <Select
                    labelId="stage-label"
                    label="Etapa (Opcional)"
                    {...field}
                  >
                    <MenuItem value={undefined}>Seleccionar</MenuItem>
                    <MenuItem value="Reg">Registro</MenuItem>
                    <MenuItem value="Pre">Preentrevista</MenuItem>
                    <MenuItem value="Can">Canalización</MenuItem>
                    <MenuItem value="Ent">Entrevista</MenuItem>
                    <MenuItem value="Cap">Capacitación</MenuItem>
                    <MenuItem value="Agn">Agencia</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        )}
        <Grid xs={12} sm={6}>
          <Controller
            name="disability"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                <InputLabel id="disability-label">
                  Discapacidad (Opcional)
                </InputLabel>
                <Select
                  labelId="disability-label"
                  multiple
                  {...field}
                  input={<OutlinedInput label="Discapacidad (Opcional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const disObj = disabilities.find((d) => d.id === value);
                        return (
                          <Chip
                            key={value}
                            label={disObj ? disObj.name : value}
                          />
                        );
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
        {/* Photo Upload Section */}
        <Grid xs={12}></Grid>
      </Grid>
      {!preentrevista && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: 'neutral.dark',
            borderRadius: 2,
            p: 2,
            mt: 2,
            width: "fitContent",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Imagen de Perfil
          </Typography>
          <Controller
            name="photo"
            control={control}
            defaultValue={null}
            render={({ field, fieldState: { error } }) => (
              <Box>
                {field.value && typeof field.value === "string" && (
                  <Box mb={1}>
                    <img
                      src={field.value}
                      alt="Profile"
                      style={{ maxWidth: "200px", display: "block" }}
                    />
                  </Box>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    field.onChange(e.target.files[0]);
                  }}
                />
                {error && (
                  <Typography color="error">{error.message}</Typography>
                )}
              </Box>
            )}
          />
        </Box>
      )}
    </Box>
  );
};

export default PersonalInfoForm;