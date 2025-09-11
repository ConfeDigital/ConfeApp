import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box } from '@mui/material';
import api from '../../api';
import PhotoCropDialog from '../photo_crop/PhotoCropDialog'; // Adjust import path as needed
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const CompanyFormDialog = ({ open, data, isEdit, onClose, onSubmit, setCompanies, setAlert }) => {
  const [companyFormData, setCompanyFormData] = useState({ name: '', logo: null });
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data) {
      setCompanyFormData({ name: data.name, logo: null, is_active: data.is_active });
    } else {
      setCompanyFormData({ name: '', logo: null, is_active: true });
    }
    // Reset image states when dialog opens/closes or data changes
    setSelectedImage(null);
    setOriginalFileName('');
  }, [data, open]);

  const handleChange = (e) => {
    setCompanyFormData({ ...companyFormData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store original filename without extension for cropped file
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFileName(nameWithoutExtension);
      
      // Create URL for the cropper
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCropDialogOpen(true);
    }
  };

  const handleCropSave = (croppedFile) => {
    setCompanyFormData({ ...companyFormData, logo: croppedFile });
    setCropDialogOpen(false);
    
    // Clean up the object URL
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    
    // Clean up the object URL
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', companyFormData.name);
      formData.append('is_active', companyFormData.is_active);
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

  const handleDialogClose = () => {
    // Clean up any remaining object URLs
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} fullWidth>
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
              startIcon={<CloudUploadIcon />}
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
          <Button color='secondary' onClick={handleDialogClose}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Crop Dialog */}
      <PhotoCropDialog
        open={cropDialogOpen}
        imageSrc={selectedImage}
        filename={originalFileName || 'company_logo'}
        onClose={handleCropCancel}
        onSave={handleCropSave}
      />
    </>
  );
};

export default CompanyFormDialog;