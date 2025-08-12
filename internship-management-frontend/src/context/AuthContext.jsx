import React, { createContext, useState, useContext, useEffect } from "react";
import {
  login as authLogin,
  getCurrentUser,
  logout as authLogout,
} from "../services/authService";

/**
 * AuthContext
 * Holds the authentication state and helpers
 */
const AuthContext = createContext(null);

/**
 * AuthProvider
 * Wraps the app and provides auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we check stored user

  // Load user from storage/API on app mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = getCurrentUser(); // should parse localStorage/session or token decode
        if (storedUser) {
          setUser(storedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to load user from storage:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  /**
   * Handle login
   */
  const login = async (email, password) => {
    try {
      const loggedInUser = await authLogin(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
      }
      return loggedInUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * Handle logout
   */
  const logout = () => {
    setUser(null);
    authLogout();
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading,
    setUser, // Optional: in case we need to update profile without logout/login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => useContext(AuthContext);
