import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/ui/Spinner";
import AninexLogo from "../../assets/images/aninex-logo.jpeg";
import { ShieldCheckIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const AdminLoginPage = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "Admin") {
        const from = location.state?.from?.pathname || "/admin/dashboard";
        navigate(from, { replace: true });
      } else {
        // If logged in as non-admin, show error but don't redirect
        setSubmitError(
          "You are logged in as a " +
            user.role +
            ". Please logout first to access admin portal."
        );
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location.state]);

  // Block timer effect
  useEffect(() => {
    let interval;
    if (isBlocked && blockTimer > 0) {
      interval = setInterval(() => {
        setBlockTimer((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimer]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Invalid admin email format";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const user = await login(formData.email, formData.password);

      // Verify admin role
      if (user.role !== "Admin") {
        // Not an admin user
        setSubmitError(
          "Access Denied: This portal is for administrators only. Please use the regular login page."
        );

        // Increment login attempts for security
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Block after 3 failed attempts
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setBlockTimer(300); // 5 minutes block
          setSubmitError(
            "Too many failed attempts. Access blocked for 5 minutes."
          );
        }

        // Logout the non-admin user
        setTimeout(() => {
          // auth.logout(); // Uncomment if you want to logout non-admin users
        }, 100);

        return;
      }

      // Admin login successful
      console.log("Admin login successful");
      // Navigation will be handled by useEffect
    } catch (error) {
      console.error("Admin login error:", error);

      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Handle specific error types
      if (error.message.includes("suspended")) {
        setSubmitError(
          "Your admin account has been suspended. Please contact the system administrator."
        );
      } else if (
        error.message.includes("Invalid") ||
        error.message.includes("password")
      ) {
        setSubmitError(
          `Invalid credentials. ${3 - newAttempts} attempts remaining.`
        );

        // Block after 3 failed attempts
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setBlockTimer(300); // 5 minutes
          setSubmitError(
            "Too many failed login attempts. Access blocked for 5 minutes for security."
          );
        }
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSubmitError(
          "Authentication failed. Please verify your admin credentials."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Spinner />
      </div>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <ShieldCheckIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-blue-200">
            Secure Administrator Access
          </p>
        </div>

        {/* Security Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Security Notice:</strong> This is a restricted area for
                authorized administrators only.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-white/20">
          {/* Blocked Warning */}
          {isBlocked && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Access Temporarily Blocked
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Too many failed attempts. Please wait{" "}
                    {formatTime(blockTimer)} before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Global Error Message */}
          {submitError && !isBlocked && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Authentication Failed
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{submitError}</p>
                  {submitError.includes("suspended") && (
                    <p className="mt-2 text-sm text-red-600">
                      Contact support:{" "}
                      <a
                        href="mailto:admin@aninex.com"
                        className="font-medium underline"
                      >
                        admin@aninex.com
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Administrator Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isBlocked}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.email
                      ? "border-red-300 text-red-900 placeholder-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="admin@aninex.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Administrator Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isBlocked}
                    className={`block w-full pr-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.password
                        ? "border-red-300 text-red-900 placeholder-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isBlocked}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Security Info */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <p>
                <strong>Security Notice:</strong> Failed login attempts are
                monitored and logged.
              </p>
              <p>Maximum 3 attempts before temporary lockout.</p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || isBlocked}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Authenticating...
                  </>
                ) : isBlocked ? (
                  `Blocked (${formatTime(blockTimer)})`
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Secure Admin Login
                  </>
                )}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← Regular User Login
              </Link>
              <Link
                to="/"
                className="font-medium text-gray-600 hover:text-gray-500 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-blue-200">
            This is a secure area. All login attempts are monitored and logged.
          </p>
          <p className="text-xs text-blue-300 mt-1">
            © {new Date().getFullYear()} Aninex Global Services. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
