import { Box, Typography, useTheme, Button, Tooltip } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../../api";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { useMediaQuery } from "@mui/material";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";

// ✅ Recibe props: estadoFiltro y onRowClick
const CandidateConsult = ({ estadoFiltro = null, onRowClick = null }) => {
  useDocumentTitle('Consultar Candidato');

  const isSmallScreen = useMediaQuery("(max-width:800px)");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      const response = await axios.get("/api/candidatos/lista/");
      let data = response.data;

      // ✅ Si se pasó un estadoFiltro, filtramos
      if (estadoFiltro) {
        data = data.filter((c) => c.estado === estadoFiltro);
      }

      setCandidates(data);
    };
    fetchCandidates();
  }, [estadoFiltro]);

  const columns = [
    { field: "id", headerName: "ID", width: 50 },
    {
      field: "nombre_completo",
      headerName: "Nombre",
      flex: 1,
      minWidth: 200,
      cellClassName: "name-column--cell",
    },
    {
      field: "edad",
      headerName: "Edad",
      type: "number",
      headerAlign: "left",
      align: "left",
      width: 70,
    },
    {
      field: "discapacidad",
      headerName: "Discapacidad",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "telefono",
      headerName: "Teléfono",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        return <span>{formatCanonicalPhoneNumber(params.value)}</span>;
      },
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "municipio",
      headerName: "Domicilio", // Changed header to "Domicilio" as it represents the domicile info
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const municipio = params.value;
        const domicile = params.row.domicile; // Access the full domicile object from the row data

        if (!domicile) return municipio || 'N/A'; // Display municipio if domicile is not available

        return (
          <Tooltip
            title={
              <>
                <Typography variant="body2">
                  <strong>Código Postal:</strong> {domicile.address_PC || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Calle:</strong> {domicile.address_road || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Número:</strong> {domicile.address_number || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Interior:</strong> {domicile.address_number_int || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Municipio:</strong> {domicile.address_municip || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Colonia:</strong> {domicile.address_col || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Estado:</strong> {domicile.address_state || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Ciudad:</strong> {domicile.address_city || 'N/A'}
                </Typography>
              </>
            }
          >
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              {municipio || 'Domicilio'} {/* Display the municipio for the cell */}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "fecha_registro",
      headerName: "Registro",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "estado",
      headerName: "Estado",
      // flex: 1,
      width: 120,
    },
    {
      field: "ciclo",
      headerName: "Ciclo",
      // flex: 1,
      width: 120,
    },
  ];

  // ✅ Click configurable
  const handleRowClick = (params) => {
    if (onRowClick) {
      onRowClick(params.row); // permite comportamiento externo
    } else {
      navigate(`/candidatos/${params.row.id}`);
    }
  };

  return (
    <Box sx={{ m:2 }} >
      <Button
        variant="contained"
        endIcon={<PersonAddAltIcon />}
        color="primary"
        onClick={() => navigate("/candidatos/crear")}
        sx={{ mb: 2, alignContent:'end' }}
      >
        {!isSmallScreen && "Agregar Candidato"}
      </Button>
      <Box
        display="grid"
        height="75vh"
        className="custom-datagrid"
      >
        <DataGrid
          rows={candidates}
          columns={columns}
          onRowClick={handleRowClick}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                // Hide columns status and traderName, the other columns will remain visible
                id: false,
                email: false,
                fecha_registro: false,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CandidateConsult;
