import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  FormControl,
  Button,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { tokens } from "../../theme";
import axios from "../../api";
import { useParams } from "react-router-dom";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  InfoWindow,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

const googleMapLibraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: 4,
  margin: "16px 0",
};
const defaultCenter = { lat: 19.4326, lng: -99.1332 }; // Mexico City by default

const candidateIcon =
  "http://maps.google.com/mapfiles/ms/icons/homegardenbusiness.png"; // Example icon
const centerIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png"; // Example icon
const selectedCenterIcon =
  "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"; // Example icon
const currentCenterIcon =
  "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"; // Example icon

const CanalizacionCentro = ({
  usuarioId,
  seleccionOpcion,
  setSeleccionOpcion,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { uid } = useParams();
  const [displayCenterId, setDisplayCenterId] = useState("");
  const [centers, setCenters] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [showFinalConfirmationDialog, setShowFinalConfirmationDialog] =
    useState(false);
  const [newCenterId, setNewCenterId] = useState(null);
  const [candidateLocation, setCandidateLocation] = useState(null);
  const [selectedCenterForMap, setSelectedCenterForMap] = useState(null);
  const [distances, setDistances] = useState({});

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: googleMapLibraries,
    language: "es",
  });

  // Initialize response value based on fetched data
  useEffect(() => {
    if (candidate) {
      // If seleccionOpcion has a center_id, use that - otherwise default to candidate's center
      const centerId = seleccionOpcion?.center_id || candidate.center?.id || "";
      setDisplayCenterId(centerId);

      // Make sure to update seleccionOpcion with the correct center_id (solo si hay cambios reales)
      if (
        !seleccionOpcion?.center_id ||
        seleccionOpcion.center_id !== centerId
      ) {
        const newValue = { center_id: centerId };
        if (JSON.stringify(newValue) !== JSON.stringify(seleccionOpcion)) {
          setSeleccionOpcion(newValue);
        }
      }
    }
  }, [candidate, seleccionOpcion, setSeleccionOpcion]);

  const handleCenterChange = (e) => {
    setNewCenterId(e.target.value);
    setIsConfirmationOpen(true);
  };

  const handleInitialConfirmChange = () => {
    setShowFinalConfirmationDialog(true);
  };

  // Modified to use the new transfer request API
  const handleFinalConfirmChange = async () => {
    if (usuarioId && newCenterId) {
      try {
        // Send a POST request to create a new transfer request
        const res = await axios.post(`/api/centros/canalizar-candidato/`, {
          requested_user_id: usuarioId,
          destination_center_id: newCenterId,
        });
        console.log("Transferencia solicitada:", res.data);

        // Update the seleccionOpcion to reflect the requested change
        setSeleccionOpcion({ center_id: newCenterId });
        setDisplayCenterId(newCenterId);

        // After successful request, you might want to fetch updated candidate/center info
        // or redirect as the candidate's center doesn't change immediately
        fetchCandidateAndCenters(); // Re-fetch to update the UI
        setShowFinalConfirmationDialog(false);
        setIsConfirmationOpen(false);
        navigate(`/candidatos/${usuarioId}`); // Navigate back to candidates list or a confirmation page
      } catch (error) {
        console.error("Error al solicitar el cambio de centro:", error);
        // Display a more user-friendly error message from the backend if available
        setError(
          error.response?.data?.detail ||
            "Error al solicitar el cambio de centro."
        );
      }
    } else {
      setShowFinalConfirmationDialog(false);
      setIsConfirmationOpen(false);
    }
  };

  const handleCloseFinalConfirmationDialog = () => {
    setShowFinalConfirmationDialog(false);
  };

  const fetchCandidateAndCenters = useCallback(async () => {
    try {
      // Fetch candidate information, including their current center
      const candidateRes = await axios.get(
        `/api/candidatos/${usuarioId}/canalizar-centro/`
      );
      setCandidate(candidateRes.data);

      // Don't set displayCenterId here, we'll do that in the useEffect that depends on candidate

      setCandidateLocation({
        lat: parseFloat(candidateRes.data?.domicile?.address_lat),
        lng: parseFloat(candidateRes.data?.domicile?.address_lng),
      });

      // Fetch all centers
      const centersRes = await axios.get("/api/centros/centers/");
      setCenters(centersRes.data);
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError("Error al cargar datos.");
    }
  }, [usuarioId]);

  useEffect(() => {
    fetchCandidateAndCenters();
  }, [fetchCandidateAndCenters]);

  const handleCancelChange = () => {
    setIsConfirmationOpen(false);
    setNewCenterId(null);
  };

  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2))
      return "Calculando...";
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return `${distance.toFixed(2)} km`;
  }, []);

  useEffect(() => {
    if (candidateLocation && centers.length > 0) {
      const newDistances = {};
      centers.forEach((center) => {
        const centerLat = parseFloat(center.location_details?.address_lat);
        const centerLng = parseFloat(center.location_details?.address_lng);
        newDistances[center.id] = calculateDistance(
          candidateLocation.lat,
          candidateLocation.lng,
          centerLat,
          centerLng
        );
      });
      setDistances(newDistances);
    }
  }, [candidateLocation, centers, calculateDistance]);

  const handleMarkerClick = (center) => {
    setSelectedCenterForMap(center);
  };

  if (loadError) {
    return <Typography color="error">Error al cargar Google Maps.</Typography>;
  }

  if (!isLoaded || !candidate) {
    return <Typography>Cargando información...</Typography>;
  }

  const mapCenter = candidateLocation || defaultCenter;

  // Determine the current selection for the dropdown - either the newCenterId (in confirmation state),
  // the displayCenterId (normal state), or fallback to candidate's center
  const currentSelection =
    newCenterId || displayCenterId || candidate?.center?.id || "";

  return (
    <Box
      sx={{
        width: "95%",
        mx: "auto",
        my: 4,
        display: "flex",
        flexDirection: "column",
        maxWidth: "800px",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Cambiar Centro
      </Typography>
      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}
      <FormControl fullWidth>
        <Select
          labelId="center-select-label"
          id="center-select"
          value={currentSelection}
          onChange={handleCenterChange}
          disabled={disabled || centers.length === 0}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return "Seleccionar centro";
            }
            const selectedCenter = centers.find(
              (center) => center.id === selected
            );
            return selectedCenter
              ? `${selectedCenter.name} (${
                  distances[selectedCenter.id] || "Calculando..."
                })`
              : "Centro no encontrado";
          }}
          sx={{
            fontSize: "1.1rem",
            borderRadius: 1,
            boxShadow: 1,
            backgroundColor:
              candidate?.center?.id === currentSelection &&
              colors.lightGreen[600],
            color: candidate?.center?.id === currentSelection && "black",
          }}
        >
          <MenuItem disabled value="">
            Seleccionar centro
          </MenuItem>
          {centers
            .filter((center) => candidate && center.id !== candidate.center.id)
            .map((center) => (
              <MenuItem key={center.id} value={center.id}>
                {center.name} ({distances[center.id] || "Calculando..."})
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {isLoaded && candidate !== null && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={candidateLocation ? 10 : 6}
        >
          {candidateLocation &&
            !isNaN(candidateLocation.lat) &&
            !isNaN(candidateLocation.lng) && (
              <Marker
                position={candidateLocation}
                title="Ubicación del Candidato"
                icon={candidateIcon}
              />
            )}
          {centers.map((center) => {
            const lat = parseFloat(center.location_details?.address_lat);
            const lng = parseFloat(center.location_details?.address_lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              const isSelectedInDropdown = currentSelection === center.id;
              const isCurrentCenter = candidate?.center?.id === center.id;
              const isClicked = selectedCenterForMap?.id === center.id;

              let markerIcon = centerIcon;
              if (isCurrentCenter) {
                markerIcon = currentCenterIcon;
              } else if (isSelectedInDropdown) {
                markerIcon = selectedCenterIcon;
              }

              return (
                <Marker
                  key={center.id}
                  position={{ lat, lng }}
                  title={center.name}
                  icon={markerIcon}
                  onClick={() => handleMarkerClick(center)}
                >
                  {isClicked && (
                    <InfoWindow
                      onCloseClick={() => setSelectedCenterForMap(null)}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: "black" }}>
                          {selectedCenterForMap.name}
                        </Typography>
                        <Typography sx={{ color: "black" }}>
                          Distancia:{" "}
                          {distances[selectedCenterForMap.id] ||
                            "Calculando..."}
                        </Typography>
                      </Box>
                    </InfoWindow>
                  )}
                </Marker>
              );
            }
            return null;
          })}
        </GoogleMap>
      )}

      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={candidateIcon} alt="Candidato" />
          <Typography variant="body2">Candidato</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={currentCenterIcon} alt="Centro Actual" />
          <Typography variant="body2">Centro Actual del Candidato</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={selectedCenterIcon} alt="Seleccionado" />
          <Typography variant="body2">
            Centro Seleccionado (Dropdown)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={centerIcon} alt="Otro Centro" />
          <Typography variant="body2">Otros Centros</Typography>
        </Box>
      </Box>

      {isConfirmationOpen && (
        <Box
          sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          <Button color="secondary" onClick={handleCancelChange}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInitialConfirmChange}
          >
            Confirmar Cambio
          </Button>
        </Box>
      )}
      <Box display="flex" sx={{ mt: 2 }}>
        <WarningAmberIcon color="warning" sx={{ alignSelf: "center" }} />
        <Typography variant="h6" color="warning" sx={{ ml: 1 }}>
          Recuerda: al cambiar el centro del candidato a uno distinto al tuyo,
          ya no podrás visualizar o editar al mismo.
        </Typography>
      </Box>

      {/* Final Confirmation Dialog */}
      <Dialog
        open={showFinalConfirmationDialog}
        onClose={handleCloseFinalConfirmationDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Estás seguro de solicitar el cambio de centro?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Al confirmar, se enviará una solicitud de transferencia. Una vez
            aceptada, el candidato será asignado a un nuevo centro y ya no
            podrás visualizar ni editar su información. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseFinalConfirmationDialog}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleFinalConfirmChange}
            color="primary"
            autoFocus
            variant="contained"
          >
            Confirmar Solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CanalizacionCentro;
