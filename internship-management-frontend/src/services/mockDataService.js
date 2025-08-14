import { getData, saveData } from "./dataService";

/**
 * NOTE:
 * We've removed inline local mock arrays and now proxy to your
 * backend API endpoints via dataService.js.
 * All signatures & export names remain exactly the same so existing imports work.
 */

// ======= INTERN / INTERNSHIPS =======

export const getMockInternships = async () => {
  return await getData("internships");
};

export const getMockInternshipById = async (id) => {
  const results = await getData("internships", { id });
  return Array.isArray(results) ? results[0] || null : results;
};

export const addMockInternship = async (internship) => {
  return await saveData("internships", internship, "POST");
};

// ======= APPLICATIONS =======

export const getMockApplications = async () => {
  return await getData("applications");
};

// ======= NOTIFICATIONS =======

export const getMockNotifications = async () => {
  return await getData("notifications");
};

export const getUnreadNotificationsCount = async () => {
  const res = await getData("notifications", { unreadOnly: true });
  return { unread: Array.isArray(res) ? res.length : res?.unread || 0 };
};

// ======= DOCUMENTS =======

export const getSharedDocuments = async () => {
  return await getData("documents/shared");
};

// ======= MENTOR FEATURES =======

export const getInternsByMentorId = async (mentorId) => {
  return await getData("users", { mentorId, role: "intern" });
};

export const getConversationsForMentor = async (mentorId) => {
  return await getData("messages", { mentorId });
};

export const getMeetingsByMentorId = async (mentorId) => {
  return await getData("meetings", { mentorId });
};

// ======= INTERN FEATURES =======

export const getMeetingsByInternId = async (internId) => {
  return await getData("meetings", { internId });
};

// ======= DEFAULT EXPORT =======
export default {
  getMockInternships,
  getMockInternshipById,
  addMockInternship,
  getMockApplications,
  getMockNotifications,
  getUnreadNotificationsCount,
  getSharedDocuments,
  getInternsByMentorId,
  getConversationsForMentor,
  getMeetingsByMentorId,
  getMeetingsByInternId,
};
