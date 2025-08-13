// src/pages/intern/ApplyForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoCodeSlashOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoSaveOutline,
  IoEyeOutline,
  IoLocationOutline,
  IoMailOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoBusinessOutline,
  IoBriefcaseOutline,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoImageOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
  IoPaperPlaneOutline,
  IoSparklesOutline,
  IoRocketOutline,
  IoTrophyOutline,
  IoHeartOutline,
  IoLightbulbOutline,
} from "react-icons/io5";

const FORM_STEPS = [
  { id: "personal", title: "Personal Information", icon: IoPersonOutline },
  { id: "education", title: "Education & Background", icon: IoSchoolOutline },
  { id: "experience", title: "Skills & Experience", icon: IoBriefcaseOutline },
  { id: "documents", title: "Documents", icon: IoDocumentTextOutline },
  { id: "motivation", title: "Motivation & Goals", icon: IoHeartOutline },
  { id: "review", title: "Review & Submit", icon: IoCheckmarkCircleOutline },
];

const SKILL_CATEGORIES = {
  "Programming Languages": [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "TypeScript",
  ],
  "Web Technologies": [
    "React",
    "Vue.js",
    "Angular",
    "Node.js",
    "HTML5",
    "CSS3",
    "SASS",
    "Bootstrap",
    "Tailwind CSS",
  ],
  Databases: [
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "SQLite",
    "Oracle",
    "SQL Server",
    "Firebase",
  ],
  "Tools & Platforms": [
    "Git",
    "Docker",
    "AWS",
    "Azure",
    "Linux",
    "Windows",
    "macOS",
    "Jenkins",
    "Kubernetes",
  ],
  "Design & UI/UX": [
    "Figma",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
    "Sketch",
    "InVision",
    "Principle",
  ],
  "Data Science & AI": [
    "Machine Learning",
    "Data Analysis",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "R",
    "MATLAB",
  ],
};

const CURRENT_YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year",
  "Graduate",
  "Post-Graduate",
];

