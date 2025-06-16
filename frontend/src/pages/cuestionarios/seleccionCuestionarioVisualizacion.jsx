import React from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function SeleccionCuestionarioVisualizacion({
  cuestionariosFinalizados,
  handleChangeCuestionarioFinalizado,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexWrap: "nowrap",
        flexDirection: "column",
        mt: 4,
        // mr: 4,
        // ml: 4,
        alignContent: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
      }}
    >
      {/* Selector de cuestionarios finalizados */}
      <FormControl sx={{ display: "flex", width: "90%", mb: 3 }}>
        <InputLabel id="demo-simple-select-label">Cuestionario</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="Cuestionario"
          onChange={handleChangeCuestionarioFinalizado}
        >
          {Array.isArray(cuestionariosFinalizados) &&
            cuestionariosFinalizados.map((item, index) => (
              <MenuItem key={index} value={item.id}>
                {item.nombre}
                {/* {item} */}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default SeleccionCuestionarioVisualizacion;
