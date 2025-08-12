import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner, { FullPageSpinner } from "../components/ui/Spinner";

const ProtectedRoute = ({
  children,
  roles = [],
  requireAuth = true,
  fallbackPath = null,
  redirectOnSuccess = null,
  requireVerification = false,
  requireProfileCompletion = false,
  allowSuspended = false,
  checkPermissions = null,
  onAccessDenied = null,
  loadingComponent = null,
}) => {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [accessError, setAccessError] = useState(null);

  // Verify user session and refresh if needed
  useEffect(() => {
    const verifyAccess = async () => {
      if (loading || !requireAuth) return;

      setIsVerifyingAccess(true);
      setAccessError(null);

      try {
        // Refresh user data to ensure it's current
        if (isAuthenticated && user && refreshUser) {
          await refreshUser();
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        setAccessError("session_expired");
      } finally {
        setIsVerifyingAccess(false);
      }
    };

    verifyAccess();
  }, [
    location.pathname,
    isAuthenticated,
    user,
    loading,
    requireAuth,
    refreshUser,
  ]);

  // Show loading spinner
  if (loading || isVerifyingAccess) {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <FullPageSpinner text="Verifying access..." />
      </div>
    );
  }

  // Handle session expiration or authentication errors
  if (accessError === "session_expired") {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Your session has expired. Please log in again.",
          reason: "session_expired",
        }}
        replace
      />
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Please log in to access this page.",
          reason: "login_required",
        }}
        replace
      />
    );
  }

  // Check if user exists (additional safety check)
  if (requireAuth && !user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Authentication required. Please log in.",
          reason: "user_not_found",
        }}
        replace
      />
    );
  }

  // Check if user account is suspended
  if (user && user.status === "suspended" && !allowSuspended) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          reason: "account_suspended",
          message: "Your account has been suspended. Please contact support.",
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // Check if user account is inactive
  if (user && user.status === "inactive") {
    return (
      <Navigate
        to="/account/activate"
        state={{
          from: location,
          message: "Please activate your account to continue.",
        }}
        replace
      />
    );
  }

  // Check email verification requirement
  if (requireVerification && user && !user.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        state={{
          from: location,
          message: "Please verify your email address to continue.",
        }}
        replace
      />
    );
  }

  // Check profile completion requirement
  if (requireProfileCompletion && user && !user.profileCompleted) {
    return (
      <Navigate
        to="/complete-profile"
        state={{
          from: location,
          message: "Please complete your profile to access this page.",
        }}
        replace
      />
    );
  }

  // Role-based access control
  if (roles && roles.length > 0 && user) {
    const userRole = user.role;
    const hasRequiredRole = roles.includes(userRole);

    if (!hasRequiredRole) {
      // Determine specific unauthorized reason
      let reason = "insufficient_permissions";

      if (roles.includes("Admin") && roles.length === 1) {
        reason = "admin_only";
      } else if (roles.includes("Mentor") && roles.length === 1) {
        reason = "mentor_only";
      } else if (roles.includes("Intern") && roles.length === 1) {
        reason = "intern_only";
      }

      // Call custom access denied handler if provided
      if (onAccessDenied) {
        onAccessDenied(user, roles, location);
      }

      return (
        <Navigate
          to="/unauthorized"
          state={{
            reason,
            requiredRoles: roles,
            userRole,
            from: location.pathname,
            message: `This page requires ${roles.join(" or ")} access. Your account type: ${userRole}`,
          }}
          replace
        />
      );
    }
  }

  // Custom permission checks
  if (checkPermissions && user) {
    try {
      const hasPermission = checkPermissions(user, location);
      if (!hasPermission) {
        return (
          <Navigate
            to="/unauthorized"
            state={{
              reason: "custom_permissions",
              from: location.pathname,
              message:
                "You don't have the required permissions to access this page.",
            }}
            replace
          />
        );
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      return (
        <Navigate
          to="/unauthorized"
          state={{
            reason: "permission_check_failed",
            from: location.pathname,
            message: "Unable to verify permissions. Please try again.",
          }}
          replace
        />
      );
    }
  }

  // Handle redirect on successful authentication (useful for login pages)
  if (redirectOnSuccess && isAuthenticated && user) {
    const redirectPath =
      typeof redirectOnSuccess === "function"
        ? redirectOnSuccess(user)
        : redirectOnSuccess;

    return <Navigate to={redirectPath} replace />;
  }

  // Handle custom fallback path
  if (fallbackPath && !isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // All checks passed - render the protected content
  return children ? children : <Outlet />;
};

// Higher-order component for role-specific routes
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute
    roles={["Admin"]}
    requireVerification={true}
    requireProfileCompletion={true}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const MentorRoute = ({ children, ...props }) => (
  <ProtectedRoute
    roles={["Mentor"]}
    requireVerification={true}
    requireProfileCompletion={true}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const InternRoute = ({ children, ...props }) => (
  <ProtectedRoute roles={["Intern"]} requireVerification={true} {...props}>
    {children}
  </ProtectedRoute>
);

// Multi-role route components
export const MentorOrAdminRoute = ({ children, ...props }) => (
  <ProtectedRoute
    roles={["Mentor", "Admin"]}
    requireVerification={true}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const AuthenticatedRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} {...props}>
    {children}
  </ProtectedRoute>
);

// Guest-only route (redirects authenticated users)
export const GuestRoute = ({ children, redirectTo = null, ...props }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (user) {
    const defaultRedirect =
      user.role === "Admin"
        ? "/admin/dashboard"
        : user.role === "Mentor"
          ? "/mentor/dashboard"
          : user.role === "Intern"
            ? "/intern/dashboard"
            : "/";

    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return (
    <ProtectedRoute requireAuth={false} {...props}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
