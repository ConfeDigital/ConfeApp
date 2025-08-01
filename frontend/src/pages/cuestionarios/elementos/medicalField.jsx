import React from "react";
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
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import MedicationsForm from "./medications";

const yesNoOptions = [
  { value: true, label: "Sí" },
  { value: false, label: "No" },
];

const MedicalInfoForm = () => {
  const { control, formState: { errors }, watch } = useFormContext();

  const hasSeizuresValue = watch("has_seizures");
  const hasPsychologicalDetailsValue = watch("receives_psychological_care");
  const hasPsychiatricCareValue = watch("receives_psychiatric_care");
  const hasDisabilityCertificate = watch("has_disability_certificate");
  const hasDisabilityHistory = watch("has_disability_history");

  return (
    <Box sx={{ p: { xs: 0, s: 2 } }}>
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
              // helperText="Si no tiene, déjalo en blanco."
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
          ¿Tiene algún familiar con discapacidad?
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
              label="Explica quién en su familia y qué tipo de discapacidad"
              placeholder="Explica"
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
              // helperText="Si no tiene, déjalo en blanco."
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
              // helperText="Si no tiene, déjalo en blanco."
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
              <MenuItem value="">No sé</MenuItem>
              <MenuItem value="1">Hace menos de un año</MenuItem>
              <MenuItem value="2">Hace mas de un año</MenuItem>
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
