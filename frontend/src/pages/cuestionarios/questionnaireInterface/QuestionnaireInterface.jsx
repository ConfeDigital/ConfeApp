// QuestionnaireInterface.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { FaFileExcel } from "react-icons/fa";
import PreguntaCard from "./PreguntaCard"; // Asegúrate de que esta ruta sea correcta
import PopupPrecargaCuestionario from "./PopupPrecargaCuestionario";
import api from "../../../api"; // Asegúrate de que esta ruta sea correcta
import LoadingPopup from "../../../components/LoadingPopup";

const TIPOS_COMPLETOS = [
  "multiple",
  "abierta",
  "numero",
  "numero_telefono",
  "checkbox",
  "binaria",
  "fecha",
  "fecha_hora",
  "dropdown",
  "sis",
  "sis2",
  "datos_personales",
  "datos_domicilio",
  "datos_medicos",
  "contactos",
  "tipo_discapacidad",
  "canalizacion",
  "canalizacion_centro",
  "ed",
  "ch",
  "imagen",
  "meta",
  "profile_field",
  "profile_field_choice",
  "profile_field_boolean",
  "profile_field_date",
  "profile_field_textarea",
];

const tiposPorCuestionario = {
  Normal: TIPOS_COMPLETOS.filter(
    (t) =>
      !["sis", "sis2", "ch", "canalizacion", "canalizacion_centro", "profile_field_choice", "profile_field_boolean", "profile_field_date", "profile_field_textarea"].includes(t)
  ),
  SIS: ["sis", "sis2"],
  "Cuadro de Habilidades": ["ch"],
  Canalizacion: ["canalizacion", "canalizacion_centro", "binaria"],
};

const obtenerTipoDefault = (tipoCuestionario) => {
  switch (tipoCuestionario) {
    case "Normal":
      return "abierta";
    case "SIS":
      return "sis";
    case "Cuadro de Habilidades":
      return "ch";
    case "Canalizacion":
      return "canalizacion";
    default:
      return "abierta";
  }
};

// Helper function to detect questionnaire type from questions
const detectQuestionnaireType = (questions) => {
  if (!questions || questions.length === 0) return "Normal";

  const questionTypes = new Set(questions.map((q) => q.tipo));

  // Check for SIS type
  if (questionTypes.has("sis") || questionTypes.has("sis2")) {
    return "SIS";
  }

  // Check for Cuadro de Habilidades
  if (questionTypes.has("ch")) {
    return "Cuadro de Habilidades";
  }

  // Check for Canalizacion
  if (
    questionTypes.has("canalizacion") ||
    questionTypes.has("canalizacion_centro")
  ) {
    return "Canalizacion";
  }

  return "Normal";
};

