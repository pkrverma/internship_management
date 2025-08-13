import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNotificationCount } from "../../services/notificationService";
import ProfileAvatar from "../ui/ProfileAvatar";
import {
  IoGridOutline,
  IoBriefcaseOutline,
  IoDocumentTextOutline,
  IoCheckmarkDoneCircleOutline,
  IoChatbubblesOutline,
  IoVideocamOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoPeopleOutline,
  IoFileTrayFullOutline,
  IoAnalyticsOutline,
  IoNotificationsOutline,
  IoCreateOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch real notification count from backend
  const fetchNotificationCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getNotificationCount();
      setUnreadNotificationCount(count.unread || count.count || 0);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      setUnreadNotificationCount(0);
    }
  }, [user]);

  // Build nav items based on role
  const getNavItems = () => {
    const role = user?.role?.toLowerCase();
    const commonItems = [];

    if (role === "intern") {
      return [
        { to: "/intern/dashboard", icon: IoGridOutline, label: "Dashboard" },
        {
          to: "/notifications",
          icon: IoNotificationsOutline,
          label: "Notifications",
          showCount: true,
        },
        {
          to: "/internships",
          icon: IoBriefcaseOutline,
          label: "Find Internships",
        },
        {
          to: "/intern/applications",
          icon: IoDocumentTextOutline,
          label: "My Applications",
        },
        {
          to: "/intern/tasks",
          icon: IoCheckmarkDoneCircleOutline,
          label: "My Tasks",
        },
        {
          to: "/intern/documents",
          icon: IoDocumentTextOutline,
          label: "Documents",
        },
        {
          to: "/intern/chat",
          icon: IoChatbubblesOutline,
          label: "Chat with Mentor",
        },
        { to: "/intern/meetings", icon: IoVideocamOutline, label: "Meetings" },
      ];
    }

    if (role === "mentor") {
      return [
        { to: "/mentor/dashboard", icon: IoGridOutline, label: "Dashboard" },
        {
          to: "/notifications",
          icon: IoNotificationsOutline,
          label: "Notifications",
          showCount: true,
        },
        {
          to: "/mentor/interns",
          icon: IoPeopleOutline,
          label: "Assigned Interns",
        },
        {
          to: "/mentor/tasks",
          icon: IoFileTrayFullOutline,
          label: "Review Tasks",
        },
        {
          to: "/mentor/documents",
          icon: IoDocumentTextOutline,
          label: "Upload Documents",
        },
        { to: "/mentor/meetings", icon: IoVideocamOutline, label: "Meetings" },
        { to: "/mentor/chat", icon: IoChatbubblesOutline, label: "Chats" },
        {
          to: "/mentor/post-update",
          icon: IoCreateOutline,
          label: "Post Update",
        },
      ];
    }

    if (role === "admin") {
      return [
        { to: "/admin/dashboard", icon: IoGridOutline, label: "Dashboard" },
        {
          to: "/notifications",
          icon: IoNotificationsOutline,
          label: "Notifications",
          showCount: true,
        },
        {
          to: "/admin/all-internships",
          icon: IoFileTrayFullOutline,
          label: "All Internships",
        },
        {
          to: "/admin/manage-users",
          icon: IoPeopleOutline,
          label: "Manage Users",
        },
        {
          to: "/admin/manage-applications",
          icon: IoDocumentTextOutline,
          label: "Applications",
        },
        {
          to: "/admin/post-internship",
          icon: IoBriefcaseOutline,
          label: "Post Internship",
        },
        {
          to: "/admin/interview-scheduler",
          icon: IoVideocamOutline,
          label: "Interviews",
        },
        { to: "/admin/reports", icon: IoAnalyticsOutline, label: "Reports" },
        {
          to: "/admin/post-update",
          icon: IoCreateOutline,
          label: "Post Update",
        },
      ];
    }

    return commonItems;
  };

  // Fetch notifications periodically
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const baseLinkClass = `flex items-center px-4 py-3 text-indigo-100 rounded-lg hover:bg-indigo-700 hover:text-white transition-all duration-200 ${
    collapsed ? "justify-center" : ""
  }`;
  const activeLinkClass =
    "bg-indigo-950 bg-opacity-50 text-white font-semibold";

  const getSettingsLink = () => {
    const role = user?.role?.toLowerCase();
    if (role === "intern") return "/intern/settings";
    if (role === "mentor") return "/mentor/settings";
    if (role === "admin") return "/admin/settings";
    return "/settings";
  };

  return (
    <>
      {/* Sidebar container */}
      <div
        className={`hidden lg:flex flex-col bg-indigo-900 text-white w-${collapsed ? "20" : "64"} transition-all duration-300`}
      >
        {/* Profile section */}
        <div className="flex items-center p-4 border-b border-indigo-800">
          <ProfileAvatar name={user?.name} />
          {!collapsed && (
            <div className="ml-3">
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm opacity-75">{user?.role}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {getNavItems().map(({ to, icon: Icon, label, showCount }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
              }
            >
              <Icon className="text-xl" />
              {!collapsed && <span className="ml-3 flex-1">{label}</span>}
              {showCount && unreadNotificationCount > 0 && (
                <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer icons */}
        <div className="p-2 border-t border-indigo-800">
          <NavLink to={getSettingsLink()} className={baseLinkClass}>
            <IoSettingsOutline className="text-xl" />
            {!collapsed && <span className="ml-3">Settings</span>}
          </NavLink>
          <button onClick={handleLogout} className={baseLinkClass}>
            <IoLogOutOutline className="text-xl" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={`${baseLinkClass} mt-2`}
          >
            {collapsed ? (
              <IoChevronForwardOutline className="text-xl" />
            ) : (
              <IoChevronBackOutline className="text-xl" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
