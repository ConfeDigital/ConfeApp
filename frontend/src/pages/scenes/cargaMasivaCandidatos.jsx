import React, { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import axios from "../../api";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const UploadExcelComponent = () => {
    useDocumentTitle('Carga de Candidatos');
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus("❌ No file selected.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("/api/candidatos/crear_masiva/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("✅ Upload Success:", response.data);
            setUploadStatus("✅ Upload successful!");
        } catch (error) {
            console.error("❌ Upload Failed:", error.response?.data || error.message);
            setUploadStatus("❌ Upload failed.");
        }
    };

    return (
        <Box m="20px">
            <Paper elevation={3} sx={{ padding: "20px" }}>
                <Typography variant="h6">📤 Upload Excel File</Typography>
                <input type="file" accept=".xlsx" onChange={handleFileChange} />
                <Button onClick={handleUpload} variant="contained" color="primary">
                    Upload
                </Button>
                {uploadStatus && <Typography mt={2}>{uploadStatus}</Typography>}
            </Paper>
        </Box>
    );
};

export default UploadExcelComponent;