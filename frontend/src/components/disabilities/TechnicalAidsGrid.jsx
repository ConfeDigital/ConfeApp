import React from 'react';
import { Box } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import "../../styles/DataGridStyles.css";
import { useSelector } from 'react-redux';

const TechnicalAidsGrid = ({ data, selectedImpedimentId, loading, onView }) => {
  const isStaff = useSelector((state) => state.auth.user?.is_staff);
  
  const rows = data
    .filter((ta) =>
      ta.impediments && ta.impediments.some((rel) => rel.impediment.id === selectedImpedimentId)
    )
    .map((ta) => {
      const rel = ta.impediments.find((r) => r.impediment.id === selectedImpedimentId);
      return {
        id: ta.id,
        technicalAidName: ta.name,
        description: rel ? rel.description : '',
        links: ta.links ? ta.links.map((link) => link.url).join(', ') : '',
      };
    });

  const columns = [
    // { field: 'id', headerName: 'ID', width: 20 },
    { field: 'technicalAidName', headerName: 'Apoyo', flex: 1, minWidth: 160 },
    { field: 'description', headerName: 'Descripción', flex: 2, minWidth: 180 },
    { field: 'links', headerName: 'Links', flex: 1, minWidth: 120 },
  ];

  return (
      <Box className="custom-datagrid" display='grid' sx={{ height: isStaff ? '70vh' : "76vh", width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        loading={loading}
        slots={{ toolbar: GridToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true } }}
        onRowClick={(params) => {
          onView(params.row, rows);
        }}
      />
    </Box>
  );
};

export default TechnicalAidsGrid;