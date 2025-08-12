// src/pages/NotFound.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IoHomeOutline,
  IoArrowBackOutline,
  IoSearchOutline,
  IoHelpCircleOutline,
  IoMailOutline,
  IoRefreshOutline,
  IoBugOutline,
} from "react-icons/io5";

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // Auto redirect countdown
  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleAutoRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect]);

  const handleAutoRedirect = () => {
    if (isAuthenticated && user) {
      const dashboardPath =
        user.role === "Admin"
          ? "/admin/dashboard"
          : user.role === "Mentor"
            ? "/mentor/dashboard"
            : user.role === "Intern"
              ? "/intern/dashboard"
              : "/";
      navigate(dashboardPath, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const cancelAutoRedirect = () => {
    setAutoRedirect(false);
    setCountdown(0);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const getRecommendedLinks = () => {
    const commonLinks = [
      { to: "/", label: "Home", icon: IoHomeOutline },
      {
        to: "/internships",
        label: "Browse Internships",
        icon: IoSearchOutline,
      },
    ];

    if (isAuthenticated && user) {
      const dashboardPath =
        user.role === "Admin"
          ? "/admin/dashboard"
          : user.role === "Mentor"
            ? "/mentor/dashboard"
            : user.role === "Intern"
              ? "/intern/dashboard"
              : "/";

      commonLinks.unshift({
        to: dashboardPath,
        label: `${user.role} Dashboard`,
        icon: IoHomeOutline,
      });

      if (user.role === "Intern") {
        commonLinks.push({
          to: "/intern/applications",
          label: "My Applications",
          icon: IoSearchOutline,
        });
      }
    } else {
      commonLinks.push(
        { to: "/login", label: "Sign In", icon: IoArrowBackOutline },
        { to: "/register", label: "Register", icon: IoSearchOutline }
      );
    }

    return commonLinks;
  };

  const handleReportError = () => {
    const subject = `404 Error Report - ${window.location.href}`;
    const body = `I encountered a 404 error on the following page:\n\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}\n\nAdditional details:\n`;

    window.open(
      `mailto:support@aninex.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-9xl sm:text-[12rem] font-black text-gray-200 select-none animate-pulse">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-bounce flex items-center justify-center shadow-2xl">
              <div className="text-4xl sm:text-6xl">🚀</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Oops! Page Not Found
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-lg mx-auto">
              It seems like you've ventured into uncharted territory. The page
              you're looking for doesn't exist.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Requested URL:</span>{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {location.pathname}
                </code>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Error Code:</span> 404 - Not Found
              </p>
            </div>
          </div>

          {/* Auto Redirect Notice */}
          {autoRedirect && countdown > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mx-auto max-w-md">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <IoRefreshOutline className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">
                  Redirecting in {countdown} seconds...
                </span>
              </div>
              <button
                onClick={cancelAutoRedirect}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Cancel auto-redirect
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGoBack}
              className="group inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <IoArrowBackOutline className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>

            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <IoHomeOutline className="mr-2" />
              Go Home
            </Link>
          </div>

          {/* Recommended Links */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popular Destinations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getRecommendedLinks().map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 group"
                >
                  <link.icon className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <IoSearchOutline className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Looking for something specific?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Try searching for internships or browse our available
              opportunities.
            </p>
            <Link
              to="/internships"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
            >
              <IoSearchOutline className="mr-2 w-4 h-4" />
              Browse Internships
            </Link>
          </div>

          {/* Help Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
            <button
              onClick={handleReportError}
              className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
            >
              <IoBugOutline className="w-4 h-4" />
              <span>Report this error</span>
            </button>

            <Link
              to="/contact"
              className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
            >
              <IoHelpCircleOutline className="w-4 h-4" />
              <span>Get help</span>
            </Link>

            <a
              href="mailto:support@aninex.com"
              className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
            >
              <IoMailOutline className="w-4 h-4" />
              <span>Contact support</span>
            </a>
          </div>

          {/* Fun Message */}
          <div className="text-xs text-gray-500 italic">
            "Not all who wander are lost... but this page definitely is! 🗺️"
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
