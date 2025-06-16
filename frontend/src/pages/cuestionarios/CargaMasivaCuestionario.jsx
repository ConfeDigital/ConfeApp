import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Typography,
  CircularProgress,
} from "@mui/material";
import api from "../../api";

const CargaMasivaCuestionario = () => {
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Fetch CSRF token from cookies
    const getCsrfToken = () => {
      const cookies = document.cookie.split("; ");
      for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "csrftoken") return value;
      }
      return "";
    };

    setCsrfToken(getCsrfToken());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData(e.target);
    console.log("Archivo seleccionado:", formData.get("file")); // Verifica el archivo

    try {
      const response = await api.post(
        "api/cuestionarios/upload_excel/",
        formData,
        {
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Uploaded successfully:", response.data);
      setMessage({ type: "success", text: "Upload successful!" });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Upload failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Carga Masiva de Cuestionarios
      </Typography>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <Input type="file" name="file" accept=".xlsx" required />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </form>
      {message.text && (
        <Typography
          variant="body1"
          color={message.type === "success" ? "success.main" : "error.main"}
          mt={2}
        >
          {message.text}
        </Typography>
      )}
    </Box>
  );
};

export default CargaMasivaCuestionario;
