// ==========================================
// EmploymentDashboard Component
// Dashboard completo para gestión de empleo del candidato
// ==========================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Divider,
  Grid2 as Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
  Autocomplete,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";
import {
  WorkOutline as WorkIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
  RemoveCircle as RemoveCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AddComment as AddCommentIcon,
  InfoOutlined as InfoOutlinedIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  Star as StarIcon,
  WarningOutlined as WarningOutlinedIcon,
  ErrorOutlineOutlined as ErrorOutlineOutlinedIcon,
  Map as MapIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  CardGiftcard as CardGiftcardIcon,
  Work as WorkDetailIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Psychology as SkillIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { DatePicker } from '@mui/x-date-pickers';
import axios from "../../api";
import dayjs from "dayjs";
import "dayjs/locale/es";
import * as Yup from 'yup';

// Import components from CandidateJobHistory
import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog';
import AssignJobModal from '../../components/agencia/AssignJobModalGoogleMaps';
import RemoveJobModal from '../../components/agencia/RemoveJobModal';
import EmploymentDashboardSkeleton from '../../components/agencia/EmploymentDashboardSkeleton';
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import MapModal from '../../components/MapModal'; // adjust path if needed

dayjs.locale("es");

// Styled components
const HighlightRow = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderLeft: "6px solid",
  borderColor: theme.palette.success.light,
}));

// Comment type mappings
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

