import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api";
import Header from "../../components/Header";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DomicileForm from "../../components/candidate_create/DomicileFormGoogle";
import domicileSchema from "../../pages/cuestionarios/elementos/domicileSchema";

const Datos_domicilio = ({ usuarioId, setSeleccionOpcion, disabled = false }) => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  const methods = useForm({
    resolver: yupResolver(domicileSchema),
    defaultValues: {
      address_road: "",
      address_number: "",
      address_number_int: "",
      address_PC: "",
      address_municip: "",
      address_col: "",
      address_state: "",
      address_city: "",
      address_lat: "",
      address_lng: "",
      residence_type: "",
    },
    mode: "onChange",
  });

  const { reset, formState, control } = methods;

  // 🔹 Detecta cambios en TODOS los valores del formulario en tiempo real
  const watchedValues = useWatch({ control });

  useEffect(() => {
    const fetchDomicile = async () => {
      try {
        const response = await axios.get(`/api/candidatos/profiles/${usuarioId}/`);
        const data = response.data.domicile;

        if (data) {
          reset({
            address_road: data.address_road || "",
            address_number: data.address_number || "",
            address_number_int: data.address_number_int || "",
            address_PC: data.address_PC || "",
            address_municip: data.address_municip || "",
            address_col: data.address_col || "",
            address_state: data.address_state || "",
            address_city: data.address_city || "",
            address_lat: data.address_lat || "",
            address_lng: data.address_lng || "",
            residence_type: data.residence_type || "",
          });
        } else {
          setError("No se encontró información del domicilio.");
        }
      } catch (err) {
        setError("Error al obtener la información del domicilio.");
        console.error(err);
      }
    };

    fetchDomicile();
  }, [usuarioId, reset]);

  const updateDomicile = async (formData) => {
    setError("");
    setAutoSave(true); // Mostrar indicador de guardado automático

    try {
      setSeleccionOpcion("Respondido");
      await axios.put(`/api/candidatos/${usuarioId}/editar-domicilio/`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      setAutoSave(false);
    } catch (err) {
      setError("Error al actualizar el domicilio.");
      console.error(err);
      setAutoSave(false);
    }
  };

  // 🔹 Debounce para actualizar solo cuando el usuario deja de escribir por 1s
  useEffect(() => {
    if (!disabled && formState.isDirty && formState.isValid) {
      const delayDebounceFn = setTimeout(() => {
        updateDomicile(watchedValues);
      }, 1000); // Espera 1 segundo antes de hacer el PUT

      return () => clearTimeout(delayDebounceFn); // Cancela el timeout si el usuario sigue escribiendo
    }
  }, [watchedValues, formState.isDirty, formState.isValid, disabled]); // Se ejecuta en cada cambio de los valores

  return (
    <Box>
      {error && (
        <Typography color="error" variant="body2" gutterBottom>
          {error}
        </Typography>
      )}

      <FormProvider {...methods}>
        <DomicileForm disabled={disabled} />
        {/* 🔹 Indicador de guardado automático */}
        {autoSave && (
          <Box display="flex" alignItems="center" mt={2}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Guardando cambios...</Typography>
          </Box>
        )}
      </FormProvider>
    </Box>
  );
};

export default Datos_domicilio;
