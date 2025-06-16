import { createContext, useState, useMemo } from "react";

export const SidebarContext = createContext({
  isCollapsed: true,
  toggleCollapsed: () => {},
});

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapsed = () => setIsCollapsed(prev => !prev);

  const contextValue = useMemo(() => ({
    isCollapsed,
    toggleCollapsed,
  }), [isCollapsed]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};