const EmploymentDashboard = () => {
  useDocumentTitle('Expediente de Empleo')

  const { uid } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Estados principales
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [aptitudeQuestionnaires, setAptitudeQuestionnaires] = useState([]);
  const [stageQuestionnaires, setStageQuestionnaires] = useState([]);
  const [trackingComments, setTrackingComments] = useState([]);

  // Estados para evaluación de habilidades
  const [habilidades, setHabilidades] = useState([]);
  const [candidateHabilidades, setCandidateHabilidades] = useState([]);
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  // Estados para popups
  const [openAgencyPopup, setOpenAgencyPopup] = useState(false);
  const [openHistoryPopup, setOpenHistoryPopup] = useState(false);
  const [openTrackingPopup, setOpenTrackingPopup] = useState(false);
  const [openProfilePopup, setOpenProfilePopup] = useState(false);

  // Estados para job assignment (migrated from CandidateJobHistory)
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [openJobHistoryDialog, setOpenJobHistoryDialog] = useState(false);
  const [editingJobHistoryEntry, setEditingJobHistoryEntry] = useState(null);
  const [jobHistoryFormData, setJobHistoryFormData] = useState({ job: '', start_date: null, end_date: null });
  const [jobHistoryErrorMsg, setJobHistoryErrorMsg] = useState('');

  // Estados para comentarios
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [jobHistoryForComment, setJobHistoryForComment] = useState(null);
  const [commentFormData, setCommentFormData] = useState({ comment_text: '', type: 'info' });
  const [commentErrorMsg, setCommentErrorMsg] = useState('');
  const [showComments, setShowComments] = useState({});

  // Estados para eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const [mapOpen, setMapOpen] = useState(false);

  // Estados para formularios legacy (mantener compatibilidad)
  const [newJob, setNewJob] = useState({
    position: "",
    company: "",
    start_date: "",
    end_date: "",
    status: "active",
    description: "",
  });

  const [newComment, setNewComment] = useState({
    comment_text: "",
    type: "info",
  });

  // API endpoints
  const jobHistoryURL = '/api/candidatos/historial-empleos/';
  const agenciaProfileURL = '/api/candidatos/profile-agencia/'; // Keep agencia endpoint for job history context
  const jobsURL = '/api/agencia/jobs/';
  const commentsURL = '/api/candidatos/employment/comments/';

  // Validation schemas
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

  // Unified data fetching function
  const fetchAll = () => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      axios.get(`${agenciaProfileURL}${uid}/`), // Agency-specific data for job context
      axios.get(`${jobHistoryURL}?candidate=${uid}`),
      axios.get(jobsURL),
      fetchAptitudeQuestionnaires(),
      fetchStageQuestionnaires(),
      fetchHabilidades(),
      fetchCandidateHabilidades(),
    ])
      .then(([agenciaRes, histRes, jobsRes]) => {
        setCandidateProfile(agenciaRes.data);

        // Ensure comments array is present
        const historiesWithComments = histRes.data.map(history => ({
          ...history,
          comments: Array.isArray(history.comments) ? history.comments : [],
        }));
        setEmploymentHistory(historiesWithComments);
        setAvailableJobs(jobsRes.data);

        // Process tracking comments
        const allComments = [];
        for (const job of historiesWithComments) {
          if (job.comments && job.comments.length > 0) {
            allComments.push(...job.comments.map(comment => ({
              ...comment,
              job_title: job.job?.name || job.position,
              company: job.job?.company?.name || job.company
            })));
          }
        }
        allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setTrackingComments(allComments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [uid]);

  const fetchAptitudeQuestionnaires = async () => {
    try {
      const response = await axios.get(`/api/cuestionarios/?estado_desbloqueo=Agn`);
      // Filtrar cuestionarios de aptitudes
      const aptitudeQuestionnaires = response.data.filter(q =>
        q.title && (
          q.title.toLowerCase().includes('aptitud') ||
          q.title.toLowerCase().includes('competencia') ||
          q.title.toLowerCase().includes('habilidad')
        )
      );
      setAptitudeQuestionnaires(aptitudeQuestionnaires);
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Error loading aptitude questionnaires:", error);
      setAptitudeQuestionnaires([]);
      return Promise.resolve();
    }
  };

  const fetchStageQuestionnaires = async () => {
    try {
      const response = await axios.get(`/api/cuestionarios/usuario/${uid}/cuestionarios-con-respuestas/?estado_desbloqueo=Agn`);
      // Filtrar cuestionarios de la etapa Agencia
      const agencyQuestionnaires = response.data.filter(q =>
        q.estado_desbloqueo === 'Agn' && q.activo
      );
      setStageQuestionnaires(agencyQuestionnaires);
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Error loading stage questionnaires:", error);
      setStageQuestionnaires([]);
      return Promise.resolve();
    }
  };

  const fetchHabilidades = async () => {
    try {
      const response = await axios.get('/api/agencia/habilidades/');
      setHabilidades(response.data);
    } catch (error) {
      console.error("Error al cargar habilidades:", error);
    }
  };

  const fetchCandidateHabilidades = async () => {
    if (!uid) return;
    setLoadingHabilidades(true);
    try {
      const response = await axios.get(`/api/agencia/candidato-habilidades/?candidato=${uid}`);
      setCandidateHabilidades(response.data);
    } catch (error) {
      console.error("Error al cargar habilidades del candidato:", error);
      setCandidateHabilidades([]);
    } finally {
      setLoadingHabilidades(false);
    }
  };

  const saveCandidateHabilidad = async (habilidadId, nivelCompetencia, observaciones = '') => {
    try {
      const payload = {
        candidato: uid,
        habilidad: habilidadId,
        nivel_competencia: nivelCompetencia,
        observaciones: observaciones
      };

      await axios.post('/api/agencia/candidato-habilidades/', payload);
      await fetchCandidateHabilidades(); // Recargar habilidades del candidato
    } catch (error) {
      console.error("Error al guardar habilidad del candidato:", error);
      throw error;
    }
  };

  // Helper functions
  const getCommentIconAndColor = (type) => {
    switch (type) {
      case 'success': return { icon: <CheckCircleOutlinedIcon fontSize="small" />, color: theme.palette.success.main };
      case 'warning': return { icon: <WarningOutlinedIcon fontSize="small" />, color: theme.palette.warning.main };
      case 'error': return { icon: <ErrorOutlineOutlinedIcon fontSize="small" />, color: theme.palette.error.main };
      case 'info':
      default: return { icon: <InfoOutlinedIcon fontSize="small" />, color: theme.palette.info.main };
    }
  };

  const toggleComments = (jobHistoryId) => {
    setShowComments(prev => ({
      ...prev,
      [jobHistoryId]: !prev[jobHistoryId]
    }));
  };

  // Job History handlers
  const openJobHistoryForm = entry => {
    if (entry) {
      setEditingJobHistoryEntry(entry);
      setJobHistoryFormData({
        job: entry.job.id,
        start_date: dayjs(entry.start_date),
        end_date: entry.end_date ? dayjs(entry.end_date) : null,
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
      candidate: uid,
      start_date: jobHistoryFormData.start_date?.format('YYYY-MM-DD'),
      end_date: jobHistoryFormData.end_date?.format('YYYY-MM-DD'),
      job_id: jobHistoryFormData.job,
    };
    delete payload.job;

    try {
      if (editingJobHistoryEntry) {
        await axios.put(`${jobHistoryURL}${editingJobHistoryEntry.id}/`, payload);
      } else {
        await axios.post(jobHistoryURL, payload);
      }
      await fetchAll();
      setOpenJobHistoryDialog(false);
    } catch (e) {
      console.error(e);
      setJobHistoryErrorMsg('Error guardando entrada');
    }
  };

  // Comment handlers
  const openAddCommentDialog = (jobHistoryEntry) => {
    setJobHistoryForComment(jobHistoryEntry);
    setCommentFormData({ comment_text: '', type: 'info' });
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
      await fetchAll();
      setOpenCommentDialog(false);
    } catch (e) {
      console.error(e);
      setCommentErrorMsg('Error al agregar comentario');
    }
  };

  // Delete handlers
  const confirmDelete = async () => {
    if (!entryToDelete) return;
    await axios.delete(`${jobHistoryURL}${entryToDelete.id}/`);
    setEmploymentHistory(hs => hs.filter(h => h.id !== entryToDelete.id));
    setOpenDeleteDialog(false);
  };

  const handleAptitudeTest = (questionnaireId) => {
    navigate(`/candidatos/${uid}/${questionnaireId}`);
  };

  // Legacy handlers for compatibility
  const handleJobAssignment = async () => {
    try {
      await axios.post(`/api/candidatos/historial-empleos/`, {
        ...newJob,
        candidate: uid
      });
      await fetchAll();
      setAssignOpen(false);
      setNewJob({
        position: "",
        company: "",
        start_date: "",
        end_date: "",
        status: "active",
        description: "",
      });
    } catch (error) {
      console.error("Error assigning job:", error);
    }
  };

  const handleAddComment = (jobHistoryId) => {
    const jobHistory = employmentHistory.find(job => job.id === jobHistoryId);
    if (jobHistory) {
      openAddCommentDialog(jobHistory);
    }
  };

  const handleSubmitComment = async () => {
    try {
      await axios.post(`${commentsURL}${jobHistoryForComment.id}/`, commentFormData);
      await fetchAll();
      setOpenCommentDialog(false);
      setCommentFormData({ comment_text: "", type: "info" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const getCommentTypeColor = (type) => {
    const colors = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'error'
    };
    return colors[type] || 'primary';
  };

  const getCommentTypeLabel = (type) => {
    const labels = {
      info: 'Información',
      success: 'Éxito',
      warning: 'Advertencia',
      error: 'Error'
    };
    return labels[type] || 'Información';
  };

  const getGenderDisplay = (gender) => {
    const genderMap = {
      'M': 'Masculino',
      'F': 'Femenino',
      'O': 'Otro'
    };
    return genderMap[gender] || 'No especificado';
  };

  // Format salary function
  const formatSalary = (salary) => {
    if (!salary) return null;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(salary);
  };

  if (loading) {
    return <EmploymentDashboardSkeleton />;
  }

  if (!candidateProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">No se pudo cargar la información del candidato</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con información básica del candidato */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={candidateProfile.photo}
              sx={{
                width: 100,
                height: 100,
                fontSize: '4rem'
              }}
            >
              {!candidateProfile.photo && candidateProfile.user.first_name.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Typography variant="h4" gutterBottom>
                {candidateProfile.user.first_name} {candidateProfile.user.last_name} {candidateProfile.user.second_last_name || ''}
              </Typography>
              <Button variant="outlined" color="primary" onClick={() => navigate(`/candidatos/${uid}`)}>
                Volver al Perfil
              </Button>
            </Box>
            <Typography variant='h5' color={candidateProfile?.agency_state === 'Bol' ? 'info' : candidateProfile?.agency_state === 'Emp' ? theme.palette.success.main : 'warning'} fontWeight='bold' gutterBottom>
              {candidateProfile?.estado_agencia}
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Chip
                  label={`Edad: ${dayjs().diff(dayjs(candidateProfile.birth_date), 'year') + ' años' || 'N/A'}`}
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Chip
                  label={`Género: ${getGenderDisplay(candidateProfile.gender)}`}
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Chip
                  label={`Discapacidad: ${candidateProfile.disability_name}`}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Botones para abrir popups - Estilo consistente con la aplicación */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<StarIcon />}
            onClick={() => setOpenAgencyPopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Habilidades
          </Button>

          {/* Dynamic button based on employment state */}
          {candidateProfile?.agency_state === 'Bol' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentIcon />}
              onClick={() => setAssignOpen(true)}
              sx={{ minWidth: "140px" }}
            >
              Asignar Trabajo
            </Button>
          )}
          {candidateProfile?.agency_state === 'Emp' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<RemoveCircleIcon />}
              onClick={() => setRemoveOpen(true)}
              sx={{ minWidth: "140px" }}
            >
              Remover Empleo
            </Button>
          )}
          {candidateProfile?.agency_state !== 'Bol' && candidateProfile?.agency_state !== 'Emp' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<AssignmentIcon />}
              onClick={() => setAssignOpen(true)}
              sx={{ minWidth: "140px" }}
            >
              Asignar Trabajo
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => setOpenHistoryPopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Historial
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonIcon />}
            onClick={() => setOpenProfilePopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Ficha Laboral
          </Button>
        </Box>

        {/* <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<HistoryIcon />}
            onClick={() => setOpenTrackingPopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Log de Seguimiento
          </Button>
        </Box> */}
      </Box>

      {/* Current Job Section - Enhanced UI */}
      {(() => {
        const currentJob = employmentHistory.find(h => !h.end_date && candidateProfile?.current_job?.id === h.job?.id);
        if (!currentJob) {
          // Show message when no current job
          if (candidateProfile?.agency_state === 'Bol') {
            return (
              <Card
                elevation={3}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.info.main}10 0%, ${theme.palette.info.main}05 100%)`,
                  border: `1px solid ${theme.palette.info.main}20`
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <WorkIcon sx={{ fontSize: 64, color: theme.palette.info.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="info.main">
                    Candidato en Bolsa de Trabajo
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    El candidato está disponible para ser asignado a un empleo
                  </Typography>
                </CardContent>
              </Card>
            );
          }
          return null;
        }
        return (
          <Card
            elevation={3}
            sx={{
              mb: 4,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.success.main}10 0%, ${theme.palette.success.main}05 100%)`,
              border: `1px solid ${theme.palette.success.main}20`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header with Company Info and Actions */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box display="flex" alignItems="center" gap={2} flex={1} mr={2}>
                  {/* Company Logo */}
                  <Avatar
                    src={currentJob.job?.company_logo}
                    sx={{
                      width: 64,
                      height: 64,
                      border: `2px solid ${theme.palette.success.main}30`
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                      {currentJob.job?.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" />
                      {currentJob.job?.company_name}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddCommentIcon />}
                    onClick={() => openAddCommentDialog(currentJob)}
                    sx={{ mr: 1 }}
                  >
                    Añadir Observación
                  </Button>
                  {currentJob.comments && currentJob.comments.length > 0 && (
                    <Tooltip title={showComments[currentJob.id] ? "Ocultar Observaciones" : "Ver Observaciones"}>
                      <IconButton
                        onClick={() => toggleComments(currentJob.id)}
                        sx={{
                          backgroundColor: theme.palette.primary.main + '10',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main + '20'
                          }
                        }}
                      >
                        {showComments[currentJob.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                      <WorkDetailIcon color="primary" />
                      Descripción del Puesto
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {currentJob.job?.job_description || 'No hay descripción disponible'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Location */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon color="primary" />
                      Ubicación
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body2" color="text.secondary">
                        {currentJob.job?.location_details
                          ? `${currentJob.job.location_details.address_road} ${currentJob.job.location_details.address_number || ''}, ${currentJob.job.location_details.address_col || ''}, ${currentJob.job.location_details.address_municip || ''}, ${currentJob.job.location_details.address_city || ''}`
                          : 'Ubicación no especificada'}
                      </Typography>
                      {currentJob.job?.location_details?.address_lat && currentJob.job?.location_details?.address_lng && (
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

                {/* Start Date */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon color="primary" />
                      Fecha de Inicio
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {dayjs(currentJob.start_date).format('LL')}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Schedule */}
                {currentJob.job?.horario && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon color="primary" />
                        Horario
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentJob.job.horario}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Salary */}
                {currentJob.job?.sueldo_base && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoneyIcon color="primary" />
                        Sueldo Base (Mensual)
                      </Typography>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        {formatSalary(currentJob.job.sueldo_base)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Benefits */}
                {currentJob.job?.prestaciones && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CardGiftcardIcon color="primary" />
                        Prestaciones
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentJob.job.prestaciones}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Required Skills */}
                {currentJob.job?.habilidades_requeridas && currentJob.job.habilidades_requeridas.length > 0 && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SkillIcon color="primary" />
                        Habilidades Requeridas
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {currentJob.job.habilidades_requeridas.map((habilidad, index) => (
                          <Chip
                            key={index}
                            label={`${habilidad.habilidad_nombre} - ${importanceLabels[habilidad.nivel_importancia] || habilidad.nivel_importancia}`}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderColor: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                              color: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                              mb: 1
                            }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Comments Section */}
              {showComments[currentJob.id] && (
                <Box sx={{ mt: 3, borderTop: `1px solid ${theme.palette.divider}`, pt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddCommentIcon color="primary" />
                    Observaciones
                  </Typography>
                  {currentJob.comments && currentJob.comments.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {currentJob.comments
                        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)))
                        .map(comment => {
                          const { icon, color } = getCommentIconAndColor(comment.type);
                          return (
                            <Paper key={comment.id} elevation={1} sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
                              <Box display="flex" alignItems="flex-start" gap={1}>
                                <Tooltip title={commentTypeDisplayNames[comment.type] || comment.type}>
                                  <span style={{ color: color, marginTop: '2px' }}>{icon}</span>
                                </Tooltip>
                                <Box flex={1}>
                                  <Typography variant="body2">
                                    {comment.comment_text}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Por {comment.author_name || 'Desconocido'} el {dayjs(comment.created_at).format('LLL')}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No hay observaciones para este empleo.</Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Popup para Etapa Agencia */}
      <Dialog open={openAgencyPopup} onClose={() => setOpenAgencyPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Evaluación de Habilidades y Cuestionarios
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Complete los cuestionarios de la etapa Agencia para evaluar las competencias del candidato.
          </Typography>

          {/* Sección de Evaluación de Habilidades */}
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <StarIcon color="primary" />
                <Typography variant="h6">Evaluación de Habilidades</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Evalúa las habilidades del candidato para mejorar el matching con empleos.
              </Typography>

              {loadingHabilidades ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress sx={{ flexGrow: 1 }} />
                  <Typography variant="body2">Cargando habilidades...</Typography>
                </Box>
              ) : (
                <Box>
                  {/* Habilidades ya evaluadas */}
                  {candidateHabilidades.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Habilidades Evaluadas ({candidateHabilidades.length})
                      </Typography>
                      <List dense>
                        {candidateHabilidades.map((habilidad) => (
                          <ListItem key={habilidad.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={habilidad.habilidad_nombre}
                              secondary={`Nivel: ${habilidad.nivel_competencia} | Categoría: ${habilidad.habilidad_categoria}`}
                            />
                            <Chip
                              label={habilidad.nivel_competencia}
                              size="small"
                              color={
                                habilidad.nivel_competencia === 'experto' ? 'success' :
                                  habilidad.nivel_competencia === 'avanzado' ? 'primary' :
                                    habilidad.nivel_competencia === 'intermedio' ? 'warning' : 'default'
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Formulario para agregar nueva habilidad */}
                  <CandidateHabilidadForm
                    habilidades={habilidades}
                    candidateHabilidades={candidateHabilidades}
                    onSave={saveCandidateHabilidad}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {stageQuestionnaires.length > 0 ? (
            <Grid container spacing={2}>
              {stageQuestionnaires.map((questionnaire) => {
                let buttonColor = "primary";
                let buttonText = "Realizar Cuestionario";
                let buttonVariant = "contained";

                if (questionnaire.finalizado) {
                  buttonColor = "success";
                  buttonText = "Ver Resultados";
                  buttonVariant = "contained";
                } else if (questionnaire.tiene_respuestas) {
                  buttonColor = "info";
                  buttonText = "Continuar";
                  buttonVariant = "contained";
                } else {
                  buttonVariant = "outlined";
                }

                return (
                  <Grid item xs={12} md={6} lg={4} key={questionnaire.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {questionnaire.base_cuestionario_nombre || questionnaire.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {questionnaire.descripcion || "Cuestionario de evaluación"}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            label={questionnaire.activo ? "Activo" : "Inactivo"}
                            color={questionnaire.activo ? "success" : "default"}
                            size="small"
                          />
                          {questionnaire.finalizado && (
                            <Chip
                              label="Finalizado"
                              color="success"
                              size="small"
                            />
                          )}
                          {questionnaire.tiene_respuestas && !questionnaire.finalizado && (
                            <Chip
                              label="En Progreso"
                              color="info"
                              size="small"
                            />
                          )}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          variant={buttonVariant}
                          color={buttonColor}
                          onClick={() => handleAptitudeTest(questionnaire.id)}
                          disabled={!questionnaire.activo}
                          fullWidth
                        >
                          {buttonText}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No hay cuestionarios disponibles para la etapa Agencia
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los cuestionarios aparecerán cuando el candidato avance a esta etapa
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAgencyPopup(false)} color='secondary'>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup para Historial - Solo trabajos anteriores */}
      <Dialog open={openHistoryPopup} onClose={() => setOpenHistoryPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Historial Anterior de Empleos
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Historial de empleos anteriores del candidato.
          </Typography>

          {/* Past Jobs Section - Enhanced UI */}
          {(() => {
            const currentJob = employmentHistory.find(h => !h.end_date && candidateProfile?.current_job?.id === h.job?.id);
            const pastJobs = employmentHistory.filter(h => h !== currentJob).sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));

            return pastJobs.length === 0 ? (
              <Paper elevation={1} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <HistoryIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay historial previo de empleos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Los empleos anteriores aparecerán aquí una vez que el candidato complete trabajos
                </Typography>
              </Paper>
            ) : (
              pastJobs.map(entry => (
                <Card key={entry.id} elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
                  <Accordion sx={{ boxShadow: 'none' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: "background.default",
                        borderRadius: '8px 8px 0 0',
                        '&.Mui-expanded': {
                          borderRadius: '8px 8px 0 0'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Avatar
                          src={entry.job?.company_logo}
                          sx={{ width: 40, height: 40 }}
                        >
                          <BusinessIcon />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {entry.job?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.job?.company_name} • {dayjs(entry.start_date).format('LL')} a {entry.end_date ? dayjs(entry.end_date).format('LL') : 'Presente'}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={2}>
                        {/* Job Description */}
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <WorkDetailIcon fontSize="small" color="primary" />
                              Descripción del Puesto
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.job?.job_description || 'No hay descripción disponible'}
                            </Typography>
                          </Paper>
                        </Grid>

                        {/* Location */}
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon fontSize="small" color="primary" />
                              Ubicación
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.job?.location_details
                                ? `${entry.job.location_details.address_road} ${entry.job.location_details.address_number || ''}, ${entry.job.location_details.address_municip || ''}, ${entry.job.location_details.address_city || ''}`
                                : 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Duration */}
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon fontSize="small" color="primary" />
                              Duración
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.end_date
                                ? `${dayjs(entry.end_date).diff(dayjs(entry.start_date), 'month')} meses`
                                : 'En curso'
                              }
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Schedule */}
                        {entry.job?.horario && (
                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon fontSize="small" color="primary" />
                                Horario
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.job.horario}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Salary */}
                        {entry.job?.sueldo_base && (
                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoneyIcon fontSize="small" color="primary" />
                                Sueldo Base
                              </Typography>
                              <Typography variant="body2" color="success.main" fontWeight="bold">
                                {formatSalary(entry.job.sueldo_base)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Benefits */}
                        {entry.job?.prestaciones && (
                          <Grid item xs={12}>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CardGiftcardIcon fontSize="small" color="primary" />
                                Prestaciones
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.job.prestaciones}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Required Skills */}
                        {entry.job?.habilidades_requeridas && entry.job.habilidades_requeridas.length > 0 && (
                          <Grid item xs={12}>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SkillIcon fontSize="small" color="primary" />
                                Habilidades Requeridas
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {entry.job.habilidades_requeridas.map((habilidad, index) => (
                                  <Chip
                                    key={index}
                                    label={`${habilidad.habilidad_nombre} - ${importanceLabels[habilidad.nivel_importancia] || habilidad.nivel_importancia}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                                      color: importanceColors[habilidad.nivel_importancia] || theme.palette.primary.main,
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {/* Comments section for past jobs */}
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AddCommentIcon fontSize="small" color="primary" />
                          Observaciones
                        </Typography>
                        <Box>
                          <Tooltip title="Añadir Observación">
                            <IconButton color='primary' size="small" onClick={() => openAddCommentDialog(entry)}>
                              <AddCommentIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar Historial">
                            <IconButton color='error' size="small" onClick={() => { setEntryToDelete(entry); setOpenDeleteDialog(true); }}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          {entry.comments && entry.comments.length > 0 && (
                            <Tooltip title={showComments[entry.id] ? "Ocultar Observaciones" : "Ver Observaciones"}>
                              <IconButton size="small" onClick={() => toggleComments(entry.id)}>
                                {showComments[entry.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {showComments[entry.id] && (
                        <Box sx={{ mt: 2 }}>
                          {entry.comments && entry.comments.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {entry.comments
                                .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)))
                                .map(comment => {
                                  const { icon, color } = getCommentIconAndColor(comment.type);
                                  return (
                                    <Paper key={comment.id} elevation={1} sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
                                      <Box display="flex" alignItems="flex-start" gap={1}>
                                        <Tooltip title={commentTypeDisplayNames[comment.type] || comment.type}>
                                          <span style={{ color: color, marginTop: '2px' }}>{icon}</span>
                                        </Tooltip>
                                        <Box flex={1}>
                                          <Typography variant="body2">
                                            {comment.comment_text}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Por {comment.author_name || 'Desconocido'} el {dayjs(comment.created_at).format('LLL')}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Paper>
                                  );
                                })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No hay observaciones para este empleo.</Typography>
                          )}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Card>
              ))
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryPopup(false)} color='secondary'>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup para Log de Seguimiento */}
      <Dialog open={openTrackingPopup} onClose={() => setOpenTrackingPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Log de Seguimiento
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Historial de observaciones y seguimiento del empleo del candidato.
          </Typography>

          {trackingComments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {trackingComments.map((comment, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {comment.job_title} - {comment.company}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(comment.created_at).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      </Box>
                      <Chip
                        label={getCommentTypeLabel(comment.type)}
                        color={getCommentTypeColor(comment.type)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body1">
                      {comment.comment_text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Por: {comment.author_name || 'Usuario Desconocido'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No hay observaciones de seguimiento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Las observaciones aparecerán cuando se agreguen al historial de empleo
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrackingPopup(false)} color='secondary'>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup para Ficha Laboral */}
      <Dialog open={openProfilePopup} onClose={() => setOpenProfilePopup(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Ficha de Información Laboral
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información Personal
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Nombre:</strong> {candidateProfile.nombre_completo}</Typography>
                    <Typography><strong>CURP:</strong> {candidateProfile.curp || 'No especificado'}</Typography>
                    <Typography><strong>RFC:</strong> {candidateProfile.rfc || 'No especificado'}</Typography>
                    <Typography><strong>NSS:</strong> {candidateProfile.nss || 'No especificado'}</Typography>
                    <Typography><strong>Teléfono:</strong> {formatCanonicalPhoneNumber(candidateProfile.phone_number) || 'No especificado'}</Typography>
                    <Typography><strong>Email:</strong> {candidateProfile.user.email}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Datos Médicos
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Discapacidad:</strong> {candidateProfile.disability_name}</Typography>
                    <Typography><strong>Tipo de Sangre:</strong> {candidateProfile.blood_type || 'No especificado'}</Typography>
                    <Typography><strong>Alergias:</strong> {candidateProfile.allergies || 'No especificado'}</Typography>
                    <Typography><strong>Restricciones Dietéticas:</strong> {candidateProfile.dietary_restrictions || 'No especificado'}</Typography>
                    <Typography><strong>Restricciones Físicas:</strong> {candidateProfile.physical_restrictions || 'No especificado'}</Typography>
                    <Typography><strong>Presenta convulsiones:</strong> {candidateProfile.has_seizures ? 'Sí' : 'No'}</Typography>
                    <Typography><strong>Medicamentos:</strong> {candidateProfile.medications?.length ? candidateProfile.medications.map(m => m.name).join(', ') : 'N/A'}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfilePopup(false)} color='secondary'>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Job History Edit/Add Dialog */}
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
              disabled={!!editingJobHistoryEntry}
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
            disabled={!!editingJobHistoryEntry}
          />
          <DatePicker
            label="Fecha Fin"
            value={jobHistoryFormData.end_date}
            onChange={v => setJobHistoryFormData(d => ({ ...d, end_date: v }))}
            slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJobHistoryDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitJobHistoryForm}>
            {editingJobHistoryEntry ? 'Guardar Cambios' : 'Agregar Historial'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Comment Add Dialog */}
      <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Añadir Observación a Historial</DialogTitle>
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
            Añadir Observación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={confirmDelete}
      />

      {/* Job Assignment Modal */}
      <AssignJobModal
        open={assignOpen}
        candidate={candidateProfile}
        availableJobs={availableJobs}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          setAssignOpen(false);
          fetchAll();
        }}
      />

      {/* Job Removal Modal */}
      <RemoveJobModal
        open={removeOpen}
        candidate={candidateProfile}
        onClose={() => setRemoveOpen(false)}
        onRemoved={() => {
          setRemoveOpen(false);
          fetchAll();
        }}
      />

      <MapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        lat={(() => {
          const currentJob = employmentHistory.find(h => !h.end_date && candidateProfile?.current_job?.id === h.job?.id);
          return currentJob?.job?.location_details?.address_lat;
        })()}
        lng={(() => {
          const currentJob = employmentHistory.find(h => !h.end_date && candidateProfile?.current_job?.id === h.job?.id);
          return currentJob?.job?.location_details?.address_lng;
        })()}
        label="Ubicación del Empleo"
      />
    </Box>
  );
};

// Componente para evaluar habilidades del candidato
const CandidateHabilidadForm = ({ habilidades, candidateHabilidades, onSave }) => {
  const [selectedHabilidad, setSelectedHabilidad] = useState(null);
  const [nivelCompetencia, setNivelCompetencia] = useState('basico');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  // Filtrar habilidades que no están ya evaluadas
  const habilidadesDisponibles = habilidades.filter(h =>
    !candidateHabilidades.some(ch => ch.habilidad === h.id)
  );

  const handleSave = async () => {
    if (!selectedHabilidad) return;

    setSaving(true);
    try {
      await onSave(selectedHabilidad.id, nivelCompetencia, observaciones);
      setSelectedHabilidad(null);
      setNivelCompetencia('basico');
      setObservaciones('');
    } catch (error) {
      console.error('Error al guardar habilidad:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Agregar Nueva Habilidad
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <Autocomplete
          options={habilidadesDisponibles}
          getOptionLabel={(option) => `${option.nombre} (${option.categoria})`}
          value={selectedHabilidad}
          onChange={(event, newValue) => setSelectedHabilidad(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Habilidad"
              placeholder="Buscar habilidad..."
              size="small"
              sx={{ minWidth: 250 }}
            />
          )}
          disabled={saving}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Nivel</InputLabel>
          <Select
            value={nivelCompetencia}
            label="Nivel"
            onChange={(e) => setNivelCompetencia(e.target.value)}
            disabled={saving}
          >
            <MenuItem value="basico">Básico</MenuItem>
            <MenuItem value="intermedio">Intermedio</MenuItem>
            <MenuItem value="avanzado">Avanzado</MenuItem>
            <MenuItem value="experto">Experto</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedHabilidad || saving}
          size="small"
        >
          {saving ? 'Guardando...' : 'Agregar'}
        </Button>
      </Box>

      <TextField
        fullWidth
        size="small"
        label="Observaciones (opcional)"
        multiline
        rows={2}
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        disabled={saving}
        placeholder="Notas adicionales sobre esta habilidad..."
      />
    </Box>
  );
};

export default EmploymentDashboard;
