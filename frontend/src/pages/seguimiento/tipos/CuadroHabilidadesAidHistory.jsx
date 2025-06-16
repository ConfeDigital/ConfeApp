import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  useMediaQuery,
  Button,
  CircularProgress,
} from "@mui/material";
import useDocumentTitle from "../../../components/hooks/useDocumentTitle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useParams } from "react-router-dom";
import axios from "../../../api"

const ChSeguimiento = ({ documentTitle }) => {
  useDocumentTitle(documentTitle);
  const [respuestas, setRespuestas] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const { uid } = useParams();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const resumenCH = await axios.get(
          `/api/cuestionarios/resumen-ch/?usuario_id=${uid}`
        );
        setRespuestas(resumenCH.data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setRespuestas([]);
      }
      setLoading(false);
    };

    if (uid) fetchAll();
  }, [uid]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!respuestas) return "Sin datos";

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const renderLista = (titulo, items, color) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", color, mb: 2 }}>
        {titulo}
      </Typography>
      {items.map((r) => {
        const estadoActual = r.resultado;
        return (
          <Paper
            key={r.pregunta_id}
            variant="outlined"
            sx={{
              p: 2,
              mb: 1,
              borderLeft: `6px solid`,
              borderColor: color,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {r.pregunta}
            </Typography>
            {titulo !== "✅ Lo hace" && r.aid_text && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: "text.primary" }}
                >
                  Apoyo recomendado:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.aid_text}
                </Typography>
              </Box>
            )}
            {/* <Typography variant="caption" color={color} sx={{ mt: 2 }}>
              Estado:{" "}
              {estadoActual === "lo_hace"
                ? "Lo hace"
                : estadoActual === "en_proceso"
                ? "En proceso"
                : "No lo hace"}
            </Typography> */}
          </Paper>
        );
      })}
    </Box>
  );

  return (
    <Box
      sx={{
        // mt: 3,
        // mb: 4,
        p: 2,
        backgroundColor: "background.default",
        borderRadius: 2,
      }}
    >

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          <Paper
            onClick={() => setTabIndex(0)}
            sx={{
              p: 1,
              cursor: "pointer",
              backgroundColor: tabIndex === 0 ? "success.light" : "background.paper",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              <Typography>Lo hace</Typography>
            </Box>
          </Paper>
          <Paper
            onClick={() => setTabIndex(1)}
            sx={{
              p: 1,
              cursor: "pointer",
              backgroundColor: tabIndex === 1 ? "warning.light" : "background.paper",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <HourglassEmptyIcon sx={{ mr: 1 }} />
              <Typography>En proceso</Typography>
            </Box>
          </Paper>
          <Paper
            onClick={() => setTabIndex(2)}
            sx={{
              p: 1,
              cursor: "pointer",
              backgroundColor: tabIndex === 2 ? "error.light" : "background.paper",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <HighlightOffIcon sx={{ mr: 1 }} />
              <Typography>No lo hace</Typography>
            </Box>
          </Paper>
        </Box>
      ) : (
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab
            icon={<CheckCircleIcon sx={{ mr: 1 }} />}
            label="Lo hace"
            iconPosition="start"
          />
          <Tab
            icon={<HourglassEmptyIcon sx={{ mr: 1 }} />}
            label="En proceso"
            iconPosition="start"
          />
          <Tab
            icon={<HighlightOffIcon sx={{ mr: 1 }} />}
            label="No lo hace"
            iconPosition="start"
          />
        </Tabs>
      )}
      {tabIndex === 0 &&
        renderLista(
          "✅ Lo hace",
          respuestas.lista_lo_hace || [],
          "success.main"
        )}
      {tabIndex === 1 &&
        renderLista(
          "🟠 En proceso",
          respuestas.lista_en_proceso || [],
          "warning.main"
        )}
      {tabIndex === 2 &&
        renderLista(
          "❌ No lo hace",
          respuestas.lista_no_lo_hace || [],
          "error.main"
        )}
    </Box>
  );
};

export default ChSeguimiento;
