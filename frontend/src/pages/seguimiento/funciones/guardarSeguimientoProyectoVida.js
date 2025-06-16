import axios from "../../../api";

export const guardarSeguimientoProyectoVida = async ({ usuarioId, metas, comentarios = "" }) => {
  try {
    const res = await axios.post("/api/seguimiento/guardar-seguimiento-proyecto-vida/", {
      usuario_id: usuarioId,
      metas,
      comentarios,
    });
    return res.data;
  } catch (err) {
    console.error("Error al guardar seguimiento de proyecto de vida:", err);
    throw err;
  }
};