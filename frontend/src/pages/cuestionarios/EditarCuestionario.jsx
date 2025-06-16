import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  MenuItem,
  Paper,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const tiposPregunta = [
  "abierta",
  "numero",
  "multiple",
  "checkbox",
  "dropdown",
  "fecha",
  "fecha_hora",
  "meta",
];

const EditorCuestionario = () => {
  const [preguntas, setPreguntas] = useState([]);

  const agregarPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      {
        texto: "",
        tipo: "abierta",
        opciones: [],
        desbloqueadaPor: null,
      },
    ]);
  };

  const eliminarPregunta = (index) => {
    setPreguntas((prev) => prev.filter((_, i) => i !== index));
  };

  const moverPregunta = (from, to) => {
    if (to < 0 || to >= preguntas.length) return;
    const copia = [...preguntas];
    const temp = copia[from];
    copia[from] = copia[to];
    copia[to] = temp;
    setPreguntas(copia);
  };

  const actualizarCampo = (index, campo, valor) => {
    const copia = [...preguntas];
    copia[index][campo] = valor;
    setPreguntas(copia);
  };

  const agregarOpcion = (index) => {
    const copia = [...preguntas];
    copia[index].opciones.push({ texto: "", valor: 0 });
    setPreguntas(copia);
  };

  const actualizarOpcion = (indexPregunta, indexOpcion, campo, valor) => {
    const copia = [...preguntas];
    copia[indexPregunta].opciones[indexOpcion][campo] = valor;
    setPreguntas(copia);
  };

  const eliminarOpcion = (indexPregunta, indexOpcion) => {
    const copia = [...preguntas];
    copia[indexPregunta].opciones.splice(indexOpcion, 1);
    setPreguntas(copia);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Editor de Cuestionario
      </Typography>

      {preguntas.map((pregunta, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">Pregunta {index + 1}</Typography>
            <Box>
              <IconButton
                onClick={() => moverPregunta(index, index - 1)}
                disabled={index === 0}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                onClick={() => moverPregunta(index, index + 1)}
                disabled={index === preguntas.length - 1}
              >
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton onClick={() => eliminarPregunta(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Texto de la pregunta"
            value={pregunta.texto}
            onChange={(e) => actualizarCampo(index, "texto", e.target.value)}
            sx={{ my: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de pregunta</InputLabel>
            <Select
              value={pregunta.tipo}
              onChange={(e) => actualizarCampo(index, "tipo", e.target.value)}
              label="Tipo de pregunta"
            >
              {tiposPregunta.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(pregunta.tipo === "multiple" ||
            pregunta.tipo === "checkbox" ||
            pregunta.tipo === "dropdown") && (
            <Box>
              <Typography variant="subtitle1">Opciones:</Typography>
              {pregunta.opciones.map((op, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, my: 1 }}>
                  <TextField
                    label="Texto"
                    value={op.texto}
                    onChange={(e) =>
                      actualizarOpcion(index, i, "texto", e.target.value)
                    }
                  />
                  <TextField
                    label="Valor"
                    type="number"
                    value={op.valor}
                    onChange={(e) =>
                      actualizarOpcion(
                        index,
                        i,
                        "valor",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <IconButton
                    onClick={() => eliminarOpcion(index, i)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                onClick={() => agregarOpcion(index)}
                startIcon={<AddIcon />}
              >
                Agregar opción
              </Button>
            </Box>
          )}

          <TextField
            fullWidth
            label="Desbloqueada por (texto pregunta o ID referencia)"
            value={pregunta.desbloqueadaPor || ""}
            onChange={(e) =>
              actualizarCampo(index, "desbloqueadaPor", e.target.value)
            }
            sx={{ mt: 2 }}
          />
        </Paper>
      ))}

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="contained"
          onClick={agregarPregunta}
          startIcon={<AddIcon />}
        >
          Agregar nueva pregunta
        </Button>
      </Box>
    </Box>
  );
};

export default EditorCuestionario;
