import React, { useEffect, useState } from "react";
import { Box, TextField, Select, MenuItem, Typography } from "@mui/material";
import axios from "../../api";
import { useParams } from "react-router-dom";

const Canalizacion = ({
  usuarioId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const { uid } = useParams();

  const [stage, setStage] = useState(seleccionOpcion?.stage || "");
  const [explicacion, setExplicacion] = useState(
    seleccionOpcion?.explicacion || ""
  );
  const [email, setEmail] = useState(null);

  useEffect(() => {
    // Solo actualizar si hay cambios reales para evitar re-renders innecesarios
    const newValue = { stage, explicacion };
    if (JSON.stringify(newValue) !== JSON.stringify(seleccionOpcion)) {
      setSeleccionOpcion(newValue);
    }
  }, [stage, explicacion, setSeleccionOpcion]);

  // Obtener el email al montar el componente (solo una vez)
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await axios.get(`/api/candidatos/profiles/${usuarioId}/`);
        setEmail(res.data?.user?.email || null);
      } catch (err) {
        console.error("Error al obtener el email del candidato:", err);
      }
    };

    if (usuarioId && !email) {
      fetchEmail();
    }
  }, [usuarioId, email]);

  const handleStageChange = async (e) => {
    const nuevoStage = e.target.value;
    setStage(nuevoStage);

    try {
      if (usuarioId && nuevoStage && email) {
        await axios.put(`/api/candidatos/editar/${usuarioId}/`, {
          stage: nuevoStage,
          email: email,
        });
        console.log("Stage y email actualizados:", nuevoStage, email);
      }
    } catch (error) {
      console.error("Error al actualizar stage:", error);
    }
  };

  return (
    <Box
      sx={{
        width: "95%",
        mx: "auto",
        my: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maxWidth: "800px",
      }}
    >
      <Box>
        <Typography variant="h6" gutterBottom>
          Seleccionar etapa
        </Typography>
        <Select
          fullWidth
          value={stage}
          onChange={handleStageChange}
          disabled={disabled}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) return "Seleccionar etapa";
            const etiquetas = {
              Ent: "Entrevista",
              Cap: "Capacitación",
              Agn: "Agencia",
            };
            return etiquetas[selected] || selected;
          }}
          sx={{
            fontSize: "1.1rem",
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <MenuItem value="">Seleccionar etapa</MenuItem>
          <MenuItem value="Ent">Entrevista</MenuItem>
          <MenuItem value="Cap">Capacitación</MenuItem>
          <MenuItem value="Agn">Agencia</MenuItem>
        </Select>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Explicación
        </Typography>
        <TextField
          multiline
          rows={4}
          variant="filled"
          fullWidth
          value={explicacion}
          onChange={(e) => setExplicacion(e.target.value)}
          disabled={disabled}
          placeholder="Escribe una explicación"
          sx={{
            "& .MuiInputBase-input": {
              fontSize: "1.1rem",
            },
            "& .MuiInputLabel-root": {
              fontSize: "1.1rem",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Canalizacion;
