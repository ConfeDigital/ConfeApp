import React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const BarraProgreso = ({ preguntaIndex, totalPreguntas }) => {
  const progreso = ((preguntaIndex + 1) / totalPreguntas) * 100;

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="body2" color="textSecondary">{`Pregunta ${
        preguntaIndex + 1
      } de ${totalPreguntas}`}</Typography>
      <LinearProgress variant="determinate" value={progreso} />
    </Box>
  );
};

export default BarraProgreso;
