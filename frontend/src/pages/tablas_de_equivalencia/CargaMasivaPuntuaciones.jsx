import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete, Edit, UploadFile } from "@mui/icons-material";
import * as XLSX from "xlsx";
import api from "../../api";

const CargaMasivaPuntuaciones = ({ open, onClose, seccionId }) => {
  const [puntuaciones, setPuntuaciones] = useState([]);
  const [newPuntuacion, setNewPuntuacion] = useState({
    puntuacion_directa: "",
    puntuacion_estandar: "",
    percentil: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  console.log(seccionId);

  useEffect(() => {
    if (open && seccionId) {
      obtenerPuntuaciones();
    }
  }, [open, seccionId]);

  const obtenerPuntuaciones = () => {
    api
      .get(`/api/tablas-de-equivalencia/secciones/${seccionId}/puntuaciones/`)
      .then((res) => {
        setPuntuaciones(res.data);
      })
      .catch((err) => console.error("Error al obtener puntuaciones:", err));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const newEntries = parsedData.slice(1).map((row) => ({
        puntuacion_directa: row[0]?.toString() || "",
        puntuacion_estandar: Number(row[1]) || 0,
        percentil: row[2]?.toString() || "",
      }));

      setPuntuaciones([...puntuaciones, ...newEntries]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleChange = (event) => {
    setNewPuntuacion({
      ...newPuntuacion,
      [event.target.name]: event.target.value,
    });
  };

  const handleAdd = () => {
    if (
      !newPuntuacion.puntuacion_directa ||
      !newPuntuacion.puntuacion_estandar ||
      !newPuntuacion.percentil
    ) {
      setErrorMessage("Todos los campos son obligatorios");
      setOpenSnackbar(true);
      return;
    }

    if (editingIndex !== null) {
      const updatedPuntuaciones = [...puntuaciones];
      updatedPuntuaciones[editingIndex] = newPuntuacion;
      setPuntuaciones(updatedPuntuaciones);
      setEditingIndex(null);
    } else {
      setPuntuaciones([...puntuaciones, newPuntuacion]);
    }

    setNewPuntuacion({
      puntuacion_directa: "",
      puntuacion_estandar: "",
      percentil: "",
    });
  };

  const handleEdit = (index) => {
    setNewPuntuacion(puntuaciones[index]);
    setEditingIndex(index);
  };

  const handleDelete = (puntuacionId) => {
    api
      .delete(
        `/api/tablas-de-equivalencia/puntuaciones/${puntuacionId}/delete/`
      )
      .then(() => {
        setPuntuaciones(puntuaciones.filter((p) => p.id !== puntuacionId));
      })
      .catch((err) => {
        console.error("Error al eliminar la puntuación:", err);
        setErrorMessage("No se pudo eliminar la puntuación");
        setOpenSnackbar(true);
      });
  };

  const handleSubmit = () => {
    if (puntuaciones.length === 0) {
      onClose();
      return;
    }

    api
      .post(
        `/api/tablas-de-equivalencia/secciones/${seccionId}/puntuaciones/`,
        {
          seccion_id: seccionId, // ✅ Explicitly send the seccion_id
          puntuaciones, // ✅ Ensure it's included
        }
      )
      .then(() => {
        obtenerPuntuaciones();
        onClose();
      })
      .catch((err) => {
        console.error("Error Response:", err.response?.data);
        setErrorMessage("Error al guardar las puntuaciones");
        setOpenSnackbar(true);
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Carga de Puntuaciones y Percentiles</DialogTitle>
      <DialogContent>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          style={{ display: "none" }}
          id="upload-file"
        />
        <label htmlFor="upload-file">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadFile />}
          >
            Cargar desde Excel
          </Button>
        </label>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Puntuación Directa</TableCell>
              <TableCell>Puntuación Estándar</TableCell>
              <TableCell>Percentil</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {puntuaciones
              .sort(
                (a, b) =>
                  Number(a.puntuacion_estandar) - Number(b.puntuacion_estandar)
              )
              .map((p, index) => (
                <TableRow key={p.id || `temp-${index}`}>
                  {" "}
                  {/* ✅ Unique key */}
                  <TableCell>{p.puntuacion_directa}</TableCell>
                  <TableCell>{p.puntuacion_estandar}</TableCell>
                  <TableCell>{p.percentil}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(index)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(p.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <TextField
          label="Puntuación Directa"
          name="puntuacion_directa"
          value={newPuntuacion.puntuacion_directa}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Puntuación Estándar"
          name="puntuacion_estandar"
          type="number"
          value={newPuntuacion.puntuacion_estandar}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Percentil"
          name="percentil"
          value={newPuntuacion.percentil}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <Button onClick={handleAdd} variant="contained" sx={{ marginTop: 2 }}>
          {editingIndex !== null ? "Actualizar" : "Agregar"}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CargaMasivaPuntuaciones;
