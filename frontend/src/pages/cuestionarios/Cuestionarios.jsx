import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Grid, Avatar } from "@mui/material";
import Header from "../../components/Header";
import api from "../../api";
import SeleccionUsuario from "./SeleccionUsuario";
import SeleccionCuestionario from "./SeleccionCuestionario";
import DespliegueCuestionario from "./DespliegueCuestionario";

function Cuestionarios() {
  const [usuario, setUsuario] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cuestionario, setCuestionario] = useState([]);
  const [cuestionarioSeleccionado, setCuestionarioSeleccionado] = useState("");

  useEffect(() => {
    getUsuario();
    getCuestionariosActivos();
  }, []);

  const getUsuario = () => {
    api
      .get("/api/usuarios/")
      .then((res) => setUsuario(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  };

  const getCuestionariosActivos = () => {
    api
      .get("/api/cuestionarios/")
      .then((res) => {
        const cuestionariosActivos = res.data
          .map((grupo) => ({
            ...grupo,
            cuestionarios: grupo.cuestionarios.filter(
              (cuestionario) => cuestionario.activo
            ),
          }))
          .filter((grupo) => grupo.cuestionarios.length > 0);

        setCuestionario(cuestionariosActivos);
      })
      .catch((err) => console.error("Error fetching questionnaires:", err));
  };

  const handleChangeUsuario = (event, value) => {
    const selectedUser = usuario.find((item) => item.email === value);
    if (selectedUser) {
      setUsuarioSeleccionado(selectedUser);
      setCuestionarioSeleccionado("");
    }
  };

  const handleCambiarUsuario = () => {
    setUsuarioSeleccionado(null);
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        p: 3,
      }}
    >
      <Header
        title="Cuestionarios"
        subtitle="Seleccione un usuario y un cuestionario para comenzar."
        sx={{ mb: 3 }}
      />

      {usuarioSeleccionado && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={
                  usuarioSeleccionado.photo || "https://via.placeholder.com/100"
                }
                sx={{ width: 80, height: 80 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight="bold">
                {usuarioSeleccionado.first_name} {usuarioSeleccionado.last_name}{" "}
                {usuarioSeleccionado.second_last_name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {usuarioSeleccionado.email}
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCambiarUsuario}
              >
                Cambiar Usuario
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {!usuarioSeleccionado && (
        <SeleccionUsuario
          usuario={usuario}
          handleChangeUsuario={handleChangeUsuario}
        />
      )}

      {usuarioSeleccionado && (
        <SeleccionCuestionario
          cuestionarios={cuestionario.flatMap((grupo) => grupo.cuestionarios)}
          cuestionarioSeleccionado={cuestionarioSeleccionado}
          handleChangeCuestionario={(event) =>
            setCuestionarioSeleccionado(event.target.value)
          }
        />
      )}

      {usuarioSeleccionado && cuestionarioSeleccionado && (
        <DespliegueCuestionario
          usuarioId={usuarioSeleccionado.id}
          cuestionarioId={cuestionarioSeleccionado}
        />
      )}
    </Box>
  );
}

export default Cuestionarios;
