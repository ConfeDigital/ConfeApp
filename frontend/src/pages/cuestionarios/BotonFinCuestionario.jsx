import React from "react";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";

const BotonFinCuestionario = ({ handleFinalizarCuestionario }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={handleFinalizarCuestionario}
      >
        Finalizar Cuestionario
      </Button>
    </Box>
  );
};

export default BotonFinCuestionario;
