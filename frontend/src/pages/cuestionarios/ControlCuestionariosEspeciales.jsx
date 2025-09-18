import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import CH_0a4 from "../../components/tipos_de_pregunta/CH";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export const ControlCuestionariosEspeciales = ({
  preguntas,
  respuestas,
  setRespuestas,
  handleRespuestaChange,
  disabled,
  technicalAids,
  chAids,
  cuestionarioFinalizado,
  esEditable,
  questionSubmitStates,
  QuestionSubmitIndicator,
}) => {
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const topRef = React.useRef(null);

  const habilitada = !cuestionarioFinalizado || esEditable;

  const secciones = React.useMemo(() => {
    return preguntas.reduce((acc, pregunta) => {
      const seccion = pregunta.nombre_seccion || "Sin sección";
      if (!acc[seccion]) {
        acc[seccion] = {
          ed: [],
          ch: [],
        };
      }
      if (pregunta.tipo === "ed") {
        acc[seccion].ed.push(pregunta);
      } else if (pregunta.tipo === "ch") {
        acc[seccion].ch.push(pregunta);
      }
      return acc;
    }, {});
  }, [preguntas]);

  const seccionesArray = Object.entries(secciones);

  return (
    <>
      <Box
        ref={topRef}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          px: 1,
        }}
      >
        <Box>
          <IconButton
            onClick={() => {
              setTabValue((prev) => Math.max(0, prev - 1));
            }}
            disabled={tabValue === 0}
            sx={{
              fontSize: "1.25rem",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              cursor: tabValue === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {seccionesArray[tabValue]?.[0]}
        </Box>
        <Box>
          <IconButton
            onClick={() => {
              setTabValue((prev) =>
                Math.min(seccionesArray.length - 1, prev + 1)
              );
            }}
            disabled={tabValue === seccionesArray.length - 1}
            sx={{
              fontSize: "1.25rem",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              cursor:
                tabValue === seccionesArray.length - 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {seccionesArray.map(
        ([seccion, tipos], index) =>
          tabValue === index && (
            <Box key={seccion}>
              {tipos.ed.map((pregunta) => (
                <Box key={pregunta.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Pregunta ED: {pregunta.texto}
                  </Typography>
                </Box>
              ))}
              {tipos.ch.length > 0 && (
                <CH_0a4
                  preguntas={tipos.ch}
                  respuestas={respuestas}
                  setRespuestas={setRespuestas}
                  handleRespuestaChange={handleRespuestaChange}
                  disabled={!habilitada || loading}
                  chAids={chAids}
                  onLoading={setLoading}
                  onError={setError}
                  questionSubmitStates={questionSubmitStates}
                  QuestionSubmitIndicator={QuestionSubmitIndicator}
                />
              )}
            </Box>
          )
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 2,
          px: 1,
        }}
      >
        <Box>
          <IconButton
            onClick={() => {
              setTabValue((prev) => Math.max(0, prev - 1));
            }}
            disabled={tabValue === 0}
            sx={{
              fontSize: "1.25rem",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              cursor: tabValue === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {seccionesArray[tabValue]?.[0]}
        </Box>
        <Box>
          <IconButton
            onClick={() => {
              setTabValue((prev) =>
                Math.min(seccionesArray.length - 1, prev + 1)
              );
            }}
            disabled={tabValue === seccionesArray.length - 1}
            sx={{
              fontSize: "1.25rem",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              cursor:
                tabValue === seccionesArray.length - 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
};
export default ControlCuestionariosEspeciales;
