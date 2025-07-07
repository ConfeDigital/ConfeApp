import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { PdfMakeWrapper, Txt, Table } from "pdfmake-wrapper";

PdfMakeWrapper.setFonts(pdfFonts);

export const generarReporteApoyos = async (apoyos, candidate) => {
  const pdf = new PdfMakeWrapper();

  const nombreCompleto = candidate
    ? `${candidate.first_name} ${candidate.last_name} ${candidate.second_last_name || ""}`
    : "Usuario";

  // Título principal
  pdf.add([
    new Txt("PLAN PERSONALIZADO DE APOYO")
      .bold()
      .fontSize(16)
      .alignment("center")
      .margin([0, 0, 0, 5])
      .end,
    new Txt(nombreCompleto)
      .italics()
      .fontSize(12)
      .alignment("center")
      .margin([0, 0, 0, 10])
      .end,
  ]);

  // Línea divisoria azul
  pdf.add({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 520,
        y2: 0,
        lineWidth: 2,
        lineColor: "#062d55",
      },
    ],
    margin: [0, 0, 0, 10],
  });

  if (!apoyos || apoyos.length === 0) {
    pdf.add(
      new Txt("No se registran apoyos para este usuario.")
        .italics()
        .fontSize(11)
        .margin([0, 10, 0, 0])
        .end
    );
  } else {
    // Agrupamiento por fuente y luego sección
    const grouped = {};

    for (const apoyo of apoyos) {
      const fuente = apoyo.fuente || "Otro";
      const seccion = apoyo.seccion || "Sin sección";

      if (!grouped[fuente]) grouped[fuente] = {};
      if (!grouped[fuente][seccion]) grouped[fuente][seccion] = [];

      grouped[fuente][seccion].push(apoyo);
    }

    for (const [fuente, secciones] of Object.entries(grouped)) {
      pdf.add(
        new Txt(fuente)
          .bold()
          .fontSize(14)
          .color("#062d55")
          .margin([0, 16, 0, 6])
          .end
      );

      for (const [seccion, registros] of Object.entries(secciones)) {
        pdf.add(
          new Txt(seccion)
            .bold()
            .fontSize(13)
            .color("#062d55")
            .margin([0, 8, 0, 4])
            .end
        );

        for (const reg of registros) {
          const estadoTexto = {
            funciono: "Le funcionó",
            no_funciono: "No le funcionó",
            intentando: "En proceso",
          }[reg.is_successful] || "Sin especificar";

          const tabla = new Table([
            ["Actividad", reg.item],
            ["Apoyo", reg.subitem],
            ["Activo", reg.is_active ? "Sí" : "No"],
            ["Resultado del uso del apoyo", estadoTexto],
            ["Comentario", reg.comments || "-"],
          ])
            .layout("lightHorizontalLines")
            .widths(["30%", "70%"])
            .fontSize(10)
            .margin([0, 4, 0, 12])
            .end;

          pdf.add(tabla);
        }
      }
    }
  }

  pdf.footer((currentPage, pageCount) => {
    return new Txt(`Página ${currentPage} de ${pageCount}`)
      .alignment("right")
      .fontSize(8)
      .margin([0, 0, 10, 10])
      .end;
  });

  return pdf.create().open();
};