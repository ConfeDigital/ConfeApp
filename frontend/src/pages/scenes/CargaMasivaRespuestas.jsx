import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  CheckCircle, 
  Error, 
  Warning, 
  Info 
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../../api';

const CargaMasivaRespuestas = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [cuestionarios, setCuestionarios] = useState([]);
  const [selectedCuestionario, setSelectedCuestionario] = useState('');
  const [nombreColumn, setNombreColumn] = useState('nombre');
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCuestionarios, setLoadingCuestionarios] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [step, setStep] = useState(1); // 1: seleccionar archivo, 2: validar, 3: subir

  // Cargar cuestionarios disponibles
  useEffect(() => {
    const fetchCuestionarios = async () => {
      setLoadingCuestionarios(true);
      try {
        console.log('Fetching cuestionarios...');
        const response = await api.get('/api/cuestionarios/carga-masiva-respuestas/');
        console.log('Response:', response.data);
        setCuestionarios(response.data.cuestionarios || []);
        console.log('Cuestionarios set:', response.data.cuestionarios || []);
      } catch (error) {
        console.error('Error cargando cuestionarios:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setLoadingCuestionarios(false);
      }
    };
    fetchCuestionarios();
  }, []);

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setUploadResult(null);
      setStep(1);
      
      // Leer el archivo para mostrar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data.length > 0) {
            setExcelData({
              headers: data[0],
              rows: data.slice(1, 6), // Solo mostrar primeras 5 filas
              totalRows: data.length - 1
            });
          }
        } catch (error) {
          console.error('Error leyendo archivo:', error);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Validar archivo
  const handleValidate = async () => {
    if (!selectedFile || !selectedCuestionario) {
      console.log('Faltan datos:', { selectedFile: !!selectedFile, selectedCuestionario });
      return;
    }

    console.log('Iniciando validación...', {
      fileName: selectedFile.name,
      cuestionario: selectedCuestionario,
      nombreColumn
    });

    setLoading(true);
    const formData = new FormData();
    formData.append('excel_file', selectedFile);
    formData.append('cuestionario_nombre', selectedCuestionario);
    formData.append('nombre_column', nombreColumn);

    try {
      console.log('Enviando request de validación...');
      const response = await api.post('/api/cuestionarios/validar-respuestas-excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta de validación:', response.data);
      console.log('validationResult.valido:', response.data.validation?.valido);
      console.log('Tipo de validationResult.valido:', typeof response.data.validation?.valido);
      setValidationResult(response.data.validation || response.data);
      setStep(2);
    } catch (error) {
      console.error('Error en validación:', error);
      console.error('Error response:', error.response?.data);
      setValidationResult({
        valido: false,
        errores: [error.response?.data?.error || 'Error validando archivo'],
        advertencias: [],
        info: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Subir archivo
  const handleUpload = async () => {
    if (!selectedFile || !selectedCuestionario) {
      console.log('Faltan datos para carga:', { selectedFile: !!selectedFile, selectedCuestionario });
      return;
    }

    console.log('Iniciando carga...', {
      fileName: selectedFile.name,
      cuestionario: selectedCuestionario,
      nombreColumn,
      overwrite
    });

    setLoading(true);
    const formData = new FormData();
    formData.append('excel_file', selectedFile);
    formData.append('cuestionario_nombre', selectedCuestionario);
    formData.append('nombre_column', nombreColumn);
    formData.append('overwrite', overwrite);

    // Debug: verificar FormData
    console.log('FormData creado:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      console.log('Enviando request de carga...');
      const response = await api.post('/api/cuestionarios/carga-masiva-respuestas/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Respuesta de carga:', response.data);
      setUploadResult(response.data);
      setStep(3);
    } catch (error) {
      console.error('Error en carga:', error);
      console.error('Error response:', error.response?.data);
      setUploadResult({
        error: error.response?.data?.error || 'Error subiendo archivo',
        stats: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario
  const handleReset = () => {
    setSelectedFile(null);
    setSelectedCuestionario('');
    setNombreColumn('nombre');
    setOverwrite(false);
    setValidationResult(null);
    setUploadResult(null);
    setExcelData(null);
    setStep(1);
  };



  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Carga Masiva de Respuestas a Cuestionarios
      </Typography>
      
      <Grid container spacing={3}>
        {/* Paso 1: Selección de archivo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paso 1: Seleccionar Archivo
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    Seleccionar Archivo Excel
                  </Button>
                </label>
              </Box>

              {selectedFile && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Archivo seleccionado: {selectedFile.name}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Cuestionario</InputLabel>
                <Select
                  value={selectedCuestionario}
                  onChange={(e) => setSelectedCuestionario(e.target.value)}
                  label="Cuestionario"
                  disabled={loadingCuestionarios}
                >
                  {loadingCuestionarios ? (
                    <MenuItem disabled>Cargando cuestionarios...</MenuItem>
                  ) : cuestionarios.length === 0 ? (
                    <MenuItem disabled>No hay cuestionarios disponibles</MenuItem>
                  ) : (
                    cuestionarios.map((cuestionario) => (
                      <MenuItem key={cuestionario.id} value={cuestionario.nombre}>
                        {cuestionario.nombre} (v{cuestionario.version})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {!loadingCuestionarios && cuestionarios.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No se encontraron cuestionarios activos
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Columna del nombre del usuario"
                value={nombreColumn}
                onChange={(e) => setNombreColumn(e.target.value)}
                sx={{ mb: 2 }}
                helperText="Nombre de la columna que contiene el nombre completo del usuario"
              />

              {selectedFile && selectedCuestionario && (
                <Button
                  variant="contained"
                  onClick={handleValidate}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Validar Archivo'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preview del archivo */}
        {excelData && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vista Previa del Archivo
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total de filas: {excelData.totalRows}
                </Typography>

                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {excelData.headers.map((header, index) => (
                          <th key={index} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Paso 2: Resultados de validación */}
      {validationResult && step >= 2 && validationResult.info && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Paso 2: Resultados de Validación
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={validationResult?.valido ? 'Archivo Válido' : 'Archivo Inválido'}
                color={validationResult?.valido ? 'success' : 'error'}
                icon={validationResult?.valido ? <CheckCircle /> : <Error />}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Estado de validación: {validationResult?.valido ? 'VÁLIDO' : 'INVÁLIDO'}
              </Typography>
            </Box>

            {validationResult.info?.cuestionario && (
              <Typography variant="body2" gutterBottom>
                <strong>Cuestionario:</strong> {validationResult.info.cuestionario}
              </Typography>
            )}

            {validationResult.info?.total_filas && (
              <Typography variant="body2" gutterBottom>
                <strong>Total de filas:</strong> {validationResult.info.total_filas}
              </Typography>
            )}

            {validationResult.errores?.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Errores:</Typography>
                <List dense>
                  {validationResult.errores.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Error color="error" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {validationResult.advertencias?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Advertencias:</Typography>
                <List dense>
                  {validationResult.advertencias.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {validationResult && (() => {
              console.log('Verificando condición de validación:', {
                validationResult: !!validationResult,
                valido: validationResult?.valido,
                validoType: typeof validationResult?.valido,
                shouldShow: validationResult?.valido === true
              });
              return validationResult?.valido === true;
            })() && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Archivo válido. Puedes proceder con la carga.
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Sobrescribir respuestas existentes</InputLabel>
                  <Select
                    value={overwrite}
                    onChange={(e) => setOverwrite(e.target.value)}
                    label="Sobrescribir respuestas existentes"
                  >
                    <MenuItem value={false}>No (ignorar respuestas existentes)</MenuItem>
                    <MenuItem value={true}>Sí (sobrescribir respuestas existentes)</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={() => {
                    console.log('Botón Subir Respuestas clickeado');
                    console.log('Estado actual:', {
                      selectedFile: !!selectedFile,
                      selectedCuestionario,
                      nombreColumn,
                      overwrite,
                      validationResult: !!validationResult
                    });
                    handleUpload();
                  }}
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Subir Respuestas'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Resultados de carga */}
      {uploadResult && step >= 3 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Paso 3: Resultados de Carga
            </Typography>

            {uploadResult.error ? (
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>Error:</Typography>
                {uploadResult.error}
              </Alert>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ¡Carga completada exitosamente!
                </Alert>

                {uploadResult.stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {uploadResult.stats.total_filas}
                        </Typography>
                        <Typography variant="body2">Total de filas</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {uploadResult.stats.usuarios_encontrados}
                        </Typography>
                        <Typography variant="body2">Usuarios encontrados</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {uploadResult.stats.respuestas_creadas}
                        </Typography>
                        <Typography variant="body2">Respuestas creadas</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {uploadResult.stats.respuestas_actualizadas}
                        </Typography>
                        <Typography variant="body2">Respuestas actualizadas</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {uploadResult.stats?.coincidencias_similitud && uploadResult.stats.coincidencias_similitud.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Coincidencias por similitud:</Typography>
                    <List dense>
                      {uploadResult.stats.coincidencias_similitud.map((coincidencia, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Info color="info" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${coincidencia.nombre_excel} → ${coincidencia.nombre_bd}`}
                            secondary={`Similitud: ${coincidencia.similitud}%`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}

                {uploadResult.stats?.errores && uploadResult.stats.errores.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Errores encontrados:</Typography>
                    <List dense>
                      {uploadResult.stats.errores.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Warning color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón de reset */}
      {(validationResult || uploadResult) && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="outlined" onClick={handleReset}>
            Iniciar Nueva Carga
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CargaMasivaRespuestas; 