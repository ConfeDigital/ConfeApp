import React, { useState, useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { TextField, MenuItem, InputAdornment } from "@mui/material";
import {
  countries,
  formatLocalNumber,
  getInitialState,
  getCanonicalNumber,
} from "./phoneUtils";

const PhoneInputField = ({ label, fullWidth, error, value, onChange, sx, disabled = false }) => {
  const initial = getInitialState(value);
  const [selectedCountry, setSelectedCountry] = useState(initial.selectedCountry);
  const [localNumber, setLocalNumber] = useState(
    formatLocalNumber(initial.selectedCountry.code, initial.localNumber)
  );
  
  // Track if we're handling an external update to avoid circular updates
  const [isExternalUpdate, setIsExternalUpdate] = useState(false);
  // Use a ref to track the previous value for comparison
  const prevValueRef = useRef(value);

  // Update internal state when external canonical value changes
  useEffect(() => {
    // Skip if this is the initial render or value hasn't actually changed
    if (value === prevValueRef.current) {
      return;
    }
    
    // Update the ref
    prevValueRef.current = value;
    
    if (value) {
      // Check if the current internal state already matches the new value
      const currentCanonical = getCanonicalNumber(selectedCountry, localNumber);
      if (value !== currentCanonical) {
        setIsExternalUpdate(true);
        const newState = getInitialState(value);
        setSelectedCountry(newState.selectedCountry);
        setLocalNumber(formatLocalNumber(newState.selectedCountry.code, newState.localNumber));
      }
    }
  }, [value]);

  // When internal state changes, update the parent's canonical value
  useEffect(() => {
    // Skip if we're currently processing an external update
    if (isExternalUpdate) {
      setIsExternalUpdate(false);
      return;
    }
    
    const canonical = getCanonicalNumber(selectedCountry, localNumber);
    if (canonical !== value) {
      onChange(canonical);
      // Update the ref immediately to avoid unnecessary processing
      prevValueRef.current = canonical;
    }
  }, [selectedCountry, localNumber]);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find((c) => c.code === countryCode);
    setSelectedCountry(country);
    setLocalNumber((prev) => formatLocalNumber(country.code, prev));
  };

  const handleNumberChange = (e) => {
    const formatted = formatLocalNumber(selectedCountry.code, e.target.value);
    setLocalNumber(formatted);
  };

  return (
    <TextField
      label={label}
      fullWidth={fullWidth}
      error={!!error}
      helperText={error ? error.message : ""}
      value={localNumber}
      onChange={handleNumberChange}
      sx={sx}
      disabled={disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <TextField
              select
              value={selectedCountry.code}
              onChange={handleCountryChange}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{
                width: 80,
                mr: 1,
                "& .MuiSelect-select": { display: "flex", alignItems: "center" },
              }}
              disabled={disabled}
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  <span style={{ marginRight: 4 }}>{country.flag}</span>
                  {country.dialCode}
                </MenuItem>
              ))}
            </TextField>
          </InputAdornment>
        ),
      }}
    />
  );
};

const MyPhoneField = ({ name, control, label, fullWidth, sx, disabled = false }) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field, fieldState: { error } }) => (
        <PhoneInputField
          label={label}
          fullWidth={fullWidth}
          value={field.value}
          error={error}
          onChange={field.onChange}
          sx={sx}
          disabled={disabled}
        />
      )}
    />
  );
};

export default MyPhoneField;