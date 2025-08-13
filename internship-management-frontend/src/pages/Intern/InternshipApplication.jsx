import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoArrowBack,
  IoArrowForward,
  IoPersonOutline,
  IoSchoolOutline,
  IoCodeSlashOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoBusinessOutline,
  IoSaveOutline,
  IoSendOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoMailOutline,
  IoCallOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoHomeOutline,
} from "react-icons/io5";

const InternshipApplication = () => {
  const { id: internshipId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Data states
  const [internship, setInternship] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",

    // Academic Information
    university: "",
    degree: "",
    major: "",
    currentYear: "",
    expectedGraduation: "",
    currentGPA: "",

    // Professional Information
    skills: [],
    github: "",
    linkedin: "",
    portfolio: "",
    previousExperience: "",

    // Application Specific
    whyInternship: "",
    expectations: "",
    availability: "",
    startDate: "",
    workAuthorization: "yes",
    relocate: "yes",

    // Additional Information
    additionalInfo: "",
    references: [],
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  // File states
  const [files, setFiles] = useState({
    resume: null,
    coverLetter: null,
    transcript: null,
    portfolio: null,
  });
  const [fileUploading, setFileUploading] = useState({});

  // UI states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Load internship and existing application data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load internship details
        const internships = getData("internships") || [];
        const targetInternship = internships.find((i) => i.id === internshipId);

        if (!targetInternship) {
          setMessage({ type: "error", text: "Internship not found" });
          navigate("/internships");
          return;
        }

        // Check if internship is still open
        const deadline = new Date(
          targetInternship.applicationDeadline || targetInternship.applyBy
        );
        if (deadline < new Date()) {
          setMessage({
            type: "error",
            text: "Application deadline has passed",
          });
          navigate(`/internships/${internshipId}`);
          return;
        }

        setInternship(targetInternship);

        // Check for existing application
        const applications = getData("applications") || [];
        const existing = applications.find(
          (app) =>
            app.internshipId === internshipId &&
            (app.internId === user.id || app.userId === user.id)
        );

        if (existing) {
          setExistingApplication(existing);

          // If application is already submitted, redirect to view mode
          if (existing.status !== "Draft") {
            navigate(`/intern/my-applications`);
            return;
          }

          // Load existing form data
          populateFormFromApplication(existing);
        } else {
          // Pre-populate with user data
          setFormData((prev) => ({
            ...prev,
            firstName: user.firstName || user.name?.split(" ")[0] || "",
            lastName:
              user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
            email: user.email || "",
            phone: user.phone || "",
            university: user.university || "",
            degree: user.degree || "",
            major: user.major || "",
          }));
        }

        // Load draft if exists
        loadDraft();
      } catch (error) {
        console.error("Failed to load data:", error);
        setMessage({ type: "error", text: "Failed to load application data" });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id && internshipId) {
      loadData();
    }
  }, [internshipId, user, navigate, loadDraft, populateFormFromApplication]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        Object.values(formData).some((value) =>
          Array.isArray(value) ? value.length > 0 : value
        )
      ) {
        saveDraft(true); // Silent save
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, saveDraft]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const populateFormFromApplication = (application) => {
    setFormData({
      firstName: application.firstName || "",
      middleName: application.middleName || "",
      lastName: application.lastName || "",
      email: application.email || user.email || "",
      phone: application.phone || "",
      address: application.address || "",
      city: application.city || "",
      state: application.state || "",
      zipCode: application.zipCode || "",
      university: application.university || "",
      degree: application.degree || "",
      major: application.major || "",
      currentYear: application.currentYear || "",
      expectedGraduation:
        application.expectedGraduation || application.passingYear || "",
      currentGPA: application.currentGPA || "",
      skills: application.skills || [],
      github: application.github || "",
      linkedin: application.linkedin || "",
      portfolio: application.portfolio || "",
      previousExperience: application.previousExperience || "",
      whyInternship: application.whyInternship || "",
      expectations: application.expectations || "",
      availability: application.availability || "",
      startDate: application.startDate || "",
      workAuthorization: application.workAuthorization || "yes",
      relocate: application.relocate || "yes",
      additionalInfo: application.additionalInfo || "",
      references: application.references || [],
      emergencyContact: application.emergencyContact || {
        name: "",
        relationship: "",
        phone: "",
        email: "",
      },
    });

    // Set existing files
    if (application.resume) {
      setFiles((prev) => ({
        ...prev,
        resume: { name: application.resume, uploaded: true },
      }));
    }
    if (application.coverLetter) {
      setFiles((prev) => ({
        ...prev,
        coverLetter: { name: application.coverLetter, uploaded: true },
      }));
    }
  };

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!silent) setIsAutoSaving(true);

      try {
        const draftData = {
          ...formData,
          files: Object.fromEntries(
            Object.entries(files).filter(([_, file]) => file !== null)
          ),
          currentStep,
          lastModified: new Date().toISOString(),
        };

        localStorage.setItem(
          `application_draft_${internshipId}`,
          JSON.stringify(draftData)
        );

        if (!silent) {
          setLastSaved(new Date());
          setMessage({ type: "success", text: "Draft saved successfully!" });
        } else {
          setLastSaved(new Date());
        }
      } catch (error) {
        if (!silent) {
          setMessage({ type: "error", text: "Failed to save draft" });
        }
      } finally {
        if (!silent) setIsAutoSaving(false);
      }
    },
    [formData, files, currentStep, internshipId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadDraft = () => {
    try {
      const draftData = localStorage.getItem(
        `application_draft_${internshipId}`
      );
      if (draftData) {
        const parsed = JSON.parse(draftData);
        setFormData((prev) => ({ ...prev, ...parsed }));

        if (parsed.files) {
          setFiles((prev) => ({ ...prev, ...parsed.files }));
        }

        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }

        setLastSaved(new Date(parsed.lastModified));
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(`application_draft_${internshipId}`);
  };

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
  };

  const handleNestedInputChange = (e, parentKey) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [name]: value,
      },
    }));
  };

  const handleSkillsChange = (newSkills) => {
    setFormData((prev) => ({ ...prev, skills: newSkills }));
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = {
      resume: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      coverLetter: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      transcript: ["application/pdf"],
      portfolio: ["application/pdf", "image/jpeg", "image/png"],
    };

    if (!allowedTypes[fileType].includes(file.type)) {
      setMessage({
        type: "error",
        text: `Please upload a valid ${fileType} file (PDF, DOC, or DOCX)`,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setFileUploading((prev) => ({ ...prev, [fileType]: true }));

    try {
      // In a real app, this would upload to cloud storage
      const uploadResult = await uploadFile(
        file,
        `applications/${user.id}/${fileType}`
      );

      setFiles((prev) => ({
        ...prev,
        [fileType]: {
          name: file.name,
          url: uploadResult.url,
          uploaded: true,
          size: file.size,
        },
      }));

      setMessage({
        type: "success",
        text: `${fileType} uploaded successfully!`,
      });
    } catch (error) {
      console.error("File upload failed:", error);
      setMessage({
        type: "error",
        text: `Failed to upload ${fileType}. Please try again.`,
      });
    } finally {
      setFileUploading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const removeFile = (fileType) => {
    setFiles((prev) => ({ ...prev, [fileType]: null }));
    setMessage({ type: "success", text: `${fileType} removed successfully` });
  };

  const validateStep = (step) => {
    const stepErrors = {};

    switch (step) {
      case 1: // Personal Information
        if (!formData.firstName.trim())
          stepErrors.firstName = "First name is required";
        if (!formData.lastName.trim())
          stepErrors.lastName = "Last name is required";
        if (!formData.email.trim()) stepErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          stepErrors.email = "Please enter a valid email";
        }
        if (!formData.phone.trim())
          stepErrors.phone = "Phone number is required";
        if (!formData.address.trim())
          stepErrors.address = "Address is required";
        if (!formData.city.trim()) stepErrors.city = "City is required";
        if (!formData.state.trim()) stepErrors.state = "State is required";
        break;

      case 2: // Academic Information
        if (!formData.university.trim())
          stepErrors.university = "University is required";
        if (!formData.degree.trim()) stepErrors.degree = "Degree is required";
        if (!formData.major.trim()) stepErrors.major = "Major is required";
        if (!formData.currentYear)
          stepErrors.currentYear = "Current year is required";
        if (!formData.expectedGraduation)
          stepErrors.expectedGraduation = "Expected graduation is required";
        break;

      case 3: // Skills & Experience
        if (formData.skills.length === 0)
          stepErrors.skills = "Please add at least one skill";
        break;

      case 4: // Application Essays
        if (!formData.whyInternship.trim())
          stepErrors.whyInternship =
            "Please explain why you want this internship";
        if (formData.whyInternship.length < 100)
          stepErrors.whyInternship = "Please provide at least 100 characters";
        if (!formData.expectations.trim())
          stepErrors.expectations = "Please describe your expectations";
        if (formData.expectations.length < 50)
          stepErrors.expectations = "Please provide at least 50 characters";
        break;

      case 5: // Documents & Review
        if (!files.resume) stepErrors.resume = "Resume is required";
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      setMessage({
        type: "error",
        text: "Please fix the errors before continuing",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const generateApplicationId = () => {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setMessage({
        type: "error",
        text: "Please fix all errors before submitting",
      });
      return;
    }

    if (!files.resume) {
      setMessage({
        type: "error",
        text: "Resume is required to submit application",
      });
      return;
    }

    setSubmitting(true);

    try {
      const applicationData = {
        applicationId:
          existingApplication?.applicationId || generateApplicationId(),
        internshipId: internshipId,
        internId: user.id,
        userId: user.id, // For backward compatibility

        // Personal Information
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,

        // Academic Information
        university: formData.university,
        degree: formData.degree,
        major: formData.major,
        currentYear: formData.currentYear,
        passingYear: formData.expectedGraduation,
        expectedGraduation: formData.expectedGraduation,
        currentGPA: formData.currentGPA,

        // Skills & Experience
        skills: formData.skills,
        github: formData.github,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        previousExperience: formData.previousExperience,

        // Application Specific
        whyInternship: formData.whyInternship,
        expectations: formData.expectations,
        availability: formData.availability,
        startDate: formData.startDate,
        workAuthorization: formData.workAuthorization,
        relocate: formData.relocate,

        // Files
        resume: files.resume?.name,
        resumeFileName: files.resume?.name,
        coverLetter: files.coverLetter?.name,
        coverLetterFileName: files.coverLetter?.name,
        transcript: files.transcript?.name,
        portfolioFile: files.portfolio?.name,

        // Additional Info
        additionalInfo: formData.additionalInfo,
        references: formData.references,
        emergencyContact: formData.emergencyContact,

        // Status & Timestamps
        status: "Submitted",
        submittedAt: new Date().toISOString(),
        applicationDate: new Date().toISOString(),
        createdAt: existingApplication?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save application
      const applications = getData("applications") || [];
      let updatedApplications;

      if (existingApplication) {
        // Update existing application
        updatedApplications = applications.map((app) =>
          app.applicationId === existingApplication.applicationId
            ? applicationData
            : app
        );
      } else {
        // Add new application
        updatedApplications = [...applications, applicationData];
      }

      await saveData("applications", updatedApplications);

      // Update internship stats
      const stats = getData("internshipStats") || [];
      const updatedStats = stats.map((stat) => {
        if (stat.id === internshipId) {
          return {
            ...stat,
            applicationCount:
              (stat.applicationCount || 0) + (existingApplication ? 0 : 1),
            applicants: existingApplication
              ? stat.applicants
              : [...(stat.applicants || []), user.id],
          };
        }
        return stat;
      });
      await saveData("internshipStats", updatedStats);

      // Clear draft
      clearDraft();

      setMessage({
        type: "success",
        text: "Application submitted successfully! You will be redirected shortly.",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/intern/my-applications");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit application:", error);
      setMessage({
        type: "error",
        text: "Failed to submit application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {["Personal", "Academic", "Skills", "Essays", "Review"].map(
          (label, index) => (
            <span
              key={index}
              className={`text-xs ${
                index + 1 <= currentStep
                  ? "text-blue-600 font-medium"
                  : "text-gray-400"
              }`}
            >
              {label}
            </span>
          )
        )}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <IoPersonOutline className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Personal Information
        </h2>
        <p className="text-gray-600 mt-2">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.firstName ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Middle Name
          </label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.lastName ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <IoMailOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <IoCallOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <div className="relative">
          <IoHomeOutline className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Street address"
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.address ? "border-red-300" : "border-gray-300"
            }`}
          />
        </div>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.city ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.state ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <IoSchoolOutline className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Academic Information
        </h2>
        <p className="text-gray-600 mt-2">Tell us about your education</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            University/College *
          </label>
          <input
            type="text"
            name="university"
            value={formData.university}
            onChange={handleInputChange}
            placeholder="e.g., Stanford University"
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.university ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.university && (
            <p className="mt-1 text-sm text-red-600">{errors.university}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Degree *
          </label>
          <select
            name="degree"
            value={formData.degree}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.degree ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">Select Degree</option>
            <option value="Bachelor's">Bachelor's</option>
            <option value="Master's">Master's</option>
            <option value="PhD">PhD</option>
            <option value="Associate">Associate</option>
            <option value="Diploma">Diploma</option>
          </select>
          {errors.degree && (
            <p className="mt-1 text-sm text-red-600">{errors.degree}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Major/Field of Study *
          </label>
          <input
            type="text"
            name="major"
            value={formData.major}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science"
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.major ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.major && (
            <p className="mt-1 text-sm text-red-600">{errors.major}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Year of Study *
          </label>
          <select
            name="currentYear"
            value={formData.currentYear}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.currentYear ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Final Year">Final Year</option>
            <option value="Graduate">Graduate</option>
          </select>
          {errors.currentYear && (
            <p className="mt-1 text-sm text-red-600">{errors.currentYear}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Graduation *
          </label>
          <input
            type="month"
            name="expectedGraduation"
            value={formData.expectedGraduation}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.expectedGraduation ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.expectedGraduation && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expectedGraduation}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current GPA (Optional)
          </label>
          <input
            type="number"
            name="currentGPA"
            value={formData.currentGPA}
            onChange={handleInputChange}
            min="0"
            max="4"
            step="0.01"
            placeholder="e.g., 3.75"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <IoCodeSlashOutline className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Skills & Experience
        </h2>
        <p className="text-gray-600 mt-2">
          Showcase your abilities and background
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technical Skills *
        </label>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Type a skill and press Enter"
            onKeyPress={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                e.preventDefault();
                const newSkill = e.target.value.trim();
                if (!formData.skills.includes(newSkill)) {
                  handleSkillsChange([...formData.skills, newSkill]);
                }
                e.target.value = "";
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => {
                    const newSkills = formData.skills.filter(
                      (_, i) => i !== index
                    );
                    handleSkillsChange(newSkills);
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {errors.skills && (
            <p className="text-sm text-red-600">{errors.skills}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile (Optional)
          </label>
          <div className="relative">
            <IoLogoGithub className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="url"
              name="github"
              value={formData.github}
              onChange={handleInputChange}
              placeholder="https://github.com/yourusername"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile (Optional)
          </label>
          <div className="relative">
            <IoLogoLinkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourusername"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio Website (Optional)
        </label>
        <input
          type="url"
          name="portfolio"
          value={formData.portfolio}
          onChange={handleInputChange}
          placeholder="https://pulkitkrverma.tech"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Previous Experience (Optional)
        </label>
        <textarea
          name="previousExperience"
          value={formData.previousExperience}
          onChange={handleInputChange}
          rows={4}
          placeholder="Describe any relevant work experience, projects, or internships..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Authorization *
          </label>
          <select
            name="workAuthorization"
            value={formData.workAuthorization}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="yes">Authorized to work</option>
            <option value="no">Not authorized to work</option>
            <option value="visa_required">Visa sponsorship required</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Willing to Relocate *
          </label>
          <select
            name="relocate"
            value={formData.relocate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="maybe">Open to discussion</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <IoDocumentTextOutline className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Application Essays</h2>
        <p className="text-gray-600 mt-2">
          Tell us about your motivation and goals
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why are you interested in this internship? *
        </label>
        <textarea
          name="whyInternship"
          value={formData.whyInternship}
          onChange={handleInputChange}
          rows={6}
          placeholder="Explain what interests you about this specific internship opportunity and how it aligns with your career goals..."
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.whyInternship ? "border-red-300" : "border-gray-300"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.whyInternship && (
            <p className="text-sm text-red-600">{errors.whyInternship}</p>
          )}
          <p className="text-xs text-gray-500">
            {formData.whyInternship.length}/500 characters{" "}
            {formData.whyInternship.length < 100 && "(minimum 100)"}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What do you expect to learn from this internship? *
        </label>
        <textarea
          name="expectations"
          value={formData.expectations}
          onChange={handleInputChange}
          rows={5}
          placeholder="Describe what skills, knowledge, and experience you hope to gain..."
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.expectations ? "border-red-300" : "border-gray-300"
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.expectations && (
            <p className="text-sm text-red-600">{errors.expectations}</p>
          )}
          <p className="text-xs text-gray-500">
            {formData.expectations.length}/500 characters{" "}
            {formData.expectations.length < 50 && "(minimum 50)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Availability</option>
            <option value="full-time">Full-time (40+ hours/week)</option>
            <option value="part-time">Part-time (20-30 hours/week)</option>
            <option value="flexible">Flexible schedule</option>
            <option value="weekends">Weekends only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information (Optional)
        </label>
        <textarea
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleInputChange}
          rows={4}
          placeholder="Any additional information you'd like to share..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <IoCloudUploadOutline className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Documents & Review</h2>
        <p className="text-gray-600 mt-2">
          Upload your documents and review your application
        </p>
      </div>

      {/* File Upload Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Upload Documents
        </h3>

        {/* Resume Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Resume *</h4>
            {files.resume ? (
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center text-green-600">
                  <IoCheckmarkCircleOutline className="w-5 h-5 mr-2" />
                  <span className="text-sm">{files.resume.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile("resume")}
                  className="text-red-600 hover:text-red-700"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "resume")}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {fileUploading.resume ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                  )}
                  Upload Resume
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, or DOCX (Max 5MB)
                </p>
              </div>
            )}
            {errors.resume && (
              <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
            )}
          </div>
        </div>

        {/* Cover Letter Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Cover Letter (Optional)
            </h4>
            {files.coverLetter ? (
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center text-green-600">
                  <IoCheckmarkCircleOutline className="w-5 h-5 mr-2" />
                  <span className="text-sm">{files.coverLetter.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile("coverLetter")}
                  className="text-red-600 hover:text-red-700"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "coverLetter")}
                  className="hidden"
                  id="cover-letter-upload"
                />
                <label
                  htmlFor="cover-letter-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {fileUploading.coverLetter ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                  )}
                  Upload Cover Letter
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, or DOCX (Max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Application Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-medium text-gray-700">Name:</p>
            <p className="text-gray-600">
              {`${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Email:</p>
            <p className="text-gray-600">{formData.email}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">University:</p>
            <p className="text-gray-600">{formData.university}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Major:</p>
            <p className="text-gray-600">{formData.major}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Skills:</p>
            <p className="text-gray-600">
              {formData.skills.join(", ") || "None specified"}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Documents:</p>
            <p className="text-gray-600">
              {files.resume ? "Resume uploaded" : "No resume"} •
              {files.coverLetter
                ? " Cover letter uploaded"
                : " No cover letter"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading application form..." />
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <IoWarningOutline className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Internship Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The internship you're looking for doesn't exist or may have been
            removed.
          </p>
          <button
            onClick={() => navigate("/internships")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoArrowBack className="w-4 h-4 mr-2" />
            Back to Internships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <IoArrowBack size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Apply for Internship
            </h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <IoBusinessOutline className="w-4 h-4 mr-1" />
                {internship.title}
              </div>
              <div className="flex items-center">
                <IoLocationOutline className="w-4 h-4 mr-1" />
                {internship.location}
              </div>
              <div className="flex items-center">
                <IoCashOutline className="w-4 h-4 mr-1" />
                {internship.stipend}
              </div>
            </div>
          </div>

          {lastSaved && (
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
              {isAutoSaving && (
                <p className="text-xs text-blue-600 flex items-center">
                  <Spinner size="xs" className="mr-1" />
                  Saving...
                </p>
              )}
            </div>
          )}
        </div>

        {existingApplication && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <IoWarningOutline className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Existing Application Found
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  You have an existing draft application for this internship.
                  You can continue editing or start fresh.
                </p>
              </div>
            </div>
          </div>
        )}
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

      {/* Application Form */}
      <div className="bg-white shadow-lg rounded-lg">
        <div className="p-8">
          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Form Steps */}
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </form>
        </div>

        {/* Navigation Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {/* Left Side */}
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <IoArrowBack className="w-4 h-4 mr-2" />
                  Previous
                </button>
              )}

              <button
                onClick={() => saveDraft()}
                disabled={isAutoSaving || submitting}
                className="inline-flex items-center px-4 py-2 border border-blue-200 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
              >
                {isAutoSaving ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <IoSaveOutline className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                  <IoArrowForward className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipApplication;
