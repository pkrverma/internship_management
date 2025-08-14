import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerUser } from "../services/authService";
import Spinner from "../components/ui/Spinner";
import AninexLogo from "../assets/images/aninex-logo.jpeg";

const ROLE_OPTIONS = ["Intern", "Mentor"];
const ROLE_MAP = { Intern: "intern", Mentor: "mentor" };

const RegisterPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Intern",
    phone: "",
    university: "",
    specialization: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const rolePath = user.role?.toLowerCase();
      navigate(
        rolePath === "intern"
          ? "/intern/dashboard"
          : rolePath === "mentor"
            ? "/mentor/dashboard"
            : "/",
        { replace: true }
      );
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "Invalid email address";
    if (!formData.password) errs.password = "Password is required";
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (formData.role === "Intern" && !formData.university.trim())
      errs.university = "University is required for interns";
    if (formData.role === "Mentor" && !formData.specialization.trim())
      errs.specialization = "Specialization required for mentors";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await registerUser({
        ...formData,
        role: ROLE_MAP[formData.role] || formData.role.toLowerCase(),
      });
      navigate("/login", {
        state: {
          message: "Registration successful! Please log in.",
          email: formData.email,
        },
      });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <Spinner fullScreen text="Loading..." />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow rounded p-6 w-full max-w-md">
        <div className="mb-4 flex items-center gap-2">
          <img src={AninexLogo} alt="Logo" className="h-10 w-10 rounded" />
          <h1 className="font-bold text-lg">Create your account</h1>
        </div>
        {submitError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>
          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          {formData.role === "Intern" && (
            <div>
              <label className="block text-sm font-medium">University</label>
              <input
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
              {errors.university && (
                <p className="text-xs text-red-600">{errors.university}</p>
              )}
            </div>
          )}
          {formData.role === "Mentor" && (
            <div>
              <label className="block text-sm font-medium">
                Specialization
              </label>
              <input
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
              {errors.specialization && (
                <p className="text-xs text-red-600">{errors.specialization}</p>
              )}
            </div>
          )}
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium">
              Phone (optional)
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-3 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
