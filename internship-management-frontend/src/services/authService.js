import axios from "axios";

// Use environment variable names exactly as in your .env files
const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ================== TOKEN HELPERS ==================
export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// ================== INTERCEPTORS ==================
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token handling
let isRefreshing = false;
let refreshQueue = [];
const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

// ================== RESPONSE INTERCEPTOR ==================
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      try {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await logout();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ================== AUTH FUNCTIONS ==================
export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  const { user, accessToken, refreshToken } = res.data;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
};

export const loginAdmin = async (email, password) => {
  const res = await api.post("/admin/auth/login", {
    email: String(email).toLowerCase().trim(),
    password,
  });
  const { user, accessToken } = res.data || {};
  if (!user || !accessToken) throw new Error("Invalid admin login response");
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
};

export const register = async (userData) => {
  const allowed = ["intern", "mentor", "admin"];
  const normalizedRole = String(userData.role).toLowerCase().trim();
  if (!allowed.includes(normalizedRole))
    throw new Error("Invalid role specified");

  const payload = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: normalizedRole,
    phone: userData.phone || undefined,
    university: normalizedRole === "intern" ? userData.university : undefined,
    specialization:
      normalizedRole === "mentor" ? userData.specialization : undefined,
  };

  const res = await api.post("/auth/register", payload);
  const { user, accessToken, refreshToken } = res.data;
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (user) localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
};

export const logout = async () => {
  const rt = getRefreshToken();
  if (rt) await api.post("/auth/logout", { refreshToken: rt });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
};

export const refreshAccessToken = async () => {
  const rt = getRefreshToken();
  const res = await api.post("/auth/refresh", { refreshToken: rt });
  const { accessToken, refreshToken: newRT } = res.data;
  localStorage.setItem("accessToken", accessToken);
  if (newRT) localStorage.setItem("refreshToken", newRT);
  return accessToken;
};

export const isAuthenticated = () => !!(getAccessToken() && getCurrentUser());

export const updateProfile = async (data) => {
  const res = await api.put("/auth/profile", data);
  const updatedUser = res.data?.user;
  if (updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  return updatedUser;
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
  api,
};
