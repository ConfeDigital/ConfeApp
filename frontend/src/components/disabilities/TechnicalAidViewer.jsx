import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    IconButton,
    Tooltip,
    Divider,
    Link,
    Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useSelector } from "react-redux";

const TechnicalAidViewer = ({
    open,
    onClose,
    aids,
    currentIndex,
    onIndexChange,
    onEdit,
}) => {
    if (
        !aids ||
        aids.length === 0 ||
        currentIndex < 0 ||
        currentIndex >= aids.length
    ) {
        return null;
    }
    const isStaff = useSelector((state) => state.auth.user?.is_staff);

    const currentAid = aids[currentIndex];
    const hasMultipleAids = aids.length > 1;

    const handlePrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : aids.length - 1;
        onIndexChange(newIndex);
    };

    const handleNext = () => {
        const newIndex = currentIndex < aids.length - 1 ? currentIndex + 1 : 0;
        onIndexChange(newIndex);
    };

    const handleEdit = () => {
        onEdit(currentAid);
        onClose();
    };

    const renderLinks = (linksString) => {
        if (!linksString) return "Sin enlaces";

        const links = linksString
            .split(" ")
            .map((link) => link.trim())
            .filter((link) => link);

        if (links.length === 0) return "Sin enlaces";

        return (
            <Stack spacing={1}>
                {links.map((link, index) => (
                    <Link
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            wordBreak: "break-all",
                            color: "primary.light",
                        }}
                    >
                        {link}
                        <OpenInNewIcon fontSize="small" />
                    </Link>
                ))}
            </Stack>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: "400px" },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 1,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" component="div">
                        Detalle del Apoyo
                    </Typography>
                    {hasMultipleAids && (
                        <Chip
                            label={`${currentIndex + 1} de ${aids.length}`}
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Box>

                <Stack direction="row" spacing={1}>
                    {hasMultipleAids && (
                        <>
                            <Tooltip title="Apoyo anterior">
                                <IconButton onClick={handlePrevious} size="small">
                                    <ArrowBackIosIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Siguiente apoyo">
                                <IconButton onClick={handleNext} size="small">
                                    <ArrowForwardIosIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title="Cerrar">
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Technical Aid Name */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Nombre del Apoyo
                        </Typography>
                        <Typography variant="body1">
                            {currentAid.technicalAidName}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Description */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Descripción
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                            {currentAid.description || "Sin descripción"}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Links */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Enlaces
                        </Typography>
                        {renderLinks(currentAid.links)}
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1, display: isStaff ? "flex" : "none" }}>
                <Box sx={{ flexGrow: 1 }} />

                <Button color="secondary" onClick={onClose}>
                    Cerrar
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEdit}
                    endIcon={<EditIcon />}
                >
                    Editar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TechnicalAidViewer;
