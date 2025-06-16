// DatasheetReadOnly.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Avatar,
    Link,
    Divider,
    useTheme,
    useMediaQuery,
    Button,
    Alert,
    Stack,
} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "../../api";
import DatasheetSkeleton from "../../components/datasheet/DatasheetSkeleton";
import { formatCanonicalPhoneNumber } from "../../components/phone_number/phoneUtils";
import ContactList from "../../components/candidate_create/ContactList";
import CandidateDetails from "../../components/candidate_create/DetailSection";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import TransferListDialog from '../../components/dashboard/TransferListDialog'; // Adjust path if needed

// Define stages
const stageOrder = [
    { code: "Reg", label: "Registro" },
    { code: "Pre", label: "Preentrevista" },
    { code: "Can", label: "Canalización" },
    { code: "Ent", label: "Entrevista" },
    { code: "Cap", label: "Capacitación" },
    { code: "Agn", label: "Agencia" },
];

const DatasheetReadOnly = () => {
    useDocumentTitle('Expediente del Candidato (Solo Lectura)');
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { uid } = useParams(); // This `uid` is the candidate's user ID
    const [candidateProfile, setCandidateProfile] = useState(null);
    const [incomingTransferRequests, setIncomingTransferRequests] = useState([]);
    const [openTransferDialog, setOpenTransferDialog] = useState(false);
    const [loadingTransferRequests, setLoadingTransferRequests] = useState(true);

    // Function to fetch incoming transfer requests for this specific candidate
    const fetchIncomingTransferRequests = useCallback(async () => {
        setLoadingTransferRequests(true);
        try {
            // Updated API endpoint using the new action
            const res = await axios.get(`/api/centros/canalizar-candidato/incoming-for-candidate/${uid}/`);
            setIncomingTransferRequests(res.data); // Backend now sends only pending requests
        } catch (err) {
            console.error("Error fetching incoming transfer requests:", err);
            setIncomingTransferRequests([]);
        } finally {
            setLoadingTransferRequests(false);
        }
    }, [uid]); // Dependency on uid to re-fetch if candidate changes

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const res = await axios.get(`/api/candidatos/profiles/${uid}/`);
                setCandidateProfile(res.data);
            } catch (err) {
                console.error("Error fetching candidate:", err);
            }
        };
        fetchCandidate();
        // Call the specific action for this candidate
        fetchIncomingTransferRequests(); 
    }, [uid, fetchIncomingTransferRequests]); 

    const handleOpenTransferDialog = () => {
        setOpenTransferDialog(true);
    };

    const handleCloseTransferDialog = () => {
        setOpenTransferDialog(false);
    };

    const handleTransferActionSuccess = () => {
        // Re-fetch the incoming transfer requests to update the UI
        fetchIncomingTransferRequests();
    };

    if (!candidateProfile) {
        return <DatasheetSkeleton />;
    }

    const activeStep = stageOrder.findIndex(s => s.code === candidateProfile.stage);
    const hasPendingIncomingRequests = incomingTransferRequests.length > 0;

    return (
        <Box m={{ xs: 1, sm: 2, md: 3 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: '12px' }}>
                {/* Header */}
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3}>
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" gap={2} mb={{ xs:2, sm:0 }}>
                        <Avatar
                            src={candidateProfile.photo || undefined}
                            sx={{ width: { xs: 100, sm: 140, md: 180 }, height: { xs: 100, sm: 140, md: 180 }, border: `4px solid ${theme.palette.primary.main}` }}
                        >
                            {!candidateProfile.photo && candidateProfile.user.first_name.charAt(0)}
                        </Avatar>
                        <Box textAlign={{ xs: 'center', sm: 'left' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {candidateProfile.user.first_name} {candidateProfile.user.last_name} {candidateProfile.user.second_last_name}
                            </Typography>
                            <Typography variant="subtitle1" color="textSecondary">
                                {candidateProfile.disability_name}
                            </Typography>
                            <Typography variant="subtitle1" color="textSecondary">
                                Contacto: {' '}
                                <Link href={`tel:${candidateProfile.phone_number}`} sx={{ fontWeight: 'bold' }}>
                                    {formatCanonicalPhoneNumber(candidateProfile.phone_number)}
                                </Link>, {' '}
                                <Link href={`mailto:${candidateProfile.user.email}`} sx={{ fontWeight: 'bold' }}>
                                    {candidateProfile.user.email}
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                    {/* Status Chip */}
                    <Chip
                        label={candidateProfile.user.is_active ? 'ACTIVO' : 'INACTIVO'}
                        color={candidateProfile.user.is_active ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold', py:1, minWidth: '120px' }}
                    />
                </Box>

                {/* Conditional Alert/Button for Incoming Transfer Requests */}
                {!loadingTransferRequests && hasPendingIncomingRequests && (
                    <Alert
                        severity="info"
                        sx={{ mb: 3 }}
                        action={
                            <Stack direction="row" spacing={1}>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={handleOpenTransferDialog}
                                >
                                    Ver Solicitudes
                                </Button>
                            </Stack>
                        }
                    >
                        Este candidato tiene solicitudes de transferencia pendientes para su organización.
                    </Alert>
                )}


                {/* Contacts */}
                <ContactList emergency_contacts={candidateProfile.emergency_contacts} />
                {/* Details */}
                <CandidateDetails candidateProfile={candidateProfile} />

                <Divider sx={{ my: { xs:2, md:3 } }} />

                {/* Phase Stepper */}
                <Stepper
                    orientation={isSmallScreen ? 'vertical' : 'horizontal'}
                    activeStep={activeStep}
                    sx={{ background: 'transparent' }}
                    alternativeLabel={!isSmallScreen}
                >
                    {stageOrder.map((stage, idx) => (
                        <Step key={stage.code} completed={idx < activeStep}>
                            <StepLabel>
                                <Typography variant="button">
                                    {stage.label.toUpperCase()}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Transfer List Dialog (conditionally rendered but always mounted for state management) */}
            <TransferListDialog
                open={openTransferDialog}
                onClose={handleCloseTransferDialog}
                title="Solicitudes de Transferencia Recibidas"
                transferType="haciaOrganizacion"
                userList={incomingTransferRequests}
                onActionSuccess={handleTransferActionSuccess}
            />
        </Box>
    );
};

export default DatasheetReadOnly;