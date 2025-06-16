import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function MySelectForm({label, value, name, onChange}) {

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">{label}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value = {value}
          onChange = {onChange}
          name={name}
          label={label}
          defaultValue={'Abierto'}
        >
          <MenuItem value={'Abierto'}>Abierto</MenuItem>
          <MenuItem value={'En Progreso'}>En Progreso</MenuItem>
          <MenuItem value={'Completo'}>Completo</MenuItem>

        </Select>
      </FormControl>
    </Box>
  );
}