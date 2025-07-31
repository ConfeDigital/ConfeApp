import React from "react";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

const SiguienteBoton = ({
  preguntaIndex,
  setPreguntaIndex,
  preguntasTotales,
}) => {
  function siguientePregunta() {
    setPreguntaIndex((curr) => curr + 1);
  }

  return (
    <Box sx={{ m: 10, width: "25%", alignContent: "center" }}>
      <Button
        variant="outlined"
        sx={{ width: "100%", height: "100%" }}
        onClick={siguientePregunta}
      >
        {preguntaIndex + 2 <= preguntasTotales
          ? "Siguiente: " + (preguntaIndex + 2)
          : "Enviar"}
        <NavigateNextIcon fontSize="large" />
      </Button>
    </Box>
  );
};

export default SiguienteBoton;
