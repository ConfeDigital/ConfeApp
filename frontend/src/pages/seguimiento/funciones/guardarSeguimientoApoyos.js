import axios from "../../../api";

export const guardarCambioDeAyuda = async ({
  usuarioId,
  ayudaId,
  seccion,
  item,
  subitem,
  resultado,
  comentario,
  activo,
}) => {
  try {
    const payload = {
      candidate: usuarioId,
      aid_id: ayudaId,
      is_active: activo,
      is_successful: resultado === "funciono" ? true : resultado === "no_funciono" ? false : null,
      comments: comentario || "",
      seccion,
      item,
      subitem,
    };

    console.log("📤 Enviando POST individual de ayuda:", payload);

    const res = await axios.post("/api/candidatos/seguimiento/sis-aid/", payload);
    console.log("✅ POST exitoso:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error al guardar cambio de ayuda:", err);
    throw err;
  }
};