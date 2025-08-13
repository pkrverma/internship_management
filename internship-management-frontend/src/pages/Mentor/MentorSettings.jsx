// src/pages/mentor/MentorSettings.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoTimeOutline,
  IoStarOutline,
  IoGlobeOutline,
  IoDocumentTextOutline,
  IoAnalyticsOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoLogoTwitter,
  IoKeyOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoSaveOutline,
  IoRefreshOutline,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoCloseOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoCopyOutline,
  IoShareOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoRocketOutline,
  IoTrophyOutline,
  IoHeartOutline,
  IoLightbulbOutline,
  IoBriefcaseOutline,
  IoLibraryOutline,
  IoBookOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLanguageOutline,
  IoAccessibilityOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoCloseCircleOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoRadioButtonOffOutline,
  IoEllipsisVerticalOutline,
  IoPeopleOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoSparklesOutline,
} from "react-icons/io5";

const TABS_CONFIG = [
  {
    id: "profile",
    name: "Professional Profile",
    icon: IoPersonOutline,
    description: "Basic profile and contact information",
  },
  {
    id: "expertise",
    name: "Expertise & Skills",
    icon: IoStarOutline,
    description: "Areas of expertise and mentoring focus",
  },
  {
    id: "availability",
    name: "Availability",
    icon: IoCalendarOutline,
    description: "Schedule and availability settings",
  },
  {
    id: "mentoring",
    name: "Mentoring Preferences",
    icon: IoHeartOutline,
    description: "Mentoring style and methodology",
  },
  {
    id: "social",
    name: "Social & Professional",
    icon: IoGlobeOutline,
    description: "Social media and professional links",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: IoNotificationsOutline,
    description: "Notification preferences",
  },
  {
    id: "privacy",
    name: "Privacy & Visibility",
    icon: IoShieldCheckmarkOutline,
    description: "Privacy and profile visibility",
  },
  {
    id: "preferences",
    name: "App Preferences",
    icon: IoSettingsOutline,
    description: "Interface and app customization",
  },
  {
    id: "security",
    name: "Security",
    icon: IoLockClosedOutline,
    description: "Password and security settings",
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    icon: IoAnalyticsOutline,
    description: "Performance tracking and insights",
  },
];

const EXPERTISE_AREAS = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "Design (UI/UX)",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "HR & People",
  "Strategy",
  "Machine Learning",
  "DevOps",
  "Cybersecurity",
  "Mobile Development",
  "Web Development",
  "Cloud Computing",
  "Blockchain",
  "AI/ML",
  "Business Development",
  "Entrepreneurship",
  "Leadership",
  "Career Development",
];

const MENTORING_STYLES = [
  {
    id: "directive",
    name: "Directive",
    description: "Provide clear guidance and specific instructions",
  },
  {
    id: "collaborative",
    name: "Collaborative",
    description: "Work together to find solutions",
  },
  {
    id: "supportive",
    name: "Supportive",
    description: "Encourage and provide emotional support",
  },
  {
    id: "delegative",
    name: "Delegative",
    description: "Allow mentee to take initiative with minimal guidance",
  },
  {
    id: "coaching",
    name: "Coaching",
    description: "Ask questions to help mentee find their own answers",
  },
  {
    id: "teaching",
    name: "Teaching",
    description: "Focus on knowledge transfer and skill development",
  },
];

const AVAILABILITY_PATTERNS = [
  { day: "Monday", key: "monday" },
  { day: "Tuesday", key: "tuesday" },
  { day: "Wednesday", key: "wednesday" },
  { day: "Thursday", key: "thursday" },
  { day: "Friday", key: "friday" },
  { day: "Saturday", key: "saturday" },
  { day: "Sunday", key: "sunday" },
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
];

const NOTIFICATION_CATEGORIES = {
  meetings: "Meeting Reminders",
  messages: "New Messages",
  applications: "New Applications",
  documents: "Document Shares",
  feedback: "Feedback Requests",
  announcements: "System Announcements",
  weekly_summary: "Weekly Summary",
  mentee_progress: "Mentee Progress Updates",
};

