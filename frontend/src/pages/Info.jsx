import { Container, Card, CardContent, Typography, Button, List, ListItem, ListItemText, Box } from "@mui/material";
import NavBar from "../components/NavBar"
import { useNavigate } from "react-router-dom";

export default function InclusionLaboral() {
    const navigate = useNavigate();

    const handleRegister = () => {
        navigate("/register");
      };

  return (
    <Box>
        <NavBar/>
        <Box sx={{ background: 'linear-gradient(60deg, rgba(2, 0, 36, 1) 0%, rgba(17, 68, 129, 1) 35%, rgba(0, 212, 255, 1) 100%)' }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Proceso de inclusión laboral para personas con discapacidad de CONFE
                  </Typography>
                  <Typography paragraph>
                    Te damos la bienvenida al proceso de inclusión laboral CONFE. CONFE es una red de más de cien organizaciones en favor de las personas con discapacidad en México, que nació en 1978.
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Qué es la Inclusión Laboral?
                  </Typography>
                  <Typography paragraph>
                    En México todas las personas mayores de edad tienen derecho a trabajar, incluidas las que tienen algún tipo de discapacidad. El proceso de inclusión laboral busca que las personas con cualquier discapacidad puedan encontrar empleo formal, haciendo efectivo su derecho al trabajo.
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Qué me ofrecen?
                  </Typography>
                  <Typography paragraph>
                    Un empleo con todas las prestaciones de ley, digno y remunerado, en alguna de las empresas participantes.
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Para quién es?
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Para mujeres y hombres mexicanos, con alguna discapacidad (intelectual, auditiva, visual, del habla o motriz), que tengan entre 18 y 45 años de edad." />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Si todavía no cumples los 17 años o ya tienes más de 50 años, este proceso no es para ti." />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Debes tener alguna discapacidad para participar." />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Debes tener nacionalidad mexicana." />
                    </ListItem>
                  </List>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Cómo funciona el proceso?
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="1. Solicita acceso llenando el cuestionario en esta página. Un familiar puede ayudarte. Si cumples con los requisitos, te contactaremos para una entrevista en persona." />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Preparación para el trabajo: evaluamos los apoyos que necesitas y capacitamos según el caso. Este proceso dura de 4 a 8 semanas." />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Búsqueda de empleo: te acompañamos a entrevistas y te damos seguimiento una vez que empieces a trabajar." />
                    </ListItem>
                  </List>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Qué empresas participan?
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="El Puerto de Liverpool" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Zara" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="[Etc.]" />
                    </ListItem>
                  </List>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ¿Es seguro que voy a encontrar empleo?
                  </Typography>
                  <Typography paragraph>
                    La posibilidad de trabajar depende de factores como la disponibilidad de vacantes en tu área y la coincidencia entre tus habilidades y las requeridas para el trabajo. Haremos todo lo posible para ayudarte a encontrar empleo.
                  </Typography>
                  <Box textAlign="center" mt={3}>
                    <Button variant="contained" color="primary" size="large" onClick={handleRegister}>
                      Registrarme
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Container>
        </Box>
    </Box>
  );
}