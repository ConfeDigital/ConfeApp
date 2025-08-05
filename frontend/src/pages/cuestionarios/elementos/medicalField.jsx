import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  OutlinedInput,
  Chip,
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import axios from "../../../api";
import MedicationsForm from "./medications";

const yesNoOptions = [
  { value: true, label: "Sí" },
  { value: false, label: "No" },
];

const MedicalInfoForm = () => {
  const { control, formState: { errors }, watch } = useFormContext();
  const [disabilities, setDisabilities] = useState([]);
  const [disabilityGroups, setDisabilityGroups] = useState([]);
  const [selectedDisabilityGroups, setSelectedDisabilityGroups] = useState([]);
  const [filteredDisabilities, setFilteredDisabilities] = useState([]);

  const hasSeizuresValue = watch("has_seizures");
  const hasPsychologicalDetailsValue = watch("receives_psychological_care");
  const hasPsychiatricCareValue = watch("receives_psychiatric_care");
  const hasDisabilityCertificate = watch("has_disability_certificate");
  const hasDisabilityHistory = watch("has_disability_history");
  const selectedDisabilities = watch("disability") || [];

  useEffect(() => {
    // Fetch disabilities and disability groups
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
  }, []);

  // Auto-select disability groups based on selected disabilities
  useEffect(() => {
    if (selectedDisabilities.length > 0 && disabilities.length > 0) {
      // Find all unique groups from selected disabilities
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
    // Remove disabilities that don't belong to the selected groups
    if (selectedDisabilities.length > 0) {
      const validDisabilities = selectedDisabilities.filter(disabilityId => {
        const disability = disabilities.find(d => d.id === disabilityId);
        return disability?.group && groupIds.includes(disability.group.id);
      });
      // You might want to update the form field here if needed
      // This would require access to the form's setValue function
    }
  };

  return (
    <Box sx={{ p: { xs: 0, s: 2 } }}>
      {/* Disability Groups Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="disability-groups-label" sx={{ fontSize: "1rem" }}>
          ¿A que grupo de discapacidad pertenece?
        </InputLabel>
        <Select
          labelId="disability-groups-label"
          label="¿A que grupo de discapacidad pertenece?"
          multiple
          value={selectedDisabilityGroups}
          onChange={(e) => handleDisabilityGroupsChange(e.target.value)}
          input={<OutlinedInput label="¿A que grupo de discapacidad pertenece?" />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((groupId) => {
                const groupObj = disabilityGroups.find((g) => g.id === groupId);
                return (
                  <Chip
                    key={groupId}
                    label={groupObj ? groupObj.name : groupId}
                    size="small"
                  />
                );
              })}
            </Box>
          )}
          sx={{ fontSize: "1rem" }}
        >
          {disabilityGroups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Selecciona uno o más grupos para filtrar las discapacidades disponibles
        </FormHelperText>
      </FormControl>

      {/* Disability Selection */}
      {selectedDisabilityGroups.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Controller
            name="disability"
            control={control}
            defaultValue={[]}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error}>
                <InputLabel id="disability-label" sx={{ fontSize: "1rem" }}>
                  ¿Qué discapacidad tiene?
                </InputLabel>
                <Select
                  labelId="disability-label"
                  multiple
                  {...field}
                  input={<OutlinedInput label="¿Qué discapacidad tieneeee?   " />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const disObj = disabilities.find((d) => d.id === value);
                        return (
                          <Chip
                            key={value}
                            label={disObj ? disObj.name : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {filteredDisabilities.map((dis) => (
                    <MenuItem key={dis.id} value={dis.id}>
                      {dis.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {error?.message || "Puedes seleccionar múltiples discapacidades de diferentes grupos"}
                </FormHelperText>
              </FormControl>
            )}
          />
        </FormControl>
      )}

      <FormControl
        component="fieldset"
        fullWidth
        sx={{ mb: 3 }}
        error={!!errors.has_disability_certificate}
      >
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Tiene certificado oficial de discapacidad emitido por un Centro de Salud o DIF?
        </FormLabel>
        <Controller
          name="has_disability_certificate"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup 
              row 
              {...field}
              onChange={(event) => field.onChange(event.target.value === "true")}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
        <FormHelperText>
          {errors.has_disability_certificate?.message}
        </FormHelperText>
      </FormControl>

      {hasDisabilityCertificate && (
        <Controller
          name="disability_certificate_details"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Escribe el diagnóstico exacto que dice el certificado de discapacidad"
              placeholder="Escribe el diagnóstico"
              sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
              slotProps={{
                htmlInput: {
                  style: { fontSize: '1rem' }
                },
                inputLabel: {
                  style: { fontSize: '1rem' }
                },
              }}
            />
          )}
        />
      )}

      <FormControl
        component="fieldset"
        fullWidth
        sx={{ mb: 3 }}
        error={!!errors.has_disability_history}
      >
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Tiene otros familiares con alguna discapacidad?
        </FormLabel>
        <Controller
          name="has_disability_history"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup 
              row 
              {...field}
              onChange={(event) => field.onChange(event.target.value === "true")}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
        <FormHelperText>
          {errors.has_disability_history?.message}
        </FormHelperText>
      </FormControl>

      {hasDisabilityHistory && (
        <Controller
          name="disability_history_details"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Especifique el parentesco y diagnóstico"
              placeholder="Especifique el parentesco y diagnóstico"
              helperText='Si no tiene, responde "No" en la pregunta anterior.'
              sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
              slotProps={{
                htmlInput: {
                  style: { fontSize: '1rem' }
                },
                inputLabel: {
                  style: { fontSize: '1rem' }
                },
              }}
            />
          )}
        />
      )}

      <FormControl fullWidth error={!!errors.receives_pension} sx={{ mb: 3 }}>
        <InputLabel id="receives-pension-label" sx={{ fontSize: "1rem" }}>
          ¿El candidato recibe algún tipo de pensión del gobierno?
        </InputLabel>
        <Controller
          name="receives_pension"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select
              labelId="receives-pension-label"
              label="¿El candidato recibe algún tipo de pensión del gobierno?"
              sx={{ fontSize: "1rem" }}
              {...field}
            >
              <MenuItem value="">No sé</MenuItem>
              <MenuItem value="No">No recibe pensión</MenuItem>
              <MenuItem value="Bie">Sí, del Bienestar</MenuItem>
              <MenuItem value="Orf">Sí, de orfandad</MenuItem>
              <MenuItem value="Otr">Sí, otra</MenuItem>
            </Select>
          )}
        />
        <FormHelperText>
          {errors.receives_pension?.message ||
            'Elige si lo sabes o selecciona "No sé"'}
        </FormHelperText>
      </FormControl>

      <FormControl fullWidth error={!!errors.social_security} sx={{ mb: 3 }}>
        <InputLabel id="receives-pension-label" sx={{ fontSize: "1rem" }}>
          ¿Cuenta con algún esquema de Seguridad Social?
        </InputLabel>
        <Controller
          name="social_security"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select
              labelId="receives-pension-label"
              label="¿Cuenta con algún esquema de Seguridad Social?"
              sx={{ fontSize: "1rem" }}
              {...field}
            >
              <MenuItem value="">No sé</MenuItem>
              <MenuItem value="NINGUNO">Ninguno</MenuItem>
              <MenuItem value="IMSS">IMSS</MenuItem>
              <MenuItem value="ISSSTE">ISSSTE</MenuItem>
              <MenuItem value="PEMEX">PEMEX</MenuItem>
              <MenuItem value="IMSS-BIENESTAR">IMSS-Bienestar</MenuItem>
              <MenuItem value="PARTICULAR">Particular</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </Select>
          )}
        />
        <FormHelperText>
          {errors.social_security?.message ||
            'Elige si lo sabes o selecciona "No sé"'}
        </FormHelperText>
      </FormControl>

      <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Tiene juicio de interdicción?
        </FormLabel>
        <Controller
          name="has_interdiction_judgment"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup row {...field}>
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
      </FormControl>

      <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Recibe atención psicológica?
        </FormLabel>
        <Controller
          name="receives_psychological_care"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup 
              row 
              {...field}
              onChange={(event) => field.onChange(event.target.value === "true")}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
      </FormControl>

      {hasPsychologicalDetailsValue && (
        <Controller
          name="psychological_care_details"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Especifica el motivo de su terapia psicológica"
              placeholder="Escribe el motivo"
              sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
              slotProps={{
                htmlInput: {
                  style: { fontSize: '1rem' }
                },
                inputLabel: {
                  style: { fontSize: '1rem' }
                },
              }}
            />
          )}
        />
      )}

      <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Recibe atención psiquiátrica?
        </FormLabel>
        <Controller
          name="receives_psychiatric_care"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup 
              row 
              {...field}
              onChange={(event) => field.onChange(event.target.value === "true")}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
      </FormControl>

      {hasPsychiatricCareValue && (
        <Controller
          name="psychiatric_care_details"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Especifica el motivo de su terapia psiquiátrica"
              placeholder="Escribe el motivo"
              sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
              slotProps={{
                htmlInput: {
                  style: { fontSize: '1rem' }
                },
                inputLabel: {
                  style: { fontSize: '1rem' }
                },
              }}
            />
          )}
        />
      )}

      <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ fontSize: "1rem" }}>
          ¿Presenta convulsiones?
        </FormLabel>
        <Controller
          name="has_seizures"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <RadioGroup 
              row 
              {...field}
              onChange={(event) => field.onChange(event.target.value === "true")}
            >
              {yesNoOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
      </FormControl>

      <FormControl fullWidth error={!!errors.last_seizure} sx={{ mb: 3, display: hasSeizuresValue ? "flex" : "none" }}>
        <InputLabel id="last-seizure-label" sx={{ fontSize: "1rem" }}>
          ¿Cuándo fue su última convulsión?
        </InputLabel>
        <Controller
          name="last_seizure"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select
              labelId="last-seizure-label"
              label="¿Cuándo fue su última convulsión?"
              sx={{ fontSize: "1rem" }}
              {...field}
            >
              <MenuItem value="No sé">No sé</MenuItem>
              <MenuItem value="Hace menos de un año">Hace menos de un año</MenuItem>
              <MenuItem value="Hace mas de un año">Hace mas de un año</MenuItem>
            </Select>
          )}
        />
        <FormHelperText>
          {errors.last_seizure?.message ||
            'Elige si lo sabes o selecciona "No sé"'}
        </FormHelperText>
      </FormControl>
      
      <FormControl fullWidth error={!!errors.blood_type} sx={{ mb: 3 }}>
        <InputLabel id="blood-type-label" sx={{ fontSize: "1rem" }}>
          ¿Cuál es su tipo de sangre?
        </InputLabel>
        <Controller
          name="blood_type"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select
              labelId="blood-type-label"
              label="¿Cuál es su tipo de sangre?"
              sx={{ fontSize: "1rem" }}
              {...field}
            >
              <MenuItem value="">No sé</MenuItem>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        <FormHelperText>
          {errors.blood_type?.message ||
            'Elige si lo sabes o selecciona "No sé"'}
        </FormHelperText>
      </FormControl>

      <Controller
        name="allergies"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="¿Tiene alergias?"
            placeholder="Escribe tu alergia (p.ej. maní)"
            helperText="Si no tiene, déjalo en blanco."
            sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
            slotProps={{
              htmlInput: {
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
        name="dietary_restrictions"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="¿Tiene restricciones alimentarias?"
            placeholder="Escribe tu restricción (p.ej. sin gluten)"
            helperText="Si no tiene, déjalo en blanco."
            sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
            slotProps={{
              htmlInput: {
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
        name="physical_restrictions"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="¿Tiene restricciones físicas?"
            placeholder="Escribe tu restricción (p.ej. no poder cargar articulos pesados)"
            helperText="Si no tiene, déjalo en blanco."
            sx={{ mb: 3, '& .MuiOutlinedInput-notchedOutline legend': {fontSize: '0.75rem'} }}
            slotProps={{
              htmlInput: {
                style: { fontSize: '1rem' }
              },
              inputLabel: {
                style: { fontSize: '1rem' }
              },
            }}
          />
        )}
      />

      <Box sx={{ mt: 2 }}>
        <MedicationsForm />
      </Box>
    </Box>
  );
};

export default MedicalInfoForm;