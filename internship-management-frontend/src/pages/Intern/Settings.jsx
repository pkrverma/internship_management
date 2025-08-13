// src/pages/intern/Settings.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoGlobeOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoColorPaletteOutline,
  IoDownloadOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoSaveOutline,
  IoRefreshOutline,
  IoLockClosedOutline,
  IoKeyOutline,
  IoPhonePortraitOutline,
  IoMailOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoLogoTwitter,
  IoBusinessOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoCloudUploadOutline,
  IoImageOutline,
  IoCopyOutline,
  IoShareOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLanguageOutline,
  IoAccessibilityOutline,
  IoCloseCircleOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoRadioButtonOffOutline,
} from "react-icons/io5";

const TABS_CONFIG = [
  {
    id: "account",
    name: "Account",
    icon: IoPersonOutline,
    description: "Basic account information",
  },
  {
    id: "profile",
    name: "Profile",
    icon: IoSchoolOutline,
    description: "Academic and personal details",
  },
  {
    id: "social",
    name: "Social Links",
    icon: IoGlobeOutline,
    description: "Social media and portfolio links",
  },
  {
    id: "preferences",
    name: "Preferences",
    icon: IoSettingsOutline,
    description: "App preferences and customization",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: IoNotificationsOutline,
    description: "Notification settings",
  },
  {
    id: "privacy",
    name: "Privacy",
    icon: IoShieldCheckmarkOutline,
    description: "Privacy and visibility settings",
  },
  {
    id: "security",
    name: "Security",
    icon: IoLockClosedOutline,
    description: "Password and security settings",
  },
  {
    id: "data",
    name: "Data & Storage",
    icon: IoStatsChartOutline,
    description: "Data management and exports",
  },
];

const NOTIFICATION_TYPES = {
  email: { name: "Email Notifications", icon: IoMailOutline },
  push: { name: "Push Notifications", icon: IoPhonePortraitOutline },
  sms: { name: "SMS Notifications", icon: IoPhonePortraitOutline },
  desktop: { name: "Desktop Notifications", icon: IoNotificationsOutline },
};

