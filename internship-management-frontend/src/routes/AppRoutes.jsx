import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import {
  AdminRoute,
  MentorRoute,
  InternRoute,
  GuestRoute,
  AuthenticatedRoute,
} from "./ProtectedRoutes";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import MentorLayout from "../layouts/MentorLayout";
import InternLayout from "../layouts/InternLayout";

import HomePage from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import InternshipsPage from "../pages/InternshipsPage";
import NotFound from "../pages/NotFound";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import AdminLoginPage from "../pages/Admin/AdminLoginPage";
import AdminDashboard from "../pages/Admin/Dashboard";

import MentorDashboard from "../pages/Mentor/Dashboard";
import AssignedInterns from "../pages/Mentor/AssignedInterns";
import MentorChat from "../pages/Mentor/MentorChat";
import MentorDocuments from "../pages/Mentor/MentorDocuments";
import MentorMeetings from "../pages/Mentor/MentorMeetings";
import MentorSettings from "../pages/Mentor/MentorSettings";
import ReviewTasks from "../pages/Mentor/ReviewTasks";
import TrackProgress from "../pages/Mentor/TrackProgress";

import InternDashboard from "../pages/Intern/Dashboard";
import ApplyForm from "../pages/Intern/ApplyForm";
import Chat from "../pages/Intern/Chat";
import Documents from "../pages/Intern/Documents";
import InternshipApplication from "../pages/Intern/InternshipApplication";
import Meetings from "../pages/Intern/Meetings";
import MyApplications from "../pages/Intern/MyApplications";
import MyTasks from "../pages/Intern/MyTasks";
import Settings from "../pages/Intern/Settings";

import NotificationsPage from "../pages/common/Notifications";

import { FullPageSpinner } from "../components/ui/Spinner";

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Admin Section */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* Add other admin routes here */}
          </Route>
        </Route>

        {/* Mentor Section */}
        <Route element={<MentorRoute />}>
          <Route element={<MentorLayout />}>
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route
              path="/mentor/assigned-interns"
              element={<AssignedInterns />}
            />
            <Route path="/mentor/chat" element={<MentorChat />} />
            <Route path="/mentor/documents" element={<MentorDocuments />} />
            <Route path="/mentor/meetings" element={<MentorMeetings />} />
            <Route path="/mentor/settings" element={<MentorSettings />} />
            <Route path="/mentor/review-tasks" element={<ReviewTasks />} />
            <Route path="/mentor/track-progress" element={<TrackProgress />} />
          </Route>
        </Route>

        {/* Intern Section */}
        <Route element={<InternRoute />}>
          <Route element={<InternLayout />}>
            <Route path="/intern/dashboard" element={<InternDashboard />} />
            <Route path="/intern/apply/:internshipId" element={<ApplyForm />} />
            <Route path="/intern/chat" element={<Chat />} />
            <Route path="/intern/documents" element={<Documents />} />
            <Route
              path="/intern/internship-application/:id"
              element={<InternshipApplication />}
            />
            <Route path="/intern/meetings" element={<Meetings />} />
            <Route
              path="/intern/my-applications"
              element={<MyApplications />}
            />
            <Route path="/intern/my-tasks" element={<MyTasks />} />
            <Route path="/intern/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
