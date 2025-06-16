import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Typography,
} from "@mui/material";
import { UploadFile, Edit, Delete } from "@mui/icons-material";
import * as XLSX from "xlsx";
import api from "../../api";

const CargaMasivaIndiceApoyo = ({ cuestionarioId, onSuccess }) => {
  const [filas, setFilas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    total_suma_estandar: "",
    indice_de_necesidades_de_apoyo: "",
    percentil: "",
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (cuestionarioId) obtenerFilas();
  }, [cuestionarioId]);

  const showError = (msg) => {
    setErrorMessage(msg);
    setOpenSnackbar(true);
  };

  const obtenerFilas = () => {
    api
      .get(
        `/api/tablas-de-equivalencia/indice-apoyo/?cuestionario_id=${cuestionarioId}`
      )
      .then((res) =>
        setFilas(
          res.data.sort((a, b) => a.total_suma_estandar - b.total_suma_estandar)
        )
      )
      .catch(() => showError("Error al cargar los datos"));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const valores = rows.map((row) => ({
          total_suma_estandar: Number(row.total_suma_estandar),
          indice_de_necesidades_de_apoyo: Number(
            row.indice_de_necesidades_de_apoyo
          ),
          percentil: row.percentil.toString(),
        }));

        api
          .post("/api/tablas-de-equivalencia/indice-apoyo/carga-masiva/", {
            cuestionario_id: cuestionarioId,
            valores,
          })
          .then(() => {
            obtenerFilas();
            if (onSuccess) onSuccess();
          })
          .catch(() => showError("Error al subir los datos."));
      } catch (err) {
        console.error(err);
        showError("Error al procesar el archivo.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleChange = (e) => {
    setNuevoRegistro({ ...nuevoRegistro, [e.target.name]: e.target.value });
  };

  const handleGuardar = () => {
    if (
      nuevoRegistro.total_suma_estandar === "" ||
      nuevoRegistro.indice_de_necesidades_de_apoyo === "" ||
      nuevoRegistro.percentil === ""
    ) {
      showError("Todos los campos son obligatorios");
      return;
    }

    if (editandoId) {
      // Modo edición
      api
        .put(
          `/api/tablas-de-equivalencia/indice-apoyo/${editandoId}/`,
          nuevoRegistro
        )
        .then(() => {
          setEditandoId(null);
          setNuevoRegistro({
            total_suma_estandar: "",
            indice_de_necesidades_de_apoyo: "",
            percentil: "",
          });
          obtenerFilas();
        })
        .catch(() => showError("Error al actualizar el registro"));
    } else {
      // Modo creación
      api
        .post("/api/tablas-de-equivalencia/indice-apoyo/carga-masiva/", {
          cuestionario_id: cuestionarioId,
          valores: [nuevoRegistro],
        })
        .then(() => {
          setNuevoRegistro({
            total_suma_estandar: "",
            indice_de_necesidades_de_apoyo: "",
            percentil: "",
          });
          obtenerFilas();
        })
        .catch(() => showError("Error al guardar el nuevo registro"));
    }
  };

  const handleEditar = (fila) => {
    setEditandoId(fila.id);
    setNuevoRegistro({
      total_suma_estandar: fila.total_suma_estandar,
      indice_de_necesidades_de_apoyo: fila.indice_de_necesidades_de_apoyo,
      percentil: fila.percentil,
    });
  };

  const handleEliminar = (id) => {
    if (!id) {
      showError("ID no definido para eliminar");
      return;
    }

    api
      .delete(`/api/tablas-de-equivalencia/indice-apoyo/${id}/`)
      .then(() => obtenerFilas())
      .catch(() => showError("Error al eliminar la fila."));
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setNuevoRegistro({
      total_suma_estandar: "",
      indice_de_necesidades_de_apoyo: "",
      percentil: "",
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Índice de Apoyo
      </Typography>

      <input
        type="file"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        id="upload-indice-apoyo"
        onChange={handleFileUpload}
      />
      <label htmlFor="upload-indice-apoyo">
        <Button
          variant="contained"
          component="span"
          startIcon={<UploadFile />}
          sx={{ my: 2 }}
        >
          Cargar desde Excel
        </Button>
      </label>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Total estándar</strong>
            </TableCell>
            <TableCell>
              <strong>Índice compuesto</strong>
            </TableCell>
            <TableCell>
              <strong>Percentil</strong>
            </TableCell>
            <TableCell>
              <strong>Acciones</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.id}>
              <TableCell>{fila.total_suma_estandar}</TableCell>
              <TableCell>{fila.indice_de_necesidades_de_apoyo}</TableCell>
              <TableCell>{fila.percentil}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleEditar(fila)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleEliminar(fila.id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}

          {/* Fila para agregar/editar */}
          <TableRow>
            <TableCell>
              <TextField
                name="total_suma_estandar"
                value={nuevoRegistro.total_suma_estandar}
                onChange={handleChange}
                type="number"
                size="small"
                fullWidth
              />
            </TableCell>
            <TableCell>
              <TextField
                name="indice_de_necesidades_de_apoyo"
                value={nuevoRegistro.indice_de_necesidades_de_apoyo}
                onChange={handleChange}
                type="number"
                size="small"
                fullWidth
              />
            </TableCell>
            <TableCell>
              <TextField
                name="percentil"
                value={nuevoRegistro.percentil}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </TableCell>
            <TableCell>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGuardar}
                sx={{ mr: 1 }}
              >
                {editandoId ? "Actualizar" : "Agregar"}
              </Button>
              {editandoId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancelar}
                >
                  Cancelar
                </Button>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CargaMasivaIndiceApoyo;
