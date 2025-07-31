import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingPopupTest = ({ open, message = "Cargando..." }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
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
        <CircularProgress size={40} sx={{ color: "#fff" }} />
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingPopupTest;
