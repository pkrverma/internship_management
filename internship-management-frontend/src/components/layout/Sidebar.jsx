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

const Sidebar = ({ role, isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch real notification count from backend
  const fetchNotificationCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getNotificationCount();
      setUnreadNotificationCount(count.unread || 0);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      setUnreadNotificationCount(0);
    }
  }, [user]);

  // Set navigation items based on role
  useEffect(() => {
    if (!user) return;

    const internNavItems = [
      { to: "/intern/dashboard", icon: IoGridOutline, label: "Dashboard" },
      {
        to: "/intern/notifications",
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

    const mentorNavItems = [
      { to: "/mentor/dashboard", icon: IoGridOutline, label: "Dashboard" },
      {
        to: "/mentor/notifications",
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

    const adminNavItems = [
      { to: "/admin/dashboard", icon: IoGridOutline, label: "Dashboard" },
      {
        to: "/admin/notifications",
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
      { to: "/admin/post-update", icon: IoCreateOutline, label: "Post Update" },
    ];

    if (user.role === "Intern") {
      setNavItems(internNavItems);
    } else if (user.role === "Mentor") {
      setNavItems(mentorNavItems);
    } else if (user.role === "Admin") {
      setNavItems(adminNavItems);
    }
  }, [user]);

  // Update notification count periodically
  useEffect(() => {
    fetchNotificationCount(); // Initial fetch
    const interval = setInterval(fetchNotificationCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const baseLinkClass = `flex items-center px-4 py-3 text-indigo-100 rounded-lg hover:bg-indigo-700 hover:text-white transition-colors duration-200 ${
    collapsed ? "justify-center" : ""
  }`;

  const activeLinkClass =
    "bg-indigo-950 bg-opacity-50 text-white font-semibold";

  const getSettingsLink = () => {
    switch (user?.role) {
      case "Intern":
        return "/intern/settings";
      case "Mentor":
        return "/mentor/settings";
      case "Admin":
        return "/admin/settings";
      default:
        return "/settings";
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col ${
          collapsed ? "w-16" : "w-64"
        } min-h-screen bg-indigo-800 text-white transition-all duration-300 fixed left-0 z-30`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <div className="flex flex-col items-center w-full">
              <ProfileAvatar user={user} size="lg" />
              <p className="mt-3 text-lg font-semibold truncate">
                {user?.name}
              </p>
              <p className="text-sm text-indigo-300">{user?.role}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-indigo-700 transition-colors ml-auto"
          >
            {collapsed ? (
              <IoChevronForwardOutline className="h-5 w-5" />
            ) : (
              <IoChevronBackOutline className="h-5 w-5" />
            )}
          </button>
        </div>

        {collapsed && (
          <div className="flex justify-center pb-4">
            <ProfileAvatar user={user} size="sm" />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith("/dashboard")}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="ml-3">{item.label}</span>
                  {item.showCount && unreadNotificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadNotificationCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.showCount && unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadNotificationCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-indigo-700 space-y-2">
          <NavLink
            to={getSettingsLink()}
            className={({ isActive }) =>
              `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
            }
            title={collapsed ? "Settings" : undefined}
          >
            <IoSettingsOutline className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Settings</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className={`${baseLinkClass} w-full`}
            title={collapsed ? "Logout" : undefined}
          >
            <IoLogOutOutline className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onToggle}
        />

        {/* Sidebar */}
        <div className="relative flex flex-col w-64 h-full bg-indigo-800 text-white">
          {/* Header */}
          <div className="flex flex-col items-center p-4 border-b border-indigo-700">
            <button
              onClick={onToggle}
              className="self-end p-2 hover:bg-indigo-700 rounded-md mb-2"
            >
              <IoChevronBackOutline className="h-5 w-5" />
            </button>
            <ProfileAvatar user={user} size="lg" />
            <p className="mt-3 text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-indigo-300">{user?.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.endsWith("/dashboard")}
                className={({ isActive }) =>
                  `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
                }
                onClick={onToggle}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
                {item.showCount && unreadNotificationCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadNotificationCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="px-4 py-4 border-t border-indigo-700 space-y-2">
            <NavLink
              to={getSettingsLink()}
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
              }
              onClick={onToggle}
            >
              <IoSettingsOutline className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </NavLink>
            <button
              onClick={() => {
                handleLogout();
                onToggle();
              }}
              className={`${baseLinkClass} w-full`}
            >
              <IoLogOutOutline className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
