import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layouts
import MainLayout from "../layouts/MainLayout";
import InternLayout from "../layouts/InternLayout";
import MentorLayout from "../layouts/MentorLayout";

// General Pages
import HomePage from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFound";
import InternshipsPage from "../pages/InternshipsPage";

// Admin Pages
import AdminLoginPage from "../pages/Admin/AdminLoginPage";
import AdminDashboard from "../pages/Admin/Dashboard";

// Intern Pages (using 'as' to avoid naming conflicts)
import InternDashboard from "../pages/Intern/Dashboard";
import ApplyForm from "../pages/Intern/ApplyForm";
import MyApplications from "../pages/Intern/MyApplications";
import MyTasks from "../pages/Intern/MyTasks";
import Documents from "../pages/Intern/Documents";
import InternChat from "../pages/Intern/Chat";
import InternSettings from "../pages/Intern/Settings";
import InternMeetings from "../pages/Intern/Meetings";

// Mentor Pages -- IMPORT THE NEW PAGES
import MentorDashboard from "../pages/Mentor/Dashboard";
import AssignedInterns from "../pages/Mentor/AssignedInterns";
import ReviewTasks from "../pages/Mentor/ReviewTasks";
import MentorMeetings from "../pages/Mentor/MentorMeetings";
import MentorChat from "../pages/Mentor/MentorChat";
import MentorSettings from "../pages/Mentor/MentorSettings";

// Components
import ProtectedRoute from "./ProtectedRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Main public-facing layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/internships" element={<InternshipsPage />} />
      </Route>

      {/* --- PROTECTED ROUTE GROUPS --- */}

      {/* Intern Route Group */}
      <Route
        path="/intern"
        element={
          <ProtectedRoute roles={["Intern"]}>
            <InternLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InternDashboard />} />
        <Route path="apply" element={<ApplyForm/>}/>
        <Route path="applications" element={<MyApplications />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chat" element={<InternChat />} />
        <Route path="meetings" element={<InternMeetings />} />
        <Route path="settings" element={<InternSettings />} />
      </Route>

      {/* Mentor Route Group - CORRECTED */}
      <Route
        path="/mentor"
        element={
          <ProtectedRoute roles={["Mentor"]}>
            <MentorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MentorDashboard />} />
        <Route path="interns" element={<AssignedInterns />} />
        <Route path="tasks" element={<ReviewTasks />} />
        <Route path="meetings" element={<MentorMeetings />} />{" "}
        <Route path="chat" element={<MentorChat />} />
        <Route path="settings" element={<MentorSettings />} />
      </Route>

      {/* Admin Route Group */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Not Found Route - must be last */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
