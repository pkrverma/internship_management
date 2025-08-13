import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute, {
  AdminRoute,
  MentorRoute,
  InternRoute,
  GuestRoute,
  AuthenticatedRoute,
} from "./ProtectedRoutes";

// Layouts
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import MentorLayout from "../layouts/MentorLayout";
import InternLayout from "../layouts/InternLayout";

// Public Pages
import HomePage from "../pages/Home";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import InternshipsPage from "../pages/InternshipsPage";
import NotFound from "../pages/NotFound";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Admin Pages
import AdminLoginPage from "../pages/Admin/AdminLoginPage";
import AdminDashboard from "../pages/Admin/Dashboard";

// Intern Pages
import InternDashboard from "../pages/Intern/Dashboard";

// Common Pages
import NotificationsPage from "../pages/common/Notifications"; // ✅ shared notifications

// Loading fallback component
import { FullPageSpinner } from "../components/ui/Spinner";

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageSpinner text="Loading..." />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />

          {/* Public Routes */}
          <Route path="internships" element={<InternshipsPage />} />

          {/* About/Info Routes */}
          <Route
            path="about"
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">About Aninex Global</h1>
                <p className="text-lg text-gray-600">
                  Learn more about our mission to connect talent with
                  opportunities.
                </p>
              </div>
            }
          />

          <Route
            path="contact"
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-lg text-gray-600">
                  Get in touch with our team at support@aninex.com
                </p>
              </div>
            }
          />

          <Route
            path="privacy"
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-lg text-gray-600">
                  Your privacy is important to us.
                </p>
              </div>
            }
          />

          <Route
            path="terms"
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-lg text-gray-600">
                  Terms and conditions for using our platform.
                </p>
              </div>
            }
          />

          {/* Guest-only routes */}
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

        {/* ✅ Shared Authenticated Notifications route */}
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

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={
            <GuestRoute redirectTo="/admin/dashboard">
              <AdminLoginPage />
            </GuestRoute>
          }
        />

        {/* Admin Routes */}
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
          {/* you can still mount /admin/notifications here if you want */}
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Mentor Routes */}
        <Route
          path="/mentor"
          element={
            <MentorRoute>
              <MentorLayout />
            </MentorRoute>
          }
        >
          <Route index element={<Navigate to="/mentor/dashboard" replace />} />
          {/* you can still mount /mentor/notifications here if you want */}
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Intern Routes */}
        <Route
          path="/intern"
          element={
            <InternRoute>
              <InternLayout />
            </InternRoute>
          }
        >
          <Route index element={<Navigate to="/intern/dashboard" replace />} />
          {/* you can still mount /intern/notifications here if you want */}
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Shared Profile */}
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <MainLayout />
            </AuthenticatedRoute>
          }
        >
          <Route
            index
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">User Profile</h1>
                <p className="text-lg text-gray-600">
                  Profile management functionality will be available soon.
                </p>
              </div>
            }
          />
        </Route>

        {/* Help */}
        <Route path="/help" element={<MainLayout />}>
          <Route
            index
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">Help Center</h1>
                <p className="text-lg text-gray-600">
                  Find answers to commonly asked questions.
                </p>
              </div>
            }
          />
        </Route>

        {/* Errors */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
