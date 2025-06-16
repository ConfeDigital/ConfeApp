import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from '../../api';

const AddEditTechnicalAidModal = ({ 
  open, 
  onClose, 
  mode, 
  technicalAid, 
  impediments, 
  existingAids, 
  refreshData,
  selectedImpedimentId,
  onDelete
}) => {
  // Local state for form fields
  const [taidName, setTaidName] = useState('');
  const [selectedImpediments, setSelectedImpediments] = useState([]);
  const [taidLinks, setTaidLinks] = useState([]); // dynamic link fields
  const [relationshipDescription, setRelationshipDescription] = useState('');
  const [allTechnicalAids, setAllTechnicalAids] = useState([]);
  const [editMode, setEditMode] = useState('full'); // 'full' or 'relationship'

  // Fetch all technical aids to get complete data for autocomplete selections
  useEffect(() => {
    if (open) {
      const fetchAllTechnicalAids = async () => {
        try {
          const res = await axios.get('/api/discapacidad/technical-aids/');
          setAllTechnicalAids(res.data);
        } catch (error) {
          console.error('Error fetching technical aids:', error);
        }
      };
      
      fetchAllTechnicalAids();
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Determine if this is a full edit or just a relationship edit
      if (mode === 'edit' && technicalAid) {
        setTaidName(technicalAid.technicalAidName);
        
        // Check if we're editing from the DataGrid (relationship edit)
        if (technicalAid.id && selectedImpedimentId) {
          setEditMode('relationship');
          setRelationshipDescription(technicalAid.description || '');
          
          // For relationship edit, find the full technical aid object
          const fullTA = allTechnicalAids.find(ta => ta.id === technicalAid.id);
          if (fullTA) {
            // In relationship edit, we only need the links, not the impediments
            if (fullTA.links && fullTA.links.length > 0) {
              setTaidLinks(fullTA.links.map(link => link.url));
            } else if (technicalAid.links) {
              const linkArray = technicalAid.links.split(',').map(link => link.trim());
              setTaidLinks(linkArray.filter(link => link !== ''));
            } else {
              setTaidLinks([]);
            }
          }
        } else {
          // Full edit mode
          setEditMode('full');
          
          if (technicalAid.impediments) {
            setSelectedImpediments(technicalAid.impediments.map(rel => rel.impediment));
          } else {
            setSelectedImpediments([]);
          }
          
          if (technicalAid.links) {
            const linkArray = technicalAid.links.split(',').map(link => link.trim());
            setTaidLinks(linkArray.filter(link => link !== ''));
          } else {
            setTaidLinks([]);
          }
        }
      } else {
        // Add new mode
        setEditMode('full');
        setTaidName('');
        setSelectedImpediments([]);
        setTaidLinks([]);
        setRelationshipDescription('');
      }
    }
  }, [mode, technicalAid, open, selectedImpedimentId, allTechnicalAids]);

  // Dynamic link fields handlers
  const handleAddLinkField = () => {
    setTaidLinks([...taidLinks, ""]);
  };

  const handleTaidLinkChange = (index, value) => {
    const newLinks = [...taidLinks];
    newLinks[index] = value;
    setTaidLinks(newLinks);
  };

  const handleRemoveTaidLink = (index) => {
    const newLinks = [...taidLinks];
    newLinks.splice(index, 1);
    setTaidLinks(newLinks);
  };

  // Handle selection of existing technical aid from autocomplete
  const handleTechnicalAidSelect = (newValue) => {
    setTaidName(newValue || '');
    
    if (newValue) {
      // Find the full technical aid object
      const foundTA = allTechnicalAids.find(
        ta => ta.name.toLowerCase() === newValue.toLowerCase()
      );
      
      if (foundTA) {
        // Update impediments based on the found technical aid
        setSelectedImpediments(
          foundTA.impediments.map(rel => rel.impediment)
        );
        
        // Update links based on the found technical aid
        if (foundTA.links && foundTA.links.length > 0) {
          setTaidLinks(foundTA.links.map(link => link.url));
        } else {
          setTaidLinks([]);
        }
      }
    }
  };

  // Save handler - handles both full add/edit and relationship edit
  const handleSave = async () => {
    try {
      const trimmedName = taidName.trim();
      if (!trimmedName) return;
      const linksArray = taidLinks.map((link) => link.trim()).filter((link) => link);
      
      // If we're just editing the relationship description (from DataGrid)
      if (editMode === 'relationship' && technicalAid && technicalAid.id && selectedImpedimentId) {
        // Update relationship description
        await axios.put(
          `/api/discapacidad/technical-aids/${technicalAid.id}/update-impediment/`, 
          {
            impediment_id: selectedImpedimentId,
            description: relationshipDescription,
          }
        );
        
        // Update links
        await axios.put(
          `/api/discapacidad/technical-aids/${technicalAid.id}/update-links/`,
          { link_urls: linksArray }
        );
      } else {
        // Find if the technical aid already exists
        const existingAid = allTechnicalAids.find(
          ta => ta.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (existingAid) {
          // For each selected impediment that is not already connected, add connection
          for (let imp of selectedImpediments) {
            const exists = existingAid.impediments.some(
              rel => rel.impediment.id === imp.id
            );
            
            if (!exists) {
              await axios.put(
                `/api/discapacidad/technical-aids/${existingAid.id}/add-impediment/`,
                { impediment_data: [{ impediment_id: imp.id, description: "" }] },
                { headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
          
          // Update links
          await axios.put(
            `/api/discapacidad/technical-aids/${existingAid.id}/update-links/`, 
            { link_urls: linksArray }
          );
        } else {
          // Create new technical aid
          const impediment_data = selectedImpediments.map((imp) => ({
            impediment_id: imp.id,
            description: ""
          }));
          
          const payload = {
            name: trimmedName,
            impediment_data: impediment_data,
            link_urls: linksArray,
          };
          
          await axios.post('/api/discapacidad/technical-aids/', payload, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      
      refreshData();
      onClose();
    } catch (error) {
      console.error('Error saving technical aid:', error);
    }
  };

  const handleDelete = () => {
    onDelete(technicalAid.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode === 'relationship' ? "Editar Apoyo" : (mode === 'edit' ? "Editar Apoyo" : "Crear/Editar Apoyo")}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* In relationship edit mode, we just show the name as text */}
          {editMode === 'relationship' ? (
            <TextField
              label="Nombre del Apoyo"
              fullWidth
              value={taidName}
              disabled
            />
          ) : (
            <Autocomplete
              freeSolo
              options={allTechnicalAids.map(ta => ta.name)}
              value={taidName}
              onChange={(event, newValue) => handleTechnicalAidSelect(newValue)}
              onInputChange={(event, newInputValue) => setTaidName(newInputValue)}
              renderInput={(params) => <TextField {...params} label="Nombre del Apoyo" fullWidth />}
            />
          )}
          
          {/* Only show impediments selector in full edit mode */}
          {editMode === 'full' && (
            <Autocomplete
              multiple
              options={impediments}
              getOptionLabel={(option) => option.name}
              value={selectedImpediments}
              onChange={(event, newValue) => setSelectedImpediments(newValue)}
              renderInput={(params) => <TextField {...params} label="Seleccionar Grupos" fullWidth />}
            />
          )}
          
          {/* Show relationship description in relationship edit mode */}
          {editMode === 'relationship' && (
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={4}
              value={relationshipDescription}
              onChange={(e) => setRelationshipDescription(e.target.value)}
            />
          )}
          
          <Typography variant="subtitle1">Links</Typography>
          {taidLinks.map((link, index) => (
            <Stack direction="row" spacing={1} alignItems="center" key={index}>
              <TextField
                label={`Link ${index + 1}`}
                fullWidth
                value={link}
                onChange={(e) => handleTaidLinkChange(index, e.target.value)}
              />
              <Tooltip title='Eliminar Link'>
                <IconButton color="error" onClick={() => handleRemoveTaidLink(index)}>
                  <RemoveCircle />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          <Button variant="outlined" onClick={handleAddLinkField} endIcon={<AddCircle />} sx={{ alignSelf: 'flex-start' }}>
            Añadir Link
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose}>Cancelar</Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          startIcon={<DeleteIcon />}
        >
          Eliminar
        </Button>
        <Button onClick={handleSave} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditTechnicalAidModal;