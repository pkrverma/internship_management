import React, { useState, useEffect } from "react";
import {
  IoClose,
  IoPersonOutline,
  IoSchoolOutline,
  IoCodeSlashOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoCashOutline,
  IoMailOutline,
  IoCallOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoBusinessOutline,
  IoPeopleOutline,
  IoWarningOutline,
  IoSaveOutline,
  IoRefreshOutline,
  IoLinkOutline,
} from "react-icons/io5";
import Spinner from "../ui/Spinner";

const ApplicationDetailsModal = ({
  isOpen,
  onClose,
  applicationDetails,
  onStatusChange,
  statusColors,
  mentorsList = [],
  onAssignMentor,
  loading = false,
}) => {
  // Modal state
  const [activeTab, setActiveTab] = useState("overview");
  const [isClosing, setIsClosing] = useState(false);

  // Form state
  const [currentStatus, setCurrentStatus] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentLoading, setDocumentLoading] = useState({});

  // Status options with descriptions
  const statusOptions = [
    {
      value: "Submitted",
      label: "Submitted",
      description: "Application received",
    },
    {
      value: "Under Review",
      label: "Under Review",
      description: "Being evaluated by team",
    },
    {
      value: "Interview Scheduled",
      label: "Interview Scheduled",
      description: "Interview arranged",
    },
    {
      value: "Shortlisted",
      label: "Shortlisted",
      description: "Selected for final round",
    },
    { value: "Hired", label: "Hired", description: "Offer accepted" },
    {
      value: "Rejected",
      label: "Rejected",
      description: "Application declined",
    },
  ];

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && applicationDetails) {
      setCurrentStatus(applicationDetails.status || "Submitted");
      setSelectedMentor(applicationDetails.currentAssignedMentorId || "");
      setNotes("");
      setMessage({ type: "", text: "" });
      setActiveTab("overview");
    }
  }, [isOpen, applicationDetails]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
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
  }, [isOpen]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleClose = () => {
    if (isSubmitting) return;

    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  const handleStatusChange = async () => {
    if (currentStatus === applicationDetails?.status) {
      setMessage({
        type: "error",
        text: "Status is already set to this value.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await onStatusChange(
        applicationDetails.applicationId || applicationDetails.id,
        currentStatus
      );
      setMessage({ type: "success", text: "Status updated successfully!" });
    } catch (error) {
      console.error("Status change failed:", error);
      setMessage({
        type: "error",
        text: "Failed to update status. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMentorAssignment = async () => {
    if (!selectedMentor) {
      setMessage({ type: "error", text: "Please select a mentor to assign." });
      return;
    }

    if (selectedMentor === applicationDetails?.currentAssignedMentorId) {
      setMessage({ type: "error", text: "This mentor is already assigned." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await onAssignMentor(applicationDetails.internId, selectedMentor);
      setMessage({ type: "success", text: "Mentor assigned successfully!" });
    } catch (error) {
      console.error("Mentor assignment failed:", error);
      setMessage({
        type: "error",
        text: "Failed to assign mentor. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentAction = async (fileName, action = "view") => {
    if (!fileName) {
      setMessage({ type: "error", text: "Document not available." });
      return;
    }

    setDocumentLoading((prev) => ({ ...prev, [fileName]: true }));

    try {
      if (action === "download") {
        // In a real app, this would be an API call to download the file
        const link = document.createElement("a");
        link.href = `/api/documents/${fileName}`;
        link.download = fileName;
        link.click();

        setMessage({ type: "success", text: "Download started!" });
      } else {
        // In a real app, this would open the file in a new tab
        window.open(`/api/documents/view/${fileName}`, "_blank");
      }
    } catch (error) {
      console.error("Document action failed:", error);
      setMessage({ type: "error", text: `Failed to ${action} document.` });
    } finally {
      setTimeout(() => {
        setDocumentLoading((prev) => ({ ...prev, [fileName]: false }));
      }, 1000);
    }
  };

  const getStatusBadge = (status) => {
    const config = statusColors[status] || {
      color: "bg-gray-100 text-gray-800",
    };
    const statusOption = statusOptions.find((opt) => opt.value === status);

    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
        {status}
        {statusOption && (
          <span className="ml-1 text-xs opacity-75">
            • {statusOption.description}
          </span>
        )}
      </div>
    );
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

  if (!isOpen) return null;

  if (!applicationDetails && !loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <IoWarningOutline className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Application Data
            </h3>
            <p className="text-gray-500 mb-4">
              The application details could not be loaded.
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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transition-transform duration-150 ${
          isClosing ? "scale-95" : "scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <IoPersonOutline className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading
                  ? "Loading..."
                  : applicationDetails?.internName || "Application Details"}
              </h2>
              <p className="text-gray-600">
                {loading ? "Please wait..." : applicationDetails?.internEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`m-6 p-4 rounded-lg ${
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

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Spinner size="lg" text="Loading application details..." />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              {[
                { id: "overview", label: "Overview", icon: IoPersonOutline },
                {
                  id: "internship",
                  label: "Internship",
                  icon: IoBusinessOutline,
                },
                {
                  id: "documents",
                  label: "Documents",
                  icon: IoDocumentTextOutline,
                },
                {
                  id: "actions",
                  label: "Actions",
                  icon: IoCheckmarkCircleOutline,
                },
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
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="p-6 space-y-8">
                  {/* Application Status */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Application Status
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(applicationDetails.status)}
                        <p className="text-sm text-gray-600 mt-2">
                          Applied on:{" "}
                          {formatDate(applicationDetails.applicationDate)}
                        </p>
                      </div>
                      {applicationDetails.currentAssignedMentorName && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Assigned Mentor
                          </p>
                          <p className="text-sm text-blue-600">
                            {applicationDetails.currentAssignedMentorName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        Personal Information
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <IoPersonOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">
                              {`${applicationDetails.firstName || ""} ${applicationDetails.middleName || ""} ${applicationDetails.lastName || ""}`.trim() ||
                                applicationDetails.internName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <IoMailOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <a
                              href={`mailto:${applicationDetails.internEmail}`}
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              {applicationDetails.internEmail}
                            </a>
                          </div>
                        </div>

                        {applicationDetails.internPhone &&
                          applicationDetails.internPhone !== "N/A" && (
                            <div className="flex items-center space-x-3">
                              <IoCallOutline className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <a
                                  href={`tel:${applicationDetails.internPhone}`}
                                  className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {applicationDetails.internPhone}
                                </a>
                              </div>
                            </div>
                          )}

                        {applicationDetails.applicantAddress && (
                          <div className="flex items-start space-x-3">
                            <IoLocationOutline className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-medium">
                                {applicationDetails.applicantAddress}
                                {applicationDetails.applicantCity &&
                                  `, ${applicationDetails.applicantCity}`}
                                {applicationDetails.applicantState &&
                                  `, ${applicationDetails.applicantState}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        Academic Information
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <IoSchoolOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">University</p>
                            <p className="font-medium">
                              {applicationDetails.university || "Not specified"}
                            </p>
                          </div>
                        </div>

                        {applicationDetails.currentYear && (
                          <div className="flex items-center space-x-3">
                            <IoCalendarOutline className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Current Year
                              </p>
                              <p className="font-medium">
                                {applicationDetails.currentYear}
                              </p>
                            </div>
                          </div>
                        )}

                        {applicationDetails.passingYear && (
                          <div className="flex items-center space-x-3">
                            <IoCalendarOutline className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Expected Graduation
                              </p>
                              <p className="font-medium">
                                {applicationDetails.passingYear}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {applicationDetails.applicantSkills &&
                    applicationDetails.applicantSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {applicationDetails.applicantSkills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                              >
                                <IoCodeSlashOutline className="w-4 h-4 mr-1" />
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {applicationDetails.github &&
                      applicationDetails.github !== "N/A" && (
                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                          <IoLogoGithub className="w-6 h-6 text-gray-700" />
                          <div>
                            <p className="text-sm text-gray-500">
                              GitHub Profile
                            </p>
                            <a
                              href={applicationDetails.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              View Profile
                              <IoLinkOutline className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      )}

                    {applicationDetails.linkedin &&
                      applicationDetails.linkedin !== "N/A" && (
                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                          <IoLogoLinkedin className="w-6 h-6 text-blue-700" />
                          <div>
                            <p className="text-sm text-gray-500">
                              LinkedIn Profile
                            </p>
                            <a
                              href={applicationDetails.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              View Profile
                              <IoLinkOutline className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Essay Responses */}
                  {(applicationDetails.whyInternship ||
                    applicationDetails.expectations) && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Application Responses
                      </h3>

                      {applicationDetails.whyInternship && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Why are you interested in this internship?
                          </p>
                          <p className="text-gray-600 leading-relaxed">
                            {applicationDetails.whyInternship}
                          </p>
                        </div>
                      )}

                      {applicationDetails.expectations && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            What do you expect to learn?
                          </p>
                          <p className="text-gray-600 leading-relaxed">
                            {applicationDetails.expectations}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Internship Tab */}
              {activeTab === "internship" && (
                <div className="p-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {applicationDetails.internshipTitle}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <IoBusinessOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Company</p>
                            <p className="font-medium">
                              {applicationDetails.internshipCompany ||
                                "Aninex Global"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <IoLocationOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">
                              {applicationDetails.internshipLocation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <IoCashOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Stipend</p>
                            <p className="font-medium">
                              {applicationDetails.internshipStipend}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <IoTimeOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium">
                              {applicationDetails.internshipDuration}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <IoCalendarOutline className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Application Deadline
                            </p>
                            <p className="font-medium">
                              {applicationDetails.internshipApplyBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploaded Documents
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resume */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <IoDocumentTextOutline className="w-6 h-6 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Resume
                            </h4>
                            <p className="text-sm text-gray-500">
                              {applicationDetails.resumeFileName ||
                                "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {applicationDetails.resumeFileName ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleDocumentAction(
                                applicationDetails.resumeFileName,
                                "view"
                              )
                            }
                            disabled={
                              documentLoading[applicationDetails.resumeFileName]
                            }
                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                          >
                            {documentLoading[
                              applicationDetails.resumeFileName
                            ] ? (
                              <Spinner size="xs" className="mr-2" />
                            ) : (
                              <IoEyeOutline className="w-4 h-4 mr-2" />
                            )}
                            View
                          </button>

                          <button
                            onClick={() =>
                              handleDocumentAction(
                                applicationDetails.resumeFileName,
                                "download"
                              )
                            }
                            disabled={
                              documentLoading[applicationDetails.resumeFileName]
                            }
                            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50"
                          >
                            {documentLoading[
                              applicationDetails.resumeFileName
                            ] ? (
                              <Spinner size="xs" className="mr-2" />
                            ) : (
                              <IoDownloadOutline className="w-4 h-4 mr-2" />
                            )}
                            Download
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No resume uploaded
                        </p>
                      )}
                    </div>

                    {/* Cover Letter */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <IoDocumentTextOutline className="w-6 h-6 text-purple-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Cover Letter
                            </h4>
                            <p className="text-sm text-gray-500">
                              {applicationDetails.coverLetterFileName ||
                                "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {applicationDetails.coverLetterFileName ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleDocumentAction(
                                applicationDetails.coverLetterFileName,
                                "view"
                              )
                            }
                            disabled={
                              documentLoading[
                                applicationDetails.coverLetterFileName
                              ]
                            }
                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                          >
                            {documentLoading[
                              applicationDetails.coverLetterFileName
                            ] ? (
                              <Spinner size="xs" className="mr-2" />
                            ) : (
                              <IoEyeOutline className="w-4 h-4 mr-2" />
                            )}
                            View
                          </button>

                          <button
                            onClick={() =>
                              handleDocumentAction(
                                applicationDetails.coverLetterFileName,
                                "download"
                              )
                            }
                            disabled={
                              documentLoading[
                                applicationDetails.coverLetterFileName
                              ]
                            }
                            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50"
                          >
                            {documentLoading[
                              applicationDetails.coverLetterFileName
                            ] ? (
                              <Spinner size="xs" className="mr-2" />
                            ) : (
                              <IoDownloadOutline className="w-4 h-4 mr-2" />
                            )}
                            Download
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No cover letter uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === "actions" && (
                <div className="p-6 space-y-8">
                  {/* Status Change */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Update Application Status
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="status-select"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Current Status:{" "}
                          {getStatusBadge(applicationDetails.status)}
                        </label>

                        <select
                          id="status-select"
                          value={currentStatus}
                          onChange={(e) => setCurrentStatus(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleStatusChange}
                          disabled={
                            currentStatus === applicationDetails.status ||
                            isSubmitting
                          }
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <Spinner size="sm" color="white" className="mr-2" />
                          ) : (
                            <IoSaveOutline className="w-4 h-4 mr-2" />
                          )}
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mentor Assignment */}
                  {(applicationDetails.status === "Hired" ||
                    applicationDetails.status === "Shortlisted") && (
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Assign Mentor
                      </h3>

                      {applicationDetails.currentAssignedMentorName && (
                        <div className="mb-4 p-3 bg-white rounded-md border">
                          <p className="text-sm text-gray-600">
                            Currently assigned to:
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <IoPeopleOutline className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {applicationDetails.currentAssignedMentorName}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="mentor-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Select Mentor
                          </label>

                          <select
                            id="mentor-select"
                            value={selectedMentor}
                            onChange={(e) => setSelectedMentor(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">-- Select Mentor --</option>
                            {mentorsList.map((mentor) => (
                              <option key={mentor.id} value={mentor.id}>
                                {mentor.name} ({mentor.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={handleMentorAssignment}
                            disabled={
                              !selectedMentor ||
                              selectedMentor ===
                                applicationDetails.currentAssignedMentorId ||
                              isSubmitting
                            }
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <Spinner
                                size="sm"
                                color="white"
                                className="mr-2"
                              />
                            ) : (
                              <IoPeopleOutline className="w-4 h-4 mr-2" />
                            )}
                            Assign Mentor
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Add Notes
                    </h3>

                    <div className="space-y-4">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this application..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />

                      <button
                        onClick={() => {
                          // In a real app, save notes to backend
                          setMessage({
                            type: "success",
                            text: "Notes saved successfully!",
                          });
                          setNotes("");
                        }}
                        disabled={!notes.trim() || isSubmitting}
                        className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoSaveOutline className="w-4 h-4 mr-2" />
                        Save Notes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;
