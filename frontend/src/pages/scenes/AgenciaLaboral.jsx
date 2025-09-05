// src/pages/CandidateEmploymentManagement.jsx
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import CandidateGrid from '../../components/agencia/CandidateGrid';
import JobAssignmentGrid from '../../components/agencia/JobAssignmentGrid';
import AssignCandidateModal from '../../components/agencia/AssignCandidateModal';
import AssignJobModal from '../../components/agencia/AssignJobModalGoogleMaps';
import RemoveJobModal from '../../components/agencia/RemoveJobModal'; // Nuevo modal
import api from '../../api';
import useDocumentTitle from "../../hooks/useDocumentTitle";

const CandidateEmploymentManagement = () => {
  useDocumentTitle('Agencia Laboral');
  
  const [tabIndex, setTabIndex] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Para el modal de asignar empleo desde el grid de candidatos
  const [candidateForJobAssign, setCandidateForJobAssign] = useState(null);
  const [assignJobModalOpen, setAssignJobModalOpen] = useState(false);
  
  // Para el modal de asignación desde el grid de empleos (ya existente)
  const [jobToAssign, setJobToAssign] = useState(null);
  const [assignCandidateModalOpen, setAssignCandidateModalOpen] = useState(false);
  
  // Nuevo: para el modal de quitar empleo
  const [candidateForRemoval, setCandidateForRemoval] = useState(null);
  const [removeJobModalOpen, setRemoveJobModalOpen] = useState(false);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/api/candidatos/lista-agencia/');
      setCandidates(response.data);
    } catch (error) {
      console.error("Error fetching candidates", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/agencia/jobs/');
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const updateCandidateAgencyState = async (candidateId, newAgencyState) => {
    try {
      await api.patch(`/api/candidatos/editar/${candidateId}/`, { agency_state: newAgencyState });
      fetchCandidates();
    } catch (error) {
      console.error("Error updating candidate agency state", error);
    }
  };

  // Función para abrir el modal de asignar empleo desde CandidateGrid (nuevo modal)
  const openAssignJobForCandidate = (candidate) => {
    setCandidateForJobAssign(candidate);
    setAssignJobModalOpen(true);
  };

  const closeAssignJobModal = () => {
    setAssignJobModalOpen(false);
    setCandidateForJobAssign(null);
    fetchCandidates();
  };

  // Función para abrir el modal desde el JobAssignmentGrid (ya existente)
  const openAssignCandidateModal = (job) => {
    setJobToAssign(job);
    setAssignCandidateModalOpen(true);
  };

  const closeAssignCandidateModal = () => {
    setAssignCandidateModalOpen(false);
    setJobToAssign(null);
    fetchCandidates();
  };

  // Nuevo: Función para abrir el modal de quitar empleo
  const openRemoveJobModal = (candidate) => {
    setCandidateForRemoval(candidate);
    setRemoveJobModalOpen(true);
  };

  const closeRemoveJobModal = () => {
    setRemoveJobModalOpen(false);
    setCandidateForRemoval(null);
    fetchCandidates();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Gestión de Candidatos" />
        <Tab label="Gestión de Empleo" />
      </Tabs>
      {tabIndex === 0 && (
        <CandidateGrid 
          candidates={candidates} 
          onAgencyStateUpdate={updateCandidateAgencyState}
          onOpenAssignJob={openAssignJobForCandidate} // Para asignar empleo
          onOpenRemoveJob={openRemoveJobModal}         // Para quitar empleo
        />
      )}
      {tabIndex === 1 && (
        <JobAssignmentGrid 
          rows={jobs}
          onOpenAssignModal={openAssignCandidateModal}
        />
      )}
      {candidateForJobAssign && (
        <AssignJobModal 
          open={assignJobModalOpen}
          candidate={candidateForJobAssign}
          availableJobs={jobs}
          onClose={closeAssignJobModal}
          onAssigned={fetchCandidates}
        />
      )}
      {jobToAssign && (
        <AssignCandidateModal 
          open={assignCandidateModalOpen}
          job={jobToAssign}
          onClose={closeAssignCandidateModal}
          onAssigned={fetchCandidates}
        />
      )}
      {candidateForRemoval && (
        <RemoveJobModal 
          open={removeJobModalOpen}
          candidate={candidateForRemoval}
          onClose={closeRemoveJobModal}
          onRemoved={fetchCandidates}
        />
      )}
    </Box>
  );
};

export default CandidateEmploymentManagement;
