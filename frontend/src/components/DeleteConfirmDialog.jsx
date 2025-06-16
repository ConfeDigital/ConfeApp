import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";

export const DeleteConfirmDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro de que deseas eliminar esta entrada?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};