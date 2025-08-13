import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNotificationCount } from "../../services/notificationService";
import AninexLogo from "../../assets/images/aninex-logo.jpeg";
import {
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const Navbar = ({ onSidebarToggle, showSidebarToggle = false }) => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notification count
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchCount = async () => {
        try {
          const count = await getNotificationCount();
          setNotificationCount(count.unread || count.count || 0);
        } catch (error) {
          console.error("Failed to fetch notification count:", error);
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const getDashboardLink = () => {
    const role = user?.role?.toLowerCase();
    if (!role) return "/login";
    if (role === "admin") return "/admin/dashboard";
    if (role === "intern") return "/intern/dashboard";
    if (role === "mentor") return "/mentor/dashboard";
    return "/";
  };

  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ")[0];
  };

  const isPublicRoute = () => {
    const publicPaths = [
      "/",
      "/login",
      "/register",
      "/internships",
      "/about",
      "/contact",
    ];
    return (
      publicPaths.includes(location.pathname) ||
      (!location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/intern") &&
        !location.pathname.startsWith("/mentor"))
    );
  };

  const renderLoadingState = () => (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-md" />
      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-md" />
    </div>
  );

  const renderPublicLinks = () => (
    <div className="flex items-center space-x-4">
      <NavLink
        to="/internships"
        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
      >
        Internships
      </NavLink>
      <NavLink
        to="/login"
        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
      >
        Login
      </NavLink>
      <NavLink
        to="/register"
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
      >
        Register
      </NavLink>
    </div>
  );

  const renderAuthenticatedLinks = () => (
    <div className="flex items-center space-x-4">
      {isPublicRoute() && (
        <NavLink
          to={getDashboardLink()}
          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
        >
          Dashboard
        </NavLink>
      )}

      <Link
        to="/notifications"
        className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
      >
        <BellIcon className="h-6 w-6" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-900">
            {getFirstName(user?.name)}
          </span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-xs text-blue-600 font-medium">{user?.role}</p>
            </div>
            {!isPublicRoute() && (
              <Link
                to={getDashboardLink()}
                className="block px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <Link
              to={
                user?.role?.toLowerCase() === "intern"
                  ? "/intern/settings"
                  : user?.role?.toLowerCase() === "mentor"
                    ? "/mentor/settings"
                    : "/admin/settings"
              }
              className="block px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => setDropdownOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileMenu = () => (
    <div className="sm:hidden">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t z-40">
          <div className="px-4 py-2 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/internships"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Internships
                </Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notifications
                  {notificationCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-600"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            {showSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-4">
              <img
                className="h-10 sm:h-16 w-auto"
                src={AninexLogo}
                alt="Aninex Global"
              />
              <span className="hidden md:block font-semibold text-gray-900">
                Aninex Global Services Pvt Ltd
              </span>
              <span className="hidden sm:block md:hidden font-semibold text-gray-900">
                Aninex Global
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center">
            {loading
              ? renderLoadingState()
              : isAuthenticated
                ? renderAuthenticatedLinks()
                : renderPublicLinks()}
          </div>

          {renderMobileMenu()}
        </div>
      </div>

      {(dropdownOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setDropdownOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
