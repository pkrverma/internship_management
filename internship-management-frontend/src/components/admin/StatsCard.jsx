import React from "react";
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
} from "react-icons/fa";

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

const TrendIndicator = ({ trend }) => {
  if (!trend || trend.value === 0) return null;
  const isPositive = trend.value > 0;
  const TrendIcon = isPositive ? FaArrowUp : FaArrowDown;
  const trendClass = isPositive ? "text-green-500" : "text-red-500";
  return (
    <span className={`flex items-center gap-1 ${trendClass} text-xs`}>
      <TrendIcon /> {Math.abs(trend.value)}%
    </span>
  );
};

const StatsCard = ({ type = "default", title, count = 0, subtitle, trend }) => {
  const iconConf = iconMap[type] || iconMap.default;
  const Icon = iconConf.component;
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded shadow border">
      <div className={`p-3 rounded-full ${iconConf.bgClass}`}>
        <Icon className={`text-xl ${iconConf.colorClass}`} />
      </div>
      <div className="flex flex-col flex-grow">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-lg font-semibold">{count.toLocaleString()}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
      {trend && <TrendIndicator trend={trend} />}
    </div>
  );
};

export default StatsCard;
