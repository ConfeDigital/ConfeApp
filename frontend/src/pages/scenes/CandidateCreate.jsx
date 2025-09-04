import React, { useState, useEffect } from "react";
import {
  Box,
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
import AddressAutoCompleteForm from '../../components/AddressAutoCompleteForm';
import MedicalInfoForm from "../../components/candidate_create/MedicalInfoForm";
import EmergencyContactsForm from "../../components/candidate_create/EmergencyContactForm";
import AccordionHeader from "../../components/candidate_create/AccordionHeader";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import { processValidationErrors, formatErrorMessage } from "../../components/candidate_create/validationUtils";

const CandidateCreate = () => {
  useDocumentTitle('Crear Candidato');

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState({
    personal: true,
    address: false,
    contacts: false,
    medical: false,
  });
  const [accordionErrors, setAccordionErrors] = useState({});

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
      social_security: "",
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

  const { handleSubmit, formState: { errors } } = methods;

  // Handle accordion expansion
  const handleAccordionChange = (accordion) => (_, isExpanded) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [accordion]: isExpanded,
    }));
  };

  // Process react-hook-form errors and manage accordions
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const { accordionsToOpen, errorMessages, accordionErrors } = processValidationErrors(errors);

      // Open accordions with errors
      setExpandedAccordions(prev => {
        const newState = { ...prev };
        accordionsToOpen.forEach(accordion => {
          newState[accordion] = true;
        });
        return newState;
      });

      // Set accordion error counts
      setAccordionErrors(accordionErrors);

      // Only set the error message if it's not already an API error.
      // This prevents API errors from being overwritten.
      if (!error || error.response) {
        setError(formatErrorMessage(errorMessages));
      }
    }
  }, [errors]); // <-- Dependencia ajustada para evitar el bucle

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
            <Accordion
              expanded={expandedAccordions.personal}
              onChange={handleAccordionChange('personal')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AccordionHeader
                  title="Información Personal"
                  hasErrors={!!accordionErrors.personal}
                  errorCount={accordionErrors.personal || 0}
                />
              </AccordionSummary>
              <AccordionDetails>
                <PersonalInfoForm />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion
              expanded={expandedAccordions.address}
              onChange={handleAccordionChange('address')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AccordionHeader
                  title="Domicilio"
                  hasErrors={!!accordionErrors.address}
                  errorCount={accordionErrors.address || 0}
                />
              </AccordionSummary>
              <AccordionDetails>
                <AddressAutoCompleteForm prefix="" domicile={true} />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion
              expanded={expandedAccordions.contacts}
              onChange={handleAccordionChange('contacts')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AccordionHeader
                  title="Contactos"
                  hasErrors={!!accordionErrors.contacts}
                  errorCount={accordionErrors.contacts || 0}
                />
              </AccordionSummary>
              <AccordionDetails>
                <EmergencyContactsForm />
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Accordion
              expanded={expandedAccordions.medical}
              onChange={handleAccordionChange('medical')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AccordionHeader
                  title="Detalles Médicos y Emergencia"
                  hasErrors={!!accordionErrors.medical}
                  errorCount={accordionErrors.medical || 0}
                />
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
        autoHideDuration={8000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{
            width: '100%',
            maxWidth: '600px',
            whiteSpace: 'pre-line'
          }}
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
