import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

const FechaHora = ({
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  // Si seleccionOpcion es una cadena (por ejemplo, desde la API), conviértela a un objeto Date
  const initialDateTime = seleccionOpcion ? new Date(seleccionOpcion) : null;

  const [selectedDateTime, setSelectedDateTime] =
    React.useState(initialDateTime);

  const handleChange = (newValue) => {
    setSelectedDateTime(newValue); // Actualizar el estado local
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
        <DateTimePicker
          label="Selecciona fecha y hora"
          value={selectedDateTime}
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

export default FechaHora;
