import React from "react";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

const AnteriorBoton = ({ preguntaIndex, setPreguntaIndex }) => {
  function anteriorPregunta() {
    setPreguntaIndex((curr) => curr - 1);
    console.log(setPreguntaIndex);
  }

  return (
    <Box sx={{ m: 10, width: "25%", alignContent: "center" }}>
      <Button
        variant="outlined"
        sx={{ width: "100%", height: "100%" }}
        onClick={anteriorPregunta}
      >
        <NavigateBeforeIcon fontSize="large" />
        Anterior: {preguntaIndex}
      </Button>
    </Box>
  );
};

export default AnteriorBoton;
