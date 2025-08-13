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
  (error) => Promise.reject(error)
);

// Response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Map of data keys to endpoints
const ENDPOINT_MAP = {
  internships: "/internships",
  users: "/users",
  applications: "/applications",
  internshipStats: "/stats/internships",
  tasks: "/tasks",
  mentorAssignments: "/mentors/assignments",
  updates: "/updates",
  notifications: "/notifications",
};

// GET LIST DATA
export const getData = async (key, params = {}) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    const response = await api.get(endpoint, { params });
    return response.data.data || response.data || [];
  } catch (err) {
    console.error(`Error fetching ${key}:`, err);
    throw new Error(
      `Failed to fetch ${key}: ${err.response?.data?.message || err.message}`
    );
  }
};

// SAVE DATA
export const saveData = async (key, data, method = "POST") => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    let response;
    const httpMethod = method.toUpperCase();
    if (httpMethod === "POST") response = await api.post(endpoint, data);
    else if (httpMethod === "PUT") response = await api.put(endpoint, data);
    else if (httpMethod === "PATCH") response = await api.patch(endpoint, data);
    else throw new Error(`Unsupported method: ${method}`);
    return response.data.data || response.data;
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
    throw new Error(
      `Failed to save ${key}: ${err.response?.data?.message || err.message}`
    );
  }
};

// GET SINGLE ITEM
export const getDataById = async (key, id) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    const response = await api.get(`${endpoint}/${id}`);
    return response.data.data || response.data;
  } catch (err) {
    console.error(`Error fetching ${key} by ID:`, err);
    throw new Error(
      `Failed to fetch ${key} by ID: ${
        err.response?.data?.message || err.message
      }`
    );
  }
};

// UPDATE BY ID
export const updateDataById = async (key, id, updates) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    const response = await api.put(`${endpoint}/${id}`, updates);
    return response.data.data || response.data;
  } catch (err) {
    console.error(`Error updating ${key} by ID:`, err);
    throw new Error(
      `Failed to update ${key}: ${err.response?.data?.message || err.message}`
    );
  }
};

// DELETE BY ID
export const deleteDataById = async (key, id) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    await api.delete(`${endpoint}/${id}`);
    return true;
  } catch (err) {
    console.error(`Error deleting ${key}:`, err);
    throw new Error(
      `Failed to delete ${key}: ${err.response?.data?.message || err.message}`
    );
  }
};

// SEARCH DATA
export const searchData = async (key, filters = {}) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    const response = await api.get(`${endpoint}/search`, { params: filters });
    return response.data.data || response.data || [];
  } catch (err) {
    console.error(`Error searching ${key}:`, err);
    throw new Error(
      `Failed to search ${key}: ${err.response?.data?.message || err.message}`
    );
  }
};

// GET DATA FOR CURRENT USER
export const getMyData = async (key, userId) => {
  return getData(key, { userId, mine: true });
};

// PAGINATED DATA
export const getPaginatedData = async (
  key,
  page = 1,
  limit = 10,
  filters = {}
) => {
  const params = { page, limit, ...filters };
  return getData(key, params);
};

// BULK SAVE
export const bulkSaveData = async (key, dataArray) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  try {
    const response = await api.post(`${endpoint}/bulk`, { items: dataArray });
    return response.data.data || response.data;
  } catch (err) {
    console.error(`Error bulk saving ${key}:`, err);
    throw err;
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
};
