import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useSelector } from 'react-redux';

const ConnectionStatusDialog = () => {
  const {
    isNetworkOnline,
    isBackendReachable,
    isWsConnected,
    isWsConnecting,
    isProviderInitializing,
    isChecking,
    isConnected,
    hasRealTimeConnection
  } = useConnectionStatus();
  
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Only show blocking dialog for critical connectivity issues
  const shouldShowBlockingDialog = isAuthenticated && !isConnected && !isWsConnecting && !isProviderInitializing;
  
  // Show non-blocking notification when WebSocket is down but HTTP works
  const shouldShowWebSocketWarning = isAuthenticated && isConnected && !hasRealTimeConnection && !isWsConnecting && !isProviderInitializing;

  const handleRetry = () => {
    window.location.reload();
  };

  // Determine what to display based on the current status
  const getDialogContent = () => {
    if (!isNetworkOnline) {
      return {
        icon: <WifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: 'Sin Conexión a Internet',
        body: 'Parece que has perdido la conexión a internet. Por favor, revisa tu conexión para continuar.',
        showRetry: false
      };
    } else if (isWsConnecting || isProviderInitializing || isChecking) {
      return {
        icon: <CircularProgress size={60} sx={{ color: 'warning.main' }} />,
        title: 'Reconectando...',
        body: 'Intentando restablecer la conexión con el servidor.',
        showRetry: false
      };
    } else {
      return {
        icon: <SignalWifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: 'Error de Conexión al Servidor',
        body: 'No se pudo establecer una conexión con el servidor. Por favor, verifica tu conexión a internet o intenta recargar la página.',
        showRetry: true
      };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      {/* Blocking dialog - only shows for critical backend connectivity issues */}
      <Dialog 
        open={shouldShowBlockingDialog}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            minWidth: 320,
            maxWidth: 400,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            {dialogContent.icon}
            <Typography variant="h5" component="span" sx={{ mt: 2 }}>
              {dialogContent.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {dialogContent.body}
          </Typography>
          
          {dialogContent.showRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{ mt: 2 }}
            >
              Recargar Página
            </Button>
          )}
          
          {/* Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" component="div">
                Network: {isNetworkOnline ? '✓' : '✗'} | 
                Backend: {isBackendReachable ? '✓' : '✗'} | 
                WS: {isWsConnected ? '✓' : '✗'}
              </Typography>
              <Typography variant="caption" component="div">
                Connecting: {isWsConnecting ? 'Yes' : 'No'} | 
                Initializing: {isProviderInitializing ? 'Yes' : 'No'}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Non-blocking WebSocket warning */}
      <Snackbar
        open={shouldShowWebSocketWarning}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ 
            minWidth: 300,
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
        >
          <Typography variant="body2" component="div">
            <strong>Conexión limitada</strong>
          </Typography>
          <Typography variant="caption" component="div">
            Las actualizaciones en tiempo real no están disponibles. La aplicación funciona normalmente.
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default ConnectionStatusDialog;