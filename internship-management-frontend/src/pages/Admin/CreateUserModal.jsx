import React, { useState, useEffect } from "react";
import { IoClose, IoPersonAddOutline } from "react-icons/io5";
import Spinner from "../../components/ui/Spinner";

const CreateUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Intern",
    phone: "",
    university: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        role: "Intern",
        phone: "",
        university: "",
      });
      setErrors({});
      setSubmitError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.role) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        ...formData,
        password: "TempPassword123", // In real system, backend handles password
      });
      onClose();
    } catch (error) {
      console.error("Failed to create user:", error);
      setSubmitError(
        error.message || "Failed to create user. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          disabled={isSubmitting}
        >
          <IoClose size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <IoPersonAddOutline className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold">Create New User</h2>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mb-3">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              className={`mt-1 block w-full border rounded p-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              className={`mt-1 block w-full border rounded p-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              name="role"
              className={`mt-1 block w-full border rounded p-2 ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.role}
              onChange={handleInputChange}
              disabled={isSubmitting}
            >
              <option value="Intern">Intern</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600 mt-1">{errors.role}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium">
              Phone (Optional)
            </label>
            <input
              type="text"
              name="phone"
              className="mt-1 block w-full border rounded p-2 border-gray-300"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          {/* University */}
          {formData.role === "Intern" && (
            <div>
              <label className="block text-sm font-medium">
                University (Optional)
              </label>
              <input
                type="text"
                name="university"
                className="mt-1 block w-full border rounded p-2 border-gray-300"
                value={formData.university}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" color="white" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
