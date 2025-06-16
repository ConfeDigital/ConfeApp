import axios from "../../api";

export const obtenerUltimoSeguimientoApoyos = async (usuarioId) => {
  try {
    const res = await axios.get(`/api/obtener-seguimiento-apoyos-ultimo/${usuarioId}/`);
    return res.data;
  } catch (err) {
    console.error("Error al obtener último seguimiento de apoyos:", err);
    return [];
  }
};