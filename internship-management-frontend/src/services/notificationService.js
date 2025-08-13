import axios from "axios";
import { getAccessToken } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ================== GET ALL NOTIFICATIONS ==================
export const getNotifications = async (params = {}) => {
  try {
    console.log("Fetching notifications...");
    const response = await api.get("/notifications", { params });
    // Always normalize to an array
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to load notifications."
    );
  }
};

// ================== GET UNREAD COUNT ==================
export const getNotificationCount = async () => {
  try {
    console.log("Fetching notification count...");
    const response = await api.get("/notifications/count");
    // Expected shape: { unread: number }
    const unread = response.data.unread ?? response.data.count ?? 0;
    return { unread };
  } catch (error) {
    console.error("Failed to get notification count:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to get notification count."
    );
  }
};

// ================== MARK AS READ ==================
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(
      `Failed to mark notification ${notificationId} as read:`,
      error
    );
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to mark as read."
    );
  }
};

// ================== DELETE NOTIFICATION ==================
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to delete notification."
    );
  }
};

// ================== CLEAR ALL NOTIFICATIONS ==================
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete("/notifications");
    return response.data;
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to clear notifications."
    );
  }
};

export default {
  getNotifications,
  getNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
};
