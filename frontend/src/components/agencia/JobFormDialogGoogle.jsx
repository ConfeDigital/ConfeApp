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
    FormHelperText,
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../api';
import AddressAutoCompleteForm from '../AddressAutoCompleteForm';
import domicileSchema from '../candidate_create/domicileSchema';

// Job form validation schema
const jobValidationSchema = yup.object().shape({
    name: yup
        .string()
        .required('El nombre del empleo es obligatorio')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim(),
    
    company: yup
        .string()
        .when('$isEdit', {
            is: false,
            then: (schema) => schema.required('La empresa es obligatoria'),
            otherwise: (schema) => schema.optional(),
        }),
    
    location: yup
        .string()
        .when('$newLocation', {
            is: false,
            then: (schema) => schema.required('La ubicación es obligatoria'),
            otherwise: (schema) => schema.optional(),
        }),
    
    job_description: yup
        .string()
        .required('La descripción del empleo es obligatoria')
        .max(2000, 'La descripción no puede exceder 2000 caracteres')
        .trim(),
    
    vacancies: yup
        .number()
        .typeError('Las vacantes deben ser un número')
        .min(0, 'Las vacantes no pueden ser negativas')
        .max(999, 'Las vacantes no pueden exceder 999')
        .integer('Las vacantes deben ser un número entero')
        .required('Las vacantes son obligatorias'),
    
    // Conditional location form validation when creating new location
    locationForm: yup
        .object()
        .when('$newLocation', {
            is: true,
            then: () => domicileSchema,
            otherwise: () => yup.object().optional(),
        }),
});

