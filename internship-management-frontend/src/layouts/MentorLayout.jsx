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

const MentorLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && user.role?.toLowerCase() === "mentor") {
      const stop = initializeRealTimeNotifications(
        (notification) => {
          console.log("New mentor notification:", notification);
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
    return <LoadingSpinner text="Loading mentor dashboard..." />;
  }

  if (!user || user.role?.toLowerCase() !== "mentor") {
    return (
      <div className="p-6 text-red-600">You don't have mentor access.</div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role="mentor"
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

export default MentorLayout;
