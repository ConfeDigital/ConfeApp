import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import "./main.css";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  checkAndFetchUser,
  setUnauthenticated,
  checkAndRefreshToken,
} from "./features/auth/authSlice";
import { SidebarProvider } from "./components/toolpad/SidebarContext";
import { MsalProvider } from "@azure/msal-react";
import { AUTH_TYPE, ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";
import { configureApi } from "./api";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

import DashboardLayout from "./components/toolpad/DashboardLayout";
import WebSocketProvider from "./websocket/WebSocketProvider";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import ResetPasswordConfirm from "./pages/auth/ResetPasswordConfirm";
import Activate from "./pages/auth/Activate";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import InActive from "./pages/InActive";
import Dashboard from "./pages/scenes/Dashboard";
import CandidateConsult from "./pages/scenes/CandidateConsult";
import Calendar from "./pages/scenes/Calendar";
import CalendarMicrosoft from "./pages/scenes/CalendarMicrosoft";
import Datasheet from "./pages/scenes/Datasheet";
import DatasheetReadOnly from "./pages/scenes/DatasheetReadOnly";
import ProtectedRoute from "./components/ProtectedRoute";
import reactDebugHooks from "react-debug-hooks";
import Cuestionarios from "./pages/cuestionarios/Cuestionarios";
import CargaMasivaCuestionario from "./pages/cuestionarios/CargaMasivaCuestionario";
import Profile from "./pages/scenes/Profile";
import Disabilities from "./pages/scenes/Disabilities";
import TechnicalAids from "./pages/scenes/TechnicalAids";
import SISAids from "./pages/scenes/SISAids";
import CHAids from "./pages/scenes/CHAids";
import AgenciaLaboralDashboard from "./pages/scenes/AgenciaLaboral";
import AdminAgencia from "./pages/scenes/AdminAgencia";
import CandidateCreate from "./pages/scenes/CandidateCreate";
import CandidateEdit from "./pages/scenes/CandidateEdit";
import Settings from "./pages/scenes/Settings";
import ManagerSettings from "./pages/scenes/ManagerSettings";
import AdminPanel from "./pages/scenes/AdminPanel";
import BaseCuestionarios from "./pages/cuestionarios/BaseCuestionarios";
import CuestionarioDetail from "./pages/cuestionarios/CuestionarioDetail";
import Info from "./pages/Info";
import CandidateDatasheet from "./pages/candidatos/CandidateDatasheet";
import CandidateDashboard from "./pages/candidatos/CandidateDashboard";
import Preentrevista from "./pages/cuestionarios/Preentrevista";
import CargaMasivaCandidatos from "./pages/scenes/cargaMasivaCandidatos";
import CargaMasivaRespuestas from "./pages/scenes/CargaMasivaRespuestas";
import CandidateAidHistory from "./pages/scenes/CandidateAidHistory";
import CandidateJobHistory from "./pages/scenes/CandidateJobHistory";
import TablasEquivalencia from "./pages/tablas_de_equivalencia/TablasEquivalencia";
import TablaDetalle from "./pages/tablas_de_equivalencia/TablaDetalle";
import NavegacionSeguimiento from "./pages/seguimiento/NavegacionSeguimiento";
import Seguimiento from "./pages/seguimiento/Seguimiento";
import ProyectoDeVidaSeguimiento from "./pages/seguimiento/ProyectoDeVidaSeguimiento";
import PaginaCuestionario from "./pages/cuestionarios/PaginaCuestionario";
import EmployerPanel from "./pages/empleadores/EmployerPanel";
import EmployerProfile from "./pages/empleadores/EmployerProfile";
import JobCandidatesPage from "./pages/empleadores/JobCandidatesPage";
import QuestionnaireInterface from "./pages/cuestionarios/questionnaireInterface/QuestionnaireInterface";
import Announcements from "./pages/scenes/Announcements";
import CenterChat from "./pages/scenes/CenterChat";
import CenterForum from "./pages/scenes/CenterForum";
import ProfileFieldDemo from "./pages/ProfileFieldDemo"

import { onSessionExpired } from "./components/session_expired/sessionExpiredEvent";
import SessionExpiredDialog from "./components/session_expired/SessionExpiredDialog";
import ConnectionStatusDialog from "./components/network_status/ConnectionStatusDialog";

reactDebugHooks(React);

function Logout({ instance }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const authType = sessionStorage.getItem(AUTH_TYPE);

    dispatch(setUnauthenticated());

    if (authType === "msal") {
      sessionStorage.removeItem(AUTH_TYPE);
      sessionStorage.removeItem(ACCESS_TOKEN);
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
      instance.setActiveAccount(null); // Clear active account
    } else if (authType === "djoser") {
      sessionStorage.removeItem(ACCESS_TOKEN);
      sessionStorage.removeItem(REFRESH_TOKEN);
      sessionStorage.removeItem(AUTH_TYPE);
      navigate("/");
    } else {
      navigate("/");
    }
  }, [instance, dispatch, navigate]);
  navigate("/");
}

function RegisterAndLogout({ instance }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const authType = sessionStorage.getItem(AUTH_TYPE);

    dispatch(setUnauthenticated());

    if (authType === "msal") {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
      instance.setActiveAccount(null); // Clear active account
    }
  }, [instance, dispatch]);

  sessionStorage.clear();
  return <Register />;
}

