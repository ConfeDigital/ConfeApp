// src/features/disabilities/Disabilities.jsx
import { useState, useEffect } from "react";
import { Box, Tabs, Tab, Button } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { DisabilitiesGrid } from "../../components/disabilities/DisabilitiesGrid";
import { AddEditModal } from "../../components/disabilities/AddEditModal";
import { DeleteConfirmDialog } from "../../components/DeleteConfirmDialog";
import { FileUploadSection } from "../../components/disabilities/FileUploadSection";
import { useDisabilitiesData } from "../../components/disabilities/useDisabilitiesData";
import { FileFormatTable } from "../../components/disabilities/FileFormatTable"
import { useSelector } from "react-redux";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const Disabilities = () => {
  useDocumentTitle('Discapacidades');
  const isStaff = useSelector((state) => state.auth.user?.is_staff);

  const [tabIndex, setTabIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { data, fetchData, handleCreateOrUpdate, handleDelete, isLoading } = useDisabilitiesData();

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    group: "",
    disabilities: [],
    description: "",
    link: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row) => {
    setFormData({
      ...row,
      disabilities: row.disabilities
        ? row.disabilities.map((dis) => dis.id)
        : [],
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: null,
      name: "",
      group: "",
      disabilities: [],
      description: "",
      link: "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const success = await handleCreateOrUpdate(formData, tabIndex);
    if (success) {
      setOpen(false);
      setFormData({
        id: null,
        name: "",
        group: "",
      });
    }
  };

  const handleDeleteClick = async () => {
    const success = await handleDelete(selectedEntry, tabIndex);
    if (success) {
      setOpenConfirmDialog(false);
      setSelectedEntry(null);
    }
  };

  const handleDeleteRequest = (id) => {
    setSelectedEntry(id);
    setOpenConfirmDialog(true);
  };

  return (
    <Box p={2}>

      {isStaff && (
        <Box mb={2} display="flex">
          <FileUploadSection
            uploadEndpoint="/api/discapacidad/upload/disabilities/"
            fetchData={fetchData}  // your refresh function for disabilities data
            FormatComponent={FileFormatTable}
          />
          <Button
            variant="outlined"
            endIcon={<AddCircleOutlineIcon />}
            onClick={handleAddNew}
            sx={{ ml: 2 }}
          >
            {tabIndex === 0 ? "Añadir Grupo" : "Añadir Discapacidad"}
          </Button>
        </Box>
      )}
      

      <Tabs value={tabIndex} variant="scrollable" onChange={(e, newIndex) => setTabIndex(newIndex)}>
        <Tab label="Grupos de Discapacidad" />
        <Tab label="Tipos de Discapacidad" />
      </Tabs>

      <DisabilitiesGrid
        tabIndex={tabIndex}
        data={data}
        handleEdit={handleEdit}
        handleDelete={handleDeleteRequest}
        isLoading={isLoading}
      />

      <AddEditModal
        open={open}
        onClose={() => setOpen(false)}
        formData={formData}
        setFormData={setFormData}
        tabIndex={tabIndex}
        data={data}
        handleCreateOrUpdate={handleSave}
      />

      <DeleteConfirmDialog
        open={openConfirmDialog}
        onClose={() => {
          setOpenConfirmDialog(false);
          setSelectedEntry(null);
        }}
        onConfirm={handleDeleteClick}
      />
    </Box>
  );
};

export default Disabilities;
