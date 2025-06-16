import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import MyTextField from '../../components/forms/MyTextField';
import MyButton from '../../components/forms/MyButton';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from '../../features/auth/authSlice';
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import NavBar from "../../components/NavBar";
import "../../styles/Form.css";
import { Alert, Collapse } from "@mui/material";

const schema = yup.object({
    email: yup.string().email('Debe ser un correo válido').required('El correo es obligatorio'),
});

export const ResetPassword = () => {
    const dispatch = useDispatch();
    const { handleSubmit, control } = useForm({ resolver: yupResolver(schema) });
    const { message, error } = useSelector(state => state.auth);
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
      try {
        await dispatch(resetPassword({ email: data.email }))
                  .unwrap()
                  .catch(() => {});
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      document.title = "Restablecer Contraseña"
    }, []);

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <NavBar />
            <Box className="form-background">
                <Paper className="form-container" elevation={3}>
                    <Typography variant="h2" align="center" sx={{ mb: 2 }}>
                        Restablecer Contraseña
                    </Typography>

                    {/* Mensajes de error o éxito */}
                    <Collapse in={Boolean(error || message)} sx={{ mb: 2 }}>
                      {error ? (
                        <Alert severity="error">
                          {formatMessage(error) || "Ocurrió un error al enviar el mail."}
                        </Alert>
                      ) : (
                        <Alert severity="success">
                          {formatMessage(message) || "Solicitación exitosa. Revisa tu correo para cambiar de contraseña."}
                        </Alert>
                      )}
                    </Collapse>

                    <form onSubmit={handleSubmit(submission)}>
                        <Box className="form-item" sx={{ mb: 2 }}><MyTextField label="Email" name="email" control={control} fullWidth /></Box>
                        <Box className="form-item" sx={{ mb: 2 }}>
                          { loading ? (
                            <CircularProgress />
                          ) : (
                            <MyButton label="Solicitar Restablecimiento" type="submit" fullWidth />
                          )}
                        </Box>
                        <Box className="form-item" sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                            <Link to="/login">Volver al inicio de sesión</Link>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};


export default ResetPassword;
