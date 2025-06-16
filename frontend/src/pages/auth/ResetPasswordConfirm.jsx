import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Alert, Collapse, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useDispatch, useSelector } from 'react-redux';
import { confirmResetPassword } from '../../features/auth/authSlice';
import MyPassField from '../../components/forms/MyPassField';
import MyButton from '../../components/forms/MyButton';
import "../../styles/Form.css";

const schema = yup.object({
    new_password: yup.string().min(8, 'Debe tener al menos 8 caracteres').required('La contraseña es obligatoria'),
    re_new_password: yup.string().oneOf([yup.ref('new_password'), null], 'Las contraseñas deben coincidir').required('Debe confirmar la contraseña'),
});

const ResetPasswordConfirm = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { message, error } = useSelector(state => state.auth);
    const { handleSubmit, control } = useForm({ resolver: yupResolver(schema) });
    const [ loading, setLoading ] = useState(false);

    const formatMessage = (msg) => {
        if (!msg) return "";
        if (typeof msg === "object") {
            return Object.values(msg).flat().join(", ");
        }
        return msg;
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await dispatch(confirmResetPassword({ uid, token, ...data })).unwrap();
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            // Error se almacena en Redux state.
        }
        setLoading(false);
    };

    useEffect(() => {
        document.title = "Restablecer Contraseña"
    }, []);

    return (
        <Box className="form-background">
            <Paper className="form-container">
                <Typography variant="h2" align="center" sx={{ mb: 2 }}>
                    Escriba su Nueva Contraseña
                </Typography>

                {/* Mensajes de error o éxito */}
                <Collapse in={Boolean(error || message)} sx={{ mb: 2 }}>
                    {error ? (
                        <Alert severity="error">
                          {formatMessage(error) || "Ocurrió un error al restablecer la contraseña."}
                        </Alert>
                    ) : (
                        <Alert severity="success">
                          {formatMessage(message) || "La contraseña se restableció exitosamente."}
                        </Alert>
                    )}
                </Collapse>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box className="form-item" sx={{ mb: 2 }}>
                        <MyPassField label="Nueva Contraseña" name="new_password" autoComplete="new-password" control={control} fullWidth />
                    </Box>
                    <Box className="form-item" sx={{ mb: 2 }}>
                        <MyPassField label="Confirmar Contraseña" name="re_new_password" autoComplete="new-password" control={control} fullWidth />
                    </Box>
                    <Box className="form-item" sx={{ mb: 2 }}>
                        { loading ? (
                            <CircularProgress />
                        ) : (
                            <MyButton label="Restablecer" type="submit" fullWidth />
                        )}
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default ResetPasswordConfirm;
