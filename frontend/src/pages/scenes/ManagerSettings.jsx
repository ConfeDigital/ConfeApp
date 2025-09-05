// src/pages/Settings.jsx
import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Alert } from '@mui/material';
import useDocumentTitle from "../../hooks/useDocumentTitle";

import CyclesSettings from '../../components/settings/CyclesSettings';
import UsersSettings  from '../../components/settings/UsersSettings';

export default function ManagerSettings() {
  useDocumentTitle('Configuración del Centro');
  const [tabIndex, setTabIndex] = useState(0);
  const [alert, setAlert]     = useState(null);

  // Pass `alert` & setter down so child panels can report success/errors
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      {alert && (
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 3 }} elevation={3}>
        <Tabs
          value={tabIndex}
          onChange={(e,v) => setTabIndex(v)}
          variant="fullWidth"
        >
          <Tab label="Usuarios" />
          <Tab label="Ciclos" />
        </Tabs>
      </Paper>

      <Paper sx={{ width: '100%', p: 3 }} elevation={3}>
        {tabIndex === 0 && (
          <UsersSettings setAlert={setAlert} />
        )}
        {tabIndex === 1 && (
          <CyclesSettings setAlert={setAlert} />
        )}
      </Paper>
    </Box>
  );
}
