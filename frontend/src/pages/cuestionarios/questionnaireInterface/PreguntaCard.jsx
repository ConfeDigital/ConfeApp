import React from "react";
import {
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
} from "@mui/material";
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
    updatePregunta(index, { ...pregunta, imagen: file });
  };

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
            value={pregunta.tipo}
            label="Tipo de pregunta"
            onChange={(e) =>
              updatePregunta(index, {
                ...pregunta,
                tipo: e.target.value,
                opciones: [],
              })
            }
            disabled={deshabilitado}
          >
            {tiposPermitidos.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {nombreTipoPregunta[tipo] || tipo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {tiposConOpciones.includes(pregunta.tipo) && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Opciones:
            </Typography>
            {(pregunta.opciones || []).map((op, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
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
            <Button
              variant="outlined"
              onClick={addOpcion}
              disabled={deshabilitado || pregunta.tipo === "binaria"}
            >
              Agregar opción
            </Button>
          </>
        )}

        {pregunta.tipo === "imagen" && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Imagen:
            </Typography>
            <Button variant="contained" component="label">
              Subir imagen
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageChange}
              />
            </Button>
            {pregunta.imagen && (
              <img
                src={URL.createObjectURL(pregunta.imagen)}
                alt="Vista previa"
                style={{ marginTop: 16, maxWidth: "100%", borderRadius: 8 }}
              />
            )}
          </>
        )}

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Esta pregunta se desbloquea con:
        </Typography>

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
                  `Pregunta ${origen + 1}: ${preguntas?.[origen]?.texto}`}
              </Typography>
            );
          })
        ) : (
          <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
            Sin desbloqueos
          </Typography>
        )}

        {mostrarDesbloqueoDropdown &&
          preguntas.map((p, i) =>
            tiposConOpciones.includes(p.tipo) && i < index ? (
              <React.Fragment key={i}>
                <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                  Pregunta {i + 1}: {p.texto}
                </Typography>
                <FormControl fullWidth margin="dense">
                  <InputLabel>{`Desbloqueo desde Pregunta ${
                    i + 1
                  }`}</InputLabel>
                  <Select
                    label="Desbloqueo desde Pregunta"
                    value={(() => {
                      if (!deshabilitado) {
                        const desbloqueoItem =
                          pregunta.desbloqueo?.find(
                            (d) => d.pregunta_id === i
                          ) ||
                          pregunta.desbloqueos_recibidos?.find(
                            (d) => d.pregunta_origen === i
                          );
                        if (!desbloqueoItem) return "";

                        const opciones = p.opciones || [];
                        const valorActual =
                          desbloqueoItem.valor ||
                          desbloqueoItem.opcion_desbloqueadora;

                        return opciones.findIndex(
                          (opt) =>
                            (typeof opt === "object" ? opt.texto : opt) ===
                            valorActual
                        );
                      } else {
                        const match = pregunta.desbloqueos_recibidos?.find(
                          (d) => d.pregunta_origen === p.texto
                        );
                        if (!match) return "";

                        const opciones = p.opciones || [];
                        return opciones.findIndex(
                          (opt) =>
                            (typeof opt === "object" ? opt.texto : opt) ===
                            match.opcion_desbloqueadora
                        );
                      }
                    })()}
                    onChange={(e) => {
                      const opcionIndex = parseInt(e.target.value);
                      const nuevaDesbloqueo = [
                        ...(pregunta.desbloqueo || []).filter(
                          (d) => d.origenIndex !== i
                        ),
                      ];
                      if (!isNaN(opcionIndex)) {
                        const opciones = p.opciones || [];
                        const valor =
                          typeof opciones[opcionIndex] === "object"
                            ? opciones[opcionIndex].texto
                            : opciones[opcionIndex];

                        nuevaDesbloqueo.push({
                          origenIndex: i,
                          opcionIndex,
                          valor,
                          pregunta_id: i,
                          descripcion: `Pregunta ${i + 1}: ${p.texto}`,
                        });
                      }
                      updatePregunta(index, {
                        ...pregunta,
                        desbloqueo: nuevaDesbloqueo,
                      });
                    }}
                    disabled={deshabilitado}
                  >
                    <MenuItem value="">Ninguna</MenuItem>
                    {(p.opciones || []).map((opt, j) => (
                      <MenuItem key={j} value={j}>
                        {typeof opt === "object" ? opt.texto : opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </React.Fragment>
            ) : null
          )}
      </CardContent>
      {pregunta.desbloqueos_recibidos?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Desbloqueos recibidos:
          </Typography>
          {pregunta.desbloqueos_recibidos.map((d, i) => (
            <Typography key={i} sx={{ ml: 2 }} variant="body2">
              Desde: {d.pregunta_origen + 1} — opción:{" "}
              {(() => {
                const opciones = preguntas?.[d.pregunta_origen]?.opciones || [];
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
    </Card>
  );
};

export default PreguntaCard;
