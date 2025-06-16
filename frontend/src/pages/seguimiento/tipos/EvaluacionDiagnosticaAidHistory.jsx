import React, { useEffect, useState } from "react";
import {
    Alert,
    Snackbar,
    Box,
    Typography,
    CircularProgress,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    FormLabel,
    Radio,
    RadioGroup,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    FormControlLabel,
    Switch,
    IconButton,
    Tooltip,
    Link,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useParams } from "react-router-dom";
import axios from "../../../api";
import useDocumentTitle from "../../../components/hooks/useDocumentTitle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

const EvaluacionDiagnosticaAidHistory = ({ documentTitle }) => {
    useDocumentTitle(documentTitle);
    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [groupedRecommendations, setGroupedRecommendations] = useState({});
    const [search, setSearch] = useState("");

    const [selectedAid, setSelectedAid] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [editAidDialog, setEditAidDialog] = useState(false);
    const [editingAid, setEditingAid] = useState(null);

    const [alert, setAlert] = useState("");

    const [editAidData, setEditAidData] = useState({
        is_active: true,
        start_date: "",
        end_date: "",
        is_successful: "intentando",
        comments: "",
    });

    dayjs.locale('es');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, groupedRecsRes] = await Promise.all([
                    axios.get(`/api/candidatos/historial-apoyos/?candidate=${uid}`),
                    axios.get(`/api/seguimiento/recomendaciones-apoyos/${uid}/`),
                ]);
                setHistory(historyRes.data);
                setGroupedRecommendations(groupedRecsRes.data);
            } catch (err) {
                console.error("Error al obtener los datos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uid]);

    const handleAssignAid = async (aidData, impedimentDescription) => {
        try {
            const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

            const payload = {
                candidate: uid,
                aid_id: aidData.aid.id,
                description: impedimentDescription || aidData.aid.name,
                comments: "",
                is_successful: "intentando",
                start_date: currentDate,
                end_date: null,
                is_active: true,
            };

            await axios.post("/api/candidatos/historial-apoyos/", payload);
            await refreshData();
        } catch (err) {
            console.error("Error al asignar apoyo:", err);
            // You might want to show an error message to the user here
        }
    };

    const handleEditAid = async () => {
        if (!editingAid) return;

        if (editAidData.end_date != "" && editAidData.start_date > editAidData.end_date) {
            setAlert({ severity: "error", message: "La fecha de fin no puede ser antes a la fecha de inicio" });
            return;
        }

        try {
            const payload = {
                is_active: editAidData.is_active,
                end_date: editAidData.is_active ? null : (editAidData.end_date || null),
                is_successful: editAidData.is_successful,
                comments: editAidData.comments,
            };

            await axios.patch(`/api/candidatos/historial-apoyos/${editingAid.id}/`, payload);

            setEditAidDialog(false);
            setEditingAid(null);
            await refreshData();
        } catch (err) {
            console.error("Error al actualizar apoyo:", err);
            // You might want to show an error message to the user here
        }
    };

    const refreshData = async () => {
        try {
            const [historyRes, groupedRecsRes] = await Promise.all([
                axios.get(`/api/candidatos/historial-apoyos/?candidate=${uid}`),
                axios.get(`/api/seguimiento/recomendaciones-apoyos/${uid}/`),
            ]);
            setHistory(historyRes.data);
            setGroupedRecommendations(groupedRecsRes.data);
        } catch (err) {
            console.error("Error al refrescar datos:", err);
        }
    };

    const handleEditClick = (historyEntry) => {
        setEditingAid(historyEntry);
        setEditAidData({
            is_active: historyEntry.is_active,
            start_date: historyEntry.start_date,
            end_date: historyEntry.end_date || "",
            is_successful: historyEntry.is_successful,
            comments: historyEntry.comments || "",
        });
        setEditAidDialog(true);
    };

    const filteredHistory = history.filter((entry) => {
        const text = `${entry.aid?.name || ""}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // Separate active and inactive aids
    const activeAids = filteredHistory.filter(entry => entry.is_active);
    const inactiveAids = filteredHistory.filter(entry => !entry.is_active);

    const getStatusIcon = (status) => {
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

    const getStatusText = (status) => {
        switch (status) {
            case "funciono":
                return "Le funcionó";
            case "no_funciono":
                return "No le funcionó";
            case "intentando":
                return "En proceso";
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

    const renderAidCard = (entry) => {
        const impediments = entry.aid?.impediments || [];
        const impedimentNames = impediments.map(imp => imp.impediment.name).join(', ');

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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="bold" variant="h6">
                            {entry.aid?.name || "Apoyo sin nombre"}
                        </Typography>

                        {/* Impediment names with tooltip */}
                        {impedimentNames && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: "bold" }}>
                                    Para:
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 0.5 }}>
                                    <Typography variant="body1" color="text.secondary" sx={{ flex: 1 }}>
                                        {impedimentNames}
                                    </Typography>
                                    {impediments.length > 0 && (
                                        <Tooltip
                                            title={
                                                <Box>
                                                    {renderImpedimentTooltipContent(impediments)}
                                                </Box>
                                            }
                                            arrow
                                            placement="left"
                                            slotProps={{
                                                tooltip: {
                                                    sx: {
                                                        fontSize: '0.875rem',
                                                        maxWidth: '400px',
                                                    },
                                                },
                                            }}
                                        >
                                            <IconButton sx={{ mt: -0.5 }}>
                                                <HelpOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Aid links */}
                        {entry.aid?.links && entry.aid.links.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LinkIcon fontSize="small" />
                                    Enlaces relacionados:
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
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

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            {getStatusIcon(entry.is_successful)}
                            <Typography variant="subtitle2">
                                {getStatusText(entry.is_successful)}
                            </Typography>
                            {!entry.is_active && (
                                <Chip label="Inactivo" size="small" color="default" />
                            )}
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Inicio: {entry.start_date ? dayjs(entry.start_date).format('LL') : "N/A"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Fin: {entry.end_date ? dayjs(entry.end_date).format('LL') : "N/A"}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(entry)}
                            title="Editar apoyo"
                        >
                            <EditIcon />
                        </IconButton>
                        {entry.comments && (
                            <Button
                                size="small"
                                startIcon={<InfoOutlinedIcon />}
                                onClick={() => {
                                    setSelectedAid(entry);
                                    setDialogOpen(true);
                                }}
                            >
                                Detalles
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        );
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalRecommendations = Object.values(groupedRecommendations).reduce(
        (total, aids) => total + aids.length,
        0
    );

    return (
        <Box sx={{ p: 2 }}>

            <TextField
                fullWidth
                label="Buscar apoyo"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Buscar por nombre o descripción..."
            />

            {/* Active Aids */}
            {activeAids.length === 0 && inactiveAids.length === 0 ? (
                <Typography color="text.secondary">No hay apoyos asignados aún.</Typography>
            ) : (
                <>
                    {activeAids.length > 0 ? (
                        <>
                            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                Apoyos Activos
                                <Chip label={activeAids.length} color="primary" size="small" />
                            </Typography>
                            {activeAids.map(renderAidCard)}
                        </>
                    ) : (
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            No hay apoyos activos.
                        </Typography>
                    )}

                    {/* Inactive Aids Accordion */}
                    {inactiveAids.length > 0 && (
                        <Accordion sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <VisibilityOffIcon sx={{ color: "text.secondary" }} />
                                    <Typography variant="h6">
                                        Apoyos Inactivos
                                    </Typography>
                                    <Chip
                                        label={inactiveAids.length}
                                        color="default"
                                        size="small"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    {inactiveAids.map(renderAidCard)}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </>
            )}

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography variant="h6">
                    Apoyos Recomendados
                </Typography>
                {totalRecommendations > 0 && (
                    <Chip
                        label={`${totalRecommendations} recomendaciones`}
                        color="primary"
                        size="small"
                    />
                )}
            </Box>

            {Object.keys(groupedRecommendations).length === 0 ? (
                <Typography color="text.secondary">
                    No hay recomendaciones disponibles.
                </Typography>
            ) : (
                Object.entries(groupedRecommendations).map(([impedimentName, aids]) => (
                    <Accordion key={impedimentName} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                    {impedimentName}
                                </Typography>
                                <Chip
                                    label={`${aids.length} ${aids.length === 1 ? 'apoyo' : 'apoyos'}`}
                                    color="secondary"
                                    size="small"
                                />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {aids.map((aidData, index) => (
                                    <Paper
                                        key={`${aidData.aid.id}-${index}`}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            backgroundColor: "background.paper",
                                            border: "1px solid",
                                            borderColor: "neutral.dark"
                                        }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                            <Typography fontWeight="bold" variant="subtitle1">
                                                {aidData.aid.name}
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<AssignmentIcon />}
                                                onClick={() => handleAssignAid(aidData, aidData.description)}
                                            >
                                                Asignar
                                            </Button>
                                        </Box>

                                        {aidData.description && (
                                            <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                                                {aidData.description}
                                            </Typography>
                                        )}

                                        {aidData.aid.links && aidData.aid.links.length > 0 && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                                    <LinkIcon fontSize="small" />
                                                    Enlaces relacionados:
                                                </Typography>
                                                {aidData.aid.links.map((link, linkIndex) => (
                                                    <Button
                                                        key={linkIndex}
                                                        size="small"
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ mr: 1, mb: 0.5 }}
                                                    >
                                                        Enlace {linkIndex + 1}
                                                    </Button>
                                                ))}
                                            </Box>
                                        )}
                                    </Paper>
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}

            {/* Details Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Detalles del Apoyo</DialogTitle>
                <DialogContent dividers>
                    {selectedAid && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                Nombre
                            </Typography>
                            <Typography sx={{ mb: 2 }}>{selectedAid.aid?.name}</Typography>

                            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                Descripción
                            </Typography>
                            <Typography sx={{ mb: 2 }}>{selectedAid.description}</Typography>

                            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                Comentarios
                            </Typography>
                            <Typography>{selectedAid.comments || "Sin comentarios"}</Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Aid Dialog */}
            <Dialog open={editAidDialog} onClose={() => setEditAidDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Editar Apoyo Técnico</DialogTitle>
                <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
                    {editingAid && (
                        <>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                {editingAid.aid?.name}
                            </Typography>
                        </>
                    )}

                    <Box display="flex" justifyContent="space-between">

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editAidData.is_active}
                                    onChange={(e) => {
                                        const isActive = e.target.checked;
                                        setEditAidData({
                                            ...editAidData,
                                            is_active: isActive,
                                            end_date: isActive ? "" : editAidData.end_date // Clear end_date if setting to active
                                        });
                                    }}
                                />
                            }
                            label={editAidData.is_active ? "Activo" : "Inactivo"}
                        />

                        {editAidData.is_successful === "funciono" ? (
                        <CheckCircleIcon sx={{ fontSize: 28, color: "success.main" }} />
                        ) : editAidData.is_successful === "no_funciono" ? (
                        <HighlightOffIcon sx={{ fontSize: 28, color: "error.main" }} />
                        ) : (
                        <HourglassEmptyIcon sx={{ fontSize: 28, color: "warning.main" }} />
                        )}
                    </Box>


                    <FormControl component="fieldset" fullWidth> {/* 'fieldset' semantic role */}
                        <FormLabel component="legend">Estado</FormLabel> {/* Use FormLabel for the group label */}
                        <RadioGroup
                            row // Displays radio buttons in a row; remove for column layout
                            name="aid_status" // Name for the radio group (important for accessibility)
                            value={editAidData.is_successful}
                            onChange={(e) =>
                                setEditAidData({ ...editAidData, is_successful: e.target.value })
                            }
                        >

                            {/* "Le funcionó" (Success color) */}
                            <FormControlLabel
                                value="funciono"
                                control={
                                    <Radio
                                        sx={{
                                            '&.Mui-checked': {
                                                color: "success.main", // Success color from theme
                                            }
                                        }}
                                    />
                                }
                                label="Le funcionó"
                            />

                            {/* "Aún probando" (Warning color) */}
                            <FormControlLabel
                                value="intentando"
                                control={
                                    <Radio
                                        sx={{
                                            '&.Mui-checked': {
                                                color: "warning.main",
                                            },
                                        }}
                                    />
                                }
                                label="Aún probando"
                            />

                            {/* "No le funcionó" (Error color) */}
                            <FormControlLabel
                                value="no_funciono"
                                control={
                                    <Radio
                                        sx={{
                                            '&.Mui-checked': {
                                                color: "error.main", // Error color from theme
                                            }
                                        }}
                                    />
                                }
                                label="No le funcionó"
                            />
                        </RadioGroup>
                    </FormControl>

                    {!editAidData.is_active && (
                        <DatePicker
                            label="Fecha de fin"
                            value={editAidData.end_date ? dayjs(editAidData.end_date) : null}
                            onChange={(newValue) =>
                                setEditAidData({
                                    ...editAidData,
                                    end_date: newValue ? newValue.format('YYYY-MM-DD') : ''
                                })
                            }
                            slotProps={{
                                textField: {
                                    helperText: "Fecha en que terminó de utilizarse el apoyo"
                                }
                            }}
                        />
                    )}

                    <TextField
                        label="Comentarios"
                        multiline
                        rows={3}
                        value={editAidData.comments}
                        onChange={(e) => setEditAidData({ ...editAidData, comments: e.target.value })}
                        placeholder="Comentarios sobre el progreso o resultado..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditAidDialog(false)} color='secondary'>Cancelar</Button>
                    <Button variant="contained" onClick={handleEditAid}>
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={!!alert}
                autoHideDuration={6000}
                onClose={() => setAlert('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={alert.severity} sx={{ mt: 2 }} onClose={() => setAlert('')}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EvaluacionDiagnosticaAidHistory;