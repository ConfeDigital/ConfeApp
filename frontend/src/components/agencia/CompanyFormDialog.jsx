import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box } from '@mui/material';
import api from '../../api';

const CompanyFormDialog = ({ open, data, isEdit, onClose, onSubmit, setCompanies, setAlert }) => {
  const [companyFormData, setCompanyFormData] = useState({ name: '', logo: null });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data) {
      setCompanyFormData({ name: data.name, logo: null });
    } else {
      setCompanyFormData({ name: '', logo: null });
    }
  }, [data, open]);

  const handleChange = (e) => {
    setCompanyFormData({ ...companyFormData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setCompanyFormData({ ...companyFormData, logo: e.target.files[0] });
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', companyFormData.name);
      if (companyFormData.logo) {
        formData.append('logo', companyFormData.logo);
      }

      if (isEdit && data && data.id) {
        const res = await api.patch(`api/agencia/companies/${data.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setCompanies((co) => co.map((c) => (c.id === res.data.id ? res.data : c)));
      } else {
        const res = await api.post('api/agencia/companies/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setCompanies((co) => [...co, res.data]);
      }
      setAlert({
        severity: "success",
        message: "Empresa guardada correctamente",
      });
      onSubmit();
    } catch (error) {
      console.error("Error al enviar el formulario de empresa:", error);
      setAlert({ severity: "error", message: error.message || "Error al guardar la empresa" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{isEdit ? 'Editar Empresa' : 'Crear Empresa'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Nombre"
          name="name"
          value={companyFormData.name}
          onChange={handleChange}
          fullWidth
          sx={{ mt: 2 }}
        />
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current.click()}
          >
            Subir Logo
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          {companyFormData.logo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Archivo seleccionado: {companyFormData.logo.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyFormDialog;