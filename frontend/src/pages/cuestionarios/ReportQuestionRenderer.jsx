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
    HourglassEmpty,
    HighlightOff,
} from "@mui/icons-material";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import api from "../../api";
import ContactList from "../../components/candidate_create/ContactList";

// Constants
const PENSION_OPTIONS = [
    { value: "No", label: "No recibe pensión" },
    { value: "Bie", label: "Sí, del Bienestar" },
    { value: "Orf", label: "Sí, de orfandad" },
    { value: "Otr", label: "Sí, otra" }
];

const SOCIAL_SECURITY_OPTIONS = [
    { value: "NINGUNO", label: "Ninguno" },
    { value: "IMSS", label: "IMSS" },
    { value: "ISSSTE", label: "ISSSTE" },
    { value: "PEMEX", label: "PEMEX" },
    { value: "IMSS-BIENESTAR", label: "IMSS-Bienestar" },
    { value: "PARTICULAR", label: "Particular" },
    { value: "OTRO", label: "Otro" }
];

const CANALIZACION_STAGES = {
    Ent: "Entrevista",
    Cap: "Capacitación",
    Agn: "Agencia",
};

const CH_OPTIONS = [
    { value: "no_lo_hace", label: "No lo hace", icon: <HighlightOff color="error" /> },
    { value: "en_proceso", label: "En proceso", icon: <HourglassEmpty color="warning" />},
    { value: "lo_hace", label: "Lo hace", icon: <CheckCircle color="success" /> },
]

// Utility functions
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

const formatSelectValueIcon = (value, options) => {
    if (!value) return "No especificado";
    const option = options.find(opt => opt.value === value);
    return option ? option.icon : null;
};

const formatDate = (dateValue, includeTime = false) => {
    if (!dateValue) return includeTime ? "Sin fecha y hora" : "Sin fecha";

    let fecha = dateValue;
    if (typeof dateValue === "object" && dateValue !== null) {
        fecha = dateValue.fecha || dateValue.valor_original?.fecha || dateValue.valor_original;
    }

    const dayjsDate = dayjs(fecha);
    if (!dayjsDate.isValid()) {
        return includeTime ? "Fecha y hora inválida" : "Fecha inválida";
    }

    return includeTime
        ? dayjsDate.format('DD [de] MMMM [de] YYYY [a las] HH:mm')
        : dayjsDate.format('DD [de] MMMM [de] YYYY');
};

const getQuestionTypeIcon = (tipo) => {
    const iconMap = {
        datos_personales: <Person color="primary" />,
        datos_domicilio: <Home color="primary" />,
        contactos: <Phone color="primary" />,
        datos_medicos: <MedicalInformation color="primary" />,
        imagen: <ImageIcon color="primary" />,
        canalizacion: <Assignment color="primary" />,
        canalizacion_centro: <Assignment color="primary" />,
        numero_telefono: <Phone color="primary" />,
        default: <Assignment color="primary" />
    };

    return iconMap[tipo] || iconMap.default;
};

