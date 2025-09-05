import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Tooltip,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import AddCircle from "@mui/icons-material/AddCircle";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "../../api";
import { FileUploadSection } from "../../components/disabilities/FileUploadSection";
import { FileFormatTable } from "../../components/disabilities/FileFormatTableSISAids";
import "../../styles/DataGridStyles.css";
import { useSelector } from "react-redux";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const groups = [
  "Vida en el hogar",
  "Vida en la comunidad",
  "Aprendizaje a lo largo de la vida",
  "Actividades de empleo",
  "Salud y seguridad",
  "Actividades sociales",
  "Protección y defensa",
];

const SISAids = () => {
  useDocumentTitle('Apoyos: SIS');
  const isStaff = useSelector((state) => state.auth.user?.is_staff);

  const [sisAids, setSisAids] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAid, setEditAid] = useState({ id: null, ayudas: [] });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const [editFromView, setEditFromView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSISAids = async () => {
    try {
      const response = await axios.get("/api/discapacidad/sis-aids/");
      setSisAids(response.data);
    } catch (error) {
      console.error("Error fetching SIS aids:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    document.title = "Apoyos SIS";
    fetchSISAids();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleEditClick = (id, currentAyudas, fromView = false) => {
    const textos = currentAyudas.map((a) => a.descripcion);
    setEditAid({ id, ayudas: textos });
    setEditFromView(fromView);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    if (editFromView) {
      setViewDialogOpen(true);
      setEditFromView(false);
    }
    setEditAid({ id: null, ayudas: [] });
  };

  const handleAidUpdate = async () => {
    try {
      const payload = {
        ayudas: editAid.ayudas.map((descripcion) => ({ descripcion })),
      };
      await axios.put(`/api/discapacidad/sis-aids/${editAid.id}/`, payload);
      fetchSISAids(); // Recargar para reflejar cambios
      handleDialogClose();
    } catch (error) {
      console.error("Error updating aid:", error);
    }
  };

  const handlePrevious = () => {
    const newIndex = viewIndex > 0 ? viewIndex - 1 : filteredAids.length - 1;
    setViewIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = viewIndex < filteredAids.length - 1 ? viewIndex + 1 : 0;
    setViewIndex(newIndex);
  };

  const currentGroupName = groups[selectedTab];
  const filteredAids = sisAids.filter(
    (aid) =>
      aid.item && aid.item.group && aid.item.group.name === currentGroupName
  );

  const rows = filteredAids.map((item) => ({
    id: item.id,
    itemName: item.item.name,
    sub_item: item.sub_item,
    ayudas: item.ayudas || [],
  }));

  const columns = [
    { field: "itemName", headerName: "Item", flex: 0.5, minWidth: 120 },
    { field: "sub_item", headerName: "Sub Item", flex: 1, minWidth: 120 },
    {
      field: "ayudas",
      headerName: "Apoyos",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          {params.row.ayudas.map((a, idx) => (
            <li key={a.id || idx} style={{ whiteSpace: "normal" }}>
              {a.descripcion}
            </li>
          ))}
        </Box>
      ),
    },
  ];

  const hasMultipleAids = filteredAids.length > 1;

  return (
    <Box sx={{ p: 2 }}>
      {isStaff && (
        <Box mb={2}>
          <FileUploadSection
            uploadEndpoint="/api/discapacidad/upload/sis-aids/"
            fetchData={fetchSISAids}
            FormatComponent={FileFormatTable}
          />
        </Box>
      )}

      <Tabs value={selectedTab} variant="scrollable" onChange={handleTabChange}>
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
          getRowHeight={() => "auto"} // Ajusta altura automática
          slotProps={{ toolbar: { showQuickFilter: true } }}
          onRowClick={(params) => {
            const index = filteredAids.findIndex((aid) => aid.id === params.row.id);
            if (index !== -1) {
              setViewIndex(index);
              setViewDialogOpen(true);
            }
          }}
          loading={isLoading}
        />
      </Box>

      {/* Edit Aid Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div">
            Editar Apoyos
          </Typography>
          <Tooltip title="Cerrar">
            <IconButton onClick={handleDialogClose} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        
        <DialogContent dividers>
          <Stack spacing={3}>
            {editAid.ayudas.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No hay ayudas registradas aún.
              </Typography>
            )}
            
            {editAid.ayudas.map((a, index) => (
              <Box key={index} display="flex" gap={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label={`Apoyo ${index + 1}`}
                  value={a}
                  onChange={(e) => {
                    const newAyudas = [...editAid.ayudas];
                    newAyudas[index] = e.target.value;
                    setEditAid((prev) => ({ ...prev, ayudas: newAyudas }));
                  }}
                />
                <Tooltip title='Eliminar Apoyo'>
                  <IconButton 
                    color="error"
                    onClick={() => {
                      const newAyudas = [...editAid.ayudas];
                      newAyudas.splice(index, 1);
                      setEditAid((prev) => ({ ...prev, ayudas: newAyudas }));
                    }}
                    sx={{ mt: 1 }}
                  >
                    <RemoveCircle />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            
            <Button
              variant="outlined"
              onClick={() =>
                setEditAid((prev) => ({ ...prev, ayudas: [...prev.ayudas, ""] }))
              }
              startIcon={<AddCircle />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Agregar Apoyo
            </Button>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Box sx={{ flexGrow: 1 }} />
          <Button color='secondary' onClick={handleDialogClose}>
            Cancelar
          </Button>
          <Button onClick={handleAidUpdate} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Aid Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="div">
              Detalles del Apoyo
            </Typography>
            {hasMultipleAids && (
              <Chip 
                label={`${viewIndex + 1} de ${filteredAids.length}`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Stack direction="row" spacing={1}>
            {hasMultipleAids && (
              <>
                <Tooltip title="Apoyo anterior">
                  <IconButton 
                    onClick={handlePrevious} 
                    size="small"
                    // disabled={viewIndex === 0}
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Siguiente apoyo">
                  <IconButton 
                    onClick={handleNext} 
                    size="small"
                    // disabled={viewIndex >= filteredAids.length - 1}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Cerrar">
              <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {filteredAids[viewIndex] ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Item
                </Typography>
                <Typography variant="body1">
                  {filteredAids[viewIndex].item.name}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Sub Item
                </Typography>
                <Typography variant="body1">
                  {filteredAids[viewIndex].sub_item}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Apoyos
                </Typography>
                {filteredAids[viewIndex].ayudas.length > 0 ? (
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {filteredAids[viewIndex].ayudas.map((a, idx) => (
                      <Typography 
                        key={a.id || idx} 
                        component="li" 
                        variant="body1"
                        sx={{ mb: 1, whiteSpace: 'pre-wrap' }}
                      >
                        {a.descripcion}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Sin apoyos registrados
                  </Typography>
                )}
              </Box>
            </Stack>
          ) : (
            <Typography>No se encontró el apoyo seleccionado.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, display: !isStaff ? 'none' : 'flex' }}>
          <Box sx={{ flexGrow: 1 }} />
          
          <Button onClick={() => setViewDialogOpen(false)} color='secondary'>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const selected = filteredAids[viewIndex];
              handleEditClick(selected.id, selected.ayudas, true);
              setViewDialogOpen(false);
            }}
            endIcon={<Edit />}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SISAids;