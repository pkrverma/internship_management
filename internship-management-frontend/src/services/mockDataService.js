/**
 * Simple in-memory mock data provider
 * Useful for development/testing without a backend
 */

// ======= MOCK DATA =======
const mockInternships = [
  {
    id: "1",
    title: "Frontend Developer Intern",
    company: "TechCorp",
    location: "Remote",
    description: "Work on React and modern frontend tools",
    duration: "3 months",
    stipend: 5000,
    postedBy: { name: "Alice", email: "alice@example.com" },
  },
  {
    id: "2",
    title: "Backend Developer Intern",
    company: "CodeWorks",
    location: "On-site",
    description: "Node.js API development & database integration",
    duration: "4 months",
    stipend: 7000,
    postedBy: { name: "Bob", email: "bob@example.com" },
  },
];

const mockApplications = [
  {
    id: "app1",
    internshipId: "1",
    userId: "u1",
    status: "Pending",
    submittedAt: "2025-08-12T10:00:00Z",
  },
];

const mockNotifications = [
  {
    id: "n1",
    userId: "u1",
    message: "Your application status has been updated",
    isRead: false,
    createdAt: "2025-08-13T15:20:00Z",
  },
];

// ======= API-LIKE FUNCTIONS =======
export const getMockInternships = () => {
  return Promise.resolve(mockInternships);
};

export const getMockInternshipById = (id) => {
  const internship = mockInternships.find((m) => m.id === id);
  return Promise.resolve(internship || null);
};

export const addMockInternship = (internship) => {
  const newItem = { ...internship, id: Date.now().toString() };
  mockInternships.push(newItem);
  return Promise.resolve(newItem);
};

export const getMockApplications = () => {
  return Promise.resolve(mockApplications);
};

export const getMockNotifications = () => {
  return Promise.resolve(mockNotifications);
};

export const getUnreadNotificationsCount = () => {
  const count = mockNotifications.filter((n) => !n.isRead).length;
  return Promise.resolve({ unread: count });
};

// Example of adding shared documents
export const getSharedDocuments = () => {
  return Promise.resolve([
    {
      id: "doc1",
      name: "Internship Guidelines.pdf",
      addedOn: "2025-08-10T09:00:00Z",
    },
  ]);
};

export default {
  getMockInternships,
  getMockInternshipById,
  addMockInternship,
  getMockApplications,
  getMockNotifications,
  getUnreadNotificationsCount,
  getSharedDocuments,
};
