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
  const [formData, setFormData] = useState({ email: "", password: "" });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Security state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role?.toLowerCase() === "admin") {
        const from = location.state?.from?.pathname || "/admin/dashboard";
        navigate(from, { replace: true });
      } else {
        setSubmitError(
          `You are logged in as a ${user.role}. Please logout first to access the admin portal.`
        );
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location.state]);

  // Block timer effect
  useEffect(() => {
    if (isBlocked && blockTimer > 0) {
      const interval = setInterval(() => {
        setBlockTimer((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isBlocked, blockTimer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const loggedInUser = await login(formData.email, formData.password);

      if (loggedInUser.role?.toLowerCase() !== "admin") {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        setSubmitError(
          "Access Denied: This portal is for administrators only. Please use the regular login page."
        );
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setBlockTimer(300);
          setSubmitError(
            "Too many failed attempts. Access blocked for 5 minutes."
          );
        }
        return;
      }

      console.log("Admin login successful");
      // Redirect handled by useEffect
    } catch (error) {
      console.error("Admin login error:", error);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (error.message.toLowerCase().includes("suspend")) {
        setSubmitError(
          "Your admin account has been suspended. Please contact the system administrator."
        );
      } else if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("password")
      ) {
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setBlockTimer(300);
          setSubmitError(
            "Too many failed login attempts. Access blocked for 5 minutes."
          );
        } else {
          setSubmitError(
            `Invalid credentials. ${3 - newAttempts} attempts remaining.`
          );
        }
      } else if (
        error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("fetch")
      ) {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSubmitError(
          error.message ||
            "Authentication failed. Please verify your credentials."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <Spinner fullScreen text="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={AninexLogo} alt="Aninex Logo" className="h-16 mb-4" />
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            Admin Portal
          </h2>
          <p className="text-gray-500 text-sm">
            Secure login for authorized administrators only.
          </p>
        </div>

        {isBlocked && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 text-sm">
            Too many failed attempts. Please wait {formatTime(blockTimer)}{" "}
            before trying again.
          </div>
        )}

        {submitError && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 text-sm">
            {submitError}
            {submitError.toLowerCase().includes("suspend") && (
              <div className="mt-1 text-xs">
                Contact support:{" "}
                <a href="mailto:admin@aninex.com">admin@aninex.com</a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={isSubmitting || isBlocked}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                disabled={isSubmitting || isBlocked}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md p-2 pr-10 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500"
              >
                <LockClosedIcon className="h-5 w-5" />
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isBlocked}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Need help?{" "}
          <Link to="/contact" className="text-blue-600 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
