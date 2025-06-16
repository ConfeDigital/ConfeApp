import * as React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Controller } from 'react-hook-form';

export default function MyTextField(props) {
  const { label, name, control, type, select, options, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextField
          fullWidth
          onChange={onChange}
          value={value}
          label={label}
          variant="outlined"
          error={!!error}
          helperText={error ? error.message : ""}
          type={type || "text"}
          // If using type="date", force the label to shrink
          InputLabelProps={ type === "date" ? { shrink: true } : {} }
          select={select}
          {...rest}
        >
          {select &&
            options &&
            options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
        </TextField>
      )}
    />
  );
}
