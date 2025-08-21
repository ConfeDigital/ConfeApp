// UsersSettings.jsx
import React, { useState, useEffect } from "react";
import { Alert, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  useMediaQuery, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Typography, useTheme, styled, Divider, CircularProgress,
} from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import * as Yup from "yup";
import api from "../../api";
import { translateGroupName } from "./groupsUtils";
import { useSelector } from "react-redux";
import TransferRequests from './TransferRequests';

const SuccessTableRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: theme.palette.success.light,
    "& > *": {
        // Apply to all children (TableCell, Typography, etc.)
        color:
            theme.palette.mode === "dark"
                ? theme.palette.common.black
                : theme.palette.common.white,
    },
}));

export default function UsersSettings() {
    const isSmall = useMediaQuery("(max-width:800px)");
    const theme = useTheme(); // Get the theme
    const currentUser = useSelector((state) => state.auth.user);
    const [alert, setAlert] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true); 
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [openTransferDialog, setOpenTransferDialog] = useState(false);
    const [selectedUserForTransfer, setSelectedUserForTransfer] = useState(null);
    const [transferDestinationCenter, setTransferDestinationCenter] =
        useState("");
    const [centers, setCenters] = useState([]);
    const [selectedDestinationCenterData, setSelectedDestinationCenterData] = useState(null);
    const [localSentRequests, setLocalSentRequests] = useState([]); 

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
        groups_names: ["personal"],
        is_staff: false,
    });

    // Fetch users
    useEffect(() => {
        setLoadingUsers(true); // Set loading to true before API call
        api
            .get("api/users/staff/")
            .then((res) => {
                setUsers(res.data);
                setLoadingUsers(false); // Set loading to false after successful fetch
            })
            .catch(() => {
                setAlert({ severity: "error", message: "Error recuperando usuarios" });
                setLoadingUsers(false); // Set loading to false on error as well
            });

        api
            .get("api/centros/centers/")
            .then((res) => setCenters(res.data))
            .catch(() =>
                setAlert({ severity: "error", message: "Error recuperando centros" })
            );
    }, [setAlert]);

    // Effect to update selectedDestinationCenterData when transferDestinationCenter changes
    useEffect(() => {
        if (transferDestinationCenter && centers.length > 0) {
            const selectedCenter = centers.find(center => center.id === transferDestinationCenter);
            setSelectedDestinationCenterData(selectedCenter || null);
        } else {
            setSelectedDestinationCenterData(null);
        }
    }, [transferDestinationCenter, centers]);

    // Yup schemas
    const createSchema = Yup.object().shape({
        first_name: Yup.string().required("El nombre es requerido"),
        last_name: Yup.string().required("El apellido es requerido"),
        email: Yup.string()
            .email("Email no válido")
            .required("El email es requerido"),
        password: Yup.string()
            .min(6, "La contraseña debe tener al menos 6 caracteres")
            .required("La contraseña es requerida"),
        confirm_password: Yup.string()
            .oneOf([Yup.ref("password")], "Las contraseñas deben coincidir")
            .required("Confirma la contraseña"),
        groups_names: Yup.array().min(1).required(),
        is_staff: Yup.boolean(),
    });
    const updateSchema = Yup.object().shape({
        first_name: Yup.string().required("El nombre es requerido"),
        last_name: Yup.string().required("El apellido es requerido"),
        email: Yup.string()
            .email("Email no válido")
            .required("El email es requerido"),
        groups_names: Yup.array().min(1).required(),
        is_staff: Yup.boolean(),
    });

    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            confirm_password: "",
            groups_names: ["personal"],
            is_staff: false,
        });
        setEditingUser(null);
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
            password: "",
            confirm_password: "",
            groups_names: user.groups_names || user.groups.map((g) => g.name),
            is_staff: user.is_staff,
        });
        setOpenDialog(true);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = () => {
        const schema = editingUser ? updateSchema : createSchema;
        const payload = { ...formData };
        // When updating, remove password fields
        if (editingUser) {
            delete payload.password;
            delete payload.confirm_password;
        }

        schema
            .validate(payload, { abortEarly: false })
            .then(() => {
                if (editingUser) {
                    return api.patch(`api/users/${editingUser.id}/`, payload);
                } else {
                    return api.post("api/users/", payload);
                }
            })
            .then((res) => {
                if (editingUser) {
                    setUsers((us) =>
                        us.map((u) => (u.id === res.data.id ? res.data : u))
                    );
                    setAlert({
                        severity: "success",
                        message: "Usuario actualizado correctamente",
                    });
                } else {
                    setUsers((us) => [...us, res.data]);
                    setAlert({
                        severity: "success",
                        message: "Usuario creado correctamente",
                    });
                }
                resetForm();
            })
            .catch((err) => {
                let msg = editingUser
                    ? "Error al actualizar usuario"
                    : "Error al crear el usuario";
                if (err.name === "ValidationError") {
                    msg = err.inner.map((e) => e.message).join(". ");
                } else if (err.response?.data) {
                    const data = err.response.data;
                    msg = data.email?.join(". ") || JSON.stringify(data);
                }
                setAlert({ severity: "error", message: msg });
            });
    };

    const handleToggleActive = (user) => {
        api
            .patch(`api/users/${user.id}/`, {
                email: user.email,
                is_active: !user.is_active,
            })
            .then((res) => {
                setUsers((us) => us.map((u) => (u.id === res.data.id ? res.data : u)));
                setAlert({
                    severity: "success",
                    message: `Usuario ${
                        res.data.is_active ? "activado" : "desactivado"
                    } correctamente`,
                });
            })
            .catch(() =>
                setAlert({ severity: "error", message: "Error actualizando estado" })
            );
    };

    const hasGroup = (thisUser, groupName) => {
        return thisUser?.groups?.some(
            (group) => group.name.toLowerCase() === groupName.toLowerCase()
        );
    };

    const handleOpenTransferDialog = (user) => {
        setSelectedUserForTransfer(user);
        setTransferDestinationCenter("");
        setSelectedDestinationCenterData("");
        setOpenTransferDialog(true);
    };

    const handleCloseTransferDialog = () => {
        setOpenTransferDialog(false);
        setSelectedUserForTransfer(null);
        setSelectedDestinationCenterData(null);
        setTransferDestinationCenter("");
    };

    const handleTransferDestinationChange = (event) => {
        setTransferDestinationCenter(event.target.value);
    };

    const handleRequestTransfer = () => {
        if (!selectedUserForTransfer || !transferDestinationCenter) {
            setAlert({
                severity: "error",
                message: "Por favor, selecciona un usuario y un centro de destino.",
            });
            return;
        }
        api
            .post("api/centros/transfer-requests/", {
                requested_user_id: selectedUserForTransfer.id,
                destination_center_id: transferDestinationCenter,
            })
            .then((res) => {
                setAlert({
                    severity: "success",
                    message: `Solicitud de traslado para ${selectedUserForTransfer.first_name} enviada.`,
                });
                setLocalSentRequests((prevRequests) => [...prevRequests, res.data]); // Update the local sent requests
                handleCloseTransferDialog();
            })
            .catch((error) => {
                let errorMessage = "Error al solicitar el traslado.";
                if (error.response && error.response.data) {
                    errorMessage = JSON.stringify(error.response.data);
                }
                setAlert({ severity: "error", message: errorMessage });
            });
    };

    if(!currentUser.center) return <Typography>Sin Centro</Typography>

    return (
        <>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h4" fontWeight="bold">
                    Lista de Usarios de {currentUser.center?.name}
                </Typography>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<PersonAddAltIcon />}
                    onClick={handleOpenCreate}
                >
                    {!isSmall && "Agregar Usuario"}
                </Button>
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
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow
                                    key={u.id}
                                    sx={{ opacity: u.is_active ? 1 : 0.5 }}
                                    component={u.id == currentUser.id ? SuccessTableRow : TableRow}
                                >
                                    <TableCell>{`${u.first_name} ${u.last_name}`}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        {u.groups
                                            ?.map((g) => translateGroupName(g.name))
                                            .join(", ") ||
                                            u.groups_names?.map(translateGroupName).join(", ") ||
                                            "N/A"}
                                    </TableCell>
                                    <TableCell>{u.is_staff ? "Sí" : "No"}</TableCell>
                                    <TableCell>{u.is_active ? "Sí" : "No"}</TableCell>
                                    <TableCell>
                                        {(!u.is_staff || (u.is_staff && currentUser.is_staff)) && (
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenEdit(u)}
                                                    size="small"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {currentUser.id !== u.id && 
                                          (!u.is_staff) && (
                                            <Tooltip title="Solicitar Traslado">
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() => handleOpenTransferDialog(u)}
                                                    size="small"
                                                >
                                                    <SwapHorizIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {currentUser.id != u.id &&
                                            (!u.is_staff || (u.is_staff && !u.is_active)) &&
                                            (currentUser.is_staff ||
                                                !hasGroup(u, "gerente") ||
                                                (hasGroup(u, "gerente") && !u.is_active)) && (
                                                <Tooltip
                                                    title={
                                                        u.is_active ? "Desactivar Usuario" : "Activar Usuario"
                                                    }
                                                >
                                                    <IconButton
                                                        onClick={() => handleToggleActive(u)}
                                                        size="small"
                                                        color={u.is_active ? "success" : "error"}
                                                    >
                                                        {u.is_active ? (
                                                            <ToggleOnIcon fontSize="small" />
                                                        ) : (
                                                            <ToggleOffIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Divider sx={{ my: 2 }} />

            <TransferRequests
                setUsers={setUsers}
                localSentRequests={localSentRequests}
                setLocalSentRequests={setLocalSentRequests}
            />

            <Dialog open={openDialog} onClose={resetForm} fullWidth maxWidth="sm">
                <DialogTitle>
                    {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                </DialogTitle>
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
                                renderValue={(sel) => sel.map(translateGroupName).join(", ")}
                            >
                                <MenuItem value="personal" disabled>
                                    <Checkbox checked />
                                    <ListItemText primary="Personal" />
                                </MenuItem>
                                <MenuItem value="agencia_laboral">
                                    <Checkbox
                                        checked={formData.groups_names.includes("agencia_laboral")}
                                    />
                                    <ListItemText primary="Agencia Laboral" />
                                </MenuItem>
                                <MenuItem
                                    value="gerente"
                                    disabled={
                                        hasGroup(editingUser, "gerente") && !currentUser.is_staff
                                    }
                                >
                                    <Checkbox
                                        checked={formData.groups_names.includes("gerente")}
                                    />
                                    <ListItemText primary="Gerente" />
                                </MenuItem>
                            </Select>
                        </FormControl>
                        {currentUser.is_staff && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="is_staff"
                                        disabled={editingUser?.is_staff}
                                        checked={formData.is_staff}
                                        onChange={handleFormChange}
                                    />
                                }
                                label="Administrador"
                                labelPlacement="start"
                                sx={{ ml: 0 }}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={resetForm} color='secondary'>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">
                        {editingUser ? "Guardar Cambios" : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openTransferDialog}
                onClose={handleCloseTransferDialog}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Solicitar Traslado de Usuario</DialogTitle>
                <DialogContent>
                    {selectedUserForTransfer && (
                        <Typography variant="subtitle1" gutterBottom>
                            ¿Solicitar traslado de{" "}
                            <strong>
                                {selectedUserForTransfer.first_name}{" "}
                                {selectedUserForTransfer.last_name}
                            </strong>{" "}
                            a otro centro?
                        </Typography>
                    )}
                    <FormControl fullWidth margin="normal" size="small">
                        <InputLabel id="transfer-destination-label">
                            Centro de Destino
                        </InputLabel>
                        <Select
                            labelId="transfer-destination-label"
                            id="transfer-destination"
                            value={transferDestinationCenter}
                            onChange={handleTransferDestinationChange}
                            label="Centro de Destino"
                        >
                            {centers
                                .filter((center) => center.id !== currentUser.center?.id)
                                .map((center) => (
                                    <MenuItem key={center.id} value={center.id}>
                                        {center.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    {selectedDestinationCenterData && (
                        <>
                            <Typography variant="subtitle2" mt={1}>Dirección del Centro</Typography>
                            <Typography>
                                {selectedDestinationCenterData.location_details
                                    ? `${selectedDestinationCenterData.location_details.address_road} ${selectedDestinationCenterData.location_details.address_number}, ${selectedDestinationCenterData.location_details.address_municip}, ${selectedDestinationCenterData.location_details.address_city}`
                                    : 'N/A'}
                            </Typography>
                        </>
                    )}
                    {alert && alert.severity === "error" && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {alert.message}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTransferDialog} color='secondary'>Cancelar</Button>
                    <Button
                        onClick={handleRequestTransfer}
                        variant="contained"
                        disabled={!transferDestinationCenter}
                    >
                        Solicitar Traslado
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}