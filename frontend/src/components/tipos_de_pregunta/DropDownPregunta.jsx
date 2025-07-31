import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ThemeProvider,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";

const DropDownPregunta = ({
  opciones,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const seleccionRespuesta = (event) => {
    setSeleccionOpcion(event.target.value);
    // console.log("index: ", event.target.value);
  };

  // console.log("seleccionOpcion: ", seleccionOpcion);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "95%",
        mx: "auto", // Center horizontally
        my: 4, // Add vertical margin
      }}
    >
      <FormControl
        fullWidth
        sx={{
          width: "100%",
          maxWidth: "800px", // Limit width for better readability
          borderRadius: 2, // Rounded corners
          boxShadow: 3, // Subtle shadow for depth
          p: 3, // Padding inside the form control
        }}
      >
        <Select
          id="opcion-multiple"
          value={seleccionOpcion}
          onChange={seleccionRespuesta}
          displayEmpty // Allows the dropdown to display an empty state
          disabled={disabled}
          sx={{
            fontSize: "1.1rem", // Larger font size for the dropdown text
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main", // Use primary color for the border
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "secondary.main", // Change border color on hover
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main", // Focus border color
            },
          }}
          renderValue={(selected) => {
            // Si selected está fuera de rango o es -1 o '', mostramos placeholder
            if (
              selected === -1 ||
              selected === "" ||
              !Number.isInteger(selected) ||
              !opciones[selected]
            ) {
              return "Selecciona una opción";
            }
            return opciones[selected].texto;
          }}
        >
          {opciones.map((opcion, index) => (
            <MenuItem
              key={index}
              value={index}
              sx={{
                fontSize: "1.1rem", // Larger font size for menu items
                "&:hover": {
                  backgroundColor: "primary.light", // Highlight on hover
                  color: "primary.contrastText", // Text color on hover
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.main", // Selected item background
                  color: "primary.contrastText", // Selected item text color
                },
              }}
            >
              {opcion.texto}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
export default DropDownPregunta;
