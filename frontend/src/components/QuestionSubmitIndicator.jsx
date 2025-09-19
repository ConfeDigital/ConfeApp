import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RefreshIcon from "@mui/icons-material/Refresh";

const QuestionSubmitIndicator = ({
  preguntaId,
  responseState,
  queuePosition = 0,
}) => {
  const getIndicatorContent = () => {
    switch (responseState) {
      case "pending":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HourglassEmptyIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="caption" color="warning.main">
              En cola {queuePosition > 0 ? `(${queuePosition})` : ""}
            </Typography>
          </Box>
        );

      case "processing":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Guardando...
            </Typography>
          </Box>
        );

      case "success":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="caption" color="success.main">
              Guardado
            </Typography>
          </Box>
        );

      case "retrying":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RefreshIcon sx={{ color: "warning.main", fontSize: 20 }} />
            <Typography variant="caption" color="warning.main">
              Reintentando...
            </Typography>
          </Box>
        );

      case "error":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon sx={{ color: "error.main", fontSize: 20 }} />
            <Typography variant="caption" color="error.main">
              Error al guardar
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const getAriaLabel = () => {
    switch (responseState) {
      case "pending":
        return `Respuesta en cola, posición ${queuePosition}`;
      case "processing":
        return "Guardando respuesta";
      case "success":
        return "Respuesta guardada exitosamente";
      case "retrying":
        return "Reintentando guardar respuesta";
      case "error":
        return "Error al guardar respuesta";
      default:
        return "";
    }
  };

  if (!responseState) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: 1,
        py: 0.5,
      }}
      role="status"
      aria-label={getAriaLabel()}
    >
      {getIndicatorContent()}
    </Box>
  );
};

export default QuestionSubmitIndicator;
