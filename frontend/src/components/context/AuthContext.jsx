import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../../api"; // Ajusta la ruta según tu estructura

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Verificar token con el backend
          const response = await api.get("/api/auth/usuario-actual/");
          setUser(response.data);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login/", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      const userResponse = await api.get("/api/auth/usuario-actual/");
      setUser(userResponse.data);
      return true;
    } catch (error) {
      console.error("Error de login:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
