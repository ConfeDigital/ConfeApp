import React, { useState, useContext, forwardRef, useEffect } from "react";
import { Sidebar as ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import { tokens } from "../../theme";
import { SidebarContext } from "./SidebarContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useSelector } from "react-redux";

const Item = ({ title, to, icon, selected }) => { // Removed setSelected prop
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <MenuItem
      component={<Link to={to} />}
      active={selected === title}
      icon={icon}
      style={{
        color: colors.grey[100],
      }}
    >
      {title}
    </MenuItem>
  );
};

const Sidebar = forwardRef((props, ref) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selected, setSelected] = useState("Inicio"); // Default to "Inicio" or your default route name
  const { isCollapsed, toggleCollapsed } = useContext(SidebarContext);
  const location = useLocation(); // Get the current location object

  // Get the current user from Redux
  const { user } = useSelector((state) => state.auth);
  const isStaff = user?.is_staff;

  // Helper: returns true if user is staff or belongs to the given group.
  const hasGroup = (groupName) => {
    if (isStaff) return true;
    return user?.groups?.some(
      (group) => group.name.toLowerCase() === groupName.toLowerCase()
    );
  };

  const logoSrc = theme.palette.mode === "dark" ? `../../assets/logoConfeBlanco.png` : `../../assets/logoConfe-sin-AC-transparente.png`;

  useEffect(() => {
    // Function to determine the active menu item based on the current path
    const setActiveItem = () => {
      const pathname = location.pathname;

      // Define a mapping of paths to sidebar titles
      const pathMap = {
        '/empleador': 'Panel de Empleos',
        // Add more mappings for your routes
      };
      
      // Find the corresponding title in the pathMap
      const activeTitle = pathMap[pathname];

      // If a match is found, update the selected state
      if (activeTitle) {
        setSelected(activeTitle);
      } 
      else if (pathname.startsWith('/candidatos/')) {
        setSelected('Consulta General');
      } else if (pathname.startsWith('/seguimiento-candidatos/')) {
        setSelected('Seguimiento');
      } else {
        // Optionally set a default if no match is found (e.g., 'Inicio')
        setSelected(null);
      }
    };

    // Call setActiveItem on initial render and whenever the location changes
    setActiveItem();
  }, [location]); // Re-run effect when location changes

  return (
    <Box
      ref={ref}
      sx={{
        "& .ps-sidebar-container": {
          background: `${colors.primaryBackground[400]} !important`,
        },
        "& .ps-menu-button": {
          padding: "5px 35px 5px 20px !important",
          "&:hover": {
            color: `${colors.blueAccent[600]} !important`,
            backgroundColor: 'transparent !important',
          },
        },
        "& .ps-menu-button.ps-active": {
          color: `${colors.blueAccent[500]} !important`,
        },
        "& .ps-submenu-content": {
          marginLeft: 3,
          backgroundColor: `${colors.primaryBackground[400]} !important`,
        },
        "& .ps-submenu-content .ps-menu-button": {
          color: `${colors.grey[100]} !important`,
          "&:hover": {
            color: `${colors.blueAccent[600]} !important`,
            backgroundColor: 'transparent !important',
          },
        },
        "& .ps-submenu-content .ps-menu-button.ps-active": {
          color: `${colors.blueAccent[500]} !important`,
        },
      }}
      display="flex"
      height="100%"
    >
      <ProSidebar
        collapsed={isCollapsed}
        width="250px"
        collapsedWidth="80px"
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Menu>
          {/* Logo and Menu Toggle */}
          <MenuItem
            onClick={toggleCollapsed}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Box flex={1} display="flex" justifyContent="center">
                  <img
                    alt="CONFE"
                    width="60px"
                    height="60px"
                    src={logoSrc}
                    style={{ borderRadius: "10%" }}
                  />
                </Box>
                <MenuOpenOutlinedIcon />
              </Box>
            )}
          </MenuItem>

          {/* Menu Items */}
          <Box>
            <Item
              title="Panel de Empleos"
              to="/empleador"
              icon={<WorkOutlineIcon />}
              selected={selected}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
});

export default Sidebar;