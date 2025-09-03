import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from '@mui/material';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import axios from '../../api'; // Corrected import path

/**
 * A dialog component that checks for connectivity with the backend server.
 * It periodically pings the backend and displays a dialog if the connection fails.
 *
 * @returns {JSX.Element} The backend status dialog.
 */
const BackendStatus = () => {
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        // Ping a lightweight, public endpoint to verify backend connectivity.
        // Using the base URL is a good, unauthenticated way to do this.
        await axios.get('/');
        setIsBackendOnline(true);
      } catch (error) {
        // If the request fails, the backend is not reachable.
        console.error('Backend connection failed:', error);
        setIsBackendOnline(false);
      }
    };

    // Check immediately on component mount
    checkBackendStatus();

    // Set up an interval to check the status every 10 seconds
    const interval = setInterval(checkBackendStatus, 10000); // Check every 10 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <Dialog open={!isBackendOnline}>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <SignalWifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography variant="h5" component="span" sx={{ mt: 1 }}>
            Error de Conexión al Servidor
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1">
          No se pudo establecer una conexión con el servidor. Por favor, verifica tu conexión a internet, recargar la página actual o intenta de nuevo más tarde.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Si el problema persiste, contacta al administrador del sistema.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default BackendStatus;

// import React from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Typography,
//   Box,
// } from '@mui/material';
// import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
// import { useWebSocketStatus } from '../../websocket/WebSocketContext';

// /**
//  * A dialog component that checks for connectivity with the backend server.
//  * It displays a dialog if the WebSocket connection is not active.
//  *
//  * @returns {JSX.Element} The backend status dialog.
//  */
// const BackendStatus = () => {
//   const { isWsConnected } = useWebSocketStatus();

//   return (
//     <Dialog open={!isWsConnected}>
//       <DialogTitle sx={{ textAlign: 'center' }}>
//         <Box display="flex" flexDirection="column" alignItems="center">
//           <SignalWifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />
//           <Typography variant="h5" component="span" sx={{ mt: 1 }}>
//             Error de Conexión al Servidor
//           </Typography>
//         </Box>
//       </DialogTitle>
//       <DialogContent sx={{ textAlign: 'center' }}>
//         <Typography variant="body1">
//           No se pudo establecer una conexión con el servidor. Por favor, verifica tu conexión a internet o intenta de nuevo más tarde.
//         </Typography>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default BackendStatus;