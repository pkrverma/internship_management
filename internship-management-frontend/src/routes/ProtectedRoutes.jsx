import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "../components/ui/Spinner";

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
        if (isAuthenticated && user && refreshUser) {
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

  if (loading || isVerifyingAccess) {
    return <FullPageSpinner text="Verifying access..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireAuth && user) {
    if (!allowSuspended && user.role?.toLowerCase() === "suspend") {
      return <Navigate to="/unauthorized" replace />;
    }
    if (
      roles.length > 0 &&
      !roles.map((r) => r.toLowerCase()).includes(user.role?.toLowerCase())
    ) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
export const AdminRoute = (props) => (
  <ProtectedRoute roles={["admin"]} {...props} />
);
export const MentorRoute = (props) => (
  <ProtectedRoute roles={["mentor"]} {...props} />
);
export const InternRoute = (props) => (
  <ProtectedRoute roles={["intern"]} {...props} />
);
export const GuestRoute = ({ children, redirectTo = "/" }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to={redirectTo} replace />;
};
export const AuthenticatedRoute = (props) => <ProtectedRoute {...props} />;
