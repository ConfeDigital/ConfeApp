import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { activateAccount } from "../../features/auth/authSlice";
import MyButton from "../../components/forms/MyButton";
import { Box, Paper, Typography, Alert, Collapse, CircularProgress } from "@mui/material";
import "../../styles/Form.css";
import axios from "../../api";

const Activate = () => {
  const { uid, token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message, error } = useSelector((state) => state.auth);
  const [ loading, setLoading ] = useState(false);

  const formatMessage = (msg) => {
    if (!msg) return "";
    if (typeof msg === "object") {
      return Object.values(msg).flat().join(", ");
    }
    return msg;
  };

  const handleActivation = async () => {
    setLoading(true);
    try {
      await dispatch(activateAccount({ uid, token })).unwrap();
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      // Error se almacena en el state
    }
  };

  useEffect(() => {
    document.title = "Activar Cuenta";
  }, []);

  return (
    <Box className="form-background">
      <Paper className="activate-container">
        <Typography variant="h2" align="center" sx={{ mb: 2 }}>
          Active su Cuenta
        </Typography>

        {/* Mensajes de error o éxito */}
        <Collapse in={Boolean(error || message)} sx={{ mb: 2 }}>
          {error ? (
            <Alert severity="error">
              {formatMessage(error) || "Ocurrió un error al activar su cuenta."}
            </Alert>
          ) : (
            <Alert severity="success">
              {formatMessage(message) || "Cuenta activada exitosamente."}
            </Alert>
          )}
        </Collapse>

        <Box className="form-item">
          {loading ? (
            <CircularProgress />
          ) : (
            <MyButton label="Activar Cuenta" onClick={handleActivation} />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Activate;
