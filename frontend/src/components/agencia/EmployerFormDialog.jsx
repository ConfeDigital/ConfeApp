// components/agencia/EmployerFormDialog.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import api from "../../api";

export default function EmployerFormDialog({
  open,
  data,
  isEdit,
  onClose,
  onSubmit,
  companies,
  setEmployers,
  setAlert,
}) {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "", // only used on create
    company: "",
  });

  // Reset or preload on open
  useEffect(() => {
    if (open) {
      if (isEdit && data) {
        setForm({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          password: "",
          company: data.company || "",
        });
      } else {
        setForm({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          company: "",
        });

        if (companies && !Array.isArray(companies)) {
          setForm((prev) => ({
            ...prev,
            company: companies.id, // or companies if backend expects full object
          }));
        }        
      }
    }
  }, [open, isEdit, data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        // PATCH /employers/{pk}/
        const res = await api.patch(`api/agencia/employers/${data.id}/`, {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company || null,
        });
        setEmployers((em) =>
          em.map((e) => (e.id === res.data.id ? res.data : e))
        );
      } else {
        // POST /employers/
        const res = await api.post("api/agencia/employers/", {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          password: form.password,
          company: form.company || null,
        });
        setEmployers((em) => [...em, res.data]);
      }
      setAlert({
        severity: "success",
        message: "Empleador guardado correctamente",
      });
      onSubmit();
    } catch (err) {
      console.error("Error al guardar al empleador:", err);
      setAlert({ severity: "error", message: err });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Editar Empleador" : "Crear Empleador"}
      </DialogTitle>

      <DialogContent>
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          margin="dense"
          disabled={isEdit} // don't allow email change if you prefer
        />
        <TextField
          label="Nombre"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Apellido"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />

        {!isEdit && (
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
        )}

        {!!companies && (
          Array.isArray(companies) ? (
            <FormControl fullWidth margin="dense">
              <InputLabel>Empresa</InputLabel>
              <Select
                name="company"
                value={form.company || ""}
                label="Empresa"
                onChange={handleChange}
              >
                <MenuItem value="">— Ninguna —</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              margin="normal"
              label="Empresa"
              value={companies.name}
              disabled
            />
          )
        )}

      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          {isEdit ? "Guardar" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
