import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

function ControlPaginas({ currentPage, totalPages, handlePageChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 2,
        mb: 4,
      }}
    >
      <Button
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        Anterior
      </Button>
      <Typography sx={{ mx: 2, alignSelf: "center" }}>
        Página {currentPage} de {totalPages}
      </Typography>
      <Button
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        Siguiente
      </Button>
    </Box>
  );
}

export default ControlPaginas;
