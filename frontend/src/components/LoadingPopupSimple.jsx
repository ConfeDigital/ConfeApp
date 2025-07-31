import React from "react";
import { Backdrop, Box, CircularProgress, Typography } from "@mui/material";

const LoadingPopupSimple = ({
  open,
  message = "Cargando...",
  zIndex = 9999,
}) => {
  return (
    <Backdrop
      sx={{
        color: "#fff",
        zIndex: zIndex,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      }}
      open={open}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: 3,
          borderRadius: 2,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          minWidth: 200,
          textAlign: "center",
        }}
      >
        <CircularProgress size={40} color="inherit" />
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingPopupSimple;
