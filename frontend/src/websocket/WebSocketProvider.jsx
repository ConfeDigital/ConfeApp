import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addNotification, fetchNotifications } from "../features/notifications/notificationsSlice";
import { setUser } from "../features/auth/authSlice";
import { ACCESS_TOKEN, AUTH_TYPE } from "../constants";
import { loginRequest } from "../auth-config";

const WebSocketProvider = ({ instance, children }) => {
  const dispatch = useDispatch();
  const notificationSocketRef = useRef(null);
  const userUpdateSocketRef = useRef(null);
  const isUnmounted = useRef(false);
  const retries = useRef({ notifications: 0, userUpdates: 0 });
  const MAX_RETRIES = 0;

  useEffect(() => {
    const notificationSound = new Audio('../../assets/sounds/notification.wav');
    const isDev = import.meta.env.MODE === 'development';

    const urls = {
      notifications: isDev
        ? import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_LOCAL
        : import.meta.env.VITE_NOTIFICATIONS_WEBSOCKET_PROD,
      userUpdates: isDev
        ? import.meta.env.VITE_USER_UPDATES_WEBSOCKET_LOCAL
        : import.meta.env.VITE_USER_UPDATES_WEBSOCKET_PROD,
    };

    const connectWebSocket = (type, url, token, onMessage) => {
      const socket = new WebSocket(`${url}?token=${token}`);
      if (type === 'notifications') notificationSocketRef.current = socket;
      if (type === 'userUpdates') userUpdateSocketRef.current = socket;

      socket.onopen = () => {
        console.log(`[${type}] WebSocket connected`);
        retries.current[type] = 0;
        if (type === "notifications") dispatch(fetchNotifications());
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
      };

      socket.onclose = (e) => {
        console.log(`[${type}] WebSocket closed:`, e.code, e.reason);
        if (!isUnmounted.current && retries.current[type] < MAX_RETRIES) {
          const timeout = Math.min(1000 * 2 ** retries.current[type], 30000);
          console.log(`[${type}] Reconnecting in ${timeout}ms...`);
          setTimeout(() => {
            retries.current[type] += 1;
            connectWebSocket(type, url, token, onMessage);
          }, timeout);
        }
      };

      socket.onerror = (error) => {
        // console.error(`[${type}] WebSocket error:`, error);
        socket.close();
      };
    };

    const startConnections = async () => {
      const authType = sessionStorage.getItem(AUTH_TYPE);
      let token;

      if (authType === "msal" && instance) {
        const account = instance.getActiveAccount();
        if (!account) {
          console.error("No active MSAL account found");
          return;
        }
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account,
          });
          token = response.accessToken;
        } catch (err) {
          console.error("MSAL token fetch failed:", err);
          return;
        }
      } else if (authType === "djoser") {
        token = sessionStorage.getItem(ACCESS_TOKEN);
      }

      if (!token) {
        console.error("No token available, skipping WebSocket connections");
        return;
      }

      console.log(`[WS Init] Connecting with token: ${token.slice(0, 10)}...`);

      connectWebSocket("notifications", urls.notifications, token, (notification) => {
        if (notification.type === "notification") {
          dispatch(addNotification({
            id: notification.id,
            message: notification.message,
            link: notification.link,
            created_at: notification.created_at,
          }));
          notificationSound.play().catch(e => console.error("Sound error:", e));
        }
      });

      connectWebSocket("userUpdates", urls.userUpdates, token, (data) => {
        if (data.type === "user_update") {
          dispatch(setUser(data.data));
        }
      });
    };

    startConnections();

    return () => {
      isUnmounted.current = true;
      if (notificationSocketRef.current) notificationSocketRef.current.close();
      if (userUpdateSocketRef.current) userUpdateSocketRef.current.close();
    };
  }, [instance, dispatch]);

  return <>{children}</>;
};

export default WebSocketProvider;
