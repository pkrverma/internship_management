import React, { useState } from "react";
import {
  FaUserTie,
  FaUserGraduate,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaVideo,
  FaClipboardList,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";

// Enhanced icon mapping with more options
const iconMap = {
  mentor: {
    component: FaUserTie,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  intern: {
    component: FaUserGraduate,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  internship: {
    component: FaBriefcase,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  total: {
    component: FaUsers,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
  },
  applications: {
    component: FaFileAlt,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  interviews: {
    component: FaVideo,
    colorClass: "text-yellow-600",
    bgClass: "bg-yellow-50",
  },
  active: {
    component: FaCheckCircle,
    colorClass: "text-teal-600",
    bgClass: "bg-teal-50",
  },
  pending: {
    component: FaClock,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
  rejected: {
    component: FaTimes,
    colorClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  completed: {
    component: FaCheckCircle,
    colorClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  analytics: {
    component: FaChartLine,
    colorClass: "text-cyan-600",
    bgClass: "bg-cyan-50",
  },
  default: {
    component: FaClipboardList,
    colorClass: "text-gray-600",
    bgClass: "bg-gray-50",
  },
};

// Trend indicator component
const TrendIndicator = ({ trend }) => {
  if (!trend || trend.value === 0) return null;

  const isPositive = trend.value > 0;
  const TrendIcon = isPositive ? FaArrowUp : FaArrowDown;
  const trendClass = isPositive ? "text-green-500" : "text-red-500";

  return (
    <div className={`flex items-center space-x-1 ${trendClass} text-xs`}>
      <TrendIcon className="w-3 h-3" />
      <span className="font-medium">{Math.abs(trend.value)}%</span>
      <span className="text-gray-500">{trend.period}</span>
    </div>
  );
};

const StatsCard = ({
  title,
  count,
  icon,
  trend = null,
  subtitle = null,
  isLoading = false,
  onClick = null,
  className = "",
  size = "default",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get icon configuration
  const iconConfig = iconMap[icon] || iconMap.default;
  const IconComponent = iconConfig.component;
  const iconColorClass = iconConfig.colorClass;
  const iconBgClass = iconConfig.bgClass;

  // Size configurations
  const sizeClasses = {
    compact: {
      card: "p-4",
      icon: "p-2 w-4 h-4",
      title: "text-sm",
      count: "text-xl",
      subtitle: "text-xs",
    },
    default: {
      card: "p-6",
      icon: "p-3 w-6 h-6",
      title: "text-base",
      count: "text-2xl",
      subtitle: "text-sm",
    },
    large: {
      card: "p-8",
      icon: "p-4 w-8 h-8",
      title: "text-lg",
      count: "text-3xl",
      subtitle: "text-base",
    },
  };

  const sizeConfig = sizeClasses[size] || sizeClasses.default;

  // Format count for display
  const formatCount = (num) => {
    if (typeof num !== "number") return num;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const cardClasses = `
    bg-white rounded-xl shadow-sm border border-gray-200 
    ${sizeConfig.card} 
    ${onClick ? "cursor-pointer hover:shadow-lg hover:border-gray-300" : ""}
    ${isHovered ? "transform scale-105" : ""}
    transition-all duration-200 ease-in-out
    ${className}
  `;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : "presentation"}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={
        onClick
          ? `${title}: ${count}. Click for details.`
          : `${title}: ${count}`
      }
    >
      <div className="flex items-center justify-between">
        {/* Icon and main content */}
        <div className="flex items-center space-x-4">
          {/* Icon container */}
          <div
            className={`${iconBgClass} ${iconColorClass} rounded-full flex items-center justify-center transition-colors duration-200`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full border-2 border-current border-t-transparent w-6 h-6" />
            ) : (
              <IconComponent className={sizeConfig.icon} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4
              className={`${sizeConfig.title} font-medium text-gray-700 mb-1 truncate`}
            >
              {title}
            </h4>

            {/* Count with loading state */}
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
            ) : (
              <p className={`${sizeConfig.count} font-bold text-gray-900`}>
                {formatCount(count)}
              </p>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p
                className={`${sizeConfig.subtitle} text-gray-500 mt-1 truncate`}
              >
                {subtitle}
              </p>
            )}

            {/* Trend indicator */}
            <TrendIndicator trend={trend} />
          </div>
        </div>

        {/* Click indicator */}
        {onClick && (
          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FaArrowUp className="w-4 h-4 text-gray-400 transform rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
