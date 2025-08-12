import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import {
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoAlarmOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoSendOutline,
  IoChatbubbleOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoRefreshOutline,
  IoNotificationsOutline,
  IoAddOutline,
  IoArrowForward,
  IoChevronForward,
  IoPulseOutline,
  IoRibbonOutline,
  IoFlagOutline,
  IoSpeedometerOutline,
  IoFlashOutline,
  IoTrophyOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  "Not Started": { color: "bg-gray-100 text-gray-800", icon: IoTimeOutline },
  "In Progress": { color: "bg-blue-100 text-blue-800", icon: IoPulseOutline },
  "Pending Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
  },
  "Needs Revision": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
  },
  Approved: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Overdue: { color: "bg-red-200 text-red-900", icon: IoAlarmOutline },
};

const APPLICATION_STATUS_CONFIG = {
  Submitted: { color: "bg-blue-100 text-blue-800" },
  "Under Review": { color: "bg-yellow-100 text-yellow-800" },
  "Interview Scheduled": { color: "bg-purple-100 text-purple-800" },
  Shortlisted: { color: "bg-green-100 text-green-800" },
  Hired: { color: "bg-green-600 text-white" },
  Rejected: { color: "bg-red-100 text-red-800" },
};

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI states
  const [selectedTimeframe, setSelectedTimeframe] = useState("week"); // week, month, quarter
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load all dashboard data
  const loadDashboardData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Load all necessary data
        const [users, tasks, applications, updates] = await Promise.all([
          getData("users") || [],
          getData("tasks") || [],
          getData("applications") || [],
          getData("updates") || [],
        ]);

        // Filter interns assigned to this mentor
        const mentorInterns = users.filter(
          (u) =>
            u.role === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              u.mentor === user.name)
        );

        // Get tasks assigned to mentor's interns
        const internIds = mentorInterns.map((intern) => intern.id);
        const internTasks = tasks.filter(
          (task) =>
            internIds.includes(task.assignedTo || task.internId) ||
            task.mentorId === user.id ||
            task.assignedBy === user.name
        );

        // Get applications for internships this mentor is involved with
        const relevantApplications = applications.filter((app) => {
          // This would depend on your data structure
          return true; // For now, show all applications
        });

        // Filter recent updates relevant to mentor
        const relevantUpdates = updates
          .filter((update) => {
            return (
              update.targetRole === "All" ||
              update.targetRole === user.role ||
              update.targetRole === "Mentor" ||
              (update.targetRole === "Specific" &&
                update.targetUserId === user.id)
            );
          })
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Get pending tasks (those needing review)
        const tasksNeedingReview = internTasks.filter(
          (task) =>
            task.status === "Pending Review" || task.status === "Needs Revision"
        );

        // Enrich intern data with their progress and metrics
        const enrichedInterns = mentorInterns.map((intern) => {
          const internTaskList = internTasks.filter(
            (task) =>
              task.assignedTo === intern.id || task.internId === intern.id
          );

          const completedTasks = internTaskList.filter(
            (task) => task.status === "Approved"
          ).length;
          const totalTasks = internTaskList.length;
          const overdueTasks = internTaskList.filter((task) => {
            const dueDate = new Date(task.dueDate);
            return task.status !== "Approved" && dueDate < new Date();
          }).length;

          const internApplications = relevantApplications.filter(
            (app) => app.internId === intern.id || app.userId === intern.id
          );

          return {
            ...intern,
            tasksCompleted: completedTasks,
            totalTasks,
            overdueTasks,
            completionRate:
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0,
            applications: internApplications,
            lastActive: intern.lastLogin || intern.lastActive,
            performance: calculatePerformanceScore(internTaskList),
          };
        });

        setAssignedInterns(enrichedInterns);
        setPendingTasks(tasksNeedingReview.slice(0, 5)); // Show top 5
        setRecentUpdates(relevantUpdates.slice(0, 4)); // Show top 4
        setApplications(relevantApplications);
        setAllTasks(internTasks);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setMessage({
          type: "error",
          text: "Failed to load dashboard data. Please try again.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  // Initial load and periodic refresh
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadDashboardData(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate performance score based on tasks
  const calculatePerformanceScore = (tasks) => {
    if (tasks.length === 0) return 0;

    const completed = tasks.filter((task) => task.status === "Approved").length;
    const onTime = tasks.filter((task) => {
      if (task.status !== "Approved") return false;
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.updatedAt || task.completedAt);
      return completedDate <= dueDate;
    }).length;

    const completionRate = (completed / tasks.length) * 100;
    const onTimeRate = tasks.length > 0 ? (onTime / tasks.length) * 100 : 0;

    return Math.round(completionRate * 0.7 + onTimeRate * 0.3);
  };

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const now = new Date();
    const timeframes = {
      week: 7,
      month: 30,
      quarter: 90,
    };

    const daysAgo = timeframes[selectedTimeframe];
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Recent tasks (within timeframe)
    const recentTasks = allTasks.filter((task) => {
      const taskDate = new Date(task.createdAt || task.assignedAt);
      return taskDate >= cutoffDate;
    });

    const recentCompletedTasks = recentTasks.filter(
      (task) => task.status === "Approved"
    ).length;
    const totalPendingReview = allTasks.filter(
      (task) => task.status === "Pending Review"
    ).length;
    const totalOverdue = allTasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      return task.status !== "Approved" && dueDate < now;
    }).length;

    // Application metrics
    const recentApplications = applications.filter((app) => {
      const appDate = new Date(app.applicationDate || app.submittedAt);
      return appDate >= cutoffDate;
    }).length;

    // Intern performance
    const avgPerformance =
      assignedInterns.length > 0
        ? Math.round(
            assignedInterns.reduce(
              (sum, intern) => sum + intern.performance,
              0
            ) / assignedInterns.length
          )
        : 0;

    const activeInterns = assignedInterns.filter((intern) => {
      const lastActive = new Date(intern.lastActive || 0);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      return lastActive >= threeDaysAgo;
    }).length;

    return {
      totalInterns: assignedInterns.length,
      activeInterns,
      totalTasks: allTasks.length,
      recentTasks: recentTasks.length,
      recentCompletedTasks,
      pendingReview: totalPendingReview,
      overdueTasks: totalOverdue,
      recentApplications,
      avgPerformance,
      completionRate:
        allTasks.length > 0
          ? Math.round(
              (allTasks.filter((task) => task.status === "Approved").length /
                allTasks.length) *
                100
            )
          : 0,
    };
  }, [allTasks, assignedInterns, applications, selectedTimeframe]);

  const getStatusBadge = (status, config = STATUS_CONFIG) => {
    const statusConfig = config[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: IoTimeOutline,
    };
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading mentor dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || "Mentor"}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your interns and tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
          </select>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={
              message.type === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoPeopleOutline className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Assigned Interns
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.totalInterns}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <span>{stats.activeInterns} active</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoDocumentTextOutline className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tasks Pending Review
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.pendingReview}
                    </div>
                    {stats.overdueTasks > 0 && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                        <IoWarningOutline className="w-3 h-3 mr-1" />
                        <span>{stats.overdueTasks} overdue</span>
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoSpeedometerOutline className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Performance
                  </dt>
                  <dd className="flex items-baseline">
                    <div
                      className={`text-2xl font-semibold ${getPerformanceColor(stats.avgPerformance)}`}
                    >
                      {stats.avgPerformance}%
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      completion rate
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoTrendingUpOutline className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recent Activity
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.recentCompletedTasks}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      tasks completed
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Assigned Interns */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Your Interns
              </h3>
              <Link
                to="/mentor/assigned-interns"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
              >
                View All
                <IoChevronForward className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {assignedInterns.length === 0 ? (
              <div className="text-center py-6">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  No interns assigned
                </h3>
                <p className="text-sm text-gray-500">
                  You don't have any interns assigned to you yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedInterns.slice(0, 4).map((intern) => (
                  <div
                    key={intern.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {intern.name?.charAt(0) ||
                            intern.firstName?.charAt(0) ||
                            "I"}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {intern.name ||
                            `${intern.firstName} ${intern.lastName}`}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            {intern.university || "University not specified"}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {intern.tasksCompleted}/{intern.totalTasks} tasks
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${intern.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium ${getPerformanceColor(intern.performance)}`}
                        >
                          {intern.performance}%
                        </div>
                        <div className="text-xs text-gray-500">performance</div>
                      </div>

                      {intern.overdueTasks > 0 && (
                        <div className="flex items-center text-red-600">
                          <IoWarningOutline className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">
                            {intern.overdueTasks}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/mentor/intern/${intern.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <IoEyeOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {assignedInterns.length > 4 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/mentor/assigned-interns"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all {assignedInterns.length} interns →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>

          <div className="p-6 space-y-4">
            <Link
              to="/mentor/review-tasks"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group"
            >
              <div className="flex items-center">
                <IoEyeOutline className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Review Tasks
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.pendingReview} pending
                  </div>
                </div>
              </div>
              <IoChevronForward className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/mentor/assign-task"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center">
                <IoCreateOutline className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Assign New Task
                  </div>
                  <div className="text-xs text-gray-500">
                    Create task for interns
                  </div>
                </div>
              </div>
              <IoChevronForward className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/mentor/messages"
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center">
                <IoChatbubbleOutline className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Messages
                  </div>
                  <div className="text-xs text-gray-500">Chat with interns</div>
                </div>
              </div>
              <IoChevronForward className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/mentor/schedule"
              className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center">
                <IoCalendarOutline className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Schedule Meeting
                  </div>
                  <div className="text-xs text-gray-500">
                    Plan 1:1 with interns
                  </div>
                </div>
              </div>
              <IoChevronForward className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks to Review */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Tasks to Review
              </h3>
              <Link
                to="/mentor/review-tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
              >
                View All
                <IoChevronForward className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-6">
                <IoCheckmarkCircleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-sm text-gray-500">
                  No tasks are waiting for your review right now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {assignedInterns.find(
                            (intern) =>
                              intern.id === task.assignedTo ||
                              intern.id === task.internId
                          )?.name || "Unknown Intern"}
                        </span>
                        {getStatusBadge(task.status)}
                        <span className="text-xs text-gray-500">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() =>
                          navigate(`/mentor/review-task/${task.id}`)
                        }
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-md"
                        title="Review Task"
                      >
                        <IoEyeOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Updates
              </h3>
              <Link
                to="/mentor/notifications"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
              >
                View All
                <IoChevronForward className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {recentUpdates.length === 0 ? (
              <div className="text-center py-6">
                <IoNotificationsOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  No recent updates
                </h3>
                <p className="text-sm text-gray-500">
                  Stay tuned for important announcements and updates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {update.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {update.content}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>By {update.postedByUserRole || "Admin"}</span>
                          <span>•</span>
                          <span>{formatDate(update.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Performance Insights
          </h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.completionRate}%
              </div>
              <div className="text-sm font-medium text-gray-900">
                Task Completion Rate
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Across all your interns
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {assignedInterns.length > 0
                  ? Math.round(
                      assignedInterns.reduce(
                        (sum, intern) => sum + intern.completionRate,
                        0
                      ) / assignedInterns.length
                    )
                  : 0}
                %
              </div>
              <div className="text-sm font-medium text-gray-900">
                Avg Intern Progress
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Individual completion rates
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.recentTasks}
              </div>
              <div className="text-sm font-medium text-gray-900">
                Recent Tasks
              </div>
              <div className="text-xs text-gray-500 mt-1">
                In the last{" "}
                {selectedTimeframe === "week"
                  ? "7 days"
                  : selectedTimeframe === "month"
                    ? "30 days"
                    : "90 days"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
