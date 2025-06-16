import React, { useContext, useState } from "react";
import {
  AppBar, // Use AppBar for the main bar
  Toolbar, // Use Toolbar inside AppBar for content alignment
  Box,
  Button,
  IconButton,
  useTheme,
  Tooltip,
  Drawer, // For the mobile menu
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ContrastIcon from "@mui/icons-material/Contrast";
import MenuIcon from "@mui/icons-material/Menu"; // Hamburger icon for mobile
import CloseIcon from "@mui/icons-material/Close"; // Close icon for drawer
import { ColorModeContext, tokens } from "../theme";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function NavBar() {
  const theme = useTheme();
  const { cycleColorMode, mode } = useContext(ColorModeContext);
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
  }));

  const [drawerOpen, setDrawerOpen] = useState(false); // State for mobile drawer

  // Determine if the user is staff.
  const isStaff = user?.is_staff;

  // Check group membership (case-insensitive).
  const belongsToGroup = (groupName) =>
    Array.isArray(user?.groups) &&
    user.groups.some(
      (group) => group?.name?.toLowerCase() === groupName.toLowerCase()
    );

  // Dashboard button is visible if the user is staff or in "personal".
  const dashboardAccess = isStaff || belongsToGroup("personal");
  // Mi Perfil button is visible only for non-staff users who belong to "candidatos".
  const showProfile = belongsToGroup("candidatos") && !isStaff;
  const dashboardAccessEmpleador = belongsToGroup("empleador") && !isStaff;

  const handleLogin = () => {
    navigate("/login");
    setDrawerOpen(false); // Close drawer on navigation
  };

  const handleDashboard = () => {
    if (dashboardAccess) navigate("/dashboard");
    else if (dashboardAccessEmpleador) navigate("/empleador");
    setDrawerOpen(false); // Close drawer on navigation
  };

  const handleProfile = () => {
    navigate("/candidato/perfil");
    setDrawerOpen(false); // Close drawer on navigation
  };

  // Determine the logo source based on the theme mode
  const logoSrc =
    theme.palette.mode === "dark"
      ? `../../assets/logoConfeBlanco.png`
      : `../../assets/logoConfe-sin-AC-transparente.png`;

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // Define navigation items for the desktop and mobile drawer
  const navItems = isAuthenticated ? (
    <>
      {(dashboardAccess || dashboardAccessEmpleador) && (
        <Button
          variant="contained"
          color="secondary"
          sx={{ textTransform: "none", mr: 2, display: { xs: "none", sm: "block" } }} // Hide on small screens
          onClick={handleDashboard}
        >
          Dashboard
        </Button>
      )}
      {showProfile && (
        <Button
          variant="contained"
          color="secondary"
          sx={{ textTransform: "none", mr: 2, display: { xs: "none", sm: "block" } }} // Hide on small screens
          onClick={handleProfile}
        >
          Mi Perfil
        </Button>
      )}
      <Button
        href="/logout"
        variant="contained"
        color="primary"
        sx={{ textTransform: "none", mr: 2, display: { xs: "none", sm: "block" } }} // Hide on small screens
      >
        Cerrar Sesión
      </Button>
    </>
  ) : (
    <Button
      variant="contained"
      color="primary"
      sx={{ textTransform: "none", mr: 2, display: { xs: "none", sm: "block" } }} // Hide on small screens
      onClick={handleLogin}
    >
      Iniciar Sesión
    </Button>
  );

  // Define drawer items separately for mobile
  const drawerItems = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={toggleDrawer(false)}>
            <IconButton>
              <CloseIcon />
            </IconButton>
            <ListItemText primary="Cerrar Menú" />
          </ListItemButton>
        </ListItem>
        <Divider />
        {isAuthenticated ? (
          <>
            {(dashboardAccess || dashboardAccessEmpleador) && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleDashboard}>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
            {showProfile && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleProfile}>
                  <ListItemText primary="Mi Perfil" />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton component="a" href="/logout">
                <ListItemText primary="Cerrar Sesión" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogin}>
              <ListItemText primary="Iniciar Sesión" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ backgroundColor: colors.primaryBackground[600] }}>
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 4 } }}>
        {/* Logo */}
        <Button component={NavLink} to="/" sx={{ p: 0, '&:hover': { bgcolor: 'transparent' } }}>
          <img
            alt="CONFE"
            width="50px" // Slightly smaller logo for better fit
            height="50px"
            src={logoSrc}
            style={{ borderRadius: "10%" }}
          />
        </Button>

        {/* Desktop Buttons */}
        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
          {navItems}
          {/* Theme Toggle is always visible */}
          <Tooltip
            title={
              mode === "light"
                ? "Claro"
                : mode === "dark"
                ? "Oscuro"
                : "Sistema"
            }
          >
            <IconButton onClick={cycleColorMode}>
              {mode === "light" && <LightModeOutlinedIcon />}
              {mode === "dark" && <DarkModeOutlinedIcon />}
              {mode === "system" && <ContrastIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Mobile Menu Icon */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center" }}>
          {/* Theme Toggle is always visible on mobile too */}
          <Tooltip
            title={
              mode === "light"
                ? "Claro"
                : mode === "dark"
                ? "Oscuro"
                : "Sistema"
            }
          >
            <IconButton onClick={cycleColorMode} sx={{ mr: 1 }}>
              {mode === "light" && <LightModeOutlinedIcon />}
              {mode === "dark" && <DarkModeOutlinedIcon />}
              {mode === "system" && <ContrastIcon />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="large"
            edge="end"
            aria-label="menu"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right" // Opens from the right
          open={drawerOpen}
          onClose={toggleDrawer(false)}
        >
          {drawerItems}
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}