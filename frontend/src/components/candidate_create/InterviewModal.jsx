import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Autocomplete,
  Alert,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSelector } from "react-redux";
import axios from '../../api';
import dayjs from 'dayjs';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import * as Yup from 'yup';

export default function InterviewDialog({ uid, open, handleClose, getData, candidateProfile }) {
  const initialCategory = "Entrevista";
  const initialTitle = `Entrevista - ${candidateProfile.user.first_name} ${candidateProfile.user.last_name} ${candidateProfile.user.second_last_name}`;
  const [formData, setFormData] = useState({
    subject: initialTitle,
    start_time: dayjs(),
    end_time: dayjs().add(1, "hour"),
    attendees: [],
    category: initialCategory,
    organizer_details: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [users, setUsers] = useState([]);
  const loggedInUser = useSelector(state => state.auth.user);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
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
    fetchUsers();
  }, [loggedInUser]);

  useEffect(() => {
    if (open) {
      axios.get(`api/candidatos/appointments/${uid}/`, { params: { category: initialCategory } })
        .then((res) => {
          if (res.data) {
            setFormData({
              subject: res.data.subject,
              start_time: dayjs(res.data.start_time),
              end_time: dayjs(res.data.end_time),
              attendees: res.data.attendees_details,
              category: res.data.category,
              organizer_details: res.data.organizer_details, // Asumir que viene en la respuesta
            });
            setIsEditing(true);
            setAppointmentId(res.data.id);
          } else {
            setFormData({
              subject: initialTitle,
              start_time: dayjs(),
              end_time: dayjs().add(1, "hour"),
              attendees: [candidateProfile.user],
              category: initialCategory,
              organizer_details: null,
            });
            setIsEditing(false);
            setAppointmentId(null);
          }
        })
        .catch((error) => {
          console.error("Error buscando appointment:", error);
          setAlert({ severity: 'error', message: 'Error al buscar la entrevista.' });
        });
    }
  }, [open, uid, initialCategory, candidateProfile.user, initialTitle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateTimeChange = (name, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
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
      .test(('same-day'), 'Las fechas de inicio y fin deben ser el mismo día', function (value) {
        const { start_time } = this.parent;
        if (!value || !start_time) {
          return true; // Let required handle the absence
        }
        return dayjs(value).isSame(dayjs(start_time), 'day');
      })
      .test(
        'is-greater-than-start',
        'La hora de finalización debe ser posterior a la hora de inicio',
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

    const formAttendeesIds = formData.attendees.map(user => user.id);
    const combinedAttendees = formAttendeesIds.includes(uid)
      ? formAttendeesIds
      : [uid, ...formAttendeesIds];

    const payload = {
      subject: formData.subject,
      start_time: formData.start_time.toISOString(),
      end_time: formData.end_time.toISOString(),
      attendees: combinedAttendees,
      category: formData.category,
    };

    try {
      if (isEditing && appointmentId) {
        await axios.put(`api/appointments/update/${appointmentId}/`, payload);
      } else {
        await axios.post("api/appointments/", payload);
      }
      setAlert({ severity: 'success', message: 'La entrevista se agendó correctamente.' });
      getData();
      setTimeout(() => setAlert(null), 3000);
      handleClose();
    } catch (error) {
      console.error("Error al agendar/editar la entrevista:", error);
      if (error.response && error.response.status === 403) {
        setAlert({ severity: 'error', message: 'Solo el organizador puede editar la junta.' });
      } else {
        setAlert({ severity: 'error', message: 'Error al agendar/editar la entrevista.' });
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
    if (appointmentId) {
      try {
        await axios.delete(`api/appointments/delete/${appointmentId}/`);
        setAlert({ severity: 'success', message: 'La entrevista fue eliminada correctamente.' });
        getData();
        handleClose();
      } catch (error) {
        console.error("Error deleting appointment:", error);
        if (error.response && error.response.status === 403) {
          setAlert({ severity: 'error', message: 'Solo el organizador puede eliminar la junta.' });
        } else {
          setAlert({ severity: 'error', message: 'Error al eliminar la entrevista.' });
        }
      }
    }
    setOpenDeleteConfirmation(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Agendar Entrevista</DialogTitle>
      {alert && (
        <Box sx={{ mx: 2, my: 1 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}
      <form onSubmit={handleSubmission}>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <TextField
              label="Título"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              fullWidth
              disabled
            />
          </Box>
          <Box sx={{ my: 2 }}>
            <TextField
              label="Categoría"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
              disabled
            />
          </Box>
          {/* Mostrar el organizador (si existe) */}
          {isEditing && formData.organizer_details && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Organizador: {formData.organizer_details.first_name} {formData.organizer_details.last_name} ({formData.organizer_details.email})
              </Typography>
            </Box>
          )}
          <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between' }}>
            <DateTimePicker
              label="Fecha y Hora de Inicio"
              name="start_time"
              value={formData.start_time}
              onChange={(newValue) => handleDateTimeChange("start_time", newValue)}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
            />
            <DateTimePicker
              label="Fecha y Hora de Finalización"
              name="end_time"
              value={formData.end_time}
              onChange={(newValue) => handleDateTimeChange("end_time", newValue)}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
            />
          </Box>
          <Box sx={{ my: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              id="attendees-select"
              options={users || []}
              getOptionLabel={(option) => {
                if (!option) return "";
                if (typeof option === "string") return option;
                return `${option.first_name || ""} ${option.last_name || ""}`.trim();
              }}
              value={formData.attendees || []}
              onChange={(event, newValue) => {
                const processedValue = newValue.map((item) =>
                  typeof item === "string"
                    ? { first_name: item, last_name: "" }
                    : item
                );
                setFormData((prev) => ({
                  ...prev,
                  attendees: processedValue,
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar Participante" placeholder="Buscar por email" fullWidth />
              )}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                if (typeof option === "string" || typeof value === "string") {
                  return option === value;
                }
                return option.id === value.id;
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2 }}>
          <Button onClick={handleClose} color="secondary">Cancelar</Button>
          {isEditing && (
            <Button onClick={handleDeleteConfirmationOpen} color="error">
              Eliminar
            </Button>
          )}
          <Button type="submit" variant="contained">
            {isEditing ? "Editar" : "Agendar"}
          </Button>
        </DialogActions>
      </form>
      <DeleteConfirmDialog
        open={openDeleteConfirmation}
        onClose={handleDeleteConfirmationClose}
        onConfirm={handleDelete}
      />
    </Dialog>
  );
}
