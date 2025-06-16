import React, { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Typography,
    CircularProgress,
    useTheme, 
    styled,
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import * as Yup from 'yup';
import api from '../../api';
import { translateGroupName } from './groupsUtils';
import { useSelector } from "react-redux";

const SuccessTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  '& > *': { // Apply to all children (TableCell, Typography, etc.)
    color: theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
  },
}));

export default function UserSettingsAdminPanel() {
    const isSmall = useMediaQuery('(max-width:800px)');
    const theme = useTheme(); // Get the theme
    const currentUser = useSelector((state) => state.auth.user);
    const [alert, setAlert] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true); 
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        groups_names: ['personal'],
        is_staff: false,
        center_id: '', // Added center to form data
    });
    const [centers, setCenters] = useState([]);
    const [selectedCenterData, setSelectedCenterData] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState(currentUser.center?.id || null);

    // Fetch centers
    useEffect(() => {
        api.get('api/centros/centers/')
            .then(res => setCenters(res.data))
            .catch(() => setAlert({ severity: 'error', message: 'Error recuperando centros' }));
    }, [setAlert]);

    // Fetch users, now dependent on selectedCenter
    useEffect(() => {
        setLoadingUsers(true);
        if (selectedCenter) {
            api.get(`api/users/users_by_center/?center_id=${selectedCenter}`)
                .then((res) => {
                    setUsers(res.data);
                    setLoadingUsers(false); // Set loading to false after successful fetch
                })
                .catch(() => {
                    setAlert({ severity: "error", message: "Error recuperando usuarios" });
                    setLoadingUsers(false); // Set loading to false on error as well
                });
        }
        else{
            api.get(`api/users/users_by_center/`)
                .then((res) => {
                    setUsers(res.data);
                    setLoadingUsers(false); // Set loading to false after successful fetch
                })
                .catch(() => {
                    setAlert({ severity: "error", message: "Error recuperando usuarios" });
                    setLoadingUsers(false); // Set loading to false on error as well
                });
        }
    }, [selectedCenter, setAlert]);

    // Effect to find and set the selected center's data
    useEffect(() => {
        if (formData.center_id && centers.length > 0) {
            const foundCenter = centers.find(center => center.id === formData.center_id);
            setSelectedCenterData(foundCenter);
        } else {
            setSelectedCenterData(null);
        }
    }, [formData.center_id, centers]);

    useEffect(() => {
        if (selectedCenter && centers.length > 0) {
            const foundCenter = centers.find(center => center.id === selectedCenter);
            setSelectedCenterData(foundCenter);
        } else {
            setSelectedCenterData(null);
        }
    }, [selectedCenter, centers]);

    // Yup schemas
    const createSchema = Yup.object().shape({
        first_name: Yup.string().required('El nombre es requerido'),
        last_name: Yup.string().required('El apellido es requerido'),
        email: Yup.string().email('Email no válido').required('El email es requerido'),
        password: Yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es requerida'),
        confirm_password: Yup.string()
            .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
            .required('Confirma la contraseña'),
        groups_names: Yup.array().min(1).required(),
        is_staff: Yup.boolean(),
        center_id: Yup.string().required('El centro es requerido'), // Center is required for new users
    });
    const updateSchema = Yup.object().shape({
        first_name: Yup.string().required('El nombre es requerido'),
        last_name: Yup.string().required('El apellido es requerido'),
        email: Yup.string().email('Email no válido').required('El email es requerido'),
        groups_names: Yup.array().min(1).required(),
        is_staff: Yup.boolean(),
        center_id: Yup.string().required('El centro es requerido'), // Center is required for updates
    });

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            confirm_password: '',
            groups_names: ['personal'],
            is_staff: false,
            center_id: '', // Reset center as well
        });
        setEditingUser(null);
        setSelectedCenterData(null);
        setOpenDialog(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setOpenDialog(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            password: '',
            confirm_password: '',
            groups_names: user.groups_names || user.groups.map(g => g.name),
            is_staff: user.is_staff,
            center_id: user.center?.id || '', // Populate center ID for editing
        });
        setSelectedCenterData(centers.find(center => center.id === user.center?.id) || null);
        setOpenDialog(true);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = () => {
        const schema = editingUser ? updateSchema : createSchema;
        const payload = { ...formData };
        if (editingUser) {
            delete payload.password;
            delete payload.confirm_password;
        }

        schema.validate(payload, { abortEarly: false })
            .then(() => {
                let request;
                if (editingUser) {
                    request = api.patch(`api/users/${editingUser.id}/`, payload);
                } else {
                    request = api.post('api/users/', payload);
                }
                return request;
            })
            .then(res => {
                const updatedUser = res.data;
                if (selectedCenter) {
                    // If a specific center is selected
                    if (editingUser) {
                        // For edits, update the list only if the user's new center matches the filter
                        if (updatedUser.center?.id === selectedCenter) {
                            setUsers(us => us.map(u => u.id === updatedUser.id ? updatedUser : u));
                            setAlert({ severity: 'success', message: 'Usuario actualizado correctamente' });
                        } else {
                            // If the edited user's center no longer matches, remove them from the list
                            setUsers(us => us.filter(u => u.id !== updatedUser.id));
                            setAlert({ severity: 'success', message: 'Usuario actualizado correctamente' });
                        }
                    } else {
                        // For new users, add only if their center matches the filter
                        if (updatedUser.center?.id === selectedCenter) {
                            setUsers(us => [...us, updatedUser]);
                            setAlert({ severity: 'success', message: 'Usuario creado correctamente' });
                        } else {
                            setAlert({ severity: 'success', message: 'Usuario creado correctamente (no aparece en la lista actual)' });
                        }
                    }
                } else {
                    // If 'Todos los centros' is selected, update the list normally
                    if (editingUser) {
                        setUsers(us => us.map(u => u.id === updatedUser.id ? updatedUser : u));
                        setAlert({ severity: 'success', message: 'Usuario actualizado correctamente' });
                    } else {
                        setUsers(us => [...us, updatedUser]);
                        setAlert({ severity: 'success', message: 'Usuario creado correctamente' });
                    }
                }
                resetForm();
            })
            .catch(err => {
                let msg = editingUser ? 'Error al actualizar usuario' : 'Error al crear el usuario';
                if (err.name === 'ValidationError') {
                    msg = err.inner.map(e => e.message).join('. ');
                } else if (err.response?.data) {
                    const data = err.response.data;
                    msg = data.email?.join('. ') || JSON.stringify(data);
                }
                setAlert({ severity: 'error', message: msg });
            });
    };

    const handleToggleActive = (user) => {
        api.patch(`api/users/${user.id}/`, { email: user.email, is_active: !user.is_active })
            .then(res => {
                setUsers(us => us.map(u => u.id === res.data.id ? res.data : u));
                setAlert({ severity: 'success', message: `Usuario ${res.data.is_active ? 'activado' : 'desactivado'} correctamente` });
            })
            .catch(() => setAlert({ severity: 'error', message: 'Error actualizando estado' }));
    };

    const hasGroup = (thisUser, groupName) => {
        return thisUser?.groups?.some(
            (group) => group.name.toLowerCase() === groupName.toLowerCase()
        );
    };
    const handleCenterChange = (event) => {
        setSelectedCenter(event.target.value);
    };

    return (
        <>
            <Box display="flex" justifyContent="space-between" mb={2} flexDirection={isSmall ? 'column' : 'row'} alignItems={isSmall ? 'flex-start': 'center'}>
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    mb={isSmall ? 2 : 0}
                >
                    Lista de Usuarios
                </Typography>
                <Box display='flex' gap={2} alignItems="center" >
                    <Box display={isSmall ? 'block' : 'flex'} gap={1} >
                    <FormControl>
                        <InputLabel id="center-filter-label">Filtrar por Centro</InputLabel>
                        <Select
                            labelId="center-filter-label"
                            id="center-filter"
                            value={selectedCenter}
                            label="Filtrar por Centro"
                            onChange={handleCenterChange}
                            size='small'
                            sx={{ minWidth: isSmall ? 100 : 200, maxWidth: isSmall ? 200 : 200, mr: 2 }}
                        >
                            <MenuItem value="">Todos los Centros</MenuItem>
                            {centers.map((center) => (
                                <MenuItem key={center.id} value={center.id}>
                                    {center.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {selectedCenterData && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ maxWidth: !isSmall ? 200 : undefined }} >Dirección del Centro</Typography>
                            <Typography sx={{ maxWidth: !isSmall ? 200 : undefined }}>
                                {selectedCenterData.location_details
                                    ? `${selectedCenterData.location_details.address_road} ${selectedCenterData.location_details.address_number}, ${selectedCenterData.location_details.address_municip}, ${selectedCenterData.location_details.address_city}`
                                    : 'N/A'}
                            </Typography>
                        </Box>
                    )}
                    </Box>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<PersonAddAltIcon />}
                        onClick={handleOpenCreate}
                        sx={{ justifySelf: 'end' }}
                    >
                        {!isSmall && 'Agregar Usuario'}
                    </Button>
                </Box>
            </Box>

            {loadingUsers ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Roles</TableCell>
                                <TableCell>Admin</TableCell>
                                <TableCell>Activo</TableCell>
                                {!selectedCenter && (
                                    <TableCell>Centro</TableCell>
                                )}
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} sx={{ opacity: u.is_active ? 1 : 0.5 }} component={u.id == currentUser.id ? SuccessTableRow : TableRow}>
                                    <TableCell>{`${u.first_name} ${u.last_name}`}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{(u.groups?.map(g => translateGroupName(g.name)).join(', '))
                                        || (u.groups_names?.map(translateGroupName).join(', '))
                                        || 'N/A'}</TableCell>
                                    <TableCell>{u.is_staff ? 'Sí' : 'No'}</TableCell>
                                    <TableCell>{u.is_active ? 'Sí' : 'No'}</TableCell>
                                    {!selectedCenter && (
                                        <TableCell>{u.center?.name}</TableCell>
                                    )}
                                    <TableCell>
                                        {(!u.is_staff || (u.is_staff && currentUser.is_staff)) && (
                                            <Tooltip title="Editar">
                                                <IconButton color='primary' onClick={() => handleOpenEdit(u)} size="small">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {currentUser.id != u.id && (
                                            (((!u.is_staff || (u.is_staff && !u.is_active)) && (currentUser.is_staff || (!hasGroup(u, "gerente") || (hasGroup(u, "gerente") && !u.is_active)))) && (
                                                <Tooltip title={u.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}>
                                                    <IconButton onClick={() => handleToggleActive(u)} size="small" color={u.is_active ? 'success' : 'error'}>
                                                        {u.is_active ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                            ))
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={resetForm} fullWidth maxWidth="sm">
                <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
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
                            name="first_name"
                            size="small"
                            value={formData.first_name}
                            onChange={handleFormChange}
                            fullWidth
                        />
                        <TextField
                            label="Apellido"
                            name="last_name"
                            size="small"
                            value={formData.last_name}
                            onChange={handleFormChange}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            size="small"
                            value={formData.email}
                            onChange={handleFormChange}
                            fullWidth
                            disabled={!!editingUser}
                        />
                        {!editingUser && (
                            <>
                                <TextField
                                    label="Contraseña"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    size="small"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Confirmar Contraseña"
                                    name="confirm_password"
                                    type="password"
                                    autoComplete="new-password"
                                    size="small"
                                    value={formData.confirm_password}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </>
                        )}
                        <FormControl fullWidth size="small">
                            <InputLabel id="groups-dialog-label">Roles</InputLabel>
                            <Select
                                labelId="groups-dialog-label"
                                label="Roles"
                                multiple
                                name="groups_names"
                                value={formData.groups_names}
                                onChange={handleFormChange}
                                renderValue={sel => sel.map(translateGroupName).join(', ')}
                            >
                                <MenuItem value="personal" disabled>
                                    <Checkbox checked />
                                    <ListItemText primary="Personal" />
                                </MenuItem>
                                {/* <MenuItem value="agencia_laboral">
                                    <Checkbox checked={formData.groups_names.includes('agencia_laboral')} />
                                    <ListItemText primary="Agencia Laboral" />
                                </MenuItem> */}
                                <MenuItem value="gerente" disabled={(hasGroup(editingUser, "gerente") && !currentUser.is_staff)}>
                                    <Checkbox checked={formData.groups_names.includes('gerente')} />
                                    <ListItemText primary="Gerente" />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel id="center-edit-label">Centro</InputLabel>
                            <Select
                                labelId="center-edit-label"
                                id="center-edit"
                                name="center_id"
                                value={formData.center_id}
                                label="Centro"
                                onChange={handleFormChange}
                            >
                                {centers.map((center) => (
                                    <MenuItem key={center.id} value={center.id}>
                                        {center.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCenterData && (
                            <Box>
                                <Typography variant="subtitle2">Dirección del Centro</Typography>
                                <Typography>
                                    {selectedCenterData.location_details
                                        ? `${selectedCenterData.location_details.address_road} ${selectedCenterData.location_details.address_number}, ${selectedCenterData.location_details.address_municip}, ${selectedCenterData.location_details.address_city}`
                                        : 'N/A'}
                                </Typography>
                            </Box>
                        )}
                        {currentUser.is_staff && (
                            <FormControlLabel
                                control={<Checkbox
                                    name="is_staff"
                                    disabled={editingUser?.is_staff}
                                    checked={formData.is_staff}
                                    onChange={handleFormChange}
                                />}
                                label="Administrador"
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button color='secondary' onClick={resetForm}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">{editingUser ? 'Guardar' : 'Crear'}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}