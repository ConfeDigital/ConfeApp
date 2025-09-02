import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "../../../api";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

// Íconos personalizados para insertar preguntas
const AgregarAntesIcon = () => (
  <div style={{ position: "relative", width: 24, height: 24 }}>
    <ArrowUpwardIcon style={{ position: "absolute", top: 0, left: 0 }} />
    <AddIcon style={{ position: "absolute", top: 0, left: 0, fontSize: 12 }} />
  </div>
);

const AgregarDespuesIcon = () => (
  <div style={{ position: "relative", width: 24, height: 24 }}>
    <ArrowDownwardIcon style={{ position: "absolute", top: 0, left: 0 }} />
    <AddIcon style={{ position: "absolute", top: 0, left: 0, fontSize: 12 }} />
  </div>
);

// Nombre visible por tipo
const nombreTipoPregunta = {
  multiple: "Opción Múltiple",
  abierta: "Abierta",
  numero: "Número",
  numero_telefono: "Número de Teléfono",
  checkbox: "Checkbox",
  binaria: "Binaria",
  fecha: "Fecha",
  fecha_hora: "Fecha y Hora",
  dropdown: "Dropdown",
  sis: "SIS DE 0-4",
  sis2: "SIS DE 0-2",
  datos_personales: "Datos Personales",
  datos_domicilio: "Datos Domicilio",
  datos_medicos: "Datos Médicos",
  contactos: "Contactos",
  tipo_discapacidad: "Discapacidad",
  canalizacion: "Canalización",
  canalizacion_centro: "Canalización Centro",
  ed: "Evaluación Diagnóstica",
  ch: "Cuadro de Habilidades",
  imagen: "Imagen",
  meta: "Meta",
  profile_field: "Campo de Perfil",
  profile_field_choice: "Campo de Perfil - Selección",
  profile_field_boolean: "Campo de Perfil - Booleano",
  profile_field_date: "Campo de Perfil - Fecha",
  profile_field_textarea: "Campo de Perfil - Texto Largo",
};

