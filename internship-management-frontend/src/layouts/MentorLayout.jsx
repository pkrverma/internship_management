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
    if (user && user.role === "Mentor") {
      // Initialize real-time notifications for mentor
      initializeRealTimeNotifications(
        (notification) => {
          console.log("New mentor notification:", notification);
          setNotifications((prev) => [notification, ...prev]);
        },
        (error) => {
          console.error("Notification connection error:", error);
        }
      );
    }

    return () => {
      closeRealTimeNotifications();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== "Mentor") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500">You don't have mentor access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        role="Mentor"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Top Navigation */}
        <Navbar
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={true}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorLayout;
