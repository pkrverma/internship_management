import axios from "axios";

// Base API URL - should match your backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Create axios instance for data operations
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // If 401, redirect to login (token expired/invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**
 * API ENDPOINT MAPPING
 * Map your mock data keys to real backend endpoints
 */
const ENDPOINT_MAP = {
  internships: "/internships",
  users: "/users",
  applications: "/applications",
  internshipStats: "/stats/internships",
  tasks: "/tasks",
  mentorAssignments: "/mentors/assignments",
  updates: "/updates",
};

/**
 * GET DATA - Fetch from backend API
 * @param {string} key - Data type (internships, users, etc.)
 * @param {object} params - Query parameters
 * @returns {Promise<Array>} - Data array from API
 */
export const getData = async (key, params = {}) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Fetching ${key} from API...`);
    const response = await api.get(endpoint, { params });

    return response.data.data || response.data || [];
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    throw new Error(
      `Failed to fetch ${key}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * SAVE DATA - Send to backend API
 * @param {string} key - Data type
 * @param {Array|Object} data - Data to save
 * @param {string} method - HTTP method (POST, PUT, PATCH)
 * @returns {Promise<Object>} - Saved data from API
 */
export const saveData = async (key, data, method = "POST") => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Saving ${key} to API...`);
    let response;

    switch (method.toUpperCase()) {
      case "POST":
        response = await api.post(endpoint, data);
        break;
      case "PUT":
        response = await api.put(endpoint, data);
        break;
      case "PATCH":
        response = await api.patch(endpoint, data);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    throw new Error(
      `Failed to save ${key}: ${error.response?.data?.message || error.message}`
    );
  }
};

/**
 * GET SINGLE ITEM by ID
 * @param {string} key - Data type
 * @param {string|number} id - Item ID
 * @returns {Promise<Object>} - Single item
 */
export const getDataById = async (key, id) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Fetching ${key} with ID ${id}...`);
    const response = await api.get(`${endpoint}/${id}`);

    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching ${key} by ID:`, error);
    throw new Error(
      `Failed to fetch ${key}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * UPDATE SINGLE ITEM by ID
 * @param {string} key - Data type
 * @param {string|number} id - Item ID
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} - Updated item
 */
export const updateDataById = async (key, id, updates) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Updating ${key} with ID ${id}...`);
    const response = await api.put(`${endpoint}/${id}`, updates);

    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    throw new Error(
      `Failed to update ${key}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * DELETE ITEM by ID
 * @param {string} key - Data type
 * @param {string|number} id - Item ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteDataById = async (key, id) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Deleting ${key} with ID ${id}...`);
    await api.delete(`${endpoint}/${id}`);

    return true;
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw new Error(
      `Failed to delete ${key}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * SEARCH DATA with filters
 * @param {string} key - Data type
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Filtered results
 */
export const searchData = async (key, filters = {}) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    if (!endpoint) {
      throw new Error(`Unknown data key: ${key}`);
    }

    console.log(`Searching ${key} with filters:`, filters);
    const response = await api.get(`${endpoint}/search`, { params: filters });

    return response.data.data || response.data || [];
  } catch (error) {
    console.error(`Error searching ${key}:`, error);
    throw new Error(
      `Failed to search ${key}: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * BACKWARDS COMPATIBILITY FUNCTIONS
 * These maintain the old interface while using new API calls
 */

// Legacy function - now just calls getData
export const initializeData = () => {
  console.log("initializeData is deprecated - data now comes from API");
  return Promise.resolve();
};

// Legacy function - now just calls getData
export const forceReloadData = () => {
  console.log("forceReloadData is deprecated - data now comes from API");
  return Promise.resolve();
};

/**
 * SPECIALIZED FUNCTIONS for common operations
 */

// Get data for current user (filtered by role/permissions)
export const getMyData = async (key, userId) => {
  return getData(key, { userId, mine: true });
};

// Get paginated data
export const getPaginatedData = async (
  key,
  page = 1,
  limit = 10,
  filters = {}
) => {
  const params = { page, limit, ...filters };
  return getData(key, params);
};

// Bulk operations
export const bulkSaveData = async (key, dataArray) => {
  try {
    const endpoint = ENDPOINT_MAP[key];
    const response = await api.post(`${endpoint}/bulk`, { items: dataArray });
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error bulk saving ${key}:`, error);
    throw error;
  }
};

export default {
  getData,
  saveData,
  getDataById,
  updateDataById,
  deleteDataById,
  searchData,
  getMyData,
  getPaginatedData,
  bulkSaveData,
  initializeData, // Legacy
  forceReloadData, // Legacy
};
