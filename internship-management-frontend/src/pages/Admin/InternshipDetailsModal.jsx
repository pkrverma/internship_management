import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import {
  updateInternshipStatus,
  deleteInternship,
} from "../../services/internshipService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoClose,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoMailOutline,
  IoCallOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoCreateOutline,
  IoCopyOutline,
  IoTrashOutline,
  IoStatsChartOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoShareSocialOutline,
  IoPrintOutline,
  IoPlayCircleOutline,
  IoStopCircleOutline,
  IoPauseCircleOutline,
  IoArchiveOutline,
  IoTrendingUpOutline,
  IoGlobeOutline,
  IoCodeSlashOutline,
  IoStarOutline,
  IoPersonOutline,
  IoBookmarkOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Open: { color: "bg-green-100 text-green-800", icon: IoPlayCircleOutline },
  Closed: { color: "bg-red-100 text-red-800", icon: IoStopCircleOutline },
  Paused: {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoPauseCircleOutline,
  },
  Draft: { color: "bg-gray-100 text-gray-800", icon: IoCreateOutline },
  Archived: { color: "bg-purple-100 text-purple-800", icon: IoArchiveOutline },
};

const APPLICATION_STATUS_CONFIG = {
  Submitted: {
    color: "bg-blue-100 text-blue-800",
    icon: IoDocumentTextOutline,
  },
  "Under Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
  },
  "Interview Scheduled": {
    color: "bg-purple-100 text-purple-800",
    icon: IoCalendarOutline,
  },
  Shortlisted: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Hired: { color: "bg-green-600 text-white", icon: IoCheckmarkCircleOutline },
  Rejected: { color: "bg-red-100 text-red-800", icon: IoCloseCircleOutline },
};

