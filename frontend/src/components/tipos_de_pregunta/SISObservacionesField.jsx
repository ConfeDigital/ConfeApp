import React, { useState, useCallback, useRef } from "react";
import { TextField, Box } from "@mui/material";

const SISObservacionesField = ({ 
  preguntaId, 
  value = "", 
  onChange, 
  disabled = false,
  label = "Observaciones"
}) => {
  const [localValue, setLocalValue] = useState(value);
  const saveTimeoutRef = useRef(null);

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    
    // Update local state immediately for instant UI response
    setLocalValue(newValue);
    
    // Clear previous save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save after user stops typing for 1 second
    saveTimeoutRef.current = setTimeout(() => {
      onChange(preguntaId, newValue);
    }, 1000);
  }, [preguntaId, onChange]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box >
      <TextField
        fullWidth
        multiline
        rows={3}
        label={label}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.87)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
    </Box>
  );
};

export default SISObservacionesField;
