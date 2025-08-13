import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import InternDashboard from "../pages/Intern/Dashboard";

import NotificationsPage from "../pages/common/Notifications"; // ✅ added

import { FullPageSpinner } from "../components/ui/Spinner";

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageSpinner text="Loading..." />}>
      <Routes>
        {/* Root public layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="internships" element={<InternshipsPage />} />
          <Route path="about" element={<div>About Content</div>} />
          <Route path="contact" element={<div>Contact Content</div>} />
          <Route path="privacy" element={<div>Privacy</div>} />
          <Route path="terms" element={<div>Terms</div>} />
          <Route
            path="login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Route>
        {/* ✅ Shared notifications route (common for all roles) */}
        <Route
          path="/notifications"
          element={
            <AuthenticatedRoute>
              <MainLayout />
            </AuthenticatedRoute>
          }
        >
          <Route index element={<NotificationsPage />} />
        </Route>
        {/* Admin routes */}
        <Route
          path="/admin/login"
          element={
            <GuestRoute redirectTo="/admin/dashboard">
              <AdminLoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        {/* Mentor routes */}
        <Route
          path="/mentor"
          element={
            <MentorRoute>
              <MentorLayout />
            </MentorRoute>
          }
        >
          <Route index element={<Navigate to="/mentor/dashboard" replace />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        {/* Intern routes */}
        <Route
          path="/intern"
          element={
            <InternRoute>
              <InternLayout />
            </InternRoute>
          }
        >
          <Route index element={<Navigate to="/intern/dashboard" replace />} />
          <Route path="dashboard" element={<InternDashboard />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        {/* Profile */}
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <MainLayout />
            </AuthenticatedRoute>
          }
        >
          <Route index element={<div>Profile page coming soon</div>} />
        </Route>
        {/* Error routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFound />} /> {/* ✅ fixed wildcard */}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
