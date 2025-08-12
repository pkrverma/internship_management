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
    // Determine the reason for unauthorized access
    const path = location.pathname;
    const state = location.state;

    if (state?.reason) {
      setReason(state.reason);
    } else if (path.startsWith("/admin") && user?.role !== "Admin") {
      setReason("admin_only");
    } else if (path.startsWith("/mentor") && user?.role !== "Mentor") {
      setReason("mentor_only");
    } else if (path.startsWith("/intern") && user?.role !== "Intern") {
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
            {
              label: "Go Home",
              to: "/",
              primary: true,
              icon: IoHomeOutline,
            },
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
      className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon and Visual */}
        <div className="relative mb-8">
          <div
            className={`mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 ${config.borderColor} animate-pulse`}
          >
            <IconComponent className={`w-16 h-16 ${config.iconColor}`} />
          </div>

          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-400 rounded-full animate-bounce delay-300 opacity-70"></div>
          <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-yellow-400 rounded-full animate-bounce delay-500 opacity-70"></div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              {config.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Current User Info */}
          {isAuthenticated && user && (
            <div
              className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 border ${config.borderColor} shadow-lg mx-auto max-w-md`}
            >
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current User:</span> {user.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Account Type:</span>{" "}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === "Admin"
                        ? "bg-red-100 text-red-800"
                        : user.role === "Mentor"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "Intern"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Attempted Access:</span>{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {location.pathname}
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {config.actions.map((action, index) => {
              const ActionContent = (
                <>
                  {action.icon && <action.icon className="mr-2 w-5 h-5" />}
                  {action.label}
                </>
              );

              const baseClasses =
                "group inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl";

              const buttonClasses = action.primary
                ? `${baseClasses} text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`
                : `${baseClasses} text-blue-600 bg-white border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50`;

              return action.onClick ? (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={buttonClasses}
                >
                  {ActionContent}
                </button>
              ) : (
                <Link
                  key={index}
                  to={action.to}
                  state={action.state}
                  className={buttonClasses}
                >
                  {ActionContent}
                </Link>
              );
            })}
          </div>

          {/* Additional Help */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/help"
                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 group"
              >
                <IoHelpCircleOutline className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                Help Center
              </Link>

              <Link
                to="/contact"
                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 group"
              >
                <IoMailOutline className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                Contact Us
              </Link>

              <a
                href="mailto:support@aninex.com"
                className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 group"
              >
                <IoMailOutline className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                Email Support
              </a>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <IoShieldOutline className="w-4 h-4" />
              <span className="font-medium">Security Notice</span>
            </div>
            <p>
              Access attempts are logged for security purposes. If you believe
              this is an error, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
