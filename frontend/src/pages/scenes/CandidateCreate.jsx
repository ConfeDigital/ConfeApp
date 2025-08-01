import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert, 
  Snackbar,
} from "@mui/material";
import dayjs from "dayjs";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import axios from "../../api";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import candidateSchema from "../../components/candidate_create/candidateSchema";

import PersonalInfoForm from "../../components/candidate_create/PersonalInfoForm";
import DomicileForm from "../../components/candidate_create/DomicileFormGoogle";
import MedicalInfoForm from "../../components/candidate_create/MedicalInfoForm";
import EmergencyContactsForm from "../../components/candidate_create/EmergencyContactForm";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const CandidateCreate = () => {
  useDocumentTitle('Crear Candidato');

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const methods = useForm({
    resolver: yupResolver(candidateSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      second_last_name: "",
      password: "",
      birth_date: null,
      gender: "",
      blood_type: undefined,
      curp: undefined,
      phone_number: "",
      stage: "Pre",
      address_PC: "",
      address_road: "",
      address_number: "",
      address_number_int: "",
      address_municip: "",
      address_col: "",
      address_state: "",
      address_city: "",
      address_lat: '',
      address_lng: '',
      residence_type: "",
      emergency_contacts: [],
      has_disability_certificate: false,
      has_interdiction_judgment: false,
      receives_pension: "",
      receives_psychological_care: false,
      receives_psychiatric_care: false,
      has_seizures: false,
      medications: [],
      allergies: "",
      dietary_restrictions: "",
      physical_restrictions: "",
      disability: [],
      cycle: null,
      photo: undefined,
    },
  });

  useEffect(() => {
    document.title = "Crear Candidato";
  }, []);

  const { handleSubmit } = methods;

  const onSubmit = async (formData) => {
    setError("");
    setLoading(true);

    if (formData.birth_date) {
      formData.birth_date = dayjs(formData.birth_date).format("YYYY-MM-DD");
    }

    // Prepare candidate fields without the photo
    const fieldsData = { ...formData };
    delete fieldsData.photo;

    try {
      // Step 1: Create the candidate (returns user_id)
      const response = await axios.post("/api/candidatos/crear/", fieldsData, {
        headers: { "Content-Type": "application/json" },
      });

      const { user_id } = response.data; // Extract user_id from response

      // Step 2: If a photo exists, upload it using the received user_id
      if (formData.photo && typeof formData.photo === "object") {
        const photoData = new FormData();
        photoData.append("photo", formData.photo);

        await axios.put(`/api/candidatos/upload-photo/${user_id}/`, photoData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate(`/candidatos/${user_id}`); // Redirect to candidate profile or list
    } catch (err) {
      setError(err);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <Box m={3}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Información Personal</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PersonalInfoForm />
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
                <Typography variant="h6">
                  Detalles Médicos y Emergencia
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MedicalInfoForm />
              </AccordionDetails>
            </Accordion>
            <Box mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Candidato"}
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

export default CandidateCreate;