import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import {
  getAllApplications,
  updateApplicationStatus,
} from "../../services/applicationService";
import ApplicationDetailsModal from "../../components/admin/ApplicationDetailsModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoPeopleOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Submitted: {
    color: "bg-blue-100 text-blue-800",
    icon: IoDocumentTextOutline,
    order: 1,
  },
  "Under Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoTimeOutline,
    order: 2,
  },
  "Interview Scheduled": {
    color: "bg-purple-100 text-purple-800",
    icon: IoCalendarOutline,
    order: 3,
  },
  Shortlisted: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
    order: 4,
  },
  Hired: {
    color: "bg-green-600 text-white",
    icon: IoCheckmarkCircleOutline,
    order: 5,
  },
  Rejected: {
    color: "bg-red-100 text-red-800",
    icon: IoCloseCircleOutline,
    order: 6,
  },
};

const ManageApplications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [mentorAssignments, setMentorAssignments] = useState({});

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [internshipFilter, setInternshipFilter] = useState(
    searchParams.get("internship") || "all"
  );
  const [mentorFilter, setMentorFilter] = useState(
    searchParams.get("mentor") || "all"
  );
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || "all"
  );
  const [sortBy, setSortBy] = useState("applicationDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(15);

  // Messages
  const [message, setMessage] = useState({ type: "", text: "" });

  // Bulk operations
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [bulkAction, setBulkAction] = useState("");

  // Load applications data
  const fetchAndEnrichData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch data from multiple sources
      const [applicationsResult, internshipsData, usersData, assignmentsData] =
        await Promise.allSettled([
          getAllApplications(),
          getData("internships"),
          getData("users"),
          getData("mentorAssignments"),
        ]);

      const applicationsData =
        applicationsResult.status === "fulfilled"
          ? applicationsResult.value
          : [];
      const internships =
        internshipsData.status === "fulfilled" ? internshipsData.value : [];
      const users = usersData.status === "fulfilled" ? usersData.value : [];
      const assignments =
        assignmentsData.status === "fulfilled" ? assignmentsData.value : {};

      // Filter mentors
      const mentorsList = users.filter((user) => user.role === "Mentor");
      setMentors(mentorsList);
      setMentorAssignments(assignments);

      // Enrich application data
      const enrichedApplications = applicationsData.map((app) => {
        const intern = users.find(
          (user) => user.id === app.internId || user.id === app.userId
        );
        const internship = internships.find((i) => i.id === app.internshipId);

        // Find assigned mentor
        let currentAssignedMentor = null;
        if (intern?.id) {
          for (const mentorId in assignments) {
            if (assignments[mentorId]?.includes(intern.id)) {
              currentAssignedMentor = users.find((u) => u.id === mentorId);
              break;
            }
          }
        }

        return {
          ...app,
          // Intern details
          internName: intern?.name || "Unknown",
          internEmail: intern?.email || "N/A",
          internPhone: intern?.phone || "N/A",
          internId: intern?.id || app.internId || app.userId,

          // Internship details
          internshipTitle: internship?.title || "Unknown Position",
          internshipLocation: internship?.location || "N/A",
          internshipStipend: internship?.stipend || "N/A",
          internshipDuration: internship?.duration || "N/A",
          internshipCompany: internship?.company || "Aninex Global",

          // Application details
          applicationDate:
            app.applicationDate || app.submittedAt || app.createdAt,
          status: app.status || "Submitted",

          // Additional application fields
          university: app.university || intern?.university || "N/A",
          currentYear: app.currentYear || "N/A",
          skills: app.skills || [],
          resume: app.resume || app.resumeFileName,
          coverLetter: app.coverLetter || app.coverLetterFileName,
          github: app.github || "N/A",
          linkedin: app.linkedin || "N/A",
          whyInternship: app.whyInternship || app.motivation || "",

          // Mentor assignment
          currentAssignedMentorId: currentAssignedMentor?.id || null,
          currentAssignedMentorName: currentAssignedMentor?.name || null,
          currentAssignedMentorEmail: currentAssignedMentor?.email || null,
        };
      });

      setAllApplications(enrichedApplications);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAndEnrichData();
  }, [fetchAndEnrichData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndEnrichData(true);
    }, 120000);
    return () => clearInterval(interval);
  }, [fetchAndEnrichData]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (internshipFilter !== "all") params.set("internship", internshipFilter);
    if (mentorFilter !== "all") params.set("mentor", mentorFilter);
    if (dateFilter !== "all") params.set("date", dateFilter);
    setSearchParams(params);
  }, [
    searchQuery,
    statusFilter,
    internshipFilter,
    mentorFilter,
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

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = allApplications.filter((app) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        app.internName?.toLowerCase().includes(searchLower) ||
        app.internEmail?.toLowerCase().includes(searchLower) ||
        app.internshipTitle?.toLowerCase().includes(searchLower) ||
        app.internshipCompany?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      // Internship filter
      const matchesInternship =
        internshipFilter === "all" || app.internshipId === internshipFilter;

      // Mentor filter
      const matchesMentor =
        mentorFilter === "all" ||
        app.currentAssignedMentorId === mentorFilter ||
        (mentorFilter === "unassigned" && !app.currentAssignedMentorId);

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === "all") return true;

        const appDate = new Date(app.applicationDate);
        const now = new Date();
        const daysDiff = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));

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
        matchesInternship &&
        matchesMentor &&
        matchesDate
      );
    });

    // Sort applications
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "internName":
          aVal = a.internName?.toLowerCase() || "";
          bVal = b.internName?.toLowerCase() || "";
          break;
        case "internshipTitle":
          aVal = a.internshipTitle?.toLowerCase() || "";
          bVal = b.internshipTitle?.toLowerCase() || "";
          break;
        case "status":
          aVal = STATUS_CONFIG[a.status]?.order || 999;
          bVal = STATUS_CONFIG[b.status]?.order || 999;
          break;
        case "applicationDate":
          aVal = new Date(a.applicationDate || 0);
          bVal = new Date(b.applicationDate || 0);
          break;
        case "mentor":
          aVal = a.currentAssignedMentorName?.toLowerCase() || "zzz";
          bVal = b.currentAssignedMentorName?.toLowerCase() || "zzz";
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
    allApplications,
    searchQuery,
    statusFilter,
    internshipFilter,
    mentorFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedApplications.length / applicationsPerPage
  );
  const startIndex = (currentPage - 1) * applicationsPerPage;
  const paginatedApplications = filteredAndSortedApplications.slice(
    startIndex,
    startIndex + applicationsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const statusCounts = {};
    Object.keys(STATUS_CONFIG).forEach((status) => {
      statusCounts[status] = 0;
    });

    allApplications.forEach((app) => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, app.status)) {
        statusCounts[status]++;
      } else {
        statusCounts["Other"] = (statusCounts["Other"] || 0) + 1;
      }
    });

    return {
      total: allApplications.length,
      ...statusCounts,
      unassignedMentor: allApplications.filter(
        (app) => !app.currentAssignedMentorId
      ).length,
      thisWeek: allApplications.filter((app) => {
        const appDate = new Date(app.applicationDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return appDate >= weekAgo;
      }).length,
    };
  }, [allApplications]);

  // Get unique internships and mentors for filters
  const uniqueInternships = useMemo(() => {
    const unique = new Map();
    allApplications.forEach((app) => {
      if (app.internshipId && app.internshipTitle) {
        unique.set(app.internshipId, app.internshipTitle);
      }
    });
    return Array.from(unique.entries()).map(([id, title]) => ({ id, title }));
  }, [allApplications]);

  const handleViewApplication = (app) => {
    setSelectedApplication(app);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setRefreshing(true);
      await updateApplicationStatus(applicationId, newStatus);

      // Update local state
      setAllApplications((prev) =>
        prev.map((app) =>
          app.applicationId === applicationId || app.id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );

      // Update selected application if it's the one being changed
      if (
        selectedApplication &&
        (selectedApplication.applicationId === applicationId ||
          selectedApplication.id === applicationId)
      ) {
        setSelectedApplication((prev) => ({ ...prev, status: newStatus }));
      }

      setMessage({
        type: "success",
        text: "Application status updated successfully!",
      });
    } catch (error) {
      console.error("Failed to update application status:", error);
      setMessage({
        type: "error",
        text: "Failed to update status. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAssignMentor = async (internId, selectedMentorId) => {
    try {
      setRefreshing(true);
      const currentAssignments = { ...mentorAssignments };

      // Remove intern from any existing mentor's list
      Object.keys(currentAssignments).forEach((mentorKey) => {
        currentAssignments[mentorKey] =
          currentAssignments[mentorKey]?.filter((id) => id !== internId) || [];
      });

      // Add intern to selected mentor's list
      if (!currentAssignments[selectedMentorId]) {
        currentAssignments[selectedMentorId] = [];
      }
      currentAssignments[selectedMentorId].push(internId);

      // Save to backend/localStorage
      await saveData("mentorAssignments", currentAssignments);
      setMentorAssignments(currentAssignments);

      // Refresh data to update UI
      await fetchAndEnrichData(true);

      setMessage({ type: "success", text: "Mentor assigned successfully!" });
    } catch (error) {
      console.error("Failed to assign mentor:", error);
      setMessage({
        type: "error",
        text: "Failed to assign mentor. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const exportApplications = () => {
    try {
      const csvData = [
        [
          "Intern Name",
          "Email",
          "Internship",
          "Status",
          "Applied Date",
          "University",
          "Assigned Mentor",
        ],
        ...filteredAndSortedApplications.map((app) => [
          app.internName,
          app.internEmail,
          app.internshipTitle,
          app.status,
          new Date(app.applicationDate).toLocaleDateString(),
          app.university,
          app.currentAssignedMentorName || "Unassigned",
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: "Applications exported successfully!",
      });
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({ type: "error", text: "Failed to export applications." });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.size === 0) return;

    try {
      setRefreshing(true);
      const promises = Array.from(selectedApplications).map((appId) =>
        updateApplicationStatus(appId, bulkAction)
      );

      await Promise.all(promises);
      await fetchAndEnrichData(true);

      setSelectedApplications(new Set());
      setBulkAction("");
      setMessage({
        type: "success",
        text: `${selectedApplications.size} applications updated to ${bulkAction}`,
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
        <Spinner size="lg" text="Loading applications..." />
      </div>
    );
  }

  if (error && allApplications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">
            Error Loading Applications
          </h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={() => fetchAndEnrichData()}
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
            Manage Applications
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage internship applications
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAndEnrichData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={exportApplications}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoDownloadOutline className="w-4 h-4 mr-2" />
            Export
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

        {Object.entries(STATUS_CONFIG)
          .slice(0, 4)
          .map(([status, config]) => (
            <div
              key={status}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center">
                <config.icon className="w-8 h-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{status}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats[status] || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
            placeholder="Search by intern name, email, or internship..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <IoFilterOutline className="mr-2 h-4 w-4" />
            Advanced Filters
            {(statusFilter !== "all" ||
              internshipFilter !== "all" ||
              mentorFilter !== "all" ||
              dateFilter !== "all") && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                Active
              </span>
            )}
          </button>

          {/* Bulk Actions */}
          {selectedApplications.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedApplications.size} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Bulk Action</option>
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || refreshing}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              value={internshipFilter}
              onChange={(e) => setInternshipFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Internships</option>
              {uniqueInternships.map((internship) => (
                <option key={internship.id} value={internship.id}>
                  {internship.title}
                </option>
              ))}
            </select>

            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Mentors</option>
              <option value="unassigned">Unassigned</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name}
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
              <option value="applicationDate-desc">Newest First</option>
              <option value="applicationDate-asc">Oldest First</option>
              <option value="internName-asc">Name A-Z</option>
              <option value="internName-desc">Name Z-A</option>
              <option value="status-asc">Status</option>
              <option value="internshipTitle-asc">Internship A-Z</option>
            </select>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-
            {Math.min(
              startIndex + applicationsPerPage,
              filteredAndSortedApplications.length
            )}{" "}
            of {filteredAndSortedApplications.length} applications
          </span>
          {(statusFilter !== "all" ||
            internshipFilter !== "all" ||
            mentorFilter !== "all" ||
            dateFilter !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setInternshipFilter("all");
                setMentorFilter("all");
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

      {/* Applications Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {paginatedApplications.length === 0 ? (
          <div className="text-center py-12">
            <IoDocumentTextOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-500">
              {searchQuery ||
              statusFilter !== "all" ||
              internshipFilter !== "all" ||
              mentorFilter !== "all" ||
              dateFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No applications have been submitted yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={
                          selectedApplications.size ===
                            paginatedApplications.length &&
                          paginatedApplications.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(
                              new Set(
                                paginatedApplications.map(
                                  (app) => app.applicationId || app.id
                                )
                              )
                            );
                          } else {
                            setSelectedApplications(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Internship
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => {
                    const StatusIcon =
                      STATUS_CONFIG[app.status]?.icon || IoDocumentTextOutline;

                    return (
                      <tr
                        key={app.applicationId || app.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedApplications.has(
                              app.applicationId || app.id
                            )}
                            onChange={(e) => {
                              const newSelected = new Set(selectedApplications);
                              if (e.target.checked) {
                                newSelected.add(app.applicationId || app.id);
                              } else {
                                newSelected.delete(app.applicationId || app.id);
                              }
                              setSelectedApplications(newSelected);
                            }}
                          />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {app.internName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {app.internEmail}
                            </div>
                            {app.university !== "N/A" && (
                              <div className="text-xs text-gray-400">
                                {app.university}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {app.internshipTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              {app.internshipCompany}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_CONFIG[app.status]?.color ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {app.status}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {app.currentAssignedMentorName || (
                              <span className="text-gray-400 italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                          {app.currentAssignedMentorEmail && (
                            <div className="text-xs text-gray-500">
                              {app.currentAssignedMentorEmail}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.applicationDate).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewApplication(app)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            <IoEyeOutline className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(
                          startIndex + applicationsPerPage,
                          filteredAndSortedApplications.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredAndSortedApplications.length}
                      </span>{" "}
                      results
                    </p>
                  </div>

                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else {
                          // Smart pagination for large page counts
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplication(null);
        }}
        applicationDetails={selectedApplication}
        onStatusChange={handleStatusChange}
        statusColors={STATUS_CONFIG}
        mentorsList={mentors}
        onAssignMentor={handleAssignMentor}
        loading={refreshing}
      />
    </div>
  );
};

export default ManageApplications;
