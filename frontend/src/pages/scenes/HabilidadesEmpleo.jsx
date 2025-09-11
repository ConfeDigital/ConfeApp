// ==========================================
// HabilidadesEmpleo Component
// Gestión completa de habilidades para empleos
// ==========================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
  Alert,
  Chip,
  Grid2 as Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Fab,
  Snackbar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Psychology as SkillIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import axios from "../../api";
import useDocumentTitle from '../../hooks/useDocumentTitle';
import * as Yup from 'yup';
import dayjs from "dayjs";

// Validation schema
const habilidadSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: Yup.string()
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  categoria: Yup.string()
    .required('La categoría es requerida')
    .oneOf(['tecnica', 'blanda', 'fisica', 'cognitiva', 'social'], 'Categoría inválida'),
});

// Category mappings
const categoriaLabels = {
  tecnica: 'Técnica',
  blanda: 'Blanda',
  fisica: 'Física',
  cognitiva: 'Cognitiva',
  social: 'Social',
};

const categoriaColors = {
  tecnica: '#1976d2',
  blanda: '#388e3c',
  fisica: '#f57c00',
  cognitiva: '#7b1fa2',
  social: '#d32f2f',
};

const HabilidadesEmpleo = () => {
  useDocumentTitle('Gestión de Habilidades');
  
  const theme = useTheme();

  // Estados principales
  const [habilidades, setHabilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados para modal
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHabilidad, setEditingHabilidad] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'blanda',
    es_activa: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Estados para confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    habilidad: null,
  });

  // API endpoints
  const habilidadesURL = '/api/agencia/habilidades/';

  // Fetch habilidades
  const fetchHabilidades = async () => {
    setLoading(true);
    try {
      const response = await axios.get(habilidadesURL);
      setHabilidades(response.data);
    } catch (error) {
      console.error("Error fetching habilidades:", error);
      showSnackbar('Error al cargar las habilidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabilidades();
  }, []);

  // Filter habilidades
  const filteredHabilidades = habilidades.filter(habilidad => {
    const matchesSearch = habilidad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (habilidad.descripcion && habilidad.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategoria = !selectedCategoria || habilidad.categoria === selectedCategoria;
    const matchesActive = showInactive || habilidad.es_activa;
    
    return matchesSearch && matchesCategoria && matchesActive;
  });

  // Pagination
  const paginatedHabilidades = filteredHabilidades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = async () => {
    try {
      await habilidadSchema.validate(formData, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (err) {
      const errors = {};
      err.inner.forEach(error => {
        errors[error.path] = error.message;
      });
      setFormErrors(errors);
      return false;
    }
  };

  // Open dialog for new habilidad
  const handleAdd = () => {
    setEditingHabilidad(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: 'blanda',
      es_activa: true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Open dialog for editing habilidad
  const handleEdit = (habilidad) => {
    setEditingHabilidad(habilidad);
    setFormData({
      nombre: habilidad.nombre,
      descripcion: habilidad.descripcion || '',
      categoria: habilidad.categoria,
      es_activa: habilidad.es_activa,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Save habilidad
  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setSaving(true);
    try {
      if (editingHabilidad) {
        // Update existing habilidad
        await axios.put(`${habilidadesURL}${editingHabilidad.id}/`, formData);
        showSnackbar('Habilidad actualizada correctamente', 'success');
      } else {
        // Create new habilidad
        await axios.post(habilidadesURL, formData);
        showSnackbar('Habilidad creada correctamente', 'success');
      }
      
      setOpenDialog(false);
      fetchHabilidades();
    } catch (error) {
      console.error("Error saving habilidad:", error);
      if (error.response?.data) {
        const serverErrors = {};
        Object.keys(error.response.data).forEach(key => {
          serverErrors[key] = Array.isArray(error.response.data[key]) 
            ? error.response.data[key][0] 
            : error.response.data[key];
        });
        setFormErrors(serverErrors);
      }
      showSnackbar('Error al guardar la habilidad', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (habilidad) => {
    setDeleteDialog({
      open: true,
      habilidad: habilidad,
    });
  };

  // Delete habilidad
  const handleDeleteConfirm = async () => {
    const { habilidad } = deleteDialog;
    if (!habilidad) return;

    try {
      await axios.delete(`${habilidadesURL}${habilidad.id}/`);
      showSnackbar('Habilidad eliminada correctamente', 'success');
      fetchHabilidades();
    } catch (error) {
      console.error("Error deleting habilidad:", error);
      if (error.response?.status === 400) {
        showSnackbar('No se puede eliminar la habilidad porque está siendo utilizada', 'error');
      } else {
        showSnackbar('Error al eliminar la habilidad', 'error');
      }
    } finally {
      setDeleteDialog({ open: false, habilidad: null });
    }
  };

  // Toggle active status
  const handleToggleActive = async (habilidad) => {
    try {
      await axios.patch(`${habilidadesURL}${habilidad.id}/`, {
        es_activa: !habilidad.es_activa
      });
      showSnackbar(
        `Habilidad ${!habilidad.es_activa ? 'activada' : 'desactivada'} correctamente`, 
        'success'
      );
      fetchHabilidades();
    } catch (error) {
      console.error("Error toggling habilidad status:", error);
      showSnackbar('Error al cambiar el estado de la habilidad', 'error');
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <SkillIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                Gestión de Habilidades
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Administra las habilidades disponibles en el sistema para empleos y candidatos
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            size="large"
          >
            Nueva Habilidad
          </Button>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar habilidades"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid xs={12} md={3}>
            <FormControl fullWidth sx={{ minWidth: '200px' }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={selectedCategoria}
                label="Categoría"
                onChange={(e) => setSelectedCategoria(e.target.value)}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Mostrar inactivas"
            />
          </Grid>
          <Grid xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              Total: {filteredHabilidades.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(categoriaLabels).map(([key, label]) => {
          const count = habilidades.filter(h => h.categoria === key && h.es_activa).length;
          return (
            <Grid xs={12} sm={6} md={2.4} key={key}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={categoriaColors[key]} fontWeight="bold">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedHabilidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      No se encontraron habilidades
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedHabilidades.map((habilidad) => (
                  <TableRow key={habilidad.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {habilidad.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={categoriaLabels[habilidad.categoria]}
                        size="small"
                        sx={{
                          backgroundColor: categoriaColors[habilidad.categoria] + '20',
                          color: categoriaColors[habilidad.categoria],
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {habilidad.descripcion || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={habilidad.es_activa ? 'Activa' : 'Inactiva'}
                        color={habilidad.es_activa ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(habilidad.fecha_creacion).format("DD/MM/YYYY")}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(habilidad)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={habilidad.es_activa ? 'Desactivar' : 'Activar'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(habilidad)}
                            color={habilidad.es_activa ? 'warning' : 'success'}
                          >
                            {habilidad.es_activa ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(habilidad)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredHabilidades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editingHabilidad ? 'Editar Habilidad' : 'Nueva Habilidad'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              margin="normal"
              required
            />
            
            <FormControl 
              fullWidth 
              margin="normal" 
              error={!!formErrors.categoria}
              required
            >
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.categoria}
                label="Categoría"
                onChange={(e) => handleFormChange('categoria', e.target.value)}
              >
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
              {formErrors.categoria && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {formErrors.categoria}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              error={!!formErrors.descripcion}
              helperText={formErrors.descripcion}
              margin="normal"
              multiline
              rows={3}
              placeholder="Descripción opcional de la habilidad..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.es_activa}
                  onChange={(e) => handleFormChange('es_activa', e.target.checked)}
                />
              }
              label="Habilidad activa"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? null : <SaveIcon />}
          >
            {saving ? 'Guardando...' : (editingHabilidad ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, habilidad: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la habilidad "{deleteDialog.habilidad?.nombre}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer. Si la habilidad está siendo utilizada por empleos o candidatos, no podrá ser eliminada.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, habilidad: null })}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteConfirm}
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAdd}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default HabilidadesEmpleo;