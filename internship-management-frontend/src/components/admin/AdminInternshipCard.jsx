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

const AdminInternshipCard = ({
  internship,
  onViewDetails,
  onEdit = null,
  onDelete = null,
  onToggleStatus = null,
  loading = false,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <IoWarningOutline className="mx-auto h-8 w-8 mb-2" />
          <p>Internship data unavailable</p>
        </div>
      </div>
    );
  }

  const {
    id,
    title = "Untitled Internship",
    company = "N/A",
    location = "Not specified",
    stipend = "N/A",
    duration = "N/A",
    applyBy = "N/A",
    applicationDeadline,
    status = "draft",
    applicantCount = 0,
    description = "",
    requirements = [],
    createdAt,
  } = internship;

  // Status configuration
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "active":
        return {
          label: "Active",
          classes: "bg-green-100 text-green-800",
          icon: IoCheckmarkCircleOutline,
        };
      case "closed":
        return {
          label: "Closed",
          classes: "bg-red-100 text-red-800",
          icon: IoCloseCircleOutline,
        };
      case "draft":
        return {
          label: "Draft",
          classes: "bg-gray-100 text-gray-800",
          icon: IoCreateOutline,
        };
      default:
        return {
          label: "Inactive",
          classes: "bg-yellow-100 text-yellow-800",
          icon: IoWarningOutline,
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Check if deadline is approaching
  const isDeadlineApproaching = () => {
    if (!applicationDeadline) return false;
    const deadline = new Date(applicationDeadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline - now) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 3 && daysUntilDeadline > 0;
  };

  const isExpired = () => {
    if (!applicationDeadline) return false;
    return new Date(applicationDeadline) < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        hover:shadow-md hover:border-gray-300 transition-all duration-200
        ${isHovered ? "transform scale-[1.02]" : ""}
        ${isExpired() ? "opacity-75" : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate mb-1">
              {title}
            </h3>
            {company && company !== "N/A" && (
              <p className="text-sm text-blue-600 font-medium">{company}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <span
              className={`
              inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap
              ${statusConfig.classes}
            `}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Deadline Warning */}
        {isDeadlineApproaching() && (
          <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center">
              <IoWarningOutline className="w-4 h-4 text-orange-600 mr-2" />
              <p className="text-xs text-orange-700 font-medium">
                Deadline approaching in{" "}
                {Math.ceil(
                  (new Date(applicationDeadline) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </p>
            </div>
          </div>
        )}

        {isExpired() && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <IoCloseCircleOutline className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-xs text-red-700 font-medium">
                Application deadline passed
              </p>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <IoLocationOutline className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          <div className="flex items-center">
            <IoCashOutline className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{stipend}</span>
          </div>

          <div className="flex items-center">
            <IoTimeOutline className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{duration}</span>
          </div>

          <div className="flex items-center">
            <IoCalendarOutline className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">
              Apply by: {formatDate(applicationDeadline) || applyBy}
            </span>
          </div>
        </div>

        {/* Description Preview */}
        {description && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Requirements Preview */}
        {requirements && requirements.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {requirements.slice(0, 3).map((req, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md"
                >
                  {req}
                </span>
              ))}
              {requirements.length > 3 && (
                <span className="inline-flex px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-md">
                  +{requirements.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Applicant Count */}
          <div className="flex items-center text-sm text-gray-600">
            <IoPeopleOutline className="w-4 h-4 mr-2" />
            <span className="font-medium">{applicantCount}</span>
            <span className="ml-1">
              {applicantCount === 1 ? "Applicant" : "Applicants"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(internship)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <IoEyeOutline className="w-4 h-4 mr-1" />
              View Details
            </button>

            {onEdit && (
              <button
                onClick={() => onEdit(internship)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <IoCreateOutline className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}

            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(internship)}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  status === "active" || status === "open"
                    ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                }`}
              >
                {status === "active" || status === "open"
                  ? "Close"
                  : "Activate"}
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(internship)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Creation Date */}
      {createdAt && (
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-400">
            Created {formatDate(createdAt)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminInternshipCard;
