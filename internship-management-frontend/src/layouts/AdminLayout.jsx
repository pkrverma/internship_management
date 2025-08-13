// src/layouts/AdminLayout.jsx
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

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);

  const loadNotifications = async () => {
    if (!user || user.role?.toLowerCase() !== "admin") {
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
    } catch (error) {
      console.error("Failed to fetch notifications in AdminLayout:", error);
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // simple polling every 60s — replace with real-time later if needed
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <Spinner fullScreen text="Loading admin..." />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="admin"
      />

      {/* Main area */}
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

export default AdminLayout;