const ApplyForm = () => {
  const { user } = useAuth();
  const { internshipId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    middleName: "",
    lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth || "",
    gender: user?.gender || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    zipCode: user?.zipCode || "",
    country: user?.country || "United States",
    profilePhoto: user?.profilePhoto || null,

    // Education & Background
    university: user?.university || "",
    degree: user?.degree || "",
    major: user?.major || "",
    minor: "",
    currentYear: user?.currentYear || "",
    expectedGraduationDate: user?.expectedGraduationDate || "",
    gpa: user?.gpa || "",
    relevantCourses: user?.relevantCourses || [],
    academicAchievements: user?.academicAchievements || [],

    // Skills & Experience
    skills: user?.skills || [],
    programmingLanguages: user?.programmingLanguages || [],
    frameworks: user?.frameworks || [],
    tools: user?.tools || [],
    workExperience: user?.workExperience || [],
    projects: user?.projects || [],
    certifications: user?.certifications || [],

    // Social & Professional Links
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
    website: user?.website || "",

    // Documents
    resume: null,
    coverLetter: null,
    transcript: null,
    // eslint-disable-next-line no-dupe-keys
    portfolio: null,
    additionalDocuments: [],

    // Motivation & Goals
    whyThisInternship: "",
    careerGoals: "",
    learningObjectives: "",
    availableStartDate: "",
    availableEndDate: "",
    preferredWorkArrangement: "hybrid",
    salary_expectations: "",
    additionalInfo: "",

    // References
    references: [],

    // Application metadata
    applicationSource: "website",
    hearAboutUs: "",
    agreeToTerms: false,
    allowBackgroundCheck: false,
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [internshipDetails, setInternshipDetails] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
  });

  // Auto-save functionality
  const [draftKey] = useState(`application_draft_${internshipId}_${user?.id}`);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load internship details
        const internships = getData("internships") || [];
        const internship = internships.find((i) => i.id === internshipId);
        setInternshipDetails(internship);

        // Load draft if exists
        const savedDraft = getData(draftKey);
        if (savedDraft) {
          setFormData((prev) => ({ ...prev, ...savedDraft }));
          setMessage({
            type: "info",
            text: "Draft loaded. You can continue where you left off.",
          });
        }

        // Check if user has already applied
        const applications = getData("applications") || [];
        const existingApplication = applications.find(
          (app) => app.internId === user.id && app.internshipId === internshipId
        );

        if (existingApplication) {
          setMessage({
            type: "warning",
            text: "You have already applied for this internship. You can update your application if needed.",
          });
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setMessage({
          type: "error",
          text: "Failed to load application form. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && internshipId) {
      loadInitialData();
    }
  }, [user, internshipId, draftKey]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const saveInterval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [formData, hasUnsavedChanges, saveDraft]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const saveDraft = useCallback(async () => {
    try {
      await saveData(draftKey, formData);
      setHasUnsavedChanges(false);
      setMessage({ type: "success", text: "Draft saved successfully!" });
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [draftKey, formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleArrayFieldChange = (field, index, subfield, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? { ...item, [subfield]: value } : item
      ),
    }));
  };

  const addArrayField = (field, defaultItem) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { ...defaultItem, id: Date.now() }],
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 10MB" });
      return;
    }

    // Validate file type based on field
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
      profilePhoto: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    };

    if (allowedTypes[field] && !allowedTypes[field].includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file type for this field" });
      return;
    }

    try {
      setUploadProgress((prev) => ({ ...prev, [field]: 0 }));

      const result = await uploadFile(file, `applications/${user.id}`);

      setFormData((prev) => ({
        ...prev,
        [field]: {
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      }));

      setUploadProgress((prev) => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });

      setMessage({ type: "success", text: "File uploaded successfully!" });
    } catch (error) {
      console.error("File upload failed:", error);
      setMessage({
        type: "error",
        text: "File upload failed. Please try again.",
      });
      setUploadProgress((prev) => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};
    const step = FORM_STEPS[stepIndex];

    switch (step.id) {
      case "personal":
        if (!formData.firstName?.trim())
          errors.firstName = "First name is required";
        if (!formData.lastName?.trim())
          errors.lastName = "Last name is required";
        if (!formData.email?.trim()) errors.email = "Email is required";
        if (
          formData.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
          errors.email = "Please enter a valid email address";
        }
        if (!formData.phone?.trim()) errors.phone = "Phone number is required";
        if (!formData.address?.trim()) errors.address = "Address is required";
        if (!formData.city?.trim()) errors.city = "City is required";
        if (!formData.state?.trim()) errors.state = "State is required";
        break;

      case "education":
        if (!formData.university?.trim())
          errors.university = "University is required";
        if (!formData.degree?.trim()) errors.degree = "Degree is required";
        if (!formData.major?.trim()) errors.major = "Major is required";
        if (!formData.currentYear)
          errors.currentYear = "Current year is required";
        if (!formData.expectedGraduationDate)
          errors.expectedGraduationDate =
            "Expected graduation date is required";
        break;

      case "experience":
        if (!formData.skills || formData.skills.length === 0) {
          errors.skills = "Please select at least one skill";
        }
        break;

      case "documents":
        if (!formData.resume) errors.resume = "Resume is required";
        if (!formData.coverLetter)
          errors.coverLetter = "Cover letter is required";
        break;

      case "motivation":
        if (!formData.whyThisInternship?.trim()) {
          errors.whyThisInternship =
            "Please explain why you want this internship";
        }
        if (
          formData.whyThisInternship &&
          formData.whyThisInternship.length < 50
        ) {
          errors.whyThisInternship =
            "Please provide a more detailed explanation (at least 50 characters)";
        }
        if (!formData.careerGoals?.trim())
          errors.careerGoals = "Career goals are required";
        if (!formData.learningObjectives?.trim())
          errors.learningObjectives = "Learning objectives are required";
        if (!formData.availableStartDate)
          errors.availableStartDate = "Start date is required";
        break;

      case "review":
        if (!formData.agreeToTerms)
          errors.agreeToTerms = "You must agree to the terms and conditions";
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    } else {
      setMessage({
        type: "error",
        text: "Please fix the validation errors before proceeding",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (stepIndex) => {
    // Validate all previous steps before allowing jump
    for (let i = 0; i < stepIndex; i++) {
      if (!validateStep(i)) {
        setMessage({
          type: "error",
          text: "Please complete all previous steps before proceeding",
        });
        return;
      }
    }
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    // Final validation
    let hasErrors = false;
    for (let i = 0; i < FORM_STEPS.length; i++) {
      if (!validateStep(i)) {
        hasErrors = true;
        break;
      }
    }

    if (hasErrors) {
      setMessage({
        type: "error",
        text: "Please fix all validation errors before submitting",
      });
      return;
    }

    setSubmitting(true);
    try {
      const applications = getData("applications") || [];

      // Check for duplicate application
      const existingApplication = applications.find(
        (app) => app.internId === user.id && app.internshipId === internshipId
      );

      const applicationData = {
        applicationId:
          existingApplication?.applicationId || `app_${Date.now()}`,
        internId: user.id,
        internshipId: internshipId,
        applicationDate: new Date().toISOString(),
        status: "Submitted",
        lastModified: new Date().toISOString(),
        ...formData,
      };

      let updatedApplications;
      if (existingApplication) {
        // Update existing application
        updatedApplications = applications.map((app) =>
          app.applicationId === existingApplication.applicationId
            ? applicationData
            : app
        );
        setMessage({
          type: "success",
          text: "Application updated successfully!",
        });
      } else {
        // Create new application
        updatedApplications = [...applications, applicationData];
        setMessage({
          type: "success",
          text: "Application submitted successfully!",
        });
      }

      await saveData("applications", updatedApplications);

      // Update internship statistics
      const internshipStats = getData("internshipStats") || [];
      const statIndex = internshipStats.findIndex(
        (stat) => stat.id === internshipId
      );

      if (statIndex !== -1) {
        const updatedStats = [...internshipStats];
        if (!existingApplication) {
          updatedStats[statIndex].applicationCount =
            (updatedStats[statIndex].applicationCount || 0) + 1;
          if (!updatedStats[statIndex].applicants?.includes(user.name)) {
            updatedStats[statIndex].applicants = [
              ...(updatedStats[statIndex].applicants || []),
              user.name,
            ];
          }
        }
        await saveData("internshipStats", updatedStats);
      }

      // Clear draft
      try {
        localStorage.removeItem(draftKey);
      } catch (error) {
        console.error("Failed to clear draft:", error);
      }

      // Navigate to success page or applications list
      setTimeout(() => {
        navigate("/intern/applications", {
          state: { message: "Application submitted successfully!" },
        });
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

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i.toString());
    }
    return years;
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {FORM_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep || validateStep(index);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  isCompleted
                    ? "bg-green-600 border-green-600 text-white"
                    : isActive
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isClickable
                        ? "border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-600"
                        : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <IoCheckmarkCircleOutline className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </button>
              {index < FORM_STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-12 md:w-24 h-1 mx-2 ${
                    index < currentStep ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {FORM_STEPS[currentStep].title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Step {currentStep + 1} of {FORM_STEPS.length}
        </p>
      </div>
    </div>
  );

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Tell us about yourself
        </h3>
        <p className="text-gray-600">
          We'll use this information to personalize your application experience
        </p>
      </div>

      {/* Profile Photo */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {formData.profilePhoto ? (
              <img
                src={
                  typeof formData.profilePhoto === "string"
                    ? formData.profilePhoto
                    : formData.profilePhoto.url
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <IoPersonOutline className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
            <IoImageOutline className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files[0] &&
                handleFileUpload("profilePhoto", e.target.files)
              }
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.firstName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your first name"
          />
          {validationErrors.firstName && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.firstName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Middle Name
          </label>
          <input
            type="text"
            value={formData.middleName}
            onChange={(e) => handleInputChange("middleName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your middle name (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.lastName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your last name"
          />
          {validationErrors.lastName && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.lastName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your email address"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your phone number"
          />
          {validationErrors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select gender (optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.address ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your street address"
            />
            {validationErrors.address && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.address}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.city ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your city"
            />
            {validationErrors.city && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.state ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your state"
            />
            {validationErrors.state && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.state}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your ZIP code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your country"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEducationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Education & Academic Background
        </h3>
        <p className="text-gray-600">
          Help us understand your academic journey and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            University/Institution *
          </label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => handleInputChange("university", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.university ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Stanford University"
          />
          {validationErrors.university && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.university}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Degree Program *
          </label>
          <select
            value={formData.degree}
            onChange={(e) => handleInputChange("degree", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.degree ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select degree program</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctoral Degree">Doctoral Degree</option>
            <option value="Associate Degree">Associate Degree</option>
            <option value="Certificate Program">Certificate Program</option>
          </select>
          {validationErrors.degree && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.degree}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Major/Field of Study *
          </label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) => handleInputChange("major", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.major ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Computer Science"
          />
          {validationErrors.major && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.major}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minor (Optional)
          </label>
          <input
            type="text"
            value={formData.minor}
            onChange={(e) => handleInputChange("minor", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Mathematics"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Year of Study *
          </label>
          <select
            value={formData.currentYear}
            onChange={(e) => handleInputChange("currentYear", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.currentYear
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            <option value="">Select current year</option>
            {CURRENT_YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {validationErrors.currentYear && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.currentYear}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Graduation Date *
          </label>
          <input
            type="month"
            value={formData.expectedGraduationDate}
            onChange={(e) =>
              handleInputChange("expectedGraduationDate", e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.expectedGraduationDate
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {validationErrors.expectedGraduationDate && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.expectedGraduationDate}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GPA (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4.0"
            value={formData.gpa}
            onChange={(e) => handleInputChange("gpa", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 3.75"
          />
        </div>
      </div>

      {/* Relevant Courses */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">
            Relevant Courses
          </h4>
          <button
            type="button"
            onClick={() =>
              addArrayField("relevantCourses", {
                name: "",
                grade: "",
                semester: "",
              })
            }
            className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            <IoAddOutline className="w-4 h-4 mr-1" />
            Add Course
          </button>
        </div>

        {formData.relevantCourses?.map((course, index) => (
          <div
            key={course.id || index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg"
          >
            <div className="md:col-span-2">
              <input
                type="text"
                value={course.name}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "relevantCourses",
                    index,
                    "name",
                    e.target.value
                  )
                }
                placeholder="Course name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={course.grade}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "relevantCourses",
                    index,
                    "grade",
                    e.target.value
                  )
                }
                placeholder="Grade (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={course.semester}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "relevantCourses",
                    index,
                    "semester",
                    e.target.value
                  )
                }
                placeholder="Semester"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => removeArrayField("relevantCourses", index)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Academic Achievements */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">
            Academic Achievements
          </h4>
          <button
            type="button"
            onClick={() =>
              addArrayField("academicAchievements", {
                title: "",
                description: "",
                date: "",
              })
            }
            className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            <IoAddOutline className="w-4 h-4 mr-1" />
            Add Achievement
          </button>
        </div>

        {formData.academicAchievements?.map((achievement, index) => (
          <div
            key={achievement.id || index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <input
                type="text"
                value={achievement.title}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "academicAchievements",
                    index,
                    "title",
                    e.target.value
                  )
                }
                placeholder="Achievement title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={achievement.date}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "academicAchievements",
                    index,
                    "date",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-start space-x-2">
              <textarea
                value={achievement.description}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "academicAchievements",
                    index,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Description"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => removeArrayField("academicAchievements", index)}
                className="text-red-600 hover:text-red-700 p-2 mt-1"
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Skills & Experience
        </h3>
        <p className="text-gray-600">
          Showcase your technical skills and professional experience
        </p>
      </div>

      {/* Skills Section */}
      <div className="border-b border-gray-200 pb-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Technical Skills *
        </h4>
        {validationErrors.skills && (
          <p className="text-red-500 text-sm mb-4">{validationErrors.skills}</p>
        )}

        {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
          <div key={category} className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              {category}
            </h5>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    const currentSkills = formData.skills || [];
                    const updatedSkills = currentSkills.includes(skill)
                      ? currentSkills.filter((s) => s !== skill)
                      : [...currentSkills, skill];
                    handleInputChange("skills", updatedSkills);
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    formData.skills?.includes(skill)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Custom Skills */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Skills (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., Docker, Kubernetes, GraphQL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const skill = e.target.value.trim();
                if (skill && !formData.skills?.includes(skill)) {
                  handleInputChange("skills", [
                    ...(formData.skills || []),
                    skill,
                  ]);
                  e.target.value = "";
                }
              }
            }}
          />
        </div>
      </div>

      {/* Work Experience */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Work Experience</h4>
          <button
            type="button"
            onClick={() =>
              addArrayField("workExperience", {
                company: "",
                position: "",
                startDate: "",
                endDate: "",
                description: "",
                isCurrent: false,
              })
            }
            className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            <IoAddOutline className="w-4 h-4 mr-1" />
            Add Experience
          </button>
        </div>

        {formData.workExperience?.map((experience, index) => (
          <div
            key={experience.id || index}
            className="mb-6 p-4 border border-gray-200 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={experience.company}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "workExperience",
                      index,
                      "company",
                      e.target.value
                    )
                  }
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={experience.position}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "workExperience",
                      index,
                      "position",
                      e.target.value
                    )
                  }
                  placeholder="Job title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "workExperience",
                      index,
                      "startDate",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="month"
                    value={experience.endDate}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "workExperience",
                        index,
                        "endDate",
                        e.target.value
                      )
                    }
                    disabled={experience.isCurrent}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={experience.isCurrent}
                      onChange={(e) => {
                        handleArrayFieldChange(
                          "workExperience",
                          index,
                          "isCurrent",
                          e.target.checked
                        );
                        if (e.target.checked) {
                          handleArrayFieldChange(
                            "workExperience",
                            index,
                            "endDate",
                            ""
                          );
                        }
                      }}
                      className="mr-1"
                    />
                    Current
                  </label>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={experience.description}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "workExperience",
                    index,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe your responsibilities and achievements"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeArrayField("workExperience", index)}
                className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                <IoTrashOutline className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Projects</h4>
          <button
            type="button"
            onClick={() =>
              addArrayField("projects", {
                name: "",
                description: "",
                technologies: "",
                githubLink: "",
                liveLink: "",
                startDate: "",
                endDate: "",
              })
            }
            className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            <IoAddOutline className="w-4 h-4 mr-1" />
            Add Project
          </button>
        </div>

        {formData.projects?.map((project, index) => (
          <div
            key={project.id || index}
            className="mb-6 p-4 border border-gray-200 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "projects",
                      index,
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technologies Used
                </label>
                <input
                  type="text"
                  value={project.technologies}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "projects",
                      index,
                      "technologies",
                      e.target.value
                    )
                  }
                  placeholder="e.g., React, Node.js, MongoDB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Link
                </label>
                <input
                  type="url"
                  value={project.githubLink}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "projects",
                      index,
                      "githubLink",
                      e.target.value
                    )
                  }
                  placeholder="https://github.com/username/project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Live Demo Link
                </label>
                <input
                  type="url"
                  value={project.liveLink}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "projects",
                      index,
                      "liveLink",
                      e.target.value
                    )
                  }
                  placeholder="https://project-demo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                value={project.description}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "projects",
                    index,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe the project, its purpose, and your contributions"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeArrayField("projects", index)}
                className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                <IoTrashOutline className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Professional Links */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Professional Links
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IoLogoGithub className="inline w-4 h-4 mr-1" />
              GitHub Profile
            </label>
            <input
              type="url"
              value={formData.github}
              onChange={(e) => handleInputChange("github", e.target.value)}
              placeholder="https://github.com/username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IoLogoLinkedin className="inline w-4 h-4 mr-1" />
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => handleInputChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IoGlobeOutline className="inline w-4 h-4 mr-1" />
              Portfolio Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://pulkitkrverma.tech"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Required Documents
        </h3>
        <p className="text-gray-600">
          Upload the necessary documents to complete your application
        </p>
      </div>

      {/* Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              formData.resume
                ? "border-green-300 bg-green-50"
                : validationErrors.resume
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {uploadProgress.resume !== undefined ? (
              <div className="flex items-center justify-center">
                <Spinner size="sm" className="mr-2" />
                <span className="text-sm text-gray-600">
                  Uploading... {uploadProgress.resume}%
                </span>
              </div>
            ) : formData.resume ? (
              <div className="flex flex-col items-center">
                <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-700">
                  {formData.resume.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => handleInputChange("resume", null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    e.target.files[0] &&
                    handleFileUpload("resume", e.target.files)
                  }
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <IoDocumentTextOutline className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">
                    Upload Resume
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </label>
              </>
            )}
          </div>
          {validationErrors.resume && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.resume}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              formData.coverLetter
                ? "border-green-300 bg-green-50"
                : validationErrors.coverLetter
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {uploadProgress.coverLetter !== undefined ? (
              <div className="flex items-center justify-center">
                <Spinner size="sm" className="mr-2" />
                <span className="text-sm text-gray-600">
                  Uploading... {uploadProgress.coverLetter}%
                </span>
              </div>
            ) : formData.coverLetter ? (
              <div className="flex flex-col items-center">
                <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-700">
                  {formData.coverLetter.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.coverLetter.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => handleInputChange("coverLetter", null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    e.target.files[0] &&
                    handleFileUpload("coverLetter", e.target.files)
                  }
                  className="hidden"
                  id="cover-letter-upload"
                />
                <label htmlFor="cover-letter-upload" className="cursor-pointer">
                  <IoDocumentTextOutline className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">
                    Upload Cover Letter
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </label>
              </>
            )}
          </div>
          {validationErrors.coverLetter && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.coverLetter}
            </p>
          )}
        </div>
      </div>

      {/* Optional Documents */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Optional Documents
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Transcript
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                formData.transcript
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {uploadProgress.transcript !== undefined ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-gray-600">
                    Uploading... {uploadProgress.transcript}%
                  </span>
                </div>
              ) : formData.transcript ? (
                <div className="flex flex-col items-center">
                  <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-700">
                    {formData.transcript.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.transcript.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInputChange("transcript", null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      e.target.files[0] &&
                      handleFileUpload("transcript", e.target.files)
                    }
                    className="hidden"
                    id="transcript-upload"
                  />
                  <label htmlFor="transcript-upload" className="cursor-pointer">
                    <IoDocumentTextOutline className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      Upload Transcript
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF up to 10MB</p>
                  </label>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio/Work Samples
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                formData.portfolioFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {uploadProgress.portfolioFile !== undefined ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-gray-600">
                    Uploading... {uploadProgress.portfolioFile}%
                  </span>
                </div>
              ) : formData.portfolioFile ? (
                <div className="flex flex-col items-center">
                  <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-700">
                    {formData.portfolioFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.portfolioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInputChange("portfolioFile", null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,.zip,.rar"
                    onChange={(e) =>
                      e.target.files[0] &&
                      handleFileUpload("portfolioFile", e.target.files)
                    }
                    className="hidden"
                    id="portfolio-upload"
                  />
                  <label htmlFor="portfolio-upload" className="cursor-pointer">
                    <IoDocumentTextOutline className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      Upload Portfolio
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, ZIP, RAR up to 10MB
                    </p>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMotivationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Motivation & Goals
        </h3>
        <p className="text-gray-600">
          Help us understand your passion and aspirations for this internship
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why do you want this internship? *
          </label>
          <textarea
            value={formData.whyThisInternship}
            onChange={(e) =>
              handleInputChange("whyThisInternship", e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.whyThisInternship
                ? "border-red-500"
                : "border-gray-300"
            }`}
            rows="4"
            placeholder="Explain what motivates you to apply for this specific internship. What excites you about this role and our company?"
          />
          <div className="flex justify-between items-center mt-1">
            {validationErrors.whyThisInternship && (
              <p className="text-red-500 text-sm">
                {validationErrors.whyThisInternship}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {formData.whyThisInternship?.length || 0}/500 characters
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Career Goals *
          </label>
          <textarea
            value={formData.careerGoals}
            onChange={(e) => handleInputChange("careerGoals", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.careerGoals
                ? "border-red-500"
                : "border-gray-300"
            }`}
            rows="3"
            placeholder="Describe your short-term and long-term career goals. How does this internship align with your career aspirations?"
          />
          {validationErrors.careerGoals && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.careerGoals}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives *
          </label>
          <textarea
            value={formData.learningObjectives}
            onChange={(e) =>
              handleInputChange("learningObjectives", e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.learningObjectives
                ? "border-red-500"
                : "border-gray-300"
            }`}
            rows="3"
            placeholder="What specific skills, knowledge, or experiences do you hope to gain from this internship?"
          />
          {validationErrors.learningObjectives && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.learningObjectives}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Start Date *
            </label>
            <input
              type="date"
              value={formData.availableStartDate}
              onChange={(e) =>
                handleInputChange("availableStartDate", e.target.value)
              }
              min={new Date().toISOString().split("T")[0]}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.availableStartDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {validationErrors.availableStartDate && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.availableStartDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available End Date
            </label>
            <input
              type="date"
              value={formData.availableEndDate}
              onChange={(e) =>
                handleInputChange("availableEndDate", e.target.value)
              }
              min={
                formData.availableStartDate ||
                new Date().toISOString().split("T")[0]
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Work Arrangement
          </label>
          <select
            value={formData.preferredWorkArrangement}
            onChange={(e) =>
              handleInputChange("preferredWorkArrangement", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Expectations (Optional)
          </label>
          <input
            type="text"
            value={formData.salary_expectations}
            onChange={(e) =>
              handleInputChange("salary_expectations", e.target.value)
            }
            placeholder="e.g., $15-20/hour or Unpaid for experience"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={formData.additionalInfo}
            onChange={(e) =>
              handleInputChange("additionalInfo", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Is there anything else you'd like us to know about you or your application?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.hearAboutUs}
            onChange={(e) => handleInputChange("hearAboutUs", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            <option value="university-career-center">
              University Career Center
            </option>
            <option value="job-board">Job Board</option>
            <option value="social-media">Social Media</option>
            <option value="referral">Referral from friend/colleague</option>
            <option value="company-website">Company Website</option>
            <option value="career-fair">Career Fair</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Review Your Application
        </h3>
        <p className="text-gray-600">
          Please review all information before submitting your application
        </p>
      </div>

      {/* Application Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Personal Information</h4>
            <p className="text-sm text-gray-600">
              {formData.firstName} {formData.lastName}
            </p>
            <p className="text-sm text-gray-600">{formData.email}</p>
            <p className="text-sm text-gray-600">{formData.phone}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Education</h4>
            <p className="text-sm text-gray-600">{formData.university}</p>
            <p className="text-sm text-gray-600">
              {formData.major} - {formData.currentYear}
            </p>
            <p className="text-sm text-gray-600">
              Graduating: {formData.expectedGraduationDate}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900">Selected Skills</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills?.slice(0, 10).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {formData.skills?.length > 10 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{formData.skills.length - 10} more
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900">Documents</h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <IoCheckmarkCircleOutline
                className={`w-4 h-4 mr-2 ${formData.resume ? "text-green-600" : "text-gray-400"}`}
              />
              Resume: {formData.resume ? formData.resume.name : "Not uploaded"}
            </p>
            <p className="text-sm text-gray-600 flex items-center">
              <IoCheckmarkCircleOutline
                className={`w-4 h-4 mr-2 ${formData.coverLetter ? "text-green-600" : "text-gray-400"}`}
              />
              Cover Letter:{" "}
              {formData.coverLetter
                ? formData.coverLetter.name
                : "Not uploaded"}
            </p>
            {formData.transcript && (
              <p className="text-sm text-gray-600 flex items-center">
                <IoCheckmarkCircleOutline className="w-4 h-4 mr-2 text-green-600" />
                Transcript: {formData.transcript.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) =>
                handleInputChange("agreeToTerms", e.target.checked)
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
            />
            <label className="ml-2 text-sm text-gray-700">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </a>
              . I understand that the information provided in this application
              is accurate and complete. *
            </label>
          </div>
          {validationErrors.agreeToTerms && (
            <p className="text-red-500 text-sm ml-6">
              {validationErrors.agreeToTerms}
            </p>
          )}

          <div className="flex items-start">
            <input
              type="checkbox"
              checked={formData.allowBackgroundCheck}
              onChange={(e) =>
                handleInputChange("allowBackgroundCheck", e.target.checked)
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
            />
            <label className="ml-2 text-sm text-gray-700">
              I authorize the company to conduct background checks as deemed
              necessary for this internship position.
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Spinner size="sm" color="white" className="mr-2" />
              Submitting Application...
            </>
          ) : (
            <>
              <IoPaperPlaneOutline className="w-5 h-5 mr-2" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (FORM_STEPS[currentStep].id) {
      case "personal":
        return renderPersonalStep();
      case "education":
        return renderEducationStep();
      case "experience":
        return renderExperienceStep();
      case "documents":
        return renderDocumentsStep();
      case "motivation":
        return renderMotivationStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading application form..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <IoArrowBackOutline className="w-4 h-4 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Internship Application
            </h1>
          </div>
          {internshipDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900">
                {internshipDetails.title}
              </h2>
              <p className="text-blue-700">
                {internshipDetails.company || "Aninex Global"}
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : message.type === "info"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={
                message.type === "success"
                  ? "text-green-700"
                  : message.type === "info"
                    ? "text-blue-700"
                    : "text-red-700"
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Auto-save indicator */}
        {hasUnsavedChanges && (
          <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-md text-sm">
            <IoWarningOutline className="inline w-4 h-4 mr-1" />
            Unsaved changes
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoArrowBackOutline className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IoSaveOutline className="w-4 h-4 mr-2" />
                    Save Draft
                  </>
                )}
              </button>
            </div>

            {currentStep < FORM_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Next
                <IoArrowForwardOutline className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                Review your application above and click Submit when ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, type: null, title: "", message: "" })
        }
        onConfirm={() => {
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
          });
          // Handle confirmation action based on type
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ApplyForm;
