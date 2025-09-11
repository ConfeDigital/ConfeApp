import React, { useState, useEffect } from "react";
import axios from "../../api";
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    TextField,
    FormControlLabel,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Divider,
    Tooltip,
    IconButton,
    Link,
    Tabs,
    Tab,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LinkIcon from "@mui/icons-material/Link";
import LaunchIcon from "@mui/icons-material/Launch";
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import useDocumentTitle from "../../hooks/useDocumentTitle";
import NavBar from "../../components/NavBar";

const CombinedAidHistoryReadOnly = () => {
    useDocumentTitle("Mis Apoyos");

    // State for tabs
    const [tabValue, setTabValue] = useState(0);

    // State for General Aid History (Tab 1)
    const [generalEntries, setGeneralEntries] = useState([]);
    const [groupedEntries, setGroupedEntries] = useState({});
    const [mostrarSoloActuales, setMostrarSoloActuales] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [expandedGroup, setExpandedGroup] = useState(null);

    // State for Diagnostic Aid History (Tab 2)
    const [diagnosticHistory, setDiagnosticHistory] = useState([]);
    const [diagnosticSearch, setDiagnosticSearch] = useState("");

    // Common loading state
    const [loading, setLoading] = useState(true);

    dayjs.locale('es');

    const fetchGeneralData = async () => {
        try {
            const res = await axios.get(`/api/candidatos/seguimiento/sis-aid/me/`);
            const latestByAidId = {};

            res.data.forEach((entry) => {
                const aidId =
                    typeof entry.aid === "object" ? entry.aid.id : entry.aid;
                if (!latestByAidId[aidId] || latestByAidId[aidId].id < entry.id) {
                    latestByAidId[aidId] = entry;
                }
            });

            const entriesArray = Object.values(latestByAidId);
            setGeneralEntries(entriesArray);

            // Group entries by section > item > subitem
            const grouped = {};
            entriesArray.forEach((entry) => {
                const seccion = entry.seccion || "Sin Sección";
                const item = entry.item || "Sin Item";
                const subitem = entry.subitem || "Sin Subitem";

                if (!grouped[seccion]) {
                    grouped[seccion] = {};
                }
                if (!grouped[seccion][item]) {
                    grouped[seccion][item] = {};
                }
                if (!grouped[seccion][item][subitem]) {
                    grouped[seccion][item][subitem] = [];
                }

                grouped[seccion][item][subitem].push(entry);
            });

            setGroupedEntries(grouped);
        } catch (err) {
            console.error("❌ Error al cargar datos generales:", err);
            setGeneralEntries([]);
            setGroupedEntries({});
        }
    };

    const fetchDiagnosticData = async () => {
        try {
            const res = await axios.get(`/api/candidatos/historial-apoyos/me`);
            setDiagnosticHistory(res.data);
        } catch (err) {
            console.error("Error al obtener historial diagnóstico:", err);
            setDiagnosticHistory([]);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchGeneralData(),
                    fetchDiagnosticData()
                ]);
            } catch (err) {
                console.error("Error al cargar datos:", err);
            }
            setLoading(false);
        };

        fetchAllData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // General Aid History functions
    const getStatusIcon = (entry) => {
        if (!entry.is_active) {
            return null;
        }

        switch (entry.is_successful) {
            case "funciono":
                return <CheckCircleIcon sx={{ color: "success.main", fontSize: 24, mr: 1 }} />;
            case "no_funciono":
                return <ErrorIcon sx={{ color: "error.main", fontSize: 24, mr: 1 }} />;
            case "intentando":
                return <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 24, mr: 1 }} />;
            default:
                return <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 24, mr: 1 }} />;
        }
    };

    const getStatusText = (entry) => {
        if (!entry.is_active) {
            return "Inactivo";
        }

        switch (entry.is_successful) {
            case "funciono":
                return "Funcionó";
            case "no_funciono":
                return "No funcionó";
            case "intentando":
                return "En prueba";
            default:
                return "En prueba";
        }
    };

    const filterEntries = (entriesArray) => {
        return entriesArray.filter((entry) => {
            const texto = `${entry.aid?.descripcion || ""} ${entry.item || ""} ${entry.subitem || ""}`.toLowerCase();
            const matchesBusqueda = texto.includes(busqueda.toLowerCase());
            const matchesActivos = mostrarSoloActuales ? entry.is_active : true;
            return matchesBusqueda && matchesActivos;
        });
    };

    // Diagnostic Aid History functions
    const getDiagnosticStatusIcon = (status) => {
        switch (status) {
            case "funciono":
                return <CheckCircleIcon sx={{ color: "success.main" }} />;
            case "no_funciono":
                return <ErrorIcon sx={{ color: "error.main" }} />;
            case "intentando":
                return <HourglassEmptyIcon sx={{ color: "warning.main" }} />;
            default:
                return <InfoOutlinedIcon sx={{ color: "info.main" }} />;
        }
    };

    const getDiagnosticStatusText = (status) => {
        switch (status) {
            case "funciono":
                return "Funcionó";
            case "no_funciono":
                return "No funcionó";
            case "intentando":
                return "En prueba";
            default:
                return "Sin estado";
        }
    };

    const getBorderColor = (entry) => {
        if (!entry.is_active) return "grey.400";
        switch (entry.is_successful) {
            case "funciono":
                return "success.main";
            case "no_funciono":
                return "error.main";
            case "intentando":
                return "warning.main";
            default:
                return "info.main";
        }
    };

    const renderImpedimentTooltipContent = (impediments) => {
        return impediments.map((imp, index) => (
            <Box key={index} sx={{ mb: index < impediments.length - 1 ? 2 : 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "inherit" }}>
                    {imp.impediment.name}:
                </Typography>
                <Typography variant="body2" sx={{ color: "inherit" }}>
                    {imp.description}
                </Typography>
            </Box>
        ));
    };

    const filteredDiagnosticHistory = diagnosticHistory.filter((entry) => {
        const text = `${entry.aid?.name || ""}`.toLowerCase();
        return text.includes(diagnosticSearch.toLowerCase());
    });

    const activeDiagnosticAids = filteredDiagnosticHistory.filter(entry => entry.is_active);
    const inactiveDiagnosticAids = filteredDiagnosticHistory.filter(entry => !entry.is_active);

