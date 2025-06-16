import axios from "../../api";

export const obtenerUltimoSeguimientoProyectoVida = async (usuarioId) => {
  try {
    const res = await axios.get(`/api/seguimiento/obtener-seguimiento-proyecto-vida-ultimo/${usuarioId}/`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener último seguimiento de proyecto de vida:", err);
    return null;
  }
};