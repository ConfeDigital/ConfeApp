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
    Box,
    Typography,
    Divider,
    Chip,
    Autocomplete,
    InputAdornment,
    List,
    ListItem,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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
        .when('$shouldRequireCompany', {
          is: true, // This condition is true when shouldRequireCompany is true
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

    horario: yup
        .string()
        .max(255, 'El horario no puede exceder 255 caracteres')
        .optional(),

    sueldo_base: yup
        .number()
        .typeError('El sueldo base debe ser un número')
        .min(0, 'El sueldo base no puede ser negativo')
        .max(999999.99, 'El sueldo base no puede exceder 999,999.99')
        .optional(),

    prestaciones: yup
        .string()
        .max(2000, 'Las prestaciones no pueden exceder 2000 caracteres')
        .optional(),

    // Conditional location form validation when creating new location
    locationForm: yup
        .object()
        .when('$newLocation', {
            is: true,
            then: () => domicileSchema,
            otherwise: () => yup.object().optional(),
        }),
});

const JobFormDialog = ({ open, onClose, onSubmit, data, isEdit = false, companies = null, setJobs, setAlert }) => {
    const [locations, setLocations] = useState([]);
    const [newLocation, setNewLocation] = useState(false);
    const [autocompleteKey, setAutocompleteKey] = useState(0);
    const [habilidades, setHabilidades] = useState([]);
    const [selectedHabilidades, setSelectedHabilidades] = useState([]);

    const shouldRequireCompany = !isEdit && companies !== null;

    const methods = useForm({
        resolver: yupResolver(jobValidationSchema),
        context: {
            isEdit,
            shouldRequireCompany,
            newLocation
        },
        defaultValues: {
            name: '',
            company: '',
            location: '',
            job_description: '',
            vacancies: 0,
            horario: '',
            sueldo_base: '',
            prestaciones: '',
            locationForm: {
                alias: '',
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
            fetchHabilidades();
            if (isEdit && data) {
                reset({
                    name: data.name || '',
                    company: data.company?.id || data.company || '',
                    location: data.location_details?.id || data.location || '',
                    job_description: data.job_description || '',
                    vacancies: data.vacancies !== null ? data.vacancies : 0,
                    horario: data.horario || '',
                    sueldo_base: data.sueldo_base || '',
                    prestaciones: data.prestaciones || '',
                    locationForm: {
                        alias: '',
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

                // Cargar habilidades del empleo si está editando
                if (data.habilidades_requeridas) {
                    setSelectedHabilidades(data.habilidades_requeridas.map(h => ({
                        id: h.habilidad,
                        nombre: h.habilidad_nombre,
                        categoria: h.habilidad_categoria
                    })));
                } else {
                    setSelectedHabilidades([]);
                }
            } else {
                reset({
                    name: '',
                    company: '',
                    location: '',
                    job_description: '',
                    vacancies: 0,
                    horario: '',
                    sueldo_base: '',
                    prestaciones: '',
                    locationForm: {
                        alias: '',
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
                setSelectedHabilidades([]);

                // 👇 NEW: Auto-set company if it's a single object
                if (companies && !Array.isArray(companies)) {
                    setValue('company', companies.id);
                }
            }
        }
    }, [open, isEdit, data, reset, setValue, companies]);

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

    const fetchHabilidades = async () => {
        try {
            const res = await api.get('api/agencia/habilidades/');
            setHabilidades(res.data);
        } catch (err) {
            console.error("Error al obtener habilidades", err);
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
                alias: '',
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
                newLocationData.company = formData.company;
                const locationRes = await api.post('api/agencia/locations/', newLocationData);
                locationId = locationRes.data.id;
            } else if (!locationId && isEdit && data && data.location_details) {
                locationId = data.location_details.id;
            }

            const payload = {
                name: formData.name.trim(),
                location_id: locationId,
                job_description: formData.job_description.trim(),
                vacancies: formData.vacancies,
                horario: formData.horario?.trim() || '',
                sueldo_base: formData.sueldo_base || null,
                prestaciones: formData.prestaciones?.trim() || '',
                habilidades_ids: selectedHabilidades.map(h => h.id),
            };

            // Only include company in payload if not editing (to avoid overwriting with null)
            if (!isEdit) {
                payload.company = formData.company;
            }

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

                        {(!isEdit && !!companies) && (
                            Array.isArray(companies) ? (
                                // Case 1: Multiple companies → dropdown
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
                            ) : (
                                // Case 2: Single company → auto-select + disabled
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Empresa"
                                    value={companies.name}
                                    disabled
                                />
                            )
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
                            <Box>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    label="Alias de la ubicación (opcional)"
                                    placeholder="Ej: Oficina Principal, Sucursal Norte, etc."
                                    {...methods.register('locationForm.alias')}
                                    helperText="Un nombre descriptivo para identificar fácilmente esta ubicación"
                                />
                                <AddressAutoCompleteForm
                                    key={autocompleteKey}
                                    prefix="locationForm"
                                />
                            </Box>
                        ) : (
                            <Autocomplete
                                options={locations}
                                getOptionLabel={(option) => option.display_name || `${option.address_city} - ${option.address_municip} - ${option.address_road} ${option.address_number}`}
                                value={locations.find(loc => loc.id === watchedValues.location) || null}
                                onChange={(event, newValue) => {
                                    setValue('location', newValue ? newValue.id : '');
                                    if (newValue) {
                                        clearErrors('location');
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Ubicación"
                                        margin="normal"
                                        error={!!errors.location}
                                        helperText={errors.location?.message}
                                        placeholder="Buscar ubicación..."
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {option.alias || `${option.address_road} ${option.address_number || ''}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.address_col && `${option.address_col}, `}
                                                {option.address_municip}, {option.address_city}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                noOptionsText="No se encontraron ubicaciones"
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
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
                            defaultValue={0}
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

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>Detalles del Empleo</Typography>

                        <TextField
                            margin="normal"
                            fullWidth
                            label="Horario de Trabajo"
                            placeholder="Ej: Lunes a Viernes 8:00-17:00"
                            {...methods.register('horario')}
                            error={!!errors.horario}
                            helperText={errors.horario?.message}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            label="Sueldo Base (Mensual MXN)"
                            type="number"
                            placeholder="Ej: 15000"
                            {...methods.register('sueldo_base', {
                                valueAsNumber: true,
                                setValueAs: (value) => value === '' ? null : parseFloat(value)
                            })}
                            error={!!errors.sueldo_base}
                            helperText={errors.sueldo_base?.message}
                            slotProps={{
                                input: {
                                    inputProps: {
                                        min: 0,
                                        step: 1000,
                                    },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AttachMoneyIcon />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={3}
                            label="Prestaciones"
                            placeholder="Ej: Seguro médico, vales de despensa, bonos de productividad"
                            {...methods.register('prestaciones')}
                            error={!!errors.prestaciones}
                            helperText={errors.prestaciones?.message}
                        />

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>Habilidades Requeridas</Typography>

                        <Autocomplete
                            multiple
                            options={habilidades}
                            getOptionLabel={(option) => `${option.nombre} (${option.categoria})`}
                            value={selectedHabilidades}
                            onChange={(event, newValue) => {
                                setSelectedHabilidades(newValue);
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        variant="outlined"
                                        label={`${option.nombre} (${option.categoria})`}
                                        {...getTagProps({ index })}
                                        key={option.id}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Seleccionar Habilidades"
                                    placeholder="Buscar y seleccionar habilidades requeridas"
                                    helperText="Selecciona las habilidades que requiere este empleo"
                                    margin="normal"
                                />
                            )}
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