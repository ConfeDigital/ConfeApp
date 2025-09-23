import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Menu,
    MenuItem,
    Divider,
    Chip,
    TextField,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    CircularProgress,
    Tabs,
    Tab,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useMediaQuery } from "@mui/material";
import {
    PieChart,
    BarChart,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Pie,
    Cell,
    Bar,
    Line,
} from "recharts";
import {
    PieChart as MuiPieChart,
    BarChart as MuiBarChart,
    LineChart as MuiLineChart,
} from "@mui/x-charts";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BusinessIcon from "@mui/icons-material/Business";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import api from "../../api";
import dayjs from "dayjs";
import * as Yup from "yup";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const dateFilterSchema = Yup.object({
    start_date: Yup.date().required("Fecha inicio requerida"),
    end_date: Yup.date()
        .required("Fecha fin requerida")
        .min(Yup.ref("start_date"), "La fecha de fin debe ser mayor o igual a la fecha de inicio"),
});

// Color palette for charts
const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00",
    "#ff00ff", "#00ffff", "#ffff00", "#ff0000", "#0000ff"
];

const STAGES = [
    { code: "Reg", label: "Registro" },
    { code: "Pre", label: "Preentrevista" },
    { code: "Can", label: "Canalización" },
    { code: "Ent", label: "Entrevista" },
    { code: "Cap", label: "Capacitación" },
    { code: "Agn", label: "Agencia" },
];

const AGENCY_STATES = [
    { code: "Bol", label: "Bolsa de Trabajo" },
    { code: "Emp", label: "Empleado" },
    { code: "Des", label: "Desempleado" },
];

const GENDER = [
    { code: "M", label: "Masculino" },
    { code: "F", label: "Femenino" },
    { code: "O", label: "Otro" },
];

