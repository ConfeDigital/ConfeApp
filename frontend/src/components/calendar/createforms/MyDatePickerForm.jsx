import * as React from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

export default function MyDateTimePickerForm({label, value, name, onChange}) {
    const handleDateChange = (newDate) => {
        onChange({ target: {name:name, value: dayjs(newDate)}})

    }

  return (
    <DemoContainer components={['DateTimePicker']}>
      <DateTimePicker 
          sx={{width:'100%'}}
          inputFormat = 'DD/MM/YYYY HH:mm'
          value = {value}
          onChange = {handleDateChange}
          name={name}
          label={label}
          />
    </DemoContainer>
  );
}