// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  login as authLogin,
  getCurrentUser,
  logout as authLogout,
} from "../services/authService";

/**
 * AuthContext — holds authentication state and helper functions
 */
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial check completes

  // Load user from local storage/session when app mounts
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = getCurrentUser(); // from localStorage/session or token decode
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
   * Handle login — calls API via authService and stores user in context
   */
  const login = async (email, password) => {
    try {
      const loggedInUser = await authLogin(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        return loggedInUser;
      }
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * Handle logout — clears context and storage via authService
   */
  const logout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading,
    setUser, // Optional: allows updating profile info without a full login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook for using auth context
 */
export const useAuth = () => useContext(AuthContext);
