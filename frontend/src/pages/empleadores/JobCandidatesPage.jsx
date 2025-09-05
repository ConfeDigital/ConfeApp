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
    Tooltip
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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// Assuming you have these models for comments
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import *as Yup from 'yup';

// Import JobFormDialog for editing job details
import JobFormDialog from "../../components/agencia/JobFormDialogGoogle";

dayjs.locale('es');

// Mapping for comment types to their Spanish display names
const commentTypeDisplayNames = {
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error',
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

    // States for Job editing dialog
    const [jobDialogOpen, setJobDialogOpen] = useState(false);
    const [jobDialogData, setJobDialogData] = useState(null);
    const [isJobEdit, setIsJobEdit] = useState(false);
    const [companies, setCompanies] = useState([]); // State to hold companies for JobFormDialog

    // Backend endpoint for job with assigned candidates
    const jobAssignedCandidatesURL = `/api/agencia/jobs/${jobId}/assigned-candidates/`;
    // Backend endpoint for JobHistory comments (reusing from previous page)
    const commentsURL = `/api/candidatos/employment/comments/`;
    // Backend endpoint for JobHistory (to fetch it for commenting)
    const jobHistoryURL = `/api/candidatos/historial-empleos/`;
    // Backend endpoint for companies (needed for JobFormDialog)
    const companiesURL = "/api/agencia/companies/";


    const commentSchema = Yup.object({
        comment_text: Yup.string().required('El comentario no puede estar vacío').max(1000, 'El comentario es demasiado largo'),
        type: Yup.string().oneOf(['info', 'success', 'warning', 'error']).required('Debe seleccionar un tipo de comentario'),
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
     * Fetches the job data including assigned candidates and also the list of companies from the backend.
     */
    const fetchJobData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [jobRes, companiesRes] = await Promise.all([
                axios.get(jobAssignedCandidatesURL),
                axios.get(companiesURL), // Fetch companies for JobFormDialog
            ]);
            setJobData(jobRes.data);
            setCompanies(companiesRes.data); // Set companies state
        } catch (err) {
            console.error("Error fetching job data, assigned candidates, or companies:", err);
            setError("No se pudo cargar la información del empleo, los candidatos asignados o las empresas.");
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
            setError("Error al preparar el formulario de comentario.");
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
            setAlert({ severity: "success", message: "Comentario añadido correctamente." });
            // Clear the alert after 3 seconds
            setTimeout(() => setAlert(null), 3000);
        } catch (e) {
            console.error(e);
            const errorMessage = e.response?.data?.comment_text?.[0] || e.response?.data?.non_field_errors?.[0] || 'Error al añadir comentario';
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
     * Opens the JobFormDialog for editing the current job details.
     */
    const handleJobEdit = () => {
        setIsJobEdit(true);
        setJobDialogData(jobData); // Pass the current job data to the dialog
        setJobDialogOpen(true);
    };

    const handleDownload = async ( candidate ) => {
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


    // Button to navigate back to the jobs page
    const actionBtn = (
        <Button 
            variant="outlined" 
            onClick={() => {
                if (location.pathname === `/empleador/empleo/${jobId}` ) {
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

            <Header subtitle={jobData.name} actionButton={actionBtn} />
            <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">Detalles del Empleo</Typography>
                    <Tooltip title="Editar Empleo">
                        <IconButton color="primary" onClick={handleJobEdit}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Typography><strong>Empresa:</strong> {jobData.company_name}</Typography>
                <Typography><strong>Descripción:</strong> {jobData.job_description || 'N/A'}</Typography>
                <Typography><strong>Vacantes:</strong> {jobData.vacancies || 'Indefinido'}</Typography>
                <Typography><strong>Ubicación:</strong>
                    {jobData.location_details
                        ? `${jobData.location_details.address_road} ${jobData.location_details.address_number || ''}, ${jobData.location_details.address_municip || ''}, ${jobData.location_details.address_city || ''}`
                        : 'N/A'}
                </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom>Candidatos Asignados Actualmente ({jobData.assigned_candidates.length})</Typography>
            {jobData.assigned_candidates.length === 0 ? (
                <Typography color="text.secondary">No hay candidatos actualmente asignados a este empleo.</Typography>
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
                                    <Tooltip title="Añadir Comentario al Candidato">
                                        <IconButton
                                            color="primary"
                                            onClick={() => openAddCommentDialog(candidate.id)}
                                        >
                                            <AddCommentIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {/* Toggle button for comments */}
                                    {candidate.current_job_history_comments && candidate.current_job_history_comments.length > 0 && (
                                        <Tooltip title={showComments[candidate.id] ? "Ocultar Comentarios" : "Ver Comentarios"}>
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
                                    <Typography variant="subtitle1" gutterBottom>Comentarios:</Typography>
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
                                    No hay comentarios para este candidato en este empleo.
                                </Typography>
                            )}
                        </Paper>
                    ))}
                </List>
            )}

            {/* New Comment Add Dialog (reused from CandidateJobHistoryPage) */}
            <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Añadir Comentario a Historial de {jobHistoryForComment?.candidate_name}</DialogTitle>
                <DialogContent>
                    {commentErrorMsg && <Alert severity="error" sx={{ mb: 2 }}>{commentErrorMsg}</Alert>}
                    <TextField
                        label="Comentario"
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
                        <InputLabel id="comment-type-label">Tipo de Comentario</InputLabel>
                        <Select
                            labelId="comment-type-label"
                            name="type"
                            value={commentFormData.type}
                            label="Tipo de Comentario"
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
                        Añadir Comentario
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Job Edit Dialog */}
            <JobFormDialog
                open={jobDialogOpen}
                data={jobDialogData}
                isEdit={isJobEdit}
                onClose={() => setJobDialogOpen(false)}
                onSubmit={() => {
                    setJobDialogOpen(false);
                    fetchJobData(); // Re-fetch job data to show updated details
                    setAlert({ severity: "success", message: "Empleo actualizado correctamente." });
                    setTimeout(() => setAlert(null), 3000);
                }}
                companies={companies} // Pass the fetched companies list
                // setJobs prop is not needed here as we only display a single job
                setAlert={setAlert} // Pass alert handler
            />
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 2 }}
                open={downloadLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
};

export default JobCandidatesPage;
