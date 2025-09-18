import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useMediaQuery,
} from "@mui/material";
import SISObservacionesField from "./SISObservacionesField";

const SIS_0a4_2 = ({
  preguntas,
  respuestas,
  setRespuestas,
  handleRespuestaChange,
  handleSISTextChange,
  disabled,
  onLoading,
  onError,
  questionSubmitStates,
  QuestionSubmitIndicator,
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const isMobile = useMediaQuery("(max-width:600px)");

  const typingTimeoutRef = React.useRef({});

  // Campos permitidos en la respuesta
  const allowedFields = ["frecuencia", "observaciones"];

  // Sanitizar la respuesta para asegurar que solo tenga campos permitidos
  const sanitizeResponse = (preguntaId, updatedRespuesta) => {
    return allowedFields.reduce((acc, field) => {
      acc[field] = updatedRespuesta[field] || "";
      return acc;
    }, {});
  };

  // Manejar cambios en los campos
  const handleFieldChange = async (preguntaId, field, value) => {
    try {
      setLoading(true);
      onLoading(true); // Notificar al componente padre que hay una carga en curso

      const updatedRespuesta = {
        ...respuestas[preguntaId],
        [field]: value,
      };

      // Sanitizar la respuesta
      const sanitizedData = sanitizeResponse(preguntaId, updatedRespuesta);

      // Actualizar el estado local
      setRespuestas((prev) => ({
        ...prev,
        [preguntaId]: sanitizedData,
      }));

      // Enviar la respuesta al backend
      await handleRespuestaChange(preguntaId, sanitizedData);
    } catch (error) {
      setError("Error al guardar la respuesta");
      onError("Error al guardar la respuesta"); // Notificar al componente padre del error
    } finally {
      setLoading(false);
      onLoading(false); // Notificar al componente padre que la carga ha terminado
    }
  };

  const handleTextChange = (preguntaId, value) => {
    if (typingTimeoutRef.current[preguntaId]) {
      clearTimeout(typingTimeoutRef.current[preguntaId]);
    }

    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        observaciones: value,
      },
    }));

    typingTimeoutRef.current[preguntaId] = setTimeout(() => {
      handleFieldChange(preguntaId, "observaciones", value);
    }, 500);
  };

  // Manejar cambios en los tabs
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  // Obtener las secciones únicas
  const secciones = React.useMemo(() => {
    return [...new Set(preguntas.map((pregunta) => pregunta.seccion_sis))];
  }, [preguntas]);

  // Limpiar errores después de 5 segundos
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Indicador de carga */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Contenido de las pestañas */}
      {secciones.map((seccion, index) => (
        <TabPanel key={index} value={tabIndex} index={index}>
          <Box sx={{ overflowX: "auto" }}>
            <TableContainer
              component={Paper}
              // sx={{ minWidth: 650 }}
            >
              <Table>
                {!isMobile && (
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "35%" }}>Pregunta</TableCell>
                      <TableCell sx={{ width: "5%" }}>Frecuencia</TableCell>
                      <TableCell sx={{ width: "60%" }}>Comentarios</TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {preguntas
                    .filter((pregunta) => pregunta.seccion_sis === seccion)
                    .map((pregunta) =>
                      isMobile ? (
                        <Box
                          key={pregunta.id}
                          sx={{
                            mb: 2,
                            p: 2,
                            borderBottom: "1px solid",
                            borderBottomColor: "primary.main",
                            backgroundColor: "background",
                            borderRadius: 2,
                            width: "100%",
                            // maxWidth: "100vw",
                            boxSizing: "border-box",
                            overflowX: "hidden",
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {pregunta.texto}
                          </Typography>

                          <Typography variant="body2">Frecuencia:</Typography>
                          <RadioGroup
                            row
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                            value={
                              String(respuestas[pregunta.id]?.frecuencia) || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                pregunta.id,
                                "frecuencia",
                                e.target.value
                              )
                            }
                          >
                            {[0, 1, 2].map((value) => (
                              <FormControlLabel
                                key={value}
                                value={String(value)}
                                control={
                                  <Radio
                                    size="small"
                                    disabled={disabled || loading}
                                    sx={{
                                      color:
                                        value === 0
                                          ? "#2e7d32"
                                          : value === 1
                                          ? "#fbc02d"
                                          : "#c62828",
                                      "&.Mui-checked": {
                                        color:
                                          value === 0
                                            ? "#2e7d32"
                                            : value === 1
                                            ? "#fbc02d"
                                            : "#c62828",
                                      },
                                    }}
                                  />
                                }
                                label={value.toString()}
                                labelPlacement="end"
                              />
                            ))}
                          </RadioGroup>

                          <SISObservacionesField
                            preguntaId={pregunta.id}
                            value={respuestas[pregunta.id]?.observaciones ?? ""}
                            onChange={handleSISTextChange || handleTextChange}
                            disabled={disabled || loading}
                            label="Comentarios"
                          />
                          {QuestionSubmitIndicator && (
                            <QuestionSubmitIndicator preguntaId={pregunta.id} />
                          )}
                        </Box>
                      ) : (
                        <TableRow key={pregunta.id}>
                          <TableCell>{pregunta.texto}</TableCell>
                          <TableCell
                            sx={{
                              width: "30%",
                            }}
                          >
                            <RadioGroup
                              row
                              value={
                                String(respuestas[pregunta.id]?.frecuencia) ||
                                ""
                              }
                              onChange={(e) =>
                                handleFieldChange(
                                  pregunta.id,
                                  "frecuencia",
                                  e.target.value
                                )
                              }
                            >
                              {[0, 1, 2].map((value) => (
                                <FormControlLabel
                                  key={value}
                                  value={String(value)}
                                  control={
                                    <Radio
                                      size="small"
                                      disabled={disabled || loading}
                                      sx={{
                                        color:
                                          value === 0
                                            ? "#2e7d32"
                                            : value === 1
                                            ? "#fbc02d"
                                            : "#c62828",
                                        "&.Mui-checked": {
                                          color:
                                            value === 0
                                              ? "#2e7d32"
                                              : value === 1
                                              ? "#fbc02d"
                                              : "#c62828",
                                        },
                                      }}
                                    />
                                  }
                                  label={value.toString()}
                                  labelPlacement="end"
                                />
                              ))}
                            </RadioGroup>
                          </TableCell>
                          <TableCell>
                            <SISObservacionesField
                              preguntaId={pregunta.id}
                              value={respuestas[pregunta.id]?.observaciones ?? ""}
                              onChange={handleSISTextChange || handleTextChange}
                              disabled={disabled || loading}
                              label="Comentarios"
                            />
                            {QuestionSubmitIndicator && (
                              <QuestionSubmitIndicator
                                preguntaId={pregunta.id}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      ))}
    </Box>
  );
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box p={{ xs: 1, sm: 2 }}>{children}</Box>}
    </div>
  );
};

export default SIS_0a4_2;
