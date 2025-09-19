import { Box, IconButton, Popover, Typography, List, ListItem, Divider, useTheme, Menu, MenuItem, Avatar, Badge, Tooltip, TextField, InputAdornment, Paper, ListItemIcon, ListItemText } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../theme";
import { SidebarContext } from "./SidebarContext";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ContrastIcon from '@mui/icons-material/Contrast';
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
// NEW: Import the CheckCircleOutlineIcon for the "mark as read" button
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markAsRead } from "../../features/notifications/notificationsSlice";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import LogoutConfirmationDialog from "../LogoutConfirmationDialog";
import { getSearchablePages, searchPages } from "./searchablePages.jsx";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { cycleColorMode, mode } = useContext(ColorModeContext);

  const { isCollapsed, toggleCollapsed } = useContext(SidebarContext);

  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const user = useSelector((state) => state.auth.user);
  const isStaff = user?.is_staff;
  
  const navigate = useNavigate();
  const location = useLocation();
  const { instance } = useMsal();

  const [pageTitle, setPageTitle] = useState(document.title);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [searchAnchor, setSearchAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openSearch, setOpenSearch] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogout = () => {
    navigate("/logout");
  };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const handleTitleChange = (event) => {
      setPageTitle(event.detail);
    };

    window.addEventListener('documentTitleChanged', handleTitleChange);

    return () => {
      window.removeEventListener('documentTitleChanged', handleTitleChange);
    };
  }, []);

  // Notification Handlers
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
    setOpenNotifications(!openNotifications);
  };

  const handleNotificationClose = () => {
    setOpenNotifications(false);
  };

  // Handles clicking the notification text/row
  const handleNotificationNavigateAndRead = (notification) => {
    if (notification.link) { // Only navigate if a link exists
      if (location.pathname == notification.link) {
        navigate(`${location.pathname}?refresh=${Date.now()}`, { replace: true });
      } else {
        navigate(notification.link); 
      }
    }
    dispatch(markAsRead(notification.id));
    handleNotificationClose(); // Close the popover after action
  };

  // Handles clicking the "Mark as Read" icon
  const handleMarkOnlyAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
    // No navigation here, just mark as read
  };


  // User Menu Handlers
  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Settings Handlers
  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleExitDashboard = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  }

  function stringAvatar(name, size, fontsize) {
    return {
      sx: { bgcolor: stringToColor(name), width: size, height: size, fontSize: fontsize, fontWeight: 500 },
      children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
    };
  }

  const hasGroup = (groupName) => {
    if (isStaff) return true;
    return user?.groups?.some(
      (group) => group.name.toLowerCase() === groupName.toLowerCase()
    );
  };

  // Get searchable pages based on user permissions
  const searchablePages = getSearchablePages(hasGroup, isStaff);

  // Search handlers
  const handleSearchClick = (event) => {
    setSearchAnchor(event.currentTarget);
    setOpenSearch(!openSearch);
  };

  const handleSearchClose = () => {
    setOpenSearch(false);
    setSearchTerm("");
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchItemClick = (path) => {
    navigate(path);
    handleSearchClose();
  };

  // Filter pages based on search term (searches title, description, and keywords)
  const filteredPages = searchPages(searchablePages, searchTerm);

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* Left Section */}
      <Box display="flex">
        <IconButton onClick={toggleCollapsed} sx={{ display: { xs: "block", md: "none" } }}>
          <MenuOutlinedIcon />
        </IconButton>
        <Tooltip title="Regresar">
          <IconButton
            onClick={handleGoBack}
          >
            <ArrowBackIosNewIcon/>
          </IconButton>
        </Tooltip>
        <Typography
          variant="h2"
          color={colors.grey[100]}
          fontWeight="bold"
          alignSelf='center'
          sx={{
            ml: 1,
            fontSize: {
              xs: '1rem',
              sm: '1.5rem',
              md: '2rem',
            },
          }}
        >
          {pageTitle}
        </Typography>
      </Box>

      {/* Right Section */}
      <Box display="flex">
        <Tooltip title="Buscar páginas">
          <IconButton onClick={handleSearchClick}>
            <SearchIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={
          mode === "light"
            ? "Claro"
            : mode === "dark"
            ? "Oscuro"
            : "Sistema"
        }>
          <IconButton onClick={cycleColorMode}>
            {mode === "light" && <LightModeOutlinedIcon />}
            {mode === "dark" && <DarkModeOutlinedIcon />}
            {mode === "system" && <ContrastIcon />}
          </IconButton>
        </Tooltip>

        {/* Notification Icon */}
        <Tooltip title="Notificaciones">
          <IconButton onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="warning">
              <NotificationsOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Configuración">
          <IconButton component={Link} to={hasGroup("personal") ? "/configuracion" : hasGroup("empleador") ? "/empleador/configuracion" : "/"} >
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <IconButton onClick={handleMenuClick}>
          <Avatar {...stringAvatar(user.first_name + " " + user.last_name, 21, '0.8rem')} />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{ mt: 1 }}
        >
          {/* User Info Section */}
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar {...stringAvatar(user.first_name + " " + user.last_name, 40, '1.5rem')} />
            <Box>
              <Typography variant="body1" fontWeight="bold">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Divider />
        
          {/* Menu Items */}
          <MenuItem onClick={handleMenuClose} component={Link} to={hasGroup("personal") ? "/profile" : hasGroup("empleador") ? "/empleador/perfil" : "/"}>
            <PersonOutlinedIcon sx={{ mr: 1 }} />
            Mi Perfil
          </MenuItem>
          {hasGroup("gerente") && (
            <MenuItem onClick={handleMenuClose} component={Link} to="/configuracion-del-centro">
              <ManageAccountsOutlinedIcon sx={{ mr: 1 }} />
              Configuración del Centro
            </MenuItem>
          )}
          {hasGroup("admin") && (
            <>
              <MenuItem onClick={handleMenuClose} component={Link} to="/panel-de-administracion">
                <AdminPanelSettingsOutlinedIcon sx={{ mr: 1 }} />
                Panel de Administración
              </MenuItem>
            </>
          )}
          <Divider />
          <MenuItem onClick={() => setDialogOpen(true)} component={Link}>
            <LogoutIcon sx={{ mr: 1 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>

      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 300, maxHeight: 400, overflowY: "auto" }}>
          <Typography variant="h6" sx={{ p: 2 }}>Notificaciones</Typography>
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                // We no longer attach the main click handler to the ListItem directly
                sx={{
                  backgroundColor: notification.is_read ? "transparent" : theme.palette.action.selected, // Use theme colors
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": {
                    backgroundColor: notification.is_read ? theme.palette.action.hover : theme.palette.action.focus,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    cursor: notification.link ? "pointer" : "default", // Show pointer only if there's a link
                    pr: 1, // Add some padding to the right for the icon
                  }}
                  onClick={() => handleNotificationNavigateAndRead(notification)}
                >
                  <Typography variant="body2" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(notification.created_at).toLocaleString()}
                  </Typography>
                </Box>
                {!notification.is_read ? (
                  <Tooltip title="Marcar como leída">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent ListItem's onClick from firing
                        handleMarkOnlyAsRead(notification.id);
                      }}
                    >
                      <RadioButtonUncheckedIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                ):(
                  <Tooltip title="Notificación leída">
                    <CheckCircleOutlineIcon color="primary" />
                  </Tooltip>
                )}
              </ListItem>
            ))}
            {notifications.length === 0 && (
              <Typography sx={{ p: 2 }}>Sin Notificaciones</Typography>
            )}
          </List>
        </Box>
      </Popover>
      {/* Search Popover */}
      <Popover
        open={openSearch}
        anchorEl={searchAnchor}
        onClose={handleSearchClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Paper sx={{ width: 350, maxHeight: 400 }}>
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar páginas..."
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <List sx={{ maxHeight: 300, overflowY: "auto" }}>
            {filteredPages.map((page) => (
              <ListItem
                key={page.path}
                onClick={() => handleSearchItemClick(page.path)}
                sx={{
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  cursor: "pointer",
                }}
              >
                <ListItemIcon>
                  {page.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={page.title}
                  secondary={page.description}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: "0.95rem"
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.8rem",
                    color: "text.secondary"
                  }}
                />
              </ListItem>
            ))}
            {filteredPages.length === 0 && searchTerm.trim() && (
              <ListItem>
                <ListItemText 
                  primary="No se encontraron páginas" 
                  secondary="Intenta con otros términos de búsqueda"
                  sx={{ textAlign: "center" }}
                  primaryTypographyProps={{
                    color: "text.secondary"
                  }}
                  secondaryTypographyProps={{
                    color: "text.secondary",
                    fontSize: "0.8rem"
                  }}
                />
              </ListItem>
            )}
            {!searchTerm.trim() && (
              <ListItem>
                <ListItemText 
                  primary="Escribe para buscar páginas..." 
                  secondary="Busca por nombre, descripción o palabras clave"
                  sx={{ textAlign: "center" }}
                  primaryTypographyProps={{
                    color: "text.secondary"
                  }}
                  secondaryTypographyProps={{
                    color: "text.secondary",
                    fontSize: "0.8rem"
                  }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Popover>

      <LogoutConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </Box>
  );
};

export default Topbar;