import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import LoadingSpinner from "../components/ui/Spinner";
import {
  initializeRealTimeNotifications,
  closeRealTimeNotifications,
} from "../services/notificationService";

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && user.role?.toLowerCase() === "admin") {
      const stop = initializeRealTimeNotifications(
        (notification) => {
          console.log("New admin notification:", notification);
          setNotifications((prev) => [notification, ...prev]);
        },
        (error) => {
          console.error("Notification connection error:", error);
        }
      );
      return () => stop && stop();
    }
    return () => closeRealTimeNotifications();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  if (!user || user.role?.toLowerCase() !== "admin") {
    return (
      <div className="p-6 text-red-600">You don't have admin privileges.</div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role="admin"
        open={sidebarOpen}
        onToggle={setSidebarOpen}
        notifications={notifications}
      />
      <div className="flex flex-col flex-1">
        <Navbar
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle
        />
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
