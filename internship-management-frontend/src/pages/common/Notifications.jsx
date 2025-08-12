// src/pages/common/Notifications.jsx
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
  IoFunnel,
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

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [userInteractions, setUserInteractions] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("notifications_view") || "cards"
  );
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showSettings, setShowSettings] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    autoMarkAsRead: true,
    soundEnabled: true,
    desktopNotifications: true,
    emailDigest: true,
    pushNotifications: true,
  });

  // Load notifications and user interactions
  const loadNotifications = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const allUpdates = getData("updates") || [];
        const userInteractionsData =
          getData(`user_interactions_${user.id}`) || {};
        const userNotificationSettings =
          getData(`notification_settings_${user.id}`) || notificationSettings;

        setUserInteractions(userInteractionsData);
        setNotificationSettings(userNotificationSettings);

        // Filter relevant notifications
        const relevantUpdates = allUpdates.filter((update) => {
          const isRelevant =
            update.targetRole === "All" ||
            update.targetRole === user.role ||
            (update.targetRole === "Specific" &&
              update.targetUserId === user.id);

          // Filter by archived status
          const isArchived = userInteractionsData[update.id]?.archived || false;
          return isRelevant && (showArchived ? isArchived : !isArchived);
        });

        // Enrich notifications with interaction data
        const enrichedNotifications = relevantUpdates.map((notification) => {
          const interactions = userInteractionsData[notification.id] || {};
          const notificationConfig =
            NOTIFICATION_TYPES[notification.type] ||
            NOTIFICATION_TYPES["Announcement"];

          return {
            ...notification,
            isRead: interactions.isRead || false,
            isLiked: interactions.isLiked || false,
            isBookmarked: interactions.isBookmarked || false,
            isAcknowledged: interactions.isAcknowledged || false,
            archived: interactions.archived || false,
            readAt: interactions.readAt,
            interactionCount:
              (interactions.likes || 0) + (interactions.comments || 0),
            config: notificationConfig,
          };
        });

        // Auto-mark as read if setting is enabled
        if (userNotificationSettings.autoMarkAsRead) {
          const updatedInteractions = { ...userInteractionsData };
          let hasChanges = false;

          enrichedNotifications.forEach((notification) => {
            if (!notification.isRead) {
              updatedInteractions[notification.id] = {
                ...updatedInteractions[notification.id],
                isRead: true,
                readAt: new Date().toISOString(),
              };
              hasChanges = true;
            }
          });

          if (hasChanges) {
            await saveData(`user_interactions_${user.id}`, updatedInteractions);
            setUserInteractions(updatedInteractions);
          }
        }

        setNotifications(enrichedNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setMessage({
          type: "error",
          text: "Failed to load notifications. Please try again.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id, showArchived, notificationSettings]
  );

  // Initial load and periodic refresh
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadNotifications(true);
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("notifications_view", viewMode);
  }, [viewMode]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter((notification) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.content?.toLowerCase().includes(searchLower) ||
        notification.postedByName?.toLowerCase().includes(searchLower);

      const matchesType =
        typeFilter === "all" || notification.type === typeFilter;
      const matchesPriority =
        priorityFilter === "all" || notification.priority === priorityFilter;

      const matchesStatus = (() => {
        switch (statusFilter) {
          case "unread":
            return !notification.isRead;
          case "read":
            return notification.isRead;
          case "liked":
            return notification.isLiked;
          case "bookmarked":
            return notification.isBookmarked;
          case "acknowledged":
            return notification.requireAcknowledgment
              ? notification.isAcknowledged
              : true;
          default:
            return true;
        }
      })();

      const matchesDate = (() => {
        if (dateFilter === "all") return true;

        const notificationDate = new Date(notification.timestamp);
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        switch (dateFilter) {
          case "today":
            return notificationDate >= today;
          case "week": {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return notificationDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return notificationDate >= monthAgo;
          }
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesType &&
        matchesPriority &&
        matchesStatus &&
        matchesDate
      );
    });

    // Sort notifications
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "timestamp":
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
          break;
        case "priority":
          aVal = PRIORITY_LEVELS[a.priority]?.weight || 0;
          bVal = PRIORITY_LEVELS[b.priority]?.weight || 0;
          break;
        case "type":
          aVal = a.type || "";
          bVal = b.type || "";
          break;
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "author":
          aVal = a.postedByName?.toLowerCase() || "";
          bVal = b.postedByName?.toLowerCase() || "";
          break;
        default:
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [
    notifications,
    searchQuery,
    typeFilter,
    priorityFilter,
    statusFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedNotifications.length / itemsPerPage
  );
  const paginatedNotifications = filteredAndSortedNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const liked = notifications.filter((n) => n.isLiked).length;
    const bookmarked = notifications.filter((n) => n.isBookmarked).length;
    const needsAcknowledgment = notifications.filter(
      (n) => n.requireAcknowledgment && !n.isAcknowledged
    ).length;

    return { total, unread, liked, bookmarked, needsAcknowledgment };
  }, [notifications]);

  const handleInteraction = async (
    notificationId,
    interactionType,
    value = true
  ) => {
    try {
      const updatedInteractions = {
        ...userInteractions,
        [notificationId]: {
          ...userInteractions[notificationId],
          [interactionType]: value,
          [`${interactionType}At`]: value ? new Date().toISOString() : null,
        },
      };

      await saveData(`user_interactions_${user.id}`, updatedInteractions);
      setUserInteractions(updatedInteractions);

      // Update local notification state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, [interactionType]: value } : n
        )
      );

      setMessage({
        type: "success",
        text: `Notification ${interactionType.replace("is", "").toLowerCase()}${value ? "ed" : " removed"}`,
      });
    } catch (error) {
      console.error("Failed to update interaction:", error);
      setMessage({ type: "error", text: "Failed to update notification" });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.size === 0) {
      setMessage({ type: "error", text: "Please select notifications first" });
      return;
    }

    try {
      const updatedInteractions = { ...userInteractions };

      selectedNotifications.forEach((notificationId) => {
        switch (action) {
          case "markRead":
            updatedInteractions[notificationId] = {
              ...updatedInteractions[notificationId],
              isRead: true,
              readAt: new Date().toISOString(),
            };
            break;
          case "markUnread":
            updatedInteractions[notificationId] = {
              ...updatedInteractions[notificationId],
              isRead: false,
              readAt: null,
            };
            break;
          case "archive":
            updatedInteractions[notificationId] = {
              ...updatedInteractions[notificationId],
              archived: true,
              archivedAt: new Date().toISOString(),
            };
            break;
          case "delete":
            updatedInteractions[notificationId] = {
              ...updatedInteractions[notificationId],
              deleted: true,
              deletedAt: new Date().toISOString(),
            };
            break;
        }
      });

      await saveData(`user_interactions_${user.id}`, updatedInteractions);
      setUserInteractions(updatedInteractions);
      setSelectedNotifications(new Set());

      // Reload notifications
      await loadNotifications();

      setMessage({
        type: "success",
        text: `${selectedNotifications.size} notification(s) ${action.replace(/([A-Z])/g, " $1").toLowerCase()}ed`,
      });
    } catch (error) {
      console.error("Bulk action failed:", error);
      setMessage({ type: "error", text: "Bulk action failed" });
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === paginatedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(paginatedNotifications.map((n) => n.id))
      );
    }
  };

  const handleNotificationClick = async (notificationId) => {
    if (!userInteractions[notificationId]?.isRead) {
      await handleInteraction(notificationId, "isRead", true);
    }
  };

  const toggleExpanded = (notificationId) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return time.toLocaleDateString();
  };

  const getNotificationIcon = (notification) => {
    const IconComponent = notification.config.icon;
    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          notification.config.color.includes("blue")
            ? "bg-blue-100"
            : notification.config.color.includes("red")
              ? "bg-red-100"
              : notification.config.color.includes("yellow")
                ? "bg-yellow-100"
                : notification.config.color.includes("green")
                  ? "bg-green-100"
                  : notification.config.color.includes("purple")
                    ? "bg-purple-100"
                    : "bg-indigo-100"
        }`}
      >
        <IconComponent className={`w-5 h-5 ${notification.config.iconColor}`} />
      </div>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = PRIORITY_LEVELS[priority] || PRIORITY_LEVELS["Medium"];
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}
      >
        {priority}
      </span>
    );
  };

  const renderNotificationCard = (notification) => {
    const isExpanded = expandedNotifications.has(notification.id);
    const isSelected = selectedNotifications.has(notification.id);

    return (
      <div
        key={notification.id}
        className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
          !notification.isRead
            ? "border-blue-200 bg-blue-50/30"
            : "border-gray-200"
        } ${isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  const newSelected = new Set(selectedNotifications);
                  if (e.target.checked) {
                    newSelected.add(notification.id);
                  } else {
                    newSelected.delete(notification.id);
                  }
                  setSelectedNotifications(newSelected);
                }}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />

              {getNotificationIcon(notification)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <IoPersonOutline className="w-4 h-4 mr-1" />
                    {notification.postedByName}
                  </span>
                  <span className="flex items-center">
                    <IoTimeOutline className="w-4 h-4 mr-1" />
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  {getPriorityBadge(notification.priority)}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${notification.config.color}`}
                  >
                    {notification.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleExpanded(notification.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <IoChevronDownOutline
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Content Preview */}
          <div className="mb-4">
            <p className={`text-gray-700 ${isExpanded ? "" : "line-clamp-3"}`}>
              {notification.content}
            </p>

            {notification.content &&
              notification.content.length > 200 &&
              !isExpanded && (
                <button
                  onClick={() => toggleExpanded(notification.id)}
                  className="text-blue-600 text-sm font-medium mt-1 hover:underline"
                >
                  Show more
                </button>
              )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-4">
              {/* Featured Image */}
              {notification.featuredImage && (
                <div>
                  <img
                    src={notification.featuredImage.url}
                    alt="Featured"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Video */}
              {notification.videoUrl && (
                <div className="bg-gray-100 p-4 rounded-lg flex items-center">
                  <IoVideocamOutline className="w-5 h-5 text-blue-600 mr-2" />
                  <a
                    href={notification.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Watch Video
                  </a>
                </div>
              )}

              {/* Attachments */}
              {notification.attachments &&
                notification.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {notification.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center">
                            <IoDocumentTextOutline className="w-4 h-4 text-gray-600 mr-2" />
                            <span className="text-sm font-medium">
                              {file.name}
                            </span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            <IoDownloadOutline className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Call to Action */}
              {notification.ctaEnabled && notification.ctaLabel && (
                <div>
                  <a
                    href={notification.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-6 py-2 rounded-md font-medium transition-colors ${
                      notification.ctaStyle === "primary"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : notification.ctaStyle === "secondary"
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {notification.ctaLabel}
                  </a>
                </div>
              )}

              {/* Tags */}
              {notification.tags && notification.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {notification.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  handleInteraction(
                    notification.id,
                    "isLiked",
                    !notification.isLiked
                  )
                }
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                  notification.isLiked
                    ? "text-red-600 hover:text-red-700"
                    : "text-gray-500 hover:text-red-600"
                }`}
              >
                {notification.isLiked ? (
                  <IoHeart className="w-4 h-4" />
                ) : (
                  <IoHeartOutline className="w-4 h-4" />
                )}
                <span>Like</span>
              </button>

              <button
                onClick={() =>
                  handleInteraction(
                    notification.id,
                    "isBookmarked",
                    !notification.isBookmarked
                  )
                }
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                  notification.isBookmarked
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {notification.isBookmarked ? (
                  <IoBookmark className="w-4 h-4" />
                ) : (
                  <IoBookmarkOutline className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>

              <button
                className="flex items-center space-x-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.href + `#notification-${notification.id}`
                  );
                  setMessage({
                    type: "success",
                    text: "Link copied to clipboard",
                  });
                }}
              >
                <IoShareOutline className="w-4 h-4" />
                <span>Share</span>
              </button>

              {notification.requireAcknowledgment &&
                !notification.isAcknowledged && (
                  <button
                    onClick={() =>
                      handleInteraction(notification.id, "isAcknowledged", true)
                    }
                    className="flex items-center space-x-1 text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    <span>Acknowledge</span>
                  </button>
                )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  handleInteraction(notification.id, "archived", true)
                }
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Archive"
              >
                <IoArchiveOutline className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: "delete",
                    title: "Delete Notification",
                    message:
                      "Are you sure you want to delete this notification?",
                    data: notification.id,
                  })
                }
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete"
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Acknowledgment Status */}
          {notification.requireAcknowledgment && (
            <div
              className={`mt-4 p-3 rounded-md ${
                notification.isAcknowledged
                  ? "bg-green-50 border border-green-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-center">
                {notification.isAcknowledged ? (
                  <IoCheckmarkCircleOutline className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <IoWarningOutline className="w-4 h-4 text-yellow-600 mr-2" />
                )}
                <span
                  className={`text-sm font-medium ${
                    notification.isAcknowledged
                      ? "text-green-800"
                      : "text-yellow-800"
                  }`}
                >
                  {notification.isAcknowledged
                    ? "Acknowledged"
                    : "Acknowledgment Required"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const confirmAction = async () => {
    const { type, data } = confirmModal;

    if (type === "delete") {
      await handleInteraction(data, "deleted", true);
      await loadNotifications();
    }

    setConfirmModal({
      isOpen: false,
      type: null,
      title: "",
      message: "",
      data: null,
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <IoNotificationsOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500">
            Please log in to view your notifications.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading your notifications..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <IoNotificationsOutline className="mr-3" />
            Notifications
            {stats.unread > 0 && (
              <span className="ml-3 px-2 py-1 bg-blue-600 text-white text-sm rounded-full">
                {stats.unread} new
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">
            {showArchived
              ? "Archived notifications"
              : "Stay updated with important announcements"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
              showArchived
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            }`}
          >
            <IoArchiveOutline className="w-4 h-4 mr-2" />
            {showArchived ? "Show Current" : "Show Archived"}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoSettingsOutline className="w-4 h-4 mr-2" />
            Settings
          </button>

          <button
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
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

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoNotificationsOutline className="w-6 h-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoMailOutline className="w-6 h-6 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unread</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.unread}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoHeartOutline className="w-6 h-6 text-pink-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Liked</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.liked}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoBookmarkOutline className="w-6 h-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Saved</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.bookmarked}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoWarningOutline className="w-6 h-6 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Needs Action</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.needsAcknowledgment}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by title, content, or author..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline className="mr-2 h-4 w-4" />
              Filters
              {(typeFilter !== "all" ||
                priorityFilter !== "all" ||
                statusFilter !== "all" ||
                dateFilter !== "all") && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  Active
                </span>
              )}
            </button>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedNotifications.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction("markRead")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Archive
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedNotifications.size === paginatedNotifications.length
                ? "Deselect All"
                : "Select All"}
            </button>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200 mt-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {Object.keys(NOTIFICATION_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              {Object.keys(PRIORITY_LEVELS).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="liked">Liked</option>
              <option value="bookmarked">Bookmarked</option>
              <option value="acknowledged">Acknowledged</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="timestamp-desc">Newest First</option>
              <option value="timestamp-asc">Oldest First</option>
              <option value="priority-desc">High Priority First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="author-asc">Author A-Z</option>
            </select>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedNotifications.length} of{" "}
          {notifications.length} notifications
        </div>
      </div>

      {/* Notifications List */}
      {filteredAndSortedNotifications.length === 0 ? (
        <div className="text-center py-12">
          <IoNotificationsOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {notifications.length === 0
              ? showArchived
                ? "No archived notifications"
                : "No notifications yet"
              : "No notifications found"}
          </h3>
          <p className="text-gray-500">
            {notifications.length === 0
              ? showArchived
                ? "You haven't archived any notifications yet."
                : "Check back later for important updates and announcements."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
        </div>
      ) : (
        <>
          {/* Notifications */}
          <div className="space-y-6 mb-8">
            {paginatedNotifications.map((notification) =>
              renderNotificationCard(notification)
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedNotifications.length
                  )}{" "}
                  of {filteredAndSortedNotifications.length} notifications
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm font-medium text-gray-900">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Notification Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseCircleOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <p className="text-xs text-gray-500">
                      {key === "autoMarkAsRead" &&
                        "Automatically mark notifications as read when viewed"}
                      {key === "soundEnabled" &&
                        "Play sounds for new notifications"}
                      {key === "desktopNotifications" &&
                        "Show desktop notification alerts"}
                      {key === "emailDigest" &&
                        "Receive daily email digest of notifications"}
                      {key === "pushNotifications" &&
                        "Send push notifications to your devices"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => {
                        const newSettings = {
                          ...notificationSettings,
                          [key]: e.target.checked,
                        };
                        setNotificationSettings(newSettings);
                        saveData(
                          `notification_settings_${user.id}`,
                          newSettings
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

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
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
};

export default Notifications;
