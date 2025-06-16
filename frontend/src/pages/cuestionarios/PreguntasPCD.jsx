import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Abierta from "./Abierta";
import OpcionMultiple from "./OpcionMultiple";
import SiguienteBoton from "./SiguienteBoton";
import AnteriorBoton from "./AnteriorBoton";
import BarraProgreso from "./BarraProgreso";
import api from "../../api";

const PreguntasPCD = ({
  cuestionario,
  usuario,
  preguntaIndex,
  setPreguntaIndex,
}) => {
  const [seleccionOpcion, setSeleccionOpcion] = useState("");

  useEffect(() => {
    const fetchRespuesta = async () => {
      try {
        const cuestionario_id = cuestionario.id;
        const preguntaActual = cuestionario.preguntas[preguntaIndex].id;
        const tipoPregunta =
          cuestionario.preguntas[preguntaIndex].tipo_Pregunta;

        // Verificar si la respuesta ya existe
        const existingResponse = await api.get("/respuestas/", {
          params: {
            usuario: usuario,
            cuestionario: cuestionario_id,
            pregunta: preguntaActual,
          },
        });

        if (existingResponse.data.length > 0) {
          // Obtener la respuesta existente
          const respuestaExistente = existingResponse.data.find(
            (r) =>
              r.usuario === usuario &&
              r.cuestionario === cuestionario_id &&
              r.pregunta === preguntaActual
          );

          if (respuestaExistente) {
            // Establecer la opción seleccionada basada en la respuesta existente
            if (tipoPregunta === "multiple") {
              setSeleccionOpcion(parseInt(respuestaExistente.respuesta, 10));
            } else {
              setSeleccionOpcion(respuestaExistente.respuesta);
            }
          } else {
            // Si no hay respuesta existente, establecer a cadena vacía
            setSeleccionOpcion("");
          }
        } else {
          // Si no hay respuesta existente, establecer a cadena vacía
          setSeleccionOpcion("");
        }
      } catch (error) {
        console.error("Error al obtener la respuesta existente:", error);
        // En caso de error, establecer a cadena vacía
        setSeleccionOpcion("");
      }
    };

    fetchRespuesta();
  }, [usuario, cuestionario, preguntaIndex]);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        width: "100%",
        mr: 4,
        ml: 4,
        alignContent: "center",
        justifyContent: "center",
      }}
    >
      <Paper elevation={10} sx={{ display: "flex", width: "100%", m: 4 }}>
        {preguntaIndex >= 1 && (
          <AnteriorBoton
            preguntaIndex={preguntaIndex}
            setPreguntaIndex={setPreguntaIndex}
          />
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            p: 1,
            m: 1,
            bgcolor: "background.paper",
            borderRadius: 1,
            width: "100%",
            alignContent: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <BarraProgreso
            preguntaIndex={preguntaIndex}
            totalPreguntas={cuestionario.pregunta_count}
          />
          <Box
            sx={{
              m: 4,
              alignContent: "center",
              justifyContent: "center",
              flexDirection: "column",
              display: "flex",
              width: "100%",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                width: "100%",
                justifyContent: "center",
                p: 4,
                display: "flex",
              }}
            >
              <Typography variant="h6" sx={{ p: 1 }}>
                {cuestionario.preguntas[preguntaIndex].pregunta}
              </Typography>
            </Paper>

            {cuestionario.preguntas[preguntaIndex].tipo_Pregunta ===
            "abierta" ? (
              <Abierta
                seleccionOpcion={seleccionOpcion}
                setSeleccionOpcion={setSeleccionOpcion}
                usuario={usuario}
                cuestionario={cuestionario}
                pregunta={cuestionario.preguntas[preguntaIndex]}
              />
            ) : (
              <OpcionMultiple
                opciones={cuestionario.preguntas[preguntaIndex].opciones}
                seleccionOpcion={seleccionOpcion}
                setSeleccionOpcion={setSeleccionOpcion}
                usuario={usuario}
                cuestionario={cuestionario}
                pregunta={cuestionario.preguntas[preguntaIndex]}
              />
            )}
          </Box>
        </Box>
        <SiguienteBoton
          seleccionOpcion={seleccionOpcion}
          setSeleccionOpcion={setSeleccionOpcion}
          preguntaIndex={preguntaIndex}
          setPreguntaIndex={setPreguntaIndex}
          preguntasTotales={cuestionario.pregunta_count}
          usuario={usuario}
          cuestionario={cuestionario}
          pregunta={cuestionario.preguntas[preguntaIndex]}
        />
      </Paper>
    </Box>
  );
};

export default PreguntasPCD;
