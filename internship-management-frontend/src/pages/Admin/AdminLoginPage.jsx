import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../../components/ui/Spinner";
import AninexLogo from "../../assets/images/aninex-logo.jpeg";
import { loginAdmin } from "../../services/authService";

const AdminLoginPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role?.toLowerCase() === "admin") {
        const from = location.state?.from?.pathname || "/admin/dashboard";
        navigate(from, { replace: true });
      } else {
        setSubmitError(
          `You are logged in as a ${user.role}. Logout first to access the admin portal.`
        );
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, location.state]);

  const validateForm = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Admin Email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      errs.email = "Invalid email address";
    }
    if (!formData.password) {
      errs.password = "Password is required";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      const loggedInUser = await loginAdmin(formData.email, formData.password);
      if (loggedInUser.role?.toLowerCase() !== "admin") {
        setSubmitError("Invalid credentials for admin portal.");
        return;
      }
      console.log("Admin login successful");
      // Redirect handled by useEffect
    } catch (err) {
      console.error("Admin login error:", err);
      setSubmitError(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <Spinner fullScreen text="Loading..." />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white shadow rounded p-6 w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <img src={AninexLogo} alt="Logo" className="h-10 w-10 rounded mr-2" />
          <h1 className="text-xl font-bold">Admin Login</h1>
        </div>

        {submitError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label>Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {isSubmitting ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500 text-center">
          Secure login for authorized administrators only.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
