// src/pages/Admin/PostInternship.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import { createInternship } from "../../services/internshipService";
import CreatableSelect from "react-select/creatable";
import Spinner from "../../components/ui/Spinner";
import {
  IoAddOutline,
  IoSaveOutline,
  IoEyeOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoBusinessOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoReloadOutline,
} from "react-icons/io5";

const PostInternship = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company: "Aninex Global Services",
    department: "",
    location: "",
    type: "Full-time", // Full-time, Part-time, Remote, Hybrid
    duration: "",
    stipend: "",
    startDate: "",
    applicationDeadline: "",
    description: "",
    responsibilities: "",
    requirements: "",
    qualifications: "",
    skills: [],
    benefits: [],
    maxApplications: "",
    isUrgent: false,
    isRemote: false,
    experienceLevel: "Entry-level",
  });

  // UI state
  const [selectedSkillOptions, setSelectedSkillOptions] = useState([]);
  const [selectedBenefitOptions, setSelectedBenefitOptions] = useState([]);
  const [isUnpaid, setIsUnpaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form validation
  const [touched, setTouched] = useState({});

  // Predefined options
  const skillOptions = [
    { value: "JavaScript", label: "JavaScript", category: "Frontend" },
    { value: "React", label: "React", category: "Frontend" },
    { value: "Vue.js", label: "Vue.js", category: "Frontend" },
    { value: "Angular", label: "Angular", category: "Frontend" },
    { value: "TypeScript", label: "TypeScript", category: "Frontend" },
    { value: "HTML/CSS", label: "HTML/CSS", category: "Frontend" },
    { value: "Node.js", label: "Node.js", category: "Backend" },
    { value: "Python", label: "Python", category: "Backend" },
    { value: "Java", label: "Java", category: "Backend" },
    { value: "PHP", label: "PHP", category: "Backend" },
    { value: "Ruby", label: "Ruby", category: "Backend" },
    { value: "C#", label: "C#", category: "Backend" },
    { value: "SQL", label: "SQL", category: "Database" },
    { value: "MongoDB", label: "MongoDB", category: "Database" },
    { value: "PostgreSQL", label: "PostgreSQL", category: "Database" },
    { value: "MySQL", label: "MySQL", category: "Database" },
    { value: "AWS", label: "AWS", category: "Cloud" },
    { value: "Azure", label: "Azure", category: "Cloud" },
    { value: "Docker", label: "Docker", category: "DevOps" },
    { value: "Git", label: "Git", category: "Tools" },
    { value: "Figma", label: "Figma", category: "Design" },
    {
      value: "Adobe Creative Suite",
      label: "Adobe Creative Suite",
      category: "Design",
    },
    { value: "Data Analysis", label: "Data Analysis", category: "Analytics" },
    { value: "Machine Learning", label: "Machine Learning", category: "AI/ML" },
    {
      value: "Digital Marketing",
      label: "Digital Marketing",
      category: "Marketing",
    },
    { value: "Content Writing", label: "Content Writing", category: "Content" },
  ];

  const benefitOptions = [
    { value: "Health Insurance", label: "Health Insurance" },
    { value: "Flexible Hours", label: "Flexible Work Hours" },
    { value: "Remote Work", label: "Remote Work Options" },
    { value: "Mentorship", label: "One-on-One Mentorship" },
    { value: "Certificate", label: "Completion Certificate" },
    { value: "Letter of Recommendation", label: "Letter of Recommendation" },
    { value: "Pre-Placement Offer", label: "Pre-Placement Offer (PPO)" },
    { value: "Training Programs", label: "Professional Training Programs" },
    { value: "Networking Events", label: "Industry Networking Events" },
    { value: "Free Meals", label: "Free Meals/Snacks" },
    { value: "Transportation", label: "Transportation Allowance" },
    { value: "Learning Budget", label: "Learning & Development Budget" },
  ];

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-save draft every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        Object.values(formData).some((value) =>
          Array.isArray(value) ? value.length > 0 : value
        )
      ) {
        saveDraft(true); // Silent save
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Special handling for stipend
    if (name === "stipend" && !isUnpaid) {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    }
  };

  const handleSkillsChange = (selectedOptions) => {
    setSelectedSkillOptions(selectedOptions || []);
    setFormData((prev) => ({
      ...prev,
      skills: selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [],
    }));
  };

  const handleBenefitsChange = (selectedOptions) => {
    setSelectedBenefitOptions(selectedOptions || []);
    setFormData((prev) => ({
      ...prev,
      benefits: selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [],
    }));
  };

  const handleUnpaidChange = (e) => {
    setIsUnpaid(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, stipend: "0" }));
    } else {
      setFormData((prev) => ({ ...prev, stipend: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.department.trim())
      newErrors.department = "Department is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.duration) newErrors.duration = "Duration is required";
    if (!formData.applicationDeadline)
      newErrors.applicationDeadline = "Application deadline is required";
    if (!formData.description.trim())
      newErrors.description = "Job description is required";
    if (!formData.responsibilities.trim())
      newErrors.responsibilities = "Responsibilities are required";
    if (!formData.requirements.trim())
      newErrors.requirements = "Requirements are required";
    if (formData.skills.length === 0)
      newErrors.skills = "At least one skill is required";

    // Stipend validation
    if (!isUnpaid) {
      if (!formData.stipend || parseInt(formData.stipend) <= 0) {
        newErrors.stipend = "Please enter a valid stipend amount";
      }
    }

    // Date validations
    const today = new Date();
    const applicationDeadline = new Date(formData.applicationDeadline);
    const startDate = new Date(formData.startDate);

    if (formData.applicationDeadline && applicationDeadline <= today) {
      newErrors.applicationDeadline =
        "Application deadline must be in the future";
    }

    if (
      formData.startDate &&
      formData.applicationDeadline &&
      startDate <= applicationDeadline
    ) {
      newErrors.startDate = "Start date must be after application deadline";
    }

    // Description length validation
    if (formData.description.length < 100) {
      newErrors.description =
        "Job description should be at least 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatStipend = (amount) => {
    if (isUnpaid || !amount || amount === "0") return "Unpaid";
    return `₹${parseInt(amount).toLocaleString("en-IN")}/month`;
  };

  const generateInternshipId = () => {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({
        type: "error",
        text: "Please fix the validation errors below.",
      });
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField);
        if (element)
          element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const internshipId = generateInternshipId();

      // Create internship object
      const newInternship = {
        id: internshipId,
        title: formData.title.trim(),
        company: formData.company.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        type: formData.type,
        duration: formData.duration,
        stipend: formatStipend(formData.stipend),
        startDate: formData.startDate,
        applicationDeadline: formData.applicationDeadline,
        description: formData.description.trim(),
        responsibilities: formData.responsibilities.trim(),
        requirements: formData.requirements.trim(),
        qualifications: formData.qualifications.trim(),
        skills: formData.skills,
        benefits: formData.benefits,
        maxApplications: formData.maxApplications
          ? parseInt(formData.maxApplications)
          : null,
        isUrgent: formData.isUrgent,
        isRemote:
          formData.isRemote ||
          formData.location.toLowerCase().includes("remote"),
        experienceLevel: formData.experienceLevel,
        status: "Open",
        postedOn: new Date().toISOString(),
        postedBy: "admin", // In real app, get from auth context
        applicantCount: 0,
        viewCount: 0,
        featured: formData.isUrgent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to backend/localStorage
      const existingInternships = getData("internships") || [];
      const updatedInternships = [...existingInternships, newInternship];
      await saveData("internships", updatedInternships);

      // Update stats
      const currentStats = getData("internshipStats") || [];
      const newStatEntry = {
        id: internshipId,
        title: newInternship.title,
        applicationCount: 0,
        applicants: [],
        active: true,
        closed: false,
        listingType: "Internship",
        createdAt: new Date().toISOString(),
      };
      await saveData("internshipStats", [...currentStats, newStatEntry]);

      setMessage({
        type: "success",
        text: "Internship posted successfully! Redirecting to all internships...",
      });

      // Clear draft
      clearDraft();

      // Reset form
      resetForm();

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/admin/all-internships");
      }, 2000);
    } catch (error) {
      console.error("Failed to post internship:", error);
      setMessage({
        type: "error",
        text: "Failed to post internship. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const saveDraft = async (silent = false) => {
    if (!silent) setIsSavingDraft(true);

    try {
      const draftData = {
        ...formData,
        selectedSkillOptions,
        selectedBenefitOptions,
        isUnpaid,
        currentStep,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem("internship_draft", JSON.stringify(draftData));

      if (!silent) {
        setMessage({ type: "success", text: "Draft saved successfully!" });
      }
    } catch (error) {
      if (!silent) {
        setMessage({ type: "error", text: "Failed to save draft." });
      }
    } finally {
      if (!silent) setIsSavingDraft(false);
    }
  };

  const loadDraft = () => {
    try {
      const draftData = localStorage.getItem("internship_draft");
      if (draftData) {
        const parsed = JSON.parse(draftData);
        setFormData(parsed);
        setSelectedSkillOptions(parsed.selectedSkillOptions || []);
        setSelectedBenefitOptions(parsed.selectedBenefitOptions || []);
        setIsUnpaid(parsed.isUnpaid || false);
        setCurrentStep(parsed.currentStep || 1);
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("internship_draft");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "Aninex Global Services",
      department: "",
      location: "",
      type: "Full-time",
      duration: "",
      stipend: "",
      startDate: "",
      applicationDeadline: "",
      description: "",
      responsibilities: "",
      requirements: "",
      qualifications: "",
      skills: [],
      benefits: [],
      maxApplications: "",
      isUrgent: false,
      isRemote: false,
      experienceLevel: "Entry-level",
    });
    setSelectedSkillOptions([]);
    setSelectedBenefitOptions([]);
    setIsUnpaid(false);
    setCurrentStep(1);
    setErrors({});
    setTouched({});
    clearDraft();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        Basic Information
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Full Stack Developer Intern"
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company *
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Department *
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.department ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">Select Department</option>
            <option value="Technology">Technology</option>
            <option value="Marketing">Marketing</option>
            <option value="Design">Design</option>
            <option value="Business Development">Business Development</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Research & Development">
              Research & Development
            </option>
          </select>
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="experienceLevel"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Experience Level
          </label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Entry-level">Entry Level</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location *
          </label>
          <div className="relative">
            <IoLocationOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Mumbai, Remote, Hybrid"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.location ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Internship Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Duration and Stipend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Duration *
          </label>
          <div className="relative">
            <IoTimeOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.duration ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">Select Duration</option>
              <option value="1 Month">1 Month</option>
              <option value="2 Months">2 Months</option>
              <option value="3 Months">3 Months</option>
              <option value="4 Months">4 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="stipend"
              className="block text-sm font-medium text-gray-700"
            >
              Stipend {!isUnpaid && "*"}
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isUnpaid}
                onChange={handleUnpaidChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">Unpaid</span>
            </label>
          </div>
          <div className="relative">
            <IoCashOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="stipend"
              name="stipend"
              value={formData.stipend}
              onChange={handleInputChange}
              disabled={isUnpaid}
              placeholder={isUnpaid ? "Unpaid Internship" : "e.g., 25000"}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.stipend ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.stipend && (
            <p className="mt-1 text-sm text-red-600">{errors.stipend}</p>
          )}
          {formData.stipend && !isUnpaid && (
            <p className="mt-1 text-sm text-blue-600">
              Preview: {formatStipend(formData.stipend)}
            </p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="applicationDeadline"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Application Deadline *
          </label>
          <div className="relative">
            <IoCalendarOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="date"
              id="applicationDeadline"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.applicationDeadline
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            />
          </div>
          {errors.applicationDeadline && (
            <p className="mt-1 text-sm text-red-600">
              {errors.applicationDeadline}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Start Date (Optional)
          </label>
          <div className="relative">
            <IoCalendarOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              min={
                formData.applicationDeadline ||
                new Date().toISOString().split("T")[0]
              }
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.startDate ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>
      </div>

      {/* Additional Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="maxApplications"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Maximum Applications (Optional)
          </label>
          <div className="relative">
            <IoPeopleOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="number"
              id="maxApplications"
              name="maxApplications"
              value={formData.maxApplications}
              onChange={handleInputChange}
              placeholder="Leave blank for unlimited"
              min="1"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 pt-8">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-offset-0 focus:ring-red-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Urgent Hiring</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isRemote"
              checked={formData.isRemote}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              Remote Work Available
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        Job Details
      </h3>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Job Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={6}
          placeholder="Provide a comprehensive description of the internship role, company culture, and what the intern will learn..."
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? "border-red-300" : "border-gray-300"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500">
            {formData.description.length}/500 characters{" "}
            {formData.description.length < 100 && "(minimum 100)"}
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="responsibilities"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Key Responsibilities *
        </label>
        <textarea
          id="responsibilities"
          name="responsibilities"
          value={formData.responsibilities}
          onChange={handleInputChange}
          rows={4}
          placeholder="• Assist in developing web applications&#10;• Collaborate with senior developers&#10;• Participate in code reviews&#10;• Write technical documentation"
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.responsibilities ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.responsibilities && (
          <p className="mt-1 text-sm text-red-600">{errors.responsibilities}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="requirements"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Requirements *
        </label>
        <textarea
          id="requirements"
          name="requirements"
          value={formData.requirements}
          onChange={handleInputChange}
          rows={4}
          placeholder="• Currently pursuing Bachelor's/Master's in Computer Science&#10;• Basic knowledge of programming languages&#10;• Strong problem-solving skills&#10;• Excellent communication skills"
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.requirements ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.requirements && (
          <p className="mt-1 text-sm text-red-600">{errors.requirements}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="qualifications"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Preferred Qualifications (Optional)
        </label>
        <textarea
          id="qualifications"
          name="qualifications"
          value={formData.qualifications}
          onChange={handleInputChange}
          rows={3}
          placeholder="• Previous internship experience&#10;• Portfolio of personal projects&#10;• Familiarity with Agile methodologies"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        Skills & Benefits
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills *
        </label>
        <CreatableSelect
          isMulti
          value={selectedSkillOptions}
          onChange={handleSkillsChange}
          options={skillOptions}
          placeholder="Select or create skills..."
          className={`${errors.skills ? "border-red-300" : ""}`}
          classNamePrefix="react-select"
          formatGroupLabel={(data) => (
            <div className="flex justify-between items-center">
              <span className="font-medium">{data.label}</span>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                {data.options.length}
              </span>
            </div>
          )}
          styles={{
            control: (base, state) => ({
              ...base,
              borderColor: errors.skills ? "#f87171" : base.borderColor,
              "&:hover": {
                borderColor: errors.skills ? "#f87171" : base.borderColor,
              },
            }),
          }}
        />
        {errors.skills && (
          <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select existing skills or type to create new ones. Categories help
          organize skills.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Benefits & Perks
        </label>
        <CreatableSelect
          isMulti
          value={selectedBenefitOptions}
          onChange={handleBenefitsChange}
          options={benefitOptions}
          placeholder="Select benefits offered..."
          className="basic-multi-select"
          classNamePrefix="react-select"
        />
        <p className="mt-1 text-xs text-gray-500">
          Highlight the benefits and perks that make this internship attractive.
        </p>
      </div>

      {/* Benefits Preview */}
      {formData.benefits.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">
            Selected Benefits:
          </h4>
          <div className="flex flex-wrap gap-2">
            {formData.benefits.map((benefit, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                <IoCheckmarkCircleOutline className="w-3 h-3 mr-1" />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-gray-900">Internship Preview</h3>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              {formData.title}
            </h4>
            <p className="text-lg text-blue-600 font-medium">
              {formData.company}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center">
                <IoLocationOutline className="w-4 h-4 mr-1" />
                {formData.location}
              </span>
              <span className="flex items-center">
                <IoTimeOutline className="w-4 h-4 mr-1" />
                {formData.duration}
              </span>
              <span className="flex items-center">
                <IoCashOutline className="w-4 h-4 mr-1" />
                {formatStipend(formData.stipend)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {formData.isUrgent && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                Urgent Hiring
              </span>
            )}
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {formData.type}
            </span>
          </div>
        </div>

        {formData.description && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Description</h5>
            <p className="text-gray-600 whitespace-pre-wrap">
              {formData.description}
            </p>
          </div>
        )}

        {formData.skills.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Required Skills</h5>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {formData.benefits.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Benefits</h5>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Application deadline:{" "}
            {formData.applicationDeadline
              ? new Date(formData.applicationDeadline).toLocaleDateString()
              : "Not set"}
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Post New Internship
          </h1>
          <p className="text-gray-600 mt-2">
            Create a comprehensive internship listing to attract top talent
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => saveDraft()}
            disabled={isSavingDraft}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isSavingDraft ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <IoSaveOutline className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
          >
            <IoEyeOutline className="w-4 h-4 mr-2" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex">
            {message.type === "success" ? (
              <IoCheckmarkCircleOutline className="h-5 w-5 text-green-400" />
            ) : (
              <IoWarningOutline className="h-5 w-5 text-red-400" />
            )}
            <p
              className={`ml-3 text-sm ${message.type === "success" ? "text-green-700" : "text-red-700"}`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, title: "Basic Info", icon: IoBusinessOutline },
                  {
                    step: 2,
                    title: "Job Details",
                    icon: IoDocumentTextOutline,
                  },
                  {
                    step: 3,
                    title: "Skills & Benefits",
                    icon: IoCheckmarkCircleOutline,
                  },
                ].map(({ step, title, icon: Icon }) => (
                  <div
                    key={step}
                    className={`flex items-center ${
                      currentStep >= step ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        currentStep >= step
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="ml-2 text-sm font-medium">{title}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Content */}
            <form ref={formRef} onSubmit={handleSubmit} className="p-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentStep === 1}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <IoArrowForward className="ml-2 w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" color="white" className="mr-2" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <IoAddOutline className="w-4 h-4 mr-2" />
                          Post Internship
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Publishing internship...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <IoReloadOutline className="w-4 h-4 mr-2" />
                Reset Form
              </button>

              <button
                onClick={() => navigate("/admin/all-internships")}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <IoDocumentTextOutline className="w-4 h-4 mr-2" />
                View All Listings
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              💡 Tips for Success
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Write clear, engaging job descriptions</li>
              <li>• Be specific about requirements and expectations</li>
              <li>• Highlight growth opportunities and learning</li>
              <li>• Include attractive benefits and perks</li>
              <li>• Set realistic deadlines and start dates</li>
            </ul>
          </div>

          {/* Preview Panel */}
          {showPreview && renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default PostInternship;
