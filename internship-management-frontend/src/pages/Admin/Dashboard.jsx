import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StatsCard from "../../components/admin/StatsCard";
import InternshipDetailsModal from "./InternshipDetailsModal";
import Spinner from "../../components/ui/Spinner";

import {
  getAllInternships,
  getInternshipStats,
} from "../../services/internshipService";

import {
  getAllApplications,
  getApplicationStats,
} from "../../services/applicationService";

import { getData } from "../../services/dataService";
import { getNotifications } from "../../services/notificationService";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalInterns: 0,
    totalMentors: 0,
    totalInternships: 0,
    activeInternships: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    upcomingInterviews: 0,
    trends: {},
  });

  const [recentInternships, setRecentInternships] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);

  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const [
        internshipsRes,
        internshipStatsRes,
        applicationsRes,
        applicationStatsRes,
        usersRes,
        meetingsRes,
        notificationsRes,
      ] = await Promise.allSettled([
        getAllInternships(),
        getInternshipStats(),
        getAllApplications(),
        getApplicationStats(),
        getData("users"),
        getData("meetings"),
        getNotifications({ limit: 5 }),
      ]);

      const internships =
        internshipsRes.status === "fulfilled" &&
        Array.isArray(internshipsRes.value)
          ? internshipsRes.value
          : [];

      const internshipStats =
        internshipStatsRes.status === "fulfilled"
          ? internshipStatsRes.value
          : {};

      const applications =
        applicationsRes.status === "fulfilled" &&
        Array.isArray(applicationsRes.value)
          ? applicationsRes.value
          : [];

      const appStats =
        applicationStatsRes.status === "fulfilled"
          ? applicationStatsRes.value
          : {};

      const users =
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
          ? usersRes.value
          : [];

      const meetings =
        meetingsRes.status === "fulfilled" && Array.isArray(meetingsRes.value)
          ? meetingsRes.value
          : [];

      const notifications =
        notificationsRes.status === "fulfilled" &&
        Array.isArray(notificationsRes.value)
          ? notificationsRes.value
          : [];

      // Counts
      const mentorCount = users.filter(
        (u) => u.role?.toLowerCase() === "mentor"
      ).length;
      const internCount = users.filter(
        (u) => u.role?.toLowerCase() === "intern"
      ).length;
      const activeInternshipCount = internships.filter(
        (i) => i.status === "Open"
      ).length;

      const now = new Date();
      const upcomingInterviewCount = meetings.filter(
        (meeting) => new Date(meeting.scheduledAt) > now
      ).length;

      setDashboardStats({
        totalUsers: users.length,
        totalMentors: mentorCount,
        totalInterns: internCount,
        totalInternships: internships.length,
        activeInternships: activeInternshipCount,
        totalApplications: appStats.total || applications.length,
        pendingApplications: appStats.pending || 0,
        approvedApplications: appStats.approved || 0,
        rejectedApplications: appStats.rejected || 0,
        upcomingInterviews: upcomingInterviewCount,
        trends: {},
      });

      // Recent Internships
      setRecentInternships(
        [...internships]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
      );

      // Recent Applications
      const enrichedApps = applications.map((app) => {
        const intern = users.find((u) => u.id === app.userId);
        const internship = internships.find((i) => i.id === app.internshipId);
        return {
          ...app,
          internName: intern?.name || "Unknown Intern",
          internshipTitle: internship?.title || "Unknown Internship",
        };
      });

      setRecentApplications(
        enrichedApps
          .sort(
            (a, b) =>
              new Date(b.submittedAt || b.createdAt) -
              new Date(a.submittedAt || a.createdAt)
          )
          .slice(0, 3)
      );

      // Upcoming Interviews
      const enrichedMeetings = meetings.map((m) => {
        const intern = users.find((u) => u.id === m.participantIds?.[0]);
        const mentor = users.find((u) => u.id === m.mentorId);
        const internship = internships.find((i) => i.id === m.internshipId);
        return {
          ...m,
          internName: intern?.name || "Unknown Intern",
          mentorName: mentor?.name || "Unknown Mentor",
          internshipTitle: internship?.title || "Unknown Internship",
        };
      });

      setUpcomingInterviews(
        enrichedMeetings
          .filter((m) => new Date(m.scheduledAt) > now)
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
          .slice(0, 3)
      );

      // Recent Updates
      setRecentUpdates(notifications.slice(0, 3));
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => loadDashboardData(true), 120000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleViewDetails = async (internshipId) => {
    try {
      const applications = await getAllApplications({ internshipId });
      const users = await getData("users");
      const internship = recentInternships.find((i) => i.id === internshipId);
      if (!internship) return;

      const applicantDetails = applications
        .map((app) => {
          const theUser = users.find((u) => u.id === app.userId);
          return theUser
            ? { ...theUser, applicationId: app.id, status: app.status }
            : null;
        })
        .filter(Boolean);

      setSelectedInternship(internship);
      setApplicants(applicantDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load internship details:", error);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading dashboard..." />;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => loadDashboardData()}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total Users" value={dashboardStats.totalUsers} />
        <StatsCard
          title="Internships"
          value={dashboardStats.totalInternships}
        />
        <StatsCard
          title="Applications"
          value={dashboardStats.totalApplications}
        />
      </div>

      {/* Recent Internships */}
      <section>
        <h2 className="font-semibold mb-2">Recent Internships</h2>
        {recentInternships.length === 0 ? (
          <p className="text-gray-500">No internships found.</p>
        ) : (
          <ul className="space-y-2">
            {recentInternships.map((i) => (
              <li
                key={i.id}
                className="border p-2 rounded flex justify-between"
              >
                <div>
                  <p className="font-medium">{i.title}</p>
                  <p className="text-sm text-gray-500">{i.company}</p>
                </div>
                <button
                  onClick={() => handleViewDetails(i.id)}
                  className="text-blue-600 hover:underline"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Applications */}
      <section>
        <h2 className="font-semibold mb-2">Recent Applications</h2>
        {recentApplications.length === 0 ? (
          <p className="text-gray-500">No applications yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentApplications.map((app) => (
              <li key={app.id} className="border p-2 rounded">
                {app.internName} applied for {app.internshipTitle}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Interviews */}
      <section>
        <h2 className="font-semibold mb-2">Upcoming Interviews</h2>
        {upcomingInterviews.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingInterviews.map((m) => (
              <li key={m.id} className="border p-2 rounded">
                {m.internName} with {m.mentorName} — {m.internshipTitle}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Updates */}
      <section>
        <h2 className="font-semibold mb-2">Recent Updates</h2>
        {recentUpdates.length === 0 ? (
          <p className="text-gray-500">No updates available.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentUpdates.map((n) => (
              <li key={n.id}>{n.message || n.title}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Details Modal */}
      <InternshipDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        internship={selectedInternship}
        applicants={applicants}
      />
    </div>
  );
};

export default AdminDashboard;
