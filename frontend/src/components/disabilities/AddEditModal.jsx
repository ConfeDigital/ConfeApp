import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  InputLabel,
  Box,
} from "@mui/material";

export const AddEditModal = ({
  open,
  onClose,
  formData,
  setFormData,
  tabIndex,
  data,
  handleCreateOrUpdate,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formData.id ? "Editar" : "Añadir"}{" "}
        {tabIndex === 0 ? "Grupo" : "Discapacidad"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
          {tabIndex === 1 && (
            <Box>
              <InputLabel id="group-select-label">Seleccionar Grupo</InputLabel>
              <Select
                labelId="group-select-label"
                fullWidth
                value={formData.group}
                onChange={(e) =>
                  setFormData({ ...formData, group: e.target.value })
                }
                displayEmpty
              >
                {data.groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleCreateOrUpdate} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditModal;
