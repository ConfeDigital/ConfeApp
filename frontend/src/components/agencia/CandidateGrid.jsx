import React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import "../../styles/DataGridStyles.css";
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const agencyStateOptions = {
  Bol: 'Bolsa de Trabajo',
  Emp: 'Empleado',
  Des: 'Desempleado'
};

const CandidateGrid = ({ candidates, onAgencyStateUpdate, onOpenAssignJob, onOpenRemoveJob }) => {
  dayjs.locale('es');

  const columns = [
    { field: 'nombre_completo', headerName: 'Nombre Completo', flex: 1, minWidth: 200 },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'agency_state', 
      headerName: 'Estado Agencia', 
      flex: 1,
      minWidth: 150,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'Bol', label: 'Bolsa de Trabajo' },
        { value: 'Emp', label: 'Empleado' },
        { value: 'Des', label: 'Desempleado' }
      ],
      renderCell: (params) => {
        let textColor = 'inherit'; // Default color

        if (params.row.agency_state === 'Emp') {
          textColor = 'success.main'; // Material-UI success color
        } else if (params.row.agency_state === 'Des') {
          textColor = 'warning.main'; // Material-UI warning color
        } else if (params.row.agency_state === 'Bol') {
          textColor = 'info.main';    // Material-UI info color
        }

        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: textColor }}>
              {agencyStateOptions[params.value] || params.value}
            </Typography>
          </div>
        );
      }
    },
    { 
      field: 'current_job_name', 
      headerName: 'Empleo Actual', 
      flex: 1,
      minWidth: 160,
    },
    { 
      field: 'current_job_company', 
      headerName: 'Empresa', 
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'current_job_start',
      headerName: 'Inicio',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '100%',
            height: '100%'
          }}>
            <Typography>{params.row.current_job_start != 'N/A' ? dayjs(params.row.current_job_start).format('LL') : params.row.current_job_start}</Typography>
          </div>
        )
      }
    },
    {
      field: 'assign',
      headerName: 'Acciones',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const assignEnabled = params.row.agency_state === 'Bol';
        const removeEnabled = params.row.agency_state === 'Emp';
        return (
          <Box>
            {assignEnabled &&(
              <Tooltip title="Asignar Empleo">
                <span>
                  <IconButton
                    onClick={() => assignEnabled && onOpenAssignJob(params.row)}
                    disabled={!assignEnabled}
                  >
                    <AssignmentIcon color={assignEnabled ? "primary" : "disabled"} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {removeEnabled &&(
              <Tooltip title="Quitar Empleo">
                <span>
                  <IconButton
                    onClick={() => removeEnabled && onOpenRemoveJob(params.row)}
                    disabled={!removeEnabled}
                  >
                    <RemoveCircleIcon color={removeEnabled ? "error" : "disabled"} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            
          </Box>
        );
      }
    }
  ];

  const processRowUpdate = async (newRow, oldRow) => {
    if (newRow.agency_state !== oldRow.agency_state) {
      await onAgencyStateUpdate(newRow.id, newRow.agency_state);
    }
    return newRow;
  };

  return (
    <Box 
      mt={2} 
      display="grid"
      height="75vh"
      className="custom-datagrid"
    >
      <DataGrid
        rows={candidates}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        processRowUpdate={processRowUpdate}
        experimentalFeatures={{ newEditingApi: true }}
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

export default CandidateGrid;