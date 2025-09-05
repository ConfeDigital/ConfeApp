// src/pages/CandidateJobHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    IconButton,
    Tooltip,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    styled,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // Added for collapsing comments
import AddCommentIcon from '@mui/icons-material/AddComment'; // New Icon for adding comments
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // For 'info' type
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'; // For 'success' type
import WarningOutlinedIcon from '@mui/icons-material/WarningOutlined'; // For 'warning' type
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'; // For 'error' type


import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog';
import Header from '../../components/Header';
import *as Yup from 'yup';
import useDocumentTitle from "../../hooks/useDocumentTitle";

import AssignJobModal from '../../components/agencia/AssignJobModalGoogleMaps';
import RemoveJobModal from '../../components/agencia/RemoveJobModal';

const HighlightRow = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: "6px solid",
    borderColor: theme.palette.success.light,
}));

// Mapping for comment types to their Spanish display names
const commentTypeDisplayNames = {
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error',
};

const CandidateJobHistoryPage = () => {
    useDocumentTitle('Empleo del Candidato');
    const theme = useTheme();
    const navigate = useNavigate();
    const { uid: candidateId } = useParams();

    const [candidate, setCandidate] = useState(null);
    const [jobHistories, setJobHistories] = useState([]);
    const [availableJobs, setAvailableJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    // dialog state for JobHistory edit
    const [openJobHistoryDialog, setOpenJobHistoryDialog] = useState(false);
    const [editingJobHistoryEntry, setEditingJobHistoryEntry] = useState(null);
    // Removed 'comments' from formData for JobHistory
    const [jobHistoryFormData, setJobHistoryFormData] = useState({ job: '', start_date: null, end_date: null });
    const [jobHistoryErrorMsg, setJobHistoryErrorMsg] = useState('');

    // Dialog state for adding a new comment
    const [openCommentDialog, setOpenCommentDialog] = useState(false);
    const [jobHistoryForComment, setJobHistoryForComment] = useState(null); // The JobHistory entry we are commenting on
    const [commentFormData, setCommentFormData] = useState({ comment_text: '', type: 'info' });
    const [commentErrorMsg, setCommentErrorMsg] = useState('');

    // State to manage visibility of comments for each job history entry
    const [showComments, setShowComments] = useState({});

    // delete job history
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);

    const [assignOpen, setAssignOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);

    dayjs.locale('es');

    // your original endpoints
    const jobHistoryURL = '/api/candidatos/historial-empleos/';
    const candidateProfile = '/api/candidatos/profile-agencia/';
    const jobsURL = '/api/agencia/jobs/';
    // NEW: Endpoint for creating comments
    const commentsURL = '/api/candidatos/employment/comments/';


    const jobHistorySchema = Yup.object({
        job: Yup.number().required('Debe seleccionar un empleo'),
        start_date: Yup.date()
            .nullable()
            .when('end_date', {
                is: v => !!v,
                then: s => s.required('Debe ingresar fecha de inicio si hay término'),
            }),
        end_date: Yup.date()
            .nullable()
            .min(Yup.ref('start_date'), 'La fecha de término debe ser ≥ fecha de inicio'),
    });

    const commentSchema = Yup.object({
        comment_text: Yup.string().required('El comentario no puede estar vacío').max(1000, 'El comentario es demasiado largo'),
        type: Yup.string().oneOf(['info', 'success', 'warning', 'error']).required('Debe seleccionar un tipo de comentario'),
    });


    /**
     * Helper to get comment icon and color based on type.
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
     * Fetches candidate data, job histories, and available jobs from the backend.
     */
    const fetchAll = () => {
        if (!candidateId) return;
        setLoading(true);
        Promise.all([
            axios.get(`${candidateProfile}${candidateId}/`),
            axios.get(`${jobHistoryURL}?candidate=${candidateId}`),
            axios.get(jobsURL),
        ])
            .then(([candRes, histRes, jobsRes]) => {
                setCandidate(candRes.data);
                // Ensure comments array is present, even if empty
                const historiesWithComments = histRes.data.map(history => ({
                    ...history,
                    comments: Array.isArray(history.comments) ? history.comments : [],
                }));
                setJobHistories(historiesWithComments);
                setAvailableJobs(jobsRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(fetchAll, [candidateId]);

    const currentJob = jobHistories.find(
        h => !h.end_date && candidate?.current_job?.id === h.job.id
    );
    const pastJobs = jobHistories.filter(h => h !== currentJob).sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));


    // --- Job History Dialog Handlers ---
    const openJobHistoryForm = entry => {
        if (entry) {
            setEditingJobHistoryEntry(entry);
            setJobHistoryFormData({
                job: entry.job.id,
                start_date: dayjs(entry.start_date),
                end_date: entry.end_date ? dayjs(entry.end_date) : null,
                // Comments are no longer directly on JobHistory form data
            });
        } else {
            setEditingJobHistoryEntry(null);
            setJobHistoryFormData({ job: '', start_date: null, end_date: null });
        }
        setJobHistoryErrorMsg('');
        setOpenJobHistoryDialog(true);
    };

    const handleJobHistoryFormChange = e => {
        const { name, value } = e.target;
        setJobHistoryFormData(f => ({ ...f, [name]: value }));
    };

    const submitJobHistoryForm = async () => {
        try {
            await jobHistorySchema.validate(jobHistoryFormData, { abortEarly: false });
        } catch (err) {
            setJobHistoryErrorMsg(err.errors.join('. '));
            return;
        }
        const payload = {
            ...jobHistoryFormData,
            candidate: candidateId,
            start_date: jobHistoryFormData.start_date?.format('YYYY-MM-DD'),
            end_date: jobHistoryFormData.end_date?.format('YYYY-MM-DD'),
            job_id: jobHistoryFormData.job,
        };
        delete payload.job; // `job_id` is used instead of `job` for write operations

        try {
            if (editingJobHistoryEntry) {
                await axios.put(`${jobHistoryURL}${editingJobHistoryEntry.id}/`, payload);
            } else {
                await axios.post(jobHistoryURL, payload);
            }
            await fetchAll(); // Re-fetch all data to get updated JobHistory and comments
            setOpenJobHistoryDialog(false);
        } catch (e) {
            console.error(e);
            setJobHistoryErrorMsg('Error guardando entrada');
        }
    };

    // --- Comment Dialog Handlers ---
    const openAddCommentDialog = (jobHistoryEntry) => {
        setJobHistoryForComment(jobHistoryEntry);
        setCommentFormData({ comment_text: '', type: 'info' }); // Reset form
        setCommentErrorMsg('');
        setOpenCommentDialog(true);
    };

    const handleCommentFormChange = e => {
        const { name, value } = e.target;
        setCommentFormData(f => ({ ...f, [name]: value }));
    };

    const submitCommentForm = async () => {
        try {
            await commentSchema.validate(commentFormData, { abortEarly: false });
        } catch (err) {
            setCommentErrorMsg(err.errors.join('. '));
            return;
        }

        try {
            await axios.post(`${commentsURL}${jobHistoryForComment.id}/`, commentFormData);
            await fetchAll(); // Re-fetch all data to get the new comment
            setOpenCommentDialog(false);
        } catch (e) {
            console.error(e);
            setCommentErrorMsg('Error al agregar comentario');
        }
    };

    /**
     * Toggles the visibility of comments for a specific job history entry.
     * @param {number} jobHistoryId - The ID of the job history entry whose comments to toggle.
     */
    const toggleComments = (jobHistoryId) => {
        setShowComments(prev => ({
            ...prev,
            [jobHistoryId]: !prev[jobHistoryId]
        }));
    };

    const confirmDelete = async () => {
        if (!entryToDelete) return;
        await axios.delete(`${jobHistoryURL}${entryToDelete.id}/`);
        setJobHistories(hs => hs.filter(h => h.id !== entryToDelete.id));
        setOpenDeleteDialog(false);
    };

    const actionBtn = (
        <Button variant="outlined" onClick={() => navigate(`/candidatos/${candidateId}`)}>
            Volver al Perfil
        </Button>
    );

    return (
        <Box p={2}>
            <Header subtitle={candidate?.nombre_completo} actionButton={actionBtn} />
            <Typography variant='h4' color={candidate?.agency_state === 'Bol' ? 'info' : candidate?.agency_state === 'Emp' ? theme.palette.success.light : 'warning'} fontWeight='bold' gutterBottom>
                {candidate?.estado_agencia}
            </Typography>

            {loading
                ? <Typography>Cargando...</Typography>
                : (
                    <>
                        {currentJob && (
                            <HighlightRow variant="outlined">
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Empleo Actual</Typography>
                                    <Box>
                                        <Button
                                            size="small"
                                            startIcon={<AddCommentIcon />}
                                            onClick={() => openAddCommentDialog(currentJob)}
                                            sx={{ mr: 1 }}
                                        >
                                            Añadir Comentario
                                        </Button>
                                        {currentJob.comments && currentJob.comments.length > 0 && (
                                            <Tooltip title={showComments[currentJob.id] ? "Ocultar Comentarios" : "Ver Comentarios"}>
                                                <IconButton onClick={() => toggleComments(currentJob.id)}>
                                                    {showComments[currentJob.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                                <Typography><strong>Nombre:</strong> {currentJob.job.name}</Typography>
                                <Typography><strong>Empresa:</strong> {currentJob.job.company_name}</Typography>
                                <Typography><strong>Descripción del Empleo:</strong> {currentJob.job.job_description}</Typography>
                                <Typography gutterBottom><strong>Ubicación del Empleo:</strong>
                                    {currentJob.job.location_details
                                        ? `${currentJob.job.location_details.address_road} ${currentJob.job.location_details.address_number || ''}, ${currentJob.job.location_details.address_municip || ''}, ${currentJob.job.location_details.address_city || ''}`
                                        : 'N/A'}
                                </Typography>
                                <Typography><strong>Inicio:</strong> {dayjs(currentJob.start_date).format('LL')} </Typography>
                                {/* --- DISPLAY COMMENTS FOR CURRENT JOB --- */}
                                {showComments[currentJob.id] && (
                                    <Box sx={{ mt: 2, borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
                                        <Typography variant="subtitle1" sx={{mb:1}}><strong>Comentarios:</strong></Typography>
                                        {currentJob.comments && currentJob.comments.length > 0 ? (
                                            currentJob.comments
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
                                                })
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">No hay comentarios para este empleo.</Typography>
                                        )}
                                    </Box>
                                )}
                            </HighlightRow>
                        )}

                        {/** Depending on agency state, show the assign/remove button **/}
                        {candidate?.agency_state === 'Bol' && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AssignmentIcon />}
                                onClick={() => setAssignOpen(true)}
                                sx={{ mb: 2 }}
                            >
                                Asignar Empleo
                            </Button>
                        )}
                        {candidate?.agency_state === 'Emp' && (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<RemoveCircleIcon />}
                                onClick={() => setRemoveOpen(true)}
                                sx={{ mb: 2 }}
                            >
                                Remover Empleo
                            </Button>
                        )}

                        <Typography variant="h6" gutterBottom>
                            Historial Anterior
                        </Typography>
                        {pastJobs.length === 0 && (
                            <Typography color="text.secondary">No hay historial previo.</Typography>
                        )}
                        {pastJobs.map(entry => (
                            <Accordion key={entry.id} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>
                                        {entry.job.name} — {dayjs(entry.start_date).format('LL')} a {dayjs(entry.end_date).format('LL') || 'Presente'}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography><strong>Empresa:</strong> {entry.job.company_name}</Typography>
                                    <Typography><strong>Descripción del Empleo:</strong> {entry.job.job_description}</Typography>
                                    <Typography gutterBottom><strong>Ubicación del Empleo:</strong>
                                        {entry.job.location_details
                                            ? `${entry.job.location_details.address_road} ${entry.job.location_details.address_number || ''}, ${entry.job.location_details.address_municip || ''}, ${entry.job.location_details.address_city || ''}`
                                            : 'N/A'}
                                    </Typography>
                                    {/* --- DISPLAY COMMENTS FOR PAST JOBS --- */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                        <Typography variant="subtitle2"><strong>Comentarios:</strong></Typography>
                                        {entry.comments && entry.comments.length > 0 && (
                                            <Tooltip title={showComments[entry.id] ? "Ocultar Comentarios" : "Ver Comentarios"}>
                                                <IconButton onClick={() => toggleComments(entry.id)}>
                                                    {showComments[entry.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                    {showComments[entry.id] && (
                                        <Box sx={{ mt: 1 }}>
                                            {entry.comments && entry.comments.length > 0 ? (
                                                entry.comments
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
                                                    })
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">No hay comentarios para este empleo.</Typography>
                                            )}
                                        </Box>
                                    )}

                                    <Box mt={1}>
                                        {/* <Tooltip title="Editar Historial">
                                            <IconButton color='primary' onClick={() => openJobHistoryForm(entry)}><EditIcon /></IconButton>
                                        </Tooltip> */}
                                        <Tooltip title="Añadir Comentario">
                                            <IconButton color='primary' onClick={() => openAddCommentDialog(entry)}><AddCommentIcon /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar Historial">
                                            <IconButton color='error' onClick={() => { setEntryToDelete(entry); setOpenDeleteDialog(true); }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </>
                )
            }

            {/* --- Job History Edit/Add Dialog --- */}
            <Dialog open={openJobHistoryDialog} onClose={() => setOpenJobHistoryDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingJobHistoryEntry ? 'Editar Historial de Empleo' : 'Nueva Entrada de Historial'}</DialogTitle>
                <DialogContent>
                    {jobHistoryErrorMsg && <Alert severity="error" sx={{ mb: 2 }}>{jobHistoryErrorMsg}</Alert>}

                    <FormControl fullWidth margin="dense">
                        <InputLabel>Empleo</InputLabel>
                        <Select
                            name="job"
                            value={jobHistoryFormData.job}
                            label="Empleo"
                            onChange={handleJobHistoryFormChange}
                            disabled={!!editingJobHistoryEntry} // Disable job selection if editing existing entry
                        >
                            {availableJobs.map(j => (
                                <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <DatePicker
                        label="Fecha Inicio"
                        value={jobHistoryFormData.start_date}
                        onChange={v => setJobHistoryFormData(d => ({ ...d, start_date: v }))}
                        slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                        disabled={!!editingJobHistoryEntry} // Disable start date if editing existing entry
                    />
                    <DatePicker
                        label="Fecha Fin"
                        value={jobHistoryFormData.end_date}
                        onChange={v => setJobHistoryFormData(d => ({ ...d, end_date: v }))}
                        slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                    />

                    {/* Removed TextField for comments here, as it's now handled by a separate model/dialog */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenJobHistoryDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={submitJobHistoryForm}>
                        {editingJobHistoryEntry ? 'Guardar Cambios' : 'Agregar Historial'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- New Comment Add Dialog --- */}
            <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Añadir Comentario a Historial</DialogTitle>
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
                        error={!!commentErrorMsg && commentErrorMsg.includes('vacío')}
                        helperText={!!commentErrorMsg && commentErrorMsg.includes('vacío') ? "El comentario no puede estar vacío." : ""}
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
                    <Button onClick={() => setOpenCommentDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={submitCommentForm}>
                        Añadir Comentario
                    </Button>
                </DialogActions>
            </Dialog>


            <DeleteConfirmDialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                onConfirm={confirmDelete}
            />

            <AssignJobModal
                open={assignOpen}
                candidate={candidate}
                availableJobs={availableJobs}
                onClose={() => setAssignOpen(false)}
                onAssigned={() => {
                    setAssignOpen(false);
                    fetchAll();
                }}
            />

            <RemoveJobModal
                open={removeOpen}
                candidate={candidate}
                onClose={() => setRemoveOpen(false)}
                onRemoved={() => {
                    setRemoveOpen(false);
                    fetchAll();
                }}
            />
        </Box>
    );
};

export default CandidateJobHistoryPage;
