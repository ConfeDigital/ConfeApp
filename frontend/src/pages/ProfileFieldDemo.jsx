import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import ProfileFieldSelector from "../components/cuestionarios/ProfileFieldSelector";
import ProfileField from "../components/tipos_de_pregunta/ProfileField";
import axios from "../api";

const ProfileFieldDemo = () => {
  const [selectedField, setSelectedField] = useState(null);
  const [availableFields, setAvailableFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoUserId] = useState('903c6c9d-3e14-4b0c-9db8-52b219d9ac79'); // You can change this to test with different users

  useEffect(() => {
    loadAvailableFields();
  }, []);

  const loadAvailableFields = async () => {
    try {
      const response = await axios.get("/api/cuestionarios/profile-fields/available/");
      setAvailableFields(response.data.field_groups);
    } catch (err) {
      setError("Error loading available fields: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (fieldInfo) => {
    setSelectedField(fieldInfo);
  };

  const createMockQuestion = (fieldInfo) => {
    if (!fieldInfo) return null;

    const [groupName, fieldName] = fieldInfo.fieldPath.split(".");
    const fieldMetadata = availableFields[groupName]?.fields[fieldName];

    return {
      id: `demo-${fieldInfo.fieldPath}`,
      texto: `Actualizar ${fieldMetadata?.label || fieldName}`,
      tipo: fieldInfo.questionType,
      profile_field_path: fieldInfo.fieldPath,
      profile_field_metadata: fieldMetadata,
      cuestionario: 1, // Mock questionnaire ID
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Demo: Campos de Perfil Dinámicos
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Esta demo muestra cómo los campos de UserProfile pueden ser editados dinámicamente 
        a través de preguntas de cuestionario. Selecciona un campo para ver cómo se renderiza 
        la pregunta correspondiente.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. Seleccionar Campo
              </Typography>
              <ProfileFieldSelector
                selectedFieldPath={selectedField?.fieldPath}
                onFieldSelect={handleFieldSelect}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2. Vista Previa de la Pregunta
              </Typography>
              
              {selectedField ? (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Tipo de pregunta: {selectedField.questionType}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <ProfileField
                    pregunta={createMockQuestion(selectedField)}
                    usuarioId={demoUserId}
                    setSeleccionOpcion={(value) => {
                      console.log("Respuesta actualizada:", value);
                    }}
                    disabled={false}
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  Selecciona un campo para ver la vista previa de la pregunta.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3. Campos Disponibles
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(availableFields).map(([groupName, groupData]) => (
                  <Grid item xs={12} sm={6} md={4} key={groupName}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          {groupData.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {groupData.description}
                        </Typography>
                        <Typography variant="caption">
                          {Object.keys(groupData.fields).length} campos disponibles
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            Cómo usar en cuestionarios reales:
          </Typography>
          <Typography variant="body2">
            1. En el editor de cuestionarios, selecciona uno de los nuevos tipos de pregunta de perfil<br/>
            2. Configura el campo específico que quieres editar<br/>
            3. Cuando el usuario responda la pregunta, su perfil se actualizará automáticamente<br/>
            4. Los cambios se reflejan tanto en la respuesta del cuestionario como en el perfil del usuario
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default ProfileFieldDemo;