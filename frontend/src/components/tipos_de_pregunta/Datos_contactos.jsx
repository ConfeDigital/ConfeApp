import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import {
  useFieldArray,
  useForm,
  FormProvider,
  useWatch,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "../../api";
import ContactFields from "../../pages/cuestionarios/elementos/ContactFields";
import domicileSchema from "../../pages/cuestionarios/elementos/domicileSchema";
import candidateSchema from "../candidate_create/candidateSchemaEdit";

const Datos_contactos = ({
  usuarioId,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  // Track when initial fetch/reset is done
  const initialLoaded = useRef(false);

  // 1. Setup RHF
  const methods = useForm({
    resolver: yupResolver(candidateSchema),
    defaultValues: { emergency_contacts: [] },
    mode: "onChange",
  });
  const { control, setValue, reset, formState } = methods;
  const { fields, append, remove } = useFieldArray({
    name: "emergency_contacts",
    control,
  });

  // 2. Load from API once
  useEffect(() => {
    axios
      .get(`/api/candidatos/${usuarioId}/editar-contactos/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        // set the form values...
        setValue("emergency_contacts", data);
        // ...then reset so formState.isDirty is false
        reset({ emergency_contacts: data });
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar contactos");
      })
      .finally(() => {
        setLoading(false);
        initialLoaded.current = true;
      });
  }, [usuarioId, setValue, reset]);

  // 3. Watch all contacts
  const watchedValues = useWatch({
    control,
    name: "emergency_contacts",
    defaultValue: [],
  });

  // 4. Save helper (no reset here!)
  const saveContacts = async (contacts) => {
    setError("");
    setAutoSave(true);
    setSeleccionOpcion("Respondido");
    try {
      await axios.put(
        `/api/candidatos/${usuarioId}/editar-contactos/`,
        { emergency_contacts: contacts },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error(err);
      setError("Error actualizando contactos");
    }
    setAutoSave(false);
  };

  // 5. Debounced auto-save, but only after initial load
  useEffect(() => {
    if (!initialLoaded.current || !formState.isDirty || !formState.isValid)
      return;
    const timer = setTimeout(() => {
      saveContacts(watchedValues);
    }, 1000);
    return () => clearTimeout(timer);
  }, [watchedValues, formState.isDirty]);

  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ mt: 5 }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <FormProvider {...methods}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Manual Save Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!formState.isDirty || autoSave || disabled}
          onClick={() => saveContacts(watchedValues)}
        >
          {autoSave ? "Guardando..." : "Guardar contactos"}
        </Button>
      </Box>

      {/* Auto-save indicator */}
      {autoSave && (
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Guardando cambios…</Typography>
        </Box>
      )}

      {/* Your actual contact fields */}
      <ContactFields
        fields={fields}
        append={append}
        remove={remove}
        disabled={disabled}
      />
    </FormProvider>
  );
};

export default Datos_contactos;