export default function Statistics() {
    useDocumentTitle("Estadísticas");
    const isSmallScreen = useMediaQuery("(max-width:600px)");

    const [dateRange, setDateRange] = useState([
        dayjs().subtract(6, "month"),
        dayjs(),
    ]);

    const [selectedCenter, setSelectedCenter] = useState(null);
    const [centers, setCenters] = useState([]);
    const [canViewAllCenters, setCanViewAllCenters] = useState(false);

    const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
    const [centerAnchorEl, setCenterAnchorEl] = useState(null);

    const [errorMsg, setErrorMsg] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [statsData, setStatsData] = useState({});
    const [activeTab, setActiveTab] = useState(0);

    // Fetch centers and cycles on component mount
    useEffect(() => {
        const fetchCenters = async () => {
            try {
                const response = await api.get("/api/candidatos/centers-list/");
                setCenters(response.data.centers);
                setCanViewAllCenters(response.data.can_view_all);
                
                // Set default center if user can't view all
                if (!response.data.can_view_all && response.data.centers.length > 0) {
                    setSelectedCenter(response.data.centers[0]);
                }
            } catch (error) {
                console.error("Error fetching centers:", error);
                setErrorMsg("Error al cargar la lista de centros.");
                setSnackbarOpen(true);
            }
        };

        fetchCenters();
    }, []);


    // Fetch statistics data
    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const params = {};
            
            if (dateRange[0] && dateRange[1]) {
                params.start_date = dateRange[0].format("YYYY-MM-DD");
                params.end_date = dateRange[1].format("YYYY-MM-DD");
            }
            
            if (selectedCenter) {
                params.center_id = selectedCenter.id;
            } else if (canViewAllCenters) {
                params.center_id = "all";
            }
            

            try {
                const response = await api.get("/api/candidatos/statistics/", { params });
                setStatsData(response.data);
            } catch (error) {
                console.error("Error fetching statistics:", error);
                setErrorMsg("Error al cargar las estadísticas.");
                setSnackbarOpen(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [dateRange, selectedCenter, canViewAllCenters]);

    // Handlers for menus & filters
    const handleCalendarClick = (e) => setCalendarAnchorEl(e.currentTarget);
    const handleCalendarClose = () => setCalendarAnchorEl(null);

    const handleCenterClick = (e) => setCenterAnchorEl(e.currentTarget);
    const handleCenterClose = () => setCenterAnchorEl(null);
    const handleCenterSelect = (center) => {
        setSelectedCenter(center);
        handleCenterClose();
        setErrorMsg("");
        setSnackbarOpen(false);
    };


    const handleClearFilters = () => {
        setSelectedCenter(canViewAllCenters ? null : (centers.length > 0 ? centers[0] : null));
        setDateRange([dayjs().subtract(6, "month"), dayjs()]);
        setErrorMsg("");
        setSnackbarOpen(false);
    };

    const handleApplyDateFilter = async () => {
        try {
            await dateFilterSchema.validate(
                { start_date: dateRange[0], end_date: dateRange[1] },
                { abortEarly: false }
            );
            setErrorMsg("");
            setSnackbarOpen(false);
            handleCalendarClose();
        } catch (validationError) {
            setErrorMsg(validationError.errors.join(". "));
            setSnackbarOpen(true);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Chart data preparation functions
    const prepareStageData = () => {
        if (!statsData.stages) return [];
        return Object.entries(statsData.stages).map(([stage, data]) => ({
            name: STAGES.find((s) => s.code === stage)?.label || stage,
            value: data.count,
            percentage: data.percentage
        }));
    };

    const prepareGenderData = () => {
        if (!statsData.demographics?.gender) return [];
        return Object.entries(statsData.demographics.gender).map(([gender, count]) => ({
            name: GENDER.find((g) => g.code === gender)?.label || gender,
            value: count
        }));
    };

    const prepareAgeGroupData = () => {
        if (!statsData.demographics?.age_groups) return [];
        return Object.entries(statsData.demographics.age_groups).map(([ageGroup, count]) => ({
            name: ageGroup,
            value: count
        }));
    };

    const prepareDisabilityData = () => {
        if (!statsData.disabilities?.common_disabilities) return [];
        return Object.entries(statsData.disabilities.common_disabilities).map(([disability, count]) => ({
            name: disability,
            value: count
        }));
    };

    const prepareDisabilityGroupData = () => {
        if (!statsData.disabilities?.disability_groups) return [];
        return Object.entries(statsData.disabilities.disability_groups).map(([group, count]) => ({
            name: group,
            value: count
        }));
    };

    const prepareEmploymentData = () => {
        if (!statsData.employment?.agency_states) return [];
        return Object.entries(statsData.employment.agency_states).map(([state, count]) => ({
            name: AGENCY_STATES.find((s) => s.code === state)?.label || state,
            value: count
        }));
    };

    const prepareTimelineData = () => {
        if (!statsData.timeline?.monthly_registrations) return [];
        return statsData.timeline.monthly_registrations.map(item => ({
            month: item.month,
            registrations: item.count
        }));
    };

    const prepareTrainingData = () => {
        if (!statsData.training) return [];
        return Object.entries(statsData.training).map(([training, data]) => ({
            name: training,
            completed: data.completed,
            total: data.total,
            completion_rate: data.completion_rate
        }));
    };

    const prepareDomicileData = () => {
        if (!statsData.domicile?.states) return [];
        return Object.entries(statsData.domicile.states).map(([state, count]) => ({
            name: state,
            value: count
        }));
    };

    const prepareCityData = () => {
        if (!statsData.domicile?.cities) return [];
        return Object.entries(statsData.domicile.cities).map(([city, count]) => ({
            name: city,
            value: count
        }));
    };

    // Render overview cards
    const renderOverviewCards = () => {
        if (!statsData.overview) return null;

        const { overview } = statsData;
        const cards = [
            {
                title: "Total Candidatos",
                value: overview.total_candidates,
                icon: <PeopleIcon />,
                color: "#1976d2"
            },
            {
                title: "Candidatos Activos",
                value: overview.active_candidates,
                icon: <TrendingUpIcon />,
                color: "#388e3c"
            },
            {
                title: "Registros Este Mes",
                value: overview.current_month_registrations,
                icon: <CalendarTodayIcon />,
                color: "#f57c00"
            },
            {
                title: "Crecimiento",
                value: `${overview.registration_growth}%`,
                icon: <AssessmentIcon />,
                color: overview.registration_growth >= 0 ? "#388e3c" : "#d32f2f"
            }
        ];

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="h6">
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h4" component="div" sx={{ color: card.color }}>
                                            {card.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: card.color, fontSize: 40 }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // Render charts
    const renderCharts = () => {
        if (isLoading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            );
        }

        return (
            <Box>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="Distribución por Etapas" />
                    <Tab label="Demografía" />
                    <Tab label="Ubicación" />
                    <Tab label="Discapacidades" />
                    <Tab label="Empleo" />
                    <Tab label="Capacitación" />
                    <Tab label="Tendencias" />
                </Tabs>

                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Etapas
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={prepareStageData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {prepareStageData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Registros por Mes
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareTimelineData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="registrations" name="Registros" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Género
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={prepareGenderData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {prepareGenderData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Edad
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareAgeGroupData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Cantidad" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 2 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Estado
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareDomicileData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Cantidad" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Ciudad
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareCityData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Cantidad" fill="#ffc658" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 3 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Discapacidades Más Comunes
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareDisabilityData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Cantidad" fill="#ffc658" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Grupos de Discapacidad
                                </Typography>
                                {prepareDisabilityGroupData().length > 0 && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={prepareDisabilityGroupData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {prepareDisabilityGroupData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 4 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Estado de Agencia
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={prepareEmploymentData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {prepareEmploymentData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Trabajos Más Comunes
                                </Typography>
                                {statsData.employment?.top_jobs && (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={Object.entries(statsData.employment.top_jobs).map(([name, value]) => ({ name, value }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" name="Cantidad" fill="#ff7300" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 5 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Tasa de Completación de Capacitaciones
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={prepareTrainingData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="completion_rate" fill="#00ff00" name="Tasa de Completación" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 6 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Tendencias de Registro Mensual
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={prepareTimelineData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="registrations" name="Registros" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Box>
        );
    };

    return (
        <Box m={2}>
            {/* Show validation error if any */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="error"
                    sx={{ mb: 2, width: '100%' }}
                >
                    {errorMsg}
                </Alert>
            </Snackbar>
            
            {/* Filter toolbar */}
            <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
                <Button
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={handleClearFilters}
                    color="primary"
                >
                    {(!isSmallScreen || true) && "Limpiar Filtros"}
                </Button>

                {canViewAllCenters && (
                    <Button
                        variant={selectedCenter ? "outlined" : "contained"}
                        startIcon={<BusinessIcon />}
                        onClick={handleCenterClick}
                    >
                        {selectedCenter
                            ? selectedCenter.name
                            : !isSmallScreen && "Todos los Centros"}
                    </Button>
                )}
                <Menu
                    anchorEl={centerAnchorEl}
                    open={Boolean(centerAnchorEl)}
                    onClose={handleCenterClose}
                >
                    <MenuItem onClick={() => handleCenterSelect(null)}>
                        <em>Todos los Centros</em>
                    </MenuItem>
                    {centers.map((center) => (
                        <MenuItem key={center.id} onClick={() => handleCenterSelect(center)}>
                            {center.name}
                        </MenuItem>
                    ))}
                </Menu>


                <Button
                    variant="outlined"
                    startIcon={<CalendarTodayIcon />}
                    onClick={handleCalendarClick}
                >
                    {(dateRange[0] && dateRange[1])
                        ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`
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
                            Seleccionar Rango de Fechas
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
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Overview Cards */}
            {renderOverviewCards()}

            {/* Charts */}
            {renderCharts()}
        </Box>
    );
}
