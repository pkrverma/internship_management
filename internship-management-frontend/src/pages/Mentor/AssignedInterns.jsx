// src/pages/Mentor/AssignedInterns.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoPeopleOutline,
  IoEyeOutline,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoLocationOutline,
  IoMailOutline,
  IoCallOutline,
  IoPersonOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoAddOutline,
  IoCreateOutline,
  IoArrowForward,
  IoChevronForward,
  IoPulseOutline,
  IoStarOutline,
  IoRibbonOutline,
  IoSpeedometerOutline,
} from "react-icons/io5";

const INTERN_STATUS_CONFIG = {
  Active: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Inactive: { color: "bg-red-100 text-red-800", icon: IoWarningOutline },
  "On Break": { color: "bg-yellow-100 text-yellow-800", icon: IoTimeOutline },
  Completed: { color: "bg-blue-100 text-blue-800", icon: IoRibbonOutline },
  Probation: { color: "bg-orange-100 text-orange-800", icon: IoWarningOutline },
};

const AssignedInterns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("assigned_interns_view") || "cards"
  );
  const [selectedIntern, setSelectedIntern] = useState(null);

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load interns and related data
  const loadData = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Load all necessary data
        const [allUsers, allTasks, allApplications] = await Promise.all([
          getData("users") || [],
          getData("tasks") || [],
          getData("applications") || [],
        ]);

        // Filter interns assigned to this mentor
        const mentorInterns = allUsers.filter(
          (u) =>
            u.role === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              u.mentor === user.name)
        );

        // Get all tasks for these interns
        const internIds = mentorInterns.map((intern) => intern.id);
        const internTasks = allTasks.filter((task) =>
          internIds.includes(task.assignedTo || task.internId)
        );

        // Get applications for these interns
        const internApplications = allApplications.filter((app) =>
          internIds.includes(app.internId || app.userId)
        );

        // Enrich intern data with performance metrics
        const enrichedInterns = mentorInterns.map((intern) => {
          const internTaskList = internTasks.filter(
            (task) =>
              task.assignedTo === intern.id || task.internId === intern.id
          );

          const internApps = internApplications.filter(
            (app) => app.internId === intern.id || app.userId === intern.id
          );

          // Calculate performance metrics
          const totalTasks = internTaskList.length;
          const completedTasks = internTaskList.filter(
            (task) => task.status === "Approved"
          ).length;
          const onTimeTasks = internTaskList.filter((task) => {
            if (task.status !== "Approved") return false;
            const dueDate = new Date(task.dueDate);
            const completedDate = new Date(task.updatedAt || task.completedAt);
            return completedDate <= dueDate;
          }).length;

          const overdueTasks = internTaskList.filter((task) => {
            const dueDate = new Date(task.dueDate);
            return task.status !== "Approved" && dueDate < new Date();
          }).length;

          const pendingTasks = internTaskList.filter(
            (task) =>
              task.status === "Pending Review" ||
              task.status === "Needs Revision"
          ).length;

          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
          const onTimeRate =
            totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;
          const performanceScore = Math.round(
            completionRate * 0.7 + onTimeRate * 0.3
          );

          // Recent activity
          const lastActiveDate =
            intern.lastLogin || intern.lastActive || intern.updatedAt;
          const daysInactive = lastActiveDate
            ? Math.floor(
                (new Date() - new Date(lastActiveDate)) / (1000 * 60 * 60 * 24)
              )
            : null;

          return {
            ...intern,
            totalTasks,
            completedTasks,
            onTimeTasks,
            overdueTasks,
            pendingTasks,
            completionRate,
            onTimeRate,
            performanceScore,
            applications: internApps,
            daysInactive,
            lastActiveDate,
            joinDate: intern.startDate || intern.joinedAt || intern.createdAt,
            currentUniversity: intern.university || intern.currentUniversity,
            status: intern.status || (daysInactive > 7 ? "Inactive" : "Active"),
            grade: calculateGrade(performanceScore),
            trend: calculateTrend(internTaskList),
          };
        });

        setInterns(enrichedInterns);
        setTasks(internTasks);
        setApplications(internApplications);
      } catch (error) {
        console.error("Failed to load assigned interns:", error);
        setMessage({
          type: "error",
          text: "Failed to load interns. Please try again.",
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
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [loadData]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("assigned_interns_view", viewMode);
  }, [viewMode]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Helper functions
  const calculateGrade = (score) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "C+";
    if (score >= 70) return "C";
    if (score >= 65) return "D+";
    if (score >= 60) return "D";
    return "F";
  };

  const calculateTrend = (taskList) => {
    if (taskList.length < 2) return "stable";

    const recentTasks = taskList.filter((task) => {
      const taskDate = new Date(task.createdAt || task.assignedAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return taskDate >= twoWeeksAgo;
    });

    const olderTasks = taskList.filter((task) => {
      const taskDate = new Date(task.createdAt || task.assignedAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      return taskDate < twoWeeksAgo && taskDate >= fourWeeksAgo;
    });

    const recentCompletionRate =
      recentTasks.length > 0
        ? recentTasks.filter((task) => task.status === "Approved").length /
          recentTasks.length
        : 0;
    const olderCompletionRate =
      olderTasks.length > 0
        ? olderTasks.filter((task) => task.status === "Approved").length /
          olderTasks.length
        : 0;

    if (recentCompletionRate > olderCompletionRate + 0.1) return "improving";
    if (recentCompletionRate < olderCompletionRate - 0.1) return "declining";
    return "stable";
  };

  // Filter and sort interns
  const filteredAndSortedInterns = useMemo(() => {
    let filtered = interns.filter((intern) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        intern.name?.toLowerCase().includes(searchLower) ||
        intern.firstName?.toLowerCase().includes(searchLower) ||
        intern.lastName?.toLowerCase().includes(searchLower) ||
        intern.email?.toLowerCase().includes(searchLower) ||
        intern.currentUniversity?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || intern.status === statusFilter;

      // University filter
      const matchesUniversity =
        universityFilter === "all" ||
        intern.currentUniversity === universityFilter;

      // Performance filter
      const matchesPerformance = (() => {
        if (performanceFilter === "all") return true;
        switch (performanceFilter) {
          case "excellent":
            return intern.performanceScore >= 90;
          case "good":
            return (
              intern.performanceScore >= 75 && intern.performanceScore < 90
            );
          case "average":
            return (
              intern.performanceScore >= 60 && intern.performanceScore < 75
            );
          case "needs_improvement":
            return intern.performanceScore < 60;
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesUniversity &&
        matchesPerformance
      );
    });

    // Sort interns
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = (a.name || `${a.firstName} ${a.lastName}`).toLowerCase();
          bVal = (b.name || `${b.firstName} ${b.lastName}`).toLowerCase();
          break;
        case "performance":
          aVal = a.performanceScore;
          bVal = b.performanceScore;
          break;
        case "completionRate":
          aVal = a.completionRate;
          bVal = b.completionRate;
          break;
        case "joinDate":
          aVal = new Date(a.joinDate || 0);
          bVal = new Date(b.joinDate || 0);
          break;
        case "lastActive":
          aVal = new Date(a.lastActiveDate || 0);
          bVal = new Date(b.lastActiveDate || 0);
          break;
        case "university":
          aVal = a.currentUniversity?.toLowerCase() || "";
          bVal = b.currentUniversity?.toLowerCase() || "";
          break;
        default:
          aVal = (a.name || `${a.firstName} ${a.lastName}`).toLowerCase();
          bVal = (b.name || `${b.firstName} ${b.lastName}`).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [
    interns,
    searchQuery,
    statusFilter,
    universityFilter,
    performanceFilter,
    sortBy,
    sortOrder,
  ]);

  // Get unique universities for filter
  const universities = useMemo(() => {
    const uniqueUniversities = [
      ...new Set(
        interns.map((intern) => intern.currentUniversity).filter(Boolean)
      ),
    ];
    return uniqueUniversities.sort();
  }, [interns]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = interns.length;
    const active = interns.filter(
      (intern) => intern.status === "Active"
    ).length;
    const avgPerformance =
      interns.length > 0
        ? Math.round(
            interns.reduce((sum, intern) => sum + intern.performanceScore, 0) /
              interns.length
          )
        : 0;
    const highPerformers = interns.filter(
      (intern) => intern.performanceScore >= 85
    ).length;
    const needsAttention = interns.filter(
      (intern) => intern.overdueTasks > 0 || intern.performanceScore < 60
    ).length;

    return {
      total,
      active,
      avgPerformance,
      highPerformers,
      needsAttention,
    };
  }, [interns]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const config =
      INTERN_STATUS_CONFIG[status] || INTERN_STATUS_CONFIG["Active"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <IoTrendingUpOutline className="w-4 h-4 text-green-600" />;
      case "declining":
        return <IoTrendingDownOutline className="w-4 h-4 text-red-600" />;
      default:
        return <IoPulseOutline className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderInternCard = (intern) => (
    <div
      key={intern.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-700">
                {(intern.name || intern.firstName)?.charAt(0) || "I"}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {intern.name || `${intern.firstName} ${intern.lastName}`}
              </h3>
              <p className="text-sm text-gray-600">{intern.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {intern.currentUniversity}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(intern.status)}
            <div className="flex items-center space-x-1">
              <span
                className={`text-lg font-bold ${getPerformanceColor(intern.performanceScore)}`}
              >
                {intern.performanceScore}%
              </span>
              {getTrendIcon(intern.trend)}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {intern.completedTasks}/{intern.totalTasks}
            </div>
            <div className="text-xs text-gray-500">Tasks Completed</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div
              className={`text-lg font-bold ${intern.overdueTasks > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {intern.overdueTasks}
            </div>
            <div className="text-xs text-gray-500">Overdue</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Completion Rate</span>
            <span>{intern.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${intern.completionRate}%` }}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 text-xs text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Grade:</span>
            <span
              className={`font-medium ${getPerformanceColor(intern.performanceScore)}`}
            >
              {intern.grade}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Joined:</span>
            <span>{formatDate(intern.joinDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Active:</span>
            <span className={intern.daysInactive > 3 ? "text-orange-600" : ""}>
              {intern.daysInactive === 0
                ? "Today"
                : intern.daysInactive === 1
                  ? "Yesterday"
                  : `${intern.daysInactive} days ago`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {intern.pendingTasks > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {intern.pendingTasks} pending
              </span>
            )}
            {intern.overdueTasks > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {intern.overdueTasks} overdue
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/mentor/intern/${intern.id}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <IoEyeOutline className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate(`/mentor/chat/${intern.id}`)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Chat"
            >
              <IoChatbubbleOutline className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                navigate(`/mentor/assign-task?intern=${intern.id}`)
              }
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="Assign Task"
            >
              <IoCreateOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInternRow = (intern) => (
    <div
      key={intern.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {(intern.name || intern.firstName)?.charAt(0) || "I"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {intern.name || `${intern.firstName} ${intern.lastName}`}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {intern.currentUniversity}
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {intern.completedTasks}/{intern.totalTasks}
              </div>
              <div className="text-gray-500">Tasks</div>
            </div>

            <div className="text-center">
              <div
                className={`font-medium ${getPerformanceColor(intern.performanceScore)}`}
              >
                {intern.performanceScore}%
              </div>
              <div className="text-gray-500">Score</div>
            </div>

            <div className="text-center">
              <div className="font-medium text-gray-900">
                {formatDate(intern.joinDate)}
              </div>
              <div className="text-gray-500">Joined</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(intern.status)}

            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate(`/mentor/intern/${intern.id}`)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="View Details"
              >
                <IoEyeOutline className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate(`/mentor/chat/${intern.id}`)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Chat"
              >
                <IoChatbubbleOutline className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  navigate(`/mentor/assign-task?intern=${intern.id}`)
                }
                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                title="Assign Task"
              >
                <IoCreateOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading assigned interns..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigned Interns</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your assigned interns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData(true)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Interns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoSpeedometerOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Performance
              </p>
              <p
                className={`text-2xl font-semibold ${getPerformanceColor(stats.avgPerformance)}`}
              >
                {stats.avgPerformance}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStarOutline className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                High Performers
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.highPerformers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoWarningOutline className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Needs Attention
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.needsAttention}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search interns by name, email, or university..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <IoFilterOutline className="mr-2 h-4 w-4" />
            Filters
            {(statusFilter !== "all" ||
              universityFilter !== "all" ||
              performanceFilter !== "all") && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                Active
              </span>
            )}
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.keys(INTERN_STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Universities</option>
              {universities.map((university) => (
                <option key={university} value={university}>
                  {university}
                </option>
              ))}
            </select>

            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Performance</option>
              <option value="excellent">Excellent (90%+)</option>
              <option value="good">Good (75-89%)</option>
              <option value="average">Average (60-74%)</option>
              <option value="needs_improvement">
                Needs Improvement (&lt;60%)
              </option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="performance-desc">Performance (High-Low)</option>
              <option value="performance-asc">Performance (Low-High)</option>
              <option value="joinDate-desc">Newest First</option>
              <option value="joinDate-asc">Oldest First</option>
              <option value="lastActive-desc">Recently Active</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter("all");
                setUniversityFilter("all");
                setPerformanceFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedInterns.length} of {interns.length} interns
        </div>
      </div>

      {/* Interns List */}
      {filteredAndSortedInterns.length === 0 ? (
        <div className="text-center py-12">
          <IoPeopleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {interns.length === 0 ? "No interns assigned" : "No interns found"}
          </h3>
          <p className="text-gray-500">
            {interns.length === 0
              ? "You don't have any interns assigned to you yet"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "cards"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedInterns.map((intern) =>
            viewMode === "cards"
              ? renderInternCard(intern)
              : renderInternRow(intern)
          )}
        </div>
      )}
    </div>
  );
};

export default AssignedInterns;
