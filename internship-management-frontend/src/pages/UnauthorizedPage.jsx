import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IoShieldOutline,
  IoLockClosedOutline,
  IoHomeOutline,
  IoLogInOutline,
  IoPersonAddOutline,
  IoArrowBackOutline,
  IoWarningOutline,
  IoHelpCircleOutline,
  IoMailOutline,
  IoKeyOutline,
} from "react-icons/io5";

const UnauthorizedPage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reason, setReason] = useState("general");

  useEffect(() => {
    // Determine reason for unauthorized access
    const path = location.pathname.toLowerCase();
    const state = location.state;

    if (state?.reason) {
      setReason(state.reason);
    } else if (
      path.startsWith("/admin") &&
      user?.role?.toLowerCase() !== "admin"
    ) {
      setReason("admin_only");
    } else if (
      path.startsWith("/mentor") &&
      user?.role?.toLowerCase() !== "mentor"
    ) {
      setReason("mentor_only");
    } else if (
      path.startsWith("/intern") &&
      user?.role?.toLowerCase() !== "intern"
    ) {
      setReason("intern_only");
    } else if (!isAuthenticated) {
      setReason("login_required");
    } else {
      setReason("insufficient_permissions");
    }
  }, [location, user, isAuthenticated]);

  const handleLogoutAndRedirect = async () => {
    await logout();
    navigate("/login", {
      state: {
        message: "Please log in with the appropriate account type.",
        from: location.pathname,
      },
    });
  };

  const getReasonConfig = () => {
    switch (reason) {
      case "login_required":
        return {
          title: "Authentication Required",
          description:
            "You need to sign in to access this page. Please log in with your account.",
          icon: IoLogInOutline,
          iconColor: "text-blue-600",
          bgColor: "from-blue-50 to-indigo-50",
          borderColor: "border-blue-200",
          actions: [
            {
              label: "Sign In",
              to: "/login",
              primary: true,
              icon: IoLogInOutline,
              state: { from: location.pathname },
            },
            {
              label: "Create Account",
              to: "/register",
              primary: false,
              icon: IoPersonAddOutline,
              state: { from: location.pathname },
            },
          ],
        };
      case "admin_only":
        return {
          title: "Admin Access Required",
          description:
            "This area is restricted to administrators only. You need admin privileges to access this page.",
          icon: IoShieldOutline,
          iconColor: "text-red-600",
          bgColor: "from-red-50 to-pink-50",
          borderColor: "border-red-200",
          actions: [
            {
              label: "Admin Login",
              to: "/admin/login",
              primary: true,
              icon: IoKeyOutline,
            },
            {
              label: user ? "Switch Account" : "Sign In",
              onClick: user ? handleLogoutAndRedirect : null,
              to: user ? null : "/login",
              primary: false,
              icon: user ? IoArrowBackOutline : IoLogInOutline,
            },
          ],
        };
      case "mentor_only":
        return {
          title: "Mentor Access Required",
          description:
            "This section is exclusively for mentors. Please sign in with a mentor account.",
          icon: IoShieldOutline,
          iconColor: "text-orange-600",
          bgColor: "from-orange-50 to-yellow-50",
          borderColor: "border-orange-200",
          actions: [
            {
              label: "Mentor Login",
              to: "/login",
              primary: true,
              icon: IoLogInOutline,
              state: { from: location.pathname },
            },
            {
              label: user ? "Switch Account" : "Register as Mentor",
              onClick: user ? handleLogoutAndRedirect : null,
              to: user ? null : "/register",
              primary: false,
              icon: user ? IoArrowBackOutline : IoPersonAddOutline,
            },
          ],
        };
      case "intern_only":
        return {
          title: "Intern Access Required",
          description:
            "This area is designed for interns only. Please sign in with an intern account.",
          icon: IoShieldOutline,
          iconColor: "text-green-600",
          bgColor: "from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          actions: [
            {
              label: "Intern Login",
              to: "/login",
              primary: true,
              icon: IoLogInOutline,
              state: { from: location.pathname },
            },
            {
              label: user ? "Switch Account" : "Register as Intern",
              onClick: user ? handleLogoutAndRedirect : null,
              to: user ? null : "/register",
              primary: false,
              icon: user ? IoArrowBackOutline : IoPersonAddOutline,
            },
          ],
        };
      case "insufficient_permissions":
        return {
          title: "Insufficient Permissions",
          description:
            "Your current account doesn't have the required permissions to access this resource.",
          icon: IoLockClosedOutline,
          iconColor: "text-purple-600",
          bgColor: "from-purple-50 to-indigo-50",
          borderColor: "border-purple-200",
          actions: [
            {
              label: "Contact Support",
              to: "/contact",
              primary: true,
              icon: IoHelpCircleOutline,
            },
            {
              label: "Switch Account",
              onClick: handleLogoutAndRedirect,
              primary: false,
              icon: IoArrowBackOutline,
            },
          ],
        };
      default:
        return {
          title: "Access Denied",
          description:
            "You don't have permission to view this page. Please check your account permissions.",
          icon: IoWarningOutline,
          iconColor: "text-gray-600",
          bgColor: "from-gray-50 to-slate-50",
          borderColor: "border-gray-200",
          actions: [
            { label: "Go Home", to: "/", primary: true, icon: IoHomeOutline },
            {
              label: "Sign In",
              to: "/login",
              primary: false,
              icon: IoLogInOutline,
              state: { from: location.pathname },
            },
          ],
        };
    }
  };

  const config = getReasonConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center px-4`}
    >
      <div
        className={`max-w-lg w-full bg-white rounded-xl shadow-lg border ${config.borderColor} p-8`}
      >
        <div className="flex flex-col items-center text-center">
          <IconComponent className={`text-5xl mb-4 ${config.iconColor}`} />
          <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
          <p className="text-gray-600 mb-6">{config.description}</p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full">
            {config.actions.map((action, idx) => {
              const ActionIcon = action.icon;
              if (action.onClick) {
                return (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                      action.primary
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <ActionIcon />
                    {action.label}
                  </button>
                );
              }
              return (
                <Link
                  key={idx}
                  to={action.to}
                  state={action.state || null}
                  className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                    action.primary
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ActionIcon />
                  {action.label}
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="mt-6 text-sm text-gray-500">
              <div>
                <strong>Current User:</strong> {user.name}
              </div>
              <div>
                <strong>Account Type:</strong> {user.role}
              </div>
              <div>
                <strong>Attempted Access:</strong> {location.pathname}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
