import React, { useState } from "react";
import Box from "@mui/material/Box";
import StandalonePhoneInputField from "../../components/phone_number/StandalonePhoneInputField";

const Numeros = ({ seleccionOpcion, setSeleccionOpcion, disabled = false }) => {
  const [phoneNumber, setPhoneNumber] = useState(seleccionOpcion || "");

  const handlePhoneChange = (canonicalNumber) => {
    setPhoneNumber(canonicalNumber);
    setSeleccionOpcion(canonicalNumber); // If you still want to update this state
  };

  return (
    <Box
      component="form"
      display="flex"
      sx={{
        "& > :not(style)": {
          width: "100%",
          m: 4,
          pl: 1,
          pr: 1,
          pt: 0.002,
          pb: 0.002,
          justifyContent: "center",
          display: "inline-flex",
        },
      }}
      noValidate
      autoComplete="off"
    >
      <StandalonePhoneInputField
        label="Número de Teléfono"
        fullWidth
        value={phoneNumber}
        onChange={handlePhoneChange}
        disabled={disabled}
      />
    </Box>
  );
};

export default Numeros;
