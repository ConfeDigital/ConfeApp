// components/agencia/JobsDataGrid.jsx
import React, { useState } from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter, GridToolbar } from '@mui/x-data-grid';
import { Tooltip, Typography, Box, ToggleButton, ToggleButtonGroup, CircularProgress, Button, Chip } from '@mui/material';
import { Map as MapIcon, GridOn as GridIcon } from '@mui/icons-material';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';

const mapContainerStyle = { width: '100%', height: '64vh' };
const defaultCenter = { lat: 19.43, lng: -99.13 };  // fallback center

export default function JobsDataGrid({ rows, companyNameVisibility, isLoading }) {
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    language: 'es'
  });

  const handleToggle = (_, next) => {
    if (next) {
      setSelected(null);
      setView(next);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 160 },
    { field: 'company_name', headerName: 'Empresa', flex: 0.6, minWidth: 120 },
    {
      field: 'location_details',
      headerName: 'Ubicación',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const loc = params.value;
        if (!loc) return 'N/A';
        return (
          <Tooltip
            title={
              <>
                <Typography variant="body2"><strong>CP:</strong> {loc.address_PC || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Calle:</strong> {loc.address_road || 'N/A'}</Typography>
                {/* …other fields… */}
              </>
            }
          >
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              {loc.address_municip || 'Ver detalles'}
            </span>
          </Tooltip>
        );
      }
    },
    { field: 'job_description', headerName: 'Descripción', flex: 1.5, minWidth: 250 },
    { field: 'vacancies', headerName: 'Vacantes', type: 'number', width: 100 },
    { 
      field: 'horario', 
      headerName: 'Horario', 
      flex: 0.8, 
      minWidth: 120,
      renderCell: (params) => {
        return params.value || 'No especificado';
      }
    },
    { 
      field: 'sueldo_base', 
      headerName: 'Sueldo Base', 
      flex: 0.6, 
      minWidth: 100,
      renderCell: (params) => {
        return params.value ? `$${params.value.toLocaleString()}` : 'No especificado';
      }
    },
    {
      field: 'habilidades_requeridas',
      headerName: 'Habilidades',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const habilidades = params.value || [];
        if (habilidades.length === 0) return 'Sin habilidades';
        
        return (
          <Tooltip
            title={
              <Box>
                {habilidades.map((h, index) => (
                  <Typography key={index} variant="body2">
                    • {h.habilidad_nombre} ({h.nivel_importancia})
                  </Typography>
                ))}
              </Box>
            }
          >
            <Chip 
              label={`${habilidades.length} habilidad${habilidades.length !== 1 ? 'es' : ''}`}
              size="small"
              variant="outlined"
            />
          </Tooltip>
        );
      }
    },
  ];

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbar/>
        <GridToolbarQuickFilter sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleToggle}
          size="small"
          sx={{ ml: 2 }}
        >
          <ToggleButton value="grid"><GridIcon /></ToggleButton>
          <ToggleButton value="map"><MapIcon /></ToggleButton>
        </ToggleButtonGroup>
      </GridToolbarContainer>
    );
  }

  // prepare markers
  const markers = rows
    .map(r => {
      const loc = r.location_details;
      const lat = parseFloat(loc?.address_lat);
      const lng = parseFloat(loc?.address_lng);
      return (!isNaN(lat) && !isNaN(lng))
        ? { id: r.id, name: r.name, position: { lat, lng } }
        : null;
    })
    .filter(Boolean);

  const handleRowClick = (params) => {
    if(location.pathname === '/empleador'){
      navigate(`/empleador/empleo/${params.row.id}`);
    } else {
      navigate(`/agencia-laboral/empleo/${params.row.id}`);
    }
    
  };

  if (view === 'map') {
    if (loadError) return <Box>Map failed to load</Box>;
    if (!isLoaded) return <CircularProgress />;
    return (
      <Box mt={2}>
        <Box mb={1} display="flex" justifyContent="flex-end">
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleToggle}
            size="small"
          >
            <ToggleButton value="grid"><GridIcon /></ToggleButton>
            <ToggleButton value="map"><MapIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markers[0]?.position || defaultCenter}
          zoom={12}
        >
          {markers.map(m => (
            <Marker
              key={m.id}
              position={m.position}
              onClick={() => setSelected(m)}
            />
          ))}
          {selected && (
            <InfoWindow
              position={selected.position}
              onCloseClick={() => setSelected(null)}
            >
              <Box>
                <Typography><strong>{selected.name}</strong></Typography>
                <Button
                  size="small"
                  onClick={() => {
                    if(location.pathname === '/empleador'){
                      navigate(`/empleador/empleo/${selected.id}`);
                    } else {
                      navigate(`/agencia-laboral/empleo/${selected.id}`);
                    }
                  }}
                >
                  Ver Empleo
                </Button> 
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </Box>
    );
  }

  // grid view
  return (
    <Box mt={2} display="grid" height="68vh" className="custom-datagrid">
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={7}
        rowsPerPageOptions={[7]}
        slots={{ toolbar: CustomToolbar }}
        onRowClick={handleRowClick}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              company_name: companyNameVisibility,
            },
          },
        }}
        loading={isLoading}
      />
    </Box>
  );
}