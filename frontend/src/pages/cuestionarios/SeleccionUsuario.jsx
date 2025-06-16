import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

function SeleccionUsuario({
  usuario,
  handleChangeUsuario,
  correoUsuarioSeleccionado,
}) {
  return (
    <Box
      sx={{
        width: "80%",
        display: "flex",
        // flexWrap: "nowrap",
        // flexDirection: "row",
        mt: 4,
        // mr: 4,
        ml: 4,
        alignContent: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", width: "100%", m: 4 }}>
        <Autocomplete
          sx={{ display: "flex", width: "50%", m: 4 }}
          options={usuario.map((item) => item.email)}
          onChange={handleChangeUsuario}
          renderInput={(params) => (
            <TextField {...params} label="Busca al usuario" />
          )}
        />
      </Box>
      {correoUsuarioSeleccionado && (
        <Box sx={{ display: "flex", alignItems: "center", m: 4 }}>
          <span>Correo: {correoUsuarioSeleccionado}</span>
        </Box>
      )}
    </Box>
  );
}

export default SeleccionUsuario;
