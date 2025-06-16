// CenterFormDialog.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, Checkbox
} from '@mui/material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import api from '../../api';
import AddressAutoCompleteForm from '../AddressAutoCompleteForm';
import { CENTER_TYPES } from './centerTypes';

export default function CenterFormDialog({ open, onClose, onSaved, data }) {
  const methods = useForm({
    defaultValues: {
      name: data?.name || '',
      center_type: data?.center_type || '',
      location_id: data?.location_id ?? '',
      newLocation: false,
      locationForm: {
        address_search: '',
        address_road: '',
        address_number: '',
        address_number_int: '',
        address_PC: '',
        address_col: '',
        address_municip: '',
        address_city: '',
        address_state: '',
        address_lat: '',
        address_lng: ''
      }
    }
  });

  const { control, handleSubmit, reset, watch } = methods;
  const newLocation = watch('newLocation');
  const [locations, setLocations] = useState([]);
  const [autocompleteKey, setAutocompleteKey] = useState(0);

  useEffect(() => {
    if (open) {
      api.get('api/centros/locations/')
        .then(res => setLocations(res.data))
        .catch(() => setLocations([]));
      // reset both center fields and the nested locationForm
      reset({
        name: data?.name || '',
        center_type: data?.center_type || '',
        location_id: data?.location_id ?? '',
        newLocation: false,
        locationForm: {
          address_search: '',
          address_road: '',
          address_number: '',
          address_number_int: '',
          address_PC: '',
          address_col: '',
          address_municip: '',
          address_city: '',
          address_state: '',
          address_lat: '',
          address_lng: ''
        }
      });
      setAutocompleteKey(k => k + 1);
    }
  }, [open, data, reset]);

  const onSubmit = async values => {
    try {
      let locId = values.location_id;
      if (values.newLocation) {
        const resLoc = await api.post('api/centros/locations/', values.locationForm);
        locId = resLoc.data.id;
      }
      const payload = {
        name: values.name,
        center_type: values.center_type,
        location_id: locId
      };
      const res = data
        ? await api.patch(`api/centros/centers/${data.id}/`, payload)
        : await api.post('api/centros/centers/', payload);
      onSaved(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormProvider {...methods}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        TransitionProps={{ onEntered: () => setAutocompleteKey(k => k + 1) }}
        sx={{ zIndex: 500 }}
      >
        <DialogTitle>{data ? 'Editar Centro' : 'Nuevo Centro'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Nombre" size="small" fullWidth />
              )}
            />
            <Controller
              name="center_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select {...field} label="Tipo">
                    {CENTER_TYPES.map(ct => (
                      <MenuItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="newLocation"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Crear nueva ubicación"
                />
              )}
            />
            {newLocation ? (
              <AddressAutoCompleteForm key={autocompleteKey} prefix="locationForm" />
            ) : (
              <Controller
                name="location_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Ubicación</InputLabel>
                    <Select {...field} label="Ubicación">
                      {locations.map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {`${loc.address_road} ${loc.address_number}, ${loc.address_municip}, ${loc.address_city}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)}>
            {data ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}
