import React, { useEffect, useState, useRef } from "react";
import {
  FormControl,
  FormHelperText,
  Box,
  Chip,
  CircularProgress,
  Typography,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import axios from "../../api";

const Discapacidad = ({ usuarioId, disabled = false, setSeleccionOpcion }) => {
  const [disabilities, setDisabilities] = useState([]);
  const [disabilityGroups, setDisabilityGroups] = useState([]);
  const [selectedDisabilityGroups, setSelectedDisabilityGroups] = useState([]);
  const [filteredDisabilities, setFilteredDisabilities] = useState([]);
  const [autoSave, setAutoSave] = useState(false);
  const [error, setError] = useState("");
  
  const usuarioActualId = useSelector((state) => state.auth.user.id);
  const debounceRef = useRef();

  const endpoint =
    usuarioId === usuarioActualId
      ? "/api/candidatos/me/datos-medicos/"
      : `/api/candidatos/${usuarioId}/datos-medicos/`;

  const methods = useForm({
    defaultValues: {
      disability: [],
    },
    mode: "onChange",
  });

  const { reset, control, formState } = methods;
  const watchedValues = useWatch({ control });
  const selectedDisabilities = watchedValues.disability || [];

  // Load initial data from API
  useEffect(() => {
    axios
      .get(endpoint)
      .then((res) => {
        const d = res.data;
        reset({
          disability: d.disability || [],
        });
      })
      .catch((e) => {
        console.error(e);
        setError("Error obteniendo datos de discapacidad.");
      });
  }, [usuarioId, reset, endpoint]);

  // Fetch disabilities and disability groups
  useEffect(() => {
    axios
      .get("/api/discapacidad/disabilities/")
      .then((res) => {
        setDisabilities(res.data);
        // Extract unique groups from disabilities
        const groups = res.data.reduce((acc, disability) => {
          if (disability.group && !acc.find(g => g.id === disability.group.id)) {
            acc.push(disability.group);
          }
          return acc;
        }, []);
        setDisabilityGroups(groups);
      })
      .catch((err) => console.error(err));
  }, []);

  // Auto-select disability groups based on selected disabilities
  useEffect(() => {
    if (selectedDisabilities.length > 0 && disabilities.length > 0) {
      const selectedGroups = selectedDisabilities
        .map(disabilityId => {
          const disability = disabilities.find(d => d.id === disabilityId);
          return disability?.group?.id;
        })
        .filter((groupId, index, self) => groupId && self.indexOf(groupId) === index);
      
      setSelectedDisabilityGroups(selectedGroups);
    } else if (selectedDisabilities.length === 0) {
      setSelectedDisabilityGroups([]);
    }
  }, [selectedDisabilities, disabilities]);

  // Filter disabilities based on selected groups
  useEffect(() => {
    if (selectedDisabilityGroups.length > 0) {
      const filtered = disabilities.filter(d => 
        d.group && selectedDisabilityGroups.includes(d.group.id)
      );
      setFilteredDisabilities(filtered);
    } else {
      setFilteredDisabilities([]);
    }
  }, [selectedDisabilityGroups, disabilities]);

  // Auto-save on change
  useEffect(() => {
    if (disabled || !formState.isDirty || !formState.isValid) return;

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setAutoSave(true);
      try {
        await axios.put(endpoint, {
          disability: watchedValues.disability,
        });
        setSeleccionOpcion("Respondido")
      } catch (err) {
        console.error(err);
        setError("Error actualizando datos de discapacidad.");
      } finally {
        setAutoSave(false);
      }
    }, 2000);

    return () => clearTimeout(debounceRef.current);
  }, [watchedValues, formState.isDirty, formState.isValid, disabled, endpoint]);

  const handleDisabilityGroupsChange = (groupIds) => {
    setSelectedDisabilityGroups(groupIds);
  };

  return (
    <FormProvider {...methods}>
      <Box>
        {error && (
          <Typography color="error" variant="body2" gutterBottom>
            {error}
          </Typography>
        )}

        {/* Disability Groups Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Autocomplete
            multiple
            id="disability-groups-autocomplete"
            options={disabilityGroups}
            getOptionLabel={(option) => option.name}
            value={disabilityGroups.filter(group => selectedDisabilityGroups.includes(group.id))}
            onChange={(event, newValue) => {
              const groupIds = newValue.map(group => group.id);
              handleDisabilityGroupsChange(groupIds);
            }}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="¿A que grupo de discapacidad pertenece?"
                placeholder="Buscar grupos..."
                sx={{ fontSize: "1rem" }}
              />
            )}
            disabled={disabled}
            noOptionsText="No se encontraron grupos"
            loadingText="Cargando grupos..."
          />
          <FormHelperText>
            Selecciona uno o más grupos para filtrar las discapacidades disponibles
          </FormHelperText>
        </FormControl>

        {/* Disability Selection */}
        {selectedDisabilityGroups.length > 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Controller
              name="disability"
              control={control}
              defaultValue={[]}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error}>
                  <Autocomplete
                    multiple
                    id="disability-autocomplete"
                    options={filteredDisabilities}
                    getOptionLabel={(option) => option.name}
                    value={filteredDisabilities.filter(disability => 
                      field.value.includes(disability.id)
                    )}
                    onChange={(event, newValue) => {
                      const disabilityIds = newValue.map(disability => disability.id);
                      field.onChange(disabilityIds);
                    }}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="¿Qué discapacidad tiene?"
                        placeholder="Buscar discapacidades..."
                        error={!!error}
                        sx={{ fontSize: "1rem" }}
                      />
                    )}
                    disabled={disabled}
                    noOptionsText="No se encontraron discapacidades"
                    loadingText="Cargando discapacidades..."
                  />
                  <FormHelperText>
                    {error?.message || "Puedes seleccionar múltiples discapacidades de diferentes grupos"}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </FormControl>
        )}

        {autoSave && (
          <Box display="flex" alignItems="center" mt={1}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Guardando cambios de discapacidad…</Typography>
          </Box>
        )}
      </Box>
    </FormProvider>
  );
};

export default Discapacidad;