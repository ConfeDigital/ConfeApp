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

const ProfileField = ({
  pregunta,
  usuarioId,
  setSeleccionOpcion,
  disabled = false,
  initialValue = null,
}) => {
  const [value, setValue] = useState(initialValue || "");
  const [initialLoaded, setInitialLoaded] = useState(false); // avoid autosave after GET
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

    if (pregunta.profile_field_path && usuarioId) {
      loadCurrentValue();
    }
  }, [pregunta, usuarioId]);

  const loadCurrentValue = async () => {
    try {
      const response = await axios.get(
        `/api/cuestionarios/profile-fields/user/${usuarioId}/value/${pregunta.profile_field_path}/`
      );
      if (response.data.success && response.data.value !== null) {
        setValue(response.data.value);
      }
    } catch (err) {
      console.error("Error loading current value:", err);
    } finally {
      setInitialLoaded(true);
    }
  };

  const saveValue = async (valToSave) => {
    setAutoSaving(true);
    setError("");
    setSuccess("");
    try {
      const payloadValue =
        typeof valToSave === "boolean" ? valToSave.toString() : valToSave;

      const response = await axios.post(
        `/api/cuestionarios/profile-fields/user/${usuarioId}/update/`,
        {
          field_path: pregunta.profile_field_path,
          value: payloadValue,
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setSeleccionOpcion(payloadValue);
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

    if (!initialLoaded) return; // don’t autosave while loading initial value

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveValue(newValue);
    }, 1500); // debounce save
  };

  const renderField = () => {
    if (!fieldMetadata) {
      return (
        <Alert severity="warning">
          Field metadata not available. Please configure the question properly.
        </Alert>
      );
    }

    const { type, label, choices, required, max_length } = fieldMetadata;

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
              {choices?.map(([choiceValue, choiceLabel]) => (
                <MenuItem key={choiceValue} value={choiceValue}>
                  {choiceLabel}
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
                py: 2,
                fontSize: "1.2rem",
                fontWeight: "bold",
                backgroundColor:
                  value === true ? "success.light" : "grey.700",
                color: value === true ? "success.contrastText" : "grey.100",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleValueChange(true)}
              disabled={disabled || autoSaving}
            >
              Sí
            </Button>

            <Button
              variant="contained"
              fullWidth
              sx={{
                py: 2,
                fontSize: "1.2rem",
                fontWeight: "bold",
                backgroundColor:
                  value === false ? "success.light" : "grey.700",
                color: value === false ? "error.contrastText" : "grey.100",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleValueChange(false)}
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
    <Box sx={{ p: 2 }}>
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

      {autoSaving && (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">Guardando cambios…</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfileField;
