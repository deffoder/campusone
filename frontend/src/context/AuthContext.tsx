import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, authApi } from "../api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => void;
  isAuthenticated: boolean;
  getDefaultRoute: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("campusone_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("campusone_token");
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem("campusone_user", JSON.stringify(profile));
        } catch {
          localStorage.removeItem("campusone_token");
          localStorage.removeItem("campusone_user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const getDefaultRoute = (role?: string): string => {
    const r = role || user?.role;
    switch (r) {
      case "student":
        return "/student/dashboard";
      case "faculty":
        return "/faculty/dashboard";
      case "hod":
      case "admin":
        return "/admin/dashboard";
      default:
        return "/login";
    }
  };

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const data = await authApi.login(email, pass);
      localStorage.setItem("campusone_token", data.access_token);
      localStorage.setItem("campusone_user", JSON.stringify(data));
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("campusone_token");
    localStorage.removeItem("campusone_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        getDefaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
