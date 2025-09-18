import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import DespliegueCuestionarioCandidato from "./DespliegueCuestionarioCandidato";
import NavBar from "../../components/NavBar";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const PaginaCuestionarioCandidato = () => {
  useDocumentTitle("Cuestionario - Candidato");

  const { userId, questionnaireId } = useParams();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background:
          "linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)",
        minHeight: "100vh",
      }}
    >
      <NavBar />
      <Box sx={{ p: 2 }}>
        <DespliegueCuestionarioCandidato
          usuarioId={userId}
          cuestionarioId={questionnaireId}
          onClose={() => navigate("/candidato/dashboard")}
        />
      </Box>
    </Box>
  );
};

export default PaginaCuestionarioCandidato;
