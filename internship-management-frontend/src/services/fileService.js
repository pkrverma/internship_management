import axios from "axios";
import { getAccessToken } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // larger timeout for file uploads
  headers: { "Content-Type": "multipart/form-data" },
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

// ================== FILE VALIDATION ==================
/**
 * Validate uploaded file before sending.
 * @param {File} file - File object
 * @param {Array<string>} allowedTypes - allowed MIME types
 * @param {number} maxSizeMB - maximum file size in MB
 */
export const validateFile = (file, allowedTypes = [], maxSizeMB = 5) => {
  if (!file) throw new Error("No file selected");

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB} MB limit.`);
  }

  return true;
};

// ================== UPLOAD SINGLE FILE ==================
/**
 * Upload a single file to the backend
 * @param {File} file - file to upload
 * @param {Object} extraData - optional additional form fields
 */
export const uploadFile = async (file, extraData = {}) => {
  try {
    console.log("Uploading file:", file.name);

    // Example: only allow images/pdf up to 5MB
    validateFile(file, ["image/jpeg", "image/png", "application/pdf"], 5);

    const formData = new FormData();
    formData.append("file", file);
    Object.entries(extraData).forEach(([key, value]) =>
      formData.append(key, value)
    );

    const response = await api.post("/files/upload", formData);
    return response.data;
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

// ================== UPLOAD MULTIPLE FILES ==================
/**
 * Upload multiple files together
 * @param {Array<File>} files
 * @param {Object} extraData
 */
export const uploadMultipleFiles = async (files, extraData = {}) => {
  try {
    if (!files || files.length === 0) throw new Error("No files to upload");

    const formData = new FormData();
    files.forEach((file) => {
      validateFile(file, ["image/jpeg", "image/png", "application/pdf"], 5);
      formData.append("files", file);
    });

    Object.entries(extraData).forEach(([key, value]) =>
      formData.append(key, value)
    );

    const response = await api.post("/files/upload-multiple", formData);
    return response.data;
  } catch (error) {
    console.error("Multiple file upload failed:", error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

// ================== DELETE FILE ==================
export const deleteFile = async (fileId) => {
  try {
    console.log(`Deleting file ID: ${fileId}`);
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error("File delete failed:", error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

// ================== DOWNLOAD FILE ==================
export const downloadFile = async (fileId) => {
  try {
    console.log(`Downloading file ID: ${fileId}`);
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("File download failed:", error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  downloadFile,
  validateFile,
};
