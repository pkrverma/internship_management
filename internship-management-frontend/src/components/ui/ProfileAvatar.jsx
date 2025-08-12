import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/outline";

// Helper function to get initials from a name
const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "?";

  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

// Helper function to generate consistent colors based on user ID or name
const getUserColor = (user) => {
  if (!user?.id && !user?.name) return "bg-gray-500";

  const seed = user.id || user.name;
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Role-specific styling
const getRoleStyle = (role) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "ring-red-500 bg-red-500";
    case "mentor":
      return "ring-blue-500 bg-blue-500";
    case "intern":
      return "ring-green-500 bg-green-500";
    default:
      return "ring-gray-500 bg-gray-500";
  }
};

const ProfileAvatar = ({
  user,
  size = "lg",
  showStatus = false,
  isOnline = false,
  showRole = false,
  onClick = null,
  className = "",
  fallbackIcon = UserIcon,
  loading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!user && !loading) return null;

  // Size configurations
  const sizeClasses = {
    xs: {
      container: "h-6 w-6",
      text: "text-xs",
      status: "h-2 w-2 -bottom-0 -right-0",
      ring: "ring-1",
    },
    sm: {
      container: "h-8 w-8",
      text: "text-xs",
      status: "h-2.5 w-2.5 -bottom-0.5 -right-0.5",
      ring: "ring-1",
    },
    md: {
      container: "h-12 w-12",
      text: "text-sm",
      status: "h-3 w-3 -bottom-0.5 -right-0.5",
      ring: "ring-2",
    },
    lg: {
      container: "h-16 w-16 sm:h-20 sm:w-20",
      text: "text-lg sm:text-2xl",
      status: "h-4 w-4 -bottom-1 -right-1",
      ring: "ring-2",
    },
    xl: {
      container: "h-24 w-24 sm:h-32 sm:w-32",
      text: "text-2xl sm:text-4xl",
      status: "h-5 w-5 -bottom-1 -right-1",
      ring: "ring-4",
    },
  };

  const sizeConfig = sizeClasses[size] || sizeClasses.lg;
  const initials = getInitials(user?.name);
  const userColor = showRole ? getRoleStyle(user?.role) : getUserColor(user);
  const FallbackIcon = fallbackIcon;

  const containerClasses = `
    relative inline-block ${sizeConfig.container}
    ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
    ${className}
  `;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div
          className={`rounded-full bg-gray-200 animate-pulse ${sizeConfig.container}`}
        />
      );
    }

    if (user?.profilePictureUrl && !imageError) {
      return (
        <div
          className={`overflow-hidden rounded-full ${sizeConfig.container} relative`}
        >
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
          )}
          <img
            src={user.profilePictureUrl}
            alt={user.name || "User avatar"}
            className={`object-cover w-full h-full transition-opacity duration-200 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
      );
    }

    // Fallback to initials or icon
    if (initials && initials !== "?") {
      return (
        <div
          className={`
          flex items-center justify-center rounded-full text-white font-bold
          ${sizeConfig.container} ${sizeConfig.text} ${userColor}
        `}
        >
          <span>{initials}</span>
        </div>
      );
    }

    // Ultimate fallback to icon
    return (
      <div
        className={`
        flex items-center justify-center rounded-full text-white
        ${sizeConfig.container} ${userColor}
      `}
      >
        <FallbackIcon className="w-1/2 h-1/2" />
      </div>
    );
  };

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={
        user?.name ? `${user.name} profile picture` : "User profile picture"
      }
    >
      {renderContent()}

      {/* Online/Offline status indicator */}
      {showStatus && !loading && (
        <span
          className={`
            absolute rounded-full border-2 border-white
            ${sizeConfig.status}
            ${isOnline ? "bg-green-500" : "bg-gray-400"}
          `}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}

      {/* Role indicator */}
      {showRole && user?.role && !loading && (
        <div
          className={`
            absolute -bottom-1 -right-1 px-1 py-0.5 text-xs font-medium
            text-white rounded-full ${sizeConfig.ring}
            ${getRoleStyle(user.role)}
          `}
          style={{
            fontSize: size === "xs" || size === "sm" ? "0.6rem" : undefined,
          }}
        >
          {user.role.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
