import React from "react";
import Box from "@mui/material/Box";
import { Typography, useMediaQuery } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

const CheckboxPregunta = ({
  opciones,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const isMobile = useMediaQuery("(max-width:600px)");

  // Ensure seleccionOpcion is an array of objects
  const selectedOptions = Array.isArray(seleccionOpcion) ? seleccionOpcion : [];

  const handleChange = (event, opcion) => {
    const newSeleccionOpcion = [...selectedOptions];
    const isChecked = event.target.checked;
    const optionExists = newSeleccionOpcion.some(
      (item) => item.id === opcion.id
    );

    if (isChecked && !optionExists) {
      // Add the option object if checked and not already present
      newSeleccionOpcion.push({ id: opcion.id, texto: opcion.texto });
    } else if (!isChecked && optionExists) {
      // Remove the option object if unchecked and present
      const index = newSeleccionOpcion.findIndex(
        (item) => item.id === opcion.id
      );
      if (index !== -1) {
        newSeleccionOpcion.splice(index, 1);
      }
    }

    setSeleccionOpcion(newSeleccionOpcion); // Notify the parent component with the new array of objects
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        px: { xs: 1, sm: 2 },
      }}
    >
      {opciones.map((opcion) => (
        <Box
          key={opcion.id}
          sx={{
            width: { xs: "100%", sm: "80%" },
            backgroundColor: selectedOptions.some((item) => item.id === opcion.id)
              ? "secondary.light"
              : colors.grey[700],
            borderRadius: "8px",
            my: 1,
            padding: 1,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedOptions.some((item) => item.id === opcion.id)}
                onChange={(event) => handleChange(event, opcion)}
                name={`checkbox-${opcion.id}`}
                sx={{
                  color: selectedOptions.some((item) => item.id === opcion.id)
                    ? "success.light"
                    : colors.grey[900],
                  "&.Mui-checked": {
                    color: "primary.dark",
                  },
                }}
                disabled={disabled}
              />
            }
            label={
              <Typography
                variant="h6"
                sx={{
                  color: selectedOptions.some((item) => item.id === opcion.id)
                    ? "secondary.contrastText"
                    : "grey.contrastText",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: selectedOptions.some((item) => item.id === opcion.id)
                    ? "bold"
                    : "normal",
                }}
              >
                {opcion.texto}
              </Typography>
            }
            sx={{ width: "100%" }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default CheckboxPregunta;