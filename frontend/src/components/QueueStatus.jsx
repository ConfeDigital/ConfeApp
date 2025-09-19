import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import QueueIcon from "@mui/icons-material/Queue";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";

const QueueStatus = ({
  queueLength,
  isProcessing,
  onClearLogs,
  onExportLogs,
  getQueueStats,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (queueLength === 0 && !isProcessing) return null;

  const handleClearLogs = () => {
    if (onClearLogs) {
      onClearLogs();
    }
  };

  const handleExportLogs = () => {
    if (onExportLogs) {
      onExportLogs();
    }
  };

  const handleShowStats = () => {
    if (getQueueStats) {
      getQueueStats();
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: isMobile ? 10 : 20,
        right: isMobile ? 10 : 20,
        bgcolor: "background.paper",
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        zIndex: 1000,
        minWidth: isMobile ? 200 : 250,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <QueueIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {isProcessing ? "Procesando..." : `${queueLength} respuestas en cola`}
        </Typography>

        {/* Botones de acción */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Ver estadísticas">
            <IconButton size="small" onClick={handleShowStats} sx={{ p: 0.5 }}>
              <QueueIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exportar logs">
            <IconButton size="small" onClick={handleExportLogs} sx={{ p: 0.5 }}>
              <DownloadIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Limpiar logs">
            <IconButton size="small" onClick={handleClearLogs} sx={{ p: 0.5 }}>
              <ClearIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Barra de progreso */}
      {queueLength > 0 && (
        <LinearProgress
          variant={isProcessing ? "indeterminate" : "determinate"}
          value={isProcessing ? 50 : 0}
          sx={{
            mt: 1,
            height: 4,
            borderRadius: 2,
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
            },
          }}
        />
      )}

      {/* Información adicional en desktop */}
      {!isMobile && queueLength > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 1,
            textAlign: "center",
            fontSize: "0.7rem",
          }}
        >
          {isProcessing
            ? "Enviando al servidor..."
            : "Esperando procesamiento..."}
        </Typography>
      )}
    </Box>
  );
};

export default QueueStatus;