// Medical Data Renderer Component
const MedicalDataRenderer = ({ usuarioId, responseData }) => {
    const [medicalData, setMedicalData] = useState(null);
    const [disabilities, setDisabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMedicalData = async () => {
            try {
                setLoading(true);

                const [profileResponse, disabilitiesResponse] = await Promise.all([
                    api.get(`/api/candidatos/profiles/${usuarioId}/`),
                    api.get("/api/discapacidad/disabilities/")
                ]);

                setMedicalData(profileResponse.data);
                setDisabilities(disabilitiesResponse.data);
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

    const getDisabilityNames = (disabilityIds) => {
        if (!Array.isArray(disabilityIds) || disabilityIds.length === 0) return [];
        return disabilityIds.map(id => {
            const disability = disabilities.find(d => d.id === id);
            return disability ? disability.name : `ID: ${id}`;
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Cargando datos médicos...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>;
    }

    if (!medicalData) {
        return (
            <Typography variant="body2" color="text.secondary">
                No se encontraron datos médicos
            </Typography>
        );
    }

    return (
        <Box>
            <Grid container spacing={1}>
                {/* Disabilities */}
                {medicalData.disability?.length > 0 && (
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
                                {medicalData.has_disability_certificate && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{responseData?.disability_certificate_details || "Sin detalles"}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Discapacidad en la Familia:</strong></TableCell>
                                    <TableCell>{formatYesNo(responseData?.has_disability_history)}</TableCell>
                                </TableRow>
                                {responseData?.has_disability_history && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{responseData?.disability_history_details || "Sin detalles"}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Juicio de interdicción:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.has_interdiction_judgment)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Pensión del gobierno:</strong></TableCell>
                                    <TableCell>{formatSelectValue(medicalData.receives_pension, PENSION_OPTIONS)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Seguridad social:</strong></TableCell>
                                    <TableCell>{formatSelectValue(medicalData.social_security, SOCIAL_SECURITY_OPTIONS)}</TableCell>
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
                                {medicalData.receives_psychological_care && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{responseData?.psychological_care_details || "Sin detalles"}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Atención psiquiátrica:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.receives_psychiatric_care)}</TableCell>
                                </TableRow>
                                {medicalData.receives_psychiatric_care && (
                                    <TableRow>
                                        <TableCell>Detalles:</TableCell>
                                        <TableCell>{responseData?.psychiatric_care_details || "Sin detalles"}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell><strong>Presenta convulsiones:</strong></TableCell>
                                    <TableCell>{formatYesNo(medicalData.has_seizures)}</TableCell>
                                </TableRow>
                                {medicalData.has_seizures && (
                                    <TableRow>
                                        <TableCell>Última convulsión:</TableCell>
                                        <TableCell>{responseData?.last_seizure || "Sin información"}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Medications */}
                {medicalData.medications?.length > 0 && (
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

// Response Data Processor
class ResponseDataProcessor {
    static extractValue(responseData, fallback = "Sin respuesta") {
        if (!responseData) return fallback;

        if (typeof responseData === "string") return responseData;
        if (typeof responseData === "object" && responseData !== null) {
            return responseData.texto || responseData.valor_original || String(responseData);
        }
        return String(responseData);
    }

    static processArrayResponse(responseData) {
        if (!Array.isArray(responseData)) return [];

        return responseData.map(item => {
            if (typeof item === "object" && item !== null) {
                return item.texto || item.valor_original || String(item);
            }
            return String(item);
        });
    }

    static processSISResponse(responseData) {
        if (typeof responseData !== "object" || responseData === null) {
            return { parts: [], subitems: [], observaciones: null };
        }

        const { frecuencia, tiempo_apoyo, tipo_apoyo, subitems, observaciones } = responseData;

        const parts = [];
        if (frecuencia !== undefined) parts.push(`Frecuencia: ${frecuencia}`);
        if (tiempo_apoyo !== undefined) parts.push(`Tiempo de apoyo: ${tiempo_apoyo}`);
        if (tipo_apoyo !== undefined) parts.push(`Tipo de apoyo: ${tipo_apoyo}`);

        return { parts, subitems: subitems || [], observaciones };
    }

    static parseJSON(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    }
}

// Question Content Renderers
const QuestionContentRenderers = {
    binaria: ({ responseData }) => {
        const isTrueResponse = responseData === "1" || responseData === 1 || responseData === true;
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {isTrueResponse ? <CheckCircle color="success" /> : <Cancel color="error" />}
                <Typography variant="body1" fontWeight="medium">
                    {isTrueResponse ? "Sí" : "No"}
                </Typography>
            </Box>
        );
    },

    multiple: ({ responseData }) => (
        <Box>
            <Chip
                label={ResponseDataProcessor.extractValue(responseData)}
                color="primary"
                variant="outlined"
                icon={<RadioButtonChecked />}
            />
        </Box>
    ),

    dropdown: ({ responseData }) => QuestionContentRenderers.multiple({ responseData }),

    checkbox: ({ responseData }) => {
        const opciones = ResponseDataProcessor.processArrayResponse(responseData.opciones);
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
    },

    sis: ({ responseData }) => QuestionContentRenderers.sisCommon({ responseData }),
    sis2: ({ responseData }) => QuestionContentRenderers.sisCommon({ responseData }),

    sisCommon: ({ responseData }) => {
        const { parts, subitems, observaciones } = ResponseDataProcessor.processSISResponse(responseData);

        return (
            <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell><strong>Frecuencia:</strong></TableCell>
                                <TableCell>{responseData.frecuencia !== undefined ? responseData.frecuencia : "N/A"}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Tiempo de apoyo:</strong></TableCell>
                                <TableCell>{responseData.tiempo_apoyo !== undefined ? responseData.tiempo_apoyo : "N/A"}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Tipo de apoyo:</strong></TableCell>
                                <TableCell>{responseData.tipo_apoyo !== undefined ? responseData.tipo_apoyo : "N/A"}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {subitems.length > 0 && (
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
    },

    fecha: ({ responseData }) => (
        <Typography variant="body1">
            {formatDate(responseData)}
        </Typography>
    ),

    fecha_hora: ({ responseData }) => (
        <Typography variant="body1">
            {formatDate(responseData, true)}
        </Typography>
    ),

    numero_telefono: ({ responseData }) => (
        <Typography variant="body1" fontWeight="medium">
            {formatCanonicalPhoneNumber(ResponseDataProcessor.extractValue(responseData))}
        </Typography>
    ),

    numero: ({ responseData }) => (
        <Typography variant="body1" fontWeight="medium">
            {ResponseDataProcessor.extractValue(responseData)}
        </Typography>
    ),

    abierta: ({ responseData }) => (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {ResponseDataProcessor.extractValue(responseData)}
        </Typography>
    ),

    imagen: ({ responseData }) => (
        <Chip
            icon={<ImageIcon />}
            label={responseData ? "Imagen subida" : "Sin imagen"}
            color={responseData ? "success" : "default"}
            variant="outlined"
        />
    ),

    datos_personales: ({ responseData }) => (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {(() => {
                const respuestaTexto = ResponseDataProcessor.extractValue(responseData);
                const data = ResponseDataProcessor.parseJSON(respuestaTexto);
                if (data && (data.address_city || data.address_col || data.address_municip || data.address_road || data.address_number)) {
                    return `Dirección: ${data.address_road} ${data.address_number} - ${data.address_number_int}, ${data.address_col}, ${data.address_municip}, ${data.address_city}, ${data.address_state}`;
                }
                return respuestaTexto || "No hay información disponible.";
            })()}
        </Typography>
    ),

    datos_domicilio: ({ responseData }) => {
        const addressData = typeof responseData === "object" && responseData !== null
            ? responseData
            : ResponseDataProcessor.parseJSON(ResponseDataProcessor.extractValue(responseData));

        if (!addressData || typeof addressData !== "object") {
            return (
                <Typography variant="body1" color="text.secondary">
                    No hay información de domicilio disponible
                </Typography>
            );
        }

        const {
            address_road,
            address_number,
            address_number_int,
            address_col,
            address_municip,
            address_city,
            address_state,
            address_PC,
            residence_type,
            address_lat,
            address_lng
        } = addressData;

        // Format the full address
        const addressParts = [];
        if (address_road) addressParts.push(address_road);
        if (address_number) addressParts.push(`#${address_number}`);
        if (address_number_int) addressParts.push(`Int. ${address_number_int}`);

        const streetAddress = addressParts.join(' ');

        const locationParts = [];
        if (address_col) locationParts.push(address_col);
        if (address_municip) locationParts.push(address_municip);
        if (address_city && address_city !== address_municip) locationParts.push(address_city);
        if (address_state) locationParts.push(address_state);

        const locationAddress = locationParts.join(', ');

        return (
            <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                    <Table size="small">
                        <TableBody>
                            {streetAddress && (
                                <TableRow>
                                    <TableCell><strong>Dirección:</strong></TableCell>
                                    <TableCell>{streetAddress}</TableCell>
                                </TableRow>
                            )}
                            {address_col && (
                                <TableRow>
                                    <TableCell><strong>Colonia:</strong></TableCell>
                                    <TableCell>{address_col}</TableCell>
                                </TableRow>
                            )}
                            {address_municip && (
                                <TableRow>
                                    <TableCell><strong>Municipio:</strong></TableCell>
                                    <TableCell>{address_municip}</TableCell>
                                </TableRow>
                            )}
                            {address_city && address_city !== address_municip && (
                                <TableRow>
                                    <TableCell><strong>Ciudad:</strong></TableCell>
                                    <TableCell>{address_city}</TableCell>
                                </TableRow>
                            )}
                            {address_state && (
                                <TableRow>
                                    <TableCell><strong>Estado:</strong></TableCell>
                                    <TableCell>{address_state}</TableCell>
                                </TableRow>
                            )}
                            {address_PC && (
                                <TableRow>
                                    <TableCell><strong>Código Postal:</strong></TableCell>
                                    <TableCell>{address_PC}</TableCell>
                                </TableRow>
                            )}
                            {residence_type && (
                                <TableRow>
                                    <TableCell><strong>Tipo de vivienda:</strong></TableCell>
                                    <TableCell>
                                        <Chip
                                            label={residence_type}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Full formatted address display */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <Home sx={{ fontSize: 16, mr: 1 }} />
                        Dirección completa:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                        {streetAddress}
                        {streetAddress && locationAddress && ', '}
                        {locationAddress}
                        {address_PC && ` - CP ${address_PC}`}
                    </Typography>
                </Box>

                {/* Coordinates if available */}
                {(address_lat && address_lng) && (
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Coordenadas: {address_lat}, {address_lng}
                        </Typography>
                    </Box>
                )}

                {/* Status indicator */}
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main">
                        Datos de domicilio registrados
                    </Typography>
                </Box>
            </Box>
        );
    },

    contactos: ({ responseData }) => {
        const responseContacts = responseData.valor_original
        const contactData = typeof responseContacts === "object" && responseContacts !== null
            ? responseContacts
            : ResponseDataProcessor.parseJSON(ResponseDataProcessor.extractValue(responseContacts));

        if (!contactData || typeof contactData !== "object") {
            return (
                <Typography variant="body1" color="text.secondary">
                    No hay información de contactos disponible
                </Typography>
            );
        }
        return (
            <ContactList emergency_contacts={contactData} show_contacts={true} />
        );
    },

    datos_medicos: ({ responseData, usuario }) => (
        <MedicalDataRenderer usuarioId={usuario.id} responseData={responseData} />
    ),

    canalizacion: ({ responseData }) => (
        <Typography variant="body1" sx={{ p: 1, borderRadius: 1 }}>
            {(() => {
                const respuestaTexto = ResponseDataProcessor.extractValue(responseData);
                const data = ResponseDataProcessor.parseJSON(respuestaTexto);
                if (data && (data.stage || data.explicacion)) {
                    const stageName = CANALIZACION_STAGES[data.stage] || data.stage;
                    return `Etapa: ${stageName} | Explicación: ${data.explicacion || "N/A"}`;
                }
                return respuestaTexto || "No hay información disponible.";
            })()}
        </Typography>
    ),

    canalizacion_centro: ({ responseData }) => (
        <Typography variant="body1" sx={{ p: 1, borderRadius: 1 }}>
            {(() => {
                const respuestaTexto = ResponseDataProcessor.extractValue(responseData);
                const data = ResponseDataProcessor.parseJSON(respuestaTexto);
                if (data && (data.center_id || data.center_name)) {
                    return `Centro: ${data.center_name || "N/A"}`;
                }
                return respuestaTexto || "No hay información disponible.";
            })()}
        </Typography>
    ),

    meta: ({ responseData }) => {
        // console.log(responseData);
        return (
            <Box sx={{ mt: 1, mb: 2 }}>
                {/* Title for the meta information */}
                <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                        fontWeight: 'bold', 
                        color: 'text.primary',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 1,
                        mb: 2,
                    }}
                >
                    {responseData.meta}
                </Typography>
    
                {/* List of steps */}
                <List dense>
                    {responseData.pasos.map((paso, index) => (
                        <ListItem 
                            key={index} 
                            disablePadding
                            sx={{
                                mb: 1,
                                p: 1.5,
                                borderRadius: '8px',
                                backgroundColor: 'action.hover', // Adds a light background for each step
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                            }}
                        >
                            {/* Step Description Chip */}
                            <Chip
                                label={paso.descripcion}
                                color="primary"
                                variant="filled" // Use filled for better visibility
                                size="medium" // A slightly larger chip looks better
                                sx={{ mb: 1, fontWeight: 'bold' }}
                            />
                            
                            {/* Responsible Person */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                 <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                     Encargado:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'normal' }}>
                                    {paso.encargado}
                                </Typography>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Box>
        );
    },

    ch: ({ responseData }) => {
        // Get the formatted text value
        const formattedText = formatSelectValue(responseData.resultado, CH_OPTIONS);
        // Get the icon component
        const iconComponent = formatSelectValueIcon(responseData.resultado, CH_OPTIONS);
    
        return (
            <Box display='flex' alignItems='center' gap={1}>
                {iconComponent} {/* Render the icon component here */}
                <Typography>
                    {formattedText}
                </Typography>
            </Box>
        );
    },

    default: ({ responseData }) => (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {ResponseDataProcessor.extractValue(responseData)}
        </Typography>
    )
};

// Main Report Question Renderer Component
const ReportQuestionRenderer = ({ pregunta, respuesta, usuario }) => {
    const renderQuestionContent = () => {
        const responseData = respuesta.respuesta;
        const questionType = respuesta.tipo_pregunta;

        const renderer = QuestionContentRenderers[questionType] || QuestionContentRenderers.default;
        return renderer({ responseData, usuario });
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