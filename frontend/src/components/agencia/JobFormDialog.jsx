import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControlLabel, Checkbox,
  FormControl, InputLabel, Box
} from '@mui/material';
import api from '../../api';

const JobFormDialog = ({ open, data, isEdit, onClose, onSubmit, companies, locations }) => {
  const [jobFormData, setJobFormData] = useState({
    name: '',
    company: '',
    location: '',
    job_description: '',
    vacancies: '0'
  });
  const [newLocation, setNewLocation] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    address_PC: '',
    address_municip: '',
    address_state: '',
    address_city: '',
    address_col: '',
    address_road: '',
    address_number: '',
    address_number_int: '',
  });
  const [postalData, setPostalData] = useState(null);

  useEffect(() => {
    if (data) {
      setJobFormData({
        name: data.name,
        company: data.company || '',
        location: data.location_details ? data.location_details.id : '',
        job_description: data.job_description,
        vacancies: data.vacancies.toString()
      });
      setNewLocation(false);
    } else {
      setJobFormData({
        name: '',
        company: '',
        location: '',
        job_description: '',
        vacancies: '0'
      });
      setNewLocation(false);
      setLocationFormData({
        address_PC: '',
        address_municip: '',
        address_state: '',
        address_city: '',
        address_col: '',
        address_road: '',
        address_number: '',
        address_number_int: '',
      });
    }
  }, [data, open]);

  useEffect(() => {
    if (newLocation && locationFormData.address_PC && locationFormData.address_PC.length === 5) {
      api.get(`/api/postal-code/${locationFormData.address_PC}/`)
        .then((res) => {
          setPostalData(res.data);
          setLocationFormData(prev => ({
            ...prev,
            address_municip: res.data.municipio,
            address_state: res.data.estado,
            address_city: res.data.ciudad,
            address_col: '',
          }));
        })
        .catch((err) => {
          console.error(err);
          setPostalData(null);
        });
    } else {
      setPostalData(null);
      setLocationFormData(prev => ({
        ...prev,
        address_municip: '',
        address_state: '',
        address_city: '',
        address_col: ''
      }));
    }
  }, [newLocation, locationFormData.address_PC]);

  const handleJobFormChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "vacancies") {
        if (value < 0) {
            value = 0;
        }
    }
    setJobFormData({ ...jobFormData, [e.target.name]: value }); // Use the modified 'value'
  };

  const handleLocationFormChange = (e) => {
    setLocationFormData({ ...locationFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      let locationId = jobFormData.location;
      if (newLocation) {
        // Crear nueva ubicación y obtener su id
        const locationRes = await api.post('api/agencia/locations/', locationFormData);
        locationId = locationRes.data.id;
      } else if (!locationId && isEdit && data && data.location_details) {
        // Si no se modificó la ubicación, usar la que ya tenía
        locationId = data.location_details.id;
      }
      const payload = { ...jobFormData, location_id: locationId };
      if (isEdit && data && data.id) {
        await api.put(`api/agencia/jobs/${data.id}/`, payload);
      } else {
        await api.post('api/agencia/jobs/', payload);
      }
      onSubmit();
    } catch (error) {
      console.error("Error al enviar el formulario de empleo:", error);
    }
  };  

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{isEdit ? 'Editar Empleo' : 'Crear Empleo'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Nombre"
          name="name"
          value={jobFormData.name}
          onChange={handleJobFormChange}
          fullWidth
          sx={{ mt: 2 }}
        />
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="company-label">Empresa</InputLabel>
          <Select
            labelId="company-label"
            name="company"
            value={jobFormData.company}
            onChange={handleJobFormChange}
            label="Empresa"
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Checkbox checked={newLocation} onChange={(e) => setNewLocation(e.target.checked)} />}
          label="Crear nueva ubicación"
          sx={{ mt: 2 }}
        />
        {newLocation ? (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Código Postal"
              name="address_PC"
              value={locationFormData.address_PC}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              label="Estado"
              name="address_state"
              value={locationFormData.address_state}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
              disabled
            />
            <TextField
              label="Ciudad"
              name="address_city"
              value={locationFormData.address_city}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
              disabled
            />
            <TextField
              label="Municipio"
              name="address_municip"
              value={locationFormData.address_municip}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
              disabled
            />
            {postalData && postalData.colonias ? (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="colonia-label">Colonia</InputLabel>
                <Select
                  labelId="colonia-label"
                  name="address_col"
                  value={locationFormData.address_col}
                  onChange={handleLocationFormChange}
                  label="Colonia"
                >
                  {postalData.colonias.map((col, index) => (
                    <MenuItem key={index} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Colonia"
                name="address_col"
                value={locationFormData.address_col}
                onChange={handleLocationFormChange}
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
            <TextField
              label="Calle"
              name="address_road"
              value={locationFormData.address_road}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              label="Número"
              name="address_number"
              value={locationFormData.address_number}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              label="Número Interior"
              name="address_number_int"
              value={locationFormData.address_number_int}
              onChange={handleLocationFormChange}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="location-label">Ubicación</InputLabel>
            <Select
              labelId="location-label"
              name="location"
              value={jobFormData.location}
              onChange={handleJobFormChange}
              label="Ubicación"
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.address_city} - {location.address_municip} - {location.address_road} {location.address_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          label="Descripción"
          name="job_description"
          value={jobFormData.job_description}
          onChange={handleJobFormChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <TextField
          label="Vacantes"
          name="vacancies"
          value={jobFormData.vacancies}
          onChange={handleJobFormChange}
          fullWidth
          type="number"
          slotProps={{
              input: {
                  inputProps: {
                      min: 0,
                  },
              },
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobFormDialog;
