import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// Assuming registerUser is imported from authService.js
import { register as registerUser } from "../services/authService"; // Renamed import for clarity
import Spinner from "../components/ui/Spinner"; // Assuming you have a Spinner component

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Intern", // Default role
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole) => {
    setFormData({ ...formData, role: newRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // registerUser from authService returns the new user object but is not used here directly
      await registerUser({ name, email, password, role });

      // Redirect to login page with a success message
      navigate("/login", {
        state: { message: "Registration successful! Please log in." },
      });
    } catch (err) {
      // Display error message from authService (e.g., "User with this email already exists.")
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 border-2 border-indigo-100">
        {" "}
        {/* Changed border color to indigo */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Create Account
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Join Aninex as an Intern or Mentor.
        </p>
        {/* Role Selector */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange("Intern")}
            className={`px-6 py-2 rounded-l-md transition ${
              role === "Intern"
                ? "bg-indigo-600 text-white" // Changed to indigo-600
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Intern
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("Mentor")}
            className={`px-6 py-2 rounded-r-md transition ${
              role === "Mentor"
                ? "bg-indigo-600 text-white" // Changed to indigo-600
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Mentor
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={name}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="e.g., jane.doe@example.com"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Enter your password"
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 mb-2"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
              className="input-field w-full"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center disabled:bg-indigo-300" // Changed to indigo-600/700
          >
            {loading ? <Spinner /> : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            {" "}
            {/* Changed to indigo-600 */}
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
