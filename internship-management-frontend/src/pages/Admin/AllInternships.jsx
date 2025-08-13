import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import {
  getAllInternships,
  toggleInternshipStatus,
  deleteInternship,
} from "../../services/internshipService";
import InternshipCard from "../../components/admin/AdminInternshipCard";
import InternshipDetailsModal from "../../components/admin/InternshipDetailsModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoAddOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoCopyOutline,
  IoTrashOutline,
  IoStopCircleOutline,
  IoPlayCircleOutline,
  IoStatsChartOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoBusinessOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Open: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Closed: { color: "bg-red-100 text-red-800", icon: IoStopCircleOutline },
  Draft: { color: "bg-gray-100 text-gray-800", icon: IoCreateOutline },
  Paused: { color: "bg-yellow-100 text-yellow-800", icon: IoTimeOutline },
  Archived: { color: "bg-purple-100 text-purple-800", icon: IoWarningOutline },
};

const AllInternships = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [departmentFilter, setDepartmentFilter] = useState(
    searchParams.get("department") || "all"
  );
  const [locationFilter, setLocationFilter] = useState(
    searchParams.get("location") || "all"
  );
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || "all"
  );
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("internships_view_mode") || "grid"
  );
  const [selectedInternships, setSelectedInternships] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [internshipsPerPage, setInternshipsPerPage] = useState(12);

  // Modal states
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    internship: null,
    title: "",
    message: "",
  });

  // Messages
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load and enrich internship data
  const loadAndEnrichData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch data from multiple sources
      const [baseInternships, stats, applications, users] =
        await Promise.allSettled([
          getAllInternships(),
          getData("internshipStats"),
          getData("applications"),
          getData("users"),
        ]);

      const internshipsData =
        baseInternships.status === "fulfilled" ? baseInternships.value : [];
      const statsData = stats.status === "fulfilled" ? stats.value : [];
      const applicationsData =
        applications.status === "fulfilled" ? applications.value : [];
      const usersData = users.status === "fulfilled" ? users.value : [];

      if (!internshipsData || internshipsData.length === 0) {
        console.warn("No internships found");
        setInternships([]);
        return;
      }

      // Enrich internship data with stats and applications
      const enrichedData = internshipsData.map((internship) => {
        const stat = statsData.find((s) => s.id === internship.id) || {};
        const internshipApplications = applicationsData.filter(
          (app) => app.internshipId === internship.id
        );

        const applicantCount = internshipApplications.length;
        const uniqueApplicants = [
          ...new Set(
            internshipApplications.map((app) => app.internId || app.userId)
          ),
        ];
        const recentApplications = internshipApplications.filter((app) => {
          const appDate = new Date(
            app.applicationDate || app.submittedAt || app.createdAt
          );
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo;
        }).length;

        // Calculate status based on dates and manual settings
        let calculatedStatus = internship.status || "Open";
        const now = new Date();
        const deadline = new Date(
          internship.applicationDeadline || internship.applyBy
        );

        if (stat.closed || internship.closed) {
          calculatedStatus = "Closed";
        } else if (deadline < now) {
          calculatedStatus = "Closed";
        } else if (stat.active === false) {
          calculatedStatus = "Paused";
        }

        return {
          ...internship,
          status: calculatedStatus,
          active: stat.active !== false && calculatedStatus !== "Closed",
          closed: stat.closed || calculatedStatus === "Closed",
          applicantCount,
          uniqueApplicantCount: uniqueApplicants.length,
          recentApplications,
          viewCount: stat.viewCount || 0,
          featured: internship.featured || internship.isUrgent || false,
          createdAt: internship.createdAt || internship.postedOn,
          updatedAt:
            internship.updatedAt || internship.createdAt || internship.postedOn,
        };
      });

      setInternships(enrichedData);
    } catch (error) {
      console.error("Failed to load internship data:", error);
      setError("Failed to load internships. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    loadAndEnrichData();
  }, [loadAndEnrichData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAndEnrichData(true);
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadAndEnrichData]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (departmentFilter !== "all") params.set("department", departmentFilter);
    if (locationFilter !== "all") params.set("location", locationFilter);
    if (dateFilter !== "all") params.set("date", dateFilter);
    setSearchParams(params);
  }, [
    searchQuery,
    statusFilter,
    departmentFilter,
    locationFilter,
    dateFilter,
    setSearchParams,
  ]);

  // Clear messages
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("internships_view_mode", viewMode);
  }, [viewMode]);

  // Filter and sort internships
  const filteredAndSortedInternships = useMemo(() => {
    let filtered = internships.filter((internship) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        internship.title?.toLowerCase().includes(searchLower) ||
        internship.company?.toLowerCase().includes(searchLower) ||
        internship.department?.toLowerCase().includes(searchLower) ||
        internship.location?.toLowerCase().includes(searchLower) ||
        internship.description?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || internship.status === statusFilter;

      // Department filter
      const matchesDepartment =
        departmentFilter === "all" ||
        internship.department === departmentFilter;

      // Location filter
      const matchesLocation =
        locationFilter === "all" ||
        internship.location
          ?.toLowerCase()
          .includes(locationFilter.toLowerCase());

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === "all") return true;

        const createdDate = new Date(internship.createdAt);
        const now = new Date();
        const daysDiff = Math.floor(
          (now - createdDate) / (1000 * 60 * 60 * 24)
        );

        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesLocation &&
        matchesDate
      );
    });

    // Sort internships
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "applicantCount":
          aVal = a.applicantCount || 0;
          bVal = b.applicantCount || 0;
          break;
        case "status":
          aVal = a.status?.toLowerCase() || "";
          bVal = b.status?.toLowerCase() || "";
          break;
        case "deadline":
          aVal = new Date(a.applicationDeadline || a.applyBy || 0);
          bVal = new Date(b.applicationDeadline || b.applyBy || 0);
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
          break;
        default:
          aVal = a[sortBy] || "";
          bVal = b[sortBy] || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [
    internships,
    searchQuery,
    statusFilter,
    departmentFilter,
    locationFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedInternships.length / internshipsPerPage
  );
  const startIndex = (currentPage - 1) * internshipsPerPage;
  const paginatedInternships = filteredAndSortedInternships.slice(
    startIndex,
    startIndex + internshipsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    return {
      total: internships.length,
      open: internships.filter((i) => i.status === "Open").length,
      closed: internships.filter((i) => i.status === "Closed").length,
      draft: internships.filter((i) => i.status === "Draft").length,
      paused: internships.filter((i) => i.status === "Paused").length,
      totalApplications: internships.reduce(
        (sum, i) => sum + (i.applicantCount || 0),
        0
      ),
      avgApplications:
        internships.length > 0
          ? Math.round(
              internships.reduce((sum, i) => sum + (i.applicantCount || 0), 0) /
                internships.length
            )
          : 0,
      urgent: internships.filter((i) => i.featured || i.isUrgent).length,
    };
  }, [internships]);

  // Get unique values for filters
  const uniqueDepartments = useMemo(() => {
    return [
      ...new Set(internships.map((i) => i.department).filter(Boolean)),
    ].sort();
  }, [internships]);

  const uniqueLocations = useMemo(() => {
    return [
      ...new Set(internships.map((i) => i.location).filter(Boolean)),
    ].sort();
  }, [internships]);

  const handleViewDetails = (internshipId) => {
    const allUsers = getData("users") || [];
    const allApplications = getData("applications") || [];
    const targetInternship = internships.find((i) => i.id === internshipId);

    if (!targetInternship) return;

    const applicantIds = allApplications
      .filter((app) => app.internshipId === internshipId)
      .map((app) => app.internId || app.userId);

    const uniqueApplicantIds = [...new Set(applicantIds)];
    const applicantDetails = allUsers.filter((user) =>
      uniqueApplicantIds.includes(user.id)
    );

    setSelectedInternship(targetInternship);
    setApplicants(applicantDetails);
    setIsDetailsModalOpen(true);
  };

  const handleStatusChange = async (internshipId, newStatus) => {
    try {
      setRefreshing(true);

      // Update internship status
      await toggleInternshipStatus(internshipId, newStatus);

      // Update stats
      const stats = getData("internshipStats") || [];
      const updatedStats = stats.map((stat) =>
        stat.id === internshipId
          ? {
              ...stat,
              active: newStatus === "Open",
              closed: newStatus === "Closed" || newStatus === "Archived",
            }
          : stat
      );
      await saveData("internshipStats", updatedStats);

      await loadAndEnrichData(true);
      setMessage({
        type: "success",
        text: `Internship status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      setMessage({ type: "error", text: "Failed to update internship status" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (internship) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      internship,
      title: "Delete Internship",
      message: `Are you sure you want to permanently delete "${internship.title}"? This action cannot be undone.`,
    });
  };

  const handleClone = (internship) => {
    navigate("/admin/post-internship", {
      state: {
        cloneFrom: {
          ...internship,
          title: `${internship.title} (Copy)`,
          id: undefined,
          createdAt: undefined,
          postedOn: undefined,
        },
      },
    });
  };

  const confirmAction = async () => {
    const { type, internship } = confirmModal;

    try {
      setRefreshing(true);

      if (type === "delete") {
        await deleteInternship(internship.id);
        setMessage({
          type: "success",
          text: `"${internship.title}" has been deleted`,
        });
      }

      await loadAndEnrichData(true);
      setConfirmModal({
        isOpen: false,
        type: null,
        internship: null,
        title: "",
        message: "",
      });
    } catch (error) {
      console.error(`Failed to ${type}:`, error);
      setMessage({ type: "error", text: `Failed to ${type} internship` });
    } finally {
      setRefreshing(false);
    }
  };

  const exportInternships = () => {
    try {
      const csvData = [
        [
          "Title",
          "Company",
          "Department",
          "Location",
          "Status",
          "Applications",
          "Created",
          "Deadline",
        ],
        ...filteredAndSortedInternships.map((internship) => [
          internship.title,
          internship.company,
          internship.department,
          internship.location,
          internship.status,
          internship.applicantCount,
          new Date(internship.createdAt).toLocaleDateString(),
          internship.applicationDeadline
            ? new Date(internship.applicationDeadline).toLocaleDateString()
            : "N/A",
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `internships_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: "Internships exported successfully!",
      });
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({ type: "error", text: "Failed to export internships." });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedInternships.size === 0) return;

    try {
      setRefreshing(true);
      const promises = Array.from(selectedInternships).map((id) =>
        handleStatusChange(id, action)
      );

      await Promise.all(promises);
      setSelectedInternships(new Set());
      setMessage({
        type: "success",
        text: `${selectedInternships.size} internships updated to ${action}`,
      });
    } catch (error) {
      console.error("Bulk action failed:", error);
      setMessage({
        type: "error",
        text: "Bulk action failed. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" text="Loading internships..." />
      </div>
    );
  }

  if (error && internships.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">
            Error Loading Internships
          </h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={() => loadAndEnrichData()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Internship Listings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all internship opportunities
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadAndEnrichData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={exportInternships}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoDownloadOutline className="w-4 h-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => navigate("/admin/post-internship")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Post New
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Open</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.open}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStopCircleOutline className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Closed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.closed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalApplications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCalendarOutline className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Apps</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgApplications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoWarningOutline className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.urgent}
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
            placeholder="Search internships by title, company, location, or description..."
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
            Advanced Filters
            {(statusFilter !== "all" ||
              departmentFilter !== "all" ||
              locationFilter !== "all" ||
              dateFilter !== "all") && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                Active
              </span>
            )}
          </button>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
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

            {/* Bulk Actions */}
            {selectedInternships.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedInternships.size} selected
                </span>
                <select
                  onChange={(e) =>
                    e.target.value && handleBulkAction(e.target.value)
                  }
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Bulk Action</option>
                  <option value="Open">Set to Open</option>
                  <option value="Paused">Pause</option>
                  <option value="Closed">Close</option>
                </select>
              </div>
            )}
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
              {Object.keys(STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="older">Older</option>
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
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="applicantCount-desc">Most Applications</option>
              <option value="deadline-asc">Deadline Soon</option>
            </select>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-
            {Math.min(
              startIndex + internshipsPerPage,
              filteredAndSortedInternships.length
            )}{" "}
            of {filteredAndSortedInternships.length} internships
          </span>
          {(statusFilter !== "all" ||
            departmentFilter !== "all" ||
            locationFilter !== "all" ||
            dateFilter !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setDepartmentFilter("all");
                setLocationFilter("all");
                setDateFilter("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Internships Grid/List */}
      {paginatedInternships.length === 0 ? (
        <div className="text-center py-12">
          <IoBusinessOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No internships found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ||
            statusFilter !== "all" ||
            departmentFilter !== "all" ||
            locationFilter !== "all" ||
            dateFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No internships have been posted yet"}
          </p>
          {!searchQuery &&
            statusFilter === "all" &&
            departmentFilter === "all" &&
            locationFilter === "all" &&
            dateFilter === "all" && (
              <button
                onClick={() => navigate("/admin/post-internship")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <IoAddOutline className="w-4 h-4 mr-2" />
                Post Your First Internship
              </button>
            )}
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                : "space-y-4 mb-8"
            }
          >
            {paginatedInternships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                viewMode={viewMode}
                isSelected={selectedInternships.has(internship.id)}
                onSelect={(id) => {
                  const newSelected = new Set(selectedInternships);
                  if (newSelected.has(id)) {
                    newSelected.delete(id);
                  } else {
                    newSelected.add(id);
                  }
                  setSelectedInternships(newSelected);
                }}
                onViewDetails={() => handleViewDetails(internship.id)}
                onEdit={(id) => navigate(`/admin/edit-internship/${id}`)}
                onClone={() => handleClone(internship)}
                onDelete={() => handleDelete(internship)}
                onStatusChange={(id, status) => handleStatusChange(id, status)}
                refreshing={refreshing}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={internshipsPerPage}
                  onChange={(e) => {
                    setInternshipsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else {
                    if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium border rounded-md ${
                        currentPage === pageNum
                          ? "text-blue-600 bg-blue-50 border-blue-500"
                          : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <InternshipDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedInternship(null);
          setApplicants([]);
        }}
        internship={selectedInternship}
        applicants={applicants}
        onStatusChange={handleStatusChange}
        onEdit={(id) => navigate(`/admin/edit-internship/${id}`)}
        onClone={() => handleClone(selectedInternship)}
        onDelete={() => handleDelete(selectedInternship)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            internship: null,
            title: "",
            message: "",
          })
        }
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.type === "delete" ? "Delete" : "Confirm"}
        cancelText="Cancel"
        danger={confirmModal.type === "delete"}
        loading={refreshing}
      />
    </div>
  );
};

export default AllInternships;
