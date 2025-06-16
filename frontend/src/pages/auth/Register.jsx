import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Alert,
  Collapse,
  CircularProgress,
} from "@mui/material";
import MyTextField from "../../components/forms/MyTextField";
import MyPassField from "../../components/forms/MyPassField";
import MyButton from "../../components/forms/MyButton";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authSlice";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import NavBar from "../../components/NavBar";
import MyDateField from "../../components/forms/MyDateField";
import MyPhoneField from "../../components/phone_number/MyPhoneField";
import phoneNumberSchema from "../../components/phone_number/phoneYupSchema";
import "../../styles/Form.css";
import dayjs from "dayjs";

const schema = yup.object({
  email: yup
    .string()
    .email("Se espera una dirección de correo electrónico")
    .required("El correo electrónico es obligatorio"),
  first_name: yup.string().required("El nombre es obligatorio"),
  last_name: yup.string().required("Los apellidos son obligatorios"),
  second_last_name: yup.string().required("Los apellidos son obligatorios"),
  birth_date: yup.date().required("La fecha de nacimiento es obligatoria"),
  gender: yup
    .string()
    .oneOf(["M", "F", "O"], "Género inválido")
    .required("El género es obligatorio"),
  phone_number: phoneNumberSchema,
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  re_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas deben coincidir")
    .required("Debe confirmar la contraseña"),
});

export const Register = () => {
  const dispatch = useDispatch();
  const { error, message } = useSelector((state) => state.auth);
  const { handleSubmit, control } = useForm({ resolver: yupResolver(schema) });
  const [ loading, setLoading ] = useState(false);

  const formatMessage = (msg) => {
    if (!msg) return "";
    if (typeof msg === "object") {
      return Object.values(msg).flat().join(", ");
    }
    return msg;
  };

  const submission = async (data) => {
    setLoading(true);
    if (data.birth_date) {
      data.birth_date = dayjs(data.birth_date).format("YYYY-MM-DD");
    }
    try {
      await dispatch(registerUser(data)).unwrap();
    } catch (err) {
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Registrar Usuario";
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <Box className="form-background">
        <Paper
          className="register-form-container"
          elevation={3}
          sx={{ padding: 3 }}
        >
          <Typography variant="h2" align="center" sx={{ mb: 3 }}>
            Registro de Usuario
          </Typography>

          {/* Mensajes de error o éxito */}
          <Collapse in={Boolean(error || message)} sx={{ mb: 2 }}>
            {error ? (
              <Alert severity="error">
                {formatMessage(error) ||
                  "Ocurrió un error al registrar el usuario."}
              </Alert>
            ) : (
              <Alert severity="success">
                {formatMessage(message) ||
                  "Registro exitoso. Revisa tu correo para activar tu cuenta."}
              </Alert>
            )}
          </Collapse>

          <form onSubmit={handleSubmit(submission)}>
            <Grid
              container
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Grid className="email-form-item" xs={12} sm={6}>
                <MyTextField
                  label="Correo Electrónico"
                  name="email"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyTextField
                  label="Nombre(s)"
                  name="first_name"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyTextField
                  label="Apellido Paterno"
                  name="last_name"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyTextField
                  label="Apellido Materno"
                  name="second_last_name"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyPhoneField
                  label="Teléfono"
                  name="phone_number"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyTextField
                  label="Género"
                  name="gender"
                  control={control}
                  select
                  options={[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "O", label: "Otro" },
                  ]}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyDateField
                  label="Fecha de Nacimiento"
                  name="birth_date"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyPassField
                  label="Contraseña"
                  name="password"
                  autoComplete="new-password"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="register-form-item" xs={12} sm={6}>
                <MyPassField
                  label="Confirmar Contraseña"
                  name="re_password"
                  autoComplete="new-password"
                  control={control}
                  fullWidth
                />
              </Grid>
              <Grid className="form-item" xs={12}>
                { loading ? (
                  <CircularProgress />
                ) : (
                  <MyButton label="Registrarse" type="submit" fullWidth />
                )}
              </Grid>
              <Grid
                className="form-item"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;
