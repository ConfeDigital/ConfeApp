import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function InActive() {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
    >
      <Typography variant="h1" color="error" fontWeight="bold">
        401
      </Typography>
      <Typography variant="h4" mt={1}>
        No autorizado
      </Typography>
      <Typography variant="body1" mt={2}>
        Lo sentimos, no estás autorizado para entrar a esta página.
      </Typography>
      <Typography variant="body1" mt={2} mb={4}>
        Si iniciaste sesión es posible que su cuenta haya sido desactivada.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
    </Box>
  );
}

export default InActive;
