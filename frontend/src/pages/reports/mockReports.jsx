  // EditorReporteConPDF.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Container, Grid, Typography, Button, Card, CardContent, Divider, Box, FormGroup,
  FormControlLabel, Checkbox, TextField, Select, MenuItem, InputLabel, Autocomplete
} from "@mui/material";
import axios from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import mockReportData from "./mockReportData";

const EditarReporteConPDF = () => {
  const [userData, setUserData] = useState(mockReportData);
  const [imageUrl, setImageUrl] = useState("");
  const [template, setTemplate] = useState("normal");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [secciones, setSecciones] = useState({
    perfil: true,
    perfil_nombre: true,
    perfil_edad: true,
    perfil_sexo: true,
    perfil_discapacidad: true,
    perfil_ciclo: true,
    perfil_domicilio: false,
    perfil_contacto: false,
    habilidades: true,
    timeline: true,
    consideraciones: true,
    sis: true,
    diagnostico: true,
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const pdfBlobRef = useRef(null);

  const handleUserIdSearch = () => {
    const usuarioId = searchText.trim();
    if (!usuarioId) return;
  
    console.log("Buscando usuario con ID:", usuarioId);
  
      Promise.all([
        axios.get(`/api/candidatos/profiles/${usuarioId}/`),
        axios.get(`/api/cuestionarios/usuario/respuestas-unlocked-path/?usuario_id=${usuarioId}`),
        axios.get(`/api/cuestionarios/resumen-sis/?usuario_id=${usuarioId}`)
      ])
      .then(([perfil, respuestas, resumenSis]) => {
        const sisData = resumenSis.data;
      
        const habilidadesAdaptativas = {};
        const proteccionYDefensa = [];
      
        for (const seccion of sisData) {
          habilidadesAdaptativas[seccion.nombre_seccion] = seccion.total_general;
      
          if (seccion.nombre_seccion === "Actividades de protección y defensa") {
            for (const item of (seccion.items || [])) {
              proteccionYDefensa.push({
                actividad: item.actividad || "-",
                frecuencia: item.frecuencia ?? "-",
                tiempo_apoyo: item.tiempo_apoyo ?? "-",
                tipo_apoyo: item.tipo_apoyo ?? "-",
                total: item.total ?? "-"
              });
            }
          }
        }
      
        const nuevoData = {
          user: perfil.data,
          respuestasDiagnostico: respuestas.data,
          habilidadesAdaptativas,
          sisProteccionDefensa: proteccionYDefensa,
          timeline: perfil.data.timeline || [],
          consideraciones: perfil.data.consideraciones || []
        };
      
        setUserData(nuevoData);
        console.log("🔹 Usuario:", perfil.data);
        console.log("🔹 Respuestas Diagnóstico:", respuestas.data);
        console.log("🔹 Habilidades Adaptativas:", habilidadesAdaptativas);
        console.log("🔹 Protección y Defensa:", proteccionYDefensa);
      })
      .catch((err) => {
        console.error("❌ Error al cargar datos del usuario:", err);
      });
    };

 



  const toggleSeccion = (key) => (e) => {
    setSecciones((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const generarPDF = async () => {
    const isLandscape = template === "cuadrantes";
    const doc = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    let y = 20;
  
    if (!userData || !userData.user) {
      console.warn("No hay datos cargados para generar el PDF.");
      return;
    }

    
  
    const perfil = userData.user;
    const discapacidad = userData.disability_name || perfil.discapacidad || "-";
    const ciclo = userData.cycle?.name || perfil.ciclo?.nombre || "-";
    const domicilioObj = userData.domicile || perfil.domicilio || {};
    const contactoEmergencia = Array.isArray(userData.emergency_contacts) ? userData.emergency_contacts[0] : (perfil.contacto_emergencia || {});
  
    const domicilio = perfil.domicile || {};
      const domicilioTexto = [
        domicilio.address_road,
        domicilio.address_number,
        domicilio.address_col,
        domicilio.address_PC ? `CP ${domicilio.address_PC}` : null,
        domicilio.address_municip,
        domicilio.address_city,
        domicilio.address_state
      ].filter(Boolean).join(", ") || "-";
  
    const contacto = [
      contactoEmergencia.nombre,
      contactoEmergencia.parentesco ? `(${contactoEmergencia.parentesco})` : null,
      contactoEmergencia.telefono ? `Tel: ${contactoEmergencia.telefono}` : null
    ].filter(Boolean).join(" ");
  
    if (template === "cuadrantes") {
      const docFontSize = 8;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const boxWidth = pageWidth / 2;
      const boxHeight = pageHeight / 2;
    
      const pastelColors = [
        [220, 235, 247], // Q1
        [232, 245, 233], // Q2
        [255, 249, 196], // Q3
        [252, 228, 236], // Q4
      ];
    
      const coords = [
        { x: 0, y: 0 },                // Q1
        { x: 0, y: boxHeight },        // Q2
        { x: boxWidth, y: 0 },         // Q3
        { x: boxWidth, y: boxHeight }  // Q4
      ];
    
      const sections = [];
    
      // Cuadrante 1: Datos personales
      const nombre = `${perfil.user?.first_name || ""} ${perfil.user?.last_name || ""} ${perfil.user?.second_last_name || ""}`.trim();
      const edad = perfil.birth_date ? `${new Date().getFullYear() - new Date(perfil.birth_date).getFullYear()}` : "-";
      const datosPersonales = [
        `Nombre: ${nombre}`,
        `CURP: ${perfil.curp || "-"}`,
        `Edad: ${edad}`,
        `Sexo: ${perfil.gender || "-"}`,
        `Teléfono: ${perfil.phone_number || "-"}`,
        `Correo: ${perfil.user?.email || "-"}`,
        `Discapacidad: ${userData.disability_name || "-"}`,
        `Etapa: ${perfil.stage || "-"}`,
        `Ciclo: ${userData.cycle?.name || "-"}`,
      ].join("\n");
      sections.push({ title: "Datos Personales", content: datosPersonales, color: pastelColors[0] });
    
      // Cuadrante 2: Entrevista (primeras 6 respuestas)
      const entrevista = userData.respuestasDiagnostico
        .filter((r) => r.cuestionario_nombre?.toUpperCase() === "ENTREVISTA")
        .slice(0, 6)
        .map((r) => `• ${r.pregunta_texto}\n  ${r.respuesta || "-"}`)
        .join("\n\n");
      sections.push({ title: "Entrevista", content: entrevista, color: pastelColors[1] });
    
      // Cuadrante 3: PV (una meta + 2 preguntas)
      const pv = userData.respuestasDiagnostico
        .filter((r) => r.cuestionario_nombre?.toUpperCase() === "PV")
        .slice(0, 3)
        .map((r) => `• ${r.pregunta_texto}\n  ${r.respuesta || "-"}`)
        .join("\n\n");
      sections.push({ title: "Proyecto de Vida", content: pv, color: pastelColors[2] });
    
      // Cuadrante 4: Resumen SIS
      const resumenSis = Object.entries(userData.habilidadesAdaptativas || {}).map(
        ([seccion, score]) => `${seccion}: ${score}`
      ).join("\n");
      sections.push({ title: "Resumen SIS", content: resumenSis, color: pastelColors[3] });
    
      // Render de cuadrantes
      doc.setFontSize(docFontSize);
      sections.forEach(({ title, content, color }, i) => {
        const { x, y } = coords[i];
        doc.setFillColor(...color);
        doc.rect(x, y, boxWidth, boxHeight, "F");
        doc.setTextColor(40, 40, 80);
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.text(title, x + 6, y + 8);
        doc.setFont(undefined, "normal");
        doc.setFontSize(docFontSize);
        const textLines = doc.splitTextToSize(content, boxWidth - 12);
        doc.text(textLines, x + 6, y + 14);
      });
    
      if (imageUrl) {
        try {
          const image = await loadImage(imageUrl);
          doc.addImage(image, "JPEG", pageWidth / 2 - 15, pageHeight / 2 - 15, 30, 30);
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(200, 0, 0);
          doc.text("Error al cargar imagen.", pageWidth / 2 - 20, pageHeight / 2);
        }
      }
    } else {
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 120);
      doc.text("Reporte Personalizado", 15, y);
      y += 10;
  
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
  
      if (secciones.perfil) {
        doc.addPage();  // Asegura espacio completo para el perfil
        y = 20;
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 120);
        doc.text("Perfil del Usuario", 15, y);
        doc.setFontSize(11);
        y += 6;
      
        const perfilData = [
          ["Nombre", `${perfil.user?.first_name || ""} ${perfil.user?.last_name || ""} ${perfil.user?.second_last_name || ""}`.trim()],
          ["CURP", perfil.curp || "-"],
          ["Fecha de nacimiento", perfil.birth_date || "-"],
          ["Edad", perfil.birth_date ? `${new Date().getFullYear() - new Date(perfil.birth_date).getFullYear()}` : "-"],
          ["Sexo", perfil.gender || "-"],
          ["Correo", perfil.user?.email || "-"],
          ["Teléfono", perfil.phone_number || "-"],
          ["Discapacidad", userData.disability_name || "-"],
          ["Certificado de discapacidad", perfil.has_disability_certificate ? "Sí" : "No"],
          ["Juicio de interdicción", perfil.has_interdiction_judgment ? "Sí" : "No"],
          ["Etapa del proceso", perfil.stage || "-"],
          ["Ciclo", userData.cycle?.name || "-"],
          ["Fecha de registro", perfil.registration_date || "-"],
          ["Atención psicológica", perfil.receives_psychological_care ? "Sí" : "No"],
          ["Atención psiquiátrica", perfil.receives_psychiatric_care ? "Sí" : "No"],
          ["Convulsiones", perfil.has_seizures ? "Sí" : "No"],
          ["Alergias", perfil.allergies || "Ninguna"],
          ["Restricciones alimenticias", perfil.dietary_restrictions || "Ninguna"],
          ["Tipo de sangre", perfil.blood_type || "No especificado"],
          ["Pensión", perfil.receives_pension ? "Sí" : "No"],
          ["Domicilio", domicilioTexto],
        ];
      
        if (Array.isArray(userData.emergency_contacts) && userData.emergency_contacts.length > 0) {
          const contacto = userData.emergency_contacts[0];
          const nombreContacto = `${contacto.first_name || ""} ${contacto.last_name || ""} ${contacto.second_last_name || ""}`.trim();
          perfilData.push(["Contacto de emergencia", nombreContacto]);
          perfilData.push(["Parentesco", contacto.relationship || "-"]);
          perfilData.push(["Teléfono del contacto", contacto.phone_number || "-"]);
        }
      
        const perfilTable = [];
        for (let i = 0; i < perfilData.length; i += 2) {
          const col1 = perfilData[i] || ["", ""];
          const col2 = perfilData[i + 1] || ["", ""];
          perfilTable.push([
            { content: col1[0], styles: { fontStyle: 'bold' } },
            col1[1],
            { content: col2[0], styles: { fontStyle: 'bold' } },
            col2[1],
          ]);
        }
      
        autoTable(doc, {
          startY: y,
          head: [["Campo", "Valor", "Campo", "Valor"]],
          body: perfilTable,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [220, 220, 255] },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 55 },
            2: { cellWidth: 35 },
            3: { cellWidth: 55 },
          },
        });
      }
  
      if (secciones.habilidades && userData.habilidadesAdaptativas) {
        doc.addPage();
        y = 20;
        doc.text("Habilidades Adaptativas", 15, y);
        autoTable(doc, {
          startY: y + 6,
          head: [Object.keys(userData.habilidadesAdaptativas)],
          body: [Object.values(userData.habilidadesAdaptativas)],
          styles: { fontSize: 10, halign: "center" },
          headStyles: { fillColor: [220, 220, 255] },
        });
      }
  
      if (secciones.sis && Array.isArray(userData.sisProteccionDefensa)) {
        doc.addPage();
        y = 20;
        doc.text("Protección y Defensa (SIS)", 15, y);
        autoTable(doc, {
          startY: y + 6,
          head: [["Actividad", "Frecuencia", "Tiempo Apoyo", "Tipo Apoyo", "Total"]],
          body: userData.sisProteccionDefensa.map(item => [
            item.actividad,
            item.frecuencia,
            item.tiempo_apoyo,
            item.tipo_apoyo,
            item.total
          ]),
          styles: { fontSize: 10 },
        });
      }
  
      if (secciones.diagnostico && Array.isArray(userData.respuestasDiagnostico)) {
        const respuestasPorCuestionario = {};
      
        // Agrupar respuestas por nombre del cuestionario
        userData.respuestasDiagnostico.forEach((r) => {
          const nombre = r.cuestionario_nombre || "Otro";
          if (!respuestasPorCuestionario[nombre]) {
            respuestasPorCuestionario[nombre] = [];
          }
          respuestasPorCuestionario[nombre].push({
            pregunta: r.pregunta_texto,
            respuesta: r.respuesta || "-",
          });
        });
      
        Object.entries(respuestasPorCuestionario).forEach(([nombreCuestionario, preguntas]) => {
          doc.addPage();
          const yStart = 20;
      
          doc.setFontSize(14);
          doc.setTextColor(40, 40, 120);
          doc.text(nombreCuestionario.toUpperCase(), 15, yStart);
      
          const tableBody = preguntas.map(({ pregunta, respuesta }) => {
            const preguntaTexto = doc.splitTextToSize(pregunta, 80);
            const respuestaTexto = doc.splitTextToSize(respuesta, 100);
            return [preguntaTexto, respuestaTexto];
          });
      
          autoTable(doc, {
            startY: yStart + 8,
            head: [["Pregunta", "Respuesta"]],
            body: tableBody,
            styles: {
              fontSize: 10,
              cellPadding: 3,
              valign: "top",
            },
            headStyles: {
              fillColor: [220, 220, 255],
              textColor: 20,
              halign: "center",
            },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 100 },
            },
          });
        });
      }
  
      if (secciones.consideraciones && Array.isArray(userData.consideraciones)) {
        doc.addPage();
        y = 20;
        doc.text("Consideraciones Finales", 15, y);
        userData.consideraciones.forEach((linea) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`• ${linea}`, 15, y += 6);
        });
      }
    }
  
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    pdfBlobRef.current = blob;
    setPdfUrl(url);
  };
  
  
  const descargarPDF = () => {
    if (pdfBlobRef.current) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlobRef.current);
      link.download = "reporte_personalizado.pdf";
      link.click();
    }
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  useEffect(() => {
    generarPDF();
  }, [secciones, imageUrl, template, userData]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Editor de Reporte Personalizado</Typography>
      <Box sx={{ mb: 4 }}>
            <TextField
                label="ID del Usuario"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === "Enter") handleUserIdSearch();
                }}
                fullWidth
                sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleUserIdSearch}>
                Buscar por ID
            </Button>
        </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6">Opciones del Reporte</Typography>
              <Divider sx={{ mb: 2 }} />
              <InputLabel id="template-label">Plantilla</InputLabel>
              <Select
                labelId="template-label"
                fullWidth
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="cuadrantes">Cuadrantes</MenuItem>
              </Select>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={secciones.perfil} onChange={toggleSeccion("perfil")} />} label="Perfil del Usuario" />
                {secciones.perfil && (
                  <Box sx={{ pl: 2 }}>
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_nombre} onChange={toggleSeccion("perfil_nombre")} />} label="Nombre" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_edad} onChange={toggleSeccion("perfil_edad")} />} label="Edad" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_sexo} onChange={toggleSeccion("perfil_sexo")} />} label="Sexo" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_discapacidad} onChange={toggleSeccion("perfil_discapacidad")} />} label="Discapacidad" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_ciclo} onChange={toggleSeccion("perfil_ciclo")} />} label="Ciclo" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_domicilio} onChange={toggleSeccion("perfil_domicilio")} />} label="Domicilio" />
                    <FormControlLabel control={<Checkbox checked={secciones.perfil_contacto} onChange={toggleSeccion("perfil_contacto")} />} label="Contacto de emergencia" />
                  </Box>
                )}
                <FormControlLabel control={<Checkbox checked={secciones.timeline} onChange={toggleSeccion("timeline")} />} label="Cronología" />
                <FormControlLabel control={<Checkbox checked={secciones.habilidades} onChange={toggleSeccion("habilidades")} />} label="Habilidades Adaptativas" />
                <FormControlLabel control={<Checkbox checked={secciones.sis} onChange={toggleSeccion("sis")} />} label="Protección y Defensa (SIS)" />
                <FormControlLabel control={<Checkbox checked={secciones.diagnostico} onChange={toggleSeccion("diagnostico")} />} label="Evaluación Diagnóstica" />
                <FormControlLabel control={<Checkbox checked={secciones.consideraciones} onChange={toggleSeccion("consideraciones")} />} label="Consideraciones Finales" />
              </FormGroup>
              <TextField
                fullWidth
                label="URL de imagen (foto del usuario)"
                variant="outlined"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} onClick={descargarPDF}>
                Descargar PDF
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6">Vista Previa del PDF</Typography>
              <Divider sx={{ mb: 2 }} />
              {pdfUrl && (
                <iframe
                  title="preview"
                  src={pdfUrl}
                  width="100%"
                  height="700px"
                  style={{ border: "1px solid #ccc" }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EditarReporteConPDF;