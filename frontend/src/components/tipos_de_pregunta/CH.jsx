import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useMediaQuery,
  Chip,
  TextField,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AccessibleForwardIcon from "@mui/icons-material/AccessibleForward";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { chain } from "lodash";

const CH = ({
  preguntas,
  respuestas,
  setRespuestas,
  handleRespuestaChange,
  chAids,
  disabled = false,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openAidDialog, setOpenAidDialog] = React.useState(false);
  const [selectedAidText, setSelectedAidText] = React.useState("");

  // console.log("chAids:", Object.values(chAids));

  const opciones = [
    {
      valor: "lo_hace",
      icono: <CheckCircleIcon />,
      label: "Lo hace",
      color: "success.main",
    },
    {
      valor: "en_proceso",
      icono: <HourglassBottomIcon />,
      label: "En proceso",
      color: "warning.main",
    },
    {
      valor: "no_lo_hace",
      icono: <CancelIcon />,
      label: "No lo hace",
      color: "error.main",
    },
  ];

  const normalize = (str) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const getAidForPregunta = (pregunta) => {
    const aidsArray = Array.isArray(chAids)
      ? chAids
      : typeof chAids === "object"
      ? Object.values(chAids)
      : [];

    const matched = aidsArray.filter(
      (aid) => normalize(aid.name) === normalize(pregunta.texto)
    );

    // console.log("✅ CH Aids para", pregunta.texto, matched);
    return matched.length > 0 ? matched[0] : null;
  };

  const handleClick = async (preguntaId, valor) => {
    const matchedAid = getAidForPregunta(
      preguntas.find((p) => p.id === preguntaId)
    );
    const updated = {
      ...respuestas[preguntaId],
      resultado: valor,
      aid_id: matchedAid ? matchedAid.id : null,
      aid_text: matchedAid ? matchedAid.aid : null,
    };
    setRespuestas((prev) => ({ ...prev, [preguntaId]: updated }));
    await handleRespuestaChange(preguntaId, updated);
  };

  return (
    <Box>
      {preguntas.map((pregunta) => {
        const matchedAid = getAidForPregunta(pregunta);
        // console.log("CH Aids for pregunta", pregunta.texto, matchedAid);
        const estado = respuestas[pregunta.id]?.resultado;
        return (
          <Card
            key={pregunta.id}
            variant="outlined"
            sx={{
              mb: 2,
              borderLeft: `6px solid ${
                estado === "lo_hace"
                  ? "green"
                  : estado === "en_proceso"
                  ? "orange"
                  : estado === "no_lo_hace"
                  ? "red"
                  : "grey"
              }`,
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{ mb: isMobile ? 1 : 0, flex: 1 }}
              >
                {pregunta.texto}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                {opciones.map((op) => (
                  <Tooltip title={op.label} key={op.valor}>
                    <span>
                      <IconButton
                        onClick={() => handleClick(pregunta.id, op.valor)}
                        disabled={disabled}
                        sx={{
                          backgroundColor:
                            estado === op.valor ? op.color : "grey.300",
                          color: "black",
                          borderRadius: 2,
                          boxShadow:
                            estado === op.valor
                              ? "0 2px 6px rgba(0,0,0,0.2)"
                              : "none",
                          "&:hover": {
                            backgroundColor:
                              estado === op.valor ? op.color : "grey.400",
                            boxShadow:
                              estado === op.valor
                                ? "0 4px 12px rgba(0,0,0,0.3)"
                                : "0 2px 6px rgba(0,0,0,0.15)",
                          },
                          px: 1.5,
                          py: 0.5,
                          textTransform: "none",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            fontWeight: "medium",
                            fontSize: "0.875rem",
                          }}
                        >
                          {op.icono}
                          <Typography variant="body2">{op.label}</Typography>
                        </Box>
                      </IconButton>
                    </span>
                  </Tooltip>
                ))}
                {(estado === "en_proceso" || estado === "no_lo_hace") &&
                matchedAid ? (
                  <>
                    <Tooltip title="Ver apoyo recomendado">
                      <IconButton
                        onClick={() => {
                          setSelectedAidText(matchedAid.aid);
                          setOpenAidDialog(true);
                        }}
                        color="primary"
                        size="small"
                      >
                        <AccessibleForwardIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : estado === "lo_hace" ? (
                  <></> // No mostrar ningún ícono si lo hace
                ) : (
                  <Tooltip title="Sin ayudas técnicas disponibles">
                    <HelpOutlineIcon color="disabled" />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
      {/* Dialog para mostrar la ayuda completa */}
      <Dialog
        open={openAidDialog}
        onClose={() => setOpenAidDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Apoyo Recomendado</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{selectedAidText}</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CH;
