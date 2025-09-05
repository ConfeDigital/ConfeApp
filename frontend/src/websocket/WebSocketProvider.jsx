import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification, fetchNotifications } from "../features/notifications/notificationsSlice";
import { setUser } from "../features/auth/authSlice";
import { ACCESS_TOKEN, AUTH_TYPE, SOUND_ALERT } from "../constants";
import { loginRequest } from "../auth-config";
import { WebSocketContext } from "./WebSocketContext";

const WebSocketProvider = ({ instance, children }) => {
  const dispatch = useDispatch();
  const notificationSocketRef = useRef(null);
  const userUpdateSocketRef = useRef(null);
  const isUnmounted = useRef(false);
  const retries = useRef({ notifications: 0, userUpdates: 0 });
  const reconnectTimeouts = useRef({ notifications: null, userUpdates: null });
  
  const MAX_RETRIES_EXPONENTIAL = 5;
  const LONG_RETRY_INTERVAL = 30000;
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [isProviderInitializing, setIsProviderInitializing] = useState(true);
  const debounceTimeoutRef = useRef(null);
  
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const notificationSound = new Audio('../../assets/sounds/notification.wav');
    notificationSound.volume = 0.3;
    
    const isDev = import.meta.env.MODE === 'development';

    const urls = {
      notifications: isDev
        ? import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_LOCAL
        : import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_PROD,
      userUpdates: isDev
        ? import.meta.env.VITE_USER_UPDATES_WEBSOCKET_LOCAL
        : import.meta.env.VITE_USER_UPDATES_WEBSOCKET_PROD,
    };

    const updateConnectionStatus = () => {
      const isNotificationsConnected = notificationSocketRef.current?.readyState === WebSocket.OPEN;
      const isUserUpdatesConnected = userUpdateSocketRef.current?.readyState === WebSocket.OPEN;
      return isNotificationsConnected || isUserUpdatesConnected;
    };

    const debouncedSetIsWsConnected = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        setIsWsConnected(updateConnectionStatus());
      }, 500);
    };

    // Gentle reconnection check when app becomes visible again
    // This doesn't force disconnect, just checks if we need to reconnect
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Only attempt reconnection if the WebSocket is actually closed/failed
        setTimeout(() => {
          if (notificationSocketRef.current?.readyState === WebSocket.CLOSED || 
              notificationSocketRef.current?.readyState === WebSocket.CLOSING) {
            console.log('App returned to foreground, notifications WebSocket needs reconnection');
            connectWebSocket("notifications", urls.notifications);
          }
          
          if (userUpdateSocketRef.current?.readyState === WebSocket.CLOSED || 
              userUpdateSocketRef.current?.readyState === WebSocket.CLOSING) {
            console.log('App returned to foreground, user updates WebSocket needs reconnection');
            connectWebSocket("userUpdates", urls.userUpdates);
          }
        }, 1000);
      }
    };

    const connectWebSocket = (type, url) => {
      // Clear any existing reconnect timeout
      if (reconnectTimeouts.current[type]) {
        clearTimeout(reconnectTimeouts.current[type]);
        reconnectTimeouts.current[type] = null;
      }

      // Only close if we're explicitly reconnecting a failed connection
      const currentSocket = type === 'notifications' ? notificationSocketRef.current : userUpdateSocketRef.current;
      if (currentSocket && (currentSocket.readyState === WebSocket.CONNECTING || currentSocket.readyState === WebSocket.OPEN)) {
        // Don't interrupt a good connection
        return;
      }

      setIsWsConnecting(true);

      const createSocket = () => {
        const authType = sessionStorage.getItem(AUTH_TYPE);
        let tokenPromise;
    
        if (authType === "msal" && instance) {
          const account = instance.getActiveAccount();
          if (!account) {
            console.error("No active MSAL account found");
            return null;
          }
          tokenPromise = instance.acquireTokenSilent({ ...loginRequest, account }).then(response => response.accessToken);
        } else if (authType === "djoser") {
          tokenPromise = Promise.resolve(sessionStorage.getItem(ACCESS_TOKEN));
        } else {
          setIsWsConnecting(false);
          return null;
        }
    
        return tokenPromise.then(token => {
          if (token) {
            return new WebSocket(`${url}?token=${token}`);
          }
          setIsWsConnecting(false);
          return null;
        }).catch(err => {
          console.error("Token fetch failed during reconnect:", err);
          setIsWsConnecting(false);
          return null;
        });
      };
    
      const connect = () => {
        if (isUnmounted.current) return;
        
        createSocket().then(socket => {
          if (!socket || isUnmounted.current) return;
    
          if (type === 'notifications') notificationSocketRef.current = socket;
          if (type === 'userUpdates') userUpdateSocketRef.current = socket;
    
          socket.onopen = () => {
            console.log(`[${type}] WebSocket connected`);
            retries.current[type] = 0;
            setIsWsConnecting(false);
            
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            setIsWsConnected(updateConnectionStatus());
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
                notificationSound.play().catch(e => console.error("Sound error:", e));
              }
            } else if (type === "userUpdates" && data.type === "user_update") {
              dispatch(setUser(data.data));
            }
          };
    
          socket.onclose = (e) => {
            console.log(`[${type}] WebSocket closed:`, e.code, e.reason);
            debouncedSetIsWsConnected();
            
            if (!isUnmounted.current && isAuthenticated) {
              let timeout = 0;
              if (retries.current[type] < MAX_RETRIES_EXPONENTIAL) {
                timeout = Math.min(1000 * 2 ** retries.current[type], 30000);
                console.log(`[${type}] Reconnecting in ${timeout}ms... (Retry ${retries.current[type] + 1}/${MAX_RETRIES_EXPONENTIAL})`);
              } else {
                timeout = LONG_RETRY_INTERVAL;
                console.log(`[${type}] Max retries reached, switching to long-interval polling. Reconnecting in ${timeout}ms...`);
                setIsWsConnecting(false);
              }
    
              reconnectTimeouts.current[type] = setTimeout(() => {
                retries.current[type] += 1;
                connect();
              }, timeout);
            }
          };
    
          socket.onerror = (error) => {
            console.error(`[${type}] WebSocket error:`, error);
            // Don't immediately close on error, let the browser handle it
            // socket.close();
          };
        });
      };
    
      connect();
    };

    // Add gentle visibility change listener (doesn't force disconnection)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isAuthenticated) {
      setIsProviderInitializing(true);
      const authType = sessionStorage.getItem(AUTH_TYPE);
      if (authType === "msal" || authType === "djoser") {
        connectWebSocket("notifications", urls.notifications);
        connectWebSocket("userUpdates", urls.userUpdates);
      } else {
        console.error("No valid auth type, skipping WebSocket connections");
      }
      setIsProviderInitializing(false);
    } else {
      // Clean up connections when not authenticated
      if (notificationSocketRef.current) {
        notificationSocketRef.current.close();
        notificationSocketRef.current = null;
      }
      if (userUpdateSocketRef.current) {
        userUpdateSocketRef.current.close();
        userUpdateSocketRef.current = null;
      }
      
      // Clear any pending reconnection attempts
      Object.keys(reconnectTimeouts.current).forEach(key => {
        if (reconnectTimeouts.current[key]) {
          clearTimeout(reconnectTimeouts.current[key]);
          reconnectTimeouts.current[key] = null;
        }
      });
    }

    return () => {
      isUnmounted.current = true;
      
      // Clean up all timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      Object.keys(reconnectTimeouts.current).forEach(key => {
        if (reconnectTimeouts.current[key]) {
          clearTimeout(reconnectTimeouts.current[key]);
        }
      });
      
      // Clean up event listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Close connections
      if (notificationSocketRef.current) notificationSocketRef.current.close();
      if (userUpdateSocketRef.current) userUpdateSocketRef.current.close();
    };
  }, [isAuthenticated, instance, dispatch]);

  return (
    <WebSocketContext.Provider value={{ isWsConnected, isWsConnecting, isProviderInitializing }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;