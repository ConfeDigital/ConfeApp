import React, { useState, useContext } from "react";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    Tooltip,
} from "@mui/material";
import {
    Menu as MenuIcon,
    Help,
    QuestionAnswer,
    BugReport,
    Feedback,
    Home,
    Close,
    LightModeOutlined as LightModeOutlinedIcon,
    DarkModeOutlined as DarkModeOutlinedIcon,
    Contrast as ContrastIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { tokens, ColorModeContext } from "../../theme";

const drawerWidth = 280;

const helpNavigation = [
    {
        title: "Inicio",
        path: "/help",
        icon: <Home />,
    },
    {
        title: "Guía de Usuario",
        path: "/help/user-guide",
        icon: <Help />,
    },
    {
        title: "Preguntas Frecuentes",
        path: "/help/faq",
        icon: <QuestionAnswer />,
    },
    {
        title: "Reportar Error",
        path: "/help/report-bug",
        icon: <BugReport />,
    },
    {
        title: "Enviar Comentarios",
        path: "/help/feedback",
        icon: <Feedback />,
    },
];

export default function HelpLayout({ children }) {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, cycleColorMode } = useContext(ColorModeContext);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const logoSrc = theme.palette.mode === "dark" ? `../../assets/logoConfeBlanco.png` : `../../assets/logoConfe-sin-AC-transparente.png`;

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box flex={1} display="flex" justifyContent="center">
                        <img
                            alt="CONFE"
                            width="60px"
                            height="60px"
                            src={logoSrc}
                            style={{ borderRadius: "10%" }}
                        />
                    </Box>
                    {isMobile && (
                        <IconButton onClick={handleDrawerToggle} size="small">
                            <Close />
                        </IconButton>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Centro de Ayuda y Soporte
                </Typography>
            </Box>

            {/* Navigation */}
            <List sx={{ flexGrow: 1, pt: 1 }}>
                {helpNavigation.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                "&.Mui-selected": {
                                    backgroundColor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                    "&:hover": {
                                        backgroundColor: theme.palette.primary.dark,
                                    },
                                    "& .MuiListItemIcon-root": {
                                        color: theme.palette.primary.contrastText,
                                    },
                                },
                                "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 40,
                                    color: location.pathname === item.path
                                        ? theme.palette.primary.contrastText
                                        : theme.palette.text.secondary,
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.title}
                                primaryTypographyProps={{
                                    fontSize: "0.9rem",
                                    fontWeight: location.pathname === item.path ? 600 : 400,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary" align="center">
                    © 2024 ConfeApp
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                    Versión 1.0.0
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {/* App Bar for Mobile */}
            {isMobile ? (
                <AppBar
                    position="fixed"
                    sx={{
                        width: { md: `calc(100% - ${drawerWidth}px)` },
                        ml: { md: `${drawerWidth}px` },
                        display: { md: "none" },
                    }}
                >
                    <Toolbar>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" noWrap component="div">
                                ConfeApp Help
                            </Typography>
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
                        </Box>
                    </Toolbar>
                </AppBar>
            ) : (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        zIndex: 1300, // Make sure it's above most content
                    }}
                >
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
                </Box>
            )}

            {/* Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: "100vh",
                    backgroundColor: theme.palette.background.default,
                }}
            >
                {/* Mobile spacing */}
                {isMobile && <Toolbar />}

                {/* Page content */}
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
