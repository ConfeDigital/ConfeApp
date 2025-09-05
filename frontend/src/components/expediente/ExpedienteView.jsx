import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Divider,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  MedicalServices,
  Emergency,
  ContactPhone,
  PictureAsPdf,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { formatCanonicalPhoneNumber } from '../phone_number/phoneUtils';
import jsPDF from 'jspdf';

dayjs.locale('es');

const ExpedienteView = ({ candidateProfile }) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  // Mapeo de choices para campos con opciones predefinidas
  const GENDER_CHOICES = {
    'M': 'Masculino',
    'F': 'Femenino',
    'O': 'Otro'
  };

  const PENSION_CHOICES = {
    'No': 'No',
    'Bie': 'Bienestar',
    'Orf': 'Orfandad',
    'Otr': 'Otra'
  };

  const SOCIAL_SECURITY_CHOICES = {
    'IMSS': 'IMSS',
    'ISSSTE': 'ISSSTE',
    'PEMEX': 'PEMEX',
    'IMSS-BIENESTAR': 'IMSS-Bienestar',
    'PARTICULAR': 'Particular',
    'OTRO': 'Otro',
    'NINGUNO': 'Ninguno'
  };

  // Calcular edad
  let age = '';
  if (candidateProfile.birth_date) {
    age = dayjs().diff(dayjs(candidateProfile.birth_date), 'year') + ' años';
  }

  // Formatear dirección
  const formatAddress = () => {
    if (!candidateProfile.domicile) return 'No especificada';
    
    const { domicile } = candidateProfile;
    const parts = [
      domicile.address_road,
      domicile.address_number,
      domicile.address_number_int,
      domicile.address_col,
      domicile.address_municip,
      domicile.address_city,
      domicile.address_state,
      domicile.address_PC
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Formatear medicamentos
  const formatMedications = () => {
    if (!candidateProfile.medications || candidateProfile.medications.length === 0) {
      return 'Ninguno';
    }
    return candidateProfile.medications.map(m => m.name).join(', ');
  };

  // Formatear discapacidades
  const formatDisabilities = () => {
    if (!candidateProfile.disability || candidateProfile.disability.length === 0) {
      return 'Ninguna';
    }
    return candidateProfile.disability.map(d => d.name).join(', ');
  };

  // Helper para obtener el display de choices
  const getChoiceDisplay = (value, choices) => {
    return choices[value] || value || 'No especificado';
  };

  // Función para generar y descargar el PDF de la ficha técnica
  const generatePDF = () => {
    setPdfLoading(true);
    try {
      console.log('Generando PDF de la ficha técnica...');
      
      // Crear el PDF en orientación landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const startX = margin;
      const startY = margin;
      let currentY = startY;
      
      // Configuración de fuentes
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      
      // Título principal
      pdf.text('FICHA TÉCNICA DEL CANDIDATO', pdfWidth / 2, currentY, { align: 'center' });
      currentY += 10;
      
      // Información del candidato
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMACIÓN PERSONAL:', startX, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Datos personales
      const personalInfo = [
        `Nombre: ${candidateProfile.user.first_name} ${candidateProfile.user.last_name} ${candidateProfile.user.second_last_name || ''}`,
        `CURP: ${candidateProfile.curp || 'No especificado'}`,
        `Fecha de Nacimiento: ${candidateProfile.birth_date ? dayjs(candidateProfile.birth_date).format('DD/MM/YYYY') : 'No especificada'}`,
        `Edad: ${candidateProfile.birth_date ? dayjs().diff(dayjs(candidateProfile.birth_date), 'year') : 'No especificada'}`,
        `Género: ${getChoiceDisplay(candidateProfile.gender, GENDER_CHOICES)}`,
        `Teléfono: ${candidateProfile.phone_number ? formatCanonicalPhoneNumber(candidateProfile.phone_number) : 'No especificado'}`,
        `Email: ${candidateProfile.email || 'No especificado'}`
      ];
      
      personalInfo.forEach(info => {
        pdf.text(info, startX, currentY);
        currentY += 5;
      });
      
      currentY += 5;
      
      // Información médica
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('INFORMACIÓN MÉDICA:', startX, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      const medicalInfo = [
        `Medicamentos: ${formatMedications()}`,
        `Alergias: ${candidateProfile.allergies || 'Ninguna'}`,
        `Restricciones Dietéticas: ${candidateProfile.dietary_restrictions || 'Ninguna'}`,
        `Restricciones Físicas: ${candidateProfile.physical_restrictions || 'Ninguna'}`,
        `Certificado de Discapacidad: ${candidateProfile.has_disability_certificate ? 'Sí' : 'No'}`,
        `Juicio de Interdicción: ${candidateProfile.has_interdiction_judgment ? 'Sí' : 'No'}`,
        `Recibe Pensión: ${getChoiceDisplay(candidateProfile.receives_pension, PENSION_CHOICES)}`,
        `Seguridad Social: ${getChoiceDisplay(candidateProfile.social_security, SOCIAL_SECURITY_CHOICES)}`
      ];
      
      medicalInfo.forEach(info => {
        pdf.text(info, startX, currentY);
        currentY += 5;
      });
      
      currentY += 5;
      
      // Domicilio
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DOMICILIO:', startX, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      if (candidateProfile.domicile) {
        pdf.text(`Dirección: ${formatAddress()}`, startX, currentY);
        currentY += 5;
        pdf.text(`Tipo de Residencia: ${candidateProfile.domicile.residence_type || 'No especificado'}`, startX, currentY);
        currentY += 5;
      } else {
        pdf.text('No especificada', startX, currentY);
        currentY += 5;
      }
      
      currentY += 5;
      
      // Contactos de emergencia
      if (candidateProfile.emergency_contacts && candidateProfile.emergency_contacts.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('CONTACTOS DE EMERGENCIA:', startX, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        candidateProfile.emergency_contacts.forEach((contact, index) => {
          if (currentY > pdfHeight - 30) {
            pdf.addPage();
            currentY = startY;
          }
          
          pdf.text(`${index + 1}. ${contact.first_name} ${contact.last_name} ${contact.second_last_name || ''}`, startX, currentY);
          currentY += 4;
          pdf.text(`   Relación: ${contact.relationship}`, startX + 5, currentY);
          currentY += 4;
          pdf.text(`   Teléfono: ${contact.phone_number || 'No especificado'}`, startX + 5, currentY);
          currentY += 4;
          pdf.text(`   Email: ${contact.email || 'No especificado'}`, startX + 5, currentY);
          currentY += 6;
        });
      }
      
      // Descargar el PDF
      const fileName = `ficha_tecnica_${candidateProfile.user.first_name}_${candidateProfile.user.last_name}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF generado exitosamente');
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Botón de descarga PDF simple */}
      <Box 
        display="flex" 
        justifyContent="flex-end" 
        gap={1.5}
        mb={1}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
          onClick={generatePDF}
          disabled={pdfLoading}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          {pdfLoading ? 'Generando PDF...' : 'Descargar Ficha Técnica'}
        </Button>
      </Box>

      {/* Contenido principal del expediente */}
      <Box>
        {/* Header ultra compacto con foto y información básica */}
        <Paper elevation={2} sx={{ p: 0.8, mb: 0.8 }}>
          <Box display="flex" alignItems="flex-start" gap={0.8}>
            <Avatar
              src={candidateProfile.photo || undefined}
              sx={{
                width: 40,
                height: 40,
                border: '1px solid #1976d2',
                flexShrink: 0,
              }}
            >
              {!candidateProfile.photo && candidateProfile.user.first_name.charAt(0)}
            </Avatar>
            
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" fontWeight="bold" gutterBottom noWrap sx={{ mb: 0.2, fontSize: '0.9rem' }}>
                {candidateProfile.user.first_name} {candidateProfile.user.last_name} {candidateProfile.user.second_last_name || ''}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={0.8} mb={0.2} flexWrap="wrap">
                <Chip
                  label={candidateProfile.user.is_active ? 'ACTIVO' : 'INACTIVO'}
                  color={candidateProfile.user.is_active ? 'success' : 'error'}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
                {candidateProfile.cycle && (
                  <Chip
                    label={candidateProfile.cycle.name}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" display="flex" alignItems="center">
                    <Person sx={{ mr: 1, fontSize: 16 }} />
                    {age} • {getChoiceDisplay(candidateProfile.gender, GENDER_CHOICES)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" display="flex" alignItems="center">
                    <Phone sx={{ mr: 1, fontSize: 16 }} />
                    {formatCanonicalPhoneNumber(candidateProfile.phone_number || 'No especificado')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" display="flex" alignItems="center">
                    <Email sx={{ mr: 1, fontSize: 16 }} />
                    {candidateProfile.user.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                    {candidateProfile.curp || 'CURP no especificada'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={0.8}>
          {/* Primera columna: Información Personal */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 0.8, mb: 0.8 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '0.8rem', mb: 0.2 }}>
                <Person sx={{ verticalAlign: 'middle', mr: 0.2, fontSize: 12 }} />
                Información Personal
              </Typography>
              <Divider sx={{ mb: 0.2 }} />
              
              <Box sx={{ fontSize: '0.7rem' }}>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Fecha de Nacimiento:</span>
                  <span>{candidateProfile.birth_date ? dayjs(candidateProfile.birth_date).format('LL') : 'No especificada'}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Tipo de Sangre:</span>
                  <span>{candidateProfile.blood_type || 'No especificado'}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Discapacidad:</span>
                  <span>{formatDisabilities()}</span>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 0.8, mb: 0.8 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '0.8rem', mb: 0.2 }}>
                <LocationOn sx={{ verticalAlign: 'middle', mr: 0.2, fontSize: 12 }} />
                Domicilio
              </Typography>
              <Divider sx={{ mb: 0.2 }} />
              
              {candidateProfile.domicile ? (
                <Box sx={{ fontSize: '0.7rem' }}>
                  <Box display="flex" justifyContent="space-between" mb={0.15}>
                    <span style={{ fontWeight: 'bold' }}>Dirección:</span>
                    <span style={{ textAlign: 'right', maxWidth: '60%' }}>{formatAddress()}</span>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.15}>
                    <span style={{ fontWeight: 'bold' }}>Tipo de Residencia:</span>
                    <span>{candidateProfile.domicile.residence_type || 'No especificado'}</span>
                  </Box>
                </Box>
              ) : (
                <Typography color="textSecondary" sx={{ fontSize: '0.7rem' }}>No especificada</Typography>
              )}
            </Paper>
          </Grid>

          {/* Segunda columna: Información Médica */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 0.8, mb: 0.8 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '0.8rem', mb: 0.2 }}>
                <MedicalServices sx={{ verticalAlign: 'middle', mr: 0.2, fontSize: 12 }} />
                Información Médica
              </Typography>
              <Divider sx={{ mb: 0.2 }} />
              
              <Box sx={{ fontSize: '0.7rem' }}>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Medicamentos:</span>
                  <span style={{ textAlign: 'right', maxWidth: '60%' }}>{formatMedications()}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Alergias:</span>
                  <span>{candidateProfile.allergies || 'Ninguna'}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Restricciones Dietéticas:</span>
                  <span>{candidateProfile.dietary_restrictions || 'Ninguna'}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Restricciones Físicas:</span>
                  <span>{candidateProfile.physical_restrictions || 'Ninguna'}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Certificado de Discapacidad:</span>
                  <Chip
                    label={candidateProfile.has_disability_certificate ? 'Sí' : 'No'}
                    color={candidateProfile.has_disability_certificate ? 'success' : 'default'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Juicio de Interdicción:</span>
                  <Chip
                    label={candidateProfile.has_interdiction_judgment ? 'Sí' : 'No'}
                    color={candidateProfile.has_interdiction_judgment ? 'warning' : 'default'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Recibe Pensión:</span>
                  <span>{getChoiceDisplay(candidateProfile.receives_pension, PENSION_CHOICES)}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Seguridad Social:</span>
                  <span>{getChoiceDisplay(candidateProfile.social_security, SOCIAL_SECURITY_CHOICES)}</span>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Atención Psicológica:</span>
                  <Chip
                    label={candidateProfile.receives_psychological_care ? 'Sí' : 'No'}
                    color={candidateProfile.receives_psychological_care ? 'info' : 'default'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Atención Psiquiátrica:</span>
                  <Chip
                    label={candidateProfile.receives_psychiatric_care ? 'Sí' : 'No'}
                    color={candidateProfile.receives_psychiatric_care ? 'info' : 'default'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.15}>
                  <span style={{ fontWeight: 'bold' }}>Presenta Convulsiones:</span>
                  <Chip
                    label={candidateProfile.has_seizures ? 'Sí' : 'No'}
                    color={candidateProfile.has_seizures ? 'error' : 'default'}
                    size="small"
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Tercera columna: Domicilio */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 0.8, mb: 0.8 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '0.8rem', mb: 0.2 }}>
                <LocationOn sx={{ verticalAlign: 'middle', mr: 0.2, fontSize: 12 }} />
                Domicilio
              </Typography>
              <Divider sx={{ mb: 0.2 }} />
              
              {candidateProfile.domicile ? (
                <Box sx={{ fontSize: '0.7rem' }}>
                  <Box display="flex" justifyContent="space-between" mb={0.15}>
                    <span style={{ fontWeight: 'bold' }}>Dirección:</span>
                    <span style={{ textAlign: 'right', maxWidth: '60%' }}>{formatAddress()}</span>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.15}>
                    <span style={{ fontWeight: 'bold' }}>Tipo de Residencia:</span>
                    <span>{candidateProfile.domicile.residence_type || 'No especificado'}</span>
                  </Box>
                </Box>
              ) : (
                <Typography color="textSecondary" sx={{ fontSize: '0.7rem' }}>No especificada</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Contactos de Emergencia - Ultra compacto */}
        {candidateProfile.emergency_contacts && candidateProfile.emergency_contacts.length > 0 && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 0.8 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ fontSize: '0.8rem', mb: 0.2 }}>
                <Emergency sx={{ verticalAlign: 'middle', mr: 0.2, fontSize: 12 }} />
                Contactos de Emergencia
              </Typography>
              <Divider sx={{ mb: 0.2 }} />
              
              <Grid container spacing={0.8}>
                {candidateProfile.emergency_contacts.map((contact, index) => (
                  <Grid item xs={12} sm={6} key={contact.id}>
                    <Paper variant="outlined" sx={{ p: 0.8 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ fontSize: '0.75rem', mb: 0.2 }}>
                        {contact.first_name} {contact.last_name} {contact.second_last_name || ''}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.2}>
                        <Chip
                          label={contact.relationship}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                        {contact.lives_at_same_address && (
                          <Chip
                            label="Misma dirección"
                            color="success"
                            size="small"
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.65rem' }}>
                        <ContactPhone sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 10 }} />
                        {contact.phone_number || 'No especificado'}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.65rem' }}>
                        <Email sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 10 }} />
                        {contact.email || 'No especificado'}
                      </Typography>
                      
                      {!contact.lives_at_same_address && contact.domicile && (
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                          <LocationOn sx={{ verticalAlign: 'middle', mr: 0.3, fontSize: 10 }} />
                          {contact.domicile.address_road}, {contact.domicile.address_number}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ExpedienteView;
