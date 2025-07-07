import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// Estilos del documento PDF
const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 5,
    fontWeight: "bold",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    backgroundColor: "#2196f3",
    padding: 4,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    padding: 4,
  },
  tableCellHeader: {
    color: "#fff",
    textAlign: "center",
    fontSize: 10,
  },
  tableCell: {
    textAlign: "left",
    fontSize: 9,
  },
  footer: {
    fontSize: 8,
    textAlign: "right",
    marginTop: 10,
  },
});

// Componente PDF principal
const MyDocument = ({ secciones, activoPorSubitem, resultados, profile }) => {
  const fullName = `${profile?.user?.first_name || ""} ${profile?.user?.last_name || ""} ${profile?.user?.second_last_name || ""}`;
  const curp = profile?.curp || "N/A";
  const phone = profile?.phone_number || "N/A";
  const birthDate = profile?.birth_date
    ? new Date(profile.birth_date).toLocaleDateString()
    : "N/A";
  const gender = profile?.gender || "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>PLAN PERSONALIZADO DE APOYOS</Text>

        {/* ✅ Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del usuario</Text>
          <Text>Nombre completo: {fullName}</Text>
          <Text>CURP: {curp}</Text>
          <Text>Teléfono: {phone}</Text>
          <Text>Fecha de nacimiento: {birthDate}</Text>
          <Text>Género: {gender}</Text>
        </View>

        {/* ✅ Contenido de secciones */}
        {secciones.map((seccion, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sección: {seccion.nombre_seccion}
            </Text>
            {seccion.items.map((item, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={styles.table}>
                  {/* Encabezado tabla */}
                  <View style={styles.tableRow}>
                    <View style={styles.tableColHeader}>
                      <Text style={styles.tableCellHeader}>Subitem</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                      <Text style={styles.tableCellHeader}>Ayuda activa</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                      <Text style={styles.tableCellHeader}>Resultado</Text>
                    </View>
                    <View style={styles.tableColHeader}>
                      <Text style={styles.tableCellHeader}>Comentario</Text>
                    </View>
                  </View>

                  {/* Filas de datos */}
                  {item.subitems.map((sub, j) => {
                    const subitemKey = `${item.item}_${sub.sub_item}`;
                    const ayudaActivaId = activoPorSubitem[subitemKey];
                    const ayudaActiva = sub.ayudas.find(
                      (a) => a.id === ayudaActivaId
                    );
                    const resultado = resultados[ayudaActivaId] || {};
                    const resultadoTexto =
                      resultado.resultado === "funciono"
                        ? "Le funcionó"
                        : resultado.resultado === "no_funciono"
                        ? "No funcionó"
                        : "No especificado";
                    return (
                      <View key={j} style={styles.tableRow}>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>{sub.sub_item}</Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            {ayudaActiva?.descripcion || "No seleccionada"}
                          </Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>{resultadoTexto}</Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>
                            {resultado.comentario || "—"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* ✅ Número de página */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

// Componente de exportación PDF con botón
const ExportarApoyosPDF = ({
  secciones = [],
  activoPorSubitem = {},
  resultados = {},
  profile,
}) => {
  return (
    <PDFDownloadLink
      document={
        <MyDocument
          secciones={secciones}
          activoPorSubitem={activoPorSubitem}
          resultados={resultados}
          profile={profile}
        />
      }
      fileName="plan_apoyos.pdf"
      style={{ textDecoration: "none" }}
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          "Cargando PDF..."
        ) : (
          <Button
            variant="contained"
            color="info"
            startIcon={<PictureAsPdfIcon />}
            sx={{
              mt: 2,
              mb: 3,
              fontWeight: "bold",
            }}
          >
            Exportar Plan Personalizado de Apoyos
          </Button>
        )
      }
    </PDFDownloadLink>
  );
};

export default ExportarApoyosPDF;