const JobFormDialog = ({ open, onClose, onSubmit, data, isEdit = false, companies, setJobs, setAlert }) => {
    const [locations, setLocations] = useState([]);
    const [newLocation, setNewLocation] = useState(false);
    const [autocompleteKey, setAutocompleteKey] = useState(0);

    const methods = useForm({
        resolver: yupResolver(jobValidationSchema),
        context: { 
            isEdit, 
            newLocation 
        },
        defaultValues: {
            name: '',
            company: '',
            location: '',
            job_description: '',
            vacancies: 0,
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
                residence_type: null,
            }
        },
        mode: 'onBlur', // Validate on blur for better UX
    });

    const { 
        handleSubmit, 
        control, 
        setValue, 
        watch, 
        reset, 
        formState: { errors, isSubmitting },
        clearErrors,
        setError
    } = methods;

    const watchedValues = watch();

    useEffect(() => {
        if (open) {
            fetchLocations();
            if (isEdit && data) {
                reset({
                    name: data.name || '',
                    company: data.company?.id || data.company || '',
                    location: data.location_details?.id || data.location || '',
                    job_description: data.job_description || '',
                    vacancies: data.vacancies !== null ? data.vacancies : 0,
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
                        residence_type: null,
                    }
                });
                setNewLocation(false);
            } else {
                reset({
                    name: '',
                    company: '',
                    location: '',
                    job_description: '',
                    vacancies: 0,
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
                        residence_type: null,
                    }
                });
                setNewLocation(false);
            }
        }
    }, [open, isEdit, data, reset]);

    // Update validation context when newLocation changes
    useEffect(() => {
        methods.clearErrors();
        // Re-validate the form with new context
        methods.trigger();
    }, [newLocation, methods]);

    const fetchLocations = async () => {
        try {
            const res = await api.get('api/agencia/locations/');
            setLocations(res.data);
        } catch (err) {
            console.error("Error al obtener ubicaciones", err);
            setAlert({
                severity: "error",
                message: "Error al cargar las ubicaciones",
            });
        }
    };

    const handleNewLocationChange = (e) => {
        const checked = e.target.checked;
        setNewLocation(checked);
        
        if (checked) {
            setValue('location', ''); // Clear location selection when creating new
            clearErrors('location');
        } else {
            // Clear location form when not creating new
            setValue('locationForm', {
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
                residence_type: null,
            });
            clearErrors('locationForm');
        }
    };

    const onFormSubmit = async (formData) => {
        try {
            let locationId = formData.location;
            
            if (newLocation) {
                const newLocationData = formData.locationForm;
                const locationRes = await api.post('api/agencia/locations/', newLocationData);
                locationId = locationRes.data.id;
            } else if (!locationId && isEdit && data && data.location_details) {
                locationId = data.location_details.id;
            }

            const payload = {
                name: formData.name.trim(),
                company: formData.company,
                location_id: locationId,
                job_description: formData.job_description.trim(),
                vacancies: formData.vacancies,
            };

            if (isEdit && data && data.id) {
                const res = await api.put(`api/agencia/jobs/${data.id}/`, payload);
            } else {
                const res = await api.post('api/agencia/jobs/', payload);
                if (setJobs) {
                    setJobs((jobs) => [...jobs, res.data]);
                }
            }

            setAlert({
                severity: "success",
                message: isEdit ? "Empleo actualizado correctamente" : "Empleo creado correctamente",
            });
            
            onSubmit(); // callback para cerrar el diálogo y refrescar datos
            
        } catch (error) {
            console.error("Error al enviar el formulario de empleo:", error);
            
            // Handle validation errors from backend
            if (error.response?.data) {
                const backendErrors = error.response.data;
                
                // Set field-specific errors
                Object.keys(backendErrors).forEach(field => {
                    if (typeof backendErrors[field] === 'string') {
                        setError(field, {
                            type: 'server',
                            message: backendErrors[field]
                        });
                    } else if (Array.isArray(backendErrors[field])) {
                        setError(field, {
                            type: 'server',
                            message: backendErrors[field][0]
                        });
                    }
                });
            }
            
            const errorMessage = error.response?.data?.non_field_errors?.[0] || 
                               error.response?.data?.detail || 
                               'Error al guardar el empleo. Verifique los datos.';
            
            setAlert({ 
                severity: "error", 
                message: errorMessage 
            });
        }
    };

    return (
        <FormProvider {...methods}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                TransitionProps={{ onEntered: () => setAutocompleteKey(prev => prev + 1) }}
                sx={{ zIndex: 1000 }}
            >
                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <DialogTitle>{isEdit ? 'Editar Empleo' : 'Crear Empleo'}</DialogTitle>
                    <DialogContent>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Nombre del empleo"
                            {...methods.register('name')}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                        
                        {(!!companies && !isEdit) && (
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                error={!!errors.company}
                            >
                                <InputLabel id="company-label">Empresa</InputLabel>
                                <Select
                                    labelId="company-label"
                                    label="Empresa"
                                    {...methods.register('company')}
                                    value={watchedValues.company || ''}
                                >
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.id}>
                                            {company.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.company && (
                                    <FormHelperText>{errors.company.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                        
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={newLocation}
                                    onChange={handleNewLocationChange}
                                />
                            }
                            label="Crear nueva ubicación"
                            sx={{ mt: 2 }}
                        />

                        {newLocation ? (
                            <AddressAutoCompleteForm 
                                key={autocompleteKey} 
                                prefix="locationForm" 
                            />
                        ) : (
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                error={!!errors.location}
                            >
                                <InputLabel id="location-label">Ubicación</InputLabel>
                                <Select
                                    labelId="location-label"
                                    label="Ubicación"
                                    {...methods.register('location')}
                                    value={watchedValues.location || ''}
                                >
                                    {locations.map((location) => (
                                        <MenuItem key={location.id} value={location.id}>
                                            {location.address_city} - {location.address_municip} - {location.address_road} {location.address_number}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.location && (
                                    <FormHelperText>{errors.location.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}

                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={3}
                            label="Descripción"
                            {...methods.register('job_description')}
                            error={!!errors.job_description}
                            helperText={errors.job_description?.message}
                        />

                        <TextField
                            margin="normal"
                            label="Vacantes"
                            fullWidth
                            type="number"
                            {...methods.register('vacancies', { 
                                valueAsNumber: true,
                                setValueAs: (value) => value === '' ? 0 : parseInt(value, 10)
                            })}
                            error={!!errors.vacancies}
                            helperText={errors.vacancies?.message}
                            slotProps={{
                                input: {
                                    inputProps: {
                                        min: 0,
                                        max: 999,
                                        step: 1,
                                    },
                                },
                            }}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            color="secondary" 
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit"
                            variant="contained" 
                            color="primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </FormProvider>
    );
};

export default JobFormDialog;