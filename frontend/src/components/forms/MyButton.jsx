import * as React from 'react';
import Button from '@mui/material/Button';

export default function MyButton(props) {
  const {label, type, onClick} = props
  return (
      <Button type={type || "button"} variant="contained" className={"myButton"} onClick={onClick} >
            {label}
      </Button>

  );
}