import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Grid,
} from "@mui/material";
import dayjs from "dayjs";
import {
    CheckCircle,
    Cancel,
    RadioButtonChecked,
    RadioButtonUnchecked,
    Person,
    Home,
    Phone,
    MedicalInformation,
    Image as ImageIcon,
    Assignment,
    LocalHospital,
    Medication,
    Bloodtype,
} from "@mui/icons-material";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import api from "../../api";

// Medical Data Renderer Component
const MedicalDataRenderer = ({ usuarioId, responseData }) => {
    const [medicalData, setMedicalData] = useState(null);
    const [medicalDataDetails, setMedicalDataDetails] = useState(null);
    const [disabilities, setDisabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMedicalData = async () => {
            try {
                setLoading(true);
                
                // Fetch candidate profile data
                const profileResponse = await api.get(`/api/candidatos/profiles/${usuarioId}/`);
                const profileData = profileResponse.data;
                
                // Fetch disabilities data to get names
                const disabilitiesResponse = await api.get("/api/discapacidad/disabilities/");
                const disabilitiesData = disabilitiesResponse.data;
                
                setMedicalData(profileData);
                setDisabilities(disabilitiesData);
                setMedicalDataDetails(responseData);
            } catch (err) {
                console.error("Error fetching medical data:", err);
                setError("Error al cargar los datos médicos");
            } finally {
                setLoading(false);
            }
        };

        if (usuarioId) {
            fetchMedicalData();
        }
    }, [usuarioId, responseData]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Cargando datos médicos...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 1 }}>
                {error}
            </Alert>
        );
    }

    if (!medicalData) {
        return (
            <Typography variant="body2" color="text.secondary">
                No se encontraron datos médicos
            </Typography>
        );
    }

    const getDisabilityNames = (disabilityIds) => {
        if (!Array.isArray(disabilityIds) || disabilityIds.length === 0) return [];
        return disabilityIds.map(id => {
            const disability = disabilities.find(d => d.id === id);
            return disability ? disability.name : `ID: ${id}`;
        });
    };

    const formatYesNo = (value) => {
        if (value === true) return "Sí";
        if (value === false) return "No";
        return "No especificado";
    };

    const formatSelectValue = (value, options) => {
        if (!value) return "No especificado";
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value;
    };

    const pensionOptions = [
        { value: "No", label: "No recibe pensión" },
        { value: "Bie", label: "Sí, del Bienestar" },
        { value: "Orf", label: "Sí, de orfandad" },
        { value: "Otr", label: "Sí, otra" }
    ];

    const socialSecurityOptions = [
        { value: "NINGUNO", label: "Ninguno" },
        { value: "IMSS", label: "IMSS" },
        { value: "ISSSTE", label: "ISSSTE" },
        { value: "PEMEX", label: "PEMEX" },
        { value: "IMSS-BIENESTAR", label: "IMSS-Bienestar" },
        { value: "PARTICULAR", label: "Particular" },
        { value: "OTRO", label: "Otro" }
    ];

    return (
        <Box>
            <Grid container spacing={1}>
                {/* Disabilities */}
                {medicalData.disability && medicalData.disability.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                <MedicalInformation sx={{ fontSize: 16, mr: 1 }} />
                                Discapacidades:
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {getDisabilityNames(medicalData.disability).map((name, index) => (
                                    <Chip
                                        key={index}
                                        label={name}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Grid>
                )}

                {/* Basic Medical Info */}
                <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell><strong>Certificado de discapacidad:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.has_disability_certificate)}</TableCell>
                                </TableRow>
                                { medicalData.has_disability_certificate && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{medicalDataDetails.disability_certificate_details}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Discapacidad en la Familia:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalDataDetails.has_disability_history)}</TableCell>
                                </TableRow>
                                { medicalData.has_disability_certificate && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{medicalDataDetails.disability_history_details}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Juicio de interdicción:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.has_interdiction_judgment)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Pensión del gobierno:</strong></TableCell>
                                    <TableCell>{formatSelectValue(medicalData.receives_pension, pensionOptions)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Seguridad social:</strong></TableCell>
                                    <TableCell>{formatSelectValue(medicalData.social_security, socialSecurityOptions)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Care and Treatment */}
                <Grid item xs={12} md={6}>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell><strong>Tipo de sangre:</strong></TableCell>
                                    <TableCell>{medicalData.blood_type || "No especificado"}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Atención psicológica:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.receives_psychological_care)}</TableCell>
                                </TableRow>
                                { medicalData.receives_psychological_care && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{medicalDataDetails.psychological_care_details}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Atención psiquiátrica:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.receives_psychiatric_care)}</TableCell>
                                </TableRow>
                                { medicalData.receives_psychiatric_care && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{medicalDataDetails.psychiatric_care_details}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Presenta convulsiones:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.has_seizures)}</TableCell>
                                </TableRow>
                                { medicalData.has_seizures && (
                                    <TableRow>
                                        <TableCell>Última convulsión:</TableCell>
                                        <TableCell>{medicalDataDetails.last_seizure}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Medications */}
                {medicalData.medications && medicalData.medications.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                <Medication sx={{ fontSize: 16, mr: 1 }} />
                                Medicamentos:
                            </Typography>
                            <List dense>
                                {medicalData.medications.map((med, index) => (
                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                        <ListItemText
                                            primary={`${med.name || "Sin nombre"} - ${med.dose || "Sin dosis"}`}
                                            secondary={med.reason || "Sin motivo especificado"}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Grid>
                )}

                {/* Additional Info */}
                {(medicalData.allergies || medicalData.dietary_restrictions || medicalData.physical_restrictions) && (
                    <Grid item xs={12}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableBody>
                                    {medicalData.allergies && (
                                        <TableRow>
                                            <TableCell><strong>Alergias:</strong></TableCell>
                                            <TableCell>{medicalData.allergies}</TableCell>
                                        </TableRow>
                                    )}
                                    {medicalData.dietary_restrictions && (
                                        <TableRow>
                                            <TableCell><strong>Restricciones alimentarias:</strong></TableCell>
                                            <TableCell>{medicalData.dietary_restrictions}</TableCell>
                                        </TableRow>
                                    )}
                                    {medicalData.physical_restrictions && (
                                        <TableRow>
                                            <TableCell><strong>Restricciones físicas:</strong></TableCell>
                                            <TableCell>{medicalData.physical_restrictions}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}
            </Grid>

            {/* Status Indicator */}
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="caption" color="success.main">
                    Datos médicos actualizados en el sistema
                </Typography>
            </Box>
        </Box>
    );
};

const ReportQuestionRenderer = ({ pregunta, respuesta, usuario }) => {
    // Helper function to format response text
    const formatRespuestaTexto = (respuesta) => {
        try {
            // console.log("🔍 Debug - ReportQuestionRenderer respuesta:", respuesta);
            if (!respuesta.respuesta) return "Sin respuesta";

            const responseData = respuesta.respuesta;
            const questionType = respuesta.tipo_pregunta; // Use tipo_pregunta from response

            // Handle different question types based on actual API structure
            switch (questionType) {
                case "abierta":
                    if (typeof responseData === "string") return responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        return responseData.texto || responseData.valor_original || String(responseData);
                    }
                    return String(responseData);

                case "binaria":
                    if (responseData === "0" || responseData === 0 || responseData === false) return "No";
                    if (responseData === "1" || responseData === 1 || responseData === true) return "Sí";
                    return String(responseData);

                case "multiple":
                case "dropdown":
                    // For these types, the API returns the actual text directly
                    if (typeof responseData === "string") return responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        return responseData.texto || responseData.valor_original || String(responseData);
                    }
                    return String(responseData);

                case "checkbox":
                    if (Array.isArray(responseData)) {
                        return responseData.map(item => {
                            if (typeof item === "object" && item !== null) {
                                return item.texto || item.valor_original || String(item);
                            }
                            return String(item);
                        }).join(", ");
                    }
                    return String(responseData);

                case "numero":
                case "numero_telefono":
                    if (typeof responseData === "string") return responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        return responseData.texto || responseData.valor_original || String(responseData);
                    }
                    return String(responseData);

                case "fecha":
                    if (typeof responseData === "object" && responseData !== null) {
                        // Handle complex fecha structure like {"fecha": "2025-08-04T06:00:00.000Z", "formato": "YYYY-MM-DD", "valor_original": {...}}
                        const fechaValue = responseData.fecha || responseData.valor_original?.fecha || responseData.valor_original;
                        if (fechaValue) {
                            const fecha = dayjs(fechaValue);
                            return fecha.isValid() ? fecha.format('DD [de] MMMM [de] YYYY') : "Fecha inválida";
                        }
                    }
                    if (responseData) {
                        const fecha = dayjs(responseData);
                        return fecha.isValid() ? fecha.format('DD [de] MMMM [de] YYYY') : "Fecha inválida";
                    }
                    return "Sin fecha";

                case "fecha_hora":
                    if (typeof responseData === "object" && responseData !== null) {
                        const fechaValue = responseData.fecha || responseData.valor_original?.fecha || responseData.valor_original;
                        if (fechaValue) {
                            const fechaHora = dayjs(fechaValue);
                            return fechaHora.isValid() ? fechaHora.format('DD [de] MMMM [de] YYYY [a las] HH:mm') : "Fecha y hora inválida";
                        }
                    }
                    if (responseData) {
                        const fechaHora = dayjs(responseData);
                        return fechaHora.isValid() ? fechaHora.format('DD [de] MMMM [de] YYYY [a las] HH:mm') : "Fecha y hora inválida";
                    }
                    return "Sin fecha y hora";

                case "sis":
                case "sis2":
                    if (typeof responseData === "object" && responseData !== null) {
                        const parts = [];
                        if (responseData.frecuencia !== undefined) parts.push(`Frecuencia: ${responseData.frecuencia}`);
                        if (responseData.tiempo_apoyo !== undefined) parts.push(`Tiempo de apoyo: ${responseData.tiempo_apoyo}`);
                        if (responseData.tipo_apoyo !== undefined) parts.push(`Tipo de apoyo: ${responseData.tipo_apoyo}`);
                        return parts.length > 0 ? parts.join(" | ") : "Sin respuesta";
                    }
                    return String(responseData);

                case "datos_personales":
                case "datos_domicilio":
                case "contactos":
                case "datos_medicos":
                    if (typeof responseData === "object" && responseData !== null) {
                        return responseData.texto || "Datos actualizados";
                    }
                    return "Datos actualizados";

                default:
                    // Generic handling for any other type
                    if (typeof responseData === "string") return responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        return responseData.texto || responseData.valor_original || JSON.stringify(responseData);
                    }
                    return String(responseData);
            }
        } catch (error) {
            console.error("Error al procesar respuesta:", error, respuesta);
            return `Error: ${JSON.stringify(respuesta.respuesta)}`;
        }
    };

    // Get question type icon
    const getQuestionTypeIcon = (tipo) => {
        switch (tipo) {
            case "datos_personales":
                return <Person color="primary" />;
            case "datos_domicilio":
                return <Home color="primary" />;
            case "contactos":
                return <Phone color="primary" />;
            case "datos_medicos":
                return <MedicalInformation color="primary" />;
            case "imagen":
                return <ImageIcon color="primary" />;
            case "canalizacion":
            case "canalizacion_centro":
                return <Assignment color="primary" />;
            case "numero_telefono":
                return <Phone color="primary" />;
            case "abierta":
                return <Assignment color="primary" />;
            case "multiple":
            case "dropdown":
                return <Assignment color="primary" />;
            case "fecha":
                return <Assignment color="primary" />;
            default:
                return <Assignment color="primary" />;
        }
    };

    // Render different question types
    const renderQuestionContent = () => {
        const respuestaTexto = formatRespuestaTexto(respuesta);
        const responseData = respuesta.respuesta;
        const questionType = respuesta.tipo_pregunta; // Use tipo_pregunta from response

        switch (questionType) {
            case "binaria":
                const isTrueResponse = responseData === "1" || responseData === 1 || responseData === true;
                return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isTrueResponse ? (
                            <CheckCircle color="success" />
                        ) : (
                            <Cancel color="error" />
                        )}
                        <Typography variant="body1" fontWeight="medium">
                            {isTrueResponse ? "Sí" : "No"}
                        </Typography>
                    </Box>
                );

            case "multiple":
            case "dropdown":
                return (
                    <Box>
                        <Chip
                            label={String(respuestaTexto)}
                            color="primary"
                            variant="outlined"
                            icon={<RadioButtonChecked />}
                        />
                    </Box>
                );

            case "checkbox":
                let opciones = [];
                if (Array.isArray(responseData)) {
                    opciones = responseData.map(item => {
                        if (typeof item === "object" && item !== null) {
                            return item.texto || item.valor_original || String(item);
                        }
                        return String(item);
                    });
                }
                return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {opciones.map((opcion, index) => (
                            <Chip
                                key={index}
                                label={String(opcion)}
                                color="primary"
                                variant="outlined"
                                size="small"
                            />
                        ))}
                    </Box>
                );

            case "sis":
            case "sis2":
                if (typeof responseData === "object" && responseData !== null) {
                    const { frecuencia, tiempo_apoyo, tipo_apoyo, subitems, observaciones } = responseData;
                    return (
                        <Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Frecuencia:</strong></TableCell>
                                            <TableCell>{frecuencia !== undefined ? frecuencia : "N/A"}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Tiempo de apoyo:</strong></TableCell>
                                            <TableCell>{tiempo_apoyo !== undefined ? tiempo_apoyo : "N/A"}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Tipo de apoyo:</strong></TableCell>
                                            <TableCell>{tipo_apoyo !== undefined ? tipo_apoyo : "N/A"}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {subitems && Array.isArray(subitems) && subitems.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Apoyos necesarios:
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {subitems.map((subitem, index) => (
                                            <Chip
                                                key={index}
                                                label={String(subitem.texto || subitem.sub_item || subitem.valor_original || subitem)}
                                                color="secondary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {observaciones && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Observaciones:
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        backgroundColor: "grey.100",
                                        p: 1,
                                        borderRadius: 1,
                                        whiteSpace: "pre-wrap"
                                    }}>
                                        {String(observaciones)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    );
                }
                return <Typography>{String(respuestaTexto)}</Typography>;

            case "fecha":
                if (responseData) {
                    let fechaValue = responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        fechaValue = responseData.fecha || responseData.valor_original?.fecha || responseData.valor_original;
                    }
                    const fecha = dayjs(fechaValue);
                    return (
                        <Typography variant="body1">
                            {fecha.isValid() ? fecha.format('DD [de] MMMM [de] YYYY') : "Fecha inválida"}
                        </Typography>
                    );
                }
                return <Typography>Sin fecha</Typography>;

            case "fecha_hora":
                if (responseData) {
                    let fechaValue = responseData;
                    if (typeof responseData === "object" && responseData !== null) {
                        fechaValue = responseData.fecha || responseData.valor_original?.fecha || responseData.valor_original;
                    }
                    const fechaHora = dayjs(fechaValue);
                    return (
                        <Typography variant="body1">
                            {fechaHora.isValid() ? fechaHora.format('DD [de] MMMM [de] YYYY [a las] HH:mm') : "Fecha y hora inválida"}
                        </Typography>
                    );
                }
                return <Typography>Sin fecha y hora</Typography>;

            case "numero":
            case "numero_telefono":
                return (
                    <Typography variant="body1" fontWeight="medium">
                        {formatCanonicalPhoneNumber(String(respuesta.respuesta.texto || ""))}
                    </Typography>
                );

            case "abierta":
                return (
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {String(respuesta.respuesta.texto || "")}
                    </Typography>
                );

            case "imagen":
                return (
                    <Chip
                        icon={<ImageIcon />}
                        label={responseData ? "Imagen subida" : "Sin imagen"}
                        color={responseData ? "success" : "default"}
                        variant="outlined"
                    />
                );

            case "datos_personales":
            case "datos_domicilio":
            case "contactos":
                return (
                    <Chip
                        icon={<CheckCircle />}
                        label="Datos actualizados en el sistema"
                        color="success"
                        variant="outlined"
                    />
                );

            case "datos_medicos":
                return <MedicalDataRenderer usuarioId={usuario.id} responseData={responseData} />;

            case "canalizacion":
                return (
                    <Typography variant="body1" sx={{
                        // backgroundColor: "info.light",
                        p: 1,
                        borderRadius: 1,
                        // color: "info.contrastText"
                    }}>
                        {(() => {
                            const etiquetas = {
                                Ent: "Entrevista",
                                Cap: "Capacitación",
                                Agn: "Agencia",
                            };
                            try {
                                const data = JSON.parse(respuestaTexto);
                                if (data.stage || data.explicacion) {
                                    const stageName = etiquetas[data.stage] || data.stage;
                                    return `Etapa: ${stageName} | Explicación: ${data.explicacion || "N/A"}`;
                                }
                                return "No data available.";
                            } catch (e) {
                                return respuestaTexto;
                            }
                        })()}
                    </Typography>
                );
            case "canalizacion_centro":
                return (
                    <Typography variant="body1" sx={{
                        p: 1,
                        borderRadius: 1,
                    }}>
                        {(() => {
                            try {
                                const data = JSON.parse(respuestaTexto);
                                if (data.center_id || data.center_name) {
                                    return `Centro: ${data.center_name || "N/A"}`;
                                }
                                return "No data available.";
                            } catch (e) {
                                return respuestaTexto;
                            }
                        })()}
                    </Typography>
                );

            case "meta":
                return (
                    <Typography variant="body1" sx={{
                        backgroundColor: "primary.light",
                        p: 1,
                        borderRadius: 1,
                        color: "primary.contrastText"
                    }}>
                        {String(respuestaTexto)}
                    </Typography>
                );

            default:
                return (
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {String(respuestaTexto)}
                    </Typography>
                );
        }
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                    {getQuestionTypeIcon(respuesta.tipo_pregunta)}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            {pregunta.texto}
                        </Typography>

                        {pregunta.descripcion && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {pregunta.descripcion}
                            </Typography>
                        )}

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Chip
                                label={respuesta.tipo_pregunta}
                                size="small"
                                variant="outlined"
                                color="secondary"
                            />
                            {pregunta.obligatoria && (
                                <Chip
                                    label="Obligatoria"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ pl: 5 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Respuesta:
                    </Typography>
                    {renderQuestionContent()}
                </Box>

                {respuesta.fecha_respuesta && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary">
                            Respondido el: {new Date(respuesta.fecha_respuesta).toLocaleString('es-ES')}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ReportQuestionRenderer;