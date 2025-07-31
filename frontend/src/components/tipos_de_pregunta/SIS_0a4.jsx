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
  subitems, // <-- Nuevo parámetro que contiene la lista de subitems
}) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  // Campos permitidos en la respuesta
  const allowedFields = [
    "frecuencia",
    "tiempo_apoyo",
    "tipo_apoyo",
    "observaciones",
    "subitems", // <-- Agrega subitems
  ];

  // Sanitizar la respuesta para asegurar que solo tenga campos permitidos
  const sanitizeResponse = (preguntaId, updatedRespuesta) => {
    return allowedFields.reduce((acc, field) => {
      acc[field] =
        updatedRespuesta[field] || (field === "ayuda_tecnica" ? false : "");
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

  // Manejar cambios en el checkbox
  const handleCheckboxChange = (preguntaId, event) => {
    handleFieldChange(preguntaId, "ayuda_tecnica", event.target.checked);
  };

  // Manejar cambios en el campo de texto
  const handleTextChange = (preguntaId, event) => {
    const value = event.target.value;
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        observaciones: value,
      },
    }));
    handleFieldChange(preguntaId, "observaciones", value);
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

  ////////////////////// se hace el manejo de los subitems /////////////////
  const handleSubitemChange = async (preguntaId, subitemId, checked) => {
    try {
      setLoading(true);
      onLoading(true); // Notifica al componente padre que hay carga

      const prevSelectedSubitems = respuestas[preguntaId]?.subitems || [];

      let updatedSubitems;
      if (checked) {
        // Buscar la pregunta para obtener su texto
        const pregunta = preguntas.find((p) => p.id === preguntaId);
        const preguntaTexto = pregunta?.texto;

        // Buscar el subitem completo para obtener id y texto
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

        updatedSubitems = [...prevSelectedSubitems, subitemConTexto]; // Agregar subitem con id y texto
      } else {
        updatedSubitems = prevSelectedSubitems.filter((subitem) => {
          // Manejar tanto objetos como IDs directos (para compatibilidad)
          const subitemIdToCheck =
            typeof subitem === "object" ? subitem.id : subitem;
          return subitemIdToCheck !== subitemId;
        });
      }

      const updatedRespuesta = {
        ...respuestas[preguntaId],
        subitems: updatedSubitems,
      };

      setRespuestas((prev) => ({
        ...prev,
        [preguntaId]: updatedRespuesta,
      }));

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
    // Limpiar timeout anterior si existe
    if (typingTimeoutRef.current[preguntaId]) {
      clearTimeout(typingTimeoutRef.current[preguntaId]);
    }

    // Actualiza el estado local inmediatamente para que el usuario vea lo que escribe
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        observaciones: value,
      },
    }));

    // Configura nuevo timeout
    typingTimeoutRef.current[preguntaId] = setTimeout(() => {
      handleFieldChange(preguntaId, "observaciones", value);
    }, 500);
  };

  ////////Hacer obligatorio las opciones necesarias ////////

  const validarRespuestasCompletas = () => {
    const errores = [];

    preguntas.forEach((pregunta) => {
      const r = respuestas[pregunta.id];
      if (!r) {
        errores.push(pregunta.id);
        return;
      }

      const camposObligatorios = ["frecuencia", "tiempo_apoyo", "tipo_apoyo"];
      const incompletos = camposObligatorios.some(
        (campo) =>
          r[campo] === undefined || r[campo] === "" || r[campo] === null
      );

      if (incompletos) {
        errores.push(pregunta.id);
      }
    });

    return errores; // Devuelve lista de preguntas incompletas
  };

  return (
    <>
      {/* <Box p={{ xs: 1, sm: 2 }}> */}
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
              <Table
              // sx={{ minWidth: 650 }}
              >
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
                            // border: "0.1px solid",
                            borderColor: "primary.main",
                            borderBottom: "1px solid",
                            borderBottomColor: "primary.main",
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

                          <Typography variant="body2">Frecuencia:</Typography>
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

                          <Typography variant="body2">
                            Tiempo diario de apoyo:
                          </Typography>
                          <RadioGroup
                            row
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

                          <Typography variant="body2">
                            Tipo de apoyo:
                          </Typography>
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

                          <Typography variant="body2">
                            ¿Necesita apoyo?
                          </Typography>
                          {(subitems?.[pregunta.texto] || []).map((subitem) => (
                            <FormControlLabel
                              key={subitem.id}
                              sx={{ whiteSpace: "nowrap" }}
                              control={
                                <Checkbox
                                  checked={
                                    (() => {
                                      const subitemsArray = respuestas[pregunta.id]?.subitems;
                                      if (!Array.isArray(subitemsArray)) {
                                        return false;
                                      }
                                      return subitemsArray.some(
                                        (subitemSeleccionado) => {
                                          // Manejar tanto objetos como IDs directos (para compatibilidad)
                                          const subitemIdToCheck =
                                            typeof subitemSeleccionado ===
                                            "object"
                                              ? subitemSeleccionado.id
                                              : subitemSeleccionado;
                                          return subitemIdToCheck === subitem.id;
                                        }
                                      );
                                    })()
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
                        </Box>
                      ) : (
                        <TableRow key={pregunta.id}>
                          <TableCell>{pregunta.texto}</TableCell>
                          <TableCell>
                            <RadioGroup
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
                          <TableCell>
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
                          <TableCell>
                            <RadioGroup
                              value={
                                String(respuestas[pregunta.id]?.tipo_apoyo) ||
                                ""
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
                          {/* <TableCell>
                            <Checkbox
                              checked={
                                respuestas[pregunta.id]?.ayuda_tecnica || false
                              }
                              onChange={(e) => handleCheckboxChange(pregunta.id, e)}
                              disabled={disabled || loading}
                              size="small"
                            />
                          </TableCell> */}
                          <TableCell>
                            {(subitems?.[pregunta.texto] || []).map(
                              (subitem) => (
                                <FormControlLabel
                                  key={subitem.id}
                                  sx={{ whiteSpace: "nowrap" }}
                                  control={
                                    <Checkbox
                                      checked={
                                        (() => {
                                          const subitemsArray = respuestas[pregunta.id]?.subitems;
                                          if (!Array.isArray(subitemsArray)) {
                                            return false;
                                          }
                                          return subitemsArray.some(
                                            (subitemSeleccionado) => {
                                              // Manejar tanto objetos como IDs directos (para compatibilidad)
                                              const subitemIdToCheck =
                                                typeof subitemSeleccionado ===
                                                "object"
                                                  ? subitemSeleccionado.id
                                                  : subitemSeleccionado;
                                              return (
                                                subitemIdToCheck === subitem.id
                                              );
                                            }
                                          );
                                        })()
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
                              )
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              width: "25%",
                              m: 1,
                            }}
                          >
                            <TextField
                              value={
                                respuestas[pregunta.id]?.observaciones || ""
                              }
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
      {/* </Box> */}
    </>
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
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

export default SIS_0a4;
