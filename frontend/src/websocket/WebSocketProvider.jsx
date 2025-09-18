import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification, fetchNotifications } from "../features/notifications/notificationsSlice";
import { setUser, checkAndRefreshToken } from "../features/auth/authSlice";
import { ACCESS_TOKEN, AUTH_TYPE, SOUND_ALERT } from "../constants";
import { loginRequest } from "../auth-config";
import { WebSocketContext } from "./WebSocketContext";
import { jwtDecode } from "jwt-decode";

const WebSocketProvider = ({ instance, children }) => {
  const dispatch = useDispatch();
  const notificationSocketRef = useRef(null);
  const userUpdateSocketRef = useRef(null);
  const isUnmounted = useRef(false);
  const retries = useRef({ notifications: 0, userUpdates: 0 });
  const MAX_RETRIES_EXPONENTIAL = 5; // Use exponential backoff for the first 5 retries
  const LONG_RETRY_INTERVAL = 10000; // 10 seconds for long-interval polling (reduced from 30s)
  const MAX_TOTAL_RETRIES = 20; // Maximum total retries before giving up
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [isProviderInitializing, setIsProviderInitializing] = useState(true);
  const debounceTimeoutRef = useRef(null);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Helper function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Helper function to get fresh token (refresh if needed)
  const getFreshToken = React.useCallback(async (authType, msalInstance) => {
    try {
      if (authType === "msal" && msalInstance) {
        const activeAccount = msalInstance.getActiveAccount();
        if (!activeAccount) {
          console.error("No active MSAL account found for WebSocket");
          return null;
        }

        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: activeAccount,
        });
        return response.accessToken;
      } else if (authType === "djoser") {
        const token = sessionStorage.getItem(ACCESS_TOKEN);

        if (!token) {
          console.error("No Djoser token found for WebSocket");
          return null;
        }

        // Check if token is expired and refresh if needed
        if (isTokenExpired(token)) {
          console.log("WebSocket: Token expired, refreshing...");
          const newToken = await dispatch(checkAndRefreshToken()).unwrap();
          return newToken;
        }

        return token;
      }
    } catch (error) {
      console.error("Failed to get fresh token for WebSocket:", error);
      return null;
    }

    return null;
  }, [dispatch]);

  // Move connectWebSocket outside useEffect so it's accessible to forceReconnect
  const connectWebSocket = React.useCallback((type, url) => {
    setIsWsConnecting(true);

    const createSocket = async () => {
      const authType = sessionStorage.getItem(AUTH_TYPE);

      if (!authType || (authType === "msal" && !instance)) {
        console.error(`[${type}] No valid auth configuration for WebSocket connection`);
        setIsWsConnecting(false);
        return null;
      }

      try {
        // Get fresh token (will refresh if expired)
        const token = await getFreshToken(authType, instance);

        if (!token) {
          console.error(`[${type}] No token available for WebSocket connection`);
          setIsWsConnecting(false);
          return null;
        }

        console.log(`[${type}] Creating WebSocket connection with fresh token`);
        return new WebSocket(`${url}?token=${token}`);
      } catch (err) {
        console.error(`[${type}] Token fetch failed during WebSocket connection:`, err);
        setIsWsConnecting(false);
        throw err;
      }
    };

    const connect = async () => {
      try {
        const socket = await createSocket();

        if (!socket) {
          console.log(`[${type}] Failed to create socket, will retry...`);
          return;
        }

        if (type === 'notifications') notificationSocketRef.current = socket;
        if (type === 'userUpdates') userUpdateSocketRef.current = socket;

        socket.onopen = () => {
          console.log(`[${type}] WebSocket connected with fresh token`);
          retries.current[type] = 0;
          setIsWsConnecting(false);

          // Clear any pending debounces and set connected status immediately
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (type === "notifications" && data.type === "notification") {
            dispatch(addNotification({
              id: data.id,
              message: data.message,
              link: data.link,
              created_at: data.created_at,
            }));
            if (!localStorage.getItem(SOUND_ALERT) || localStorage.getItem(SOUND_ALERT) === 'true') {
              const notificationSound = new Audio('../../assets/sounds/notification.wav');
              notificationSound.volume = 0.3;
              notificationSound.play().catch(e => console.error("Sound error:", e));
            }
          } else if (type === "userUpdates" && data.type === "user_update") {
            dispatch(setUser(data.data));
          }
        };

        socket.onclose = (e) => {
          console.log(`[${type}] WebSocket closed:`, e.code, e.reason);
          console.log(`[${type}] isUnmounted:`, isUnmounted.current, 'isAuthenticated:', isAuthenticated);

          // Immediately update connection status - no debouncing for disconnections
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          setIsWsConnected(false);

          if (!isUnmounted.current && isAuthenticated) {
            // Check if we've exceeded maximum retries
            if (retries.current[type] >= MAX_TOTAL_RETRIES) {
              console.log(`[${type}] Maximum retries (${MAX_TOTAL_RETRIES}) exceeded. Stopping reconnection attempts.`);
              setIsWsConnecting(false);
              return;
            }

            let timeout = 0;
            if (retries.current[type] < MAX_RETRIES_EXPONENTIAL) {
              timeout = Math.min(1000 * 2 ** retries.current[type], 30000);
              console.log(`[${type}] Reconnecting in ${timeout}ms... (Retry ${retries.current[type] + 1}/${MAX_RETRIES_EXPONENTIAL})`);
            } else {
              timeout = LONG_RETRY_INTERVAL;
              console.log(`[${type}] Exponential retries exhausted, switching to long-interval polling. Reconnecting in ${timeout}ms... (Total retry ${retries.current[type] + 1}/${MAX_TOTAL_RETRIES})`);
              setIsWsConnecting(false);
            }

            setTimeout(() => {
              console.log(`[${type}] Timeout callback - isUnmounted:`, isUnmounted.current, 'isAuthenticated:', isAuthenticated);
              if (!isUnmounted.current && isAuthenticated) {
                retries.current[type] += 1;
                console.log(`[${type}] Attempting reconnection #${retries.current[type]}...`);
                connect();
              } else {
                console.log(`[${type}] Skipping reconnection - isUnmounted:`, isUnmounted.current, 'isAuthenticated:', isAuthenticated);
              }
            }, timeout);
          }
        };

        socket.onerror = (error) => {
          console.error(`[${type}] WebSocket error:`, error);
          socket.close();
        };
      } catch (err) {
        console.error(`[${type}] Failed to create WebSocket connection:`, err);
        setIsWsConnecting(false);

        // Trigger reconnection logic by simulating a close event
        if (!isUnmounted.current && isAuthenticated) {
          setTimeout(() => {
            if (!isUnmounted.current && isAuthenticated) {
              retries.current[type] += 1;
              console.log(`[${type}] Retrying after token/connection error... (Retry ${retries.current[type]})`);
              connect();
            }
          }, 5000); // Wait 5 seconds before retrying on token errors
        }
      }
    };

    connect();
  }, [isAuthenticated, instance, dispatch, getFreshToken]);

  useEffect(() => {
    const isDev = import.meta.env.MODE === 'development';

    const urls = {
      notifications: isDev
        ? import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_LOCAL
        : import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_PROD,
      userUpdates: isDev
        ? import.meta.env.VITE_USER_UPDATES_WEBSOCKET_LOCAL
        : import.meta.env.VITE_USER_UPDATES_WEBSOCKET_PROD,
    };

    if (isAuthenticated) {
      // If we are authenticated, start the connection process
      setIsProviderInitializing(true);
      // Reset retry counters when authentication state changes
      retries.current = { notifications: 0, userUpdates: 0 };

      const authType = sessionStorage.getItem(AUTH_TYPE);
      if (authType === "msal" || authType === "djoser") {
        connectWebSocket("notifications", urls.notifications);
        connectWebSocket("userUpdates", urls.userUpdates);
      } else {
        console.error("No valid auth type, skipping WebSocket connections");
      }
      setTimeout(() => {
        setIsProviderInitializing(false);
      }, 500); // Small timeout to allow connections to start
    } else {
      // If we are not authenticated, close any existing connections
      if (notificationSocketRef.current) {
        notificationSocketRef.current.close();
        notificationSocketRef.current = null;
      }
      if (userUpdateSocketRef.current) {
        userUpdateSocketRef.current.close();
        userUpdateSocketRef.current = null;
      }
      // Reset retry counters when not authenticated
      retries.current = { notifications: 0, userUpdates: 0 };
    }

    return () => {
      isUnmounted.current = true;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (notificationSocketRef.current) notificationSocketRef.current.close();
      if (userUpdateSocketRef.current) userUpdateSocketRef.current.close();
    };
  }, [isAuthenticated, instance, dispatch, connectWebSocket]);

  // Manual reconnection function for debugging and health check triggers
  const forceReconnect = React.useCallback(() => {
    console.log("Force reconnecting WebSockets...");
    // Reset retry counters for manual reconnection
    retries.current = { notifications: 0, userUpdates: 0 };

    if (notificationSocketRef.current) {
      notificationSocketRef.current.close();
    }
    if (userUpdateSocketRef.current) {
      userUpdateSocketRef.current.close();
    }

    // Restart connections
    const isDev = import.meta.env.MODE === 'development';
    const urls = {
      notifications: isDev
        ? import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_LOCAL
        : import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_PROD,
      userUpdates: isDev
        ? import.meta.env.VITE_USER_UPDATES_WEBSOCKET_LOCAL
        : import.meta.env.VITE_USER_UPDATES_WEBSOCKET_PROD,
    };

    if (isAuthenticated) {
      connectWebSocket("notifications", urls.notifications);
      connectWebSocket("userUpdates", urls.userUpdates);
    }
  }, [isAuthenticated, connectWebSocket]);

  // Smart reconnection that only triggers if backend is reachable
  const smartReconnect = React.useCallback(async () => {
    if (!isAuthenticated) return;

    // Check if both sockets are disconnected
    const notificationDisconnected = !notificationSocketRef.current ||
      notificationSocketRef.current.readyState === WebSocket.CLOSED ||
      notificationSocketRef.current.readyState === WebSocket.CLOSING;

    const userUpdateDisconnected = !userUpdateSocketRef.current ||
      userUpdateSocketRef.current.readyState === WebSocket.CLOSED ||
      userUpdateSocketRef.current.readyState === WebSocket.CLOSING;

    if (notificationDisconnected && userUpdateDisconnected) {
      console.log("Both WebSockets disconnected, checking backend health before reconnecting...");

      try {
        // Quick health check
        const response = await fetch('/api/health/', {
          method: 'HEAD',
          timeout: 3000
        });

        if (response.ok) {
          console.log("Backend is healthy, triggering WebSocket reconnection...");
          forceReconnect();
        } else {
          console.log("Backend health check failed, skipping WebSocket reconnection");
        }
      } catch (error) {
        console.log("Backend health check failed:", error.message);
      }
    }
  }, [isAuthenticated, forceReconnect]);

  // Add to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.forceWebSocketReconnect = forceReconnect;
      window.getWebSocketStatus = () => ({
        isWsConnected,
        isWsConnecting,
        isProviderInitializing,
        retries: retries.current,
        notificationSocket: notificationSocketRef.current?.readyState,
        userUpdateSocket: userUpdateSocketRef.current?.readyState,
        isAuthenticated,
        isUnmounted: isUnmounted.current
      });

      // Test function to simulate Redis restart
      window.testRedisRestart = () => {
        console.log("🧪 Testing Redis restart scenario...");
        console.log("Current status:", window.getWebSocketStatus());

        // Close existing connections
        if (notificationSocketRef.current) {
          console.log("Closing notification socket...");
          notificationSocketRef.current.close();
        }
        if (userUpdateSocketRef.current) {
          console.log("Closing user update socket...");
          userUpdateSocketRef.current.close();
        }

        // Wait a bit then force reconnection
        setTimeout(() => {
          console.log("Forcing reconnection...");
          forceReconnect();
        }, 2000);
      };
    }
  }, [isWsConnected, isWsConnecting, isProviderInitializing, isAuthenticated]);

  return (
    <WebSocketContext.Provider value={{ isWsConnected, isWsConnecting, isProviderInitializing, forceReconnect, smartReconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;