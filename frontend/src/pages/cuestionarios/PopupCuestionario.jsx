import { useNavigate } from "react-router-dom";
import React from "react";
import { Button } from "@mui/material";
import DespliegueCuestionario from "./DespliegueCuestionario";

function PopupCuestionario({ usuarioId, cuestionarioId, onClose }) {
  console.log("usuario:", usuarioId);
  const navigate = useNavigate();
  return (
    <>
      <Button
        variant='outlined'
        sx={{
          ml: 3
        }}
        onClick={() => navigate(`/candidatos/${usuarioId}`)}
      >
        Ir a Candidato
      </Button>
      <DespliegueCuestionario
        usuarioId={usuarioId}
        cuestionarioId={cuestionarioId}
        onClose={onClose}
      />
    </>
  );
}

export default PopupCuestionario;
