import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";
import AninexLogo from "../assets/images/aninex-logo.jpeg";

const LoginPage = () => {
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && !from.includes("/admin")) {
        navigate(from, { replace: true });
      } else {
        const role = user.role?.toLowerCase();
        if (role === "intern") navigate("/intern/dashboard", { replace: true });
        else if (role === "mentor")
          navigate("/mentor/dashboard", { replace: true });
        else navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate, location.state]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
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
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const loggedInUser = await login(formData.email, formData.password);

      if (loggedInUser.role?.toLowerCase() === "admin") {
        setSubmitError("Admin users should use the admin login page.");
        return; // Stop here so admin can't log in from here
      }

      console.log("Login successful:", loggedInUser.role);
      // Redirect handled by useEffect
    } catch (error) {
      console.error("Login error:", error);
      if (error.message.toLowerCase().includes("suspend")) {
        setSubmitError(
          "Your account has been suspended. Please contact administrator."
        );
      } else if (error.message.toLowerCase().includes("invalid")) {
        setSubmitError("Invalid email or password. Please try again.");
      } else if (
        error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("fetch")
      ) {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else {
        setSubmitError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen text="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src={AninexLogo}
            alt="Aninex Logo"
            className="h-16 w-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Access your internship portal
          </h2>
          <p className="text-gray-500 text-sm">
            For Interns and Mentors only. Admins should use the{" "}
            <Link to="/admin/login" className="text-blue-600 hover:underline">
              admin login page
            </Link>
            .
          </p>
        </div>

        {location.state?.message && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded text-sm">
            {location.state.message}
          </div>
        )}

        {submitError && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded text-sm">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled={isSubmitting}
              value={formData.email}
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
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              disabled={isSubmitting}
              value={formData.password}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
