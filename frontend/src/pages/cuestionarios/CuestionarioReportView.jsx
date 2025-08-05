import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import api from "../../api";
import ReportQuestionRenderer from "./ReportQuestionRenderer";

const CuestionarioReportView = ({
    usuarioId,
    cuestionariosFinalizados,
    onClose
}) => {
    const [selectedCuestionarioId, setSelectedCuestionarioId] = useState("");
    const [cuestionarioData, setCuestionarioData] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [groupedQuestions, setGroupedQuestions] = useState({});

    useEffect(() => {
        const fetchUsuario = async () => {
            if (usuarioId) {
                try {
                    const response = await api.get(`/api/usuarios/${usuarioId}/`);
                    setUsuario(response.data);
                } catch (error) {
                    console.error("Error fetching user:", error);
                }
            }
        };
        fetchUsuario();
    }, [usuarioId]);

    useEffect(() => {
        if (cuestionariosFinalizados.length === 1 && !selectedCuestionarioId) {
            const cuestionarioId = cuestionariosFinalizados[0].id;
            setSelectedCuestionarioId(cuestionarioId);
            fetchCuestionarioData(cuestionarioId);
        }
    }, [cuestionariosFinalizados, selectedCuestionarioId]);

    const fetchCuestionarioData = async (cuestionarioId) => {
        if (!cuestionarioId || !usuarioId) return;

        setLoading(true);
        try {
            const cuestionarioResponse = await api.get(`/api/cuestionarios/${cuestionarioId}/`);
            setCuestionarioData(cuestionarioResponse.data);

            const respuestasResponse = await api.get(
                `/api/cuestionarios/usuario/respuestas-unlocked-path/?cuestionario_id=${cuestionarioId}&usuario_id=${usuarioId}`
            );
            // console.log("🔍 Debug - Respuestas Response:", respuestasResponse.data);
            setRespuestas(respuestasResponse.data);

            groupQuestionsBySection(cuestionarioResponse.data.preguntas, respuestasResponse.data);

        } catch (error) {
            console.error("Error fetching questionnaire data:", error);
        } finally {
            setLoading(false);
        }
    };

    const groupQuestionsBySection = (preguntas, respuestasData) => {
        // console.log("🔍 Debug - Respuestas Data length:", respuestasData.length);

        const respuestasMap = new Map();
        respuestasData.forEach(r => {
            const questionId = r.pregunta_id || r.pregunta || r.question_id || r.id;
            if (questionId) {
                respuestasMap.set(questionId, r);
            }
        });

        // console.log("🔍 Debug - Respuestas Map size:", respuestasMap.size);

        // Just create a single section with all questions in order
        const questionsWithResponses = preguntas
            .map(pregunta => {
                const respuesta = respuestasMap.get(pregunta.id);
                return respuesta ? { pregunta, respuesta } : null;
            })
            .filter(item => item !== null); // Only include answered questions

        const grouped = {
            "Todas las Preguntas": questionsWithResponses
        };

        // console.log("🔍 Debug - Grouped Questions:", grouped);
        setGroupedQuestions(grouped);
    };

    const handleCuestionarioChange = (event) => {
        const cuestionarioId = event.target.value;
        setSelectedCuestionarioId(cuestionarioId);
        fetchCuestionarioData(cuestionarioId);
    };



    const filteredSections = Object.entries(groupedQuestions).reduce((acc, [section, items]) => {
        if (!searchTerm) {
            acc[section] = items;
            return acc;
        }

        const filteredItems = items.filter(({ pregunta, respuesta }) =>
            pregunta.texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (respuesta.respuesta &&
                JSON.stringify(respuesta.respuesta).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filteredItems.length > 0) {
            acc[section] = filteredItems;
        }

        return acc;
    }, {});

    const totalQuestions = Object.values(groupedQuestions).reduce((sum, items) => sum + items.length, 0);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", m: 2 }}>
            {/* Header */}
            <Paper elevation={2} sx={{ p: 3, mb: 2, flexShrink: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <AssignmentIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            Reporte de Cuestionario
                        </Typography>
                    </Box>
                    <Button variant="outlined" onClick={onClose}>
                        Cerrar Reporte
                    </Button>
                </Box>

                {usuario && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <PersonIcon color="action" />
                        <Typography variant="h6">
                            {usuario.first_name} {usuario.last_name}
                        </Typography>
                    </Box>
                )}

                {/* Questionnaire Selector */}
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Seleccionar Cuestionario</InputLabel>
                            <Select
                                value={selectedCuestionarioId}
                                onChange={handleCuestionarioChange}
                                label="Seleccionar Cuestionario"
                            >
                                {cuestionariosFinalizados.map((cuestionario) => (
                                    <MenuItem key={cuestionario.id} value={cuestionario.id}>
                                        {cuestionario.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {cuestionarioData && (
                        <>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    placeholder="Buscar preguntas o respuestas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>


                        </>
                    )}
                </Grid>

                {cuestionarioData && (
                    <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Chip
                            icon={<QuestionAnswerIcon />}
                            label={`${totalQuestions} preguntas respondidas`}
                            color="primary"
                        />
                        {/* <Chip
                            label={`${Object.keys(filteredSections).length} secciones`}
                            variant="outlined"
                        /> */}
                    </Box>
                )}
            </Paper>

            {/* Content (Scrollable area) */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <Typography>Cargando datos del cuestionario...</Typography>
                    </Box>
                )}

                {!selectedCuestionarioId && !loading && (
                    <Card sx={{ textAlign: "center", p: 4 }}>
                        <CardContent>
                            <AssignmentIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                Selecciona un cuestionario para ver el reporte
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {cuestionarioData && !loading && (
                    <Box sx={{ pb: 2 }}>
                        {Object.entries(filteredSections).map(([section, items]) => (
                            <Box key={section}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    {items.map(({ pregunta, respuesta }, index) => (
                                        <ReportQuestionRenderer
                                            key={`${pregunta.id}-${index}`}
                                            pregunta={pregunta}
                                            respuesta={respuesta}
                                            usuario={usuario}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        ))}

                        {Object.keys(filteredSections).length === 0 && searchTerm && (
                            <Card sx={{ textAlign: "center", p: 4 }}>
                                <CardContent>
                                    <SearchIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        No se encontraron resultados para "{searchTerm}"
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default CuestionarioReportView;