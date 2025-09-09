// src/pages/JobCandidatesPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api'; // Assuming your axios instance is configured
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    Backdrop,
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    useTheme,
    Divider,
    IconButton,
    Tooltip,
    Grid,
    Card,
    CardContent,
    Chip,
    Avatar,
    Stack,
    TextField,
    Autocomplete,
    InputAdornment
} from '@mui/material';
import Header from '../../components/Header';
import useDocumentTitle from "../../hooks/useDocumentTitle";
import PersonIcon from '@mui/icons-material/Person'; // Icon for candidate
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // For 'info' type
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'; // For 'success' type
import WarningOutlinedIcon from '@mui/icons-material/WarningOutlined'; // For 'warning' type
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'; // For 'error' type
import AddCommentIcon from '@mui/icons-material/AddComment'; // For adding comments
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // For expanding comments
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // For collapsing comments
import EditIcon from '@mui/icons-material/Edit'; // Icon for editing job
import SaveIcon from '@mui/icons-material/Save'; // Icon for saving
import CancelIcon from '@mui/icons-material/Cancel'; // Icon for canceling
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SkillIcon from '@mui/icons-material/Psychology';
import MapIcon from '@mui/icons-material/Map';

// Assuming you have these models for comments
import { Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import *as Yup from 'yup';
import MapModal from '../../components/MapModal'; // adjust path if needed

// Inline editing for job details

dayjs.locale('es');

// Mapping for comment types to their Spanish display names
const commentTypeDisplayNames = {
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error',
};

// Mapping for skill importance levels
const importanceColors = {
    esencial: '#d32f2f',
    importante: '#f57c00',
    deseable: '#388e3c'
};

const importanceLabels = {
    esencial: 'Esencial',
    importante: 'Importante',
    deseable: 'Deseable'
};

const JobCandidatesPage = () => {
    useDocumentTitle('Candidatos Asignados al Empleo');
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { jobId } = useParams(); // Get the job ID from the URL

    const [jobData, setJobData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alert, setAlert] = useState(null); // Changed to null for clearer state management

    // Comment dialog state (similar to CandidateJobHistoryPage)
    const [openCommentDialog, setOpenCommentDialog] = useState(false);
    const [jobHistoryForComment, setJobHistoryForComment] = useState(null); // The JobHistory entry to comment on
    const [commentFormData, setCommentFormData] = useState({ comment_text: '', type: 'info' });
    const [commentErrorMsg, setCommentErrorMsg] = useState('');

    // State to manage visibility of comments for each candidate
    const [showComments, setShowComments] = useState({});

    // States for inline job editing
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState({});
    const [habilidades, setHabilidades] = useState([]);
    const [selectedHabilidades, setSelectedHabilidades] = useState([]);
    const [saving, setSaving] = useState(false);

    const [mapOpen, setMapOpen] = useState(false);

    // Backend endpoint for job with assigned candidates
    const jobAssignedCandidatesURL = `/api/agencia/jobs/${jobId}/assigned-candidates/`;
    // Backend endpoint for JobHistory comments (reusing from previous page)
    const commentsURL = `/api/candidatos/employment/comments/`;
    // Backend endpoint for JobHistory (to fetch it for commenting)
    const jobHistoryURL = `/api/candidatos/historial-empleos/`;
    // Backend endpoint for habilidades
    const habilidadesURL = "/api/agencia/habilidades/";


    const commentSchema = Yup.object({
        comment_text: Yup.string().required('La observación no puede estar vacía').max(1000, 'La observación es demasiado larga'),
        type: Yup.string().oneOf(['info', 'success', 'warning', 'error']).required('Debe seleccionar un tipo de observación'),
    });

    /**
     * Returns the appropriate icon and color for a given comment type.
     * @param {string} type - The type of comment (info, success, warning, error).
     * @returns {object} An object containing the icon component and its color.
     */
    const getCommentIconAndColor = (type) => {
        switch (type) {
            case 'success': return { icon: <CheckCircleOutlinedIcon fontSize="small" />, color: theme.palette.success.main };
            case 'warning': return { icon: <WarningOutlinedIcon fontSize="small" />, color: theme.palette.warning.main };
            case 'error': return { icon: <ErrorOutlineOutlinedIcon fontSize="small" />, color: theme.palette.error.main };
            case 'info':
            default: return { icon: <InfoOutlinedIcon fontSize="small" />, color: theme.palette.info.main };
        }
    };

    /**
     * Fetches the job data including assigned candidates and habilidades.
     */
    const fetchJobData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [jobRes, habilidadesRes] = await Promise.all([
                axios.get(jobAssignedCandidatesURL),
                axios.get(habilidadesURL),
            ]);
            setJobData(jobRes.data);
            setHabilidades(habilidadesRes.data);

            // Set selected habilidades for editing
            if (jobRes.data.habilidades_requeridas) {
                console.log('Habilidades requeridas from backend:', jobRes.data.habilidades_requeridas);
                console.log('Available habilidades:', habilidadesRes.data);

                const mappedHabilidades = jobRes.data.habilidades_requeridas.map(h => {
                    // Find the matching habilidad from the available options
                    const matchingHabilidad = habilidadesRes.data.find(hab => hab.id === h.habilidad);
                    return matchingHabilidad || {
                        id: h.habilidad,
                        nombre: h.habilidad_nombre,
                        categoria: h.habilidad_categoria
                    };
                });

                console.log('Mapped habilidades for selection:', mappedHabilidades);
                setSelectedHabilidades(mappedHabilidades);
            }
        } catch (err) {
            console.error("Error fetching job data or habilidades:", err);
            setError("No se pudo cargar la información del empleo o las habilidades.");
        } finally {
            setLoading(false);
        }
    };

    // Effect hook to fetch job data when jobId changes
    useEffect(() => {
        if (jobId) {
            fetchJobData();
        }
    }, [jobId]);

    /**
     * Opens the add comment dialog for a specific candidate.
     * It fetches the relevant job history entry for the current job and candidate.
     * @param {number} candidateId - The ID of the candidate to add a comment for.
     */
    const openAddCommentDialog = async (candidateId) => {
        try {
            const response = await axios.get(`${jobHistoryURL}?candidate=${candidateId}`);
            const jobHistories = response.data;
            // Find the job history entry that matches the current job and has no end date (current assignment)
            const currentJobHistory = jobHistories.find(
                h => !h.end_date && h.job.id === parseInt(jobId)
            );

            if (currentJobHistory) {
                setJobHistoryForComment(currentJobHistory);
                setCommentFormData({ comment_text: '', type: 'info' });
                setCommentErrorMsg('');
                setOpenCommentDialog(true);
            } else {
                setError("No se encontró el historial de empleo actual para este candidato y empleo.");
            }
        } catch (err) {
            console.error("Error fetching job history for comment:", err);
            setError("Error al preparar el formulario de observación.");
        }
    };

    /**
     * Handles changes in the comment form fields.
     * @param {object} e - The event object from the input change.
     */
    const handleCommentFormChange = e => {
        const { name, value } = e.target;
        setCommentFormData(f => ({ ...f, [name]: value }));
    };

    /**
     * Submits the new comment to the backend.
     * Validates the form data before sending.
     */
    const submitCommentForm = async () => {
        try {
            await commentSchema.validate(commentFormData, { abortEarly: false });
        } catch (err) {
            setCommentErrorMsg(err.errors.map(e => e).join('. ')); // Ensure errors are joined correctly
            return;
        }

        try {
            // Post comment to the specific JobHistory entry identified
            await axios.post(`${commentsURL}${jobHistoryForComment.id}/`, commentFormData);
            // Re-fetch all data to ensure comments are updated
            fetchJobData();
            setOpenCommentDialog(false);
            setAlert({ severity: "success", message: "Observación añadida correctamente." });
            // Clear the alert after 3 seconds
            setTimeout(() => setAlert(null), 3000);
        } catch (e) {
            console.error(e);
            const errorMessage = e.response?.data?.comment_text?.[0] || e.response?.data?.non_field_errors?.[0] || 'Error al añadir observación';
            setCommentErrorMsg(errorMessage);
        }
    };

    /**
     * Toggles the visibility of comments for a specific candidate.
     * @param {number} candidateId - The ID of the candidate whose comments to toggle.
     */
    const toggleComments = (candidateId) => {
        setShowComments(prev => ({
            ...prev,
            [candidateId]: !prev[candidateId]
        }));
    };

    /**
     * Starts inline editing mode for the job.
     */
    const handleJobEdit = () => {
        setIsEditing(true);
        setEditedJob({
            name: jobData.name || '',
            job_description: jobData.job_description || '',
            vacancies: jobData.vacancies || 0,
            horario: jobData.horario || '',
            sueldo_base: jobData.sueldo_base || '',
            prestaciones: jobData.prestaciones || ''
        });
    };

    /**
     * Cancels inline editing and resets form.
     */
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedJob({});
        // Reset selected habilidades to original
        if (jobData.habilidades_requeridas) {
            const mappedHabilidades = jobData.habilidades_requeridas.map(h => {
                // Find the matching habilidad from the available options
                const matchingHabilidad = habilidades.find(hab => hab.id === h.habilidad);
                return matchingHabilidad || {
                    id: h.habilidad,
                    nombre: h.habilidad_nombre,
                    categoria: h.habilidad_categoria
                };
            });
            setSelectedHabilidades(mappedHabilidades);
        }
    };

    /**
     * Saves the edited job data.
     */
    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const payload = {
                name: editedJob.name.trim(),
                job_description: editedJob.job_description.trim(),
                vacancies: parseInt(editedJob.vacancies) || 0,
                horario: editedJob.horario?.trim() || '',
                sueldo_base: editedJob.sueldo_base ? parseFloat(editedJob.sueldo_base) : null,
                prestaciones: editedJob.prestaciones?.trim() || '',
                habilidades_ids: selectedHabilidades.map(h => h.id),
            };

            await axios.put(`/api/agencia/jobs/${jobId}/`, payload);

            setAlert({ severity: "success", message: "Empleo actualizado correctamente." });
            setTimeout(() => setAlert(null), 3000);

            setIsEditing(false);
            fetchJobData(); // Refresh data
        } catch (error) {
            console.error("Error updating job:", error);
            const errorMessage = error.response?.data?.detail || 'Error al actualizar el empleo.';
            setAlert({ severity: "error", message: errorMessage });
            setTimeout(() => setAlert(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handles changes in the edit form fields.
     */
    const handleEditChange = (field, value) => {
        setEditedJob(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDownload = async (candidate) => {
        setDownloadLoading(true);
        try {
            const downloadResponse = await axios.get(
                `/api/reports/download/${candidate.id}/habilidades/`,
                {
                    responseType: "blob",
                }
            );

            // Determina el tipo MIME y extensión correctos
            const fileType = { mime: "application/pdf", ext: "pdf" };

            const { mime, ext } = fileType || {
                mime: "application/octet-stream",
                ext: "bin",
            };

            const blob = new Blob([downloadResponse.data], { type: mime });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Habilidades-${candidate.full_name}.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Download failed:", error);
        }
        setDownloadLoading(false);
    };

    // Format salary function
    const formatSalary = (salary) => {
        if (!salary) return null;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(salary);
    };

    // Button to navigate back to the jobs page
    const actionBtn = (
        <Button
            variant="outlined"
            onClick={() => {
                if (location.pathname === `/empleador/empleo/${jobId}`) {
                    navigate('/empleador');
                } else {
                    navigate('/agencia-laboral/administracion');
                }
                console.log(location.pathname)
            }
            }>
            Volver a Empleos
        </Button>
    );

    // Render loading state
    if (loading) {
        return (
            <Box p={2}>
                <Header subtitle="Cargando Empleo..." actionButton={actionBtn} />
                <CircularProgress />
            </Box>
        );
    }

    // Render error state
    if (error) {
        return (
            <Box p={2}>
                <Header subtitle="Error" actionButton={actionBtn} />
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Render no job data found state
    if (!jobData) {
        return (
            <Box p={2}>
                <Header subtitle="Empleo No Encontrado" actionButton={actionBtn} />
                <Alert severity="info">El empleo solicitado no existe o no tiene permiso para verlo.</Alert>
            </Box>
        );
    }

    return (
        <Box p={2}>
            {/* Display general success/error alerts */}
            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Header actionButton={actionBtn} />

            {/* Enhanced Job Details Section */}
            <Card
                elevation={3}
                sx={{
                    mb: 4,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}05 100%)`,
                    border: `1px solid ${theme.palette.primary.main}20`
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    {/* Header with Company Info and Edit Button */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Box display="flex" alignItems="center" gap={2} flex={1} mr={2}>
                            {/* Company Logo */}
                            <Avatar
                                src={jobData.company_logo}
                                sx={{
                                    width: 64,
                                    height: 64,
                                    border: `2px solid ${theme.palette.primary.main}30`
                                }}
                            >
                                <BusinessIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Box flex={1}>
                                {isEditing ? (
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={editedJob.name}
                                        onChange={(e) => handleEditChange('name', e.target.value)}
                                        sx={{ mb: 1 }}
                                        inputProps={{ style: { fontSize: '2rem', fontWeight: 'bold' } }}
                                    />
                                ) : (
                                    <Typography variant="h4" fontWeight="bold" color="primary">
                                        {jobData.name}
                                    </Typography>
                                )}
                                <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BusinessIcon fontSize="small" />
                                    {jobData.company_name}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Edit/Save/Cancel Buttons */}
                        <Box display="flex" gap={1}>
                            {isEditing ? (
                                <>
                                    <Tooltip title="Guardar Cambios">
                                        <IconButton
                                            color="success"
                                            onClick={handleSaveEdit}
                                            disabled={saving}
                                            sx={{
                                                backgroundColor: theme.palette.success.main + '10',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.success.main + '20'
                                                }
                                            }}
                                        >
                                            <SaveIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancelar">
                                        <IconButton
                                            color="error"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                            sx={{
                                                backgroundColor: theme.palette.error.main + '10',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.error.main + '20'
                                                }
                                            }}
                                        >
                                            <CancelIcon />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            ) : (
                                <Tooltip title="Editar Empleo">
                                    <IconButton
                                        color="primary"
                                        onClick={handleJobEdit}
                                        sx={{
                                            backgroundColor: theme.palette.primary.main + '10',
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.main + '20'
                                            }
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Job Details Grid */}
                    <Grid container spacing={3}>
                        {/* Job Description */}
                        <Grid item xs={12}>
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.background.default,
                                    border: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WorkIcon color="primary" />
                                    Descripción del Puesto
                                </Typography>
                                {isEditing ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        variant="outlined"
                                        value={editedJob.job_description}
                                        onChange={(e) => handleEditChange('job_description', e.target.value)}
                                        placeholder="Descripción del puesto"
                                    />
                                ) : (
                                    <Typography variant="body1" color="text.secondary">
                                        {jobData.job_description || 'No hay descripción disponible'}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        {/* Key Information Cards */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon color="primary" />
                                    Ubicación
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        {jobData.location_details
                                            ? `${jobData.location_details.address_road} ${jobData.location_details.address_number || ''}, ${jobData.location_details.address_col || ''}, ${jobData.location_details.address_municip || ''}, ${jobData.location_details.address_city || ''}`
                                            : 'Ubicación no especificada'}
                                    </Typography>
                                    {jobData.location_details?.address_lat && jobData.location_details?.address_lng && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setMapOpen(true)}
                                            endIcon={<MapIcon />}
                                        >
                                            Ver Mapa
                                        </Button>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PeopleIcon color="primary" />
                                    Vacantes Disponibles
                                </Typography>
                                {isEditing ? (
                                    <TextField
                                        type="number"
                                        variant="outlined"
                                        value={editedJob.vacancies}
                                        onChange={(e) => handleEditChange('vacancies', e.target.value)}
                                        inputProps={{ min: 0, max: 999 }}
                                        sx={{ width: '120px' }}
                                    />
                                ) : (
                                    <Typography variant="h4" color="primary" fontWeight="bold">
                                        {jobData.vacancies || 'Indefinido'}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        {/* Additional Job Information */}
                        {(jobData.horario || isEditing) && (
                            <Grid item xs={12} md={6}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTimeIcon color="primary" />
                                        Horario
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            value={editedJob.horario}
                                            onChange={(e) => handleEditChange('horario', e.target.value)}
                                            placeholder="Ej: Lunes a Viernes 8:00-17:00"
                                        />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {jobData.horario}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        )}

                        {(jobData.sueldo_base || isEditing) && (
                            <Grid item xs={12} md={6}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AttachMoneyIcon color="primary" />
                                        Sueldo Base (Mensual MXN)
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            type="number"
                                            variant="outlined"
                                            value={editedJob.sueldo_base}
                                            onChange={(e) => handleEditChange('sueldo_base', e.target.value)}
                                            placeholder="15000"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AttachMoneyIcon />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ width: '200px' }}
                                        />
                                    ) : (
                                        <Typography variant="h5" color="success.main" fontWeight="bold">
                                            {formatSalary(jobData.sueldo_base)}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        )}

                        {/* Benefits */}
                        {(jobData.prestaciones || isEditing) && (
                            <Grid item xs={12}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CardGiftcardIcon color="primary" />
                                        Prestaciones
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            variant="outlined"
                                            value={editedJob.prestaciones}
                                            onChange={(e) => handleEditChange('prestaciones', e.target.value)}
                                            placeholder="Ej: Seguro médico, vales de despensa, bonos de productividad"
                                        />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {jobData.prestaciones}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        )}

                        {/* Required Skills */}
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SkillIcon color="primary" />
                                    Habilidades Requeridas
                                </Typography>
                                {isEditing ? (
                                    <Autocomplete
                                        multiple
                                        options={habilidades}
                                        getOptionLabel={(option) => `${option.nombre} (${option.categoria})`}
                                        value={selectedHabilidades}
                                        onChange={(event, newValue) => {
                                            console.log('Autocomplete onChange:', newValue);
                                            setSelectedHabilidades(newValue);
                                        }}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
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
                                                placeholder="Buscar y seleccionar habilidades requeridas"
                                                variant="outlined"
                                            />
                                        )}
                                    />
                                ) : (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {jobData.habilidades_requeridas && jobData.habilidades_requeridas.length > 0 ? (
                                            jobData.habilidades_requeridas.map((habilidad, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`${habilidad.nombre} - ${importanceLabels[habilidad.nivel_importancia] || habilidad.nivel_importancia}`}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        borderColor: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                                                        color: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                                                        mb: 1
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No hay habilidades específicas requeridas
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Candidates Section */}
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <PersonIcon color="primary" />
                Candidatos Asignados Actualmente ({jobData.assigned_candidates.length})
            </Typography>

            {jobData.assigned_candidates.length === 0 ? (
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <PersonIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                    <Typography color="text.secondary" variant="h6">
                        No hay candidatos actualmente asignados a este empleo.
                    </Typography>
                </Paper>
            ) : (
                <List>
                    {jobData.assigned_candidates.map(candidate => (
                        <Paper key={candidate.id} sx={{ mb: 2, p: 2, borderLeft: `4px solid ${theme.palette.primary.main}`, borderRadius: '8px' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">
                                    <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    {candidate.full_name}
                                </Typography>
                                <Box>
                                    <Tooltip title="Decargar Cuado de Habilidades del Candidato">
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleDownload(candidate)}
                                        >
                                            <PictureAsPdfIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Añadir Observación al Candidato">
                                        <IconButton
                                            color="primary"
                                            onClick={() => openAddCommentDialog(candidate.id)}
                                        >
                                            <AddCommentIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {/* Toggle button for comments */}
                                    {candidate.current_job_history_comments && candidate.current_job_history_comments.length > 0 && (
                                        <Tooltip title={showComments[candidate.id] ? "Ocultar Observaciones" : "Ver Observaciones"}>
                                            <IconButton onClick={() => toggleComments(candidate.id)}>
                                                {showComments[candidate.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {candidate.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Estado: {candidate.agency_state === 'Emp' ? 'Empleando' : candidate.agency_state}
                            </Typography>

                            {/* Display comments if showComments is true for this candidate */}
                            {showComments[candidate.id] && candidate.current_job_history_comments && candidate.current_job_history_comments.length > 0 && (
                                <Box sx={{ mt: 2, borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Observaciones:</Typography>
                                    {candidate.current_job_history_comments
                                        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at))) // Sort by most recent
                                        .map(comment => {
                                            const { icon, color } = getCommentIconAndColor(comment.type);
                                            return (
                                                <Box key={comment.id} display="flex" alignItems="center" gap={1} sx={{ pl: 1, borderLeft: `3px solid ${color}`, mb: 0.5 }}>
                                                    <Tooltip title={commentTypeDisplayNames[comment.type] || comment.type}>
                                                        <span style={{ color: color }}>{icon}</span>
                                                    </Tooltip>
                                                    <Typography variant="body2">
                                                        {comment.comment_text}
                                                        <br />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Por {comment.author_name || 'Desconocido'} el {dayjs(comment.created_at).format('LLL')}
                                                        </Typography>
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                </Box>
                            )}
                            {/* If no comments and comments are shown, display a message */}
                            {showComments[candidate.id] && (!candidate.current_job_history_comments || candidate.current_job_history_comments.length === 0) && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    No hay observaciones para este candidato en este empleo.
                                </Typography>
                            )}
                        </Paper>
                    ))}
                </List>
            )}

            {/* New Comment Add Dialog (reused from CandidateJobHistoryPage) */}
            <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Añadir Observación a Historial de {jobHistoryForComment?.candidate_name}</DialogTitle>
                <DialogContent>
                    {commentErrorMsg && <Alert severity="error" sx={{ mb: 2 }}>{commentErrorMsg}</Alert>}
                    <TextField
                        label="Observación"
                        name="comment_text"
                        value={commentFormData.comment_text}
                        onChange={handleCommentFormChange}
                        fullWidth
                        multiline
                        rows={4}
                        margin="dense"
                        required
                        error={!!commentErrorMsg} // Simplified error check
                        helperText={commentErrorMsg} // Display generic error message
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="comment-type-label">Tipo de Observación</InputLabel>
                        <Select
                            labelId="comment-type-label"
                            name="type"
                            value={commentFormData.type}
                            label="Tipo de Observación"
                            onChange={handleCommentFormChange}
                        >
                            <MenuItem value="info">Información</MenuItem>
                            <MenuItem value="success">Éxito</MenuItem>
                            <MenuItem value="warning">Advertencia</MenuItem>
                            <MenuItem value="error">Error</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCommentDialog(false)} color='secondary'>Cancelar</Button>
                    <Button variant="contained" onClick={submitCommentForm}>
                        Añadir Observación
                    </Button>
                </DialogActions>
            </Dialog>


            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 2 }}
                open={downloadLoading || saving}
            >
                <CircularProgress color="inherit" />
                {saving && (
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Guardando cambios...
                    </Typography>
                )}
            </Backdrop>

            <MapModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                lat={jobData.location_details?.address_lat}
                lng={jobData.location_details?.address_lng}
                label="Ubicación del Candidato"
            />
        </Box>
    );
};

export default JobCandidatesPage;