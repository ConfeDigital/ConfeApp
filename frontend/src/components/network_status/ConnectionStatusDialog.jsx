import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import { useWebSocketStatus } from '../../websocket/WebSocketContext';
import { useSelector } from 'react-redux';

/**
 * A dialog component that checks for both network and backend server connectivity.
 * It prioritizes displaying the network status message if the device is offline,
 * and uses the WebSocket status for backend connectivity.
 */
const ConnectionStatusDialog = () => {
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const { isWsConnected, isWsConnecting, isProviderInitializing } = useWebSocketStatus();
  // Get the authentication status from the Redux store
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Effect to handle network online/offline events
  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // The dialog is open if the network is offline OR the WebSocket is not connected, the user is authenticated,
  // AND the application is NOT currently in the process of trying to connect.
  const isDialogOpen = !isNetworkOnline || (!isWsConnected && isAuthenticated && !isWsConnecting && !isProviderInitializing);
  
  // Determine what to display based on the current status
  const dialogContent = !isNetworkOnline ? (
    {
      icon: <WifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />,
      title: 'Sin Conexión a Internet',
      body: 'Parece que has perdido la conexión a internet. Por favor, revisa tu conexión para continuar.',
    }
  ) : (
    {
      icon: <SignalWifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />,
      title: 'Error de Conexión al Servidor',
      body: 'No se pudo establecer una conexión con el servidor. Por favor, verifica tu conexión a internet, recarga tu página o intenta de nuevo más tarde.',
    }
  );

  return (
    <Dialog open={isDialogOpen}>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          {dialogContent.icon}
          <Typography variant="h5" component="span" sx={{ mt: 1 }}>
            {dialogContent.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1">
          {dialogContent.body}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionStatusDialog;
