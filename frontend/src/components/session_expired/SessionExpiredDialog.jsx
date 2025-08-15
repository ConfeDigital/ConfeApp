// components/SessionExpiredDialog.jsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function SessionExpiredDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        Sesión expirada
      </DialogTitle>
      <DialogContent sx={{ textAlign: "center" }}>
        <Typography>Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.</Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button variant="contained" color="primary" onClick={onClose}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
