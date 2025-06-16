import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  Typography,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import axios from "../../api";

const SeleccionarMetasDesdeCuestionario = ({
  open,
  onClose,
  uid,
  onAgregarMetas,
}) => {
  const [cuestionariosBase, setCuestionariosBase] = useState([]);
  const [cuestionarioSeleccionado, setCuestionarioSeleccionado] =
    useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [metasSeleccionadas, setMetasSeleccionadas] = useState([]);

  useEffect(() => {
    if (open) {
      axios
        .get("/api/cuestionarios/")
        .then((res) => setCuestionariosBase(res.data));
    }
  }, [open]);

  const handleSeleccionCuestionario = (cuestId) => {
    setCuestionarioSeleccionado(cuestId);
    setMetasSeleccionadas([]);

    axios
      .get(
        `/api/cuestionarios/usuario/respuestas-unlocked-path/?usuario_id=${uid}&cuestionario_id=${cuestId}`
      )
      .then((res) => {
        const metas = res.data.map((r) => ({
          id: r.pregunta_id,
          titulo: r.pregunta_texto,
          pasos: [],
        }));
        setPreguntas(metas);
      });
  };

  const toggleMeta = (meta) => {
    setMetasSeleccionadas((prev) => {
      const yaExiste = prev.some((m) => m.id === meta.id);
      return yaExiste ? prev.filter((m) => m.id !== meta.id) : [...prev, meta];
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Seleccionar metas desde un cuestionario</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Cuestionario</InputLabel>
          <Select
            value={cuestionarioSeleccionado || ""}
            onChange={(e) => handleSeleccionCuestionario(e.target.value)}
            label="Cuestionario"
          >
            {cuestionariosBase
              .flatMap((base) => base.cuestionarios)
              .map((cuest) => (
                <MenuItem key={cuest.id} value={cuest.id}>
                  {cuest.nombre} (v{cuest.version})
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {preguntas.length > 0 && (
          <>
            <Typography variant="subtitle1" mt={2}>
              Selecciona las metas que quieres agregar:
            </Typography>
            {preguntas.map((meta) => (
              <FormControl key={meta.id} fullWidth>
                <MenuItem onClick={() => toggleMeta(meta)}>
                  <Checkbox
                    checked={metasSeleccionadas.some((m) => m.id === meta.id)}
                  />
                  <ListItemText primary={meta.titulo} />
                </MenuItem>
              </FormControl>
            ))}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => {
            onAgregarMetas(metasSeleccionadas);
            onClose();
          }}
        >
          Agregar metas seleccionadas
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SeleccionarMetasDesdeCuestionario;
