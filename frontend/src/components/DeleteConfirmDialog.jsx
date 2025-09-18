import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

export const DeleteConfirmDialog = ({ open, onClose, onConfirm, message= "¿Estás seguro de que deseas eliminar esta entrada?", caption= "Esta acción no se puede deshacer." }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar eliminación</DialogTitle>
      <DialogContent>
        <Typography>
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {caption}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};