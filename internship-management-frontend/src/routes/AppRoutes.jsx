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

// Mentor Pages (placeholder - uncomment when created)
// import MentorDashboard from "../pages/Mentor/Dashboard";

// Loading fallback component
import { FullPageSpinner } from "../components/ui/Spinner";

// Lazy loading for better performance (uncomment as you create pages)
// const ManageUsers = React.lazy(() => import("../pages/Admin/ManageUsers"));
// const ManageApplications = React.lazy(() => import("../pages/Admin/ManageApplications"));
// const PostInternship = React.lazy(() => import("../pages/Admin/PostInternship"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageSpinner text="Loading..." />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />

          {/* Public Routes */}
          <Route path="internships" element={<InternshipsPage />} />

          {/* About/Info Routes (placeholders) */}
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

          {/* Legal Pages (placeholders) */}
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

          {/* Guest-only routes (redirect if authenticated) */}
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

        {/* Admin Login (separate from main layout) */}
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

          {/* Admin Management Routes (uncomment as you create them) */}
          {/* 
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-applications" element={<ManageApplications />} />
          <Route path="post-internship" element={<PostInternship />} />
          <Route path="all-internships" element={<AllInternships />} />
          <Route path="interview-scheduler" element={<InterviewScheduler />} />
          <Route path="reports" element={<Reports />} />
          <Route path="post-update" element={<PostUpdate />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
          */}

          {/* Placeholder routes for admin pages */}
          <Route
            path="manage-users"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
                <p className="text-gray-600">
                  User management functionality will be available soon.
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Coming Soon:</strong> User creation, editing, role
                    management, and account status controls.
                  </p>
                </div>
              </div>
            }
          />

          <Route
            path="manage-applications"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Manage Applications</h1>
                <p className="text-gray-600">
                  Application management functionality will be available soon.
                </p>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700 text-sm">
                    <strong>Coming Soon:</strong> Review applications,
                    approve/reject candidates, and track application status.
                  </p>
                </div>
              </div>
            }
          />

          <Route
            path="post-internship"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Post New Internship</h1>
                <p className="text-gray-600">
                  Create internship functionality will be available soon.
                </p>
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-purple-700 text-sm">
                    <strong>Coming Soon:</strong> Create and publish new
                    internship opportunities with rich descriptions.
                  </p>
                </div>
              </div>
            }
          />

          <Route
            path="all-internships"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">All Internships</h1>
                <p className="text-gray-600">
                  Internship management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="interview-scheduler"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Interview Scheduler</h1>
                <p className="text-gray-600">
                  Interview scheduling functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="reports"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
                <p className="text-gray-600">
                  Reporting functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="notifications"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600">
                  Notification management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="settings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
                <p className="text-gray-600">
                  Settings panel will be available soon.
                </p>
              </div>
            }
          />
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

          {/* Placeholder mentor dashboard */}
          <Route
            path="dashboard"
            element={
              <div className="p-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">
                  Welcome, Mentor!
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-3">
                      Assigned Interns
                    </h2>
                    <p className="text-gray-600">
                      Manage and monitor your assigned interns' progress.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-blue-700 text-sm">
                        Dashboard functionality coming soon!
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-3">Review Tasks</h2>
                    <p className="text-gray-600">
                      Review and provide feedback on intern submissions.
                    </p>
                    <div className="mt-4 p-3 bg-green-50 rounded">
                      <p className="text-green-700 text-sm">
                        Task management coming soon!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          {/* Placeholder mentor routes */}
          <Route
            path="interns"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Assigned Interns</h1>
                <p className="text-gray-600">
                  Intern management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="tasks"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Review Tasks</h1>
                <p className="text-gray-600">
                  Task review functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="documents"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Upload Documents</h1>
                <p className="text-gray-600">
                  Document management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="meetings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Meetings</h1>
                <p className="text-gray-600">
                  Meeting management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="chat"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Chats</h1>
                <p className="text-gray-600">
                  Chat functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="post-update"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Post Update</h1>
                <p className="text-gray-600">
                  Update posting functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="notifications"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600">
                  Notification management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="settings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <p className="text-gray-600">
                  Settings panel will be available soon.
                </p>
              </div>
            }
          />
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
          <Route path="dashboard" element={<InternDashboard />} />

          {/* Placeholder intern routes */}
          <Route
            path="applications"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">My Applications</h1>
                <p className="text-gray-600">
                  Application tracking functionality will be available soon.
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Coming Soon:</strong> Track application status, view
                    feedback, and manage your internship applications.
                  </p>
                </div>
              </div>
            }
          />

          <Route
            path="tasks"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">My Tasks</h1>
                <p className="text-gray-600">
                  Task management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="documents"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Documents</h1>
                <p className="text-gray-600">
                  Document management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="chat"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Chat with Mentor</h1>
                <p className="text-gray-600">
                  Chat functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="meetings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Meetings</h1>
                <p className="text-gray-600">
                  Meeting management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="notifications"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600">
                  Notification management functionality will be available soon.
                </p>
              </div>
            }
          />

          <Route
            path="settings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <p className="text-gray-600">
                  Settings panel will be available soon.
                </p>
              </div>
            }
          />

          {/* Application route */}
          <Route
            path="apply/:internshipId"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">
                  Apply for Internship
                </h1>
                <p className="text-gray-600">
                  Application form functionality will be available soon.
                </p>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700 text-sm">
                    <strong>Coming Soon:</strong> Complete internship
                    application form with file uploads and cover letter.
                  </p>
                </div>
              </div>
            }
          />
        </Route>

        {/* Shared Authenticated Routes */}
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

        {/* Help and Support Routes */}
        <Route path="/help" element={<MainLayout />}>
          <Route
            index
            element={
              <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-4">Help Center</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-3">
                      Getting Started
                    </h2>
                    <p className="text-gray-600">
                      Learn how to use our platform effectively.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-3">FAQs</h2>
                    <p className="text-gray-600">
                      Find answers to commonly asked questions.
                    </p>
                  </div>
                </div>
              </div>
            }
          />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
