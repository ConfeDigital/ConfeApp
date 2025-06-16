import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PopupCuestionario from "./PopupCuestionario"; // usa el componente existente

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const PaginaCuestionario = () => {
  useDocumentTitle("Cuestionario");
  
  const { uid, cuestionarioId } = useParams();
  const navigate = useNavigate();

  console.log("ID usuario: ", uid, " - ID cuestionario: ", cuestionarioId);

  return (
    <div>
      <PopupCuestionario
        usuarioId={uid}
        cuestionarioId={cuestionarioId}
        onClose={() => navigate(-1)} // volver atrás
      />
    </div>
  );
};

export default PaginaCuestionario;
