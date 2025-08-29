import { Box, IconButton, Tooltip } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Edit, Delete } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import "../../styles/DataGridStyles.css";
import { useSelector } from "react-redux";

export const DisabilitiesGrid = ({ tabIndex, data, handleEdit, handleDelete, isLoading }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isStaff = useSelector((state) => state.auth.user?.is_staff);

  const rows = tabIndex === 0
    ? data.groups || []
    : tabIndex === 1
    ? data.disabilities || []
    : data.aids || [];

  const columns = [
    { field: "name", headerName: "Nombre", flex: 1, minWidth: 160 },
    tabIndex === 1
      ? {
          field: "group",
          headerName: "Grupo",
          flex: 1,
          minWidth: 120,
          renderCell: (cellValues) => {
            const disability = data.disabilities.find(
              (d) => d.id === cellValues.id
            );
            return disability?.group?.name || "No Group";
          },
        }
    : null,
    {
      field: "actions",
      headerName: "Acciones",
      width: 100,
      renderCell: (params) => (
        <>
          <Tooltip title='Editar'>
            <IconButton onClick={() => handleEdit(params.row)} color="primary">
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title='Eliminar'>
            <IconButton onClick={() => handleDelete(params.row.id)} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <Box 
      mt={2} 
      display="grid"
      height={isStaff ? "70vh" : "76vh"}
      className="custom-datagrid"
    >
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        columnVisibilityModel={{
          actions: isStaff ? true : false
        }}
        disableColumnSelector
        loading={isLoading}
      />
    </Box>
  );
};