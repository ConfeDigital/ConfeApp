import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TechnicalAidsGrid from '../../components/disabilities/TechnicalAidsGrid';
import TechnicalAidViewer from '../../components/disabilities/TechnicalAidViewer';
import AddEditTechnicalAidModal from '../../components/disabilities/AddEditTechnicalAidModal';
import { FileUploadSection } from '../../components/disabilities/FileUploadSection';
import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog';
import { FileFormatTable } from '../../components/disabilities/FileFormatTableTechnicalAids';
import axios from '../../api';
import { useSelector } from 'react-redux';

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const TechnicalAidsDashboard = () => {
  useDocumentTitle('Apoyos: Evaluación Diagnóstica');
  const isStaff = useSelector((state) => state.auth.user?.is_staff);

  const [technicalAids, setTechnicalAids] = useState([]);
  const [impediments, setImpediments] = useState([]);
  const [selectedImpedimentId, setSelectedImpedimentId] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for modals
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState(null);
  const [openAddEditModal, setOpenAddEditModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentTAid, setCurrentTAid] = useState(null);
  const [openAddImpDialog, setOpenAddImpDialog] = useState(false);
  const [newImpedimentName, setNewImpedimentName] = useState("");

  // State for viewer dialog
  const [openViewer, setOpenViewer] = useState(false);
  const [viewerAids, setViewerAids] = useState([]);
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0);

  // Fetch technical aids
  const fetchTechnicalAids = async () => {
    setLoading(true);
    fetchImpediments();
    try {
      const res = await axios.get("/api/discapacidad/technical-aids/");
      setTechnicalAids(res.data);
    } catch (err) {
      console.error("Error fetching technical aids:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch impediments
  const fetchImpediments = async () => {
    try {
      const res = await axios.get("/api/discapacidad/impediments/");
      setImpediments(res.data);
      if (res.data.length > 0 && !selectedImpedimentId) {
        setSelectedImpedimentId(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching impediments:", err);
    }
  };

  useEffect(() => {
    document.title = "Apoyos Evaluación Diagnóstica";
    fetchTechnicalAids();
  }, []);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setSelectedImpedimentId(newValue);
  };

  // Delete handlers
  const handleDeleteConfirm = async () => {
    try {
      await axios.put(
        `/api/discapacidad/technical-aids/${deleteRowId}/remove-impediment/`,
        {
          impediment_id: selectedImpedimentId,
        }
      );
      fetchTechnicalAids();
      setOpenDeleteDialog(false);
      setDeleteRowId(null);
    } catch (error) {
      console.error("Error deleting connection:", error);
    }
  };

  const handleDeleteRequest = (rowId) => {
    setDeleteRowId(rowId);
    setOpenDeleteDialog(true);
  };

  // Handlers for opening the add/edit modal
  const handleAddNew = () => {
    setModalMode("add");
    setCurrentTAid(null);
    setOpenAddEditModal(true);
  };

  const handleEdit = (row) => {
    setModalMode("edit");
    setCurrentTAid(row);
    setOpenAddEditModal(true);
  };

  // Add Impediment handler
  const handleAddImp = async () => {
    try {
      await axios.post("/api/discapacidad/impediments/", {
        name: newImpedimentName,
      });
      setNewImpedimentName("");
      setOpenAddImpDialog(false);
      fetchImpediments();
    } catch (error) {
      console.error("Error adding impediment:", error);
    }
  };

  // Viewer handlers
  const handleView = (selectedRow, allFilteredRows) => {
    const selectedIndex = allFilteredRows.findIndex(row => row.id === selectedRow.id);
    setViewerAids(allFilteredRows);
    setCurrentViewerIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpenViewer(true);
  };

  const handleViewerIndexChange = (newIndex) => {
    setCurrentViewerIndex(newIndex);
  };

  const handleViewerEdit = (aid) => {
    handleEdit(aid);
  };

  const handleViewerDelete = (aidId) => {
    handleDeleteRequest(aidId);
  };

  return (
    <Box p={2}>

      {isStaff && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <FileUploadSection
            uploadEndpoint="/api/discapacidad/upload/technical-aids/"
            fetchData={fetchTechnicalAids}
            FormatComponent={FileFormatTable}
          />
          <Button variant="outlined" onClick={() => setOpenAddImpDialog(true)} endIcon={<AddCircleOutlineIcon />}>
            Crear Grupo
          </Button>
          <Button variant="outlined" onClick={handleAddNew} endIcon={<AddCircleOutlineIcon />}>
            Añadir/Editar Apoyo
          </Button>
        </Stack>
      )}
      
      <Tabs
        value={selectedImpedimentId}
        onChange={handleTabChange}
        variant="scrollable"
      >
        {impediments.map((imp) => (
          <Tab key={imp.id} label={imp.name} value={imp.id} />
        ))}
      </Tabs>
      <Box mt={2}>
        <TechnicalAidsGrid
          data={technicalAids}
          selectedImpedimentId={selectedImpedimentId}
          loading={loading}
          onView={handleView}
        />
      </Box>

      {/* Viewer Dialog */}
      <TechnicalAidViewer
        open={openViewer}
        onClose={() => setOpenViewer(false)}
        aids={viewerAids}
        currentIndex={currentViewerIndex}
        onIndexChange={handleViewerIndexChange}
        onEdit={handleViewerEdit}
      />

      <AddEditTechnicalAidModal
        open={openAddEditModal}
        onClose={() => setOpenAddEditModal(false)}
        mode={modalMode}
        technicalAid={currentTAid}
        impediments={impediments}
        existingAids={technicalAids.map((ta) => ta.name)}
        refreshData={fetchTechnicalAids}
        selectedImpedimentId={selectedImpedimentId}
        onDelete={handleViewerDelete}
      />
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
      />
      {/* Add Impediment Dialog */}
      <Dialog
        open={openAddImpDialog}
        onClose={() => setOpenAddImpDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Añadir un Nuevo Grupo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Grupo"
            fullWidth
            value={newImpedimentName}
            onChange={(e) => setNewImpedimentName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOpenAddImpDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddImp} variant="contained">
            Añadir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TechnicalAidsDashboard;