import React from "react";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

const OpcionMultiple = ({
  opciones,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const seleccionRespuesta = (index) => {
    setSeleccionOpcion(index);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 2,
        width: "100%",
        mt: 2,
        px: { xs: 1, sm: 2 },
      }}
    >
      {opciones.map((opcion, index) => (
        <Button
          key={index}
          variant="contained"
          sx={{
            flex: { xs: "1 1 100%", sm: opciones.length === 2 ? "1 1 45%" : "1 1 100%" }, // responsive size
            minWidth: "120px",
            py: 1,
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor:
              seleccionOpcion === index ? "success.light" : colors.grey[700],
            color:
              seleccionOpcion === index
                ? "success.contrastText"
                : "grey.contrastText",
            boxShadow: 3,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
            },
            "&.Mui-disabled": {
              backgroundColor:
                seleccionOpcion === index ? "success.light" : colors.grey[700],
              color:
                seleccionOpcion === index
                  ? "success.contrastText"
                  : "grey.contrastText",
            },
          }}
          onClick={() => seleccionRespuesta(index)}
          disabled={disabled}
        >
          {opcion.texto}
        </Button>
      ))}
    </Box>
  );
};

export default OpcionMultiple;
