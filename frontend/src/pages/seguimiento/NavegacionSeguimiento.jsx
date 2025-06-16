import { useNavigate } from "react-router-dom";
import CandidateConsult from "../scenes/CandidateConsult";

const NavegacionSeguimiento = () => {
  const navigate = useNavigate();

  return (
    <CandidateConsult
      estadoFiltro="Agencia"
      onRowClick={(row) => navigate(`/seguimiento-candidatos/${row.id}`)}
    />
  );
};

export default NavegacionSeguimiento;
