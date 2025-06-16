import { useEffect, useState } from "react";
import { Box, Button, Divider, Typography, Paper, Alert, Collapse, CircularProgress } from "@mui/material";
import MyTextField from "../../components/forms/MyTextField";
import MyPassField from "../../components/forms/MyPassField";
import MyButton from "../../components/forms/MyButton";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, checkAndFetchUser } from "../../features/auth/authSlice";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import NavBar from "../../components/NavBar";
import { useMsal } from "@azure/msal-react";
import MicrosoftIcon from "@mui/icons-material/Microsoft";
import { loginRequest } from "../../auth-config";
import "../../styles/Form.css";

const schema = yup.object({
  email: yup.string().email("Se espera una dirección de correo electrónico").required("El correo electrónico es obligatorio"),
  password: yup.string().required("La contraseña es obligatoria"),
});

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { instance } = useMsal();
  const { handleSubmit, control } = useForm({ resolver: yupResolver(schema) });
  const { message, error } = useSelector((state) => state.auth);
  const [ loading, setLoading ] = useState(false);

  // Helper to format messages (if error is an object)
  const formatMessage = (msg) => {
    if (!msg) return "";
    if (typeof msg === "object") {
      return Object.values(msg).flat().join(", ");
    }
    return msg;
  };

  const submission = async (data) => {
    setLoading(true);
    try {
      await dispatch(loginUser(data)).unwrap();
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      // Optionally, you can set additional local error state if needed.
    }
  };

  const handleLogin = () => {
    instance
      .loginPopup({ ...loginRequest })
      .then((response) => {
        console.log("Login Success:", response);
        instance.setActiveAccount(response.account);
        dispatch(checkAndFetchUser(instance));
        navigate("/dashboard");
      })
      .catch((error) => console.error("Login Error:", error));
  };

  useEffect(() => {
    document.title = "Iniciar Sesión"
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <Box className="form-background">
        <Paper className="form-container" elevation={3}>
          <Typography variant="h2" align="center" sx={{ mb: 2 }}>
            Iniciar Sesión en Confe
          </Typography>

          {/* Mensajes de error o éxito */}
          <Collapse in={Boolean(error || message)} sx={{ mb: 2 }}>
            {error ? (
              <Alert severity="error">
                {formatMessage(error) || "Ocurrió un error al iniciar sesión."}
              </Alert>
            ) : (
              <Alert severity="success">
                {formatMessage(message) || "Inicio de sesión exitoso."}
              </Alert>
            )}
          </Collapse>

          {/* Microsoft Sign-In */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Button variant="outlined" startIcon={<MicrosoftIcon />} onClick={handleLogin}>
              Entrar con Microsoft
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>o</Divider>

          {/* Login Form */}
          <form onSubmit={handleSubmit(submission)}>
            <Box className="form-item" sx={{ mb: 2 }}>
              <MyTextField label="Email" name="email" control={control} fullWidth />
            </Box>
            <Box className="form-item" sx={{ mb: 2 }}>
              <MyPassField label="Contraseña" name="password" control={control} fullWidth />
            </Box>
            <Box className="form-item" sx={{ mb: 2 }}>
              {loading ? (
                <CircularProgress/>
              ) : (
                <MyButton label="Iniciar Sesión" type="submit" fullWidth />
              )}
            </Box>
            <Box className="form-item" sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
              <Link to="/register">¿No tienes una cuenta? Regístrate aquí</Link>
              <Link to="/reset-password">¿Olvidaste tu contraseña? Haz clic aquí</Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
