import React, { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Grid2 as Grid,
  Typography,
  Link,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { formatCanonicalPhoneNumber } from "../phone_number/phoneUtils"; // adjust the path as needed

const ContactList = ({ emergency_contacts }) => {
  const [showContacts, setShowContacts] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Toggle button */}
      <Box display="flex" justifyContent="flex-end">
        <Button
          onClick={() => setShowContacts(!showContacts)}
          variant="text"
          color="info"
          sx={{ fontWeight: "bold" }}
          endIcon={showContacts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {showContacts ? "OCULTAR CONTACTOS" : "MOSTRAR CONTACTOS"}
        </Button>
      </Box>

      {/* Contacts collapse */}
      <Collapse in={showContacts}>
        {emergency_contacts && emergency_contacts.length > 0 ? (
          <Grid container spacing={2} mt={1}>
            {emergency_contacts.map((contact) => (
              <Grid item xs={12} key={contact.id}>
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    {contact.first_name} {contact.last_name}{" "}
                    {contact.second_last_name}
                  </Typography>
                  <Typography variant="body2">
                    Relación: {contact.relationship}
                  </Typography>
                  <Typography variant="body2">
                    Teléfono:{" "}
                    <Link
                      href={`tel:${contact.phone_number}`}
                      sx={{ fontWeight: "bold" }}
                    >
                      {formatCanonicalPhoneNumber(contact.phone_number)}
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    Correo Electrónico:{" "}
                    <Link
                      href={`email:${contact.phone_number}`}
                      sx={{ fontWeight: "bold" }}
                    >
                      {contact.email}
                    </Link>
                  </Typography>
                  {contact.lives_at_same_address ? (
                    <Typography variant="body2">
                      Vive en la misma dirección
                    </Typography>
                  ) : contact.domicile ? (
                    <Box mt={1}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Dirección:
                      </Typography>
                      <Typography variant="body2">
                        {contact.domicile.address_road} #
                        {contact.domicile.address_number}{" "}
                        {contact.domicile.address_number_int}
                      </Typography>
                      <Typography variant="body2">
                        {contact.domicile.address_col},{" "}
                        {contact.domicile.address_municip}
                      </Typography>
                      <Typography variant="body2">
                        {contact.domicile.address_city},{" "}
                        {contact.domicile.address_state}
                      </Typography>
                      <Typography variant="body2">
                        CP: {contact.domicile.address_PC}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }}>
            No hay contactos registrados.
          </Typography>
        )}
      </Collapse>
    </Box>
  );
};

export default ContactList;
