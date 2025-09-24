import React from "react";
import Abierta from "../../components/tipos_de_pregunta/Abierta";
import OpcionMultiple from "../../components/tipos_de_pregunta/OpcionMultiple";
import CheckboxPregunta from "../../components/tipos_de_pregunta/CheckboxPregunta";
import Numeros from "../../components/tipos_de_pregunta/Numeros";
import NumeroTelefono from "../../components/tipos_de_pregunta/NumeroTelefono";
import DropDownPregunta from "../../components/tipos_de_pregunta/DropDownPregunta";
import Fecha from "../../components/tipos_de_pregunta/Fecha";
import FechaHora from "../../components/tipos_de_pregunta/FechaHora";
import SIS_0a4 from "../../components/tipos_de_pregunta/SIS_0a4";
import SIS_0a4_2 from "../../components/tipos_de_pregunta/SIS_0a4_2";
import Datos_domicilio from "../../components/tipos_de_pregunta/Datos_domicilio";
import Datos_contactos from "../../components/tipos_de_pregunta/Datos_contactos";
import Datos_medicos from "../../components/tipos_de_pregunta/Datos_medicos";
import MetaPregunta from "../../components/tipos_de_pregunta/MetaPregunta";
import { Typography, Box, Divider, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
// import api from "../../services/api"; // ajusta el path según tu estructura
import api from "../../api";
import Canalizacion from "../../components/tipos_de_pregunta/Canalizacion";
import CanalizacionCentro from "../../components/tipos_de_pregunta/CanalizacionCentro";
import Imagen from "../../components/tipos_de_pregunta/Imagen";
import BinaryPregunta from "../../components/tipos_de_pregunta/BinaryPregunta";
import ProfileField from "../../components/tipos_de_pregunta/ProfileField";
import ProfileFieldChoice from "../../components/tipos_de_pregunta/ProfileFieldChoice";
import ProfileFieldBoolean from "../../components/tipos_de_pregunta/ProfileFieldBoolean";
import ProfileFieldDate from "../../components/tipos_de_pregunta/ProfileFieldDate";
import ProfileFieldTextarea from "../../components/tipos_de_pregunta/ProfileFieldTextarea";
import ProfileFieldPhonenumber from "../../components/tipos_de_pregunta/ProfileFieldPhonenumber"
import Discapacidad from "../../components/tipos_de_pregunta/Discapacidad";
import Medicamentos from "../../components/tipos_de_pregunta/Medicamentos";

const TiposDePregunta = ({
  pregunta,
  respuesta,
  onRespuestaChange,
  unlockedQuestions,
  cuestionarioFinalizado,
  usuario,
  cuestionario,
  esEditable,
  onGuardarCambios,
}) => {
  const [modoEdicion, setModoEdicion] = React.useState(false);
  const habilitada = !cuestionarioFinalizado || modoEdicion || esEditable;

  React.useEffect(() => {
    if (!esEditable) {
      setModoEdicion(false);
    }
  }, [esEditable]);

  React.useEffect(() => {
    if (cuestionarioFinalizado) {
      setModoEdicion(false);
    }
  }, [cuestionarioFinalizado]);

  // Lógica de desbloqueo
  const isQuestionUnlocked = () => {
    // Si la pregunta no tiene desbloqueos recibidos, siempre es visible
    if (pregunta.desbloqueos_recibidos.length === 0) return true;
    // Si tiene desbloqueos, solo es visible si está en unlockedQuestions
    return unlockedQuestions.has(pregunta.id);
  };

  // Si la pregunta no está desbloqueada, no renderizar nada
  if (!isQuestionUnlocked()) return null;

  // Función para parsear la respuesta según el tipo
  const parsearRespuesta = (respuesta, tipo) => {
    try {
      switch (tipo) {
        case "checkbox":
          // Manejar tanto arrays como strings JSON (para compatibilidad)
          if (Array.isArray(respuesta)) {
            return respuesta;
          } else if (typeof respuesta === "string") {
            return JSON.parse(respuesta);
          } else {
            return respuesta;
          }
        case "fecha":
        case "fecha_hora":
          return respuesta ? new Date(respuesta) : null;
        case "multiple":
        case "dropdown":
          if (
            respuesta === undefined ||
            respuesta === null ||
            respuesta === ""
          ) {
            return -1;
          }
          const parsed = parseInt(respuesta, 10);
          return isNaN(parsed) ? -1 : parsed;
        case "imagen":
          // Para preguntas de imagen (slider), asegurar que sea un número
          if (
            respuesta === undefined ||
            respuesta === null ||
            respuesta === ""
          ) {
            return 0;
          }
          const valorImagen = parseFloat(respuesta);
          return isNaN(valorImagen) ? 0 : valorImagen;
        default:
          return respuesta || "";
      }
    } catch (error) {
      console.error("Error parseando respuesta:", error);
      return null;
    }
  };

  // Renderizado condicional por tipo de pregunta
  const renderizarPregunta = () => {
    const respuestaParseada = parsearRespuesta(respuesta, pregunta.tipo);

    switch (pregunta.tipo) {
      case "datos_personales":
        return (
          <Datos_personales
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "datos_domicilio":
        return (
          <Datos_domicilio
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "contactos":
        return (
          <Datos_contactos
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "datos_medicos":
        return (
          <Datos_medicos
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "tipo_discapacidad":
        return (
          <Discapacidad
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "medicamentos":
        return (
          <Medicamentos
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "abierta":
        return (
          <Abierta
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "multiple":
        return (
          <OpcionMultiple
            opciones={pregunta.opciones}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "checkbox":
        return (
          <CheckboxPregunta
            opciones={pregunta.opciones}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "binaria":
        return (
          <BinaryPregunta
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "fecha":
        return (
          <Fecha
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "fecha_hora":
        return (
          <FechaHora
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "dropdown":
        return (
          <DropDownPregunta
            opciones={pregunta.opciones}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "numero":
        return (
          <Numeros
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "numero_telefono":
        return (
          <NumeroTelefono
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "meta":
        return (
          <MetaPregunta
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "imagen":
        return (
          <Imagen
            preguntaId={pregunta.id} // 👈 este es el prop necesario
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "canalizacion":
        return (
          <Canalizacion
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "canalizacion_centro":
        return (
          <CanalizacionCentro
            usuarioId={usuario}
            seleccionOpcion={respuestaParseada}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "sis":
        return (
          <SIS_0a4
            preguntas={pregunta}
            respuesta={respuestaParseada}
            setRespuesta={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "sis2":
        return (
          <SIS_0a4_2
            preguntas={pregunta}
            respuesta={respuestaParseada}
            setRespuesta={onRespuestaChange}
            disabled={!habilitada}
          />
        );

      case "profile_field":
        return (
          <ProfileField
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      case "profile_field_choice":
        return (
          <ProfileFieldChoice
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      case "profile_field_boolean":
        return (
          <ProfileFieldBoolean
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      case "profile_field_date":
        return (
          <ProfileFieldDate
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      case "profile_field_textarea":
        return (
          <ProfileFieldTextarea
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      case "profile_field_phonenumber":
        return (
          <ProfileFieldPhonenumber
            pregunta={pregunta}
            usuarioId={usuario}
            setSeleccionOpcion={onRespuestaChange}
            disabled={!habilitada}
            initialValue={respuestaParseada}
          />
        );

      default:
        return (
          <Typography color="error">
            Tipo de pregunta no soportado: {pregunta.tipo}
          </Typography>
        );
    }
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          // my: 1,
          position: "relative",
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* Contenedor principal con opacidad condicional */}
        <Box
          sx={{
            opacity:
              cuestionarioFinalizado && !esEditable && !modoEdicion ? 0.6 : 1,
          }}
        >
          {/* Texto de la pregunta con estilos mejorados */}
          <Typography
            variant="h4"
            sx={{
              textAlign: "center",
              mb: 2,
              fontWeight: "bold",
              fontSize: { sm: "1.5rem", md: "2rem" },
              color: "info.main",
              // textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
              lineHeight: 1.2,
            }}
          >
            {pregunta.texto}
          </Typography>

          <Divider sx={{ mb: 3 }} />
          {renderizarPregunta()}

          {modoEdicion && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                startIcon={<CheckCircleIcon />}
                variant="contained"
                color="success"
                onClick={async () => {
                  setModoEdicion(false);
                  await onGuardarCambios(pregunta.id);
                }}
              >
                Terminar edición
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default TiposDePregunta;