const THEMES = {
  light: {
    name: "Light",
    icon: IoSunnyOutline,
    preview: "bg-white text-gray-900",
  },
  dark: {
    name: "Dark",
    icon: IoMoonOutline,
    preview: "bg-gray-900 text-white",
  },
  system: {
    name: "System",
    icon: IoSettingsOutline,
    preview: "bg-gradient-to-r from-white to-gray-900",
  },
};

const LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

const MentorSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Professional Profile
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    title: user?.title || "",
    company: user?.company || "",
    department: user?.department || "",
    bio: user?.bio || "",
    profilePictureUrl: user?.profilePictureUrl || null,

    // Professional Details
    yearsOfExperience: user?.yearsOfExperience || "",
    currentRole: user?.currentRole || "",
    industry: user?.industry || "",
    location: user?.location || "",
    timezone:
      user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Expertise & Skills
    expertiseAreas: user?.expertiseAreas || [],
    skillsOffered: user?.skillsOffered || [],
    certifications: user?.certifications || [],
    achievements: user?.achievements || [],

    // Mentoring Preferences
    mentoringStyle: user?.mentoringStyle || "collaborative",
    maxMentees: user?.maxMentees || 5,
    sessionDuration: user?.sessionDuration || 60,
    meetingFrequency: user?.meetingFrequency || "weekly",
    mentoringGoals: user?.mentoringGoals || [],
    specializations: user?.specializations || [],

    // Availability
    availability: user?.availability || {
      monday: { available: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
      thursday: { available: true, startTime: "09:00", endTime: "17:00" },
      friday: { available: true, startTime: "09:00", endTime: "17:00" },
      saturday: { available: false, startTime: "09:00", endTime: "17:00" },
      sunday: { available: false, startTime: "09:00", endTime: "17:00" },
    },
    bufferTime: user?.bufferTime || 15,
    advanceBooking: user?.advanceBooking || 7,

    // Social & Professional Links
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    twitter: user?.twitter || "",
    portfolio: user?.portfolio || "",
    website: user?.website || "",

    // Notifications
    notifications: user?.notifications || {
      email: {
        meetings: true,
        messages: true,
        applications: true,
        documents: true,
        feedback: true,
        announcements: true,
        weekly_summary: true,
        mentee_progress: true,
      },
      push: {
        meetings: true,
        messages: true,
        applications: false,
        documents: false,
        feedback: true,
        announcements: false,
        weekly_summary: false,
        mentee_progress: true,
      },
      sms: {
        meetings: false,
        messages: false,
        applications: false,
        documents: false,
        feedback: false,
        announcements: false,
        weekly_summary: false,
        mentee_progress: false,
      },
    },

    // Privacy Settings
    profileVisibility: user?.profileVisibility || "mentees",
    showEmail: user?.showEmail || false,
    showPhone: user?.showPhone || false,
    allowDirectMessages: user?.allowDirectMessages || "mentees",
    showInDirectory: user?.showInDirectory || true,
    shareAnalytics: user?.shareAnalytics || false,

    // App Preferences
    theme: user?.theme || "system",
    language: user?.language || "en",
    fontSize: user?.fontSize || "medium",
    reducedMotion: user?.reducedMotion || false,
    highContrast: user?.highContrast || false,

    // Analytics Preferences
    trackingEnabled: user?.trackingEnabled || true,
    analyticsSharing: user?.analyticsSharing || "organization",
    performanceMetrics: user?.performanceMetrics || true,

    // Security
    twoFactorEnabled: user?.twoFactorEnabled || false,
    loginAlerts: user?.loginAlerts || true,
    sessionTimeout: user?.sessionTimeout || 60,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Refs
  const fileInputRef = useRef(null);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const savedSettings = getData(`mentor_settings_${user?.id}`);
        if (savedSettings) {
          setFormData((prev) => ({ ...prev, ...savedSettings }));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(true);
  }, [formData, passwordData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object" &&
        prev[section] !== null &&
        !Array.isArray(prev[section])
          ? { ...prev[section], [field]: value }
          : value,
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    setUploading(true);

    try {
      const result = await uploadFile(file, `profiles/${user?.id}`);

      setFormData((prev) => ({
        ...prev,
        profilePictureUrl: result.url,
      }));

      setMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({
        type: "error",
        text: "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength)
      return "Password must be at least 8 characters long";
    if (!hasUpperCase)
      return "Password must contain at least one uppercase letter";
    if (!hasLowerCase)
      return "Password must contain at least one lowercase letter";
    if (!hasNumbers) return "Password must contain at least one number";
    if (!hasSpecialChar)
      return "Password must contain at least one special character";

    return null;
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage({ type: "error", text: passwordError });
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage({
        type: "error",
        text: "Failed to change password. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveData(`mentor_settings_${user.id}`, formData);

      if (updateUser) {
        updateUser({ ...user, ...formData });
      }

      setUnsavedChanges(false);
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score < 2)
      return { strength: "Weak", color: "text-red-600", bgColor: "bg-red-200" };
    if (score < 4)
      return {
        strength: "Medium",
        color: "text-yellow-600",
        bgColor: "bg-yellow-200",
      };
    return {
      strength: "Strong",
      color: "text-green-600",
      bgColor: "bg-green-200",
    };
  };

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Picture */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Profile Picture
        </h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <ProfileAvatar
              user={{
                profilePictureUrl: formData.profilePictureUrl,
                name: `${formData.firstName} ${formData.lastName}`,
              }}
              size="xl"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Spinner size="sm" color="white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files[0] && handleFileUpload(e.target.files)
              }
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <IoCloudUploadOutline className="w-4 h-4 mr-2" />
              Upload New Picture
            </button>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG up to 5MB. Recommended: 200x200px
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Tech Solutions Inc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            value={formData.yearsOfExperience}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                yearsOfExperience: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select experience</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="11-15">11-15 years</option>
            <option value="16+">16+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your professional background, experience, and what drives your passion for mentoring..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.bio.length}/1000 characters
        </p>
      </div>
    </div>
  );

  const renderExpertiseTab = () => (
    <div className="space-y-8">
      {/* Areas of Expertise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Areas of Expertise
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EXPERTISE_AREAS.map((area) => (
            <label key={area} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.expertiseAreas.includes(area)}
                onChange={(e) => {
                  const newAreas = e.target.checked
                    ? [...formData.expertiseAreas, area]
                    : formData.expertiseAreas.filter((a) => a !== area);
                  handleArrayChange("expertiseAreas", newAreas);
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{area}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skills Offered */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills You Can Teach
        </label>
        <textarea
          value={formData.skillsOffered.join(", ")}
          onChange={(e) =>
            handleArrayChange(
              "skillsOffered",
              e.target.value.split(", ").filter((s) => s.trim())
            )
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., React, Node.js, System Design, Leadership, Project Management (separate with commas)"
        />
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certifications & Credentials
        </label>
        <textarea
          value={formData.certifications.join("\n")}
          onChange={(e) =>
            handleArrayChange(
              "certifications",
              e.target.value.split("\n").filter((c) => c.trim())
            )
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="List your professional certifications (one per line)"
        />
      </div>

      {/* Achievements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key Achievements
        </label>
        <textarea
          value={formData.achievements.join("\n")}
          onChange={(e) =>
            handleArrayChange(
              "achievements",
              e.target.value.split("\n").filter((a) => a.trim())
            )
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your professional accomplishments and notable achievements (one per line)"
        />
      </div>
    </div>
  );

  const renderAvailabilityTab = () => (
    <div className="space-y-8">
      {/* General Availability Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer Time Between Meetings (minutes)
          </label>
          <select
            value={formData.bufferTime}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                bufferTime: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>No buffer</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advance Booking (days)
          </label>
          <select
            value={formData.advanceBooking}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                advanceBooking: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
          </select>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Weekly Schedule
        </h3>
        <div className="space-y-4">
          {AVAILABILITY_PATTERNS.map(({ day, key }) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.availability[key]?.available || false}
                    onChange={(e) =>
                      handleAvailabilityChange(
                        key,
                        "available",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{day}</span>
                </label>
              </div>

              {formData.availability[key]?.available && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <select
                      value={formData.availability[key]?.startTime || "09:00"}
                      onChange={(e) =>
                        handleAvailabilityChange(
                          key,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <select
                      value={formData.availability[key]?.endTime || "17:00"}
                      onChange={(e) =>
                        handleAvailabilityChange(key, "endTime", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMentoringTab = () => (
    <div className="space-y-8">
      {/* Mentoring Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Mentoring Style
        </label>
        <div className="space-y-3">
          {MENTORING_STYLES.map((style) => (
            <label key={style.id} className="flex items-start space-x-3">
              <input
                type="radio"
                name="mentoringStyle"
                value={style.id}
                checked={formData.mentoringStyle === style.id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mentoringStyle: e.target.value,
                  }))
                }
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">{style.name}</div>
                <div className="text-sm text-gray-500">{style.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Mentoring Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Number of Mentees
          </label>
          <select
            value={formData.maxMentees}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maxMentees: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num} mentee{num > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Session Duration
          </label>
          <select
            value={formData.sessionDuration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sessionDuration: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Frequency
          </label>
          <select
            value={formData.meetingFrequency}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                meetingFrequency: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>

      {/* Mentoring Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Mentoring Goals
        </label>
        <textarea
          value={formData.mentoringGoals.join("\n")}
          onChange={(e) =>
            handleArrayChange(
              "mentoringGoals",
              e.target.value.split("\n").filter((g) => g.trim())
            )
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="What do you hope to achieve as a mentor? (one goal per line)"
        />
      </div>

      {/* Specializations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mentoring Specializations
        </label>
        <textarea
          value={formData.specializations.join(", ")}
          onChange={(e) =>
            handleArrayChange(
              "specializations",
              e.target.value.split(", ").filter((s) => s.trim())
            )
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Career Development, Technical Skills, Leadership, Interview Preparation (separate with commas)"
        />
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <IoLogoGithub className="w-5 h-5 mr-2" />
            GitHub Profile
          </label>
          <input
            type="url"
            value={formData.github}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, github: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/username"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <IoLogoLinkedin className="w-5 h-5 mr-2" />
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={formData.linkedin}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, linkedin: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <IoLogoTwitter className="w-5 h-5 mr-2" />
            Twitter Profile
          </label>
          <input
            type="url"
            value={formData.twitter}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, twitter: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://twitter.com/username"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <IoBusinessOutline className="w-5 h-5 mr-2" />
            Portfolio Website
          </label>
          <input
            type="url"
            value={formData.portfolio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, portfolio: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://pulkitkrverma.tech"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <IoGlobeOutline className="w-5 h-5 mr-2" />
            Personal Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, website: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      {["email", "push", "sms"].map((type) => (
        <div key={type} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            {type === "email" && (
              <IoMailOutline className="w-5 h-5 text-gray-600 mr-3" />
            )}
            {type === "push" && (
              <IoPhonePortraitOutline className="w-5 h-5 text-gray-600 mr-3" />
            )}
            {type === "sms" && (
              <IoPhonePortraitOutline className="w-5 h-5 text-gray-600 mr-3" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {type.charAt(0).toUpperCase() + type.slice(1)} Notifications
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(NOTIFICATION_CATEGORIES).map(
              ([category, label]) => (
                <label
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={formData.notifications[type]?.[category] || false}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [type]: {
                            ...prev.notifications[type],
                            [category]: e.target.checked,
                          },
                        },
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Profile Visibility
        </h3>
        <div className="space-y-3">
          {[
            {
              value: "public",
              label: "Public",
              description: "Anyone can view your mentor profile",
            },
            {
              value: "mentees",
              label: "Mentees Only",
              description: "Only your assigned mentees can view your profile",
            },
            {
              value: "organization",
              label: "Organization Only",
              description:
                "Only members of your organization can view your profile",
            },
            {
              value: "private",
              label: "Private",
              description: "Only you can view your profile",
            },
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                name="profileVisibility"
                value={option.value}
                checked={formData.profileVisibility === option.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profileVisibility: e.target.value,
                  }))
                }
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Show Email Address
              </div>
              <div className="text-sm text-gray-500">
                Allow others to see your email address
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.showEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  showEmail: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Show Phone Number
              </div>
              <div className="text-sm text-gray-500">
                Allow others to see your phone number
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.showPhone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  showPhone: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Directory & Discovery
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Show in Mentor Directory
              </div>
              <div className="text-sm text-gray-500">
                Allow your profile to appear in mentor search results
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.showInDirectory}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  showInDirectory: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-8">
      {/* Theme Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(THEMES).map(([key, theme]) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, theme: key }))
                    }
                    className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                      formData.theme === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{theme.name}</div>
                      <div
                        className={`w-8 h-2 rounded mt-1 ${theme.preview}`}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={formData.fontSize}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fontSize: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Accessibility
        </h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.reducedMotion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  reducedMotion: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Reduce Motion
              </div>
              <div className="text-sm text-gray-500">
                Minimize animations and transitions
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.highContrast}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  highContrast: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                High Contrast
              </div>
              <div className="text-sm text-gray-500">
                Increase color contrast for better readability
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-8">
      {/* Password Change */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <IoEyeOffOutline className="w-4 h-4 text-gray-400" />
                ) : (
                  <IoEyeOutline className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <IoEyeOffOutline className="w-4 h-4 text-gray-400" />
                ) : (
                  <IoEyeOutline className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {passwordData.newPassword && (
              <div className="mt-2">
                {(() => {
                  const strength = getPasswordStrength(
                    passwordData.newPassword
                  );
                  return (
                    <div className="flex items-center space-x-2">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${strength.bgColor} ${strength.color}`}
                      >
                        {strength.strength}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <IoEyeOffOutline className="w-4 h-4 text-gray-400" />
                ) : (
                  <IoEyeOutline className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={
              saving ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Spinner size="sm" color="white" className="mr-2" />
                Changing...
              </>
            ) : (
              <>
                <IoKeyOutline className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.twoFactorEnabled}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  twoFactorEnabled: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Login Alerts */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Login Alerts</h3>
            <p className="text-sm text-gray-500">
              Get notified when someone logs into your account
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.loginAlerts}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  loginAlerts: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      {/* Analytics Preferences */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Analytics & Tracking
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Enable Performance Tracking
              </div>
              <div className="text-sm text-gray-500">
                Track your mentoring effectiveness and progress
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.trackingEnabled}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  trackingEnabled: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Share Performance Metrics
              </div>
              <div className="text-sm text-gray-500">
                Allow aggregated metrics to be shared with your organization
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.performanceMetrics}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  performanceMetrics: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Data Sharing */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Sharing</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analytics Sharing Level
          </label>
          <select
            value={formData.analyticsSharing}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                analyticsSharing: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">No sharing</option>
            <option value="organization">Organization only</option>
            <option value="platform">Platform-wide (anonymized)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Choose how your analytics data can be used to improve the mentoring
            platform
          </p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "expertise":
        return renderExpertiseTab();
      case "availability":
        return renderAvailabilityTab();
      case "mentoring":
        return renderMentoringTab();
      case "social":
        return renderSocialTab();
      case "notifications":
        return renderNotificationsTab();
      case "privacy":
        return renderPrivacyTab();
      case "preferences":
        return renderPreferencesTab();
      case "security":
        return renderSecurityTab();
      case "analytics":
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mentor Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your mentoring profile, preferences, and account settings
        </p>
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
          <div className="flex items-center">
            {message.type === "success" ? (
              <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <IoWarningOutline className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <nav className="space-y-1">
              {TABS_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                    />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Unsaved Changes Notice */}
          {unsavedChanges && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <IoWarningOutline className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  You have unsaved changes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderTabContent()}

            {/* Save Button */}
            {activeTab !== "security" && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <IoRefreshOutline className="w-4 h-4 mr-2" />
                  Reset
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IoSaveOutline className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorSettings;
