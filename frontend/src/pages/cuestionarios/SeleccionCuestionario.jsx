import React from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function SeleccionCuestionario({
  cuestionarios,
  cuestionarioSeleccionado,
  handleChangeCuestionario,
  showReport,
  cuestionariosFinalizados,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexWrap: "nowrap",
        flexDirection: "row",
        mt: 4,
        mr: 4,
        ml: 4,
        alignContent: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
      }}
    >
      <FormControl sx={{ display: "flex", width: "100%", m: 4 }}>
        <InputLabel id="demo-simple-select-label">Cuestionario</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={cuestionarioSeleccionado}
          label="Cuestionario"
          onChange={handleChangeCuestionario}
        >
          {Array.isArray(cuestionarios) &&
            cuestionarios.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.nombre}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default SeleccionCuestionario;
