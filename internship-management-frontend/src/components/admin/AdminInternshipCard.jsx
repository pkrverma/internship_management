import React, { useState } from "react";
import {
  IoLocationOutline,
  IoCashOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPeopleOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
} from "react-icons/io5";

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const AdminInternshipCard = ({
  internship = {},
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  loading = false,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <div className={`border rounded p-4 ${className} bg-white animate-pulse`}>
        Loading internship...
      </div>
    );
  }

  const {
    title,
    company,
    location,
    stipend,
    duration,
    openings,
    description,
    requirements = [],
    status,
    createdAt,
    applicationDeadline,
  } = internship;

  const deadlineDays =
    applicationDeadline &&
    Math.ceil(
      (new Date(applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)
    );

  return (
    <div
      className={`border rounded bg-white p-4 shadow-sm ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="font-bold text-lg">{title || "Untitled"}</h2>
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${
            status === "Open"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-2">{company}</p>
      <div className="text-sm space-y-1 mb-2">
        {location && (
          <div className="flex items-center gap-1">
            <IoLocationOutline /> {location}
          </div>
        )}
        {stipend && (
          <div className="flex items-center gap-1">
            <IoCashOutline /> {stipend}
          </div>
        )}
        {duration && (
          <div className="flex items-center gap-1">
            <IoTimeOutline /> {duration}
          </div>
        )}
        {openings && (
          <div className="flex items-center gap-1">
            <IoPeopleOutline /> {openings} openings
          </div>
        )}
      </div>

      {deadlineDays !== false &&
        (deadlineDays > 0 ? (
          <p className="text-xs text-orange-600">
            <IoWarningOutline className="inline" /> Deadline in {deadlineDays}{" "}
            days
          </p>
        ) : (
          <p className="text-xs text-red-600">
            <IoCloseCircleOutline className="inline" /> Application deadline
            passed
          </p>
        ))}

      <p className="mt-2 text-sm text-gray-700">
        {description
          ? description.slice(0, 120) + (description.length > 120 ? "..." : "")
          : "No description provided."}
      </p>

      {Array.isArray(requirements) && requirements.length > 0 && (
        <ul className="mt-2 text-xs text-gray-600 list-disc pl-4">
          {requirements.slice(0, 3).map((req, idx) => (
            <li key={idx}>{req}</li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Created {formatDate(createdAt)}
      </p>

      <div className="mt-3 flex gap-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(internship)}
            className="flex items-center gap-1 px-2 py-1 border rounded text-xs"
          >
            <IoEyeOutline /> View
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(internship)}
            className="flex items-center gap-1 px-2 py-1 border rounded text-xs"
          >
            <IoCreateOutline /> Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(internship)}
            className="flex items-center gap-1 px-2 py-1 border rounded text-xs text-red-600"
          >
            <IoTrashOutline /> Delete
          </button>
        )}
        {onToggleStatus && (
          <button
            onClick={() => onToggleStatus(internship)}
            className="flex items-center gap-1 px-2 py-1 border rounded text-xs"
          >
            {status === "Open" ? (
              <>
                <IoCloseCircleOutline /> Close
              </>
            ) : (
              <>
                <IoCheckmarkCircleOutline /> Open
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminInternshipCard;
