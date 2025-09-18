import React, { useState, useEffect } from 'react';
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
  IconButton, // Import IconButton
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncProblemIcon from '@mui/icons-material/SyncProblem'; // Icon for limited connection
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useWebSocketStatus } from '../../websocket/WebSocketContext';
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

  const { forceReconnect, smartReconnect } = useWebSocketStatus();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Determine if the subtle icon should be shown
  // Show warning if: authenticated AND no real-time connection (regardless of snackbar state)
  const shouldShowSubtleWarning = isAuthenticated && !hasRealTimeConnection && !isProviderInitializing;

  // Only show blocking dialog for critical connectivity issues (no HTTP connection)
  const shouldShowBlockingDialog = isAuthenticated && !isConnected && !isWsConnecting && !isProviderInitializing;

  // Show non-blocking notification if no real-time connection and not dismissed
  // const shouldShowWebSocketWarning = isAuthenticated && !hasRealTimeConnection && !isProviderInitializing;
  const shouldShowWebSocketWarning =
  isAuthenticated &&
  !isProviderInitializing &&
  (showSuccessMessage || showFailureMessage || isRetrying || !hasRealTimeConnection);


  const handleRetry = () => {
    setIsRetrying(true);
    setIsSnackbarOpen(true);
    setShowFailureMessage(false); // Reset failure message

    if (smartReconnect) {
      console.log('Attempting smart WebSocket reconnection...');
      smartReconnect();

      // Check if reconnection succeeded after a delay
      setTimeout(() => {
        if (!hasRealTimeConnection) {
          // Reconnection failed, show failure message briefly
          setShowFailureMessage(true);
          setIsRetrying(false);

          // Hide snackbar after showing failure message
          setTimeout(() => {
            setIsSnackbarOpen(false);
            setShowFailureMessage(false);
          }, 3000); // Show failure message for 3 seconds
        } else {
          setIsRetrying(false);
        }
      }, 10000); // Wait 10 seconds for connection attempt
    } else if (forceReconnect) {
      console.log('Smart reconnect not available, using force reconnect...');
      forceReconnect();
    } else {
      console.log('No reconnect functions available, reloading page...');
      window.location.reload();
    }
  };

  const handleShowSnackbar = () => {
    setIsSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsSnackbarOpen(false);
  };

  useEffect(() => {
    if (hasRealTimeConnection && isRetrying) {
      setIsRetrying(false);
      setShowFailureMessage(false);
      setShowSuccessMessage(true); // show success briefly

      // Auto-hide success after 3s
      setTimeout(() => {
        setShowSuccessMessage(false);
        setIsSnackbarOpen(false);
      }, 3100);
    }
  }, [hasRealTimeConnection, isRetrying]);

  const getDialogContent = () => {
    // ... (rest of the getDialogContent function is unchanged)
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
      {/* ... (rest of the Dialog component is unchanged) */}
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

      {/* Non-blocking WebSocket warning snackbar */}
      <Snackbar
        open={shouldShowWebSocketWarning && isSnackbarOpen}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={handleSnackbarClose}
        autoHideDuration={
          isRetrying ? null : (showFailureMessage || showSuccessMessage ? 2900 : 8000)
        }
        sx={{ mt: 2 }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={
            showSuccessMessage
              ? "success"
              : showFailureMessage
                ? "error"
                : isRetrying
                  ? "info"
                  : "warning"
          }
          variant="filled"
          action={
            !showFailureMessage && !showSuccessMessage ? (
              <Button
                color="inherit"
                size="small"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
                disabled={isRetrying}
              >
                {isRetrying ? "Reconectando..." : "Reintentar"}
              </Button>
            ) : null
          }
          sx={{
            minWidth: 300,
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
        >
          <Typography variant="body2" component="div">
            <strong>
              {showSuccessMessage
                ? "Conexión restablecida"
                : showFailureMessage
                  ? "Reconexión fallida"
                  : isRetrying
                    ? "Reconectando..."
                    : "Conexión limitada"}
            </strong>
          </Typography>
          <Typography variant="caption" component="div">
            {showSuccessMessage
              ? "La conexión en tiempo real se restableció correctamente."
              : showFailureMessage
                ? "No se pudo restablecer la conexión. Inténtalo más tarde."
                : isRetrying
                  ? "Intentando restablecer la conexión en tiempo real..."
                  : "Las actualizaciones en tiempo real no están disponibles. La aplicación funciona normalmente."
            }
          </Typography>
        </Alert>
      </Snackbar>

      {/* Subtle, persistent indicator */}
      {shouldShowSubtleWarning && !isSnackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300, // Make sure it's above most content
          }}
        >
          <IconButton
            color="warning"
            aria-label="Limited connection - Click to show options"
            title="Conexión limitada - Click para ver opciones"
            onClick={handleShowSnackbar}
          >
            <SyncProblemIcon />
          </IconButton>
        </Box>
      )}
    </>
  );
};

export default ConnectionStatusDialog;