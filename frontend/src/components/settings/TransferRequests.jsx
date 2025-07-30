// TransferRequests.jsx
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
    Tooltip,
    IconButton,
    Typography,
    Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import api from '../../api';
import { useSelector } from "react-redux";
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/es';
import { useLocation } from 'react-router-dom';

export default function TransferRequests({ setUsers, localSentRequests, setLocalSentRequests }) {
    const currentUser = useSelector((state) => state.auth.user);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [alert, setAlert] = useState(null);

    const location = useLocation();

    dayjs.extend(localizedFormat);
    dayjs.locale('es');

    useEffect(() => {
        if (currentUser?.center?.id) {
            api.get('api/centros/transfer-requests/')
                .then(res => {
                    const filteredReceived = res.data.filter(req =>
                        req.destination_center.id === currentUser.center.id && req.status === 'pending'
                    );
                    setReceivedRequests(filteredReceived);

                    const filteredSent = res.data.filter(req =>
                        req.source_center.id === currentUser.center.id &&
                        req.status === 'pending' &&
                        req.destination_center.id !== currentUser.center.id
                    );
                    // Initialize the local state if it's empty, otherwise keep the state updated by the parent
                    if (localSentRequests.length === 0) {
                        setLocalSentRequests(filteredSent);
                    }
                })
                .catch(() => setAlert({ severity: 'error', message: 'Error fetching transfer requests.' }));
        }
    }, [currentUser?.center?.id, setAlert, setLocalSentRequests, localSentRequests.length, location.search]);

    const handleAcceptRequest = (requestId) => {
        api.post(`api/centros/transfer-requests/${requestId}/accept/`)
            .then(res => {
                setAlert({ severity: 'success', message: res.data.detail });
                setUsers((us) => {
                    const updatedUser = res.data.user;
                    const userExists = us.some(user => user.id === updatedUser.id);
                    if (userExists) {
                        return us.map(user =>
                            user.id === updatedUser.id ? updatedUser : user
                        );
                    } else {
                        return [...us, updatedUser];
                    }
                });
                setReceivedRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
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
        api.post(`api/centros/transfer-requests/${requestId}/decline/`)
            .then(res => {
                setAlert({ severity: 'success', message: res.data.detail });
                setReceivedRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
                setLocalSentRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
            })
            .catch(error => {
                let errorMessage = 'Error al rechazar la solicitud.';
                if (error.response && error.response.data && error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
                setAlert({ severity: 'error', message: errorMessage });
            });
    };

    return (
        <Box>
            {alert && (
                <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}
            {/* Received Requests Table */}
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Solicitudes de Traslado Recibidas
            </Typography>

            {receivedRequests.length === 0 ? (
                <Typography>No hay solicitudes de traslado pendientes para tu centro.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Solicitante</TableCell>
                                <TableCell>Usuario a Trasladar</TableCell>
                                <TableCell>Centro de Origen</TableCell>
                                <TableCell>Solicitado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {receivedRequests.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell>{`${request.requester.first_name} ${request.requester.last_name}`}</TableCell>
                                    <TableCell>{`${request.requested_user.first_name} ${request.requested_user.last_name}`}</TableCell>
                                    <TableCell>{request.source_center.name}</TableCell>
                                    <TableCell>{request.requested_at ? dayjs(request.requested_at).format('LLL') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Tooltip title="Aceptar">
                                            <IconButton color="success" onClick={() => handleAcceptRequest(request.id)} size="small">
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Rechazar">
                                            <IconButton color="error" onClick={() => handleDeclineRequest(request.id)} size="small">
                                                <CancelOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Sent Requests Table */}
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Solicitudes de Traslado Enviadas desde tu Centro
            </Typography>
            {localSentRequests.length === 0 ? (
                <Typography>No hay solicitudes de traslado pendientes enviadas desde tu centro a otros centros.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Solicitante</TableCell>
                                <TableCell>Usuario Solicitado</TableCell>
                                <TableCell>Centro de Destino</TableCell>
                                <TableCell>Solicitado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {localSentRequests.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell>{`${request.requester.first_name} ${request.requester.last_name}`}</TableCell>
                                    <TableCell>{`${request.requested_user.first_name} ${request.requested_user.last_name}`}</TableCell>
                                    <TableCell>{request.destination_center.name}</TableCell>
                                    <TableCell>{request.requested_at ? dayjs(request.requested_at).format('LLL') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Tooltip title="Rechazar Solicitud">
                                            <IconButton color="error" onClick={() => handleDeclineRequest(request.id)} size="small">
                                                <CancelOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}