const EditorCuestionario = () => {
  const { idBase, idCuestionario } = useParams();
  const navigate = useNavigate();
  const [dialogoExito, setDialogoExito] = useState(false);
  const id = parseInt(idCuestionario, 10);

  const [edicionDeshabilitada, setEdicionDeshabilitada] = useState(false);
  const [secciones, setSecciones] = useState([]);
  const [tipoCuestionario, setTipoCuestionario] = useState("Normal");
  const [preguntas, setPreguntas] = useState([]);
  const [popupCambioTipo, setPopupCambioTipo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [popupConfirmacionGuardar, setPopupConfirmacionGuardar] =
    useState(false);
  const [mensajeConfirmacionGuardar, setMensajeConfirmacionGuardar] = useState(
    "Una vez publicado el cuestionario, no podrás editarlo. ¿Deseas continuar?"
  );
  const [preguntaAEliminar, setPreguntaAEliminar] = useState(null);
  const [popupPrecargaAbierto, setPopupPrecargaAbierto] = useState(false);
  const [archivoPrecarga, setArchivoPrecarga] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const tiposPermitidos = tiposPorCuestionario[tipoCuestionario] || [];

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api
        .get(`/api/cuestionarios/${id}/preguntas/`)
        .then((response) => {
          setPreguntas(response.data);
          console.log("Preguntas obtenidas:", response.data);
          if (response.data.length > 0) {
            console.log(response.data);
            console.log("Ya existen preguntas en este cuestionario");
            setEdicionDeshabilitada(true);
            // Auto-detect and set questionnaire type based on existing questions
            const detectedType = detectQuestionnaireType(response.data);
            setTipoCuestionario(detectedType);
          } else {
            console.log("no hay");
            setEdicionDeshabilitada(false);
          }
        })
        .catch((error) => {
          console.error("Error al obtener las preguntas con uid:", error);
        });
    }
  }, [id]);

  const handleTipoChange = (nuevo) => {
    if (preguntas.length > 0) {
      setNuevoTipo(nuevo);
      setPopupCambioTipo(true);
    } else {
      setTipoCuestionario(nuevo);
    }
  };

  const confirmarCambioTipo = () => {
    setTipoCuestionario(nuevoTipo);
    setPreguntas([]);
    setPopupCambioTipo(false);
  };

  const cancelarCambioTipo = () => {
    setPopupCambioTipo(false);
    setNuevoTipo("");
  };

  const addPregunta = () => {
    setPreguntas([
      ...preguntas,
      {
        texto: "",
        tipo: obtenerTipoDefault(tipoCuestionario),
        opciones: [],
        desbloqueo: [],
        seccion: "",
      },
    ]);
  };

  const insertPregunta = (index) => {
    const nuevas = [...preguntas];
    nuevas.splice(index, 0, {
      texto: "",
      tipo: obtenerTipoDefault(tipoCuestionario),
      opciones: [],
      desbloqueo: [],
      seccion: "",
    });
    setPreguntas(nuevas);
  };

  const updatePregunta = (index, updated) => {
    const nuevas = [...preguntas];
    nuevas[index] = updated;
    setPreguntas(nuevas);
  };

  const deletePregunta = (index) => {
    setPreguntaAEliminar(index);
  };

  const confirmarEliminarPregunta = () => {
    if (preguntaAEliminar !== null) {
      setPreguntas(preguntas.filter((_, i) => i !== preguntaAEliminar));
      setPreguntaAEliminar(null);
    }
  };

  const moveUp = (index) => {
    if (index > 0) {
      const nuevas = [...preguntas];
      [nuevas[index - 1], nuevas[index]] = [nuevas[index], nuevas[index - 1]];

      // Actualizar referencias en desbloqueos
      nuevas.forEach((pregunta, i) => {
        if (pregunta.desbloqueo?.length) {
          pregunta.desbloqueo = pregunta.desbloqueo.map((d) => {
            const nuevaPregunta = nuevas[d.pregunta_id];
            return {
              ...d,
              descripcion: `Pregunta ${d.pregunta_id + 1}: ${nuevaPregunta?.texto || ""
                }`,
            };
          });
        }
      });

      setPreguntas(nuevas);
    }
  };

  const moveDown = (index) => {
    if (index < preguntas.length - 1) {
      const nuevas = [...preguntas];
      [nuevas[index + 1], nuevas[index]] = [nuevas[index], nuevas[index + 1]];

      // Actualizar referencias en desbloqueos
      nuevas.forEach((pregunta, i) => {
        if (pregunta.desbloqueo?.length) {
          pregunta.desbloqueo = pregunta.desbloqueo.map((d) => {
            const nuevaPregunta = nuevas[d.pregunta_id];
            return {
              ...d,
              descripcion: `Pregunta ${d.pregunta_id + 1}: ${nuevaPregunta?.texto || ""
                }`,
            };
          });
        }
      });

      setPreguntas(nuevas);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (preguntas.length > 0) {
        e.preventDefault();
        e.returnValue = "Si sales perderás todo el progreso!!!!!"; // Necesario para mostrar el mensaje en algunos navegadores
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [preguntas]);

  const handleGuardar = async () => {
    console.log("⏳ Iniciando proceso de guardado...");
    console.log("Tipo de cuestionario actual:", tipoCuestionario);
    console.log("Preguntas actuales:", preguntas);
    console.log("📝 Mis preguntitas:", preguntas);

    // Guardar las referencias a las imágenes para subirlas después
    const imagenesPendientes = preguntas
      .filter(
        (p) => p.tipo === "imagen" && p.imagen && typeof p.imagen === "object"
      )
      .map((p) => ({ pregunta: p, imagen: p.imagen }));
    // Validación de secciones antes de guardar
    const seccionesInvalidas = preguntas.filter(
      (p) => !p.seccion || p.seccion.trim() === ""
    );
    if (seccionesInvalidas.length > 0) {
      alert(
        "Todas las preguntas deben tener una sección definida. Revisa las preguntas incompletas antes de guardar."
      );
      return;
    }

    // Procesar preguntas antes de enviar
    const preguntasFormateadas = preguntas.map((p) => {
      // Si es una pregunta binaria, asegurarse de que tenga las opciones correctas
      if (p.tipo === "binaria") {
        return {
          ...p,
          tipo: "multiple", // Cambiar a multiple para el backend
          opciones: ["Sí", "No"], // Enviar como strings simples
          desbloqueo: p.desbloqueo?.map((d) => ({
            ...d,
            valor: d.valor === "0" ? "Sí" : d.valor === "1" ? "No" : d.valor,
            // Limpiar información de pre-selección
            preguntaSeleccionadaDesbloqueo: undefined,
            opcionSeleccionadaDesbloqueo: undefined,
          })),
        };
      }

      // Si es una pregunta de campo de perfil, incluir la información del campo
      if (p.tipo.startsWith("profile_field")) {
        return {
          ...p,
          profile_field_path: p.profile_field_path,
          profile_field_config: p.profile_field_config,
          desbloqueo: p.desbloqueo?.map((d) => ({
            ...d,
            // Limpiar información de pre-selección
            preguntaSeleccionadaDesbloqueo: undefined,
            opcionSeleccionadaDesbloqueo: undefined,
          })),
        };
      }

      // Para otros tipos, limpiar información de pre-selección
      return {
        ...p,
        desbloqueo: p.desbloqueo?.map((d) => ({
          ...d,
          // Limpiar información de pre-selección
          preguntaSeleccionadaDesbloqueo: undefined,
          opcionSeleccionadaDesbloqueo: undefined,
        })),
      };
    });

    const data = {
      cuestionario_id: parseInt(idCuestionario, 10),
      preguntas: preguntasFormateadas,
    };

    console.log(
      "➡️ Enviando a:",
      "http://localhost:8000/api/cuestionarios/guardar-cuestionario/"
    );
    console.log("📤 Datos enviados:", JSON.stringify(data));

    try {
      const response = await api.post(
        "/api/cuestionarios/guardar-cuestionario/",
        data
      );

      console.log(
        "📡 Respuesta del servidor recibida. Status:",
        response.status
      );
      console.log("📥 Respuesta bruta recibida:", response);

      if (response.status !== 200 && response.status !== 201) {
        console.error("Error del servidor:", response.data);
        throw new Error(
          response.data?.detail || "Error al guardar el cuestionario"
        );
      }

      setMensajeConfirmacionGuardar("Cuestionario guardado correctamente.");

      // Ahora subir las imágenes después de que las preguntas tengan ID
      if (imagenesPendientes.length > 0) {
        console.log("📤 Subiendo imágenes pendientes...");

        // Obtener las preguntas actualizadas con sus IDs
        const preguntasActualizadas = await api.get(
          `/api/cuestionarios/${id}/preguntas/`
        );
        const preguntasConIds = preguntasActualizadas.data;

        for (const item of imagenesPendientes) {
          try {
            // Buscar la pregunta correspondiente por texto
            const preguntaConId = preguntasConIds.find(
              (p) => p.texto === item.pregunta.texto
            );

            if (preguntaConId) {
              const imagenData = new FormData();
              imagenData.append("imagen", item.imagen);

              await api.put(
                `/api/cuestionarios/subir-imagen-pregunta/${preguntaConId.id}/`,
                imagenData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                }
              );

              console.log(`✅ Imagen subida para pregunta ${preguntaConId.id}`);
            } else {
              console.warn(
                `⚠️ No se encontró la pregunta: ${item.pregunta.texto}`
              );
            }
          } catch (error) {
            console.error(
              `❌ Error subiendo imagen para pregunta: ${item.pregunta.texto}`,
              error
            );
            // No detener el proceso, solo mostrar warning
            alert(
              `Advertencia: No se pudo subir la imagen para la pregunta: ${item.pregunta.texto}`
            );
          }
        }
      }

      setDialogoExito(true);
    } catch (err) {
      console.log("❌ Error atrapado en catch:", err);
      console.error(err);
      alert(err.message || "Ocurrió un error al guardar.");
    }
    setIsLoading(false);
  };

  const agregarSeccionSiNoExiste = (nombre) => {
    if (nombre && !secciones.includes(nombre)) {
      setSecciones((prev) => [...prev, nombre]);
    }
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FaFileExcel />}
          onClick={() => setPopupPrecargaAbierto(true)}
          disabled={edicionDeshabilitada}
        >
          Precarga de cuestionario
        </Button>
      </div>
      <Typography variant="h4" align="center" style={{ flex: 1 }}>
        Editor de Cuestionario
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Tipo de Cuestionario</InputLabel>
        <Select
          value={tipoCuestionario}
          label="Tipo de Cuestionario"
          onChange={(e) => handleTipoChange(e.target.value)}
          disabled={edicionDeshabilitada}
        >
          <MenuItem value="Normal">Normal</MenuItem>
          <MenuItem value="SIS">SIS</MenuItem>
          <MenuItem value="Cuadro de Habilidades">
            Cuadro de Habilidades
          </MenuItem>
          <MenuItem value="Canalizacion">Canalización</MenuItem>
        </Select>
      </FormControl>

      {preguntas.map((pregunta, index) => (
        <PreguntaCard
          key={index}
          index={index}
          total={preguntas.length}
          pregunta={pregunta}
          preguntas={preguntas}
          updatePregunta={updatePregunta}
          deletePregunta={deletePregunta}
          moveUp={moveUp}
          moveDown={moveDown}
          insertBefore={(i) => insertPregunta(i)}
          insertAfter={(i) => insertPregunta(i + 1)}
          tiposPermitidos={tiposPermitidos}
          mostrarDesbloqueoDescripcion={true}
          mostrarDesbloqueoDropdown={true}
          deshabilitado={edicionDeshabilitada}
          secciones={secciones}
          agregarSeccionSiNoExiste={agregarSeccionSiNoExiste}
        />
      ))}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={addPregunta}
          disabled={edicionDeshabilitada}
        >
          Agregar Pregunta al Final
        </Button>
      </div>

      <PopupPrecargaCuestionario
        open={popupPrecargaAbierto}
        onClose={() => setPopupPrecargaAbierto(false)}
        onSubmit={(jsonSimulado) => {
          setPopupPrecargaAbierto(false);
          setPreguntas(jsonSimulado);
        }}
        archivo={archivoPrecarga}
        setArchivo={setArchivoPrecarga}
        tiposPregunta={TIPOS_COMPLETOS}
        tiposCuestionario={tiposPorCuestionario}
        tipoSeleccionado={tipoCuestionario}
        onTipoChange={handleTipoChange}
      />

      <Dialog open={popupCambioTipo} onClose={cancelarCambioTipo}>
        <DialogTitle>¿Cambiar tipo de cuestionario?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cambiar el tipo eliminará todas las preguntas actuales. ¿Deseas
            continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarCambioTipo}>Cancelar</Button>
          <Button onClick={confirmarCambioTipo} autoFocus color="error">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        variant="contained"
        color="success"
        onClick={() => setPopupConfirmacionGuardar(true)}
        disabled={edicionDeshabilitada}
      >
        Guardar Cuestionario
      </Button>

      <Dialog
        open={popupConfirmacionGuardar}
        onClose={() => setPopupConfirmacionGuardar(false)}
      >
        <DialogTitle>Confirmar publicación</DialogTitle>
        <DialogContent>
          <DialogContentText>{mensajeConfirmacionGuardar}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPopupConfirmacionGuardar(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setPopupConfirmacionGuardar(false);
              setIsLoading(true);
              handleGuardar();
            }}
            color="error"
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={preguntaAEliminar !== null}
        onClose={() => setPreguntaAEliminar(null)}
      >
        <DialogTitle>Eliminar pregunta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no
            se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreguntaAEliminar(null)}>Cancelar</Button>
          <Button onClick={confirmarEliminarPregunta} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogoExito}
        onClose={() => navigate(`/baseCuestionarios/${idBase}`)}
      >
        <DialogTitle>Éxito</DialogTitle>
        <DialogContent>
          <DialogContentText>{mensajeConfirmacionGuardar}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => navigate(`/baseCuestionarios/${idBase}`)}
            color="primary"
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <LoadingPopup open={isLoading} />
    </div>
  );
};

export default EditorCuestionario;
