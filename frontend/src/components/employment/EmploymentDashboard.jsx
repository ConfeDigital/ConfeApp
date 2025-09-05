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
  Grid,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  WorkOutline as WorkIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const EmploymentDashboard = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Estados principales
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openJobAssignment, setOpenJobAssignment] = useState(false);
  const [openAptitudeTest, setOpenAptitudeTest] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [aptitudeQuestionnaires, setAptitudeQuestionnaires] = useState([]);
  const [stageQuestionnaires, setStageQuestionnaires] = useState([]);
  const [trackingComments, setTrackingComments] = useState([]);
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [selectedJobHistory, setSelectedJobHistory] = useState(null);
  
  // Estados para popups
  const [openAgencyPopup, setOpenAgencyPopup] = useState(false);
  const [openHistoryPopup, setOpenHistoryPopup] = useState(false);
  const [openTrackingPopup, setOpenTrackingPopup] = useState(false);
  const [openProfilePopup, setOpenProfilePopup] = useState(false);

  // Estados para formularios
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

  // Cargar datos del candidato
  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/candidatos/profiles/${uid}/`);
        setCandidateProfile(response.data);
        
        // Cargar historial de empleo
        await fetchEmploymentHistory();
        
        // Cargar cuestionarios de aptitudes
        await fetchAptitudeQuestionnaires();
        
        // Cargar cuestionarios por etapa
        await fetchStageQuestionnaires();
        
        // Cargar comentarios de seguimiento
        await fetchTrackingComments();
      } catch (error) {
        console.error("Error loading candidate data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchCandidateData();
    }
  }, [uid]);

  const fetchEmploymentHistory = async () => {
    try {
      const response = await axios.get(`/api/candidatos/historial-empleos/?candidate=${uid}`);
      setEmploymentHistory(response.data.results || response.data);
    } catch (error) {
      console.error("Error loading employment history:", error);
      // Si no hay historial, establecer array vacío
      setEmploymentHistory([]);
    }
  };

  const fetchAptitudeQuestionnaires = async () => {
    try {
      const response = await axios.get(`/api/cuestionarios/`);
      // Filtrar cuestionarios de aptitudes (puedes ajustar este filtro según tu lógica)
      const aptitudeQuestionnaires = response.data.filter(q => 
        q.title && (
          q.title.toLowerCase().includes('aptitud') || 
          q.title.toLowerCase().includes('competencia') ||
          q.title.toLowerCase().includes('habilidad')
        )
      );
      setAptitudeQuestionnaires(aptitudeQuestionnaires);
    } catch (error) {
      console.error("Error loading aptitude questionnaires:", error);
      setAptitudeQuestionnaires([]);
    }
  };

  const fetchStageQuestionnaires = async () => {
    try {
      const response = await axios.get(`/api/cuestionarios/usuario/${uid}/cuestionarios-con-respuestas/`);
      // Filtrar cuestionarios de la etapa Agencia
      const agencyQuestionnaires = response.data.filter(q => 
        q.estado_desbloqueo === 'Agn' && q.activo
      );
      setStageQuestionnaires(agencyQuestionnaires);
    } catch (error) {
      console.error("Error loading stage questionnaires:", error);
      setStageQuestionnaires([]);
    }
  };

  const fetchTrackingComments = async () => {
    try {
      // Obtener todos los comentarios de los trabajos del candidato
      const allComments = [];
      for (const job of employmentHistory) {
        if (job.comments && job.comments.length > 0) {
          allComments.push(...job.comments.map(comment => ({
            ...comment,
            job_title: job.job?.name || job.position,
            company: job.job?.company?.name || job.company
          })));
        }
      }
      // Ordenar por fecha de creación (más recientes primero)
      allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTrackingComments(allComments);
    } catch (error) {
      console.error("Error loading tracking comments:", error);
      setTrackingComments([]);
    }
  };

  // Efecto para cargar comentarios cuando cambie el historial de empleo
  useEffect(() => {
    if (employmentHistory.length > 0) {
      fetchTrackingComments();
    }
  }, [employmentHistory]);

  const handleJobAssignment = async () => {
    try {
      // Usar el endpoint de historial de empleos para crear un nuevo trabajo
      await axios.post(`/api/candidatos/historial-empleos/`, {
        ...newJob,
        candidate: uid
      });
      await fetchEmploymentHistory();
      setOpenJobAssignment(false);
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

  const handleAptitudeTest = (questionnaireId) => {
    navigate(`/candidatos/${uid}/${questionnaireId}`);
  };

  const handleAddComment = (jobHistoryId) => {
    setSelectedJobHistory(jobHistoryId);
    setOpenCommentDialog(true);
  };

  const handleSubmitComment = async () => {
    try {
      await axios.post(`/api/candidatos/employment/comments/${selectedJobHistory}/`, newComment);
      await fetchEmploymentHistory();
      await fetchTrackingComments();
      setOpenCommentDialog(false);
      setNewComment({ comment_text: "", type: "info" });
      setSelectedJobHistory(null);
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

  const getDisabilityDisplay = (disabilities) => {
    if (!disabilities || disabilities.length === 0) return "No especificada";
    return disabilities.map(d => d.name).join(", ");
  };

  const getGenderDisplay = (gender) => {
    const genderMap = {
      'M': 'Masculino',
      'F': 'Femenino',
      'O': 'Otro'
    };
    return genderMap[gender] || 'No especificado';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando dashboard de empleo...</Typography>
      </Box>
    );
  }

  if (!candidateProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">No se pudo cargar la información del candidato</Typography>
      </Box>
    );
  }

  const tabs = [
    { label: "Etapa Agencia", icon: <AssignmentIcon /> },
    { label: "Asignar Trabajo", icon: <WorkIcon /> },
    { label: "Historial", icon: <HistoryIcon /> },
    { label: "Log de Seguimiento", icon: <HistoryIcon /> },
    { label: "Ficha Laboral", icon: <PersonIcon /> },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con información básica del candidato */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={candidateProfile.photo}
              sx={{ 
                width: 80, 
                height: 80, 
                fontSize: '2rem'
              }}
            >
              {!candidateProfile.photo && candidateProfile.user.first_name.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {candidateProfile.user.first_name} {candidateProfile.user.last_name} {candidateProfile.user.second_last_name || ''}
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Chip 
                  label={`Edad: ${candidateProfile.age || 'N/A'}`} 
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
                  label={`Discapacidad: ${getDisabilityDisplay(candidateProfile.disabilities)}`} 
                  variant="outlined" 
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`Etapa: ${candidateProfile.stage}`} 
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
            startIcon={<AssignmentIcon />}
            onClick={() => setOpenAgencyPopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Etapa Agencia
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<WorkIcon />}
            onClick={() => setOpenJobAssignment(true)}
            sx={{ minWidth: "140px" }}
          >
            Asignar Trabajo
          </Button>
          
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
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<HistoryIcon />}
            onClick={() => setOpenTrackingPopup(true)}
            sx={{ minWidth: "140px" }}
          >
            Log de Seguimiento
          </Button>
        </Box>
      </Box>

      {/* Popup para Etapa Agencia */}
      <Dialog open={openAgencyPopup} onClose={() => setOpenAgencyPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Etapa Agencia - Cuestionarios Disponibles
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Complete los cuestionarios de la etapa Agencia para evaluar las competencias del candidato.
          </Typography>
          
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
          <Button onClick={() => setOpenAgencyPopup(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup para Historial */}
      <Dialog open={openHistoryPopup} onClose={() => setOpenHistoryPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Historial de Empleo
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {employmentHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Puesto</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Fin</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employmentHistory.map((job, index) => (
                    <TableRow key={index}>
                      <TableCell>{job.position}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{dayjs(job.start_date).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{job.end_date ? dayjs(job.end_date).format('DD/MM/YYYY') : 'Actual'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={job.status === 'active' ? 'Activo' : 'Finalizado'} 
                          color={job.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Agregar Comentario">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleAddComment(job.id)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No hay historial de empleo registrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asigne el primer trabajo al candidato
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryPopup(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup para Log de Seguimiento */}
      <Dialog open={openTrackingPopup} onClose={() => setOpenTrackingPopup(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Log de Seguimiento
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Historial de comentarios y seguimiento del empleo del candidato.
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
                No hay comentarios de seguimiento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los comentarios aparecerán cuando se agreguen al historial de empleo
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrackingPopup(false)}>Cerrar</Button>
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
                    <Typography><strong>Nombre:</strong> {candidateProfile.user.first_name} {candidateProfile.user.last_name}</Typography>
                    <Typography><strong>CURP:</strong> {candidateProfile.curp || 'No especificado'}</Typography>
                    <Typography><strong>Teléfono:</strong> {candidateProfile.phone || 'No especificado'}</Typography>
                    <Typography><strong>Email:</strong> {candidateProfile.user.email}</Typography>
                    <Typography><strong>Discapacidad:</strong> {getDisabilityDisplay(candidateProfile.disabilities)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información Laboral Actual
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {employmentHistory.find(job => job.status === 'active') ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography><strong>Puesto:</strong> {employmentHistory.find(job => job.status === 'active').position}</Typography>
                      <Typography><strong>Empresa:</strong> {employmentHistory.find(job => job.status === 'active').company}</Typography>
                      <Typography><strong>Fecha Inicio:</strong> {dayjs(employmentHistory.find(job => job.status === 'active').start_date).format('DD/MM/YYYY')}</Typography>
                      <Typography><strong>Descripción:</strong> {employmentHistory.find(job => job.status === 'active').description || 'No especificada'}</Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      No hay empleo activo asignado
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfilePopup(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para asignar trabajo */}
      <Dialog open={openJobAssignment} onClose={() => setOpenJobAssignment(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Asignar Nuevo Trabajo
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Puesto"
                value={newJob.position}
                onChange={(e) => setNewJob({ ...newJob, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Empresa"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                value={newJob.start_date}
                onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Fin"
                type="date"
                value={newJob.end_date}
                onChange={(e) => setNewJob({ ...newJob, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={newJob.status}
                  onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="completed">Completado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Trabajo"
                multiline
                rows={3}
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJobAssignment(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleJobAssignment}>
            Asignar Trabajo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar comentarios */}
      <Dialog open={openCommentDialog} onClose={() => setOpenCommentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Agregar Comentario de Seguimiento
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Comentario</InputLabel>
                <Select
                  value={newComment.type}
                  onChange={(e) => setNewComment({ ...newComment, type: e.target.value })}
                >
                  <MenuItem value="info">Información</MenuItem>
                  <MenuItem value="success">Éxito</MenuItem>
                  <MenuItem value="warning">Advertencia</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentario"
                multiline
                rows={4}
                value={newComment.comment_text}
                onChange={(e) => setNewComment({ ...newComment, comment_text: e.target.value })}
                placeholder="Escriba su comentario de seguimiento aquí..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitComment}
            disabled={!newComment.comment_text.trim()}
          >
            Agregar Comentario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmploymentDashboard;
