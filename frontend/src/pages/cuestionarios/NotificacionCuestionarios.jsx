import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Ícono de palomita
import CancelIcon from "@mui/icons-material/Cancel"; // Ícono de tache
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const NotificacionCuestionarios = ({ mensaje, tipo, onClose }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: tipo === "exito" ? "success.main" : "error.main",
        color: "white",
        padding: 2,
        borderRadius: 1,
        zIndex: 9999,
        boxShadow: 3,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {tipo === "exito" ? (
        <CheckCircleIcon fontSize="small" />
      ) : (
        <CancelIcon fontSize="small" />
      )}
      <Typography variant="body1">{mensaje}</Typography>
      <IconButton size="small" sx={{ color: "white", ml: 1 }} onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default NotificacionCuestionarios;
