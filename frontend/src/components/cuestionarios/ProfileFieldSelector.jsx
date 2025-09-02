import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "../../api";

const ProfileFieldSelector = ({ 
  selectedFieldPath, 
  onFieldSelect, 
  disabled = false 
}) => {
  const [fieldGroups, setFieldGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAvailableFields();
  }, []);

  const loadAvailableFields = async () => {
    try {
      const response = await axios.get("/api/cuestionarios/profile-fields/available/");
      setFieldGroups(response.data.field_groups);
    } catch (err) {
      setError("Error loading available fields: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (fieldPath) => {
    const [groupName, fieldName] = fieldPath.split(".");
    const fieldMetadata = fieldGroups[groupName]?.fields[fieldName];
    
    onFieldSelect({
      fieldPath,
      fieldMetadata,
      questionType: getQuestionTypeForField(fieldMetadata?.type)
    });
  };

  const getQuestionTypeForField = (fieldType) => {
    switch (fieldType) {
      case "choice":
        return "profile_field_choice";
      case "boolean":
        return "profile_field_boolean";
      case "date":
        return "profile_field_date";
      case "textarea":
        return "profile_field_textarea";
      default:
        return "profile_field";
    }
  };

  const getSelectedFieldInfo = () => {
    if (!selectedFieldPath) return null;
    
    const [groupName, fieldName] = selectedFieldPath.split(".");
    const group = fieldGroups[groupName];
    const field = group?.fields[fieldName];
    
    return { group, field, groupName, fieldName };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const selectedInfo = getSelectedFieldInfo();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Seleccionar Campo de Perfil
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Campo de Perfil</InputLabel>
        <Select
          value={selectedFieldPath || ""}
          onChange={(e) => handleFieldSelect(e.target.value)}
          disabled={disabled}
          label="Campo de Perfil"
        >
          <MenuItem value="">
            <em>Seleccionar campo...</em>
          </MenuItem>
          {Object.entries(fieldGroups).map(([groupName, groupData]) => [
            <MenuItem key={`header-${groupName}`} disabled>
              <Typography variant="subtitle2" color="primary">
                {groupData.name}
              </Typography>
            </MenuItem>,
            ...Object.entries(groupData.fields).map(([fieldName, fieldData]) => (
              <MenuItem key={`${groupName}.${fieldName}`} value={`${groupName}.${fieldName}`}>
                <Box sx={{ ml: 2 }}>
                  {fieldData.label}
                  <Chip 
                    label={fieldData.type} 
                    size="small" 
                    sx={{ ml: 1 }} 
                    color={fieldData.required ? "primary" : "default"}
                  />
                </Box>
              </MenuItem>
            ))
          ]).flat()}
        </Select>
      </FormControl>

      {selectedInfo && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedInfo.field.label}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={selectedInfo.group.name} 
                color="primary" 
                size="small" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                label={selectedInfo.field.type} 
                color="secondary" 
                size="small" 
                sx={{ mr: 1 }} 
              />
              {selectedInfo.field.required && (
                <Chip 
                  label="Requerido" 
                  color="error" 
                  size="small" 
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedInfo.field.help_text}
            </Typography>

            {selectedInfo.field.max_length && (
              <Typography variant="caption" display="block">
                Longitud máxima: {selectedInfo.field.max_length} caracteres
              </Typography>
            )}

            {selectedInfo.field.choices && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Opciones disponibles:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedInfo.field.choices.map(([value, label]) => (
                    <Chip 
                      key={value} 
                      label={`${label} (${value})`} 
                      variant="outlined" 
                      size="small" 
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProfileFieldSelector;