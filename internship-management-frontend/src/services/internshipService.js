import {
  getData,
  saveData,
  getDataById,
  updateDataById,
  deleteDataById,
  searchData,
  getPaginatedData,
} from "./dataService";

/**
 * GET ALL INTERNSHIPS
 * @param {Object} filters - Optional filters (status, type, location, etc.)
 * @returns {Promise<Array>} - Array of internships
 */
export const getAllInternships = async (filters = {}) => {
  try {
    console.log("Fetching all internships...");
    return await getData("internships", filters);
  } catch (error) {
    console.error("Failed to fetch internships:", error);
    throw new Error("Unable to load internships. Please try again.");
  }
};

/**
 * GET INTERNSHIP BY ID
 * @param {string|number} id - Internship ID
 * @returns {Promise<Object>} - Single internship
 */
export const getInternshipById = async (id) => {
  try {
    console.log(`Fetching internship with ID: ${id}`);
    return await getDataById("internships", id);
  } catch (error) {
    console.error("Failed to fetch internship:", error);
    throw new Error("Unable to load internship details.");
  }
};

/**
 * CREATE NEW INTERNSHIP (Admin only)
 * @param {Object} internshipData - Internship details
 * @returns {Promise<Object>} - Created internship
 */
export const createInternship = async (internshipData) => {
  try {
    console.log("Creating new internship...");

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "department",
      "startDate",
      "endDate",
    ];
    for (const field of requiredFields) {
      if (!internshipData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const internshipPayload = {
      ...internshipData,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await saveData("internships", internshipPayload, "POST");
  } catch (error) {
    console.error("Failed to create internship:", error);
    throw new Error(error.message || "Unable to create internship.");
  }
};

/**
 * UPDATE INTERNSHIP (Admin only)
 * @param {string|number} id - Internship ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} - Updated internship
 */
export const updateInternship = async (id, updates) => {
  try {
    console.log(`Updating internship with ID: ${id}`);

    const updatePayload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return await updateDataById("internships", id, updatePayload);
  } catch (error) {
    console.error("Failed to update internship:", error);
    throw new Error("Unable to update internship.");
  }
};

/**
 * DELETE INTERNSHIP (Admin only)
 * @param {string|number} id - Internship ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteInternship = async (id) => {
  try {
    console.log(`Deleting internship with ID: ${id}`);
    return await deleteDataById("internships", id);
  } catch (error) {
    console.error("Failed to delete internship:", error);
    throw new Error("Unable to delete internship.");
  }
};

/**
 * SEARCH INTERNSHIPS
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Filtered internships
 */
export const searchInternships = async (query, filters = {}) => {
  try {
    console.log(`Searching internships with query: ${query}`);

    const searchParams = {
      q: query,
      ...filters,
    };

    return await searchData("internships", searchParams);
  } catch (error) {
    console.error("Failed to search internships:", error);
    throw new Error("Unable to search internships.");
  }
};

/**
 * GET PAGINATED INTERNSHIPS
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} filters - Filters
 * @returns {Promise<Object>} - Paginated results
 */
export const getPaginatedInternships = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    console.log(
      `Fetching paginated internships - page: ${page}, limit: ${limit}`
    );
    return await getPaginatedData("internships", page, limit, filters);
  } catch (error) {
    console.error("Failed to fetch paginated internships:", error);
    throw new Error("Unable to load internships.");
  }
};

/**
 * GET INTERNSHIPS BY STATUS
 * @param {string} status - Internship status (Open, Closed, Draft)
 * @returns {Promise<Array>} - Filtered internships
 */
export const getInternshipsByStatus = async (status) => {
  try {
    console.log(`Fetching internships with status: ${status}`);
    return await getData("internships", { status });
  } catch (error) {
    console.error("Failed to fetch internships by status:", error);
    throw new Error("Unable to load internships.");
  }
};

/**
 * GET AVAILABLE INTERNSHIPS (for interns)
 * Only returns open internships that accept applications
 * @returns {Promise<Array>} - Available internships
 */
export const getAvailableInternships = async () => {
  try {
    console.log("Fetching available internships for application...");
    return await getData("internships", {
      status: "Open",
      acceptingApplications: true,
    });
  } catch (error) {
    console.error("Failed to fetch available internships:", error);
    throw new Error("Unable to load available internships.");
  }
};

/**
 * TOGGLE INTERNSHIP STATUS
 * @param {string|number} id - Internship ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated internship
 */
export const toggleInternshipStatus = async (id, status) => {
  try {
    console.log(`Toggling internship ${id} status to: ${status}`);
    return await updateInternship(id, { status });
  } catch (error) {
    console.error("Failed to toggle internship status:", error);
    throw new Error("Unable to update internship status.");
  }
};

/**
 * GET INTERNSHIP STATISTICS (Admin)
 * @returns {Promise<Object>} - Internship stats
 */
export const getInternshipStats = async () => {
  try {
    console.log("Fetching internship statistics...");
    return await getData("internshipStats");
  } catch (error) {
    console.error("Failed to fetch internship stats:", error);
    throw new Error("Unable to load statistics.");
  }
};
