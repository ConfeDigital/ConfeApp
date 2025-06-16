import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import api from '../../api';
import AddressAutoCompleteForm from '../AddressAutoCompleteForm';

const JobFormDialog = ({ open, onClose, onSubmit, data, isEdit = false, companies, setJobs, setAlert }) => {
    const [locations, setLocations] = useState([]);
    const [newLocation, setNewLocation] = useState(false);
    const [jobFormData, setJobFormData] = useState({
        name: '',
        company: '', // This should be the company ID
        location: '', // This should be the location ID
        job_description: '',
        vacancies: '0',
    });
    // Estado para forzar el remount del componente de autocompletado
    const [autocompleteKey, setAutocompleteKey] = useState(0);

    const methods = useForm({
        defaultValues: {
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
                address_lng: '',
            }
        }
    });

    useEffect(() => {
        if (open) {
            fetchLocations();
            if (isEdit && data) {
                setJobFormData({
                    name: data.name || '',
                    // Set company to its ID if it's an object, otherwise use the existing value
                    company: data.company?.id || data.company || '',
                    // Set location to its ID (from location_details) if it's an object, otherwise use existing value
                    location: data.location_details?.id || data.location || '',
                    job_description: data.job_description || '',
                    vacancies: data.vacancies !== null ? String(data.vacancies) : '0', // Ensure vacancies is a string
                });
                // If editing and there's existing location data, ensure newLocation checkbox is unchecked
                setNewLocation(false);
                methods.reset(); // Also reset location form values, so they don't interfere
            } else {
                setJobFormData({
                    name: '',
                    company: '',
                    location: '',
                    job_description: '',
                    vacancies: '0',
                });
                methods.reset(); // Reinicia los datos del formulario de ubicación
                setNewLocation(false);
            }
        }
    }, [open, isEdit, data]); // Added 'data' to dependency array to react to changes when editing

    const fetchLocations = async () => {
        try {
            const res = await api.get('api/agencia/locations/');
            setLocations(res.data);
        } catch (err) {
            console.error("Error al obtener ubicaciones", err);
        }
    };

    const handleJobFormChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "vacancies") {
            if (value < 0) {
                value = 0;
            }
        }
        setJobFormData({ ...jobFormData, [e.target.name]: value }); // Use the modified 'value'
    };

    const handleSubmit = async () => {
        try {
            let locationId = jobFormData.location;
            if (newLocation) {
                const newLocationData = methods.getValues('locationForm');
                const locationRes = await api.post('api/agencia/locations/', newLocationData);
                locationId = locationRes.data.id;
            } else if (!locationId && isEdit && data && data.location_details) {
                // If not creating new location and no location selected, but editing and data has details, use existing ID
                locationId = data.location_details.id;
            }

            const payload = {
                ...jobFormData,
                location_id: locationId, // Use the determined locationId
                // Ensure company is an ID, it should be already if handled correctly above
            };

            if (isEdit && data && data.id) {
                const res = await api.put(`api/agencia/jobs/${data.id}/`, payload);
                // When editing, we're on JobCandidatesPage, not JobsCompaniesPage, so setJobs is not available or relevant here
                // The parent component (JobCandidatesPage) will refetch its data
            } else {
                const res = await api.post('api/agencia/jobs/', payload);
                setJobs((jo) => [...jo, res.data]); // This is only relevant for creation in JobsCompaniesPage
            }
            setAlert({
                severity: "success",
                message: "Empleo guardado correctamente",
            });
            onSubmit(); // callback para cerrar el diálogo y refrescar datos
        } catch (error) {
            console.error("Error al enviar el formulario de empleo:", error);
            // Check if error.response exists and has data. If it's a validation error, extract it.
            const errorMessage = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || 'Error al guardar el empleo. Verifique los datos.';
            setAlert({ severity: "error", message: errorMessage });
        }
    };

    return (
        <FormProvider {...methods}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                TransitionProps={{ onEntered: () => setAutocompleteKey(prev => prev + 1) }}
                sx={{zIndex: 1000}}
            >
                <DialogTitle>{isEdit ? 'Editar Empleo' : 'Crear Empleo'}</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Nombre del empleo"
                        name="name"
                        value={jobFormData.name}
                        onChange={handleJobFormChange}
                    />
                    {(!!companies && !isEdit) && (
                        <FormControl fullWidth margin="normal">
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
                    )}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newLocation}
                                onChange={(e) => setNewLocation(e.target.checked)}
                            />
                        }
                        label="Crear nueva ubicación"
                        sx={{ mt: 2 }}
                    />

                    {newLocation ? (
                        // Se forzará el remount cada vez que el diálogo termine de abrirse
                        <AddressAutoCompleteForm key={autocompleteKey} prefix="locationForm" />
                    ) : (
                        <FormControl fullWidth margin="normal">
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
                        margin="normal"
                        fullWidth
                        multiline
                        rows={3}
                        label="Descripción"
                        name="job_description"
                        value={jobFormData.job_description}
                        onChange={handleJobFormChange}
                    />

                    <TextField
                        margin="normal"
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
                    <Button color="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default JobFormDialog;
