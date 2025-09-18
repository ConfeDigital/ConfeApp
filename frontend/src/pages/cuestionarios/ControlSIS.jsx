import React from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import SIS_0a4 from "../../components/tipos_de_pregunta/SIS_0a4";
import SIS_0a4_2 from "../../components/tipos_de_pregunta/SIS_0a4_2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const ControlSIS = ({
  preguntas,
  respuestas,
  setRespuestas,
  handleRespuestaChange,
  handleSISTextChange,
  disabled,
  subitems,
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

  // Agrupar preguntas por nombre de sección
  const secciones = React.useMemo(() => {
    return preguntas.reduce((acc, pregunta) => {
      const seccion = pregunta.nombre_seccion || "Sin sección";
      if (!acc[seccion]) {
        acc[seccion] = {
          sis: [],
          sis2: [],
        };
      }
      if (pregunta.tipo === "sis") {
        acc[seccion].sis.push(pregunta);
      } else if (pregunta.tipo === "sis2") {
        acc[seccion].sis2.push(pregunta);
      }
      return acc;
    }, {});
  }, [preguntas]);

  const seccionesArray = Object.entries(secciones);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejo de errores
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      {/* <Box sx={{ width: "100%", px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}> */}
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
              setTabValue((prev) => {
                const newVal = Math.max(0, prev - 1);
                setTimeout(() => {
                  if (topRef.current) {
                    topRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
                return newVal;
              });
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
              setTabValue((prev) => {
                const newVal = Math.min(seccionesArray.length - 1, prev + 1);
                setTimeout(() => {
                  if (topRef.current) {
                    topRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
                return newVal;
              });
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

      {/* Indicador de carga */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Contenido de las pestañas */}

      <>
        {/* //<Paper
      // elevation={3}
      // sx={{
      //   p: { xs: 2, sm: 3 },
      //   borderRadius: 2,
      //   overflowX: "auto",
      // }}
      // > */}
        {seccionesArray.map(
          ([seccion, tipos], index) =>
            tabValue === index && (
              <Box key={seccion}>
                {/* Preguntas LSIS */}
                {tipos.sis.length > 0 && (
                  <Box
                  // sx={{ mb: 4 }}
                  >
                    <SIS_0a4
                      preguntas={tipos.sis}
                      respuestas={respuestas}
                      setRespuestas={setRespuestas}
                      handleRespuestaChange={handleRespuestaChange}
                      handleSISTextChange={handleSISTextChange}
                      disabled={!habilitada || loading}
                      onLoading={(isLoading) => setLoading(isLoading)}
                      onError={(errorMessage) => setError(errorMessage)}
                      subitems={subitems} // <-- Filtrar subitems relacionados con las preguntas
                      questionSubmitStates={questionSubmitStates}
                      QuestionSubmitIndicator={QuestionSubmitIndicator}
                    />
                  </Box>
                )}

                {/* Preguntas SIS Dos */}
                {tipos.sis2.length > 0 && (
                  <Box
                  // sx={{ mt: 4 }}
                  >
                    <SIS_0a4_2
                      preguntas={tipos.sis2}
                      respuestas={respuestas}
                      setRespuestas={setRespuestas}
                      handleRespuestaChange={handleRespuestaChange}
                      handleSISTextChange={handleSISTextChange}
                      disabled={!habilitada || loading}
                      onLoading={(isLoading) => setLoading(isLoading)}
                      onError={(errorMessage) => setError(errorMessage)}
                      questionSubmitStates={questionSubmitStates}
                      QuestionSubmitIndicator={QuestionSubmitIndicator}
                    />
                  </Box>
                )}
              </Box>
            )
        )}
        {/* </Paper> */}
      </>
      <Box
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
              setTabValue((prev) => {
                const newVal = Math.max(0, prev - 1);
                setTimeout(() => {
                  if (topRef.current) {
                    topRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
                return newVal;
              });
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
              setTabValue((prev) => {
                const newVal = Math.min(seccionesArray.length - 1, prev + 1);
                setTimeout(() => {
                  if (topRef.current) {
                    topRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
                return newVal;
              });
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
      {/* </Box> */}
    </>
  );
};

export default ControlSIS;
