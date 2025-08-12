import axios from "axios";

// Base API URL for file operations
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance for file operations
const fileApi = axios.create({
  baseURL: `${API_BASE_URL}/files`,
  timeout: 60000, // 1 minute for large file uploads
});

// Add auth token to requests
fileApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle file API errors
fileApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("File API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**
 * UPLOAD SINGLE FILE
 * @param {File} file - File object
 * @param {Object} metadata - Additional file metadata
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Upload response
 */
export const uploadFile = async (file, metadata = {}, onProgress = null) => {
  try {
    console.log(`Uploading file: ${file.name}`);

    // Validate file
    validateFile(file);

    const formData = new FormData();
    formData.append("file", file);

    // Add metadata
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    // Add progress tracking if callback provided
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await fileApi.post("/upload", formData, config);

    console.log("File uploaded successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error(error.response?.data?.message || "File upload failed");
  }
};

/**
 * UPLOAD MULTIPLE FILES
 * @param {FileList|Array} files - Array of files
 * @param {Object} metadata - Shared metadata
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} - Array of upload responses
 */
export const uploadMultipleFiles = async (
  files,
  metadata = {},
  onProgress = null
) => {
  try {
    console.log(`Uploading ${files.length} files`);

    const formData = new FormData();

    // Add all files
    Array.from(files).forEach((file, index) => {
      validateFile(file);
      formData.append("files", file);
    });

    // Add metadata
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await fileApi.post("/upload/multiple", formData, config);

    console.log("Multiple files uploaded successfully");
    return response.data;
  } catch (error) {
    console.error("Multiple file upload failed:", error);
    throw new Error(error.response?.data?.message || "File upload failed");
  }
};

/**
 * DOWNLOAD FILE
 * @param {string|number} fileId - File ID
 * @param {string} filename - Optional filename for download
 * @returns {Promise<void>} - Triggers download
 */
export const downloadFile = async (fileId, filename = null) => {
  try {
    console.log(`Downloading file: ${fileId}`);

    const response = await fileApi.get(`/download/${fileId}`, {
      responseType: "blob",
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `file_${fileId}`;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(url);

    console.log("File downloaded successfully");
  } catch (error) {
    console.error("File download failed:", error);
    throw new Error("File download failed");
  }
};

/**
 * GET FILE INFO
 * @param {string|number} fileId - File ID
 * @returns {Promise<Object>} - File metadata
 */
export const getFileInfo = async (fileId) => {
  try {
    console.log(`Getting info for file: ${fileId}`);
    const response = await fileApi.get(`/info/${fileId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get file info:", error);
    throw new Error("Unable to load file information");
  }
};

/**
 * DELETE FILE
 * @param {string|number} fileId - File ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (fileId) => {
  try {
    console.log(`Deleting file: ${fileId}`);
    await fileApi.delete(`/${fileId}`);
    console.log("File deleted successfully");
    return true;
  } catch (error) {
    console.error("File deletion failed:", error);
    throw new Error("Unable to delete file");
  }
};

/**
 * GET USER FILES
 * @param {string|number} userId - User ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - User's files
 */
export const getUserFiles = async (userId, filters = {}) => {
  try {
    console.log(`Getting files for user: ${userId}`);
    const params = { userId, ...filters };
    const response = await fileApi.get("/list", { params });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Failed to get user files:", error);
    throw new Error("Unable to load files");
  }
};

/**
 * GET FILES BY CONTEXT (application, task, etc.)
 * @param {string} context - File context (application, task, meeting, etc.)
 * @param {string|number} contextId - Context ID
 * @returns {Promise<Array>} - Files for specific context
 */
export const getFilesByContext = async (context, contextId) => {
  try {
    console.log(`Getting ${context} files for ID: ${contextId}`);
    const params = { context, contextId };
    const response = await fileApi.get("/list", { params });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Failed to get context files:", error);
    throw new Error("Unable to load files");
  }
};

/**
 * VALIDATE FILE before upload
 * @param {File} file - File to validate
 * @throws {Error} - If validation fails
 */
export const validateFile = (file) => {
  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 10MB");
  }

  // Allowed file types
  const ALLOWED_TYPES = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",

    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",

    // Archives
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "File type not supported. Please upload PDF, DOC, XLS, TXT, or image files."
    );
  }

  // File name validation
  if (!file.name || file.name.length < 1) {
    throw new Error("File must have a valid name");
  }
};

/**
 * GET FILE PREVIEW URL (for images/PDFs)
 * @param {string|number} fileId - File ID
 * @returns {Promise<string>} - Preview URL
 */
export const getFilePreviewUrl = async (fileId) => {
  try {
    console.log(`Getting preview URL for file: ${fileId}`);
    const response = await fileApi.get(`/preview/${fileId}`);
    return response.data.previewUrl;
  } catch (error) {
    console.error("Failed to get preview URL:", error);
    throw new Error("Unable to generate file preview");
  }
};

/**
 * SEARCH FILES
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Search results
 */
export const searchFiles = async (query, filters = {}) => {
  try {
    console.log(`Searching files with query: ${query}`);
    const params = { q: query, ...filters };
    const response = await fileApi.get("/search", { params });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("File search failed:", error);
    throw new Error("Unable to search files");
  }
};

/**
 * UPDATE FILE METADATA
 * @param {string|number} fileId - File ID
 * @param {Object} metadata - New metadata
 * @returns {Promise<Object>} - Updated file info
 */
export const updateFileMetadata = async (fileId, metadata) => {
  try {
    console.log(`Updating metadata for file: ${fileId}`);
    const response = await fileApi.patch(`/${fileId}`, metadata);
    return response.data;
  } catch (error) {
    console.error("Failed to update file metadata:", error);
    throw new Error("Unable to update file information");
  }
};

/**
 * SHARE FILE (generate shareable link)
 * @param {string|number} fileId - File ID
 * @param {Object} options - Sharing options
 * @returns {Promise<Object>} - Share link info
 */
export const shareFile = async (fileId, options = {}) => {
  try {
    console.log(`Creating share link for file: ${fileId}`);
    const response = await fileApi.post(`/share/${fileId}`, options);
    return response.data;
  } catch (error) {
    console.error("Failed to share file:", error);
    throw new Error("Unable to create share link");
  }
};

export default {
  uploadFile,
  uploadMultipleFiles,
  downloadFile,
  getFileInfo,
  deleteFile,
  getUserFiles,
  getFilesByContext,
  validateFile,
  getFilePreviewUrl,
  searchFiles,
  updateFileMetadata,
  shareFile,
};
