import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DespliegueCuestionario from "./DespliegueCuestionario"; // usa el componente existente

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const PaginaCuestionario = () => {
  useDocumentTitle("Cuestionario");

  const { uid, cuestionarioId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <DespliegueCuestionario
        usuarioId={uid}
        cuestionarioId={cuestionarioId}
        onClose={() => navigate(-1)} // volver atrás
      />
    </div>
  );
};

export default PaginaCuestionario;
