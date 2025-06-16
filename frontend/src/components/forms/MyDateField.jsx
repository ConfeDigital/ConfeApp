import * as React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';

export default function MyDateField(props) {
  const { label, name, control, ...rest } = props;
  
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
        <DatePicker
          label={label}
          value={value ? dayjs(value) : null}
          onChange={(newValue) => {
            // Convert dayjs object to JavaScript Date for yup validation
            const dateValue = newValue ? newValue.toDate() : null;
            onChange(dateValue);
          }}
          onClose={onBlur} // Trigger validation when picker closes
          format="DD-MM-YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error,
              helperText: error ? error.message : null,
              onBlur: onBlur, // Also trigger validation on input blur
            },
          }}
          {...rest}
        />
      )}
    />
  );
}