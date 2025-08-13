import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner"; // use default export

const ProtectedRoute = ({
  children,
  roles = [],
  requireAuth = true,
  fallbackPath = "/login",
  allowSuspended = false,
}) => {
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      if (loading || !requireAuth) return;
      setIsVerifyingAccess(true);
      try {
        if (isAuthenticated && user && typeof refreshUser === "function") {
          await refreshUser();
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
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

  // Still loading or checking access
  if (loading || isVerifyingAccess) {
    return <Spinner fullScreen text="Checking access..." />;
  }

  // Not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  if (requireAuth && user) {
    // Block suspended accounts unless explicitly allowed
    if (!allowSuspended && user.status?.toLowerCase() === "suspended") {
      return (
        <Navigate
          to="/unauthorized"
          replace
          state={{ reason: "suspended_account" }}
        />
      );
    }

    // Enforce allowed roles if given
    if (
      roles.length > 0 &&
      !roles.map((r) => r.toLowerCase()).includes(user.role?.toLowerCase())
    ) {
      return (
        <Navigate
          to="/unauthorized"
          replace
          state={{ reason: "insufficient_permissions" }}
        />
      );
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;

// Role-based wrappers
export const AdminRoute = (props) => (
  <ProtectedRoute roles={["Admin"]} {...props} />
);
export const MentorRoute = (props) => (
  <ProtectedRoute roles={["Mentor"]} {...props} />
);
export const InternRoute = (props) => (
  <ProtectedRoute roles={["Intern"]} {...props} />
);

// Guest-only
export const GuestRoute = ({ children, redirectTo = "/" }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to={redirectTo} replace />;
};

// Authenticated-only
export const AuthenticatedRoute = (props) => (
  <ProtectedRoute requireAuth {...props} />
);
