import axios from "axios";

// Base API URL
const API_BASE_URL =
  VITE_API_URL || VITE_API_BASE_URL;

// Create axios instance for notifications
const notificationApi = axios.create({
  baseURL: `${API_BASE_URL}/notifications`,
  timeout: 10000,
});

// Add auth token to requests
notificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// WebSocket/SSE connection for real-time notifications
let eventSource = null;
let notificationCallbacks = [];

/**
 * INITIALIZE REAL-TIME NOTIFICATIONS
 * @param {Function} onNotification - Callback for new notifications
 * @param {Function} onError - Error callback
 * @returns {void}
 */
export const initializeRealTimeNotifications = (
  onNotification,
  onError = null
) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn(
        "No access token found, cannot initialize real-time notifications"
      );
      return;
    }

    // Close existing connection
    if (eventSource) {
      eventSource.close();
    }

    // Create new SSE connection
    const sseUrl = `${API_BASE_URL}/notifications/stream?token=${token}`;
    eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log("Real-time notifications connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log("New notification received:", notification);

        // Call all registered callbacks
        notificationCallbacks.forEach((callback) => callback(notification));

        // Call the main callback
        if (onNotification) {
          onNotification(notification);
        }

        // Show browser notification if permission granted
        showBrowserNotification(notification);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      if (onError) {
        onError(error);
      }

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        initializeRealTimeNotifications(onNotification, onError);
      }, 5000);
    };
  } catch (error) {
    console.error("Failed to initialize real-time notifications:", error);
    if (onError) {
      onError(error);
    }
  }
};

/**
 * CLOSE REAL-TIME NOTIFICATIONS
 * @returns {void}
 */
export const closeRealTimeNotifications = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log("Real-time notifications disconnected");
  }
  notificationCallbacks = [];
};

/**
 * ADD NOTIFICATION CALLBACK
 * @param {Function} callback - Callback function
 * @returns {Function} - Cleanup function
 */
export const addNotificationCallback = (callback) => {
  notificationCallbacks.push(callback);

  // Return cleanup function
  return () => {
    const index = notificationCallbacks.indexOf(callback);
    if (index > -1) {
      notificationCallbacks.splice(index, 1);
    }
  };
};

/**
 * GET ALL NOTIFICATIONS
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of notifications
 */
export const getAllNotifications = async (filters = {}) => {
  try {
    console.log("Fetching all notifications...");
    const params = {
      page: 1,
      limit: 50,
      ...filters,
    };

    const response = await notificationApi.get("/", { params });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error("Unable to load notifications");
  }
};

/**
 * GET UNREAD NOTIFICATIONS
 * @returns {Promise<Array>} - Unread notifications
 */
export const getUnreadNotifications = async () => {
  try {
    console.log("Fetching unread notifications...");
    const response = await notificationApi.get("/unread");
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Failed to fetch unread notifications:", error);
    throw new Error("Unable to load unread notifications");
  }
};

/**
 * MARK NOTIFICATION AS READ
 * @param {string|number} notificationId - Notification ID
 * @returns {Promise<Object>} - Updated notification
 */
export const markAsRead = async (notificationId) => {
  try {
    console.log(`Marking notification ${notificationId} as read`);
    const response = await notificationApi.patch(`/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw new Error("Unable to mark notification as read");
  }
};

/**
 * MARK ALL NOTIFICATIONS AS READ
 * @returns {Promise<boolean>} - Success status
 */
export const markAllAsRead = async () => {
  try {
    console.log("Marking all notifications as read");
    await notificationApi.patch("/mark-all-read");
    return true;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw new Error("Unable to mark all notifications as read");
  }
};

/**
 * DELETE NOTIFICATION
 * @param {string|number} notificationId - Notification ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    console.log(`Deleting notification: ${notificationId}`);
    await notificationApi.delete(`/${notificationId}`);
    return true;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw new Error("Unable to delete notification");
  }
};

/**
 * CREATE NOTIFICATION (Admin/System use)
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} - Created notification
 */
export const createNotification = async (notificationData) => {
  try {
    console.log("Creating new notification...");

    const payload = {
      ...notificationData,
      createdAt: new Date().toISOString(),
    };

    const response = await notificationApi.post("/", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw new Error("Unable to create notification");
  }
};

/**
 * GET NOTIFICATION COUNT
 * @returns {Promise<Object>} - Notification counts
 */
export const getNotificationCount = async () => {
  try {
    console.log("Fetching notification count...");
    const response = await notificationApi.get("/count");
    return response.data;
  } catch (error) {
    console.error("Failed to get notification count:", error);
    return { total: 0, unread: 0 };
  }
};

/**
 * UPDATE NOTIFICATION PREFERENCES
 * @param {Object} preferences - User notification preferences
 * @returns {Promise<Object>} - Updated preferences
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    console.log("Updating notification preferences...");
    const response = await notificationApi.put("/preferences", preferences);
    return response.data;
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    throw new Error("Unable to update notification preferences");
  }
};

/**
 * GET NOTIFICATION PREFERENCES
 * @returns {Promise<Object>} - User notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    console.log("Fetching notification preferences...");
    const response = await notificationApi.get("/preferences");
    return response.data;
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    throw new Error("Unable to load notification preferences");
  }
};

/**
 * SHOW BROWSER NOTIFICATION
 * @param {Object} notification - Notification data
 * @returns {void}
 */
const showBrowserNotification = (notification) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    const options = {
      body: notification.message || notification.content,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `notification-${notification.id}`,
      requireInteraction: false,
      silent: false,
    };

    const browserNotification = new Notification(
      notification.title || "New Notification",
      options
    );

    // Auto close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    // Handle click
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();

      // Mark as read when clicked
      markAsRead(notification.id).catch(console.error);

      // Navigate to related page if URL provided
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    };
  }
};

/**
 * REQUEST BROWSER NOTIFICATION PERMISSION
 * @returns {Promise<string>} - Permission status
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission;
  }

  return Notification.permission;
};

/**
 * SEND NOTIFICATION TO USER(S) (Admin function)
 * @param {Array|string} userIds - User ID(s) to send to
 * @param {Object} notificationData - Notification content
 * @returns {Promise<Object>} - Send result
 */
export const sendNotificationToUsers = async (userIds, notificationData) => {
  try {
    console.log(`Sending notification to users: ${userIds}`);

    const payload = {
      userIds: Array.isArray(userIds) ? userIds : [userIds],
      ...notificationData,
    };

    const response = await notificationApi.post("/send", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw new Error("Unable to send notification");
  }
};

export default {
  initializeRealTimeNotifications,
  closeRealTimeNotifications,
  addNotificationCallback,
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationCount,
  updateNotificationPreferences,
  getNotificationPreferences,
  requestNotificationPermission,
  sendNotificationToUsers,
};
