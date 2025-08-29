// components/agencia/EmployersGrid.jsx
import React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { IconButton, Tooltip, Box } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

export default function EmployersDataGrid({
  rows,
  onEdit,
  onDelete,
  handleToggleActive,
  companyNameVisibility,
  isLoading
}) {
  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "nombre_completo", headerName: "Nombre", flex: 1, minWidth: 130 },
    { field: "company_name", headerName: "Empresa", flex: 1, minWidth: 160 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit(params.row)}>
              <Edit color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              params.row.is_active ? "Desactivar Usuario" : "Activar Usuario"
            }
          >
            <IconButton
              onClick={() => handleToggleActive(params.row)}
              size="small"
              color={params.row.is_active ? "success" : "error"}
            >
              {params.row.is_active ? (
                <ToggleOnIcon fontSize="small" />
              ) : (
                <ToggleOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {/* <Tooltip title="Eliminar">
            <IconButton onClick={() => onDelete(params.row.id)}>
              <Delete color="error" />
            </IconButton>
          </Tooltip> */}
        </>
      ),
    },
  ];

  const getRowClassName = (params) => {
    return params.row.is_active ? "" : "inactive-row-opaque";
  };

  return (
    <Box mt={2} display="grid" height="70vh" className="custom-datagrid">
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={8}
        rowsPerPageOptions={[8]}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        getRowClassName={getRowClassName}
        initialState={{
            columns: {
              columnVisibilityModel: {
                // Hide columns status and traderName, the other columns will remain visible
                id: false,
                company_name: companyNameVisibility
              },
            },
          }}
        loading={isLoading}
      />
    </Box>
  );
}
