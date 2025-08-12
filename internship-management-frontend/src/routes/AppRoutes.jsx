import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "../components/layout/ScrollToTop";

// Layouts
import MainLayout from "../layouts/MainLayout";
import InternLayout from "../layouts/InternLayout";
import MentorLayout from "../layouts/MentorLayout";
import AdminLayout from "../layouts/AdminLayout";

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
import ManageApplications from "../pages/Admin/ManageApplications";
import PostInternship from "../pages/Admin/PostInternship";
import InterviewScheduler from "../pages/Admin/InterviewScheduler";
import Reports from "../pages/Admin/Reports";
import AdminSettings from "../pages/Admin/AdminSettings";
import AllInternships from "../pages/Admin/AllInternships";
import ManageUsers from "../pages/Admin/ManageUsers";
import PostUpdate from "../pages/Admin/PostUpdate";

// Intern Pages
import InternDashboard from "../pages/Intern/Dashboard";
import ApplyForm from "../pages/Intern/ApplyForm";
import MyApplications from "../pages/Intern/MyApplications";
import MyTasks from "../pages/Intern/MyTasks";
import Documents from "../pages/Intern/Documents";
import Chat from "../pages/Intern/Chat";
import Settings from "../pages/Intern/Settings";
import Meetings from "../pages/Intern/Meetings";

// Mentor Pages
import MentorDashboard from "../pages/Mentor/Dashboard";
import AssignedInterns from "../pages/Mentor/AssignedInterns";
import ReviewTasks from "../pages/Mentor/ReviewTasks";
import MentorMeetings from "../pages/Mentor/MentorMeetings";
import MentorChat from "../pages/Mentor/MentorChat";
import MentorSettings from "../pages/Mentor/MentorSettings";
import MentorDocuments from "../pages/Mentor/MentorDocuments";

// Common Pages
import Notifications from "../pages/common/Notifications";

// Components
import ProtectedRoute from "./ProtectedRoutes";

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Main Public Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/internships" element={<InternshipsPage />} />
        </Route>

        {/* Intern Routes */}
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
          <Route path="apply/:internshipId" element={<ApplyForm />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="tasks" element={<MyTasks />} />
          <Route path="documents" element={<Documents />} />
          <Route path="chat" element={<Chat />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Mentor Routes */}
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
          <Route path="documents" element={<MentorDocuments />} />
          <Route path="meetings" element={<MentorMeetings />} />
          <Route path="chat" element={<MentorChat />} />
          <Route path="settings" element={<MentorSettings />} />
          <Route path="post-update" element={<PostUpdate />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="all-internships" element={<AllInternships />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-applications" element={<ManageApplications />} />
          <Route path="post-internship" element={<PostInternship />} />
          <Route path="interview-scheduler" element={<InterviewScheduler />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="post-update" element={<PostUpdate />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
