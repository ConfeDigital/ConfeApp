import React, { useEffect, useState } from "react";
import { Box, Typography, Slider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import axios from "../../api";

const Imagen = ({
  preguntaId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [imagenUrl, setImagenUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    const fetchImagen = async () => {
      try {
        const response = await axios.get(
          `/api/cuestionarios/ver-imagen-pregunta/${preguntaId}/`,
          { responseType: "blob" }
        );

        objectUrl = URL.createObjectURL(response.data);
        setImagenUrl(objectUrl);
      } catch (error) {
        console.error("❌ Error cargando la imagen de la pregunta:", error);
        setImagenUrl(null); // Limpia para mostrar mensaje en pantalla
      }
    };

    if (preguntaId) {
      fetchImagen();
    }

    return () => {
      // Limpia memoria cuando se desmonta o cambia
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [preguntaId]);

  const handleSliderChange = (_, value) => {
    setSeleccionOpcion(value);
  };

  // Inicializar el valor del slider si no hay selección previa
  useEffect(() => {
    if (seleccionOpcion === null || seleccionOpcion === undefined) {
      setSeleccionOpcion(0);
    }
  }, [seleccionOpcion, setSeleccionOpcion]);

  return (
    <Box
      sx={{
        width: "100%",
        mt: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 1, sm: 2 },
        gap: 4,
      }}
    >
      {imagenUrl ? (
        <Box
          component="img"
          src={imagenUrl}
          alt="Imagen de la pregunta"
          sx={{
            maxWidth: "100%",
            maxHeight: "300px",
            borderRadius: "8px",
            boxShadow: 3,
          }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{ color: colors.grey[400], fontStyle: "italic", mt: 2 }}
        ></Typography>
      )}

      <Box sx={{ width: "100%", maxWidth: "600px" }}>
        <Typography variant="h6" align="center" gutterBottom>
          Selecciona un valor:
        </Typography>
        <Slider
          value={
            seleccionOpcion !== null && seleccionOpcion !== undefined
              ? seleccionOpcion
              : 0
          }
          onChange={handleSliderChange}
          step={10}
          marks
          min={0}
          max={100}
          disabled={disabled}
          valueLabelDisplay="on"
        />
      </Box>
    </Box>
  );
};

export default Imagen;
