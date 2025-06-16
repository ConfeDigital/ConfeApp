import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function NotFound() {
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
        404
      </Typography>
      <Typography variant="h4" mt={1}>
        Página no encontrada
      </Typography>
      <Typography variant="body1" mt={2} mb={4}>
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
    </Box>
  );
}

export default NotFound;
