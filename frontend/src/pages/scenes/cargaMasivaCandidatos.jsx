import React, { useState } from "react";
import { Box, Button, Typography, Paper, Alert, Snackbar, LinearProgress } from "@mui/material";
import axios from "../../api";
import { getErrorMessage, formatErrorForDisplay } from "../../utils/errorHandling";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const UploadExcelComponent = () => {
    useDocumentTitle('Carga de Candidatos');
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setError("");
        setSuccess("");
        setUploadResult(null);
        
        // Validate file type
        if (file && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setError("Por favor, seleccione un archivo Excel (.xlsx o .xls)");
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Por favor, seleccione un archivo Excel");
            return;
        }

        setIsUploading(true);
        setError("");
        setSuccess("");
        setUploadResult(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("/api/candidatos/crear_masiva/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            console.log("✅ Upload Success:", response.data);
            
            const { successfully_processed, errors } = response.data;
            
            setUploadResult({
                successful: successfully_processed,
                errors: errors || []
            });
            
            if (successfully_processed > 0) {
                setSuccess(`✅ Carga exitosa: ${successfully_processed} candidatos procesados correctamente`);
            }
            
            if (errors && errors.length > 0) {
                setError(`⚠️ Se encontraron ${errors.length} errores durante el procesamiento`);
            }
            
        } catch (error) {
            console.error("❌ Upload Failed:", error);
            const errorMessage = getErrorMessage(error);
            setError(`❌ Error en la carga: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box m="20px">
            <Paper elevation={3} sx={{ padding: "20px" }}>
                <Typography variant="h6" gutterBottom>
                    📤 Carga Masiva de Candidatos
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Seleccione un archivo Excel (.xlsx) con los datos de los candidatos para cargar.
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={handleFileChange}
                        style={{ marginBottom: '10px' }}
                    />
                </Box>
                
                {isUploading && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Procesando archivo...
                        </Typography>
                    </Box>
                )}
                
                <Button 
                    onClick={handleUpload} 
                    variant="contained" 
                    color="primary"
                    disabled={!selectedFile || isUploading}
                    sx={{ mb: 2 }}
                >
                    {isUploading ? 'Procesando...' : 'Cargar Candidatos'}
                </Button>
                
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {uploadResult && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Resultados de la Carga
                        </Typography>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body1">
                                <strong>Candidatos procesados exitosamente:</strong> {uploadResult.successful}
                            </Typography>
                        </Alert>
                        
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <Box>
                                <Typography variant="h6" color="error" gutterBottom>
                                    Errores encontrados ({uploadResult.errors.length}):
                                </Typography>
                                
                                {uploadResult.errors.slice(0, 10).map((error, index) => (
                                    <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                                        <Typography variant="body2">
                                            <strong>Fila {error.index}:</strong> {JSON.stringify(error.errors)}
                                        </Typography>
                                    </Alert>
                                ))}
                                
                                {uploadResult.errors.length > 10 && (
                                    <Typography variant="body2" color="text.secondary">
                                        ... y {uploadResult.errors.length - 10} errores más
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default UploadExcelComponent;