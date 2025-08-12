import {
  getData,
  saveData,
  getDataById,
  updateDataById,
  deleteDataById,
  getMyData,
} from "./dataService";

/**
 * SUBMIT APPLICATION
 * @param {Object} applicationData - Application details
 * @returns {Promise<Object>} - Created application
 */
export const submitApplication = async (applicationData) => {
  try {
    console.log("Submitting new application...");

    // Validate required fields
    const requiredFields = ["internshipId", "userId", "coverLetter"];
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const applicationPayload = {
      ...applicationData,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await saveData("applications", applicationPayload, "POST");
  } catch (error) {
    console.error("Failed to submit application:", error);
    throw new Error(error.message || "Unable to submit application.");
  }
};

/**
 * GET ALL APPLICATIONS (Admin/Mentor view)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of applications
 */
export const getAllApplications = async (filters = {}) => {
  try {
    console.log("Fetching all applications...");
    return await getData("applications", filters);
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    throw new Error("Unable to load applications.");
  }
};

/**
 * GET MY APPLICATIONS (Intern view)
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} - User's applications
 */
export const getMyApplications = async (userId) => {
  try {
    console.log(`Fetching applications for user: ${userId}`);
    return await getMyData("applications", userId);
  } catch (error) {
    console.error("Failed to fetch user applications:", error);
    throw new Error("Unable to load your applications.");
  }
};

/**
 * GET APPLICATION BY ID
 * @param {string|number} id - Application ID
 * @returns {Promise<Object>} - Single application
 */
export const getApplicationById = async (id) => {
  try {
    console.log(`Fetching application with ID: ${id}`);
    return await getDataById("applications", id);
  } catch (error) {
    console.error("Failed to fetch application:", error);
    throw new Error("Unable to load application details.");
  }
};

/**
 * UPDATE APPLICATION STATUS (Admin/Mentor)
 * @param {string|number} id - Application ID
 * @param {string} status - New status (Pending, Approved, Rejected, Under Review)
 * @param {string} reviewNotes - Optional review notes
 * @returns {Promise<Object>} - Updated application
 */
export const updateApplicationStatus = async (id, status, reviewNotes = "") => {
  try {
    console.log(`Updating application ${id} status to: ${status}`);

    const updates = {
      status,
      reviewNotes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await updateDataById("applications", id, updates);
  } catch (error) {
    console.error("Failed to update application status:", error);
    throw new Error("Unable to update application status.");
  }
};

/**
 * WITHDRAW APPLICATION (Intern)
 * @param {string|number} id - Application ID
 * @param {string|number} userId - User ID (for verification)
 * @returns {Promise<Object>} - Updated application
 */
export const withdrawApplication = async (id, userId) => {
  try {
    console.log(`Withdrawing application ${id} for user: ${userId}`);

    // First verify this application belongs to the user
    const application = await getApplicationById(id);
    if (application.userId !== userId) {
      throw new Error("You can only withdraw your own applications.");
    }

    return await updateDataById("applications", id, {
      status: "Withdrawn",
      withdrawnAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to withdraw application:", error);
    throw new Error("Unable to withdraw application.");
  }
};

/**
 * GET APPLICATIONS BY STATUS
 * @param {string} status - Application status
 * @param {Object} additionalFilters - Additional filters
 * @returns {Promise<Array>} - Filtered applications
 */
export const getApplicationsByStatus = async (
  status,
  additionalFilters = {}
) => {
  try {
    console.log(`Fetching applications with status: ${status}`);
    const filters = { status, ...additionalFilters };
    return await getData("applications", filters);
  } catch (error) {
    console.error("Failed to fetch applications by status:", error);
    throw new Error("Unable to load applications.");
  }
};

/**
 * GET APPLICATIONS FOR INTERNSHIP (Admin view)
 * @param {string|number} internshipId - Internship ID
 * @returns {Promise<Array>} - Applications for specific internship
 */
export const getApplicationsForInternship = async (internshipId) => {
  try {
    console.log(`Fetching applications for internship: ${internshipId}`);
    return await getData("applications", { internshipId });
  } catch (error) {
    console.error("Failed to fetch applications for internship:", error);
    throw new Error("Unable to load internship applications.");
  }
};

/**
 * GET APPLICATIONS FOR MENTOR (Mentor view)
 * @param {string|number} mentorId - Mentor ID
 * @returns {Promise<Array>} - Applications assigned to mentor
 */
export const getApplicationsForMentor = async (mentorId) => {
  try {
    console.log(`Fetching applications for mentor: ${mentorId}`);
    return await getData("applications", { assignedMentorId: mentorId });
  } catch (error) {
    console.error("Failed to fetch mentor applications:", error);
    throw new Error("Unable to load assigned applications.");
  }
};

/**
 * ASSIGN MENTOR TO APPLICATION (Admin)
 * @param {string|number} applicationId - Application ID
 * @param {string|number} mentorId - Mentor ID
 * @returns {Promise<Object>} - Updated application
 */
export const assignMentorToApplication = async (applicationId, mentorId) => {
  try {
    console.log(`Assigning mentor ${mentorId} to application ${applicationId}`);

    return await updateDataById("applications", applicationId, {
      assignedMentorId: mentorId,
      mentorAssignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to assign mentor:", error);
    throw new Error("Unable to assign mentor to application.");
  }
};

/**
 * ADD APPLICATION DOCUMENT/ATTACHMENT
 * @param {string|number} applicationId - Application ID
 * @param {Object} documentData - Document info
 * @returns {Promise<Object>} - Updated application
 */
export const addApplicationDocument = async (applicationId, documentData) => {
  try {
    console.log(`Adding document to application ${applicationId}`);

    const application = await getApplicationById(applicationId);
    const updatedDocuments = [
      ...(application.documents || []),
      {
        ...documentData,
        uploadedAt: new Date().toISOString(),
      },
    ];

    return await updateDataById("applications", applicationId, {
      documents: updatedDocuments,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to add application document:", error);
    throw new Error("Unable to add document to application.");
  }
};

/**
 * CHECK IF USER ALREADY APPLIED
 * @param {string|number} userId - User ID
 * @param {string|number} internshipId - Internship ID
 * @returns {Promise<boolean>} - True if already applied
 */
export const hasUserApplied = async (userId, internshipId) => {
  try {
    console.log(
      `Checking if user ${userId} applied for internship ${internshipId}`
    );

    const applications = await getData("applications", {
      userId,
      internshipId,
      status_ne: "Withdrawn", // Not withdrawn
    });

    return applications.length > 0;
  } catch (error) {
    console.error("Failed to check application status:", error);
    return false;
  }
};

/**
 * GET APPLICATION STATISTICS (Admin)
 * @returns {Promise<Object>} - Application stats
 */
export const getApplicationStats = async () => {
  try {
    console.log("Fetching application statistics...");

    const allApplications = await getData("applications");

    const stats = {
      total: allApplications.length,
      pending: allApplications.filter((app) => app.status === "Pending").length,
      approved: allApplications.filter((app) => app.status === "Approved")
        .length,
      rejected: allApplications.filter((app) => app.status === "Rejected")
        .length,
      underReview: allApplications.filter(
        (app) => app.status === "Under Review"
      ).length,
      withdrawn: allApplications.filter((app) => app.status === "Withdrawn")
        .length,
    };

    return stats;
  } catch (error) {
    console.error("Failed to fetch application statistics:", error);
    throw new Error("Unable to load application statistics.");
  }
};

/**
 * BULK UPDATE APPLICATIONS (Admin)
 * @param {Array} applicationIds - Array of application IDs
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Array>} - Updated applications
 */
export const bulkUpdateApplications = async (applicationIds, updates) => {
  try {
    console.log(`Bulk updating ${applicationIds.length} applications`);

    const updatePromises = applicationIds.map((id) =>
      updateDataById("applications", id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    );

    return await Promise.all(updatePromises);
  } catch (error) {
    console.error("Failed to bulk update applications:", error);
    throw new Error("Unable to update applications.");
  }
};
