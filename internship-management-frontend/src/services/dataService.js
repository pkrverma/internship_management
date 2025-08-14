// src/services/dataService.js
import axios from "axios";
import { getAccessToken } from "./authService";

// Use same env format as the rest of the codebase
const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ================== REQUEST INTERCEPTOR ==================
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

// ================== RESPONSE INTERCEPTOR ==================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Clear stored tokens and force login
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ================== BACKEND ENDPOINT MAP ==================
const ENDPOINT_MAP = {
  internships: "/internships",
  users: "/users",
  applications: "/applications",
  internshipStats: "/stats/internships",
  tasks: "/tasks",
  mentorAssignments: "/mentors/assignments",
  updates: "/updates",
  notifications: "/notifications",
  // You can add more keys here if your frontend uses them,
  // e.g. "meetings": "/meetings", "messages": "/messages"
};

// ================== GENERIC HELPERS ==================

// GET LIST
export const getData = async (key, params = {}) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  const res = await api.get(endpoint, { params });
  return res.data?.data || res.data || [];
};

// CREATE / SAVE
export const saveData = async (key, data, method = "POST") => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  let res;
  switch (method.toUpperCase()) {
    case "POST":
      res = await api.post(endpoint, data);
      break;
    case "PUT":
      res = await api.put(endpoint, data);
      break;
    case "PATCH":
      res = await api.patch(endpoint, data);
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  return res.data?.data || res.data;
};

// GET SINGLE ITEM BY ID
export const getDataById = async (key, id) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  const res = await api.get(`${endpoint}/${id}`);
  return res.data?.data || res.data;
};

// UPDATE BY ID
export const updateDataById = async (key, id, updates) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  const res = await api.put(`${endpoint}/${id}`, updates);
  return res.data?.data || res.data;
};

// DELETE BY ID
export const deleteDataById = async (key, id) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  await api.delete(`${endpoint}/${id}`);
  return true;
};

// SEARCH
export const searchData = async (key, filters = {}) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  const res = await api.get(`${endpoint}/search`, { params: filters });
  return res.data?.data || res.data || [];
};

// GET "MY" DATA FOR CURRENT USER
export const getMyData = async (key, userId) => {
  return getData(key, { userId, mine: true });
};

// PAGINATED LIST
export const getPaginatedData = async (
  key,
  page = 1,
  limit = 10,
  filters = {}
) => {
  return getData(key, { page, limit, ...filters });
};

// BULK CREATE / SAVE
export const bulkSaveData = async (key, dataArray) => {
  const endpoint = ENDPOINT_MAP[key];
  if (!endpoint) throw new Error(`Unknown data key: ${key}`);
  const res = await api.post(`${endpoint}/bulk`, { items: dataArray });
  return res.data?.data || res.data;
};

// ================== DEFAULT EXPORT ==================
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
