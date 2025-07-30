// src/contexts/RouterRefreshContext.jsx
import React, { createContext, useState, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const RouterRefreshContext = createContext(null);

export function RouterRefreshProvider({ children }) {
  const [routerKey, setRouterKey] = useState(0); // This key will force a router re-mount
  const navigate = useNavigate();
  const location = useLocation();

  // This function increments the key, forcing the main Routes component to remount
  const triggerRouterRefresh = useCallback(() => {
    setRouterKey(prevKey => prevKey + 1);
    console.log('Router refresh triggered! New key:', routerKey + 1);
  }, [routerKey]); // Include routerKey in dependencies if you want the log to show the *new* key immediately

  // This function encapsulates the notification click logic
  // It will either navigate or trigger a refresh if on the same page
  const handleNotificationNavigation = useCallback((notificationLink) => {
    const currentPath = location.pathname;
    const targetPath = notificationLink; // Assuming notification.link holds the target path

    if (currentPath === targetPath) {
      // User is already on the target page, force a re-render/data refetch
      triggerRouterRefresh();
    } else {
      // User is on a different page, navigate
      navigate(targetPath);
    }
  }, [location.pathname, navigate, triggerRouterRefresh]);


  // Value provided by the context
  const contextValue = {
    routerKey,
    triggerRouterRefresh, // In case you need to manually trigger from elsewhere
    handleNotificationNavigation, // The main function for notifications
  };

  return (
    <RouterRefreshContext.Provider value={contextValue}>
      {children}
    </RouterRefreshContext.Provider>
  );
}

// Optional: A custom hook for easier consumption
export function useRouterRefresh() {
  const context = useContext(RouterRefreshContext);
  if (context === undefined) {
    throw new Error('useRouterRefresh must be used within a RouterRefreshProvider');
  }
  return context;
}