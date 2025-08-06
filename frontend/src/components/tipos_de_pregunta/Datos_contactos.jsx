import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Button,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import {
  useForm,
  FormProvider,
  useWatch,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "../../api";
import ContactFields from "../../pages/cuestionarios/elementos/ContactFields";
import contactsSchema from "../candidate_create/contactsSchema";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Import for success icon
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

const Datos_contactos = ({
  usuarioId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialLoaded = useRef(false);

  const methods = useForm({
    resolver: yupResolver(contactsSchema),
    // Initialize with a simple empty object. The real data will be set by `reset()`
    defaultValues: {
      emergency_contacts: [
        {
          first_name: '',
          last_name: '',
          second_last_name: '',
          phone_number: '',
          email: '',
          relationship: '',
          lives_at_same_address: true,
          domicile: {
            address_PC: '',
            address_road: '',
            address_number: '',
            address_number_int: '',
            address_municip: '',
            address_state: '',
            address_col: '',
            address_lat: '',
            address_lng: '',
            residence_type: '',
          },
        },
      ],
    },
    mode: "onChange",
  });

  const { control, setValue, reset, formState, handleSubmit } = methods;
  const { isDirty, isValid, errors } = formState;

  useEffect(() => {
    axios
      .get(`/api/candidatos/${usuarioId}/editar-contactos/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const formattedData = data.length > 0
          ? data.map(contact => ({
            ...contact,
            domicile: contact.domicile
              ? { ...contact.domicile, address_col: contact.domicile.address_col || '' }
              : {
                address_PC: '',
                address_road: '',
                address_number: '',
                address_number_int: '',
                address_municip: '',
                address_state: '',
                address_col: '',
                address_lat: '',
                address_lng: '',
                residence_type: '',
              }
          }))
          : [
            {
              first_name: '',
              last_name: '',
              second_last_name: '',
              phone_number: '',
              email: '',
              relationship: '',
              lives_at_same_address: true,
              domicile: {
                address_PC: '',
                address_road: '',
                address_number: '',
                address_number_int: '',
                address_municip: '',
                address_state: '',
                address_col: '',
                address_lat: '',
                address_lng: '',
                residence_type: '',
              },
            },
          ];
        // Use reset to set the default values after fetching
        reset({ emergency_contacts: formattedData });
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar contactos");
      })
      .finally(() => {
        setLoading(false);
        initialLoaded.current = true;
      });
  }, [usuarioId, reset]);

  const onValidSubmit = async (data) => {
    setError("");
    setAutoSave(true);
    setSaveSuccess(false);
    setSeleccionOpcion(data.emergency_contacts);

    try {
      await axios.put(
        `/api/candidatos/${usuarioId}/editar-contactos/`,
        { emergency_contacts: data.emergency_contacts },
        { headers: { "Content-Type": "application/json" } }
      );
      methods.reset(data);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Error actualizando contactos");
    }
    setAutoSave(false);
  };

  const onInvalidSubmit = (formErrors) => {
    const arrayError = formErrors.emergency_contacts?.message;
    if (arrayError) {
      setError(arrayError);
    } else {
      setError('');
    }
    setAutoSave(false);
    setSaveSuccess(false);
  };

  const watchedValues = useWatch({ control, name: "emergency_contacts" });
  useEffect(() => {
    if (!initialLoaded.current || !isDirty || !isValid) return;

    setError("");
    setSaveSuccess(false);

    const timer = setTimeout(() => {
      handleSubmit(onValidSubmit)();
    }, 2000);

    return () => clearTimeout(timer);
  }, [watchedValues, isDirty, isValid, handleSubmit, onValidSubmit]);

  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ mt: 5 }}>
        <CircularProgress />
      </Grid>
    );
  }

  const contactCountError = errors.emergency_contacts?.message;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}>
        {/* Validation message for the contact count */}
        {!contactCountError && !seleccionOpcion && (
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <InfoOutlinedIcon color="info" sx={{ mr: 1 }} />
            <Typography color="info" variant="subtitle1">
              Se necesitan al menos dos contactos 
            </Typography>
          </Box>
        )}

        {/* Validation message for the contact count */}
        {contactCountError && (
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <HighlightOffIcon color="error" sx={{ mr: 1 }} />
            <Typography color="error" variant="subtitle1">
              {contactCountError}
            </Typography>
          </Box>
        )}

        {/* General API error */}
        {error && (
          <Typography color="error" variant="subtitle1" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Success message */}
        {saveSuccess && (
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
            <Typography color="success.main" variant="subtitle1">
              ¡Contactos guardados correctamente!
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={autoSave || disabled || !isValid}
            startIcon={<SaveOutlinedIcon />}
          >
            {autoSave ? "Guardando..." : "Guardar contactos"}
          </Button>
        </Box>

        {autoSave && (
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Guardando cambios…</Typography>
          </Box>
        )}

        <ContactFields />

        {/* Validation message for the contact count */}
        {!contactCountError && !seleccionOpcion && (
          <Box display="flex" alignItems="center" sx={{ my: 2 }}>
            <InfoOutlinedIcon color="info" sx={{ mr: 1 }} />
            <Typography color="info" variant="subtitle1">
              Se necesitan al menos dos contactos 
            </Typography>
          </Box>
        )}

        {/* Validation message for the contact count (footer) */}
        {contactCountError && (
          <Box display="flex" alignItems="center" my={2}>
            <HighlightOffIcon color="error" sx={{ mr: 1 }} />
            <Typography color="error" variant="subtitle1">
              {contactCountError}
            </Typography>
          </Box>
        )}

        {/* Success message (footer) */}
        {saveSuccess && (
          <Box display="flex" alignItems="center" my={2}>
            <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
            <Typography color="success.main" variant="subtitle1">
              ¡Contactos guardados correctamente!
            </Typography>
          </Box>
        )}
      </form>
    </FormProvider>
  );
};

export default Datos_contactos;