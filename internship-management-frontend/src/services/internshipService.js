import {
  getData,
  saveData,
  getDataById,
  updateDataById,
  deleteDataById,
  searchData,
  getMyData,
} from "./dataService";

/**
 * CREATE INTERNSHIP
 */
export const createInternship = async (internshipData) => {
  try {
    console.log("Creating internship...");

    // Validate required fields
    const requiredFields = [
      "title",
      "company",
      "location",
      "description",
      "duration",
    ];
    for (const field of requiredFields) {
      if (!internshipData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const payload = {
      ...internshipData,
      status: internshipData.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await saveData("internships", payload, "POST");
  } catch (error) {
    console.error("Failed to create internship:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to create internship."
    );
  }
};

/**
 * UPDATE INTERNSHIP
 */
export const updateInternship = async (id, updates) => {
  try {
    console.log(`Updating internship ID: ${id}`);
    return await updateDataById("internships", id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update internship:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to update internship."
    );
  }
};

/**
 * DELETE INTERNSHIP
 */
export const deleteInternship = async (id) => {
  try {
    console.log(`Deleting internship ID: ${id}`);
    return await deleteDataById("internships", id);
  } catch (error) {
    console.error("Failed to delete internship:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to delete internship."
    );
  }
};

/**
 * GET INTERNSHIP BY ID
 */
export const getInternshipById = async (id) => {
  try {
    console.log(`Fetching internship ID: ${id}`);
    return await getDataById("internships", id);
  } catch (error) {
    console.error("Failed to fetch internship:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch internship."
    );
  }
};

/**
 * GET ALL INTERNSHIPS
 */
export const getAllInternships = async (filters = {}) => {
  try {
    console.log("Fetching internships...");
    return await getData("internships", filters);
  } catch (error) {
    console.error("Failed to fetch internships:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to fetch internships."
    );
  }
};

/**
 * SEARCH INTERNSHIPS
 */
export const searchInternships = async (filters = {}) => {
  try {
    console.log("Searching internships...");
    return await searchData("internships", filters);
  } catch (error) {
    console.error("Failed to search internships:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to search internships."
    );
  }
};

/**
 * GET MY POSTED INTERNSHIPS (for mentors/admin)
 */
export const getMyPostedInternships = async (userId) => {
  try {
    console.log(`Fetching internships posted by user: ${userId}`);
    return await getMyData("internships", userId);
  } catch (error) {
    console.error("Failed to fetch my posted internships:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to load posted internships."
    );
  }
};

/**
 * UPDATE INTERNSHIP STATUS (active/closed)
 */
export const updateInternshipStatus = async (id, status) => {
  try {
    console.log(`Updating internship ${id} status to ${status}`);
    return await updateDataById("internships", id, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update internship status:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Unable to update status."
    );
  }
};

/**
 * GET INTERNSHIP STATS
 */
export const getInternshipStats = async () => {
  try {
    console.log("Fetching internship stats...");
    return await getData("internshipStats");
  } catch (error) {
    console.error("Failed to fetch internship stats:", error);
    throw new Error(
      error.response?.data?.message || error.message || "Unable to fetch stats."
    );
  }
};

export default {
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipById,
  getAllInternships,
  searchInternships,
  getMyPostedInternships,
  updateInternshipStatus,
  getInternshipStats,
};
