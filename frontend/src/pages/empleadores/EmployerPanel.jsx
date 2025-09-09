// src/pages/agencia/EmployerPanel.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Alert,
  Typography,
  Paper,
  Avatar,
  useTheme,
} from "@mui/material";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import PersonAddAlt from "@mui/icons-material/PersonAddAlt";
import BusinessIcon from '@mui/icons-material/Business';

import api from "../../api";
import JobsDataGrid from "../../components/agencia/JobsGrid";
import EmployersDataGrid from "../../components/agencia/EmployersGrid";
import JobFormDialog from "../../components/agencia/JobFormDialogGoogle";
import EmployerFormDialog from "../../components/agencia/EmployerFormDialog";
import { DeleteConfirmDialog } from "../../components/DeleteConfirmDialog";

import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function EmployerPanel() {
  useDocumentTitle('Panel de Empleos');
  const theme = useTheme();

  const [tab, setTab] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [currentEmployer, setCurrentEmployer] = useState([]);
  const [alert, setAlert] = useState(null);

  // Dialog state
  const [jobDialog, openJobDialog] = useState(false);
  const [editJob, setEditJob] = useState(null);

  const [empDialog, openEmpDialog] = useState(false);
  const [editEmp, setEditEmp] = useState(null);

  // Delete
  const [delDialog, openDel] = useState(false);
  const [delType, setDelType] = useState(null);
  const [delId, setDelId] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [jobsRes, empRes, curEmpRes] = await Promise.all([
        api.get("api/agencia/jobs/"),
        api.get("api/agencia/employers/"),
        api.get("api/agencia/employer/me/"),
      ]);
      setJobs(jobsRes.data);
      setEmployers(empRes.data);
      setCurrentEmployer(curEmpRes.data);
    } catch (e) {
      console.error(e);
      setAlert({ severity: "error", message: "Error cargando datos" });
    }
  };

  const handleDelete = (type, id) => {
    setDelType(type);
    setDelId(id);
    openDel(true);
  };
  const confirmDelete = async () => {
    try {
      await api.delete(`api/agencia/${delType}/${delId}/`);
      setAlert({ severity: "success", message: `${delType} eliminado` });
      fetchAll();
    } catch {
      setAlert({ severity: "error", message: "Error al eliminar" });
    }
    openDel(false);
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" gap={2} ml={2}>
        <Avatar
          src={currentEmployer.company_logo}
          sx={{ width: 64, height: 64 }}
        >
          <BusinessIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {currentEmployer.company_name}
          </Typography>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Empleos" />
          <Tab label="Empleadores" />
        </Tabs>
        {tab === 0 ? (
          <Button
            variant="contained"
            onClick={() => {
              setEditJob(null);
              openJobDialog(true);
            }}
            startIcon={<PostAddOutlinedIcon />}
          >
            Nuevo Empleo
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              setEditEmp(null);
              openEmpDialog(true);
            }}
            startIcon={<PersonAddAlt />}
          >
            Nuevo Colaborador
          </Button>
        )}
      </Box>
      {tab === 0 ? (
        <Box>
          <JobsDataGrid
            rows={jobs}
            onEdit={(j) => {
              setEditJob(j);
              openJobDialog(true);
            }}
            onDelete={(id) => handleDelete("jobs", id)}
            companyNameVisibility={false}
          />
        </Box>
      ) : (
        <Box>
          <EmployersDataGrid
            rows={employers}
            onEdit={(e) => {
              setEditEmp(e);
              openEmpDialog(true);
            }}
            onDelete={(id) => handleDelete("employers", id)}
            handleToggleActive={(e) => {
              api
                .patch(`api/agencia/employers/${e.id}/`, {
                  email: e.email,
                  first_name: e.first_name,
                  last_name: e.last_name,
                  is_active: !e.is_active,
                })
                .then((res) => {
                  setEmployers((es) =>
                    es.map((x) => (x.id === res.data.id ? res.data : x))
                  );
                });
            }}
            companyNameVisibility={false}
          />
        </Box>
      )}

      <JobFormDialog
        open={jobDialog}
        data={editJob}
        isEdit={!!editJob}
        onClose={() => openJobDialog(false)}
        onSubmit={() => {
          openJobDialog(false);
          setAlert({ severity: "success", message: "Empleo guardado" });
        }}
        // NB: no `companies` prop here — the API will auto‑assign job.company to `user.employer.company`.
        companies={null}
        setJobs={setJobs}
        setAlert={setAlert}
      />

      <EmployerFormDialog
        open={empDialog}
        data={editEmp}
        isEdit={!!editEmp}
        onClose={() => openEmpDialog(false)}
        onSubmit={() => {
          openEmpDialog(false);
          setAlert({ severity: "success", message: "Empleado guardado" });
        }}
        // NB: no `companies` selector either
        companies={null}
        setEmployers={setEmployers}
        setAlert={setAlert}
      />

      <DeleteConfirmDialog
        open={delDialog}
        onClose={() => openDel(false)}
        onConfirm={confirmDelete}
      />

      <Snackbar
        open={!!alert}
        autoHideDuration={4000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={alert?.severity}>{alert?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
