// src/pages/Settings.jsx
import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import useDocumentTitle from "../../hooks/useDocumentTitle";

import UsersSettings  from '../../components/settings/UserSettingsAdminPanel';
import CentersSettings from '../../components/settings/CentersSettings';

export default function Settings() {
  useDocumentTitle('Panel de Administración');
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 3 }} elevation={3}>
        <Tabs
          value={tabIndex}
          onChange={(e,v) => setTabIndex(v)}
          variant="fullWidth"
        >
          <Tab label="Usuarios del Sistema" />
          <Tab label="Centros" />
        </Tabs>
      </Paper>

      <Paper sx={{ width: '100%', p: 3 }} elevation={3}>
        {tabIndex === 0 && (
          <UsersSettings />
        )}
        {tabIndex === 1 && (
          <CentersSettings />
        )}
      </Paper>
    </Box>
  );
}
