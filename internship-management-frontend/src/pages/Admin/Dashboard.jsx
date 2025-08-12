// src/pages/Admin/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StatsCard from "../../components/admin/StatsCard"; // Updated import
import InternshipCard from "../../components/admin/AdminInternshipCard";
import InternshipDetailsModal from "./InternshipDetailsModal";
import Spinner from "../../components/ui/Spinner";

// Import real services
import {
  getAllInternships,
  getInternshipStats,
} from "../../services/internshipService";
import {
  getAllApplications,
  getApplicationStats,
} from "../../services/applicationService";
import { getData } from "../../services/dataService";
import { getAllNotifications } from "../../services/notificationService";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
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
    completedTasks: 0,
    upcomingInterviews: 0,
    // Trend data (you can calculate these from historical data)
    trends: {
      users: { value: 8, period: "vs last month" },
      applications: { value: -3, period: "vs last week" },
      internships: { value: 15, period: "vs last month" },
      interviews: { value: 22, period: "vs last week" },
    },
  });

  const [recentInternships, setRecentInternships] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);

  // Modal state
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [
        internshipsData,
        internshipStats,
        applicationsData,
        applicationStats,
        usersData,
        meetingsData,
        notificationsData,
      ] = await Promise.allSettled([
        getAllInternships(),
        getInternshipStats(),
        getAllApplications(),
        getApplicationStats(),
        getData("users"),
        getData("meetings"),
        getAllNotifications({ limit: 5 }),
      ]);

      // Process data
      const internships =
        internshipsData.status === "fulfilled" ? internshipsData.value : [];
      const stats =
        internshipStats.status === "fulfilled" ? internshipStats.value : {};
      const applications =
        applicationsData.status === "fulfilled" ? applicationsData.value : [];
      const appStats =
        applicationStats.status === "fulfilled" ? applicationStats.value : {};
      const users = usersData.status === "fulfilled" ? usersData.value : [];
      const meetings =
        meetingsData.status === "fulfilled" ? meetingsData.value : [];
      const notifications =
        notificationsData.status === "fulfilled" ? notificationsData.value : [];

      // Calculate statistics
      const mentorCount = users.filter((u) => u.role === "Mentor").length;
      const internCount = users.filter((u) => u.role === "Intern").length;
      const activeInternshipCount = internships.filter(
        (i) => i.status === "Open"
      ).length;

      // Calculate upcoming interviews
      const now = new Date();
      const upcomingInterviewCount = meetings.filter(
        (meeting) => new Date(meeting.scheduledAt) > now
      ).length;

      // Update dashboard stats with enhanced data
      setDashboardStats((prev) => ({
        ...prev,
        totalUsers: users.length,
        totalInterns: internCount,
        totalMentors: mentorCount,
        totalInternships: internships.length,
        activeInternships: activeInternshipCount,
        totalApplications: appStats.total || applications.length,
        pendingApplications: appStats.pending || 0,
        approvedApplications: appStats.approved || 0,
        rejectedApplications: appStats.rejected || 0,
        upcomingInterviews: upcomingInterviewCount,
        // You can calculate actual trends from historical data
        trends: {
          users: { value: 8, period: "vs last month" },
          applications: {
            value: applications.length > prev.totalApplications ? 5 : -3,
            period: "vs last week",
          },
          internships: { value: 15, period: "vs last month" },
          interviews: {
            value: upcomingInterviewCount > 0 ? 22 : -5,
            period: "vs last week",
          },
        },
      }));

      // Set other data
      const sortedInternships = internships
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setRecentInternships(sortedInternships);

      const enrichedApplications = applications.map((app) => {
        const intern = users.find((u) => u.id === app.userId);
        const internship = internships.find((i) => i.id === app.internshipId);
        return {
          ...app,
          internName: intern?.name || "Unknown Intern",
          internshipTitle: internship?.title || "Unknown Internship",
        };
      });

      const sortedApplications = enrichedApplications
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 3);
      setRecentApplications(sortedApplications);

      const enrichedMeetings = meetings.map((meeting) => {
        const intern = users.find((u) => u.id === meeting.participantIds?.[0]);
        const mentor = users.find((u) => u.id === meeting.mentorId);
        const internship = internships.find(
          (i) => i.id === meeting.internshipId
        );

        return {
          ...meeting,
          internName: intern?.name || "Unknown Intern",
          mentorName: mentor?.name || "Unknown Mentor",
          internshipTitle: internship?.title || "Unknown Internship",
        };
      });

      const upcomingMeetings = enrichedMeetings
        .filter((meeting) => new Date(meeting.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        .slice(0, 3);
      setUpcomingInterviews(upcomingMeetings);

      setRecentUpdates(notifications.slice(0, 3));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try refreshing.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 120000);
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
          const user = users.find((u) => u.id === app.userId);
          return user
            ? { ...user, applicationId: app.id, status: app.status }
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

  const handleEndInternship = async (internshipId) => {
    try {
      await loadDashboardData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to end internship:", error);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Dashboard
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome, Admin!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your internship program today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Refresh
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          count={dashboardStats.totalUsers}
          subtitle={`${dashboardStats.totalInterns} interns, ${dashboardStats.totalMentors} mentors`}
          icon="total"
          trend={dashboardStats.trends.users}
          onClick={() => navigate("/admin/manage-users")}
          isLoading={refreshing}
          size="default"
        />

        <StatsCard
          title="Active Internships"
          count={dashboardStats.activeInternships}
          subtitle={`${dashboardStats.totalInternships} total listings`}
          icon="active"
          trend={dashboardStats.trends.internships}
          onClick={() => navigate("/admin/all-internships")}
          isLoading={refreshing}
          size="default"
        />

        <StatsCard
          title="Pending Applications"
          count={dashboardStats.pendingApplications}
          subtitle={`${dashboardStats.totalApplications} total applications`}
          icon="pending"
          trend={dashboardStats.trends.applications}
          onClick={() => navigate("/admin/manage-applications")}
          isLoading={refreshing}
          size="default"
        />

        <StatsCard
          title="Upcoming Interviews"
          count={dashboardStats.upcomingInterviews}
          subtitle="Scheduled this week"
          icon="interviews"
          trend={dashboardStats.trends.interviews}
          onClick={() => navigate("/admin/interview-scheduler")}
          isLoading={refreshing}
          size="default"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Approved Applications"
          count={dashboardStats.approvedApplications}
          icon="completed"
          onClick={() => navigate("/admin/manage-applications?status=approved")}
          isLoading={refreshing}
          size="compact"
        />

        <StatsCard
          title="Rejected Applications"
          count={dashboardStats.rejectedApplications}
          icon="rejected"
          onClick={() => navigate("/admin/manage-applications?status=rejected")}
          isLoading={refreshing}
          size="compact"
        />

        <StatsCard
          title="Total Mentors"
          count={dashboardStats.totalMentors}
          icon="mentor"
          onClick={() => navigate("/admin/manage-users?role=mentor")}
          isLoading={refreshing}
          size="compact"
        />
      </div>

      {/* Recent Updates Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Updates
          </h2>
          <Link
            to="/admin/notifications"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        {recentUpdates.length === 0 ? (
          <p className="text-gray-500">No recent updates.</p>
        ) : (
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <div
                key={update.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <h3 className="font-medium text-gray-900">{update.title}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {update.message || update.content}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(update.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Applications
          </h2>
          <Link
            to="/admin/manage-applications"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <p className="text-gray-500">No recent applications.</p>
        ) : (
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {app.internName}
                  </h3>
                  <p className="text-gray-600 text-sm">{app.internshipTitle}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      app.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : app.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Upcoming Interviews
          </h2>
          <Link
            to="/admin/interview-scheduler"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        {upcomingInterviews.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map((meeting) => (
              <div
                key={meeting.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {meeting.internshipTitle}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {meeting.internName} with {meeting.mentorName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 text-sm font-medium">
                    {new Date(meeting.scheduledAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(meeting.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Internships */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Listings
          </h2>
          <Link
            to="/admin/all-internships"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentInternships.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              onViewDetails={() => handleViewDetails(internship.id)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <InternshipDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        internship={selectedInternship}
        applicants={applicants}
        onEndInternship={handleEndInternship}
      />
    </div>
  );
};

export default AdminDashboard;
