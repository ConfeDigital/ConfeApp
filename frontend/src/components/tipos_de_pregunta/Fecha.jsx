import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const Fecha = ({ seleccionOpcion, setSeleccionOpcion, disabled = false }) => {
  // Si seleccionOpcion es una cadena (por ejemplo, desde la API), conviértela a un objeto Date
  const initialDate = seleccionOpcion ? new Date(seleccionOpcion) : null;

  const [selectedDate, setSelectedDate] = React.useState(initialDate);

  const handleChange = (newValue) => {
    setSelectedDate(newValue); // Actualizar el estado local
    setSeleccionOpcion(newValue); // Notificar al componente padre
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "nowrap",
        flexDirection: "column",
        m: 4,
        alignContent: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Selecciona una fecha"
          value={selectedDate}
          onChange={handleChange}
          disabled={disabled}
          renderInput={(params) => (
            <TextField {...params} disabled={disabled} />
          )}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default Fecha;
