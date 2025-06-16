import * as React from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function DatePickerForm({label, value , onChange}) {
  return (
    <DemoContainer components={['DatePicker']} >
      <DatePicker 
              label={label} 
              sx={{width:'100%'}}
              value={value}
              onChange={onChange}
              inputFormat="DD/MM/YYYY" 
              />
    </DemoContainer>
  );
}