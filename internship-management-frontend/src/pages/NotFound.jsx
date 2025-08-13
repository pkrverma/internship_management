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
  const [redirectNow, setRedirectNow] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRedirectNow(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect]);

  // Safe navigation after countdown
  useEffect(() => {
    if (!redirectNow) return;

    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      const dashboardPath =
        role === "admin"
          ? "/admin/dashboard"
          : role === "mentor"
            ? "/mentor/dashboard"
            : role === "intern"
              ? "/intern/dashboard"
              : "/";
      navigate(dashboardPath, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [redirectNow, isAuthenticated, user, navigate]);

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
    const links = [
      { to: "/", label: "Home", icon: IoHomeOutline },
      {
        to: "/internships",
        label: "Browse Internships",
        icon: IoSearchOutline,
      },
    ];

    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      const dashboardPath =
        role === "admin"
          ? "/admin/dashboard"
          : role === "mentor"
            ? "/mentor/dashboard"
            : role === "intern"
              ? "/intern/dashboard"
              : "/";
      links.unshift({
        to: dashboardPath,
        label: `${user.role} Dashboard`,
        icon: IoHomeOutline,
      });

      if (role === "intern") {
        links.push({
          to: "/intern/applications",
          label: "My Applications",
          icon: IoSearchOutline,
        });
      }
    } else {
      links.push(
        { to: "/login", label: "Sign In", icon: IoArrowBackOutline },
        { to: "/register", label: "Register", icon: IoSearchOutline }
      );
    }

    return links;
  };

  const handleReportError = () => {
    const subject = `404 Error Report - ${window.location.href}`;
    const body = `I encountered a 404 error on the following page:\n\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}\n\nAdditional details:\n`;
    window.open(
      `mailto:support@aninex.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 */}
        <div className="relative mb-8">
          <div className="text-9xl font-black text-gray-200 select-none animate-pulse">
            404
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          It seems like you've ventured into uncharted territory. The page
          you're looking for doesn't exist.
        </p>

        {/* Details */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow">
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

        {/* Auto redirect notice */}
        {autoRedirect && countdown > 0 && (
          <div className="bg-blue-50 p-4 rounded mb-4">
            <IoRefreshOutline className="inline-block mr-2 animate-spin" />
            Redirecting in {countdown} seconds...
            <button
              onClick={cancelAutoRedirect}
              className="ml-2 text-xs text-blue-600 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded shadow hover:from-blue-700 hover:to-purple-700"
          >
            <IoArrowBackOutline className="inline-block mr-2" />
            Go Back
          </button>

          <Link
            to="/"
            className="px-4 py-2 bg-white border border-blue-200 rounded text-blue-600 hover:bg-blue-50"
          >
            <IoHomeOutline className="inline-block mr-2" />
            Go Home
          </Link>
        </div>

        {/* Recommended links */}
        <div className="bg-white rounded-xl p-4 shadow mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Popular Destinations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getRecommendedLinks().map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <link.icon className="mr-2" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Help section */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          <button
            onClick={handleReportError}
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <IoBugOutline /> Report this error
          </button>
          <Link
            to="/contact"
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <IoHelpCircleOutline /> Get help
          </Link>
          <a
            href="mailto:support@aninex.com"
            className="flex items-center gap-1 hover:text-blue-600"
          >
            <IoMailOutline /> Contact support
          </a>
        </div>

        <div className="text-xs text-gray-500 italic mt-6">
          "Not all who wander are lost... but this page definitely is!"
        </div>
      </div>
    </div>
  );
};

export default NotFound;
