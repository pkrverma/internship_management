import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoBusinessOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoHourglassOutline,
  IoPeopleOutline,
  IoMailOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoAddOutline,
  IoDownloadOutline,
  IoShareSocialOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Draft: {
    color: "bg-gray-100 text-gray-800",
    icon: IoCreateOutline,
    description: "Application saved as draft",
    progress: 0,
  },
  Submitted: {
    color: "bg-blue-100 text-blue-800",
    icon: IoDocumentTextOutline,
    description: "Application submitted successfully",
    progress: 20,
  },
  "Under Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoHourglassOutline,
    description: "Application being reviewed",
    progress: 40,
  },
  "Interview Scheduled": {
    color: "bg-purple-100 text-purple-800",
    icon: IoCalendarOutline,
    description: "Interview has been scheduled",
    progress: 60,
  },
  Shortlisted: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
    description: "You've been shortlisted",
    progress: 80,
  },
  Hired: {
    color: "bg-green-600 text-white",
    icon: IoCheckmarkCircleOutline,
    description: "Congratulations! You got the position",
    progress: 100,
  },
  Rejected: {
    color: "bg-red-100 text-red-800",
    icon: IoCloseCircleOutline,
    description: "Application was not successful",
    progress: 100,
  },
};

const MyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("my_apps_view_mode") || "cards"
  );
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    application: null,
    title: "",
    message: "",
  });

  // Messages
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch applications and internships data
  const fetchData = useCallback(
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

        const allApps = getData("applications") || [];
        const internshipsData = getData("internships") || [];

        // Filter applications for current user (support both internId and userId)
        const currentUserApps = allApps.filter(
          (app) => app.internId === user.id || app.userId === user.id
        );

        // Enrich applications with internship details
        const enrichedApplications = currentUserApps.map((app) => {
          const internship = internshipsData.find(
            (i) => i.id === app.internshipId
          );

          return {
            ...app,
            internshipTitle: internship?.title || "Unknown Position",
            internshipLocation: internship?.location || "N/A",
            internshipStipend: internship?.stipend || "N/A",
            internshipDuration: internship?.duration || "N/A",
            internshipCompany: internship?.company || "Aninex Global",
            internshipDeadline:
              internship?.applicationDeadline || internship?.applyBy,
            internshipType: internship?.type || "Full-time",
            internshipDepartment: internship?.department,
            applicationDate:
              app.applicationDate || app.submittedAt || app.createdAt,
            lastUpdated:
              app.updatedAt ||
              app.applicationDate ||
              app.submittedAt ||
              app.createdAt,
          };
        });

        setApplications(enrichedApplications);
        setInternships(internshipsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setMessage({
          type: "error",
          text: "Failed to load applications. Please try again.",
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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("my_apps_view_mode", viewMode);
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

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications.filter((app) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        app.internshipTitle?.toLowerCase().includes(searchLower) ||
        app.internshipCompany?.toLowerCase().includes(searchLower) ||
        app.internshipLocation?.toLowerCase().includes(searchLower) ||
        app.internshipDepartment?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "All" || app.status === statusFilter;

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === "all") return true;

        const appDate = new Date(app.applicationDate);
        const now = new Date();
        const daysDiff = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "older":
            return daysDiff > 30;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.applicationDate || 0) - new Date(a.applicationDate || 0)
          );
        case "oldest":
          return (
            new Date(a.applicationDate || 0) - new Date(b.applicationDate || 0)
          );
        case "status":
          return (
            (STATUS_CONFIG[a.status]?.progress || 0) -
            (STATUS_CONFIG[b.status]?.progress || 0)
          );
        case "company":
          return (a.internshipCompany || "").localeCompare(
            b.internshipCompany || ""
          );
        case "deadline":
          return (
            new Date(a.internshipDeadline || 0) -
            new Date(b.internshipDeadline || 0)
          );
        default:
          return (
            new Date(b.applicationDate || 0) - new Date(a.applicationDate || 0)
          );
      }
    });

    return filtered;
  }, [applications, searchQuery, statusFilter, dateFilter, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const statusCounts = {};
    Object.keys(STATUS_CONFIG).forEach((status) => {
      statusCounts[status] = applications.filter(
        (app) => app.status === status
      ).length;
    });

    const thisMonth = applications.filter((app) => {
      const appDate = new Date(app.applicationDate);
      const now = new Date();
      return (
        appDate.getMonth() === now.getMonth() &&
        appDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      total: applications.length,
      ...statusCounts,
      thisMonth,
      successRate:
        applications.length > 0
          ? Math.round(
              (((statusCounts.Hired || 0) + (statusCounts.Shortlisted || 0)) /
                applications.length) *
                100
            )
          : 0,
    };
  }, [applications]);

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setIsDetailsModalOpen(true);
  };

  const handleWithdrawApplication = (application) => {
    if (application.status === "Hired" || application.status === "Rejected") {
      setMessage({
        type: "error",
        text: "Cannot withdraw a completed application.",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "withdraw",
      application,
      title: "Withdraw Application",
      message: `Are you sure you want to withdraw your application for "${application.internshipTitle}"? This action cannot be undone.`,
    });
  };

  const confirmWithdraw = async () => {
    const { application } = confirmModal;

    try {
      setRefreshing(true);

      // In a real app, this would call an API
      const allApps = getData("applications") || [];
      const updatedApps = allApps.filter(
        (app) =>
          !(
            app.applicationId === application.applicationId ||
            app.id === application.id
          )
      );

      // Save updated applications (removing the withdrawn one)
      localStorage.setItem("applications", JSON.stringify(updatedApps));

      setMessage({
        type: "success",
        text: "Application withdrawn successfully.",
      });

      // Refresh data
      await fetchData(true);
    } catch (error) {
      console.error("Failed to withdraw application:", error);
      setMessage({
        type: "error",
        text: "Failed to withdraw application. Please try again.",
      });
    } finally {
      setRefreshing(false);
      setConfirmModal({
        isOpen: false,
        type: null,
        application: null,
        title: "",
        message: "",
      });
    }
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
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["Submitted"];
    const Icon = config.icon;

    return (
      <div className="flex items-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
        >
          <Icon className="w-3 h-3 mr-1" />
          {status}
        </span>
        {config.progress < 100 && config.progress > 0 && (
          <div className="ml-3 flex-1 bg-gray-200 rounded-full h-1.5 min-w-[60px] max-w-[100px]">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${config.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderApplicationCard = (app) => (
    <div
      key={app.applicationId || app.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {app.internshipTitle}
            </h3>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <IoBusinessOutline className="w-4 h-4 mr-1" />
                {app.internshipCompany}
              </div>
              <div className="flex items-center">
                <IoLocationOutline className="w-4 h-4 mr-1" />
                {app.internshipLocation}
              </div>
            </div>
          </div>

          <div className="ml-4 text-right">
            {getStatusBadge(app.status)}
            <p className="text-xs text-gray-500 mt-2">
              Applied {formatDate(app.applicationDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <IoCashOutline className="w-4 h-4 mr-2" />
            <span>Stipend: {app.internshipStipend}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <IoTimeOutline className="w-4 h-4 mr-2" />
            <span>Duration: {app.internshipDuration}</span>
          </div>
          {app.internshipDeadline && (
            <div className="flex items-center text-gray-600">
              <IoCalendarOutline className="w-4 h-4 mr-2" />
              <span>Deadline: {formatDate(app.internshipDeadline)}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <IoDocumentTextOutline className="w-4 h-4 mr-2" />
            <span>Type: {app.internshipType}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {STATUS_CONFIG[app.status]?.description}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewDetails(app)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <IoEyeOutline className="w-3 h-3 mr-1" />
              View Details
            </button>

            {(app.status === "Draft" ||
              app.status === "Submitted" ||
              app.status === "Under Review") && (
              <button
                onClick={() => handleWithdrawApplication(app)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                <IoTrashOutline className="w-3 h-3 mr-1" />
                Withdraw
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationRow = (app) => (
    <div
      key={app.applicationId || app.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {app.internshipTitle}
              </h3>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span>{app.internshipCompany}</span>
                <span>•</span>
                <span>{app.internshipLocation}</span>
                <span>•</span>
                <span>Applied {formatDate(app.applicationDate)}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6 text-xs text-gray-600">
              <div>{app.internshipStipend}</div>
              <div>{app.internshipDuration}</div>
              <div>{app.internshipType}</div>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusBadge(app.status)}

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewDetails(app)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View Details"
                >
                  <IoEyeOutline className="w-4 h-4" />
                </button>

                {(app.status === "Draft" ||
                  app.status === "Submitted" ||
                  app.status === "Under Review") && (
                  <button
                    onClick={() => handleWithdrawApplication(app)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Withdraw Application"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                )}
              </div>
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
          <Spinner size="lg" text="Loading your applications..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">
            Track the status of your internship applications
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={() => navigate("/internships")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Apply for More
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStatsChartOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoHourglassOutline className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(stats["Under Review"] || 0) + (stats["Submitted"] || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Success</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(stats.Hired || 0) + (stats.Shortlisted || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoTrendingUpOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.thisMonth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-indigo-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.successRate}%
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
            placeholder="Search applications by company, position, or location..."
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
            {(statusFilter !== "All" || dateFilter !== "all") && (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Status</option>
              {Object.keys(STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="older">Older</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">By Status</option>
              <option value="company">By Company</option>
              <option value="deadline">By Deadline</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter("All");
                setDateFilter("all");
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
          Showing {filteredAndSortedApplications.length} of{" "}
          {applications.length} applications
        </div>
      </div>

      {/* Applications List */}
      {filteredAndSortedApplications.length === 0 ? (
        <div className="text-center py-12">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {applications.length === 0
              ? "No applications yet"
              : "No applications found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {applications.length === 0
              ? "Start applying for internships to see them here"
              : "Try adjusting your search or filters"}
          </p>
          {applications.length === 0 && (
            <button
              onClick={() => navigate("/internships")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <IoAddOutline className="w-4 h-4 mr-2" />
              Browse Internships
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "cards"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedApplications.map((app) =>
            viewMode === "cards"
              ? renderApplicationCard(app)
              : renderApplicationRow(app)
          )}
        </div>
      )}

      {/* Application Details Modal */}
      {isDetailsModalOpen && selectedApplication && (
        <ApplicationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onWithdraw={handleWithdrawApplication}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            application: null,
            title: "",
            message: "",
          })
        }
        onConfirm={confirmWithdraw}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Withdraw"
        cancelText="Cancel"
        danger={true}
        loading={refreshing}
      />
    </div>
  );
};

// Application Details Modal Component
const ApplicationDetailsModal = ({
  isOpen,
  onClose,
  application,
  onWithdraw,
}) => {
  if (!isOpen || !application) return null;

  const config =
    STATUS_CONFIG[application.status] || STATUS_CONFIG["Submitted"];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Application Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Application Status
              </h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {application.status}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${config.progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-600">{config.description}</p>
          </div>

          {/* Internship Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Internship Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Position</p>
                <p className="text-gray-900">{application.internshipTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Company</p>
                <p className="text-gray-900">{application.internshipCompany}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-gray-900">
                  {application.internshipLocation}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Stipend</p>
                <p className="text-gray-900">{application.internshipStipend}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Duration</p>
                <p className="text-gray-900">
                  {application.internshipDuration}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-gray-900">{application.internshipType}</p>
              </div>
            </div>
          </div>

          {/* Application Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Application Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Applied On</p>
                <p className="text-gray-900">
                  {new Date(application.applicationDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Last Updated
                </p>
                <p className="text-gray-900">
                  {new Date(application.lastUpdated).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Application ID
                </p>
                <p className="text-gray-900 font-mono text-sm">
                  {application.applicationId || application.id}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          {(application.resume || application.coverLetter) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Submitted Documents
              </h3>
              <div className="space-y-3">
                {application.resume && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">Resume</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View
                    </button>
                  </div>
                )}
                {application.coverLetter && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium">Cover Letter</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Application #{application.applicationId || application.id}
          </div>

          <div className="flex space-x-3">
            {(application.status === "Draft" ||
              application.status === "Submitted" ||
              application.status === "Under Review") && (
              <button
                onClick={() => onWithdraw(application)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                Withdraw Application
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
