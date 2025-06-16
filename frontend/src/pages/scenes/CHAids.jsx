import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import axios from "../../api";
import { FileUploadSection } from "../../components/disabilities/FileUploadSection";
import { FileFormatTable } from "../../components/disabilities/FileFormatTableCHAids";
import "../../styles/DataGridStyles.css";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";
import { useSelector } from "react-redux";

const groups = ["Habilidades Laborales", "Conducta Adaptativa"];

const CHAids = () => {
  useDocumentTitle("Apoyos: Cuadro de Habilidades");
  const isStaff = useSelector((state) => state.auth.user?.is_staff);

  const [chItems, setCHItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAid, setEditedAid] = useState("");
  const [editAid, setEditAid] = useState({ id: null, aid: "" });

  const fetchCHAids = async () => {
    try {
      const response = await axios.get("/api/discapacidad/ch-items/");
      setCHItems(response.data);
    } catch (error) {
      console.error("Error fetching CH aids:", error);
    }
  };

  useEffect(() => {
    document.title = "Apoyos Cuadro de Habilidades";
    fetchCHAids();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleViewClick = (index) => {
    const selectedItem = filteredItems[index];
    setCurrentIndex(index);
    setEditedAid(selectedItem.aid);
    setEditAid({ id: selectedItem.id, aid: selectedItem.aid });
    setIsEditing(false);
    setViewDialogOpen(true);
  };

  const handleDialogClose = () => {
    setViewDialogOpen(false);
    setIsEditing(false);
    setEditAid({ id: null, aid: "" });
  };

  const handleAidUpdate = async () => {
    try {
      await axios.patch(`/api/discapacidad/ch-items/${editAid.id}/`, {
        aid: editAid.aid,
      });
      await fetchCHAids();
      handleDialogClose();
    } catch (error) {
      console.error("Error updating CH aid:", error);
    }
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
    setCurrentIndex(newIndex);
    setEditedAid(filteredItems[newIndex].aid);
    setEditAid({
      id: filteredItems[newIndex].id,
      aid: filteredItems[newIndex].aid,
    });
    setIsEditing(false);
  };

  const handleNext = () => {
    const newIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setEditedAid(filteredItems[newIndex].aid);
    setEditAid({
      id: filteredItems[newIndex].id,
      aid: filteredItems[newIndex].aid,
    });
    setIsEditing(false);
  };

  const currentGroupName = groups[selectedTab];
  const filteredItems = chItems.filter(
    (item) => item.group && item.group.name === currentGroupName
  );

  const rows = filteredItems.map((item) => ({
    id: item.id,
    itemName: item.name,
    aid: item.aid,
  }));

  const columns = [
    { field: "itemName", headerName: "Item", flex: 0.5, minWidth: 120 },
    {
      field: "aid",
      headerName: "Apoyo",
      flex: 2,
      minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.aid}</Typography>
      ),
    },
  ];

  const hasMultipleItems = filteredItems.length > 1;

  return (
    <Box sx={{ p: 2 }}>

      {isStaff && (
        <Box mb={2}>
          <FileUploadSection
            uploadEndpoint="/api/discapacidad/upload/ch-aids"
            fetchData={fetchCHAids}
            FormatComponent={FileFormatTable}
          />
        </Box>
      )}

      <Tabs
        value={selectedTab}
        variant="scrollable"
        onChange={handleTabChange}
      >
        {groups.map((group, index) => (
          <Tab key={index} label={group} />
        ))}
      </Tabs>

      <Box
        display="grid"
        className="custom-datagrid"
        sx={{ mt: 2, height: isStaff ? "70vh" : "76vh", width: "100%" }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          slots={{ toolbar: GridToolbar }}
          getRowHeight={() => "auto"}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          onRowClick={(params) => {
            const index = filteredItems.findIndex(
              (item) => item.id === params.row.id
            );
            if (index !== -1) handleViewClick(index);
          }}
        />
      </Box>

      <Dialog
        open={viewDialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="div">
              Vista del Apoyo
            </Typography>
            {hasMultipleItems && (
              <Chip 
                label={`${currentIndex + 1} de ${filteredItems.length}`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Stack direction="row" spacing={1}>
            {hasMultipleItems && (
              <>
                <Tooltip title="Apoyo anterior">
                  <IconButton 
                    onClick={handlePrevious} 
                    size="small"
                    // disabled={currentIndex <= 0}
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Siguiente apoyo">
                  <IconButton 
                    onClick={handleNext} 
                    size="small"
                    // disabled={currentIndex >= filteredItems.length - 1}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Cerrar">
              <IconButton onClick={handleDialogClose} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {currentIndex !== null && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Item
                </Typography>
                <Typography variant="body1">
                  {filteredItems[currentIndex]?.name}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Apoyo
                </Typography>
                {!isEditing ? (
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {filteredItems[currentIndex]?.aid || "Sin apoyo registrado."}
                  </Typography>
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Apoyo"
                    value={editedAid}
                    onChange={(e) => {
                      setEditedAid(e.target.value);
                      setEditAid((prev) => ({ ...prev, aid: e.target.value }));
                    }}
                  />
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, display: !isStaff ? 'none' : 'flex' }}>
          <Box sx={{ flexGrow: 1 }} />
          
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)} color='secondary'>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleAidUpdate}>
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleDialogClose} color='secondary'>
                Cerrar
              </Button>
              <Button 
                onClick={() => setIsEditing(true)} 
                endIcon={<EditIcon />} 
                variant='contained'
              >
                Editar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CHAids;