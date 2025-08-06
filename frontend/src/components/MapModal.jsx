import React from "react";
import {
  Box,
  Modal,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: 4,
};

const defaultMapCenter = { lat: 19.4326, lng: -99.1332 }; // CDMX fallback

const MapModal = ({ open, onClose, lat, lng, label = "Ubicación" }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
    language: "es",
  });

  const position = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 2,
        }}
      >
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          {loadError ? (
            <Typography color="error">Error al cargar Google Maps.</Typography>
          ) : !isLoaded ? (
            <Typography>Cargando mapa...</Typography>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={position}
              zoom={16}
            >
              <Marker position={position} title={label} />
            </GoogleMap>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
};

export default MapModal;
