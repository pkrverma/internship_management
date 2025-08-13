import axios from "axios";

// Base API URL - adjust this to match your backend
const API_BASE_URL =
  VITE_API_URL || VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) - token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * LOGIN - Connect to backend authentication
 */
export const login = async (email, password) => {
  try {
    console.log("Attempting login...");

    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { user, accessToken, refreshToken } = response.data;

    // Check if user is suspended
    if (user.role === "Suspend") {
      throw new Error(
        "Your account has been suspended. Please contact administrator."
      );
    }

    // Store tokens and user data
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("currentUser", JSON.stringify(user));

    console.log("Login successful:", user);
    return user;
  } catch (error) {
    console.error("Login failed:", error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
};

/**
 * REGISTER - Connect to backend registration
 */
export const register = async (userData) => {
  try {
    console.log("Attempting registration...");

    const response = await api.post("/auth/register", userData);
    const { user, accessToken, refreshToken } = response.data;

    // Store tokens and user data
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("currentUser", JSON.stringify(user));

    console.log("Registration successful:", user);
    return user;
  } catch (error) {
    console.error("Registration failed:", error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Registration failed. Please try again.");
    }
  }
};

/**
 * LOGOUT - Clear tokens and user data
 */
export const logout = async () => {
  try {
    // Call backend logout endpoint (optional - for token blacklisting)
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.error("Logout API call failed:", error);
    // Continue with local cleanup even if API call fails
  } finally {
    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    console.log("User logged out.");
  }
};

/**
 * GET CURRENT USER - From localStorage
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing current user from localStorage:", error);
    return null;
  }
};

/**
 * TOKEN MANAGEMENT HELPERS
 */
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

/**
 * REFRESH TOKEN - Get new access token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post("/auth/refresh", {
      refreshToken: refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Update stored tokens
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

/**
 * CHECK IF USER IS AUTHENTICATED
 */
export const isAuthenticated = () => {
  const token = getAccessToken();
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * UPDATE USER PROFILE (optional)
 */
export const updateProfile = async (userData) => {
  try {
    const response = await api.put("/auth/profile", userData);
    const updatedUser = response.data.user;

    // Update stored user data
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    return updatedUser;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw new Error(error.response?.data?.message || "Profile update failed");
  }
};
