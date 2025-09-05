import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketStatus } from '../websocket/WebSocketContext'
import { useSelector } from 'react-redux';
import api from '../api'; // Import your configured axios instance

/**
 * Enhanced hook for detecting backend connectivity using multiple methods
 */
export const useConnectionStatus = () => {
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { isWsConnected, isWsConnecting, isProviderInitializing } = useWebSocketStatus();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const checkIntervalRef = useRef(null);
  const lastCheckRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  
  // Minimum interval between checks to avoid spamming
  const MIN_CHECK_INTERVAL = 5000; // 5 seconds
  const MAX_CHECK_INTERVAL = 30000; // 30 seconds

  const PING_INTERVAL = 15000;

  // Ping the backend to check connectivity using your axios instance
  const pingBackend = useCallback(async () => {
    try {
      // Use your configured axios instance with a 5 second timeout
      const response = await api.head('/api/health/', {
        timeout: 5000,
        // Disable retry logic for this specific request
        _retry: false
      });
      
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      // Check if it's a timeout or network error vs auth error
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend ping failed - network issue:', error.message);
        return false;
      }
      
      // If we get a response (even 4xx/5xx), the backend is reachable
      // Auth errors (401) still mean the backend is responding
      if (error.response && error.response.status !== 500) {
        console.log('Backend ping - got response with status:', error.response.status);
        return true;
      }
      
      console.log('Backend ping failed:', error.message);
      return false;
    }
  }, []);

  // Check backend connectivity with exponential backoff
  const checkBackendConnectivity = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckRef.current < PING_INTERVAL) {
      return; // Too soon since last check
    }
    
    setIsChecking(true);
    lastCheckRef.current = now;
    
    const isReachable = await pingBackend();
    setIsBackendReachable(isReachable);
    
    if (isReachable) {
      consecutiveFailuresRef.current = 0;
    } else {
      consecutiveFailuresRef.current += 1;
    }
    
    setIsChecking(false);
  }, [pingBackend]);

  // Handle visibility change (mobile browser going to background/foreground)
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden && isAuthenticated) {
      // App came back to foreground, check connectivity immediately
      console.log('App returned to foreground, checking connectivity...');
      setTimeout(() => {
        checkBackendConnectivity();
      }, 1000); // Small delay to allow for network stabilization
    }
  }, [checkBackendConnectivity, isAuthenticated]);

  // Handle network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOnline(true);
      if (isAuthenticated) {
        // When network comes back online, check backend connectivity
        setTimeout(() => {
          checkBackendConnectivity();
        }, 2000);
      }
    };
    
    const handleOffline = () => {
      setIsNetworkOnline(false);
      setIsBackendReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendConnectivity, isAuthenticated]);

  // Handle visibility change events
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Periodic connectivity checks when WebSocket is disconnected
  useEffect(() => {
    if (!isAuthenticated) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    // If WebSocket is not connected and we're not currently connecting,
    // start periodic backend checks
    if (!isWsConnected && !isWsConnecting && !isProviderInitializing && isNetworkOnline) {
      const interval = Math.min(
        MAX_CHECK_INTERVAL,
        Math.max(MIN_CHECK_INTERVAL, 5000 * Math.pow(2, Math.min(consecutiveFailuresRef.current, 4)))
      );
      
      checkIntervalRef.current = setInterval(checkBackendConnectivity, interval);
    } else if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isWsConnected, isWsConnecting, isProviderInitializing, isNetworkOnline, isAuthenticated, checkBackendConnectivity]);

  // Initial connectivity check when authenticated
  useEffect(() => {
    if (isAuthenticated && isNetworkOnline) {
      checkBackendConnectivity();
    }
  }, [isAuthenticated, checkBackendConnectivity]);

  return {
    isNetworkOnline,
    isBackendReachable,
    isWsConnected,
    isWsConnecting,
    isProviderInitializing,
    isChecking,
    // App is usable if network is online AND backend is reachable via HTTP
    isConnected: isNetworkOnline && isBackendReachable,
    // Separate flag for real-time features
    hasRealTimeConnection: isWsConnected
  };
};