const NOTIFICATION_CATEGORIES = {
  applications: "Application Updates",
  interviews: "Interview Reminders",
  messages: "New Messages",
  announcements: "Announcements",
  deadlines: "Deadline Reminders",
  mentions: "Mentions and Tags",
  marketing: "Marketing Communications",
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

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form data state
  const [formData, setFormData] = useState({
    // Account info
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    profilePictureUrl: user?.profilePictureUrl || null,

    // Profile info
    university: user?.university || "",
    degree: user?.degree || "",
    major: user?.major || "",
    currentYear: user?.currentYear || "",
    expectedGraduation: user?.expectedGraduation || "",
    gpa: user?.gpa || "",
    location: user?.location || "",
    dateOfBirth: user?.dateOfBirth || "",

    // Social links
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    twitter: user?.twitter || "",
    portfolio: user?.portfolio || "",
    website: user?.website || "",

    // Preferences
    theme: user?.theme || "system",
    language: user?.language || "en",
    timezone:
      user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    fontSize: user?.fontSize || "medium",
    reducedMotion: user?.reducedMotion || false,
    highContrast: user?.highContrast || false,

    // Notifications
    notifications: user?.notifications || {
      email: {
        applications: true,
        interviews: true,
        messages: true,
        announcements: true,
        deadlines: true,
        mentions: true,
        marketing: false,
      },
      push: {
        applications: true,
        interviews: true,
        messages: true,
        announcements: false,
        deadlines: true,
        mentions: true,
        marketing: false,
      },
      sms: {
        applications: false,
        interviews: true,
        messages: false,
        announcements: false,
        deadlines: true,
        mentions: false,
        marketing: false,
      },
      desktop: {
        applications: true,
        interviews: true,
        messages: true,
        announcements: false,
        deadlines: true,
        mentions: true,
        marketing: false,
      },
    },

    // Privacy
    profileVisibility: user?.profileVisibility || "mentors",
    showEmail: user?.showEmail || false,
    showPhone: user?.showPhone || false,
    allowMessages: user?.allowMessages || "all",
    searchable: user?.searchable || true,

    // Security
    twoFactorEnabled: user?.twoFactorEnabled || false,
    loginAlerts: user?.loginAlerts || true,
    sessionTimeout: user?.sessionTimeout || 30,

    // Data
    dataDownloadRequested: false,
    accountDeletionRequested: false,
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
        const savedSettings = getData(`user_settings_${user?.id}`);
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
        typeof prev[section] === "object" && prev[section] !== null
          ? { ...prev[section], [field]: value }
          : value,
    }));
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

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
      setUploadProgress(0);
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
      // In a real app, this would make an API call
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
      // Save to localStorage (in a real app, this would be an API call)
      await saveData(`user_settings_${user.id}`, formData);

      // Update user context if needed
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

  const handleDataExport = async () => {
    try {
      const userData = {
        ...user,
        settings: formData,
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `user_data_${user.id}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Data exported successfully!" });
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({
        type: "error",
        text: "Failed to export data. Please try again.",
      });
    }
  };

  const handleAccountDeletion = () => {
    setConfirmModal({
      isOpen: true,
      type: "deleteAccount",
      title: "Delete Account",
      message:
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
      data: null,
    });
  };

  const confirmAccountDeletion = async () => {
    setSaving(true);
    try {
      // In a real app, this would make an API call to delete the account
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setMessage({
        type: "success",
        text: "Account deletion request submitted. You will receive an email confirmation.",
      });
      setFormData((prev) => ({ ...prev, accountDeletionRequested: true }));
    } catch (error) {
      console.error("Account deletion failed:", error);
      setMessage({
        type: "error",
        text: "Failed to process account deletion. Please try again.",
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

  const renderAccountTab = () => (
    <div className="space-y-6">
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
            placeholder="Enter your first name"
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
            placeholder="Enter your last name"
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
          <p className="text-sm text-gray-500 mt-1">
            Contact support to change your email address
          </p>
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
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about yourself..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.bio.length}/500 characters
        </p>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            University/Institution
          </label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, university: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Stanford University"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Degree Program
          </label>
          <select
            value={formData.degree}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, degree: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select degree</option>
            <option value="Bachelor's">Bachelor's Degree</option>
            <option value="Master's">Master's Degree</option>
            <option value="PhD">PhD</option>
            <option value="Associate">Associate Degree</option>
            <option value="Certificate">Certificate Program</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Major/Field of Study
          </label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, major: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Computer Science"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Year
          </label>
          <select
            value={formData.currentYear}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currentYear: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Graduate">Graduate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Graduation
          </label>
          <input
            type="month"
            value={formData.expectedGraduation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                expectedGraduation: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, gpa: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 3.75"
          />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <p className="text-gray-600">
        Connect your social profiles and portfolio to showcase your work and
        connect with others.
      </p>

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

      {/* Accessibility Settings */}
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

      {/* Timezone */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Time & Region
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, timezone: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => {
        const Icon = config.icon;
        return (
          <div key={type} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Icon className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                {config.name}
              </h3>
            </div>

            <div className="space-y-3">
              {Object.entries(NOTIFICATION_CATEGORIES).map(
                ([category, label]) => (
                  <label
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        formData.notifications[type]?.[category] || false
                      }
                      onChange={(e) =>
                        handleNestedChange(
                          "notifications",
                          type,
                          category,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                )
              )}
            </div>
          </div>
        );
      })}
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
              description: "Anyone can view your profile",
            },
            {
              value: "mentors",
              label: "Mentors Only",
              description: "Only mentors and admins can view your profile",
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
          Communication
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who can message you?
          </label>
          <select
            value={formData.allowMessages}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                allowMessages: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Anyone</option>
            <option value="mentors">Mentors and Admins only</option>
            <option value="none">No one</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Search & Discovery
        </h3>
        <label className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">
              Searchable Profile
            </div>
            <div className="text-sm text-gray-500">
              Allow your profile to appear in search results
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.searchable}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, searchable: e.target.checked }))
            }
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>
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
                placeholder="Enter current password"
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
                placeholder="Enter new password"
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
                      <div className="text-xs text-gray-500">
                        Password strength
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
                placeholder="Confirm new password"
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex items-center justify-between mb-4">
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

      {/* Session Timeout */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Session Timeout
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Automatically log out after (minutes)
          </label>
          <select
            value={formData.sessionTimeout}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sessionTimeout: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
            <option value={0}>Never</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-8">
      {/* Data Export */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Export Your Data
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Download a copy of all your data including profile information,
              applications, and activity.
            </p>
            {formData.dataDownloadRequested && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <IoInformationCircleOutline className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Data export requested. You'll receive an email when ready.
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleDataExport}
            disabled={formData.dataDownloadRequested}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoDownloadOutline className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Delete Account
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            {formData.accountDeletionRequested && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <div className="flex items-center">
                  <IoWarningOutline className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">
                    Account deletion requested. Check your email for
                    confirmation.
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleAccountDeletion}
            disabled={formData.accountDeletionRequested || saving}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
          >
            <IoTrashOutline className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return renderAccountTab();
      case "profile":
        return renderProfileTab();
      case "social":
        return renderSocialTab();
      case "preferences":
        return renderPreferencesTab();
      case "notifications":
        return renderNotificationsTab();
      case "privacy":
        return renderPrivacyTab();
      case "security":
        return renderSecurityTab();
      case "data":
        return renderDataTab();
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account preferences and privacy settings
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
            {activeTab !== "security" && activeTab !== "data" && (
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
            data: null,
          })
        }
        onConfirm={confirmAccountDeletion}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete Account"
        cancelText="Cancel"
        danger={true}
        loading={saving}
      />
    </div>
  );
};

export default Settings;
