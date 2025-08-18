import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const MetaPregunta = ({
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const [meta, setMeta] = React.useState(seleccionOpcion?.meta || "");
  const [pasos, setPasos] = React.useState(seleccionOpcion?.pasos || []);

  React.useEffect(() => {
    if(meta !== ""){
      setSeleccionOpcion({ meta, pasos });
    }
  }, [meta, pasos]);

  const handleAddPaso = () => {
    setPasos((prev) => [...prev, { descripcion: "", encargado: "Familiar" }]);
  };

  const handleRemovePaso = (index) => {
    setPasos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePasoChange = (index, field, value) => {
    const nuevosPasos = [...pasos];
    nuevosPasos[index][field] = value;
    setPasos(nuevosPasos);
  };

  const movePaso = (from, to) => {
    if (to < 0 || to >= pasos.length) return;
    const nuevosPasos = [...pasos];
    const temp = nuevosPasos[from];
    nuevosPasos[from] = nuevosPasos[to];
    nuevosPasos[to] = temp;
    setPasos(nuevosPasos);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Meta principal
      </Typography>
      <TextField
        fullWidth
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        disabled={disabled}
        placeholder="Escribe la meta"
        sx={{ mb: 2 }}
      />

      <Typography variant="h6" gutterBottom>
        Pasos
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {pasos.map((paso, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Typography variant="subtitle1">Paso {index + 1}</Typography>
            <TextField
              fullWidth
              label="Descripción"
              value={paso.descripcion}
              onChange={(e) =>
                handlePasoChange(index, "descripcion", e.target.value)
              }
              disabled={disabled}
              sx={{ my: 1 }}
            />
            <TextField
              fullWidth
              label="Encargado"
              value={paso.encargado}
              onChange={(e) =>
                handlePasoChange(index, "encargado", e.target.value)
              }
              disabled={disabled}
              placeholder="Escribe el encargado"
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 1,
              }}
            >
              <Box>
                <IconButton
                  onClick={() => movePaso(index, index - 1)}
                  disabled={disabled || index === 0}
                >
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton
                  onClick={() => movePaso(index, index + 1)}
                  disabled={disabled || index === pasos.length - 1}
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </Box>
              <IconButton
                onClick={() => handleRemovePaso(index)}
                disabled={disabled}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddPaso}
          variant="outlined"
          disabled={disabled}
        >
          Agregar paso
        </Button>
      </Box>
    </Box>
  );
};

export default MetaPregunta;
