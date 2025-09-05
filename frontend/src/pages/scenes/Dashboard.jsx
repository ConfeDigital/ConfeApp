import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Grid,
    Button,
    Menu,
    MenuItem,
    Divider,
    Chip,
    TextField,
    Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useMediaQuery } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FilterListIcon from "@mui/icons-material/FilterList";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import api from "../../api";
import dayjs from "dayjs";
import * as Yup from "yup";

import useDocumentTitle from "../../hooks/useDocumentTitle";
import UserListDialog from "../../components/dashboard/UserListDialog";
import TransferListDialog from "../../components/dashboard/TransferListDialog"; // Import the new component
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";

const dateFilterSchema = Yup.object({
    start_date: Yup.date()
        .required("Fecha inicio requerida"),
    end_date: Yup.date()
        .required("Fecha fin requerida")
        .min(Yup.ref("start_date"), "La fecha de fin debe ser mayor o igual a la fecha de inicio"),
});

export default function Dashboard() {
    useDocumentTitle("Inicio");
    const isSmallScreen = useMediaQuery("(max-width:600px)");

    const [dateRange, setDateRange] = useState([
        dayjs().subtract(1, "month"),
        dayjs(),
    ]);

    const [dateCycles, setDateCycles] = useState([]);
    const [statsData, setStatsData] = useState({});
    const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
    const [cycleAnchorEl, setCycleAnchorEl] = useState(null);
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [activeFilter, setActiveFilter] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // Regular user list dialog state
    const [isUserListDialogOpen, setIsUserListDialogOpen] = useState(false);
    const [userList, setUserList] = useState([]);
    const [dialogTitle, setDialogTitle] = useState("");

    // Transfer requests dialog state
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [transferUserList, setTransferUserList] = useState([]);
    const [transferTitle, setTransferTitle] = useState("");
    const [transferType, setTransferType] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    // Fetch cycles once
    useEffect(() => {
        api
            .get("/api/candidatos/ciclos/")
            .then((res) => setDateCycles(res.data || []))
            .catch((err) => console.error(err));
    }, []);

    // Fetch stats whenever filter changes
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const params = {};
            if (activeFilter === "date") {
                params.start_date = dateRange[0].format("YYYY-MM-DD");
                params.end_date = dateRange[1].format("YYYY-MM-DD");
            } else if (activeFilter === "cycle" && selectedCycle) {
                params.cycle_id = selectedCycle.id;
            }
            try {
                const res = await api.get("/api/candidatos/dashboard-stats/", {
                    params,
                });
                setStatsData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false); // Set loading to false when done
            }
        };
        fetchStats();
    }, [activeFilter, dateRange, selectedCycle]);

    // --- Handlers for menus & filters ---
    const handleCalendarClick = (e) => setCalendarAnchorEl(e.currentTarget);
    const handleCalendarClose = () => setCalendarAnchorEl(null);

    const handleCycleClick = (e) => setCycleAnchorEl(e.currentTarget);
    const handleCycleClose = () => setCycleAnchorEl(null);
    const handleCycleSelect = (cycle) => {
        setSelectedCycle(cycle);
        setActiveFilter("cycle");
        handleCycleClose();
        setErrorMsg("");
    };

    const handleClearFilters = () => {
        setSelectedCycle(null);
        setActiveFilter(null);
        setErrorMsg("");
    };

    const handleApplyDateFilter = async () => {
        try {
            await dateFilterSchema.validate(
                { start_date: dateRange[0], end_date: dateRange[1] },
                { abortEarly: false }
            );
            setSelectedCycle(null);
            setActiveFilter("date");
            setErrorMsg("");
            handleCalendarClose();
        } catch (validationError) {
            setErrorMsg(validationError.errors.join(". "));
        }
    };

    const getButtonVariant = (type) =>
        activeFilter === type ? "contained" : "outlined";

    const handleOpenUserListDialog = async (title, userPksKey) => {
        // Special handling for transfer requests
        if (userPksKey === 'haciaOrganizacion' || userPksKey === 'desdeOrganizacion') {
            setTransferTitle(title);
            setTransferType(userPksKey);

            try {
                // Instead of using user IDs, directly fetch transfer requests based on direction
                const direction = userPksKey === 'haciaOrganizacion' ? 'incoming' : 'outgoing';
                const response = await api.get(`/api/centros/canalizar-candidato/?direction=${direction}`);
                setTransferUserList(response.data);
                setIsTransferDialogOpen(true);
            } catch (error) {
                console.error("Error fetching transfer request list:", error);
                setErrorMsg("Error al cargar la lista de solicitudes de traslado.");
            }
            return;
        }

        // Regular user list handling
        setDialogTitle(title);
        const userPks = statsData.user_pks?.[userPksKey] || [];
        if (userPks.length > 0) {
            try {
                const params = new URLSearchParams();
                userPks.forEach(id => {
                    params.append('ids', id);
                });
                const response = await api.get(`/api/candidatos/dashboard-list/?${params.toString()}`);
                setUserList(response.data);
                setIsUserListDialogOpen(true);
            } catch (error) {
                console.error("Error fetching user list:", error);
                setErrorMsg("Error al cargar la lista de usuarios.");
            }
        } else {
            setUserList([]);
            setIsUserListDialogOpen(true);
        }
    };

    const handleCloseUserListDialog = () => {
        setIsUserListDialogOpen(false);
        setUserList([]);
        setDialogTitle("");
    };

    const handleCloseTransferDialog = () => {
        setIsTransferDialogOpen(false);
        setTransferUserList([]);
        setTransferTitle("");
        setTransferType("");

        // Refresh dashboard stats after closing transfer dialog
        // (in case transfers were approved/rejected)
        if (activeFilter === "date") {
            const params = {
                start_date: dateRange[0].format("YYYY-MM-DD"),
                end_date: dateRange[1].format("YYYY-MM-DD")
            };
            api.get("/api/candidatos/dashboard-stats/", { params })
                .then(res => setStatsData(res.data))
                .catch(err => console.error(err));
        } else if (activeFilter === "cycle" && selectedCycle) {
            const params = { cycle_id: selectedCycle.id };
            api.get("/api/candidatos/dashboard-stats/", { params })
                .then(res => setStatsData(res.data))
                .catch(err => console.error(err));
        } else {
            api.get("/api/candidatos/dashboard-stats/")
                .then(res => setStatsData(res.data))
                .catch(err => console.error(err));
        }
    };

    // --- Render one of the small stat‐panels ---
    const renderTable = (title, rows) => {
        const key = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const data = statsData[key] || {};
        return (
            <Paper elevation={3} sx={{ p: 2, minWidth: 250 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {title} <Chip label={data.total || 0} size="small" color="primary" />
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            {rows.map(([label, k], i) => (
                                <TableRow
                                    key={i}
                                    onClick={() => {
                                        const userPksKey = k === 'sinPre' ? 'sinPre' :
                                            k === 'preIncompleta' ? 'preIncompleta' :
                                                k === 'preTerminada' ? 'preTerminada' :

                                                    k === 'porContactar' ? 'porContactar' :
                                                        k === 'conFecha' ? 'conFecha' :
                                                            k === 'entrevistados' ? 'entrevistados' :

                                                                k === 'sis' ? 'sis' :
                                                                    k === 'diagnostica' ? 'diagnostica' :
                                                                        k === 'vida' ? 'vida' :
                                                                            k === 'habilidades' ? 'habilidades' :

                                                                                k === 'desempleados' ? 'desempleados' :
                                                                                    k === 'bolsa' ? 'bolsa' :
                                                                                        k === 'empleados' ? 'empleados' :

                                                                                            k === 'activos' ? 'activos' :
                                                                                                k === 'inactivos' ? 'inactivos' :

                                                                                                    k === 'porCanalizar' ? 'porCanalizar' :
                                                                                                        k === 'desdeOrganizacion' ? 'desdeOrganizacion' :
                                                                                                            k === 'haciaOrganizacion' ? 'haciaOrganizacion' :
                                                                                                                null;
                                        if (userPksKey && typeof data[k] === 'number') {
                                            handleOpenUserListDialog(label, userPksKey);
                                        } else if (typeof data[k] === 'string' && data[k].includes('no encontrado')) {
                                            setErrorMsg(data[k]);
                                            setTimeout(() => setErrorMsg(""), 3000);
                                        }
                                    }}
                                    style={{ cursor: typeof data[k] === 'number' ? 'pointer' : 'default' }}
                                >
                                    <TableCell>{label}</TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold" color="primary">
                                            {data[k] || 0}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        );
    };

    return (
        <Box m="20px">
            {/* Show validation error if any */}
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMsg}
                </Alert>
            )}
            {/* Filter toolbar */}
            <Box display="flex" gap={2} mb={3} alignItems="center">
                <Button
                    variant="contained"
                    startIcon={<GroupsOutlinedIcon />}
                    onClick={handleClearFilters}
                    color={activeFilter === null ? "primary" : "inherit"}
                >
                    {(!isSmallScreen || (activeFilter === null)) && "Ver Todos"}
                </Button>
                <Button
                    variant={getButtonVariant("date")}
                    startIcon={<CalendarTodayIcon />}
                    onClick={handleCalendarClick}
                >
                    {(activeFilter === 'date')
                        ? 'Fechas'
                        : !isSmallScreen && 'Seleccionar Fechas'}
                </Button>
                <Menu
                    anchorEl={calendarAnchorEl}
                    open={Boolean(calendarAnchorEl)}
                    onClose={handleCalendarClose}
                    sx={{ p: 2 }}
                >
                    <Box p={2} display="flex" flexDirection="column" gap={2}>
                        <Typography variant="h5">
                            Seleccionar Fecha de Registro
                        </Typography>
                        <DatePicker
                            label="Fecha Inicio"
                            value={dateRange[0]}
                            onChange={(d) => setDateRange([dayjs(d), dateRange[1]])}
                            renderInput={(params) => <TextField {...params} />}
                        />
                        <DatePicker
                            label="Fecha Fin"
                            value={dateRange[1]}
                            onChange={(d) => setDateRange([dateRange[0], dayjs(d)])}
                            renderInput={(params) => <TextField {...params} />}
                        />
                        <Button
                            variant="contained"
                            onClick={handleApplyDateFilter}
                        >
                            Aplicar filtro
                        </Button>
                    </Box>
                </Menu>

                <Button
                    variant={getButtonVariant("cycle")}
                    startIcon={<FilterListIcon />}
                    onClick={handleCycleClick}
                >
                    {selectedCycle
                        ? selectedCycle.name
                        : !isSmallScreen && "Seleccionar Ciclo"}
                </Button>
                <Menu
                    anchorEl={cycleAnchorEl}
                    open={Boolean(cycleAnchorEl)}
                    onClose={handleCycleClose}
                >
                    <MenuItem onClick={() => handleCycleSelect(null)}>
                        <em>Todos</em>
                    </MenuItem>
                    {dateCycles.map((cy) => (
                        <MenuItem key={cy.id} onClick={() => handleCycleSelect(cy)}>
                            {cy.name} ({cy.start_date} – {cy.end_date})
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {isLoading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* Stats panels */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            {renderTable("Registrados", [
                                ["Sin iniciar preentrevista", "sinPre"],
                                ["Preentrevista incompleta", "preIncompleta"],
                                ["Preentrevista terminada", "preTerminada"],
                            ])}
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            {renderTable("Canalización", [
                                ["Por canalizar", "porCanalizar"],
                                ["Solicitud de canalización saliente", "desdeOrganizacion"],
                                ["Solicitud de canalización entrante", "haciaOrganizacion"],
                            ])}
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            {renderTable("Entrevistas", [
                                ["Sin fecha de entrevista", "porContactar"],
                                ["Con fecha de entrevista", "conFecha"],
                                ["Entrevistados", "entrevistados"],
                            ])}
                        </Grid>
                        <Grid item xs={12}>
                            {renderTable("Capacitación", [
                                ["Por completar - SIS", "sis"],
                                ["Por completar - Evaluación diagnóstica", "diagnostica"],
                                // ["Por completar - Plan personalizado de apoyo", "apoyo"],
                                ["Por completar - Proyecto de vida", "vida"],
                                ["Por completar - Cuadro de habilidades", "habilidades"],
                            ])}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            {renderTable("Agencia", [
                                ["Desempleados", "desempleados"],
                                ["En bolsa de trabajo", "bolsa"],
                                ["Empleados", "empleados"],
                            ])}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            {renderTable("Documentación", [
                                ["Por contactar", "porContactar"],
                                ["En proceso", "enProceso"],
                                ["Pendientes", "pendientes"],
                                ["Terminados", "terminados"],
                            ])}
                        </Grid>
                        <Grid item xs={12}>
                            {renderTable("Candidatos", [
                                ["Activos", "activos"],
                                ["Inactivos", "inactivos"],
                            ])}
                        </Grid>
                    </Grid>

                    {/* Regular User List Dialog */}
                    <UserListDialog
                        open={isUserListDialogOpen}
                        onClose={handleCloseUserListDialog}
                        title={dialogTitle}
                        userList={userList}
                    />

                    {/* Transfer Requests Dialog */}
                    <TransferListDialog
                        open={isTransferDialogOpen}
                        onClose={handleCloseTransferDialog}
                        title={transferTitle}
                        transferType={transferType}
                        userList={transferUserList}
                    />
                </>
            )}

        </Box>
    );
}