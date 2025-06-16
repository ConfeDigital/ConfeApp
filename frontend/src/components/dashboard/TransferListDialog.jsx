// Updated TransferListDialog component
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    IconButton,
    Alert,
    Avatar,
    Chip,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/es';
import api from '../../api';

// Add onActionSuccess prop
const TransferListDialog = ({ open, onClose, title, transferType, userList, onActionSuccess }) => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.user);
    const [alert, setAlert] = useState(null);

    dayjs.extend(localizedFormat);
    dayjs.locale('es');

    // Group requests by requested_user (the user being transferred)
    const groupRequests = () => {
        const grouped = {};

        userList.forEach(request => {
            // Always group by the requested_user (the person being transferred)
            const user = {
                ...request.requested_user, // Spreads all properties from requested_user
                photo: request.photo        // Adds or overwrites the photo property
            };

            if (!user || !user.id) {
                console.error('Invalid requested_user in request:', request);
                return;
            }

            if (!grouped[user.id]) {
                grouped[user.id] = {
                    user: user,
                    photo: request.photo,
                    requests: []
                };
            }

            grouped[user.id].requests.push(request);
        });

        return grouped;
    };

    // Process the requests into a grouped format
    // This needs to be re-calculated if userList changes, so it's good as a derived state
    const groupedRequests = React.useMemo(() => groupRequests(), [userList]);

    const handleAcceptRequest = (request) => {
        api.post(`api/centros/canalizar-candidato/${request.id}/accept/`)
            .then(res => {
                setAlert({ severity: 'success', message: res.data.detail });
                setTimeout(() => {
                    if (onActionSuccess) {
                        onActionSuccess();
                    }
                    onClose(); // Close the dialog after action
                    navigate(`/candidatos/${request.requested_user.id}`);
                }, 2000); // Give user a moment to see success message
            })
            .catch(error => {
                let errorMessage = 'Error al aceptar la solicitud.';
                if (error.response && error.response.data && error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
                setAlert({ severity: 'error', message: errorMessage });
            });
    };

    const handleDeclineRequest = (requestId) => {
        api.post(`api/centros/canalizar-candidato/${requestId}/decline/`)
            .then(res => {
                setAlert({ severity: 'success', message: res.data.detail });
                setTimeout(() => {
                    if (onActionSuccess) {
                        onActionSuccess();
                    }
                    onClose(); // Close the dialog after action
                }, 2000); // Give user a moment to see success message
            })
            .catch(error => {
                let errorMessage = 'Error al rechazar la solicitud.';
                if (error.response && error.response.data && error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
                setAlert({ severity: 'error', message: errorMessage });
            });
    };

    // Determine if this is showing incoming or outgoing requests
    const isIncomingRequests = transferType === 'haciaOrganizacion';

    const handleViewUser = (userId) => {
        if(isIncomingRequests){
            navigate(`/candidatos/visualizar/${userId}`);
        } else {
            navigate(`/candidatos/${userId}`);
        }
    };

    // Helper function to get status chip
    const getStatusChip = (status) => {
        switch(status) {
            case 'pending':
                return <Chip size="small" label="Pendiente" color="warning" />;
            case 'accepted':
                return <Chip size="small" label="Aceptado" color="success" />;
            case 'declined':
                return <Chip size="small" label="Rechazado" color="error" />;
            default:
                return <Chip size="small" label={status} />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ minHeight: 400, width: '100%', pt: 2 }}>
                {alert && (
                    <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
                        {alert.message}
                    </Alert>
                )}

                {userList.length > 0 && Object.keys(groupedRequests).length > 0 ? (
                    <Box>
                        {Object.values(groupedRequests).map(({ user, requests }) => (
                            <Accordion key={user.id} defaultExpanded sx={{ mb: 1 }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                                    }}
                                >
                                    <Box display="flex" alignItems="center" width="100%">
                                        <Avatar src={user.photo || undefined} sx={{ mr: 2, bgcolor: 'primary.main' }} />
                                        <Box flexGrow={1}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {`${user.first_name} ${user.last_name} ${user.second_last_name}`}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} de canalización
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Ver Usuario">
                                            <IconButton
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewUser(user.id);
                                                }}
                                                size="small"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Solicitante</TableCell>
                                                    {isIncomingRequests && <TableCell>Centro Solicitante</TableCell>}
                                                    {!isIncomingRequests && <TableCell>Centro Destino</TableCell>}
                                                    <TableCell>Solicitado</TableCell>
                                                    <TableCell>Estado</TableCell>
                                                    <TableCell>Respondido</TableCell>
                                                    <TableCell align="right">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {requests.map(request => (
                                                <TableRow key={request.id}>
                                                    <TableCell>{`${request.requester.first_name} ${request.requester.last_name}`}</TableCell>
                                                    {isIncomingRequests && (
                                                        <TableCell>{request.source_center.name}</TableCell>
                                                    )}
                                                    {!isIncomingRequests && (
                                                        <TableCell>{request.destination_center.name}</TableCell>
                                                    )}
                                                    <TableCell>{request.requested_at ? dayjs(request.requested_at).format('LLL') : 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {getStatusChip(request.status)}
                                                    </TableCell>
                                                    <TableCell>{request.responded_at ? dayjs(request.responded_at).format('LLL') : 'N/A'}</TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            {/* Only show accept button for incoming pending requests */}
                                                            {isIncomingRequests && request.status === 'pending' && (
                                                                <Tooltip title="Aceptar">
                                                                    <IconButton
                                                                        color="success"
                                                                        onClick={() => handleAcceptRequest(request)}
                                                                        size="small"
                                                                    >
                                                                        <CheckCircleOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            {/* Only show decline button for pending requests */}
                                                            {request.status === 'pending' && (
                                                                <Tooltip title="Rechazar">
                                                                    <IconButton
                                                                        color="error"
                                                                        onClick={() => handleDeclineRequest(request.id)}
                                                                        size="small"
                                                                    >
                                                                        <CancelOutlinedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                ) : (
                    <Typography>No hay solicitudes de traslado en esta categoría.</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TransferListDialog;