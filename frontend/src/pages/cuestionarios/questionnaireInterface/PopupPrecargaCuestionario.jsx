import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Input,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import api from "../../../api";

const PopupPrecargaCuestionario = ({
  open,
  onClose,
  onSubmit,
  tiposCuestionario,
  tiposPregunta,
  tipoSeleccionado,
  onTipoChange,
}) => {
  const [csrfToken, setCsrfToken] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [openConfirmCancel, setOpenConfirmCancel] = useState(false);
  const [openConfirmSubmit, setOpenConfirmSubmit] = useState(false);
  const [preguntasPrecargadas, setPreguntasPrecargadas] = useState([]);
  const [erroresPrecarga, setErroresPrecarga] = useState([]);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Log preguntasPrecargadas JSON crudo al frontend cuando cambia
  useEffect(() => {
    if (preguntasPrecargadas?.length) {
      console.log(
        "🔢 Length de preguntasPrecargadas:",
        preguntasPrecargadas?.length
      );
      console.log("📊 Preguntas precargadas (frontend):", preguntasPrecargadas);
    }
  }, [preguntasPrecargadas]);

  useEffect(() => {
    const getCsrfToken = () => {
      const cookies = document.cookie.split("; ");
      for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "csrftoken") return value;
      }
      return "";
    };
    setCsrfToken(getCsrfToken());
  }, []);

  const handleMostrar = async () => {
    if (!archivo || !tipoSeleccionado) {
      setMessage({
        type: "error",
        text: "Debes seleccionar un archivo y un tipo de cuestionario.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("tipo_cuestionario", tipoSeleccionado);
    const tiposPermitidos =
      tiposCuestionario[tipoSeleccionado] || tiposPregunta || [];
    formData.append("tipos_permitidos", JSON.stringify(tiposPermitidos));

    try {
      const response = await api.post(
        "api/cuestionarios/precarga-cuestionario/",
        formData,
        {
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("📨 JSON recibido del backend (mostrar):", response.data);
      console.log(
        "📩 Respuesta recibida del backend (mostrar):",
        response.data
      );
      setMessage({ type: "success", text: "Archivo analizado con éxito." });
      setPreguntasPrecargadas(response.data);
      setErroresPrecarga(response.data.errores || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Error al analizar el archivo.",
      });
      setErroresPrecarga(error.response?.data?.errores || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!archivo || !tipoSeleccionado) {
      setMessage({
        type: "error",
        text: "Debes seleccionar un archivo y un tipo de cuestionario.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    if (preguntasPrecargadas.length === 0) {
      setMessage({
        type: "error",
        text: "Debes hacer clic en 'Mostrar' para analizar el archivo antes de precargar.",
      });
      setLoading(false);
      return;
    }

    setMessage({ type: "success", text: "Precarga exitosa." });
    onSubmit(preguntasPrecargadas);
    setErroresPrecarga([]);
    setLoading(false);
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await api.get(
        "/api/cuestionarios/descargar-plantilla/",
        {
          responseType: "blob",
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Plantilla_cuestionarios_precarga.xlsx");

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up the URL
      window.URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: "Plantilla descargada exitosamente.",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      setMessage({
        type: "error",
        text: "Error al descargar la plantilla. Por favor, intente nuevamente.",
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Precargar Cuestionario desde Excel</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body2" gutterBottom>
              Para precargar un cuestionario, primero descarga la plantilla de
              Excel y complétala con la información requerida.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              startIcon={
                downloadingTemplate ? <CircularProgress size={20} /> : null
              }
              sx={{ mb: 2 }}
            >
              {downloadingTemplate ? "Descargando..." : "Descargar Plantilla"}
            </Button>

            <Typography variant="body2" gutterBottom>
              Una vez completada la plantilla, selecciona el archivo Excel
              (.xlsx):
            </Typography>
            <Button variant="outlined" component="label" sx={{ mb: 1 }}>
              Escoger archivo
              <input
                type="file"
                name="file"
                accept=".xlsx"
                hidden
                onChange={(e) => setArchivo(e.target.files[0])}
              />
            </Button>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Tipo de cuestionario</InputLabel>
                <Select
                  value={tipoSeleccionado}
                  label="Tipo de cuestionario"
                  onChange={(e) => onTipoChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>-- Selecciona una opción --</em>
                  </MenuItem>
                  {Object.keys(tiposCuestionario).map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {archivo && (
              <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                Archivo seleccionado: {archivo.name}
              </Typography>
            )}
            {message.text && (
              <Typography
                variant="body1"
                color={
                  message.type === "success" ? "success.main" : "error.main"
                }
                mt={2}
              >
                {message.text}
              </Typography>
            )}
            {message.type === "success" && preguntasPrecargadas.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle1">Preguntas cargadas:</Typography>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "8px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        #
                      </th>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        Texto
                      </th>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        Sección
                      </th>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        Tipo
                      </th>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        Opciones
                      </th>
                      <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                        Desbloqueo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preguntasPrecargadas.map((pregunta, idx) => (
                      <tr key={idx}>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {pregunta.texto || "(sin texto)"}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {pregunta.seccion || "(sin sección)"}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {pregunta.tipo || "-"}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {pregunta.opciones && pregunta.opciones.length > 0
                            ? pregunta.opciones.join(", ")
                            : "-"}
                        </td>
                        <td
                          style={{ border: "1px solid #ccc", padding: "8px" }}
                        >
                          {Array.isArray(pregunta.desbloqueo) &&
                          pregunta.desbloqueo.length > 0
                            ? pregunta.desbloqueo
                                .map((d) => {
                                  console.log("🔍 d encontrado:", d);
                                  return `Pregunta ${d.pregunta_id + 1} - ${
                                    d.opcion
                                  }`;
                                })
                                .join(", ")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
          {erroresPrecarga.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle1" color="error" gutterBottom>
                Errores detectados en el archivo:
              </Typography>
              <ul>
                {erroresPrecarga.map((err, idx) => (
                  <li key={idx}>
                    <Typography variant="body2" color="error">
                      {err}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmCancel(true)}>Cancelar</Button>
          <Button
            onClick={handleMostrar}
            variant="outlined"
            color="secondary"
            disabled={loading}
          >
            Mostrar
          </Button>
          <Button
            onClick={() => setOpenConfirmSubmit(true)}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Cargando..." : "Precargar"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openConfirmCancel}
        onClose={() => setOpenConfirmCancel(false)}
      >
        <DialogTitle>¿Cancelar precarga?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas cancelar la precarga?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmCancel(false)}>Volver</Button>
          <Button
            onClick={() => {
              setOpenConfirmCancel(false);
              onClose();
            }}
            color="error"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openConfirmSubmit}
        onClose={() => setOpenConfirmSubmit(false)}
      >
        <DialogTitle>¿Precargar archivo?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Deseas precargar este archivo? ¡Cualquier pregunta que se haya
            creado, será eliminada!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmSubmit(false)}>Volver</Button>
          <Button
            onClick={() => {
              setOpenConfirmSubmit(false);
              handleSubmit();
            }}
            variant="contained"
            color="primary"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PopupPrecargaCuestionario;
