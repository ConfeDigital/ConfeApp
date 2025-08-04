import React, { useState } from 'react';
import { Box, Typography, Grid2 as Grid, Collapse, Button, Divider, Paper, useTheme } from '@mui/material';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const PENSION_CHOICES = [
    ['No', 'No'],
    ['Bie', 'Sí, del Bienestar'],
    ['Orf', 'Sí, de orfandad'],
    ['Otr', 'Sí (tipo no incluido en la base de datos)'],
];

const SOCIAL_SECURITY_CHOICES = [
  ['IMSS', 'IMSS'],
  ['ISSSTE', 'ISSSTE'],
  ['PEMEX', 'PEMEX'],
  ['IMSS-BIENESTAR', 'IMSS-Bienestar'],
  ['PARTICULAR', 'Particular'],
  ['OTRO', 'Otro'],
  ['NINGUNO', 'Ninguno'],
];

// Create a map for easy lookup
const pensionLabelMap = new Map(PENSION_CHOICES);
const socialSecurityLabelMap = new Map(SOCIAL_SECURITY_CHOICES);

const DetailSection = ({ candidateProfile }) => {
  const [showDetails, setShowDetails] = useState(false);
  const theme = useTheme();

  dayjs.locale('es');

  // Compute age
  let age = '';
  if (candidateProfile.birth_date) {
    age = dayjs().diff(dayjs(candidateProfile.birth_date), 'year') + ' años';
  }

  // Compute formatted address
  const { domicile } = candidateProfile;
  const address = domicile
    ? `${domicile.address_road}, ${domicile.address_number}${
        domicile.address_number_int ? ' - ' + domicile.address_number_int : ''
      }, ${domicile.address_col}, ${domicile.address_municip}, ${domicile.address_city}, ${domicile.address_state}`
    : <Typography component="span" color="text.secondary">No disponible</Typography>;

  // Medical details
  const medicalDetails = [
    ['Tipo de Sangre', candidateProfile.blood_type || <Typography component="span" color="text.secondary">No disponible</Typography>],
    [
      'Medicamentos',
      candidateProfile.medications?.length
        ? candidateProfile.medications.map(m => m.name).join(', ')
        : <Typography component="span" color="text.secondary">N/A</Typography>,
    ],
    ['Alergias', candidateProfile.allergies || <Typography component="span" color="text.secondary">N/A</Typography>],
    ['Restricciones Dietéticas', candidateProfile.dietary_restrictions || <Typography component="span" color="text.secondary">N/A</Typography>],
    ['Restricciones Físicas', candidateProfile.physical_restrictions || <Typography component="span" color="text.secondary">N/A</Typography>],
  ];

  // Additional info
  const additionalInfo = [
    [
      'Certificado de discapacidad',
      candidateProfile.has_disability_certificate ? 'Sí' : 'No',
    ],
    [
      'Juicio de interdicción',
      candidateProfile.has_interdiction_judgment ? 'Sí' : 'No',
    ],
    [
      'Recibe pensión',
      candidateProfile.receives_pension
        ? pensionLabelMap.get(candidateProfile.receives_pension) || candidateProfile.receives_pension
        : <Typography component="span" color="text.secondary">N/A</Typography>,
    ],
    [
      'Seguridad Social',
      candidateProfile.social_security
        ? socialSecurityLabelMap.get(candidateProfile.social_security) || candidateProfile.social_security
        : <Typography component="span" color="text.secondary">N/A</Typography>,
    ],
    [
      'Atención psicológica',
      candidateProfile.receives_psychological_care ? 'Sí' : 'No',
    ],
    [
      'Atención psiquiátrica',
      candidateProfile.receives_psychiatric_care ? 'Sí' : 'No',
    ],
    ['Presenta convulsiones', candidateProfile.has_seizures ? 'Sí' : 'No'],
  ];

  // Personal info
  const personalInfo = [
    ['Fecha de nacimiento', dayjs(candidateProfile.birth_date).format('LL') || <Typography component="span" color="text.secondary">No disponible</Typography>],
    ['Edad', age || <Typography component="span" color="text.secondary">No disponible</Typography>],
    ['Registro', dayjs(candidateProfile.registration_date).format('LL') || <Typography component="span" color="text.secondary">No disponible</Typography>],
    ['CURP', candidateProfile.curp || <Typography component="span" color="text.secondary">No disponible</Typography>],
  ];

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="text"
          color="info"
          sx={{ fontWeight: "bold" }}
          endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {showDetails ? 'OCULTAR DETALLES' : 'MOSTRAR DETALLES'}
        </Button>
      </Box>
      <Collapse in={showDetails}>
        <Divider sx={{ mb: 1 }} />
        <Grid container direction="column"> {/* Changed direction to "column" */}
          {/* Section 1: Personal Info */}
          <Grid item xs={12}>
            <Paper sx={{ backgroundColor: "secondary.light", pl: 1 }}>
              <Typography variant="h5" gutterBottom color={theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.common.white}>
                Información Personal
              </Typography>
            </Paper>
            <Grid container spacing={2}> {/* Added a nested row for label-value pairs */}
              {personalInfo.map(([label, value], i) => (
                <Grid item xs={12} sm={6} md={3} key={i}> {/* Adjust item sizes for columns */}
                  <Box display="flex" gap={1}>
                    <Typography fontWeight="bold" >{label}:</Typography>
                    <Typography>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 1 }} /> {/* Added divider between sections */}
          </Grid>

          {/* Section 2: Medical Details */}
          <Grid item xs={12}>
            <Paper sx={{ backgroundColor: "secondary.light", pl: 1 }}>
              <Typography variant="h5" gutterBottom color={theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.common.white}>
                Detalles Médicos
              </Typography>
            </Paper>
            <Grid container spacing={2}> {/* Added a nested row for label-value pairs */}
              {medicalDetails.map(([label, value], i) => (
                <Grid item xs={12} sm={6} md={3} key={i}> {/* Adjust item sizes for columns */}
                  <Box display="flex" gap={1}>
                    <Typography fontWeight="bold" textTransform="capitalize">
                      {label}:
                    </Typography>
                    <Typography>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 1 }} /> {/* Added divider between sections */}
          </Grid>

          {/* Section 3: Additional Info */}
          <Grid item xs={12}>
            <Paper sx={{ backgroundColor: "secondary.light", pl: 1 }}>
              <Typography variant="h5" gutterBottom color={theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.common.white}>
                Información Adicional
              </Typography>
            </Paper>
            <Grid container spacing={2}> {/* Added a nested row for label-value pairs */}
              {additionalInfo.map(([label, value], i) => (
                <Grid item xs={12} sm={6} md={3} key={i}> {/* Adjust item sizes for columns */}
                  <Box display="flex" gap={1}>
                    <Typography fontWeight="bold" textTransform="capitalize">
                      {label}:
                    </Typography>
                    <Typography>{value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 1 }} /> {/* Added divider between sections */}
          </Grid>

          {/* Section 4: Address */}
          <Grid item xs={12}>
            <Paper sx={{ backgroundColor: "secondary.light", pl: 1 }}>
              <Typography variant="h5" gutterBottom color={theme.palette.mode === 'dark' ? theme.palette.common.black : theme.palette.common.white}>
                Dirección
              </Typography>
            </Paper>
            <Typography>{address}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ mt: 2 }} />
      </Collapse>
    </Box>
  );
};

export default DetailSection;