import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from '../../api'; // adjust the path as needed

export const FileUploadSection = ({ uploadEndpoint, fetchData, FormatComponent }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openFormatDialog, setOpenFormatDialog] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      await axios.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchData();
      setFile(null);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        startIcon={<UploadFileIcon />}
        disabled={isUploading}
      >
        Subir CSV/Excel
      </Button>
      <Dialog
        open={openDialog}
        onClose={() => !isUploading && setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Subir Archivo CSV/Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack spacing={2}>
              <Button
                variant="contained"
                component="label"
                sx={{ maxWidth: 200 }}
                disabled={isUploading}
              >
                Seleccionar Archivo
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                />
              </Button>
              {file && (
                <Typography variant="body2">
                  Archivo Seleccionado: {file.name}
                </Typography>
              )}
            </Stack>
            <Button
              color="secondary"
              onClick={() => !isUploading && setOpenFormatDialog(true)}
              variant="outlined"
              disabled={isUploading}
            >
              Ver Formato
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            onClick={() => !isUploading && setOpenDialog(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={isUploading || !file}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openFormatDialog}
        onClose={() => setOpenFormatDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>Requisitos de Formato del Archivo</DialogTitle>
        <DialogContent>
          <FormatComponent />
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOpenFormatDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      {/* Backdrop to prevent interactions when uploading */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 2 }}
        open={isUploading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};
