import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

const Numeros = ({ seleccionOpcion, setSeleccionOpcion, disabled = false }) => {
  const handleChange = (event) => {
    const value = event.target.value;
    // Validar que solo se ingresen números
    if (/^\d*$/.test(value)) {
      setSeleccionOpcion(value); // Actualiza el estado de la respuesta
    }
  };

  return (
    <Box
      component="form"
      display="flex"
      sx={{
        "& > :not(style)": {
          width: "100%",
          m: 4,
          pl: 1,
          pr: 1,
          pt: 0.002,
          pb: 0.002,
          justifyContent: "center",
          display: "inline-flex",
        },
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        id="filled-number"
        label="Número de Teléfono"
        variant="filled"
        value={seleccionOpcion || ""} // Usa el valor de seleccionOpcion
        onChange={handleChange}
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*", // Esto ayuda a los dispositivos móviles a mostrar el teclado numérico
        }}
        // Agregar una validación adicional para evitar que el usuario pegue texto no numérico
        onPaste={(e) => {
          const pasteText = e.clipboardData.getData("text/plain");
          if (!/^\d*$/.test(pasteText)) {
            e.preventDefault();
          }
        }}
        disabled={disabled}
      />
    </Box>
  );
};

export default Numeros;
