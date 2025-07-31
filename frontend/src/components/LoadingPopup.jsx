import React from "react";
import {
  Backdrop,
  Box,
  CircularProgress,
  Typography,
  Fade,
} from "@mui/material";
import { keyframes } from "@emotion/react";

// Animación de pulso para el texto
const pulseAnimation = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

// Animación de rotación suave
const rotateAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoadingPopup = ({
  open,
  message = "Cargando...",
  showSpinner = true,
  zIndex = 9999,
}) => {
  // console.log("🎯 LoadingPopup renderizado - open:", open, "message:", message);
  return (
    <Backdrop
      sx={{
        color: "#fff",
        zIndex: zIndex,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
      }}
      open={open}
    >
      <Fade in={open}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: 4,
            borderRadius: 3,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            minWidth: 200,
            textAlign: "center",
          }}
        >
          {showSpinner && (
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Círculo exterior con gradiente */}
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(45deg, #1976d2, #42a5f5, #90caf9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: `${rotateAnimation} 2s linear infinite`,
                  boxShadow: "0 0 20px rgba(25, 118, 210, 0.5)",
                }}
              >
                {/* Círculo interior */}
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Spinner central */}
                  <CircularProgress
                    size={30}
                    thickness={4}
                    sx={{
                      color: "#1976d2",
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Puntos decorativos */}
              <Box
                sx={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  animation: `${rotateAnimation} 3s linear infinite reverse`,
                }}
              >
                {[...Array(8)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "absolute",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: "#42a5f5",
                      top: "50%",
                      left: "50%",
                      transform: `translate(-50%, -50%) rotate(${
                        index * 45
                      }deg) translateY(-35px)`,
                      animation: `${pulseAnimation} 1.5s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 600,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              animation: `${pulseAnimation} 2s ease-in-out infinite`,
              letterSpacing: "0.5px",
            }}
          >
            {message}
          </Typography>

          {/* Indicador de progreso animado */}
          <Box
            sx={{
              width: 120,
              height: 3,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: "30%",
                height: "100%",
                background: "linear-gradient(90deg, #1976d2, #42a5f5)",
                borderRadius: 2,
                animation: "loading 2s ease-in-out infinite",
                "@keyframes loading": {
                  "0%": { transform: "translateX(-100%)" },
                  "50%": { transform: "translateX(200%)" },
                  "100%": { transform: "translateX(-100%)" },
                },
              }}
            />
          </Box>
        </Box>
      </Fade>
    </Backdrop>
  );
};

export default LoadingPopup;
