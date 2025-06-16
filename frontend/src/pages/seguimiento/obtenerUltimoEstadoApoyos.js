import axios from "../../api";

export const obtenerUltimoEstadoApoyos = async (usuarioId) => {
  try {
    const response = await axios.get(`/api/seguimiento/obtener-seguimiento-apoyos-actual/${usuarioId}/`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el estado actual de apoyos:", error);
    return {};
  }
};