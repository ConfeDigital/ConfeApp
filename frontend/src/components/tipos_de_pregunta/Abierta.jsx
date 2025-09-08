import React from "react";
import { useMediaQuery } from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";

const Abierta = ({ seleccionOpcion, setSeleccionOpcion, disabled }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (event) => {
    setSeleccionOpcion(event.target.value);
    // console.log(event.target.value);
  };

  return (
    <Box
      component="form"
      display="flex"
      sx={{
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        px: isMobile ? 1 : 4,
        py: isMobile ? 1 : 2,
      }}
      noValidate
      autoComplete="off"
    >
      <TextField
        id="filled-multiline-static"
        label="Escribe tu respuesta"
        multiline
        rows={isMobile ? 3 : 4}
        variant="filled"
        value={seleccionOpcion || ""}
        onChange={handleChange}
        disabled={disabled}
        sx={{
          width: "100%",
          "& .MuiInputBase-input": {
            fontSize: isMobile ? "1rem" : "1.25rem",
          },
          "& .MuiInputLabel-root": {
            fontSize: isMobile ? "1rem" : "1.25rem",
          },
          // "& .MuiFilledInput-root": {
          //   backgroundColor: "rgba(255, 255, 255, 0.8)",
          // },
          // "& .MuiFilledInput-underline:before": {
          //   borderBottomColor: "rgba(0, 0, 0, 0.1)",
          // },
          // "& .MuiFilledInput-underline:after": {
          //   borderBottomColor: "#3f51b5",
          // },
        }}
      />
    </Box>
  );
};

export default Abierta;