const renderDiagnosticAidCard = (entry) => {
        const impediments = entry.aid?.impediments || [];

        return (
            <Paper
                key={entry.id}
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: "6px solid",
                    borderColor: getBorderColor(entry),
                    opacity: entry.is_active ? 1 : 0.7,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Aid name and main description */}
                    <Box>
                        <Typography fontWeight="bold" variant="h6">
                            {entry.aid?.name || "Apoyo sin nombre"}
                        </Typography>
                        {entry.aid?.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {entry.aid.description}
                            </Typography>
                        )}
                    </Box>

                    {/* Impediment details section, with names and descriptions */}
                    {impediments.length > 0 && (
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold", mb: 0.5 }}>
                                Para:
                            </Typography>
                            {impediments.map((imp, index) => (
                                <Box key={index} sx={{ mb: 1, borderLeft: '3px solid', borderColor: 'divider', pl: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {imp.impediment.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {imp.description}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Aid links */}
                    {entry.aid?.links && entry.aid.links.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                <LinkIcon fontSize="small" />
                                Enlaces relacionados:
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {entry.aid.links.map((link, linkIndex) => (
                                    <Link
                                        key={linkIndex}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            fontSize: "0.875rem",
                                            textDecoration: "none",
                                            "&:hover": { textDecoration: "underline" }
                                        }}
                                    >
                                        Enlace {linkIndex + 1}
                                        <LaunchIcon fontSize="small" />
                                    </Link>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Status and comments */}
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getDiagnosticStatusIcon(entry.is_successful)}
                            <Typography variant="subtitle2">
                                {getDiagnosticStatusText(entry.is_successful)}
                            </Typography>
                            {!entry.is_active && (
                                <Chip label="Inactivo" size="small" color="default" />
                            )}
                        </Box>
                        {entry.comments && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", color: "text.secondary" }}>
                                "{entry.comments}"
                            </Typography>
                        )}
                    </Box>

                    {/* Dates */}
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                            Inicio: {entry.start_date ? dayjs(entry.start_date).format('LL') : "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Fin: {entry.end_date ? dayjs(entry.end_date).format('LL') : "N/A"}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        );
    };

    return (
        <Box sx={{ background: 'linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)', minHeight: "100%" }}>
            <NavBar />
            {loading ? (
                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ m: 3, p: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                        <Tab label="Apoyos Generales" />
                        <Tab label="Apoyos Técnicos" />
                    </Tabs>

                    {/* Tab 1: General Aid History */}
                    {tabValue === 0 && (
                        <Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    alignItems: { xs: "stretch", sm: "center" },
                                    justifyContent: "space-between",
                                    mb: 2,
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    label="Buscar apoyo"
                                    variant="outlined"
                                    fullWidth
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                                {/* <FormControlLabel
                                    control={
                                        <Switch
                                            checked={mostrarSoloActuales}
                                            onChange={() => setMostrarSoloActuales(!mostrarSoloActuales)}
                                        />
                                    }
                                    label="Solo apoyos activos"
                                /> */}
                            </Box>

                            {/* Grouped entries view */}
                            <Box sx={{ mt: 2 }}>
                                {Object.keys(groupedEntries).length === 0 ? (
                                    <Typography variant="body1" color="text.secondary">
                                        No se encontraron apoyos que coincidan con los filtros.
                                    </Typography>
                                ) : (
                                    Object.entries(groupedEntries).map(([seccion, items], seccionIndex) => (
                                        <Accordion
                                            key={seccion}
                                            expanded={expandedGroup === seccionIndex}
                                            onChange={() => setExpandedGroup(expandedGroup === seccionIndex ? null : seccionIndex)}
                                            sx={{
                                                mb: 2,
                                                borderRadius: 2,
                                                boxShadow: 2,
                                            }}
                                        >
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 2 }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" color="primary.main">
                                                            SECCIÓN
                                                        </Typography>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            {seccion}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </AccordionSummary>

                                            <AccordionDetails>
                                                {Object.entries(items).map(([item, subitems]) => (
                                                    <Box key={item} sx={{ mb: 3 }}>
                                                        <Divider textAlign="left" sx={{ mb: 2 }}>
                                                            <Chip
                                                                label={<Typography variant="h6">{item}</Typography>}
                                                                color="primary"
                                                            />
                                                        </Divider>

                                                        {Object.entries(subitems).map(([subitem, subitemEntries]) => (
                                                            <Box key={subitem} sx={{ mb: 2 }}>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    fontWeight="bold"
                                                                    color="text.primary"
                                                                    sx={{ mb: 1, pl: 1 }}
                                                                >
                                                                    {subitem}
                                                                </Typography>

                                                                {filterEntries(subitemEntries).map((entry) => (
                                                                    <Paper
                                                                        key={entry.id}
                                                                        variant="outlined"
                                                                        sx={{
                                                                            p: 2,
                                                                            ml: 2,
                                                                            mb: 1,
                                                                            borderLeft: "4px solid",
                                                                            borderColor: !entry.is_active
                                                                                ? "grey.400"
                                                                                : entry.is_successful === "funciono"
                                                                                    ? "success.main"
                                                                                    : entry.is_successful === "no_funciono"
                                                                                        ? "error.main"
                                                                                        : "warning.main",
                                                                            backgroundColor: !entry.is_active
                                                                                ? "background.default"
                                                                                : "background.paper",
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                                mb: 1,
                                                                            }}
                                                                        >
                                                                            <Typography variant="body1" fontWeight="medium">
                                                                                {entry.aid?.descripcion || "Descripción no disponible"}
                                                                            </Typography>

                                                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                                {getStatusIcon(entry)}
                                                                                <Typography variant="body2" fontWeight="medium">
                                                                                    {getStatusText(entry)}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>

                                                                        {entry.comments && (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                                sx={{ mb: 1, fontStyle: "italic" }}
                                                                            >
                                                                                "{entry.comments}"
                                                                            </Typography>
                                                                        )}

                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                                mt: 1,
                                                                            }}
                                                                        >
                                                                            <Box sx={{ display: "flex", gap: 2 }}>
                                                                                {entry.start_date && (
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        Inicio: {entry.start_date}
                                                                                    </Typography>
                                                                                )}
                                                                                {entry.end_date && (
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        Fin: {entry.end_date}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </Paper>
                                                                ))}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                ))}
                                            </AccordionDetails>
                                        </Accordion>
                                    ))
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Tab 2: Diagnostic Aid History */}
                    {tabValue === 1 && (
                        <Box>
                            <TextField
                                fullWidth
                                label="Buscar apoyo"
                                variant="outlined"
                                value={diagnosticSearch}
                                onChange={(e) => setDiagnosticSearch(e.target.value)}
                                sx={{ mb: 2 }}
                                placeholder="Buscar por nombre o descripción..."
                            />

                            {/* Active Aids */}
                            {activeDiagnosticAids.length === 0 && inactiveDiagnosticAids.length === 0 ? (
                                <Typography color="text.secondary">No hay apoyos asignados aún.</Typography>
                            ) : (
                                <>
                                    {activeDiagnosticAids.length > 0 ? (
                                        <>
                                            {/* <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                                Apoyos Activos
                                                <Chip label={activeDiagnosticAids.length} color="primary" size="small" />
                                            </Typography> */}
                                            {activeDiagnosticAids.map(renderDiagnosticAidCard)}
                                        </>
                                    ) : (
                                        <>
                                        {/* <Typography color="text.secondary" sx={{ mb: 2 }}>
                                            No hay apoyos activos.
                                        </Typography> */}
                                        </>
                                    )}

                                    {/* Inactive Aids Accordion */}
                                    {/* {inactiveDiagnosticAids.length > 0 && (
                                        <Accordion sx={{ mb: 2 }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                    <VisibilityOffIcon sx={{ color: "text.secondary" }} />
                                                    <Typography variant="h6">
                                                        Apoyos Inactivos
                                                    </Typography>
                                                    <Chip
                                                        label={inactiveDiagnosticAids.length}
                                                        color="default"
                                                        size="small"
                                                    />
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                    {inactiveDiagnosticAids.map(renderDiagnosticAidCard)}
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    )} */}
                                </>
                            )}
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default CombinedAidHistoryReadOnly;