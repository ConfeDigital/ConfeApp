import React from "react";
import Box from "@mui/material/Box";
import { Typography, useMediaQuery } from "@mui/material";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

const BinaryPregunta = ({
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const isMobile = useMediaQuery("(max-width:600px)");

  const opciones = [
    { id: "0", texto: "Sí" },
    { id: "1", texto: "No" }
  ];

  const handleChange = (event) => {
    setSeleccionOpcion(event.target.value); // Notify the parent component
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
        py: { xs: 2, sm: 3 },
      }}
    >
      <RadioGroup
        value={seleccionOpcion || ""}
        onChange={handleChange}
        sx={{ width: "100%" }}
      >
        {opciones.map((opcion) => (
          <Box
            key={opcion.id}
            sx={{
              width: { xs: "100%", sm: "80%" },
              backgroundColor: seleccionOpcion === opcion.id
                ? "success.light"
                : colors.grey[700],
              borderRadius: "8px",
              margin: "8px 0",
              padding: "12px",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              },
              mx: "auto",
            }}
          >
            <FormControlLabel
              control={
                <Radio
                  value={opcion.id}
                  name="binary-question"
                  sx={{
                    color: seleccionOpcion === opcion.id
                      ? "success.light"
                      : colors.grey[900],
                    "&.Mui-checked": {
                      color: "success.main",
                    },
                  }}
                  disabled={disabled}
                />
              }
              label={
                <Typography
                  variant="h6"
                  sx={{
                    color: seleccionOpcion === opcion.id
                      ? "success.contrastText"
                      : "grey.contrastText",
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    fontWeight: seleccionOpcion === opcion.id
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
      </RadioGroup>
    </Box>
  );
};

export default BinaryPregunta;