import React, { useState, useEffect } from "react";
import { TextField, MenuItem, InputAdornment } from "@mui/material";
import {
  countries,
  formatLocalNumber,
  getInitialState,
  getCanonicalNumber,
} from "./phoneUtils";

const StandalonePhoneInputField = ({ label, fullWidth, value: propValue, onChange: propOnChange, sx }) => {
  const initial = getInitialState(propValue);
  const [selectedCountry, setSelectedCountry] = useState(initial.selectedCountry);
  const [localNumber, setLocalNumber] = useState(
    formatLocalNumber(initial.selectedCountry.code, initial.localNumber)
  );

  // Update internal state when the external propValue changes
  useEffect(() => {
    if (propValue) {
      const newState = getInitialState(propValue);
      setSelectedCountry(newState.selectedCountry);
      setLocalNumber(formatLocalNumber(newState.selectedCountry.code, newState.localNumber));
    } else {
      const defaultInitial = getInitialState("");
      setSelectedCountry(defaultInitial.selectedCountry);
      setLocalNumber("");
    }
  }, [propValue]);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find((c) => c.code === countryCode);
    setSelectedCountry(country);
    setLocalNumber((prev) => formatLocalNumber(country.code, prev));
  };

  const handleNumberChange = (e) => {
    const formatted = formatLocalNumber(selectedCountry.code, e.target.value);
    setLocalNumber(formatted);
    const canonical = getCanonicalNumber(selectedCountry, formatted);
    if (propOnChange) {
      propOnChange(canonical);
    }
  };

  const canonicalNumber = getCanonicalNumber(selectedCountry, localNumber);

  useEffect(() => {
    if (propOnChange && propValue !== canonicalNumber) {
      propOnChange(canonicalNumber);
    }
  }, [canonicalNumber, propOnChange, propValue]);

  return (
    <TextField
      label={label}
      fullWidth={fullWidth}
      value={localNumber}
      onChange={handleNumberChange}
      sx={sx}
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

export default StandalonePhoneInputField;