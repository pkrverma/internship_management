// src/layouts/MentorLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Spinner from "../components/ui/Spinner";

import {
  getNotifications,
  getNotificationCount,
} from "../services/notificationService";

const MentorLayout = () => {
  const { user, loading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);

  const loadNotifications = async () => {
    if (!user || user.role?.toLowerCase() !== "mentor") {
      setNotifications([]);
      setUnreadCount(0);
      setLoadingNotif(false);
      return;
    }
    try {
      setLoadingNotif(true);
      const [list, countObj] = await Promise.all([
        getNotifications({ limit: 10, sort: "desc" }),
        getNotificationCount(),
      ]);
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(countObj?.unread ?? 0);
    } catch (e) {
      console.error("Failed to load notifications in MentorLayout:", e);
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <Spinner fullScreen text="Loading mentor..." />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="mentor"
      />
      <div className="flex-1 flex flex-col">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loadingNotif}
        />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MentorLayout;
