import React, { createContext, useContext } from 'react';

// Create a new context to hold the WebSocket status
export const WebSocketContext = createContext(null);

/**
 * A custom hook to use the WebSocket status from the context.
 * @returns {{ isWsConnected: boolean, isWsConnecting: boolean, isProviderInitializing: boolean }} The WebSocket connection status and connecting state.
 */
export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  if (context === null) {
    throw new Error('useWebSocketStatus must be used within a WebSocketProvider');
  }
  return context;
};
