import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Button, Alert, Snackbar } from "@mui/material";
import JobsDataGrid from "../../components/agencia/JobsGrid";
import CompaniesDataGrid from "../../components/agencia/CompaniesGrid";
import EmployersDataGrid from "../../components/agencia/EmployersGrid";
import JobFormDialog from "../../components/agencia/JobFormDialogGoogle";
import CompanyFormDialog from "../../components/agencia/CompanyFormDialog";
import EmployerFormDialog from "../../components/agencia/EmployerFormDialog";
import { DeleteConfirmDialog } from "../../components/DeleteConfirmDialog";
import api from "../../api";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import PersonAddAlt from "@mui/icons-material/PersonAddAlt";
import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const JobsCompaniesPage = () => {
  useDocumentTitle("Administración Agencia");

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  // Estados para diálogos de creación/edición
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [jobDialogData, setJobDialogData] = useState(null);
  const [isJobEdit, setIsJobEdit] = useState(false);

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [companyDialogData, setCompanyDialogData] = useState(null);
  const [isCompanyEdit, setIsCompanyEdit] = useState(false);

  const [employerDialogOpen, setEmployerDialogOpen] = useState(false);
  const [employerDialogData, setEmployerDialogData] = useState(null);
  const [isEmployerEdit, setIsEmployerEdit] = useState(false);

  // Estados para diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(""); // 'job' o 'company'
  const [deleteId, setDeleteId] = useState(null);

  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, companiesRes, empRes] = await Promise.all([
        api.get("api/agencia/jobs/"),
        api.get("api/agencia/companies/"),
        api.get("api/agencia/employers/"),
      ]);
      setJobs(jobsRes.data);
      setCompanies(companiesRes.data);
      setEmployers(empRes.data);
    } catch (error) {
      console.error("Error al obtener los datos", error);
    }
    setIsLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Funciones para abrir diálogos de Empleo
  const handleJobEdit = (job) => {
    setIsJobEdit(true);
    setJobDialogData(job);
    setJobDialogOpen(true);
  };

  const handleJobCreate = () => {
    setIsJobEdit(false);
    setJobDialogData(null);
    setJobDialogOpen(true);
  };

  // Funciones para abrir diálogos de Empresa
  const handleCompanyEdit = (company) => {
    setIsCompanyEdit(true);
    setCompanyDialogData(company);
    setCompanyDialogOpen(true);
  };

  const handleCompanyCreate = () => {
    setIsCompanyEdit(false);
    setCompanyDialogData(null);
    setCompanyDialogOpen(true);
  };

  const handleEmployerEdit = (emp) => {
    setIsEmployerEdit(true);
    setEmployerDialogData(emp);
    setEmployerDialogOpen(true);
  };

  const handleEmployerCreate = () => {
    setIsEmployerEdit(false);
    setEmployerDialogData(null);
    setEmployerDialogOpen(true);
  };

  // Funciones para eliminación
  const handleDelete = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleActiveCompany = (company) => {
    api
      .patch(`api/agencia/companies/${company.id}/`, {
        name: company.email,
        is_active: !company.is_active,
      })
      .then((res) => {
        setCompanies((co) => co.map((c) => (c.id === res.data.id ? res.data : c)));
        setAlert({
          severity: "success",
          message: `Empresa ${
            res.data.is_active ? "activada" : "desactivada"
          } correctamente`,
        });
      })
      .catch(() =>
        setAlert({ severity: "error", message: "Error actualizando estado" })
      );
  };

  const handleToggleActiveEmployer = (employer) => {
    api
      .patch(`api/agencia/employers/${employer.id}/`, {
        email: employer.email,
        is_active: !employer.is_active,
      })
      .then((res) => {
        setEmployers((em) => em.map((e) => (e.id === res.data.id ? res.data : e)));
        setAlert({
          severity: "success",
          message: `Usuario ${
            res.data.is_active ? "activado" : "desactivado"
          } correctamente`,
        });
      })
      .catch(() =>
        setAlert({ severity: "error", message: "Error actualizando estado" })
      );
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "job") {
        await api.delete(`api/agencia/jobs/${deleteId}/`);
      } else if (deleteType === "company") {
        await api.delete(`api/agencia/companies/${deleteId}/`);
      } else if (deleteType === "employer") {
        await api.delete(`api/agencia/employers/${deleteId}/`);
      }
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error al eliminar", error);
    }
  };

  return (
    <Box p={2}>
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Empresas" />
        <Tab label="Empleadores" />
        <Tab label="Empleos" />
      </Tabs>

      {tabIndex === 0 && (
        <Box>
          <Button
            variant="contained"
            onClick={handleCompanyCreate}
            endIcon={<AddBusinessOutlinedIcon />}
          >
            Crear Empresa
          </Button>
          <CompaniesDataGrid
            rows={companies}
            onEdit={handleCompanyEdit}
            onDelete={(id) => handleDelete("company", id)}
            handleToggleActive={handleToggleActiveCompany}
            isLoading={isLoading}
          />
        </Box>
      )}

      {tabIndex === 1 && (
        <Box>
          <Button
            variant="contained"
            onClick={handleEmployerCreate}
            endIcon={<PersonAddAlt />}
          >
            Crear Empleador
          </Button>
          <EmployersDataGrid
            rows={employers}
            onEdit={handleEmployerEdit}
            onDelete={(id) => handleDelete("employer", id)}
            handleToggleActive={handleToggleActiveEmployer}
            isLoading={isLoading}
          />
        </Box>
      )}

      {tabIndex === 2 && (
        <Box>
          <Button
            variant="contained"
            onClick={handleJobCreate}
            endIcon={<PostAddOutlinedIcon />}
          >
            Crear Empleo
          </Button>
          <JobsDataGrid
            rows={jobs}
            onEdit={handleJobEdit}
            onDelete={(id) => handleDelete("job", id)}
            isLoading={isLoading}
          />
        </Box>
      )}

      <JobFormDialog
        open={jobDialogOpen}
        data={jobDialogData}
        isEdit={isJobEdit}
        onClose={() => setJobDialogOpen(false)}
        onSubmit={() => {
          setJobDialogOpen(false);
          // fetchData();
        }}
        companies={companies}
        setJobs={setJobs}
        setAlert={setAlert}
      />

      <CompanyFormDialog
        open={companyDialogOpen}
        data={companyDialogData}
        isEdit={isCompanyEdit}
        onClose={() => setCompanyDialogOpen(false)}
        onSubmit={() => {
          setCompanyDialogOpen(false);
          // fetchData();
        }}
        setCompanies={setCompanies}
        setAlert={setAlert}
      />

      <EmployerFormDialog
        open={employerDialogOpen}
        data={employerDialogData}
        isEdit={isEmployerEdit}
        onClose={() => setEmployerDialogOpen(false)}
        onSubmit={() => {
          setEmployerDialogOpen(false);
          // fetchData();
        }}
        companies={companies}
        setEmployers={setEmployers}
        setAlert={setAlert}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={alert ? alert.severity : 'info' }
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert ? alert.message : ""}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobsCompaniesPage;