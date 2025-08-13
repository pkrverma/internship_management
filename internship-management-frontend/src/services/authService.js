import axios from "axios";

// Base API URL - adjust this to match your backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ================== TOKEN HELPERS ==================
export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    if (!user || user === "undefined" || user === "null") return null;
    return JSON.parse(user);
  } catch (err) {
    console.error("Error parsing current user from localStorage:", err);
    return null;
  }
};

// ================== INTERCEPTORS ==================
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ================== AUTH FUNCTIONS ==================
export const login = async (email, password) => {
  try {
    console.log("Attempting login...");
    const response = await api.post("/auth/login", { email, password });
    const { user, accessToken, refreshToken } = response.data;

    if (!user || !user.role) {
      throw new Error("Invalid login response from server.");
    }

    if (user.role.toLowerCase() === "suspend") {
      throw new Error(
        "Your account has been suspended. Please contact administrator."
      );
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("currentUser", JSON.stringify(user));
    console.log("Login successful:", user);

    return user;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Login failed."
    );
  }
};

export const register = async (userData) => {
  try {
    console.log("Attempting registration...");
    const response = await api.post("/auth/register", userData);
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("currentUser", JSON.stringify(user));

    console.log("Registration successful:", user);
    return user;
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Registration failed."
    );
  }
};

export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout API call failed:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    console.log("User logged out.");
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await api.post("/auth/refresh", { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }
    return accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = getAccessToken();
  const user = getCurrentUser();
  return !!(token && user);
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put("/auth/profile", userData);
    const updatedUser = response.data.user;
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw new Error(error.response?.data?.message || "Profile update failed.");
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  refreshAccessToken,
  updateProfile,
};
