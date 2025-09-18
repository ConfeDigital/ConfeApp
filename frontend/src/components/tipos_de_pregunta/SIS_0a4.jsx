import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
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
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

const SIS_0a4 = ({
  preguntas,
  respuestas,
  setRespuestas,
  handleRespuestaChange,
  disabled,
  onLoading,
  onError,
  subitems,
  questionSubmitStates,
  QuestionSubmitIndicator,
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const allowedFields = [
    "frecuencia",
    "tiempo_apoyo",
    "tipo_apoyo",
    "observaciones",
    "subitems",
  ];

  const sanitizeResponse = (preguntaId, updatedRespuesta) => {
    return allowedFields.reduce((acc, field) => {
      acc[field] =
        updatedRespuesta[field] || (field === "ayuda_tecnica" ? false : "");
      return acc;
    }, {});
  };

  // Check if required fields are filled
  const areRequiredFieldsFilled = (respuesta) => {
    const required = ["frecuencia", "tiempo_apoyo", "tipo_apoyo"];
    return required.every(
      (field) =>
        respuesta[field] !== undefined &&
        respuesta[field] !== "" &&
        respuesta[field] !== null
    );
  };

  const handleFieldChange = async (preguntaId, field, value) => {
    try {
      const updatedRespuesta = {
        ...respuestas[preguntaId],
        [field]: value,
      };

      // Always update local state so UI shows immediately
      setRespuestas((prev) => ({
        ...prev,
        [preguntaId]: updatedRespuesta,
      }));

      // Only send to backend if all required fields are filled
      if (!areRequiredFieldsFilled(updatedRespuesta)) {
        return;
      }

      setLoading(true);
      onLoading(true);

      const sanitizedData = sanitizeResponse(preguntaId, updatedRespuesta);

      await handleRespuestaChange(preguntaId, sanitizedData);
    } catch (error) {
      setError("Error al guardar la respuesta");
      onError("Error al guardar la respuesta");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleSubitemChange = async (preguntaId, subitemId, checked) => {
    try {
      const prevSelectedSubitems = respuestas[preguntaId]?.subitems || [];

      let updatedSubitems;
      if (checked) {
        const pregunta = preguntas.find((p) => p.id === preguntaId);
        const preguntaTexto = pregunta?.texto;

        const subitemCompleto = subitems[preguntaTexto]?.find(
          (subitem) => subitem.id === subitemId
        );
        const subitemConTexto = {
          id: subitemId,
          texto:
            subitemCompleto?.sub_item ||
            subitemCompleto?.texto ||
            `Subitem ${subitemId}`,
        };

        updatedSubitems = [...prevSelectedSubitems, subitemConTexto];
      } else {
        updatedSubitems = prevSelectedSubitems.filter((subitem) => {
          const subitemIdToCheck =
            typeof subitem === "object" ? subitem.id : subitem;
          return subitemIdToCheck !== subitemId;
        });
      }

      const updatedRespuesta = {
        ...respuestas[preguntaId],
        subitems: updatedSubitems,
      };

      // Always update local state
      setRespuestas((prev) => ({
        ...prev,
        [preguntaId]: updatedRespuesta,
      }));

      // Only send to backend if all required fields are filled
      if (!areRequiredFieldsFilled(updatedRespuesta)) {
        return;
      }

      setLoading(true);
      onLoading(true);

      await handleRespuestaChange(preguntaId, updatedRespuesta);
    } catch (error) {
      setError("Error al guardar la respuesta");
      onError("Error al guardar la respuesta");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const typingTimeoutRef = React.useRef({});

  const debouncedHandleTextChange = (preguntaId, value) => {
    if (typingTimeoutRef.current[preguntaId]) {
      clearTimeout(typingTimeoutRef.current[preguntaId]);
    }

    const updatedRespuesta = {
      ...respuestas[preguntaId],
      observaciones: value,
    };

    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: updatedRespuesta,
    }));

    typingTimeoutRef.current[preguntaId] = setTimeout(() => {
      if (!areRequiredFieldsFilled(updatedRespuesta)) {
        return;
      }
      handleFieldChange(preguntaId, "observaciones", value);
    }, 500);
  };

  const secciones = React.useMemo(() => {
    return [...new Set(preguntas.map((pregunta) => pregunta.seccion_sis))];
  }, [preguntas]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {secciones.map((seccion, index) => (
        <TabPanel key={index} value={tabIndex} index={index}>
          <TableContainer component={Paper} sx={{ maxHeight: "90vh" }}>
            <Table stickyHeader aria-label="sticky table">
              {!isMobile && (
                <TableHead>
                  <TableRow>
                    <TableCell>Pregunta</TableCell>
                    <TableCell>Frecuencia</TableCell>
                    <TableCell>Tiempo diario de apoyo</TableCell>
                    <TableCell>Tipo de apoyo</TableCell>
                    <TableCell>¿Necesita apoyo?</TableCell>
                    <TableCell>Observaciones</TableCell>
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
                          mb: 1,
                          p: "1%",
                          pt: 5,
                          pb: 5,
                          borderColor: "primary.main",
                          borderBottom: "1px solid",
                          borderTop: "1px solid",
                          borderTopColor: "primary.main",
                          borderRadius: 2,
                          backgroundColor: "background",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {pregunta.texto}
                        </Typography>
                        <Typography variant="subtitle2">Frecuencia:</Typography>
                        <RadioGroup
                          row
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
                          {[0, 1, 2, 3, 4].map((value) => (
                            <FormControlLabel
                              key={value}
                              value={String(value)}
                              control={
                                <Radio
                                  size="small"
                                  sx={{
                                    color: `hsl(${120 - value * 30}, 70%, 40%)`,
                                    "&.Mui-checked": {
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                    },
                                  }}
                                  disabled={disabled || loading}
                                />
                              }
                              label={value.toString()}
                              labelPlacement="end"
                            />
                          ))}
                        </RadioGroup>

                        <Typography variant="subtitle2">
                          Tiempo diario de apoyo:
                        </Typography>
                        <RadioGroup
                          row
                          value={
                            String(respuestas[pregunta.id]?.tiempo_apoyo) || ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              pregunta.id,
                              "tiempo_apoyo",
                              e.target.value
                            )
                          }
                        >
                          {[0, 1, 2, 3, 4].map((value) => (
                            <FormControlLabel
                              key={value}
                              value={String(value)}
                              control={
                                <Radio
                                  size="small"
                                  sx={{
                                    color: `hsl(${120 - value * 30}, 70%, 40%)`,
                                    "&.Mui-checked": {
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                    },
                                  }}
                                  disabled={disabled || loading}
                                />
                              }
                              label={value.toString()}
                              labelPlacement="end"
                            />
                          ))}
                        </RadioGroup>

                        <Typography variant="subtitle2">Tipo de apoyo:</Typography>
                        <RadioGroup
                          row
                          value={
                            String(respuestas[pregunta.id]?.tipo_apoyo) || ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              pregunta.id,
                              "tipo_apoyo",
                              e.target.value
                            )
                          }
                        >
                          {[0, 1, 2, 3, 4].map((value) => (
                            <FormControlLabel
                              key={value}
                              value={String(value)}
                              control={
                                <Radio
                                  size="small"
                                  sx={{
                                    color: `hsl(${120 - value * 30}, 70%, 40%)`,
                                    "&.Mui-checked": {
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                    },
                                  }}
                                  disabled={disabled || loading}
                                />
                              }
                              label={value.toString()}
                              labelPlacement="end"
                            />
                          ))}
                        </RadioGroup>

                        <Typography variant="subtitle2">
                          ¿Necesita apoyo?
                        </Typography>
                        {(subitems?.[pregunta.texto] || []).map((subitem) => (
                          <FormControlLabel
                            key={subitem.id}
                            sx={{ whiteSpace: "nowrap" }}
                            control={
                              <Checkbox
                                checked={
                                  Array.isArray(
                                    respuestas[pregunta.id]?.subitems
                                  ) &&
                                  respuestas[pregunta.id]?.subitems.some(
                                    (sel) =>
                                      (typeof sel === "object"
                                        ? sel.id
                                        : sel) === subitem.id
                                  )
                                }
                                onChange={(e) =>
                                  handleSubitemChange(
                                    pregunta.id,
                                    subitem.id,
                                    e.target.checked
                                  )
                                }
                                disabled={disabled || loading}
                                size="small"
                              />
                            }
                            label={subitem.sub_item}
                          />
                        ))}

                        <Typography variant="subtitle2">
                          Observaciones:
                        </Typography>
                        <TextField
                          value={respuestas[pregunta.id]?.observaciones || ""}
                          onChange={(e) =>
                            debouncedHandleTextChange(
                              pregunta.id,
                              e.target.value
                            )
                          }
                          multiline
                          fullWidth
                          rows={4}
                          sx={{ mt: 1, width: "100%" }}
                          disabled={disabled || loading}
                          size="small"
                        />
                        {QuestionSubmitIndicator && (
                          <QuestionSubmitIndicator preguntaId={pregunta.id} />
                        )}
                      </Box>
                    ) : (
                      <TableRow key={pregunta.id}>
                        <TableCell sx={{ maxWidth: "250px" }}>{pregunta.texto}</TableCell>
                        <TableCell sx={{ width: "100px" }}>
                          <RadioGroup
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
                            {[0, 1, 2, 3, 4].map((value) => (
                              <FormControlLabel
                                key={value}
                                value={String(value)}
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                      "&.Mui-checked": {
                                        color: `hsl(${
                                          120 - value * 30
                                        }, 70%, 40%)`,
                                      },
                                    }}
                                    disabled={disabled || loading}
                                  />
                                }
                                label={value.toString()}
                                labelPlacement="end"
                              />
                            ))}
                          </RadioGroup>
                        </TableCell>
                        <TableCell sx={{ width: "100px" }}>
                          <RadioGroup
                            value={
                              String(respuestas[pregunta.id]?.tiempo_apoyo) ||
                              ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                pregunta.id,
                                "tiempo_apoyo",
                                e.target.value
                              )
                            }
                          >
                            {[0, 1, 2, 3, 4].map((value) => (
                              <FormControlLabel
                                key={value}
                                value={String(value)}
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                      "&.Mui-checked": {
                                        color: `hsl(${
                                          120 - value * 30
                                        }, 70%, 40%)`,
                                      },
                                    }}
                                    disabled={disabled || loading}
                                  />
                                }
                                label={value.toString()}
                                labelPlacement="end"
                              />
                            ))}
                          </RadioGroup>
                        </TableCell>
                        <TableCell sx={{ width: "100px" }}>
                          <RadioGroup
                            value={
                              String(respuestas[pregunta.id]?.tipo_apoyo) || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                pregunta.id,
                                "tipo_apoyo",
                                e.target.value
                              )
                            }
                          >
                            {[0, 1, 2, 3, 4].map((value) => (
                              <FormControlLabel
                                key={value}
                                value={String(value)}
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: `hsl(${
                                        120 - value * 30
                                      }, 70%, 40%)`,
                                      "&.Mui-checked": {
                                        color: `hsl(${
                                          120 - value * 30
                                        }, 70%, 40%)`,
                                      },
                                    }}
                                    disabled={disabled || loading}
                                  />
                                }
                                label={value.toString()}
                                labelPlacement="end"
                              />
                            ))}
                          </RadioGroup>
                        </TableCell>
                        <TableCell sx={{ width: "25%" }}>
                          <Box
                            sx={{ display: "flex", flexDirection: "column", maxHeight: "210px", overflowY: "auto", pr: 1}}
                          >
                            {(subitems?.[pregunta.texto] || []).map(
                              (subitem) => (
                                <FormControlLabel
                                  key={subitem.id}
                                  control={
                                    <Checkbox
                                      checked={
                                        Array.isArray(
                                          respuestas[pregunta.id]?.subitems
                                        ) &&
                                        respuestas[pregunta.id]?.subitems.some(
                                          (sel) =>
                                            (typeof sel === "object"
                                              ? sel.id
                                              : sel) === subitem.id
                                        )
                                      }
                                      onChange={(e) =>
                                        handleSubitemChange(
                                          pregunta.id,
                                          subitem.id,
                                          e.target.checked
                                        )
                                      }
                                      disabled={disabled || loading}
                                      size="small"
                                    />
                                  }
                                  label={subitem.sub_item}
                                  sx={{
                                    border: "1px solid #ccc", // Adjust color and thickness as needed
                                    borderRadius: "2px", // Optional: adds rounded corners
                                    margin: "2px 0", // Optional: adds some spacing between items
                                  }}
                                />
                              )
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: "25%" }}>
                          <TextField
                            value={respuestas[pregunta.id]?.observaciones || ""}
                            onChange={(e) =>
                              debouncedHandleTextChange(
                                pregunta.id,
                                e.target.value
                              )
                            }
                            multiline
                            fullWidth
                            rows={isMobile ? 4 : 10}
                            sx={{ mt: 1 }}
                            disabled={disabled || loading}
                            size="small"
                          />
                          {QuestionSubmitIndicator && (
                            <QuestionSubmitIndicator preguntaId={pregunta.id} />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      ))}
    </>
  );
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && <Box p={3}>{children}</Box>}
  </div>
);

export default SIS_0a4;
