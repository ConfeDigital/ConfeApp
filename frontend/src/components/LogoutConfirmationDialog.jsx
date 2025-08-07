import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const LogoutConfirmationDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" py={2}>
        <WarningAmberIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", mb: 0 }}>
          ¿Cerrar Sesión?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center">
            ¿Estás seguro de que deseas cerrar tu sesión?
          </Typography>
        </DialogContent>
      </Box>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="secondary"
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmationDialog;
