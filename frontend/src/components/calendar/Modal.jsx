import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import { useSelector } from "react-redux";
import axios from '../../api';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import * as Yup from 'yup';

export default function MyModal({
  mode, // 'create' o 'edit'
  open,
  handleClose,
  formData,
  handleChange,
  getData,
}) {
  const [users, setUsers] = useState([]);
  const loggedInUser = useSelector(state => state.auth.user);

  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [loggedInUser]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/staff/');
      const filteredUsers = response.data.filter(user => user.id !== loggedInUser.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({ severity: 'error', message: 'Error al obtener los usuarios.' });
    }
  };

  const formSchema = Yup.object({
    subject: Yup.string()
    .required('Se requiere un título del evento')
    .typeError('Debe seleccionar un empleo'),
    start_time: Yup
      .date()
      .required('Se requiere de una fecha y hora de inicio'),
   
    end_time: Yup
      .date()
      .nullable()
      .required('Se requiere de una fecha y hora de finalización')
      .test(
        'is-greater-than-start',
        'La fecha de finalización debe ser posterior a la fecha de inicio',
        function (value) {
          const { start_time } = this.parent;
          if (!value || !start_time) {
            return true; // Let required handle the absence
          }
          return dayjs(value).isAfter(dayjs(start_time));
        }
      ),
  });

  const handleSubmission = async (event) => {
    event.preventDefault();

    try {
      await formSchema.validate(formData, { abortEarly: false });
      setAlert({ severity: 'success', message: 'La operación se realizó correctamente.' });
    } catch (err) {
      if (err.inner?.length) {
        setAlert({ severity: 'error', message: err.inner.map(e=>e.message).join('. ') });
      } else {
        setAlert({ severity: 'error', message: err.message });
      }
      return;
    }

    const endpoint = mode === 'create' ? `api/appointments/` : `api/appointments/update/${formData.id}/`;
    const method = mode === 'create' ? 'post' : 'put';

    const attendeeIds = formData.attendees.map(user => user.id);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      await axios[method](endpoint, {
        subject: formData.subject,
        category: formData.category,
        start_time: dayjs(formData.start_time).toISOString(),
        end_time: dayjs(formData.end_time).toISOString(),
        attendees: attendeeIds,
        timezone: timezone,
      });
      setAlert({ severity: 'success', message: 'La operación se realizó correctamente.' });
      getData();
      setTimeout(() => setAlert(null), 3000);
      handleClose();
    } catch (error) {
      console.error('Error submitting appointment:', error);
      if (error.response && error.response.status === 403) {
        setAlert({ severity: 'error', message: 'Solo el organizador puede editar la junta.' });
      } else {
        setAlert({ severity: 'error', message: 'Error al enviar la cita.' });
      }
    }
  };

  const handleDeleteConfirmationOpen = () => {
    setOpenDeleteConfirmation(true);
  };

  const handleDeleteConfirmationClose = () => {
    setOpenDeleteConfirmation(false);
  };

  const handleDelete = async () => {
    if (formData.id) {
      try {
        await axios.delete(`api/appointments/delete/${formData.id}/`);
        setAlert({ severity: 'success', message: 'El evento fue eliminado correctamente.' });
        getData();
        handleClose();
      } catch (error) {
        console.error("Error deleting appointment:", error);
        if (error.response && error.response.status === 403) {
          setAlert({ severity: 'error', message: 'Solo el organizador puede eliminar la junta.' });
        } else {
          setAlert({ severity: 'error', message: 'Error al eliminar el evento.' });
        }
      }
    }
    setOpenDeleteConfirmation(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Crear Nuevo Evento' : (formData?.organizer_details?.id != loggedInUser?.id) ? 'Ver Evento' : 'Editar Evento'}</DialogTitle>
      {alert && (
        <Box sx={{ mx: 2, my: 1 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}
      <DialogContent>
        <form onSubmit={handleSubmission}>
          <TextField
            autoFocus
            margin="dense"
            id="subject"
            label="Título"
            type="text"
            fullWidth
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            variant="outlined"
            disabled={(formData?.organizer_details?.id != loggedInUser?.id)&&(mode != 'create')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="category"
            label="Categoría"
            type="text"
            fullWidth
            name="category"
            value={formData.category}
            onChange={handleChange}
            variant="outlined"
            disabled={(formData?.organizer_details?.id != loggedInUser?.id)&&(mode != 'create')}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <DateTimePicker
              label="Fecha y Hora de Inicio"
              value={formData.start_time}
              onChange={(newValue) => handleChange({ target: { name: 'start_time', value: newValue } })}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
              disabled={(formData?.organizer_details?.id != loggedInUser?.id)&&(mode != 'create')}
              sx={{ mb: 2, mr: 1 }}
            />
            <DateTimePicker
              label="Fecha y Hora de Finalización"
              value={formData.end_time}
              onChange={(newValue) => handleChange({ target: { name: 'end_time', value: newValue } })}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
              disabled={(formData?.organizer_details?.id != loggedInUser?.id)&&(mode != 'create')}
            />
          </Box>
          {/* Mostrar el organizador si existe (modo edición) */}
          {mode === 'edit' && formData.organizer_details && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Organizador: {formData.organizer_details.first_name} {formData.organizer_details.last_name} ({formData.organizer_details.email})
              </Typography>
            </Box>
          )}
          <Autocomplete
            multiple
            freeSolo
            id="attendees-select"
            options={users}
            getOptionLabel={(option) => option.first_name + " " + option.last_name + ` (${option.email})`}
            value={formData.attendees}
            onChange={(event, newValue) => {
              handleChange({ target: { name: 'attendees', value: newValue } });
            }}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Participantes" placeholder="Buscar por nombre o email" fullWidth margin="dense" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={(formData?.organizer_details?.id != loggedInUser?.id)&&(mode != 'create')}
            sx={{ mb: 2 }}
          />
          <DialogActions>
            <Button color='secondary' onClick={handleClose}>Cancelar</Button>
            {mode === 'edit' && (formData?.organizer_details?.id === loggedInUser?.id) &&(
              <Button onClick={handleDeleteConfirmationOpen} color="error" >
                Eliminar
              </Button>
            )}
            {mode === 'create' || (mode === 'edit' && formData?.organizer_details?.id === loggedInUser?.id) ?(
              <Button variant='contained' type="submit" disabled={!formData.subject}>
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            ): null}
          </DialogActions>
        </form>
      </DialogContent>
      <DeleteConfirmDialog
        open={openDeleteConfirmation}
        onClose={handleDeleteConfirmationClose}
        onConfirm={handleDelete}
      />
    </Dialog>
  );
}