const PreguntaCard = ({
  pregunta,
  index,
  total,
  updatePregunta,
  deletePregunta,
  moveUp,
  moveDown,
  insertBefore,
  insertAfter,
  tiposPermitidos,
  preguntas,
  mostrarDesbloqueoDropdown,
  deshabilitado,
  secciones,
  agregarSeccionSiNoExiste,
}) => {
  const tiposConOpciones = ["multiple", "checkbox", "dropdown", "binaria"];
  const [preguntaSeleccionadaDesbloqueo, setPreguntaSeleccionadaDesbloqueo] =
    React.useState("");
  
  // Profile field states
  const [availableFields, setAvailableFields] = React.useState({});
  const [loadingFields, setLoadingFields] = React.useState(false);
  const [fieldsError, setFieldsError] = React.useState("");

  // Load available profile fields when component mounts
  React.useEffect(() => {
    if (pregunta.tipo.startsWith("profile_field")) {
      loadAvailableFields();
    }
  }, [pregunta.tipo]);

  const loadAvailableFields = async () => {
    setLoadingFields(true);
    setFieldsError("");
    try {
      const response = await axios.get("/api/cuestionarios/profile-fields/available/");
      setAvailableFields(response.data.field_groups);
    } catch (err) {
      setFieldsError("Error loading available fields: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingFields(false);
    }
  };

  // Map field types to question types
  const getQuestionTypeForField = (fieldType) => {
    switch (fieldType) {
      case "choice":
        return "profile_field_choice";
      case "boolean":
        return "profile_field_boolean";
      case "date":
        return "profile_field_date";
      case "textarea":
        return "profile_field_textarea";
      default:
        return "profile_field";
    }
  };

  // Handle profile field selection
  const handleProfileFieldSelect = (fieldPath) => {
    const [groupName, fieldName] = fieldPath.split(".");
    const fieldMetadata = availableFields[groupName]?.fields[fieldName];
    
    if (fieldMetadata) {
      const questionType = getQuestionTypeForField(fieldMetadata.type);
      
      updatePregunta(index, {
        ...pregunta,
        tipo: questionType,
        profile_field_path: fieldPath,
        profile_field_config: fieldMetadata,
        texto: pregunta.texto || `Actualizar ${fieldMetadata.label}`,
        // Don't save choices in opciones - they're stored in profile_field_config
        opciones: []
      });
    }
  };

  // Efecto para manejar opciones según el tipo de pregunta
  React.useEffect(() => {
    if (tiposConOpciones.includes(pregunta.tipo)) {
      let opcionesActualizadas = [...(pregunta.opciones || [])];

      // Para preguntas binarias, asegurar que siempre tenga "Sí" y "No" con valores únicos
      if (pregunta.tipo === "binaria") {
        const opcionSi = opcionesActualizadas.find(
          (op) =>
            (typeof op === "string" && op === "Sí") ||
            (typeof op === "object" && op.texto === "Sí")
        );
        const opcionNo = opcionesActualizadas.find(
          (op) =>
            (typeof op === "string" && op === "No") ||
            (typeof op === "object" && op.texto === "No")
        );

        if (!opcionSi || !opcionNo) {
          opcionesActualizadas = [
            { texto: "Sí", valor: 0 },
            { texto: "No", valor: 1 },
          ];
        }
      }

      // Actualizar desbloqueos si existen
      const desbloqueosActualizados = pregunta.desbloqueo?.map((d) => {
        const preguntaOrigen = preguntas[d.pregunta_id];
        if (!preguntaOrigen) return d;

        // Si la pregunta origen es binaria, convertir valores
        if (preguntaOrigen.tipo === "binaria") {
          return {
            ...d,
            valor:
              d.valor === "0" || d.valor === "Sí"
                ? "Sí"
                : d.valor === "1" || d.valor === "No"
                ? "No"
                : d.valor,
          };
        }

        // Para otros tipos, asegurar que el valor coincida con las opciones
        const opcionesOrigen = preguntaOrigen.opciones || [];
        const valorActual = d.valor;
        const opcionEncontrada = opcionesOrigen.find(
          (opt) => (typeof opt === "object" ? opt.texto : opt) === valorActual
        );

        return {
          ...d,
          valor: opcionEncontrada ? valorActual : opcionesOrigen[0] || "",
        };
      });

      if (
        JSON.stringify(opcionesActualizadas) !==
          JSON.stringify(pregunta.opciones) ||
        JSON.stringify(desbloqueosActualizados) !==
          JSON.stringify(pregunta.desbloqueo)
      ) {
        updatePregunta(index, {
          ...pregunta,
          opciones: opcionesActualizadas,
          desbloqueo: desbloqueosActualizados,
        });
      }
    }
  }, [
    pregunta.tipo,
    pregunta.opciones,
    pregunta.desbloqueo,
    preguntas,
    index,
    updatePregunta,
  ]);

  // Efecto para pre-seleccionar desbloqueos precargados
  React.useEffect(() => {
    if (pregunta.desbloqueo && pregunta.desbloqueo.length > 0) {
      // Buscar el primer desbloqueo para pre-seleccionar
      const primerDesbloqueo = pregunta.desbloqueo[0];
      if (primerDesbloqueo.preguntaSeleccionadaDesbloqueo !== undefined) {
        setPreguntaSeleccionadaDesbloqueo(
          primerDesbloqueo.preguntaSeleccionadaDesbloqueo.toString()
        );
      }
    }
  }, [pregunta.desbloqueo]);

  const handleOptionChange = (i, value) => {
    if (pregunta.tipo === "binaria") {
      return; // No permitir cambios en preguntas binarias
    }
    const nuevasOpciones = [...(pregunta.opciones || [])];
    nuevasOpciones[i] = value;

    // Actualizar desbloqueos que usen esta opción
    const desbloqueosActualizados = pregunta.desbloqueo?.map((d) => {
      if (d.valor === nuevasOpciones[i]) {
        return { ...d, valor: value };
      }
      return d;
    });

    updatePregunta(index, {
      ...pregunta,
      opciones: nuevasOpciones,
      desbloqueo: desbloqueosActualizados,
    });
  };

  const addOpcion = () => {
    if (pregunta.tipo === "binaria") {
      return; // No permitir agregar opciones en preguntas binarias
    }
    updatePregunta(index, {
      ...pregunta,
      opciones: [...(pregunta.opciones || []), ""],
    });
  };

  const deleteOpcion = (i) => {
    if (pregunta.tipo === "binaria") {
      return; // No permitir eliminar opciones en preguntas binarias
    }
    updatePregunta(index, {
      ...pregunta,
      opciones: (pregunta.opciones || []).filter((_, idx) => idx !== i),
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updatePregunta(index, { ...pregunta, imagen: file });
    }
  };

  // Función para manejar el cambio de pregunta seleccionada para desbloqueo
  const handlePreguntaDesbloqueoChange = (e) => {
    const preguntaId = e.target.value;
    setPreguntaSeleccionadaDesbloqueo(preguntaId);

    // Si se deselecciona, limpiar el desbloqueo
    if (preguntaId === "") {
      const nuevosDesbloqueos = (pregunta.desbloqueo || []).filter(
        (d) => d.pregunta_id !== parseInt(preguntaSeleccionadaDesbloqueo)
      );
      updatePregunta(index, {
        ...pregunta,
        desbloqueo: nuevosDesbloqueos,
      });
    }
  };

  // Función para manejar el cambio de opción de desbloqueo
  const handleOpcionDesbloqueoChange = (e) => {
    const opcionIndex = parseInt(e.target.value);
    const preguntaId = parseInt(preguntaSeleccionadaDesbloqueo);
    const preguntaOrigen = preguntas[preguntaId];

    if (!preguntaOrigen) return;

    const nuevosDesbloqueos = [
      ...(pregunta.desbloqueo || []).filter(
        (d) => d.pregunta_id !== preguntaId
      ),
    ];

    if (!isNaN(opcionIndex)) {
      const opciones = preguntaOrigen.opciones || [];
      const valor =
        typeof opciones[opcionIndex] === "object"
          ? opciones[opcionIndex].texto
          : opciones[opcionIndex];

      nuevosDesbloqueos.push({
        origenIndex: preguntaId,
        opcionIndex,
        valor,
        pregunta_id: preguntaId,
        descripcion: `Pregunta ${preguntaId + 1}: ${preguntaOrigen.texto}`,
        // Mantener información de pre-selección si existe
        preguntaSeleccionadaDesbloqueo: preguntaId,
        opcionSeleccionadaDesbloqueo: valor,
      });
    }

    updatePregunta(index, {
      ...pregunta,
      desbloqueo: nuevosDesbloqueos,
    });
  };

  // Obtener preguntas que pueden usarse para desbloqueo (anteriores y con opciones)
  const preguntasParaDesbloqueo = preguntas
    .map((p, i) => ({ ...p, index: i }))
    .filter((p, i) => tiposConOpciones.includes(p.tipo) && i < index);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">Pregunta {index + 1}</Typography>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <IconButton
            disabled={index === 0 || deshabilitado}
            onClick={() => moveUp(index)}
          >
            <ArrowUpwardIcon />
          </IconButton>
          <IconButton
            disabled={index === total - 1 || deshabilitado}
            onClick={() => moveDown(index)}
          >
            <ArrowDownwardIcon />
          </IconButton>
          <IconButton
            disabled={deshabilitado}
            onClick={() => insertBefore(index)}
          >
            <AgregarAntesIcon />
          </IconButton>
          <IconButton
            disabled={deshabilitado}
            onClick={() => insertAfter(index)}
          >
            <AgregarDespuesIcon />
          </IconButton>
          <IconButton
            disabled={deshabilitado}
            onClick={() => deletePregunta(index)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </div>

        <TextField
          label="Texto de la pregunta"
          fullWidth
          margin="normal"
          value={pregunta.texto}
          onChange={(e) =>
            updatePregunta(index, { ...pregunta, texto: e.target.value })
          }
          disabled={deshabilitado}
        />

        <Autocomplete
          freeSolo
          options={secciones}
          value={pregunta.seccion || ""}
          onChange={(event, newValue) => {
            updatePregunta(index, { ...pregunta, seccion: newValue });
            agregarSeccionSiNoExiste(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            updatePregunta(index, { ...pregunta, seccion: newInputValue });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Escoge o crea una nueva sección"
              margin="normal"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const valor = e.target.value.trim();
                  if (valor && !secciones.includes(valor)) {
                    agregarSeccionSiNoExiste(valor);
                  }
                }
              }}
            />
          )}
          disabled={deshabilitado}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Tipo de pregunta</InputLabel>
          <Select
            value={pregunta.tipo.startsWith("profile_field") ? "profile_field" : pregunta.tipo}
            label="Tipo de pregunta"
            onChange={(e) => {
              const newType = e.target.value;
              updatePregunta(index, {
                ...pregunta,
                tipo: newType,
                opciones: [],
                // Clear profile field data if switching away from profile field types
                ...(newType !== "profile_field" && !newType.startsWith("profile_field_") ? {
                  profile_field_path: undefined,
                  profile_field_config: undefined
                } : {})
              });
            }}
            disabled={deshabilitado}
          >
            {tiposPermitidos.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {nombreTipoPregunta[tipo] || tipo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Profile Field Selection */}
        {pregunta.tipo.startsWith("profile_field") && (
          <Box sx={{ mt: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Seleccionar Campo de Perfil
            </Typography>
            
            {loadingFields && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {fieldsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {fieldsError}
              </Alert>
            )}
            
            {!loadingFields && !fieldsError && Object.keys(availableFields).length > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Campo de Perfil</InputLabel>
                <Select
                  value={pregunta.profile_field_path || ""}
                  onChange={(e) => handleProfileFieldSelect(e.target.value)}
                  disabled={deshabilitado}
                  label="Campo de Perfil"
                >
                  <MenuItem value="">
                    <em>Seleccionar campo...</em>
                  </MenuItem>
                  {Object.entries(availableFields).map(([groupName, groupData]) => [
                    <MenuItem key={`header-${groupName}`} disabled>
                      <Typography variant="subtitle2" color="primary">
                        {groupData.name}
                      </Typography>
                    </MenuItem>,
                    ...Object.entries(groupData.fields).map(([fieldName, fieldData]) => (
                      <MenuItem key={`${groupName}.${fieldName}`} value={`${groupName}.${fieldName}`}>
                        <Box sx={{ ml: 2 }}>
                          {fieldData.label}
                          <Chip 
                            label={fieldData.type} 
                            size="small" 
                            sx={{ ml: 1 }} 
                            color={fieldData.required ? "primary" : "default"}
                          />
                        </Box>
                      </MenuItem>
                    ))
                  ]).flat()}
                </Select>
              </FormControl>
            )}
            
            {/* Show selected field info */}
            {pregunta.profile_field_config && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Campo Seleccionado: {pregunta.profile_field_config.label}
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label={`Tipo: ${pregunta.profile_field_config.type}`} 
                    size="small" 
                    color="secondary" 
                    sx={{ mr: 1 }} 
                  />
                  <Chip 
                    label={`Pregunta: ${nombreTipoPregunta[pregunta.tipo]}`} 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 1 }} 
                  />
                  {pregunta.profile_field_config.required && (
                    <Chip 
                      label="Requerido" 
                      size="small" 
                      color="error" 
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {pregunta.profile_field_config.help_text}
                </Typography>

                {pregunta.profile_field_config.max_length && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Longitud máxima: {pregunta.profile_field_config.max_length} caracteres
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Show options for regular question types */}
        {tiposConOpciones.includes(pregunta.tipo) && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              Opciones:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(pregunta.opciones || []).map((op, i) => (
                <div key={i} style={{ display: "flex" }}>
                  <TextField
                    fullWidth
                    value={typeof op === "object" ? op.texto || "" : op}
                    onChange={(e) =>
                      handleOptionChange(
                        i,
                        typeof op === "object"
                          ? { ...op, texto: e.target.value }
                          : e.target.value
                      )
                    }
                    disabled={deshabilitado || pregunta.tipo === "binaria"}
                  />
                  <IconButton
                    onClick={() => deleteOpcion(i)}
                    color="error"
                    disabled={deshabilitado || pregunta.tipo === "binaria"}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              ))}
            </Box>
            <Button
              variant="outlined"
              onClick={addOpcion}
              disabled={deshabilitado || pregunta.tipo === "binaria"}
              sx={{ mt: 1 }}
            >
              Agregar opción
            </Button>
          </>
        )}

        {/* Show profile field choices (read-only) */}
        {pregunta.tipo === "profile_field_choice" && pregunta.profile_field_config?.choices && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Opciones Disponibles (del campo de perfil):
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {pregunta.profile_field_config.choices.map(([value, label]) => (
                <Chip 
                  key={value} 
                  label={`${label} (${value})`} 
                  variant="outlined" 
                  size="small" 
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Estas opciones se generan automáticamente desde el campo de perfil seleccionado.
            </Typography>
          </Box>
        )}

        {pregunta.tipo === "imagen" && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Imagen:
            </Typography>
            <Box>
              {pregunta.imagen && typeof pregunta.imagen === "string" && (
                <Box mb={1}>
                  <img
                    src={pregunta.imagen}
                    alt="Imagen de pregunta"
                    style={{
                      maxWidth: "200px",
                      display: "block",
                      borderRadius: 8,
                    }}
                  />
                </Box>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Box>
          </>
        )}

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Esta pregunta se desbloquea con:
        </Typography>

        {/* Mostrar desbloqueos existentes */}
        {(
          deshabilitado
            ? pregunta.desbloqueos_recibidos?.length > 0
            : pregunta.desbloqueo?.length > 0
        ) ? (
          (deshabilitado
            ? pregunta.desbloqueos_recibidos
            : pregunta.desbloqueo
          ).map((d, idx) => {
            const origen = deshabilitado
              ? preguntas.findIndex((p) => p.texto === d.pregunta_origen)
              : d.pregunta_id;
            return (
              <Typography key={idx} sx={{ ml: 2 }} variant="body2">
                {d.descripcion ||
                  `Pregunta ${origen + 1}: ${
                    preguntas?.[origen]?.texto
                  } - Opción: ${d.valor || d.opcion_desbloqueadora}`}
              </Typography>
            );
          })
        ) : (
          <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
            Sin desbloqueos
          </Typography>
        )}

        {/* Nueva sección para configurar desbloqueos */}
        {mostrarDesbloqueoDropdown &&
          !deshabilitado &&
          preguntasParaDesbloqueo.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Configurar nuevo desbloqueo:
              </Typography>

              {/* Selector de pregunta */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Seleccionar pregunta que desbloquea</InputLabel>
                <Select
                  value={preguntaSeleccionadaDesbloqueo}
                  label="Seleccionar pregunta que desbloquea"
                  onChange={handlePreguntaDesbloqueoChange}
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  {preguntasParaDesbloqueo.map((p) => (
                    <MenuItem key={p.index} value={p.index}>
                      Pregunta {p.index + 1}: {p.texto}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Selector de opción (solo si hay una pregunta seleccionada) */}
              {preguntaSeleccionadaDesbloqueo !== "" && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Opción que desbloquea</InputLabel>
                  <Select
                    label="Opción que desbloquea"
                    value={(() => {
                      const desbloqueoExistente = pregunta.desbloqueo?.find(
                        (d) =>
                          d.pregunta_id ===
                          parseInt(preguntaSeleccionadaDesbloqueo)
                      );
                      if (!desbloqueoExistente) return "";

                      const preguntaOrigen =
                        preguntas[parseInt(preguntaSeleccionadaDesbloqueo)];
                      const opciones = preguntaOrigen?.opciones || [];

                      // Si hay información de pre-selección, usarla
                      if (desbloqueoExistente.opcionSeleccionadaDesbloqueo) {
                        return opciones.findIndex(
                          (opt) =>
                            (typeof opt === "object" ? opt.texto : opt) ===
                            desbloqueoExistente.opcionSeleccionadaDesbloqueo
                        );
                      }

                      // Si no, usar el valor normal
                      return opciones.findIndex(
                        (opt) =>
                          (typeof opt === "object" ? opt.texto : opt) ===
                          desbloqueoExistente.valor
                      );
                    })()}
                    onChange={handleOpcionDesbloqueoChange}
                  >
                    <MenuItem value="">Ninguna</MenuItem>
                    {(
                      preguntas[parseInt(preguntaSeleccionadaDesbloqueo)]
                        ?.opciones || []
                    ).map((opt, j) => (
                      <MenuItem key={j} value={j}>
                        {typeof opt === "object" ? opt.texto : opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}

        {pregunta.desbloqueos_recibidos?.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Desbloqueos recibidos:
            </Typography>
            {pregunta.desbloqueos_recibidos.map((d, i) => (
              <Typography key={i} sx={{ ml: 2 }} variant="body2">
                Desde: {d.pregunta_origen + 1} — opción:{" "}
                {(() => {
                  const opciones =
                    preguntas?.[d.pregunta_origen]?.opciones || [];
                  const match = opciones.find((opt) =>
                    typeof opt === "object"
                      ? opt.texto === d.opcion_desbloqueadora
                      : opt === d.opcion_desbloqueadora
                  );
                  return typeof match === "object"
                    ? match.texto
                    : match || d.opcion_desbloqueadora;
                })()}
              </Typography>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PreguntaCard;
