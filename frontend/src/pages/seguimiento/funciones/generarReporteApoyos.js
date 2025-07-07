import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

// Register a font if you need custom fonts.
// For simplicity, we'll use a basic font or rely on the default.
// If you need specific fonts (like Roboto), you would typically
// import their .ttf files and register them like this:
// Font.register({
//   family: 'Roboto',
//   fonts: [
//     { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
//     { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Bold.ttf', fontWeight: 'bold' },
//     { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf', fontStyle: 'italic' },
//   ],
// });

// Create styles for your PDF document
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: 'Helvetica', // Default font, can be changed if you register others
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  line: {
    borderBottomColor: '#062d55',
    borderBottomWidth: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#062d55',
    marginTop: 16,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  subSectionTitle: {
    fontSize: 13,
    color: '#062d55',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 10,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    minHeight: 24, // Ensure rows have a minimum height
  },
  tableColHeader: {
    width: '30%',
    backgroundColor: '#f0f0f0', // Light background for header
    padding: 4,
    fontSize: 10,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  tableColValue: {
    width: '70%',
    padding: 4,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 35,
    textAlign: 'right',
    fontSize: 8,
    color: 'grey',
  },
});

// Helper component to render a "table" row
const TableRow = ({ label, value }) => (
  <View style={styles.tableRow}>
    <Text style={styles.tableColHeader}>{label}</Text>
    <Text style={styles.tableColValue}>{value}</Text>
  </View>
);

export const generarReporteApoyos = async (apoyos, candidate) => {
  const nombreCompleto = candidate
    ? `${candidate.first_name} ${candidate.last_name} ${candidate.second_last_name || ""}`
    : "Usuario";

  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>PLAN PERSONALIZADO DE APOYO</Text>
        <Text style={styles.subtitle}>{nombreCompleto}</Text>

        {/* Blue Divider Line */}
        <View style={styles.line} />

        {/* Content based on apoyos */}
        {(!apoyos || apoyos.length === 0) ? (
          <Text style={styles.noDataText}>No se registran apoyos para este usuario.</Text>
        ) : (
          (() => {
            const grouped = {};
            for (const apoyo of apoyos) {
              const fuente = apoyo.fuente || "Otro";
              const seccion = apoyo.seccion || "Sin sección";
              if (!grouped[fuente]) grouped[fuente] = {};
              if (!grouped[fuente][seccion]) grouped[fuente][seccion] = [];
              grouped[fuente][seccion].push(apoyo);
            }

            return Object.entries(grouped).map(([fuente, secciones]) => (
              <View key={fuente}>
                <Text style={styles.sectionTitle}>{fuente}</Text>
                {Object.entries(secciones).map(([seccion, registros]) => (
                  <View key={`${fuente}-${seccion}`}>
                    <Text style={styles.subSectionTitle}>{seccion}</Text>
                    {registros.map((reg, index) => {
                      const estadoTexto = {
                        funciono: "Le funcionó",
                        no_funciono: "No le funcionó",
                        intentando: "En proceso",
                      }[reg.is_successful] || "Sin especificar";

                      return (
                        <View key={`${fuente}-${seccion}-reg-${index}`} style={styles.table}>
                          <TableRow label="Actividad" value={reg.item} />
                          <TableRow label="Apoyo" value={reg.subitem} />
                          <TableRow label="Activo" value={reg.is_active ? "Sí" : "No"} />
                          <TableRow label="Resultado del uso del apoyo" value={estadoTexto} />
                          <TableRow label="Comentario" value={reg.comments || "-"} />
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ));
          })()
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );

  // To open the PDF in a new tab, we convert the Document to a Blob
  const blob = await pdf(MyDocument).toBlob();
  window.open(URL.createObjectURL(blob));
};
