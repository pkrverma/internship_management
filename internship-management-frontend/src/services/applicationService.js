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
 */
export const submitApplication = async (applicationData) => {
  try {
    console.log("Submitting new application...");

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
 * GET ALL APPLICATIONS
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
 * GET MY APPLICATIONS
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
 * GET BY ID
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
 * UPDATE STATUS
 */
export const updateApplicationStatus = async (id, status, reviewNotes = "") => {
  try {
    console.log(`Updating status for ${id} to ${status}`);
    return await updateDataById("applications", id, {
      status,
      reviewNotes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to update application status:", error);
    throw new Error("Unable to update application status.");
  }
};

/**
 * WITHDRAW APPLICATION
 */
export const withdrawApplication = async (id, userId) => {
  try {
    console.log(`Withdrawing application ${id} for ${userId}`);
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
 * GET BY STATUS
 */
export const getApplicationsByStatus = async (
  status,
  additionalFilters = {}
) => {
  try {
    console.log(`Fetching applications with status: ${status}`);
    return await getData("applications", { status, ...additionalFilters });
  } catch (error) {
    console.error("Failed to fetch applications by status:", error);
    throw new Error("Unable to load applications.");
  }
};

/**
 * GET FOR INTERNSHIP
 */
export const getApplicationsForInternship = async (internshipId) => {
  try {
    console.log(`Fetching applications for internship: ${internshipId}`);
    return await getData("applications", { internshipId });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    throw new Error("Unable to load internship applications.");
  }
};

/**
 * GET FOR MENTOR
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
 * ASSIGN MENTOR
 */
export const assignMentorToApplication = async (applicationId, mentorId) => {
  try {
    console.log(`Assigning mentor ${mentorId} to ${applicationId}`);
    return await updateDataById("applications", applicationId, {
      assignedMentorId: mentorId,
      mentorAssignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to assign mentor:", error);
    throw new Error("Unable to assign mentor.");
  }
};

/**
 * ADD DOCUMENT
 */
export const addApplicationDocument = async (applicationId, documentData) => {
  try {
    console.log(`Adding document to application ${applicationId}`);
    const application = await getApplicationById(applicationId);
    const updatedDocuments = [
      ...(application.documents || []),
      { ...documentData, uploadedAt: new Date().toISOString() },
    ];
    return await updateDataById("applications", applicationId, {
      documents: updatedDocuments,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to add document:", error);
    throw new Error("Unable to add document.");
  }
};

/**
 * CHECK IF USER ALREADY APPLIED
 */
export const hasUserApplied = async (userId, internshipId) => {
  try {
    const applications = await getData("applications", {
      userId,
      internshipId,
      status_ne: "Withdrawn",
    });
    return applications.length > 0;
  } catch (error) {
    console.error("Failed to check if user applied:", error);
    return false;
  }
};

/**
 * GET STATISTICS
 */
export const getApplicationStats = async () => {
  try {
    const all = await getData("applications");
    return {
      total: all.length,
      pending: all.filter((a) => a.status === "Pending").length,
      approved: all.filter((a) => a.status === "Approved").length,
      rejected: all.filter((a) => a.status === "Rejected").length,
      underReview: all.filter((a) => a.status === "Under Review").length,
      withdrawn: all.filter((a) => a.status === "Withdrawn").length,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    throw new Error("Unable to load stats.");
  }
};

/**
 * BULK UPDATE
 */
export const bulkUpdateApplications = async (applicationIds, updates) => {
  try {
    const promises = applicationIds.map((id) =>
      updateDataById("applications", id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error("Failed to bulk update applications:", error);
    throw new Error("Unable to update applications.");
  }
};
