import React, { useState, useEffect } from "react";
import { Box, Typography, Divider, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "../../api";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import medicalSchema from "../../pages/cuestionarios/elementos/candidateSchema";
import MedicalInfoForm from "../../pages/cuestionarios/elementos/medicalField";

const CandidateMedicalEdit = ({
  usuarioId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const { uid } = useParams();
  const [error, setError] = useState("");
  const [autoSave, setAutoSave] = useState(false);

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
      receives_psychological_care: false,
      psychological_care_details: "",
      receives_psychiatric_care: false,
      psychiatric_care_details: "",
      has_seizures: false,
      last_seizure: "",
      blood_type: "",
      medications: [],
      allergies: "",
      dietary_restrictions: "",
      physical_restrictions: "",
    },
    mode: "onChange",
  });

  const { reset, control, formState, setValue } = methods;
  const watchedValues = useWatch({ control });

  // 1) Load initial data
  useEffect(() => {
    axios
      .get(`/api/candidatos/profiles/${usuarioId}/`)
      .then((res) => {
        const d = res.data;

        // --- Refactored: Extract details from seleccionOpcion using a single pass ---
        const extractDetails = (inputString) => {
          const details = {
            last_seizure: "",
            psychological_care_details: "",
            psychiatric_care_details: "",
            disability_certificate_details: "",
            has_disability_history: false,
            disability_history_details: "",
          };

          // Use a more comprehensive regex to capture all fields
          const fullRegex =
            /convulsiones:\s*(.*?)(?:,|$)|psicológico:\s*(.*?)(?:,|$)|psiquiátrico:\s*(.*?)(?:,|$)|certificado:\s*(.*?)(?:,|$)|historial_discapacidad:\s*(.*?)(?:,|$)|historial_discapacidad_explicación:\s*(.*?)(?:,|$)/g;
          let match;

          while ((match = fullRegex.exec(inputString)) !== null) {
            if (match[1]) {
              // convulsiones
              details.last_seizure = match[1].trim();
            } else if (match[2]) {
              // psicológico
              details.psychological_care_details = match[2].trim();
            } else if (match[3]) {
              // psiquiátrico
              details.psychiatric_care_details = match[3].trim();
            } else if (match[4]) {
              // certificado
              details.disability_certificate_details = match[4].trim();
            } else if (match[5]) {
              // historial discapacidad
              const val = match[5].trim();
              details.has_disability_history = val === "true";
            } else if (match[6]) {
              // historial discapacidad explicación
              details.disability_history_details = match[6].trim();
            }
          }
          return details;
        };

        const parsedSeleccionOpcion = extractDetails(seleccionOpcion);

        reset({
          disability: d.disability || [],
          has_disability_history: parsedSeleccionOpcion.has_disability_history,
          disability_history_details: parsedSeleccionOpcion.disability_history_details,
          has_disability_certificate: d.has_disability_certificate,
          disability_certificate_details: parsedSeleccionOpcion.disability_certificate_details,
          has_interdiction_judgment: d.has_interdiction_judgment,
          receives_pension: d.receives_pension || "",
          receives_psychological_care: d.receives_psychological_care,
          // Use parsed value here
          psychological_care_details:parsedSeleccionOpcion.psychological_care_details,
          receives_psychiatric_care: d.receives_psychiatric_care,
          // Use parsed value here
          psychiatric_care_details:parsedSeleccionOpcion.psychiatric_care_details,
          has_seizures: d.has_seizures,
          // Use parsed value here
          last_seizure: parsedSeleccionOpcion.last_seizure,
          blood_type: d.blood_type || "",
          medications: d.medications || [],
          allergies: d.allergies || "",
          dietary_restrictions: d.dietary_restrictions || "",
          physical_restrictions: d.physical_restrictions || "",
        });
      })
      .catch((e) => {
        console.error(e);
        setError("Error obteniendo datos médicos.");
      });
  }, [usuarioId, reset, seleccionOpcion]);

  // 2) Auto-save on change, then reset dirty flag
  useEffect(() => {
    if (disabled || !formState.isDirty || !formState.isValid) return;

    setError("");
    const timeout = setTimeout(async () => {
      setAutoSave(true);
      try {
        setSeleccionOpcion(
          `respondido-> convulsiones:${watchedValues.last_seizure}, psicológico:${watchedValues.psychological_care_details}, psiquiátrico:${watchedValues.psychiatric_care_details}, certificado:${watchedValues.disability_certificate_details}, historial_discapacidad:${watchedValues.has_disability_history}, historial_discapacidad_explicación:${watchedValues.disability_history_details}`
        );
        await axios.put(
          `/api/candidatos/${usuarioId}/datos-medicos/`,
          watchedValues,
          { headers: { "Content-Type": "application/json" } }
        );

        // **mark current values as pristine**
        reset(watchedValues, { keepDirty: false });
      } catch (err) {
        console.error(err);
        setError("Error actualizando datos médicos.");
      }
      setAutoSave(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [
    disabled,
    watchedValues,
    formState.isDirty,
    formState.isValid,
    usuarioId,
    setSeleccionOpcion,
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
