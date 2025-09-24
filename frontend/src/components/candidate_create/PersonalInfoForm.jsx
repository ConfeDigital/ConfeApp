import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Grid2 as Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Autocomplete,
  Button, 
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "../../api";
import MyPhoneField from "../phone_number/MyPhoneField";
import dayjs from "dayjs";
import PhotoCropDialog from "../photo_crop/PhotoCropDialog";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const PersonalInfoForm = ({
  editMode = false,
}) => {
  const { control, watch } = useFormContext();
  const [disabilities, setDisabilities] = useState([]);
  const [disabilityGroups, setDisabilityGroups] = useState([]);
  const [selectedDisabilityGroups, setSelectedDisabilityGroups] = useState([]);
  const [filteredDisabilities, setFilteredDisabilities] = useState([]);
  const [cycles, setCycles] = useState([]);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);

  // Watch the current photo value
  const photoValue = watch("photo");
  const nameValue = watch("first_name");
  const lastNameValue = watch("last_name");
  const secondLastNameValue = watch("second_last_name");
  const selectedDisabilities = watch("disability") || [];

  useEffect(() => {
    axios
      .get("/api/discapacidad/disabilities/")
      .then((res) => {
        setDisabilities(res.data);
        // Extract unique groups from disabilities
        const groups = res.data.reduce((acc, disability) => {
          if (disability.group && !acc.find(g => g.id === disability.group.id)) {
            acc.push(disability.group);
          }
          return acc;
        }, []);
        setDisabilityGroups(groups);
      })
      .catch((err) => console.error(err));
    axios
      .get("/api/candidatos/ciclos/")
      .then((res) => setCycles(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Auto-select disability groups based on selected disabilities
  useEffect(() => {
    if (selectedDisabilities.length > 0 && disabilities.length > 0) {
      const selectedGroups = selectedDisabilities
        .map(disabilityId => {
          const disability = disabilities.find(d => d.id === disabilityId);
          return disability?.group?.id;
        })
        .filter((groupId, index, self) => groupId && self.indexOf(groupId) === index);

      setSelectedDisabilityGroups(selectedGroups);
    } else if (selectedDisabilities.length === 0) {
      setSelectedDisabilityGroups([]);
    }
  }, [selectedDisabilities, disabilities]);

  // Filter disabilities based on selected groups
  useEffect(() => {
    if (selectedDisabilityGroups.length > 0) {
      const filtered = disabilities.filter(d =>
        d.group && selectedDisabilityGroups.includes(d.group.id)
      );
      setFilteredDisabilities(filtered);
    } else {
      setFilteredDisabilities([]);
    }
  }, [selectedDisabilityGroups, disabilities]);

  const handleDisabilityGroupsChange = (groupIds) => {
    setSelectedDisabilityGroups(groupIds);
  };

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
        <Grid xs={12} sm={6}>
          <MyPhoneField label="Teléfono" name="phone_number" control={control} fullWidth sx={{ width: 223 }} />
        </Grid>
        <Grid xs={12} sm={6}>
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
        </Grid>
        <Grid xs={12} sm={6}>
          <Controller
            name="stage"
            control={control}
            defaultValue="Reg"
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                <InputLabel id="stage-label">Etapa</InputLabel>
                <Select
                  labelId="stage-label"
                  label="Etapa"
                  {...field}
                >
                  <MenuItem value={undefined}>Seleccionar</MenuItem>
                  <MenuItem value="Reg">Registro</MenuItem>
                  <MenuItem value="Pre">Preentrevista</MenuItem>
                  <MenuItem value="Can">Canalización</MenuItem>
                  <MenuItem value="Ent">Entrevista</MenuItem>
                  <MenuItem value="Cap">Capacitación</MenuItem>
                  <MenuItem value="Agn">Agencia</MenuItem>
                  <MenuItem value="TrC">Trabajo en Casa</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid xs={12}></Grid>
        {/* Disability Groups Selection */}
      </Grid>
      <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
        <Grid xs={12}>
          <FormControl fullWidth sx={{ minWidth: 223 }}>
            <Autocomplete
              multiple
              id="disability-groups-autocomplete"
              options={disabilityGroups}
              getOptionLabel={(option) => option.name}
              value={disabilityGroups.filter(group => selectedDisabilityGroups.includes(group.id))}
              onChange={(event, newValue) => {
                const groupIds = newValue.map(group => group.id);
                handleDisabilityGroupsChange(groupIds);
              }}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Grupo de discapacidad"
                  placeholder="Buscar grupos..."
                  sx={{ fontSize: "1rem" }}
                />
              )}
              noOptionsText="No se encontraron grupos"
              loadingText="Cargando grupos..."
            />
          </FormControl>
        </Grid>

        {/* Disability Selection */}
        {selectedDisabilityGroups.length > 0 && (
          <Grid xs={12}>
            <Controller
              name="disability"
              control={control}
              defaultValue={[]}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} sx={{ minWidth: 223 }}>
                  <Autocomplete
                    multiple
                    id="disability-autocomplete"
                    options={filteredDisabilities}
                    getOptionLabel={(option) => option.name}
                    value={filteredDisabilities.filter(disability =>
                      field.value && field.value.includes(disability.id)
                    )}
                    onChange={(event, newValue) => {
                      const disabilityIds = newValue.map(disability => disability.id);
                      field.onChange(disabilityIds);
                    }}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Discapacidad"
                        placeholder="Buscar discapacidades..."
                        error={!!error}
                        sx={{ fontSize: "1rem" }}
                      />
                    )}
                    noOptionsText="No se encontraron discapacidades"
                    loadingText="Cargando discapacidades..."
                  />
                </FormControl>
              )}
            />
          </Grid>
        )}
        {/* Photo Upload Section */}
        <Grid xs={12}></Grid>
      </Grid>
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
        render={({ field }) => (
          <Box className="flex flex-col items-start">
            {field.value && (
              <Box mb={1} className="self-center">
                <img
                  src={typeof field.value === "string" ? field.value : URL.createObjectURL(field.value)}
                  alt="Profile"
                  style={{ maxWidth: "200px", display: "block", borderRadius: "50%", objectFit: "cover" }}
                />
              </Box>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setTempImage(URL.createObjectURL(file));
                  setCropDialogOpen(true);
                }
              }}
            />
            
            <Button
              variant="contained"
              onClick={() => fileInputRef.current.click()}
              startIcon={<CloudUploadIcon />}
              sx={{ mt: 2 }}
            >
              Seleccionar Imagen
            </Button>

            <PhotoCropDialog
              open={cropDialogOpen}
              imageSrc={tempImage}
              onClose={() => setCropDialogOpen(false)}
              onSave={(croppedFile) => {
                field.onChange(croppedFile);
                setCropDialogOpen(false);
              }}
            />
          </Box>
        )}
      />
      </Box>
    </Box>
  );
};

export default PersonalInfoForm;