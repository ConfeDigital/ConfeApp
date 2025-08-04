import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Divider, Accordion, AccordionSummary, AccordionDetails, Alert, Snackbar } from '@mui/material';
import dayjs from 'dayjs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api';
import Header from '../../components/Header';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import candidateSchema from '../../components/candidate_create/candidateSchemaEdit';

import PersonalInfoForm from '../../components/candidate_create/PersonalInfoForm';
import DomicileForm from '../../components/candidate_create/DomicileFormGoogle';
import MedicalInfoForm from '../../components/candidate_create/MedicalInfoForm';
import EmergencyContactsForm from '../../components/candidate_create/EmergencyContactForm';

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const CandidateEdit = () => {
  useDocumentTitle('Editar Candidato');

  const { uid } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const methods = useForm({
    resolver: yupResolver(candidateSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      second_last_name: '',
      birth_date: null,
      gender: '',
      blood_type: '',
      curp: '',
      phone_number: '',
      stage: '',
      cycle: '',
      address_road: '',
      address_number: '',
      address_number_int: '',
      address_PC: '',
      address_municip: '',
      address_col: '',
      address_state: '',
      address_city: '',
      address_lat: '',
      address_lng: '',
      residence_type: '',
      emergency_contacts: [],
      has_disability_certificate: false,
      has_interdiction_judgment: false,
      receives_pension: "",
      social_security: "",
      receives_psychological_care: false,
      receives_psychiatric_care: false,
      has_seizures: false,
      medications: [],
      allergies: '',
      dietary_restrictions: '',
      physical_restrictions: '',
      disability: [],
      photo: undefined
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    document.title = "Editar Candidato"
    const fetchCandidate = async () => {
      try {
        const response = await axios.get(`/api/candidatos/profiles/${uid}/`);
        const data = response.data;
        const defaultValues = {
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          second_last_name: data.user.second_last_name,
          birth_date: data.birth_date ? dayjs(data.birth_date) : null,
          gender: data.gender,
          blood_type: data.blood_type || '',
          curp: data.curp || '',
          phone_number: data.phone_number,
          stage: data.stage,
          cycle: data.cycle ? data.cycle.id : null,
          address_road: data.domicile ? data.domicile.address_road : '',
          address_number: data.domicile ? data.domicile.address_number : '',
          address_number_int: data.domicile ? data.domicile.address_number_int : '',
          address_PC: data.domicile ? data.domicile.address_PC : '',
          address_municip: data.domicile ? data.domicile.address_municip : '',
          address_col: data.domicile ? data.domicile.address_col : '',
          address_state: data.domicile ? data.domicile.address_state : '',
          address_city: data.domicile ? data.domicile.address_city : '',
          address_lat: data.domicile ? data.domicile.address_lat : '',
          address_lng: data.domicile ? data.domicile.address_lng : '',
          residence_type: data.domicile ? data.domicile.residence_type : '',
          emergency_contacts: data.emergency_contacts
            ? data.emergency_contacts.map(contact => ({
                id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                second_last_name: contact.second_last_name,
                relationship: contact.relationship,
                phone_number: contact.phone_number,
                email: contact.email,
                lives_at_same_address: contact.lives_at_same_address,
                domicile: contact.domicile || {
                  address_PC: '',
                  address_road: '',
                  address_municip: '',
                  address_state: '',
                  address_city: '',
                  address_col: '',
                  address_number: '',
                  address_number_int: '',
                  address_lat: '',
                  address_lng: '',
                  residence_type: '',
                }
              }))
            : [],
          has_disability_certificate: data.has_disability_certificate,
          has_interdiction_judgment: data.has_interdiction_judgment,
          receives_pension: data.receives_pension || "",
          social_security: data.social_security || "",
          receives_psychological_care: data.receives_psychological_care,
          receives_psychiatric_care: data.receives_psychiatric_care,
          has_seizures: data.has_seizures,
          medications: data.medications || '',
          allergies: data.allergies || '',
          dietary_restrictions: data.dietary_restrictions || '',
          physical_restrictions: data.physical_restrictions || '',
          disability: data.disability || [],
          photo: data.photo || null
        };
        reset(defaultValues);
      } catch (err) {
        setError('Error al obtener la información');
        console.error(err);
      }
    };
  
    fetchCandidate();
  }, [uid, reset]);

  const onSubmit = async (formData) => {
    setError('');
    setLoading(true);
    if (formData.birth_date) {
      formData.birth_date = dayjs(formData.birth_date).format('YYYY-MM-DD');
    }
    // Prepare fields data (without photo)
    const fieldsData = { ...formData };
    delete fieldsData.photo;
    try {
      // Update candidate fields as JSON
      await axios.put(`/api/candidatos/editar/${uid}/`, fieldsData, {
        headers: { 'Content-Type': 'application/json' }
      });
      // If a new photo exists, update it separately
      if (formData.photo && typeof formData.photo === 'object') {
         const photoData = new FormData();
         photoData.append('photo', formData.photo);
         await axios.put(`/api/candidatos/upload-photo/${uid}/`, photoData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });
      }
      navigate(`/candidatos/${uid}`);
    } catch (err) {
      setError(err);
      console.error(err);
    }
    setLoading(false);
  };

  const actionButton = (
    <Button 
      variant="outlined" 
      color="primary"
      onClick={() => navigate(`/candidatos/${uid}`)}
    >
      Volver al Perfil
    </Button>
  );

  return (
    <Box m={3}>
      <Header actionButton={actionButton}/>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Información Personal</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PersonalInfoForm editMode={true} />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Domicilio</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <DomicileForm />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Contactos</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <EmergencyContactsForm />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Detalles Médicos y Emergencia</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MedicalInfoForm />
              </AccordionDetails>
            </Accordion>
            <Box mt={3}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Candidato'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Paper>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {typeof error === 'string'
            ? error
            : (error.response?.data?.detail 
               || JSON.stringify(error.response?.data) 
               || 'Unknown error')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CandidateEdit;