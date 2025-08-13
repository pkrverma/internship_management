import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoNotificationsOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoEllipsisVerticalOutline,
  IoHeartOutline,
  IoHeart,
  IoChatbubbleOutline,
  IoShareOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoTrashOutline,
  IoArchiveOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoVideocamOutline,
  IoDownloadOutline,
  IoLinkOutline,
  IoEyeOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoStarOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoCheckboxOutline,
  IoSquareOutline,
  IoCloseCircleOutline,
  IoChevronDownOutline,
  IoGridOutline,
  IoListOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoMailOpenOutline,
  IoMailOutline,
  IoPulseOutline,
  IoFlashOutline,
  IoBulbOutline,
  IoMegaphoneOutline,
  IoShieldCheckmarkOutline,
  IoCogOutline,
  IoColorPaletteOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
} from "react-icons/io5";

const NOTIFICATION_TYPES = {
  Announcement: {
    color: "bg-blue-50 border-blue-200 text-blue-800",
    icon: IoMegaphoneOutline,
    iconColor: "text-blue-600",
    priority: "Medium",
  },
  "System Alert": {
    color: "bg-red-50 border-red-200 text-red-800",
    icon: IoWarningOutline,
    iconColor: "text-red-600",
    priority: "High",
  },
  Maintenance: {
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: IoCogOutline,
    iconColor: "text-yellow-600",
    priority: "Medium",
  },
  "New Feature": {
    color: "bg-green-50 border-green-200 text-green-800",
    icon: IoBulbOutline,
    iconColor: "text-green-600",
    priority: "Low",
  },
  "Policy Update": {
    color: "bg-purple-50 border-purple-200 text-purple-800",
    icon: IoDocumentTextOutline,
    iconColor: "text-purple-600",
    priority: "High",
  },
  Event: {
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
    icon: IoCalendarOutline,
    iconColor: "text-indigo-600",
    priority: "Medium",
  },
};

const PRIORITY_LEVELS = {
  Critical: {
    color: "text-red-700",
    badge: "bg-red-100 text-red-800",
    weight: 4,
  },
  High: {
    color: "text-orange-700",
    badge: "bg-orange-100 text-orange-800",
    weight: 3,
  },
  Medium: {
    color: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
    weight: 2,
  },
  Low: {
    color: "text-gray-700",
    badge: "bg-gray-100 text-gray-800",
    weight: 1,
  },
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [userInteractions, setUserInteractions] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("notifications_view") || "cards"
  );
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  const loadNotifications = useCallback(
    async (refreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        refreshing ? setRefreshing(true) : setLoading(true);
        const allUpdates = getData("updates") || [];
        const userInteractionsData =
          getData(`user_interactions_${user.id}`) || {};
        const relevantUpdates = allUpdates.filter((update) => {
          const isRelevant =
            update.targetRole === "All" ||
            update.targetRole === user.role ||
            (update.targetRole === "Specific" &&
              update.targetUserId === user.id);
          const isArchived = userInteractionsData[update.id]?.archived || false;
          return isRelevant && (showArchived ? isArchived : !isArchived);
        });
        const enriched = relevantUpdates.map((n) => {
          const config =
            NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES["Announcement"];
          const intx = userInteractionsData[n.id] || {};
          return { ...n, ...intx, config };
        });
        setNotifications(enriched);
        setUserInteractions(userInteractionsData);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load notifications" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id, user?.role, showArchived]
  );

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(() => loadNotifications(true), 60000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    // search + filters (safe guards)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.postedByName?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all")
      result = result.filter((n) => n.type === typeFilter);
    if (priorityFilter !== "all")
      result = result.filter((n) => n.priority === priorityFilter);
    if (statusFilter === "unread") result = result.filter((n) => !n.isRead);
    if (statusFilter === "read") result = result.filter((n) => n.isRead);
    // sort
    result.sort((a, b) => {
      let aVal =
        sortBy === "timestamp" ? new Date(a.timestamp) : a[sortBy] || "";
      let bVal =
        sortBy === "timestamp" ? new Date(b.timestamp) : b[sortBy] || "";
      return sortOrder === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });
    return result;
  }, [
    notifications,
    searchQuery,
    typeFilter,
    priorityFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginated = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user)
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to view notifications.
      </div>
    );
  if (loading) return <Spinner fullScreen text="Loading notifications..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <IoNotificationsOutline /> Notifications
      </h1>
      {message.text && (
        <div
          className={`p-2 my-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}
      {paginated.length === 0 && (
        <p className="text-gray-500 mt-4">No notifications found.</p>
      )}
      <div
        className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 gap-4" : "grid-cols-1 gap-2"} mt-4`}
      >
        {paginated.map((n) => {
          const Icon = n.config.icon;
          const isExpanded = expandedNotifications.has(n.id);
          return (
            <div
              key={n.id}
              className={`border p-3 rounded flex flex-col ${n.config.color}`}
            >
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={n.config.iconColor} />
                  <h2 className="font-semibold">{n.title}</h2>
                </div>
                <span>{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm">
                {isExpanded ? n.content : `${n.content?.slice(0, 100)}...`}
              </p>
              <button
                className="text-blue-600 text-xs mt-1"
                onClick={() => {
                  const newSet = new Set(expandedNotifications);
                  newSet.has(n.id) ? newSet.delete(n.id) : newSet.add(n.id);
                  setExpandedNotifications(newSet);
                }}
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