function App({ instance }) {
  const [{ theme, mode, resolvedMode }, { cycleColorMode }] = useMode();
  const dispatch = useDispatch();

  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    onSessionExpired(() => {
      setShowSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    const authType = sessionStorage.getItem(AUTH_TYPE);
    const activeAccount = instance.getActiveAccount();

    configureApi(instance);

    if (activeAccount) {
      dispatch(checkAndFetchUser(instance));
    } else if (authType === "djoser") {
      dispatch(checkAndRefreshToken());
    } else {
      dispatch(setUnauthenticated());
    }
  }, [instance, dispatch]);

  return (
    <BrowserRouter>
      <MsalProvider instance={instance}>
        <WebSocketProvider instance={instance}>
          <ColorModeContext.Provider
            value={{ cycleColorMode, mode, resolvedMode }}
          >
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout instance={instance} />} />
                  <Route path="/register" element={<RegisterAndLogout instance={instance} />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/password/reset/confirm/:uid/:token" element={<ResetPasswordConfirm />} />
                  <Route path="/activate/:uid/:token" element={<Activate />} />
                  <Route path="/info" element={<Info />} />
                  <Route path="/no-autorizado" element={<InActive />} />
                  <Route path="*" element={<NotFound />} />

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["candidatos"]}>
                        <Outlet />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/candidato/perfil" element={<CandidateDatasheet />} />
                    <Route path="/candidato/dashboard" element={<CandidateDashboard />} />
                    <Route path="/candidato/preentrevista" element={<Preentrevista />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["empleador"]}>
                        <SidebarProvider>
                          <DashboardLayout employer={true} />
                        </SidebarProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/empleador" element={<EmployerPanel />} />
                    <Route path="/empleador/perfil" element={<EmployerProfile />} />
                    <Route path="/empleador/empleo/:jobId" element={<JobCandidatesPage />} />
                    <Route path="/empleador/configuracion" element={<Settings />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SidebarProvider>
                          <DashboardLayout />
                        </SidebarProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/cuestionarios" element={<Cuestionarios />} />
                    <Route path="/cargaMT" element={<CargaMasivaCuestionario />} />
                    <Route path="/baseCuestionarios" element={<BaseCuestionarios />} />
                    <Route path="/baseCuestionarios/:id" element={<CuestionarioDetail />} />
                    <Route path="/baseCuestionarios/:idBase/:idCuestionario" element={<QuestionnaireInterface />} />
                    <Route path="/tablas-de-equivalencia" element={<TablasEquivalencia />} />
                    <Route path="/tablas-de-equivalencia/:id" element={<TablaDetalle />} />
                    <Route path="/panel-de-administracion" element={<AdminPanel />} />
                    <Route path="/cargaMasiva" element={<CargaMasivaCandidatos />} />
                    <Route path="/carga-masiva-respuestas" element={<CargaMasivaRespuestas />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["admin", "gerente"]}>
                        <SidebarProvider>
                          <DashboardLayout />
                        </SidebarProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/configuracion-del-centro"
                      element={<ManagerSettings />}
                    />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["personal"]}>
                        <SidebarProvider>
                          <DashboardLayout />
                        </SidebarProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/candidatos" element={<CandidateConsult />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/calendar-microsoft" element={<CalendarMicrosoft />} />
                    <Route path="/candidatos/:uid" element={<Datasheet />} />
                    <Route path="/candidatos/visualizar/:uid" element={<DatasheetReadOnly />} />
                    <Route path="/candidatos/:uid/:cuestionarioId" element={<PaginaCuestionario />} />
                    <Route path="/seguimiento-candidatos/:uid" element={<Seguimiento />} />
                    <Route path="/seguimiento-candidatos" element={<NavegacionSeguimiento />} />
                    <Route path="/dashboard/*" element={<NotFound />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/candidatos/crear" element={<CandidateCreate />} />
                    <Route path="/candidatos/editar/:uid" element={<CandidateEdit />} />
                    <Route path="/candidatos/historial-apoyos/:uid" element={<CandidateAidHistory />} />
                    <Route path="/candidatos/historial-empleos/:uid" element={<CandidateJobHistory />} />
                    <Route path="/candidatos/proyecto-vida/:uid" element={<ProyectoDeVidaSeguimiento />} />
                    <Route path="/discapacidades" element={<Disabilities />} />
                    <Route path="/apoyos/evaluacion-diagnostica" element={<TechnicalAids />} />
                    <Route path="/apoyos/SIS" element={<SISAids />} />
                    <Route path="/apoyos/cuadro-habilidades" element={<CHAids />} />
                    <Route path="/configuracion" element={<Settings />} />
                    <Route path="/anuncios" element={<Announcements />} />
                    <Route path="/comunicacion-centros" element={<CenterChat />} />
                    <Route path="/foro" element={<CenterForum />} />
                    <Route path="/demo" element={<ProfileFieldDemo />} />
                  </Route>
                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["agencia_laboral"]}>
                        <SidebarProvider>
                          <DashboardLayout />
                        </SidebarProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/agencia-laboral/dashboard" element={<AgenciaLaboralDashboard />} />
                    <Route path="/agencia-laboral/empleo/:jobId" element={<JobCandidatesPage />} />
                    <Route path="/agencia-laboral/administracion" element={<AdminAgencia />} />
                  </Route>
                </Routes>
                <SessionExpiredDialog
                  open={showSessionExpired}
                  onClose={() => setShowSessionExpired(false)}
                />
                <ConnectionStatusDialog />
              </LocalizationProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </WebSocketProvider>
      </MsalProvider>
    </BrowserRouter>
  );
}

export default App;
