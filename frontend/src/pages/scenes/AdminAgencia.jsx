import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment
} from "@mui/material";
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
import BusinessIcon from "@mui/icons-material/Business";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const JobsCompaniesPage = () => {
  useDocumentTitle("Administración Agencia");

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [view, setView] = useState('companies'); // 'companies' or 'company-detail'
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

  const [searchTerm, setSearchTerm] = useState("");


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

  // Filter jobs and employers by selected company
  const filteredJobs = selectedCompany
    ? jobs.filter(job => job.company === selectedCompany.id)
    : jobs;

  const filteredEmployers = selectedCompany
    ? employers.filter(employer => employer.company === selectedCompany.id)
    : employers;

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setView('company-detail');
    setTabIndex(0); // Reset to jobs tab
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setView('companies');
    setTabIndex(0);
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
          message: `Empresa ${res.data.is_active ? "activada" : "desactivada"
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
          message: `Usuario ${res.data.is_active ? "activado" : "desactivado"
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
      {view === 'companies' ? (
        // Companies List View
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <TextField
              size="small"
              label="Buscar empresa..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                },
            }}
            />
            <Button
              variant="contained"
              onClick={handleCompanyCreate}
              endIcon={<AddBusinessOutlinedIcon />}
            >
              Crear Empresa
            </Button>
          </Box>

          <Grid container spacing={3}>
            {companies
              .filter((company) =>
                company.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((company) => (
                <Grid item xs={12} sm={6} md={4} key={company.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          src={company.logo}
                          sx={{ width: 48, height: 48 }}
                        >
                          <BusinessIcon />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {company.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {company.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={`${jobs.filter(j => j.company === company.id).length} Empleos`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`${employers.filter(e => e.company === company.id).length} Empleadores`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={company.is_active ? "Activa" : "Inactiva"}
                          size="small"
                          color={company.is_active ? "success" : "default"}
                          variant={company.is_active ? "filled" : "outlined"}
                        />
                        <Box>
                          <Tooltip title="Editar Empresa">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompanyEdit(company);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* <Tooltip title="Eliminar Empresa">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete("company", company.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip> */}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      ) : (
        // Company Detail View
        <Box>
          {/* Breadcrumbs */}
          {/* <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body1"
              onClick={handleBackToCompanies}
              sx={{ textDecoration: 'none' }}
            >
              Empresas
            </Link>
            <Typography color="text.primary">
              {selectedCompany?.name}
            </Typography>
          </Breadcrumbs> */}

          {/* Company Header */}
          <Box display="flex" alignItems="center" gap={2} >
            <IconButton onClick={handleBackToCompanies}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar
              src={selectedCompany?.logo}
              sx={{ width: 64, height: 64 }}
            >
              <BusinessIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {selectedCompany?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedCompany?.email}
              </Typography>
            </Box>
          </Box>

          {/* Tabs for Jobs and Employers */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Tabs value={tabIndex} onChange={handleTabChange}>
              <Tab label="Empleos" />
              <Tab label="Empleadores" />
            </Tabs>
            {tabIndex === 0 ? (
              <Button
                variant="contained"
                onClick={handleJobCreate}
                endIcon={<PostAddOutlinedIcon />}
                sx={{ mb: 2 }}
              >
                Crear Empleo
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleEmployerCreate}
                endIcon={<PersonAddAlt />}
                sx={{ mb: 2 }}
              >
                Crear Empleador
              </Button>
            )}
          </Box>

          {tabIndex === 0 && (
            <Box>
              <JobsDataGrid
                rows={filteredJobs}
                onEdit={handleJobEdit}
                onDelete={(id) => handleDelete("job", id)}
                isLoading={isLoading}
                companyNameVisibility={false}
              />
            </Box>
          )}

          {tabIndex === 1 && (
            <Box>
              <EmployersDataGrid
                rows={filteredEmployers}
                onEdit={handleEmployerEdit}
                onDelete={(id) => handleDelete("employer", id)}
                handleToggleActive={handleToggleActiveEmployer}
                isLoading={isLoading}
                companyNameVisibility={false}
              />
            </Box>
          )}
        </Box>
      )}

      <JobFormDialog
        open={jobDialogOpen}
        data={jobDialogData}
        isEdit={isJobEdit}
        onClose={() => setJobDialogOpen(false)}
        onSubmit={() => {
          setJobDialogOpen(false);
          fetchData();
        }}
        companies={selectedCompany ? selectedCompany : companies}
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
          fetchData();
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
          fetchData();
        }}
        companies={selectedCompany ? selectedCompany : companies}
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
          severity={alert ? alert.severity : 'info'}
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