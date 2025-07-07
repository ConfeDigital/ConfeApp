import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Ícono de palomita
import CancelIcon from "@mui/icons-material/Cancel"; // Ícono de tache
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { IconButton, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotificacionCuestionarios = ({ mensaje, tipo, onClose }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "90%",
        width: "600px",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          backgroundColor: tipo === "exito" ? "success.main" : "error.main",
          color: "white",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            p: 2,
            gap: 1,
          }}
        >
          <Box sx={{ mt: 0.5 }}>
            {tipo === "exito" ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              <CancelIcon fontSize="small" />
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              maxHeight: "300px",
              overflowY: "auto",
              pr: 1,
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.3)",
                borderRadius: "4px",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.4)",
                },
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-line",
                lineHeight: 1.5,
              }}
            >
              {mensaje}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{
              color: "white",
              mt: -0.5,
              mr: -0.5,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificacionCuestionarios;
