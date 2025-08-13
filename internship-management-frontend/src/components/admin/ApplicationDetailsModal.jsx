import React, { useState, useEffect } from "react";
import {
  IoClose,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoEyeOutline,
} from "react-icons/io5";
import Spinner from "../ui/Spinner";

const formatDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const ApplicationDetailsModal = ({
  isOpen,
  onClose,
  applicationDetails,
  onStatusChange,
  statusColors = {},
  loading = false,
}) => {
  const [currentStatus, setCurrentStatus] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && applicationDetails) {
      setCurrentStatus(applicationDetails.status || "");
    }
  }, [isOpen, applicationDetails]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!isOpen) return null;

  const handleUpdateStatus = async () => {
    if (currentStatus === applicationDetails?.status) {
      setMessage({ type: "error", text: "Status is already set." });
      return;
    }
    try {
      setIsSubmitting(true);
      await onStatusChange(applicationDetails.id, currentStatus);
      setMessage({ type: "success", text: "Status updated" });
    } catch (err) {
      setMessage({ type: "error", text: "Update failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between p-3 border-b">
          <h2 className="font-bold">Application Details</h2>
          <button onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>
        {loading ? (
          <Spinner text="Loading..." />
        ) : !applicationDetails ? (
          <p className="p-4">No application data</p>
        ) : (
          <div className="p-4 space-y-3 text-sm">
            {message.text && (
              <div
                className={`p-2 rounded ${
                  message.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message.text}
              </div>
            )}
            <p>
              <strong>Name:</strong> {applicationDetails.internName}
            </p>
            <p>
              <strong>Email:</strong> {applicationDetails.internEmail}
            </p>
            <p>
              <strong>Applied on:</strong>{" "}
              {formatDate(applicationDetails.applicationDate)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  statusColors[applicationDetails.status]?.color ||
                  "bg-gray-100"
                }`}
              >
                {applicationDetails.status}
              </span>
            </p>
            <div>
              <label className="block font-medium mb-1">Update Status:</label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="border p-1 rounded"
              >
                <option value="">Select...</option>
                {[
                  "Submitted",
                  "Under Review",
                  "Interview Scheduled",
                  "Shortlisted",
                  "Hired",
                  "Rejected",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded"
                onClick={handleUpdateStatus}
                disabled={isSubmitting}
              >
                Save
              </button>
            </div>

            <div>
              <h3 className="font-semibold mt-4">Documents</h3>
              <p>Resume:</p>
              {applicationDetails.resumeFileName ? (
                <div className="flex gap-2 items-center">
                  <IoDocumentTextOutline /> {applicationDetails.resumeFileName}
                  <a
                    href={applicationDetails.resumeUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600"
                  >
                    <IoEyeOutline /> View
                  </a>
                  <a
                    href={applicationDetails.resumeUrl || "#"}
                    download
                    className="text-green-600"
                  >
                    <IoDownloadOutline /> Download
                  </a>
                </div>
              ) : (
                <p className="text-gray-500">No resume uploaded</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;
