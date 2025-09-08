import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "../../api";
import StandalonePhoneInputField from "../../components/phone_number/StandalonePhoneInputField";

const DEBOUNCE_TIMES = {
  text: 2000,
  textarea: 2000, // Longer delay for more content
  phonenumber: 1500,
  choice: 250,    // Shorter delay since it's a single click
  boolean: 250,    // Shorter delay since it's a single click
  default: 500,
};

const ProfileField = ({
  pregunta,
  usuarioId,
  setSeleccionOpcion,
  disabled = false,
  initialValue = null,
}) => {
  const [value, setValue] = useState(initialValue);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldMetadata, setFieldMetadata] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const debounceRef = useRef();

  useEffect(() => {
    const metadata =
      pregunta.profile_field_metadata || pregunta.profile_field_config;
    if (metadata) {
      setFieldMetadata(metadata);
    }
  }, [pregunta]); // Dependency on 'pregunta' to ensure metadata is set

  useEffect(() => {
    if (pregunta.profile_field_path && usuarioId && fieldMetadata) {
      loadCurrentValue();
    }
  }, [pregunta, usuarioId, fieldMetadata]); // Added fieldMetadata to the dependency array

  const loadCurrentValue = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/cuestionarios/profile-fields/user/${usuarioId}/value/${pregunta.profile_field_path}/`
      );
      if (response.data.success && response.data.value !== null) {
        let displayValue = response.data.value;

        // Convert actual profile values to option indices for display
        if (fieldMetadata?.type === "choice" && pregunta.opciones) {
          const choiceIndex = fieldMetadata.choices?.findIndex(
            ([val, label]) => val === response.data.value
          );
          if (choiceIndex >= 0 && pregunta.opciones[choiceIndex]) {
            displayValue = pregunta.opciones[choiceIndex].valor;
          }
        } else if (fieldMetadata?.type === "boolean") {
          const boolValue = response.data.value;
          if (
            boolValue === true ||
            boolValue === "true" ||
            boolValue === 1 ||
            boolValue === "1"
          ) {
            displayValue = 0; // Sí
          } else if (
            boolValue === false ||
            boolValue === "false" ||
            boolValue === 0 ||
            boolValue === "0"
          ) {
            displayValue = 1; // No
          } else {
            console.warn("Unexpected boolean value:", boolValue);
            displayValue = null;
          }
        }
        setValue(displayValue);
        // Notify parent component of the loaded value
        if (setSeleccionOpcion && displayValue !== null) {
          setSeleccionOpcion(displayValue.toString());
        }
      } else {
        setValue(null);
        // Notify parent component that there's no value
        if (setSeleccionOpcion) {
          setSeleccionOpcion("");
        }
      }
    } catch (err) {
      console.error("Error loading current value:", err);
      setError("Error loading initial field value.");
    } finally {
      setInitialLoaded(true);
      setLoading(false);
    }
  };

  const saveValue = async (valToSave) => {
    setAutoSaving(true);
    setError("");
    setSuccess("");
    try {
      // For choice and boolean fields, convert the selected option index back to the actual value
      let actualValue = valToSave;
      let opcionValue = valToSave;

      if (fieldMetadata?.type === "choice" && pregunta.opciones) {
        const selectedOption = pregunta.opciones.find(
          (opt) => opt.valor === parseInt(valToSave)
        );
        if (selectedOption && fieldMetadata.choices) {
          const choiceIndex = pregunta.opciones.findIndex(
            (opt) => opt.valor === parseInt(valToSave)
          );
          if (choiceIndex >= 0 && fieldMetadata.choices[choiceIndex]) {
            actualValue = fieldMetadata.choices[choiceIndex][0];
          }
          opcionValue = selectedOption.valor;
        }
      } else if (fieldMetadata?.type === "boolean") {
        actualValue = (parseInt(valToSave) === 0).toString();
        const selectedOption = pregunta.opciones?.find(
          (opt) => opt.valor === parseInt(valToSave)
        );
        opcionValue =
          selectedOption?.texto || (parseInt(valToSave) === 0 ? "Sí" : "No");
      } else {
        actualValue =
          typeof valToSave === "boolean" ? valToSave.toString() : valToSave;
        opcionValue = actualValue;
      }

      const response = await axios.post(
        `/api/cuestionarios/profile-fields/user/${usuarioId}/update/`,
        {
          field_path: pregunta.profile_field_path,
          value: actualValue,
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        // Only update parent state after successful save to avoid triggering another save
        if (setSeleccionOpcion) {
          setSeleccionOpcion(opcionValue.toString());
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        "Error updating profile field: " +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setAutoSaving(false);
    }
  };

  const handleValueChange = (newValue) => {
    setValue(newValue);
    setError("");
    setSuccess("");

    // Immediately notify parent component for validation purposes
    if (setSeleccionOpcion && initialLoaded) {
      setSeleccionOpcion(newValue?.toString() || "");
    }

    if (!initialLoaded) return;

    const debounceTime = DEBOUNCE_TIMES[fieldMetadata?.type] || DEBOUNCE_TIMES.default;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveValue(newValue);
    }, debounceTime);
  };

  const renderField = () => {
    if (!fieldMetadata) {
      return (
        <Alert severity="warning">
          Field metadata not available. Please configure the question properly.
        </Alert>
      );
    }

    const { type, label, required, max_length } = fieldMetadata;

    if (loading) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">Cargando datos…</Typography>
        </Box>
      );
    }

    switch (type) {
      case "text":
        return (
          <TextField
            fullWidth
            label={label}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            required={required}
            disabled={disabled || autoSaving}
            inputProps={{ maxLength: max_length }}
            helperText={fieldMetadata.help_text}
          />
        );
      case "textarea":
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={label}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            required={required}
            disabled={disabled || autoSaving}
            inputProps={{ maxLength: max_length }}
            helperText={fieldMetadata.help_text}
          />
        );
      case "choice":
        return (
          <FormControl fullWidth required={required}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={disabled || autoSaving}
              label={label}
            >
              <MenuItem value="">
                <em>Seleccionar...</em>
              </MenuItem>
              {pregunta.opciones?.map((opcion) => (
                <MenuItem key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case "boolean":
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              width: "100%",
            }}
          >
            <Button
              variant="contained"
              fullWidth
              sx={{
                fontSize: "1rem",
                fontWeight: "bold",
                py: 1,
                backgroundColor: value === 0 ? "success.light" : "grey.700",
                color: value === 0 ? "success.contrastText" : "grey.100",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleValueChange(0)}
              disabled={disabled || autoSaving}
            >
              Sí
            </Button>
            <Button
              variant="contained"
              fullWidth
              sx={{
                fontSize: "1rem",
                fontWeight: "bold",
                py: 1,
                backgroundColor: value === 1 ? "success.light" : "grey.700",
                color: value === 1 ? "error.contrastText" : "grey.100",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleValueChange(1)}
              disabled={disabled || autoSaving}
            >
              No
            </Button>
          </Box>
        );
      case "date":
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) =>
                handleValueChange(
                  newValue ? newValue.format("YYYY-MM-DD") : ""
                )
              }
              disabled={disabled || autoSaving}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: required,
                  helperText: fieldMetadata.help_text,
                },
              }}
            />
          </LocalizationProvider>
        );
      case "phonenumber":
        return (
          <StandalonePhoneInputField
            label={label}
            fullWidth
            value={value}
            onChange={handleValueChange}
            disabled={disabled || autoSaving}
            required={required}
          />
        );
      default:
        return (
          <Alert severity="error">Unsupported field type: {type}</Alert>
        );
    }
  };

  return (
    <Box
      sx={{
        gap: 2,
        width: "100%",
        mt: 2,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ mb: 2 }}>{renderField()}</Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {autoSaving && !loading && (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">Guardando cambios…</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfileField;