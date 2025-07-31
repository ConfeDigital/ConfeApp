import React from "react";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";

const OpcionMultiple = ({
  opciones,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const seleccionRespuesta = (index) => {
    setSeleccionOpcion(index);
    // console.log("index: ", index);
  };

  // console.log("seleccionOpcion: ", seleccionOpcion);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center", // Center buttons horizontally
        width: "100%",
        mt: 2,
        px: { xs: 1, sm: 2 },
        gap: 2, // Adds consistent spacing between buttons
      }}
    >
      {opciones.map((opcion, index) => (
        <Button
          key={index}
          variant="contained"
          size="large"
          sx={{
            width: { xs: "100%", sm: "80%" }, // Responsive width for mobile and larger screens
            maxWidth: { xs: "100%", sm: "600px" }, // Responsive max width
            py: 2, // Padding on the y-axis for taller buttons
            fontSize: { xs: "1rem", sm: "1.2rem" }, // Responsive font size
            fontWeight: "bold", // Bold text
            // color: seleccionOpcion === index ? "#050505" : "#fdf6eb", // Text color
            backgroundColor:
              seleccionOpcion === index ? "success.light" : colors.grey[700], // Background color
            color:
              seleccionOpcion === index ? "success.contrastText" : "grey.contrastText", // Background color
            // border: seleccionOpcion === index ? "2px solid #226260" : "none", // Border for selected button
            // borderRadius: "12px", // Rounded corners
            boxShadow: 3, // Subtle shadow for depth
            transition: "all 0.3s ease", // Smooth transition for hover effects
            "&:hover": {
              // backgroundColor:
              //   seleccionOpcion === index ? "#fdf6eb" : "#1a4a4a", // Darker background on hover
              transform: "scale(1.02)", // Slightly enlarge on hover
            },
          }}
          onClick={() => seleccionRespuesta(index)}
          disabled={disabled}
        >
          {opcion.texto} {/* Display the option text */}
        </Button>
      ))}
    </Box>
  );
};

export default OpcionMultiple;
