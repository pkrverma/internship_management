import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerUser } from "../services/authService";
import Spinner from "../components/ui/Spinner";
import AninexLogo from "../assets/images/aninex-logo.jpeg";

const RegisterPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Intern", // default role
    phone: "",
    university: "", // interns
    specialization: "", // mentors
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      const dashboardPath =
        role === "intern"
          ? "/intern/dashboard"
          : role === "mentor"
            ? "/mentor/dashboard"
            : "/";
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: "" });
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let feedback = "";
    switch (score) {
      case 0:
      case 1:
        feedback = "Very Weak";
        break;
      case 2:
        feedback = "Weak";
        break;
      case 3:
        feedback = "Fair";
        break;
      case 4:
        feedback = "Strong";
        break;
      case 5:
        feedback = "Very Strong";
        break;
      default:
        feedback = "";
    }
    return { score, feedback };
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone (optional, but validate if provided)
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 3) {
      newErrors.password =
        "Password is too weak. Include uppercase, lowercase, numbers, and symbols";
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Role-specific fields
    if (formData.role === "Intern" && !formData.university.trim()) {
      newErrors.university = "University/Institution is required for interns";
    }
    if (formData.role === "Mentor" && !formData.specialization.trim()) {
      newErrors.specialization = "Area of expertise is required for mentors";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const handleRoleChange = (newRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      university: newRole === "Intern" ? prev.university : "",
      specialization: newRole === "Mentor" ? prev.specialization : "",
    }));
    setErrors((prev) => ({ ...prev, university: "", specialization: "" }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim() || null,
      };
      if (formData.role === "Intern") {
        registrationData.university = formData.university.trim();
      }
      if (formData.role === "Mentor") {
        registrationData.specialization = formData.specialization.trim();
      }

      await registerUser(registrationData);

      navigate("/login", {
        state: {
          message:
            "Registration successful! Please log in with your credentials.",
          email: formData.email,
        },
        replace: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate")
      ) {
        setSubmitError(
          "An account with this email already exists. Please use a different email or try logging in."
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        setSubmitError(
          "Network error. Please check your connection and try again."
        );
      } else if (error.message.includes("validation")) {
        setSubmitError("Please check your information and try again.");
      } else {
        setSubmitError(
          error.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading auth state
  if (authLoading) {
    return <Spinner fullScreen text="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center">
          <img
            src={AninexLogo}
            alt="Aninex Logo"
            className="h-16 w-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Join Aninex</h2>
          <p className="text-gray-500 text-sm">
            Become an Intern or Mentor and start your journey today.
          </p>
        </div>

        {/* Error messages */}
        {submitError && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded text-sm">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium">Register As</label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="mt-1 w-full border-gray-300 rounded-md"
            >
              <option>Intern</option>
              <option>Mentor</option>
            </select>
          </div>

          {/* Role-specific fields */}
          {formData.role === "Intern" && (
            <div>
              <label className="block text-sm font-medium">
                University / Institution
              </label>
              <input
                name="university"
                value={formData.university}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md p-2 ${
                  errors.university ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.university && (
                <p className="text-sm text-red-600">{errors.university}</p>
              )}
            </div>
          )}

          {formData.role === "Mentor" && (
            <div>
              <label className="block text-sm font-medium">
                Area of Expertise
              </label>
              <input
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md p-2 ${
                  errors.specialization ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.specialization && (
                <p className="text-sm text-red-600">{errors.specialization}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
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

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium">
              Phone (optional)
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
            {formData.password && (
              <p className="text-xs mt-1">
                Strength: {passwordStrength.feedback}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md p-2 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
