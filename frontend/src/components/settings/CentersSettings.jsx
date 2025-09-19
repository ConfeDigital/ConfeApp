// CentersSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme, 
  styled,
  TextField,
  InputAdornment,
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SearchIcon from '@mui/icons-material/Search';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import api from '../../api';
import CenterFormDialog from './CenterFormDialog';
import { CENTER_TYPES } from './centerTypes';
import { useSelector } from "react-redux";

const mapContainerStyle = { width: '100%', height: '400px' };
const defaultCenter = { lat: 19.4326, lng: -99.1332 }; // Mexico City by default

const SuccessTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  '& > *': { // Apply to all children (TableCell, Typography, etc.)
    color: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
  },
}));

export default function CentersSettings() {
  const isSmall = useMediaQuery('(max-width:800px)');
  const theme = useTheme();
  const currentUser = useSelector((state) => state.auth.user);
  const [alert, setAlert] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true); 
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    language: 'es'
  });

  useEffect(() => { 
    setLoadingCenters(true);
    fetchCenters(); 
  }, []);

  const fetchCenters = async () => {
    try {
      const res = await api.get('api/centros/centers/');
      setCenters(res.data);
      setLoadingCenters(false);
    } catch (err) {
      setAlert({ severity: 'error', message: 'Error recuperando centros' });
      setLoadingCenters(false);
    }
  };

  const handleOpen = center => {
    setEditingCenter(center || null);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setAlert(null);
    setEditingCenter(null);
    setOpenDialog(false);
  };

  const handleSaved = saved => {
    if (editingCenter) {
      setCenters(cs => cs.map(c => c.id === saved.id ? saved : c));
      setAlert({ severity: 'success', message: 'Centro actualizado correctamente' });
    } else {
      setCenters(cs => [...cs, saved]);
      setAlert({ severity: 'success', message: 'Centro creado correctamente' });
    }
    handleClose();
  };

  // Comentado por que no se si quieren esta funcionalidad

  // const handleToggleActive = async center => {
  //   try {
  //     const res = await api.patch(`api/centros/centers/${center.id}/`, { ...center, is_active: !center.is_active });
  //     setCenters(cs => cs.map(c => c.id === res.data.id ? res.data : c));
  //     setAlert({ severity: 'success', message: `Centro ${res.data.is_active ? 'activado' : 'desactivado'} correctamente` });
  //   } catch {
  //     setAlert({ severity: 'error', message: 'Error actualizando estado' });
  //   }
  // };

  const onMapClickMarker = useCallback(center => {
    setSelectedCenter(center);
  }, []);

  // Filter centers based on search term
  const filteredCenters = centers.filter(center => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const centerName = center.name.toLowerCase();
    const centerType = CENTER_TYPES.find(t => t.value === center.center_type)?.label?.toLowerCase() || '';
    const location = center.location_details 
      ? `${center.location_details.address_road} ${center.location_details.address_number} ${center.location_details.address_municip} ${center.location_details.address_city}`.toLowerCase()
      : '';
    
    return centerName.includes(searchLower) || 
           centerType.includes(searchLower) || 
           location.includes(searchLower);
  });

  // Handle center selection from table
  const handleCenterSelect = (center) => {
    setSelectedCenter(center);
  };

  if (loadError) return <Typography>Error loading maps</Typography>;

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4" fontWeight="bold">Centros</Typography>
        <Button size="small" variant="contained" startIcon={<AddLocationIcon />} onClick={() => handleOpen(null)}>
          {!isSmall && 'Agregar Centro'}
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Buscar centros por nombre, tipo o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={6}
          center={
            selectedCenter?.location_details
              ? {
                  lat: parseFloat(selectedCenter.location_details.address_lat),
                  lng: parseFloat(selectedCenter.location_details.address_lng)
                }
              : defaultCenter
          }
        >
          {filteredCenters.map(center => {
            const lat = parseFloat(center.location_details?.address_lat);
            const lng = parseFloat(center.location_details?.address_lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker
                  key={center.id}
                  position={{ lat, lng }}
                  onClick={() => onMapClickMarker(center)}
                  icon={selectedCenter?.id === center.id ? {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#1976d2" stroke="#ffffff" stroke-width="3"/>
                        <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20)
                  } : undefined}
                />
              );
            }
            return null;
          })}

          {selectedCenter && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedCenter.location_details.address_lat),
                lng: parseFloat(selectedCenter.location_details.address_lng)
              }}
              onCloseClick={() => setSelectedCenter(null)}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{selectedCenter.name}</Typography>
                <Typography variant="body2">
                  {CENTER_TYPES.find(t => t.value === selectedCenter.center_type)?.label || selectedCenter.center_type}
                </Typography>
                <Typography variant="body2">
                  {`${selectedCenter.location_details.address_road} ${selectedCenter.location_details.address_number}, ${selectedCenter.location_details.address_municip}, ${selectedCenter.location_details.address_city}`}
                </Typography>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      )}

      {loadingCenters ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
          </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCenters.map(c => {
                const isCurrentUserCenter = c.id == currentUser.center?.id;
                const isSelected = selectedCenter?.id === c.id;
                
                return (
                  <TableRow 
                    key={c.id} 
                    sx={{ 
                      opacity: c.is_active ? 1 : 0.5,
                      backgroundColor: isCurrentUserCenter 
                        ? theme.palette.success.light 
                        : isSelected 
                          ? theme.palette.action.selected 
                          : 'inherit',
                      cursor: 'pointer',
                      '& > *': isCurrentUserCenter ? {
                        color: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
                      } : {},
                      '&:hover': {
                        backgroundColor: isCurrentUserCenter 
                          ? theme.palette.success.light 
                          : theme.palette.action.hover,
                      }
                    }} 
                    onClick={() => handleCenterSelect(c)}
                  >
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{CENTER_TYPES.find(t => t.value === c.center_type)?.label}</TableCell>
                  <TableCell>
                    {c.location_details
                      ? `${c.location_details.address_road} ${c.location_details.address_number}, ${c.location_details.address_municip}, ${c.location_details.address_city}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{c.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton 
                        color="primary" 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row selection when clicking edit
                          handleOpen(c);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Comentado por que no se si quieren esta funcionalidad */}

                    {/* {c.id != currentUser.center?.id && (
                      <Tooltip title={c.is_active ? 'Desactivar Centro' : 'Activar Centro'}>
                        <IconButton size="small" onClick={() => handleToggleActive(c)} color={c.is_active ? 'success' : 'error'}>
                          {c.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                        </IconButton>
                      </Tooltip>
                    )} */}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {alert && (
        <Box mt={2}>
          <Alert severity={alert.severity} onClose={() => setAlert(null)}>{alert.message}</Alert>
        </Box>
      )}

      <CenterFormDialog
        open={openDialog}
        onClose={handleClose}
        onSaved={handleSaved}
        data={editingCenter}
      />
    </>
  );
}
