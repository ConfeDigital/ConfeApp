import axios from "../../api";

const normalizarClave = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const guardarSeguimientoApoyos = async ({
  usuarioId,
  secciones,
  estadoPorAyuda,
}) => {
  console.log("🧪 Datos recibidos en guardarSeguimientoApoyos:", {
    usuarioId,
    secciones,
    estadoPorAyuda,
  });
  
  try {
    console.log("📤 Enviando guardado:", JSON.stringify({
      usuarioId,
      secciones,
      estado_por_ayuda: estadoPorAyuda,
    }, null, 2));

    const res = await axios.post("/api/seguimiento/guardar-seguimiento-apoyos/", {
      usuario_id: usuarioId,
      secciones,
      estado_por_ayuda: estadoPorAyuda,
    });
    return res.data;
  } catch (err) {
    console.error("Error al guardar seguimiento de apoyos:", err);
    throw err;
  }
};