const InternshipDetailsModal = ({
  isOpen,
  onClose,
  internship,
  applicants = [],
  onStatusChange,
  onEdit,
  onClone,
  onDelete,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Modal state
  const [activeTab, setActiveTab] = useState("overview");
  const [isClosing, setIsClosing] = useState(false);

  // Applicant management state
  const [applicantSearch, setApplicantSearch] = useState("");
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("all");
  const [sortApplicantsBy, setSortApplicantsBy] = useState("applicationDate");
  const [selectedApplicants, setSelectedApplicants] = useState(new Set());

  // Action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Enhanced applicant data with applications
  const [enrichedApplicants, setEnrichedApplicants] = useState([]);

  // Load and enrich applicant data
  useEffect(() => {
    if (isOpen && internship && applicants.length > 0) {
      const applications = getData("applications") || [];
      const enriched = applicants.map((applicant) => {
        const application = applications.find(
          (app) =>
            app.internshipId === internship.id &&
            (app.internId === applicant.id || app.userId === applicant.id)
        );

        return {
          ...applicant,
          applicationId: application?.applicationId || application?.id,
          applicationDate:
            application?.applicationDate ||
            application?.submittedAt ||
            application?.createdAt,
          applicationStatus: application?.status || "Submitted",
          coverLetter: application?.coverLetter || application?.whyInternship,
          resume: application?.resume,
          skills: application?.skills || applicant.skills || [],
          university: application?.university || applicant.university,
          currentYear: application?.currentYear,
          github: application?.github,
          linkedin: application?.linkedin,
          phone: application?.phone || applicant.phone,
          address: application?.address,
          city: application?.city,
          state: application?.state,
        };
      });

      setEnrichedApplicants(enriched);
    }
  }, [isOpen, internship, applicants]);

  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen && !isUpdating) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isUpdating]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter and sort applicants
  const filteredAndSortedApplicants = useMemo(() => {
    let filtered = enrichedApplicants.filter((applicant) => {
      const matchesSearch =
        !applicantSearch ||
        applicant.name?.toLowerCase().includes(applicantSearch.toLowerCase()) ||
        applicant.email
          ?.toLowerCase()
          .includes(applicantSearch.toLowerCase()) ||
        applicant.university
          ?.toLowerCase()
          .includes(applicantSearch.toLowerCase());

      const matchesStatus =
        applicantStatusFilter === "all" ||
        applicant.applicationStatus === applicantStatusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort applicants
    filtered.sort((a, b) => {
      switch (sortApplicantsBy) {
        case "name":
          return a.name?.localeCompare(b.name) || 0;
        case "applicationDate":
          return (
            new Date(b.applicationDate || 0) - new Date(a.applicationDate || 0)
          );
        case "status":
          return a.applicationStatus?.localeCompare(b.applicationStatus) || 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    enrichedApplicants,
    applicantSearch,
    applicantStatusFilter,
    sortApplicantsBy,
  ]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = enrichedApplicants.length;
    const statusCounts = {};

    Object.keys(APPLICATION_STATUS_CONFIG).forEach((status) => {
      statusCounts[status] = enrichedApplicants.filter(
        (a) => a.applicationStatus === status
      ).length;
    });

    const recentApplications = enrichedApplicants.filter((applicant) => {
      const appDate = new Date(applicant.applicationDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return appDate >= weekAgo;
    }).length;

    const topUniversities = enrichedApplicants
      .filter((a) => a.university)
      .reduce((acc, a) => {
        acc[a.university] = (acc[a.university] || 0) + 1;
        return acc;
      }, {});

    return {
      total,
      ...statusCounts,
      recentApplications,
      topUniversities: Object.entries(topUniversities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    };
  }, [enrichedApplicants]);

  const handleClose = () => {
    if (isUpdating) return;

    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setActiveTab("overview");
      setApplicantSearch("");
      setApplicantStatusFilter("all");
      setSelectedApplicants(new Set());
      setMessage({ type: "", text: "" });
    }, 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUpdating) {
      handleClose();
    }
  };

  const handleStatusChange = async (newStatus) => {
    setConfirmModal({
      isOpen: true,
      type: "status_change",
      title: `Change Internship Status`,
      message: `Are you sure you want to change the status to "${newStatus}"?`,
      data: { newStatus },
    });
  };

  const handleApplicationStatusChange = async (applicantId, newStatus) => {
    try {
      setIsUpdating(true);
      const applications = getData("applications") || [];
      const updatedApplications = applications.map((app) =>
        (app.internId === applicantId || app.userId === applicantId) &&
        app.internshipId === internship.id
          ? { ...app, status: newStatus }
          : app
      );

      await saveData("applications", updatedApplications);

      // Update local state
      setEnrichedApplicants((prev) =>
        prev.map((applicant) =>
          applicant.id === applicantId
            ? { ...applicant, applicationStatus: newStatus }
            : applicant
        )
      );

      setMessage({
        type: "success",
        text: `Application status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update application status:", error);
      setMessage({
        type: "error",
        text: "Failed to update application status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAction = async () => {
    const { type, data } = confirmModal;

    try {
      setIsUpdating(true);

      switch (type) {
        case "status_change":
          await onStatusChange(internship.id, data.newStatus);
          setMessage({
            type: "success",
            text: `Status updated to ${data.newStatus}`,
          });
          break;

        case "delete":
          await onDelete(internship.id);
          setMessage({
            type: "success",
            text: "Internship deleted successfully",
          });
          handleClose();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      setMessage({ type: "error", text: "Action failed. Please try again." });
    } finally {
      setIsUpdating(false);
      setConfirmModal({
        isOpen: false,
        type: null,
        title: "",
        message: "",
        data: null,
      });
    }
  };

  const exportApplicants = () => {
    try {
      const csvData = [
        [
          "Name",
          "Email",
          "University",
          "Status",
          "Applied Date",
          "Phone",
          "Skills",
        ],
        ...filteredAndSortedApplicants.map((applicant) => [
          applicant.name,
          applicant.email,
          applicant.university || "N/A",
          applicant.applicationStatus,
          new Date(applicant.applicationDate).toLocaleDateString(),
          applicant.phone || "N/A",
          Array.isArray(applicant.skills) ? applicant.skills.join(", ") : "N/A",
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${internship.title}_applicants_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: "Applicants exported successfully!",
      });
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({ type: "error", text: "Failed to export applicants." });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString) => {
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

  const getStatusBadge = (status, config = STATUS_CONFIG) => {
    const statusConfig = config[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: IoWarningOutline,
    };
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const calculateDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  if (!internship && !loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
          <div className="text-center">
            <IoWarningOutline className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Internship Data
            </h3>
            <p className="text-gray-500 mb-4">
              The internship information could not be loaded.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col transition-transform duration-150 ${
          isClosing ? "scale-95" : "scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-96"></div>
                <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {internship?.title}
                  </h2>
                  {internship?.featured && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <IoStarOutline className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {internship?.isUrgent && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Urgent
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <IoBusinessOutline className="w-4 h-4 mr-1" />
                    {internship?.company || "Aninex Global"}
                  </div>
                  <div className="flex items-center">
                    <IoLocationOutline className="w-4 h-4 mr-1" />
                    {internship?.location}
                  </div>
                  <div className="flex items-center">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    {formatShortDate(
                      internship?.createdAt || internship?.postedOn
                    )}
                  </div>
                  {getStatusBadge(internship?.status || "Draft")}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`mx-6 mt-4 p-3 rounded-md ${
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: "overview", label: "Overview", icon: IoDocumentTextOutline },
            { id: "details", label: "Details", icon: IoBusinessOutline },
            {
              id: "applicants",
              label: `Applicants (${analytics.total})`,
              icon: IoPeopleOutline,
            },
            { id: "analytics", label: "Analytics", icon: IoStatsChartOutline },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Spinner size="lg" text="Loading internship details..." />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Key Information */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center">
                            <IoPeopleOutline className="w-6 h-6 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-600">
                                Applications
                              </p>
                              <p className="text-2xl font-bold text-blue-900">
                                {analytics.total}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center">
                            <IoTrendingUpOutline className="w-6 h-6 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-600">
                                This Week
                              </p>
                              <p className="text-2xl font-bold text-green-900">
                                {analytics.recentApplications}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center">
                            <IoEyeOutline className="w-6 h-6 text-purple-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-purple-600">
                                Views
                              </p>
                              <p className="text-2xl font-bold text-purple-900">
                                {internship?.viewCount || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center">
                            <IoCalendarOutline className="w-6 h-6 text-orange-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-orange-600">
                                Days Left
                              </p>
                              <p className="text-2xl font-bold text-orange-900">
                                {calculateDaysLeft(
                                  internship?.applicationDeadline
                                ) || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Job Description
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {internship?.description ||
                              "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* Skills */}
                      {internship?.skills && internship.skills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Required Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {internship.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium"
                              >
                                <IoCodeSlashOutline className="w-3 h-3 mr-1" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Benefits */}
                      {internship?.benefits &&
                        internship.benefits.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Benefits & Perks
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {internship.benefits.map((benefit, index) => (
                                <div
                                  key={index}
                                  className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                  <span className="text-sm font-medium text-green-900">
                                    {benefit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Internship Details
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <IoLocationOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500">Location</p>
                              <p className="font-medium text-gray-900">
                                {internship?.location || "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <IoCashOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500">Stipend</p>
                              <p className="font-medium text-gray-900">
                                {internship?.stipend || "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <IoTimeOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-medium text-gray-900">
                                {internship?.duration || "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <IoCalendarOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Application Deadline
                              </p>
                              <p className="font-medium text-gray-900">
                                {formatDate(
                                  internship?.applicationDeadline ||
                                    internship?.applyBy
                                )}
                              </p>
                              {calculateDaysLeft(
                                internship?.applicationDeadline
                              ) && (
                                <p
                                  className={`text-xs font-medium mt-1 ${
                                    calculateDaysLeft(
                                      internship?.applicationDeadline
                                    ) > 7
                                      ? "text-green-600"
                                      : calculateDaysLeft(
                                            internship?.applicationDeadline
                                          ) > 0
                                        ? "text-orange-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {calculateDaysLeft(
                                    internship?.applicationDeadline
                                  ) > 0
                                    ? `${calculateDaysLeft(internship?.applicationDeadline)} days left`
                                    : "Deadline passed"}
                                </p>
                              )}
                            </div>
                          </div>

                          {internship?.startDate && (
                            <div className="flex items-start">
                              <IoCalendarOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  Start Date
                                </p>
                                <p className="font-medium text-gray-900">
                                  {formatDate(internship.startDate)}
                                </p>
                              </div>
                            </div>
                          )}

                          {internship?.maxApplications && (
                            <div className="flex items-start">
                              <IoPersonOutline className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-500">
                                  Max Applications
                                </p>
                                <p className="font-medium text-gray-900">
                                  {analytics.total} /{" "}
                                  {internship.maxApplications}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min((analytics.total / internship.maxApplications) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Status Management
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-2">
                              Current Status
                            </p>
                            {getStatusBadge(internship?.status || "Draft")}
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-2">
                              Change Status
                            </p>
                            <select
                              onChange={(e) =>
                                e.target.value &&
                                handleStatusChange(e.target.value)
                              }
                              disabled={isUpdating}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">Select new status...</option>
                              {Object.keys(STATUS_CONFIG).map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={status === internship?.status}
                                >
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Quick Actions
                        </h3>
                        <div className="space-y-3">
                          <button
                            onClick={() => onEdit && onEdit(internship.id)}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <IoCreateOutline className="w-4 h-4 mr-2" />
                            Edit Internship
                          </button>

                          <button
                            onClick={() => onClone && onClone(internship)}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            <IoCopyOutline className="w-4 h-4 mr-2" />
                            Clone Internship
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/internships/${internship.id}`)
                            }
                            className="w-full flex items-center justify-center px-4 py-2 border border-green-200 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <IoGlobeOutline className="w-4 h-4 mr-2" />
                            View Public Page
                          </button>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "delete",
                                title: "Delete Internship",
                                message: `Are you sure you want to permanently delete "${internship?.title}"? This action cannot be undone.`,
                                data: null,
                              })
                            }
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center px-4 py-2 border border-red-200 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <IoTrashOutline className="w-4 h-4 mr-2" />
                            Delete Internship
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="p-6">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Responsibilities */}
                    {internship?.responsibilities && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Key Responsibilities
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {internship.responsibilities}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    {internship?.requirements && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Requirements
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {internship.requirements}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Qualifications */}
                    {internship?.qualifications && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Preferred Qualifications
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {internship.qualifications}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Internship Type
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Type</span>
                            <span className="font-medium">
                              {internship?.type || "Full-time"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Experience Level
                            </span>
                            <span className="font-medium">
                              {internship?.experienceLevel || "Entry-level"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Remote Work</span>
                            <span
                              className={`font-medium ${internship?.isRemote ? "text-green-600" : "text-gray-600"}`}
                            >
                              {internship?.isRemote
                                ? "Available"
                                : "Not Available"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Department
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Department</span>
                            <span className="font-medium">
                              {internship?.department || "Not specified"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Posted By</span>
                            <span className="font-medium">
                              {internship?.postedBy || "Admin"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Posted On</span>
                            <span className="font-medium">
                              {formatShortDate(
                                internship?.createdAt || internship?.postedOn
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Applicants Tab */}
              {activeTab === "applicants" && (
                <div className="p-6">
                  {/* Applicant Controls */}
                  <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Application Management ({analytics.total} applicants)
                      </h3>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={exportApplicants}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <IoDownloadOutline className="w-4 h-4 mr-2" />
                          Export
                        </button>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={applicantSearch}
                          onChange={(e) => setApplicantSearch(e.target.value)}
                          placeholder="Search applicants..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <select
                        value={applicantStatusFilter}
                        onChange={(e) =>
                          setApplicantStatusFilter(e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        {Object.keys(APPLICATION_STATUS_CONFIG).map(
                          (status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={sortApplicantsBy}
                        onChange={(e) => setSortApplicantsBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="applicationDate">
                          Sort by Application Date
                        </option>
                        <option value="name">Sort by Name</option>
                        <option value="status">Sort by Status</option>
                      </select>
                    </div>
                  </div>

                  {/* Applicants List */}
                  {filteredAndSortedApplicants.length > 0 ? (
                    <div className="space-y-4">
                      {filteredAndSortedApplicants.map((applicant) => (
                        <div
                          key={applicant.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    {applicant.name}
                                    {selectedApplicants.has(applicant.id) && (
                                      <IoBookmarkOutline className="w-4 h-4 ml-2 text-blue-600" />
                                    )}
                                  </h4>
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <IoMailOutline className="w-4 h-4 mr-2 flex-shrink-0" />
                                      <a
                                        href={`mailto:${applicant.email}`}
                                        className="hover:text-blue-600 truncate"
                                      >
                                        {applicant.email}
                                      </a>
                                    </div>
                                    {applicant.phone && (
                                      <div className="flex items-center">
                                        <IoCallOutline className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <a
                                          href={`tel:${applicant.phone}`}
                                          className="hover:text-blue-600"
                                        >
                                          {applicant.phone}
                                        </a>
                                      </div>
                                    )}
                                    {applicant.university && (
                                      <div className="flex items-center">
                                        <IoSchoolOutline className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">
                                          {applicant.university}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  {getStatusBadge(
                                    applicant.applicationStatus,
                                    APPLICATION_STATUS_CONFIG
                                  )}
                                </div>
                              </div>

                              {/* Skills */}
                              {applicant.skills &&
                                applicant.skills.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      Skills:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {applicant.skills
                                        .slice(0, 5)
                                        .map((skill, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      {applicant.skills.length > 5 && (
                                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                                          +{applicant.skills.length - 5} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Cover Letter Preview */}
                              {applicant.coverLetter && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter:
                                  </p>
                                  <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-md">
                                    {applicant.coverLetter}
                                  </p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                  Applied on{" "}
                                  {formatShortDate(applicant.applicationDate)}
                                </p>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      navigate(`/admin/manage-applications`, {
                                        state: {
                                          applicantId: applicant.id,
                                          internshipId: internship.id,
                                        },
                                      })
                                    }
                                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    View Full Application
                                  </button>

                                  {/* Status Change Buttons */}
                                  {applicant.applicationStatus !==
                                    "Interview Scheduled" && (
                                    <button
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          applicant.id,
                                          "Interview Scheduled"
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                                    >
                                      Schedule Interview
                                    </button>
                                  )}

                                  {applicant.applicationStatus !==
                                    "Shortlisted" && (
                                    <button
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          applicant.id,
                                          "Shortlisted"
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                    >
                                      Shortlist
                                    </button>
                                  )}

                                  {applicant.applicationStatus !== "Hired" && (
                                    <button
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          applicant.id,
                                          "Hired"
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1 text-xs font-medium text-green-700 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50"
                                    >
                                      Hire
                                    </button>
                                  )}

                                  {applicant.applicationStatus !==
                                    "Rejected" && (
                                    <button
                                      onClick={() =>
                                        handleApplicationStatusChange(
                                          applicant.id,
                                          "Rejected"
                                        )
                                      }
                                      disabled={isUpdating}
                                      className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <IoPeopleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {applicantSearch || applicantStatusFilter !== "all"
                          ? "No matching applicants found"
                          : "No applications received yet"}
                      </h3>
                      <p className="text-gray-500">
                        {applicantSearch || applicantStatusFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Applications will appear here once candidates start applying"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Application Status Distribution */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Application Status Distribution
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(APPLICATION_STATUS_CONFIG).map(
                          ([status, config]) => {
                            const count = analytics[status] || 0;
                            const percentage =
                              analytics.total > 0
                                ? (count / analytics.total) * 100
                                : 0;

                            return (
                              <div
                                key={status}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <config.icon className="w-4 h-4 mr-3 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {status}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                    {count}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Top Universities */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Top Universities
                      </h3>
                      {analytics.topUniversities.length > 0 ? (
                        <div className="space-y-4">
                          {analytics.topUniversities.map(
                            ([university, count], index) => (
                              <div
                                key={university}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-xs font-medium text-blue-700">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 truncate">
                                    {university}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {count}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No university data available
                        </p>
                      )}
                    </div>

                    {/* Application Timeline */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Recent Activity
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Applications this week
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            {analytics.recentApplications}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Total applications
                          </span>
                          <span className="text-2xl font-bold text-gray-900">
                            {analytics.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Conversion rate
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {analytics.total > 0
                              ? Math.round(
                                  ((analytics.Hired || 0) / analytics.total) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Performance Metrics
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Page views
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {internship?.viewCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Application rate
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {internship?.viewCount > 0
                              ? Math.round(
                                  (analytics.total / internship.viewCount) * 100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Days active
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {internship?.createdAt
                              ? Math.ceil(
                                  (new Date() -
                                    new Date(internship.createdAt)) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>ID: {internship?.id}</span>
              <span>•</span>
              <span>
                Created:{" "}
                {formatShortDate(internship?.createdAt || internship?.postedOn)}
              </span>
              {internship?.updatedAt &&
                internship.updatedAt !== internship.createdAt && (
                  <>
                    <span>•</span>
                    <span>
                      Updated: {formatShortDate(internship.updatedAt)}
                    </span>
                  </>
                )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
            data: null,
          })
        }
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.type === "delete" ? "Delete" : "Confirm"}
        cancelText="Cancel"
        danger={confirmModal.type === "delete"}
        loading={isUpdating}
      />
    </div>
  );
};

export default InternshipDetailsModal;
