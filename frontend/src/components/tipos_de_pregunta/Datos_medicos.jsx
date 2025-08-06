import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "../../api";
import medicalSchema from "../candidate_create/medicalSchema";
import MedicalInfoForm from "../../pages/cuestionarios/elementos/medicalField";

const CandidateMedicalEdit = ({
  usuarioId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const [error, setError] = useState("");
  const [autoSave, setAutoSave] = useState(false);
  const usuarioActualId = useSelector((state) => state.auth.user.id);

  const endpoint =
    usuarioId === usuarioActualId
      ? "/api/candidatos/me/datos-medicos/"
      : `/api/candidatos/${usuarioId}/datos-medicos/`;

  const methods = useForm({
    resolver: yupResolver(medicalSchema),
    defaultValues: {
      disability: [],
      has_disability_history: false,
      disability_history_details: "",
      has_disability_certificate: false,
      disability_certificate_details: "",
      has_interdiction_judgment: false,
      receives_pension: "",
      social_security: "",
      receives_psychological_care: false,
      psychological_care_details: "",
      receives_psychiatric_care: false,
      psychiatric_care_details: "",
      has_seizures: false,
      last_seizure: "",
      blood_type: "",
      medications: [{ name: "", dose: "", reason: "" }],
      allergies: "",
      dietary_restrictions: "",
      physical_restrictions: "",
    },
    mode: "onChange",
  });

  const { reset, control, formState } = methods;
  const watchedValues = useWatch({ control });

  // Debug logs (optional)
  useEffect(() => {
    console.log("Dirty?", formState.isDirty);
    if (formState.isDirty) {
      console.log("Dirty Values", formState.dirtyFields);
    }
    console.log("Valid?", formState.isValid);
    if (!formState.isValid) {
      console.log("Validation Errors", formState.errors);
    }
  }, [formState.isDirty, watchedValues, formState.isValid, disabled]);

  // 1) Load initial data
  useEffect(() => {
    axios
      .get(endpoint)
      .then((res) => {
        const d = res.data;

        reset({
          disability: d.disability || [],
          has_disability_history: seleccionOpcion?.has_disability_history || false,
          disability_history_details: seleccionOpcion?.disability_history_details || "",
          has_disability_certificate: d.has_disability_certificate,
          disability_certificate_details: seleccionOpcion?.disability_certificate_details || "",
          has_interdiction_judgment: d.has_interdiction_judgment,
          receives_pension: d.receives_pension || "",
          social_security: d.social_security || "",
          receives_psychological_care: d.receives_psychological_care,
          psychological_care_details: seleccionOpcion?.psychological_care_details || "",
          receives_psychiatric_care: d.receives_psychiatric_care,
          psychiatric_care_details: seleccionOpcion?.psychiatric_care_details || "",
          has_seizures: d.has_seizures,
          last_seizure: seleccionOpcion?.last_seizure || "",
          blood_type: d.blood_type || "",
          medications: d.medications || [{ name: "", dose: "", reason: "" }],
          allergies: d.allergies || "",
          dietary_restrictions: d.dietary_restrictions || "",
          physical_restrictions: d.physical_restrictions || "",
        });
      })
      .catch((e) => {
        console.error(e);
        setError("Error obteniendo datos médicos.");
      });
  }, [usuarioId, reset]);

  // 2) Auto-save on change, then reset dirty flag
  useEffect(() => {
    if (disabled || !formState.isDirty || !formState.isValid) return;

    setError("");
    const timeout = setTimeout(async () => {
      setAutoSave(true);
      try {
        const medicalData = {
          responded: true,
          last_seizure: watchedValues.last_seizure || "",
          psychological_care_details: watchedValues.psychological_care_details || "",
          psychiatric_care_details: watchedValues.psychiatric_care_details || "",
          disability_certificate_details: watchedValues.disability_certificate_details || "",
          has_disability_history: watchedValues.has_disability_history || false,
          disability_history_details: watchedValues.disability_history_details || "",
        };

        const filteredMedications = (watchedValues.medications || []).filter(med =>
          med.name.trim() !== "" || med.dose.trim() !== "" || med.reason.trim() !== ""
        );

        setSeleccionOpcion(medicalData);

        await axios.put(endpoint, { ...watchedValues, medications: filteredMedications }, {
          headers: { "Content-Type": "application/json" },
        });

        reset(watchedValues, { keepDirty: false });
      } catch (err) {
        console.error(err);
        setError("Error actualizando datos médicos.");
      }
      setAutoSave(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    disabled,
    formState.isDirty,
    formState.isValid,
    usuarioId,
    reset,
  ]);

  return (
    <Box>
      {error && (
        <Typography color="error" variant="body2" gutterBottom>
          {error}
        </Typography>
      )}

      <FormProvider {...methods}>
        <MedicalInfoForm disabled={disabled} />

        <Divider sx={{ my: 2 }} />

        {autoSave && (
          <Box display="flex" alignItems="center" mt={1}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Guardando cambios…</Typography>
          </Box>
        )}
      </FormProvider>
    </Box>
  );
};

export default CandidateMedicalEdit;
