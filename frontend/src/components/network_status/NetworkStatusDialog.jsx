import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

/**
 * A dialog component that shows or hides based on the user's network status.
 * It listens for 'online' and 'offline' browser events.
 *
 * @returns {JSX.Element} The network status dialog.
 */
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Handler for when the browser comes online
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handler for when the browser goes offline
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners for online and offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners when the component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Dialog open={!isOnline}>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <WifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography variant="h5" component="span" sx={{ mt: 1 }}>
            Sin Conexión a Internet
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1">
          Parece que has perdido la conexión a internet. Por favor, revisa tu conexión para continuar.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkStatus;
