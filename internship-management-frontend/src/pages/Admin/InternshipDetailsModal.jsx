import React, { useState, useEffect, useMemo } from "react";
import { getData, saveData } from "../../services/dataService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoClose,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoPlayCircleOutline,
  IoStopCircleOutline,
  IoPauseCircleOutline,
  IoCreateOutline,
  IoArchiveOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoCalendarOutline,
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
  onDelete,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [enrichedApplicants, setEnrichedApplicants] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

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
          applicationId: application?.id,
          applicationDate: application?.submittedAt || application?.createdAt,
          applicationStatus: application?.status || "Submitted",
        };
      });
      setEnrichedApplicants(enriched);
    }
  }, [isOpen, internship, applicants]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isUpdating) return;
    onClose();
    setActiveTab("overview");
    setMessage({ type: "", text: "" });
    setConfirmModal({
      isOpen: false,
      type: null,
      title: "",
      message: "",
      data: null,
    });
  };

  const getStatusBadge = (status, config = STATUS_CONFIG) => {
    const statusConfig = config[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: IoWarningOutline,
    };
    const Icon = statusConfig.icon;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="mr-1" /> {status}
      </span>
    );
  };

  const handleStatusChangeClick = (newStatus) => {
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
      const updatedApps = applications.map((app) =>
        (app.internId === applicantId || app.userId === applicantId) &&
        app.internshipId === internship.id
          ? { ...app, status: newStatus }
          : app
      );
      await saveData("applications", updatedApps);
      setEnrichedApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId ? { ...a, applicationStatus: newStatus } : a
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
      if (type === "status_change") {
        await onStatusChange(internship.id, data.newStatus);
        setMessage({
          type: "success",
          text: `Status updated to ${data.newStatus}`,
        });
      } else if (type === "delete") {
        await onDelete(internship.id);
        handleClose();
      }
    } catch (error) {
      console.error("Modal action failed:", error);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-lg overflow-hidden">
        {loading ? (
          <Spinner fullScreen text="Loading internship details..." />
        ) : (
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold">{internship?.title}</h2>
              <button onClick={handleClose}>
                <IoClose size={24} />
              </button>
            </div>
            <div className="mt-2">{getStatusBadge(internship?.status)}</div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">{internship?.description}</p>
            </div>

            {/* Applicants */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">
                Applicants ({enrichedApplicants.length})
              </h3>
              {enrichedApplicants.length === 0 ? (
                <p className="text-gray-500 text-sm">No applicants yet.</p>
              ) : (
                <ul className="space-y-2">
                  {enrichedApplicants.map((app) => (
                    <li
                      key={app.id}
                      className="border p-2 rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(
                          app.applicationStatus,
                          APPLICATION_STATUS_CONFIG
                        )}
                        <select
                          value={app.applicationStatus}
                          onChange={(e) =>
                            handleApplicationStatusChange(
                              app.id,
                              e.target.value
                            )
                          }
                          className="border rounded text-xs p-1"
                          disabled={isUpdating}
                        >
                          {Object.keys(APPLICATION_STATUS_CONFIG).map(
                            (status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {message.text && (
              <div
                className={`mt-4 p-2 rounded ${
                  message.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.type === "delete"}
      />
    </div>
  );
};

export default InternshipDetailsModal;
