import { useState, useEffect, useRef, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SidebarEmpleador from './SidebarEmpleador';
import Topbar from './Topbar';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { SidebarContext } from './SidebarContext';

const DashboardLayout = ({ employer }) => {
  const { isCollapsed, toggleCollapsed } = useContext(SidebarContext);
  const sidebarRef = useRef(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSmallScreen && sidebarRef.current && !sidebarRef.current.contains(event.target) && !isCollapsed) {
        toggleCollapsed();
      }
    };

    if (isSmallScreen && !isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, toggleCollapsed, isSmallScreen]);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box // Sidebar container
        sx={{
          ...(isSmallScreen
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1200,
                height: '100vh', // Ensure full height
                width: 'auto',
              }
            : {
                height: '100vh', // Ensure full height
                width: 'inherit',
                overflowY: 'auto',
              }),
        }}
      >
        {!employer ? (
          <Sidebar ref={sidebarRef} />
        ):(
          <SidebarEmpleador ref={sidebarRef} />
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ...(isSmallScreen
            ? {
                width: '100%',
                position: 'relative',
                zIndex: 1,
              }
            : {
                width: 'calc(100% - 250px)',
              }),
        }}
      >
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <Topbar />
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;