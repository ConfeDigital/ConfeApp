// src/components/agencia/JobAssignmentGrid.jsx
import React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const JobAssignmentGrid = ({ rows, onOpenAssignModal }) => {
  const columns = [
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'company_name', headerName: 'Empresa', flex: 0.6 },
    { 
      field: 'location_details', 
      headerName: 'Ubicación', 
      flex: 1,
      renderCell: (params) => {
        const location = params.value;
        if (!location) return 'N/A';
        return (
          <Tooltip
            title={
              <>
                <Typography variant="body2">
                  <strong>Código Postal:</strong> {location.address_PC || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Calle:</strong> {location.address_road || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Número:</strong> {location.address_number || 'N/A'}
                </Typography>
              </>
            }
          >
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              {location.address_municip || 'Ver detalles'}
            </span>
          </Tooltip>
        );
      }
    },
    { field: 'job_description', headerName: 'Descripción', flex: 1 },
    { field: 'vacancies', headerName: 'Vacantes', type: 'number', flex: 0.5 },
    {
      field: 'assign',
      headerName: 'Asignar Candidato',
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Asignar Candidato">
          <IconButton onClick={() => onOpenAssignModal(params.row)}>
            <AssignmentIndIcon color="primary" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box 
        mt={2} 
        display="grid"
        height="75vh"
        className="custom-datagrid"
    >
      <DataGrid 
        rows={rows} 
        columns={columns} 
        pageSize={10}
        rowsPerPageOptions={[10]}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </Box>
  );
};

export default JobAssignmentGrid;
