import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyApplications } from "../../services/applicationService";
import { getAvailableInternships } from "../../services/internshipService";
import { getAllNotifications } from "../../services/notificationService";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";

const InternDashboard = () => {
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [dashboardData, setDashboardData] = useState({
    myApplications: [],
    availableInternships: [],
    myTasks: [],
    upcomingMeetings: [],
    recentNotifications: [],
  });

  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  // Load dashboard data
  const loadDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Fetch all data in parallel
        const [
          applicationsResult,
          internshipsResult,
          notificationsResult,
          tasksResult,
          meetingsResult,
        ] = await Promise.allSettled([
          getMyApplications(user.id),
          getAvailableInternships(),
          getAllNotifications({ limit: 5 }),
          getData("tasks", { userId: user.id }), // You might want to create a taskService
          getData("meetings", { participantIds: [user.id] }), // You might want to create a meetingService
        ]);

        const applications =
          applicationsResult.status === "fulfilled"
            ? applicationsResult.value
            : [];
        const internships =
          internshipsResult.status === "fulfilled"
            ? internshipsResult.value
            : [];
        const notifications =
          notificationsResult.status === "fulfilled"
            ? notificationsResult.value
            : [];
        const tasks =
          tasksResult.status === "fulfilled" ? tasksResult.value : [];
        const meetings =
          meetingsResult.status === "fulfilled" ? meetingsResult.value : [];

        // Calculate statistics
        const applicationStats = {
          totalApplications: applications.length,
          pendingApplications: applications.filter(
            (app) => app.status === "Pending"
          ).length,
          approvedApplications: applications.filter(
            (app) => app.status === "Approved"
          ).length,
          completedTasks: tasks.filter((task) => task.status === "Completed")
            .length,
          pendingTasks: tasks.filter(
            (task) => task.status === "Pending" || task.status === "In Progress"
          ).length,
        };

        // Filter upcoming meetings
        const now = new Date();
        const upcomingMeetings = meetings
          .filter((meeting) => new Date(meeting.scheduledAt) > now)
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
          .slice(0, 3);

        // Get recent applications
        const recentApplications = applications
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, 3);

        // Get available internships (limit to 3)
        const limitedInternships = internships.slice(0, 3);

        setDashboardData({
          myApplications: recentApplications,
          availableInternships: limitedInternships,
          myTasks: tasks.slice(0, 3),
          upcomingMeetings,
          recentNotifications: notifications,
        });

        setStats(applicationStats);
      } catch (error) {
        console.error("Failed to load intern dashboard data:", error);
        setError("Failed to load dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 180000); // 3 minutes

    return () => clearInterval(interval);
  }, [loadDashboardData]);

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
        <h1 className="text-3xl font-extrabold text-gray-900">
          Welcome, {user?.name || "Intern"}!
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Total Applications
          </h3>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.totalApplications}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Pending Applications
          </h3>
          <p className="text-2xl font-semibold text-yellow-600">
            {stats.pendingApplications}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Approved Applications
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            {stats.approvedApplications}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {stats.pendingTasks}
          </p>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Updates
          </h2>
          <Link
            to="/intern/notifications"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        {dashboardData.recentNotifications.length === 0 ? (
          <p className="text-gray-500">No recent updates.</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <h3 className="font-medium text-gray-900">
                  {notification.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {notification.message || notification.content}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(notification.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Applications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              My Applications
            </h2>
            <Link
              to="/intern/applications"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          {dashboardData.myApplications.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No applications yet.</p>
              <Link
                to="/internships"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Internships
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.myApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {app.internshipTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Applied on{" "}
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        app.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : app.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : app.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Internships */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Internships
            </h2>
            <Link
              to="/internships"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Browse All
            </Link>
          </div>
          {dashboardData.availableInternships.length === 0 ? (
            <p className="text-gray-500">
              No internships available at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {dashboardData.availableInternships.map((internship) => (
                <div
                  key={internship.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">
                    {internship.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {internship.department}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {internship.description}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      Deadline:{" "}
                      {new Date(
                        internship.applicationDeadline
                      ).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/intern/apply/${internship.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
          <Link
            to="/intern/tasks"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All
          </Link>
        </div>
        {dashboardData.myTasks.length === 0 ? (
          <p className="text-gray-500">No tasks assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.myTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : task.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : task.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      {dashboardData.upcomingMeetings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Meetings
            </h2>
            <Link
              to="/intern/meetings"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                  <p className="text-sm text-gray-600">
                    with {meeting.mentorName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(meeting.scheduledAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(meeting.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternDashboard;
