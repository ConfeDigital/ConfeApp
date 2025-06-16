import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import api from '../../api';

const CompanyFormDialog = ({ open, data, isEdit, onClose, onSubmit, setCompanies, setAlert }) => {
  const [companyFormData, setCompanyFormData] = useState({ name: '' });

  useEffect(() => {
    if (data) {
      setCompanyFormData({ name: data.name });
    } else {
      setCompanyFormData({ name: '' });
    }
  }, [data, open]);

  const handleChange = (e) => {
    setCompanyFormData({ ...companyFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (isEdit && data && data.id) {
        const res = await api.put(`api/agencia/companies/${data.id}/`, companyFormData);
        setCompanies((co) => co.map((c) => (c.id === res.data.id ? res.data : c)));
      } else {
        const res = await api.post('api/agencia/companies/', companyFormData);
        setCompanies((co) => [...co, res.data]);
      }
      setAlert({
        severity: "success",
        message: "Empresa guardada correctamente",
      });
      onSubmit();
    } catch (error) {
      console.error("Error al enviar el formulario de empresa:", error);
      setAlert({ severity: "error", message: err });
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