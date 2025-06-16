import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import api from '../../api';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog'
import { useSelector } from "react-redux";

// Yup schema: end_date must be after start_date
const cycleSchema = Yup.object().shape({
  name: Yup.string()
    .required('El nombre del ciclo es requerido'),
  start_date: Yup.date()
    .nullable()
    .required('La fecha de inicio es requerida'),
  end_date: Yup.date()
    .nullable()
    .required('La fecha de término es requerida')
    .when('start_date', (start, schema) =>
      start
        ? schema.min(start, 'La fecha de término debe ser posterior a la fecha de inicio')
        : schema
    ),
});

export default function CyclesSettings( ) {
  const isSmall = useMediaQuery('(max-width:800px)');
  const [alert, setAlert] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({ name: '', start_date: null, end_date: null });
  const currentUser = useSelector((state) => state.auth.user);

  // For delete confirmation
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  useEffect(() => {
    api.get('api/candidatos/ciclos/')
      .then(res => setCycles(res.data))
      .catch(() => setAlert({ severity: 'error', message: 'Error recuperando ciclos' }));
  }, [setAlert]);

  const resetForm = () => {
    setFormData({ name: '', start_date: null, end_date: null });
    setEditingCycle(null);
    setOpenDialog(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      start_date: dayjs(cycle.start_date),
      end_date: dayjs(cycle.end_date),
    });
    setOpenDialog(true);
  };

  const handleFormChange = (field) => (e) => {
    const value = e?.target?.value ?? e;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveCycle = () => {
    cycleSchema.validate(formData, { abortEarly: false })
      .then(() => {
        const payload = {
          name: formData.name,
          start_date: formData.start_date.format('YYYY-MM-DD'),
          end_date: formData.end_date.format('YYYY-MM-DD'),
        };
        if (editingCycle) {
          return api.put(`api/candidatos/ciclos/${editingCycle.id}/`, payload);
        } else {
          return api.post('api/candidatos/ciclos/', payload);
        }
      })
      .then(res => {
        if (editingCycle) {
          setCycles(list => list.map(c => c.id === res.data.id ? res.data : c));
          setAlert({ severity: 'success', message: 'Ciclo actualizado correctamente' });
        } else {
          setCycles(list => [...list, res.data]);
          setAlert({ severity: 'success', message: 'Ciclo creado correctamente' });
        }
        resetForm();
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          const msg = err.inner.map(e => e.message).join('. ');
          setAlert({ severity: 'error', message: msg });
        } else {
          setAlert({ severity: 'error', message: 'Error al guardar ciclo' });
        }
      });
  };

  // Open the delete confirmation dialog and set the selected entry
  const handleOpenDeleteDialog = (entry) => {
    setEntryToDelete(entry);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    api.delete(`api/candidatos/ciclos/${entryToDelete.id}/`)
      .then(() => {
        setCycles(list => list.filter(c => c.id !== entryToDelete.id));
        setAlert({ severity: 'success', message: 'Ciclo eliminado correctamente' });
      })
      .catch(() => setAlert({ severity: 'error', message: 'Error eliminando ciclo' }));

    setOpenDeleteDialog(false);
    setEntryToDelete(null);
  };

  if(!currentUser.center) return <Typography>Sin Centro</Typography>

  return (
    <>
      <Box display="flex" justifyContent="space-between" gap={1} mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Lista de Ciclos (Generaciones)
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenCreate}
        >
          {!isSmall && 'Agregar Ciclo'}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Término</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cycles.map(cycle => (
              <TableRow key={cycle.id}>
                <TableCell>{cycle.name}</TableCell>
                <TableCell>{cycle.start_date}</TableCell>
                <TableCell>{cycle.end_date}</TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton color="primary" size="small" onClick={() => handleOpenEdit(cycle)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(cycle)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingCycle ? 'Editar Ciclo' : 'Nuevo Ciclo'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {alert && (
              <Alert 
                severity={alert.severity} 
                onClose={() => setAlert(null)}
                sx={{ mb: 2 }}
              >
                {alert.message}
              </Alert>
            )}
            <TextField
              label="Nombre"
              size="small"
              value={formData.name}
              onChange={handleFormChange('name')}
              fullWidth
            />
            <DatePicker
              label="Fecha Inicio"
              value={formData.start_date}
              onChange={handleFormChange('start_date')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Fecha Término"
              value={formData.end_date}
              onChange={handleFormChange('end_date')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={resetForm}>Cancelar</Button>
          <Button onClick={saveCycle} variant="contained">
            {editingCycle ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
