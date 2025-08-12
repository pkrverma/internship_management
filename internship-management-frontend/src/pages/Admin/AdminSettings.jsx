// src/pages/Admin/AdminSettings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoSettingsOutline,
  IoNotificationsOutline,
  IoCogOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCloudUploadOutline,
  IoSaveOutline,
  IoRefreshOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoBriefcaseOutline,
  IoSchoolOutline,
  IoColorPaletteOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoLanguageOutline,
  IoTimeOutline,
  IoServerOutline,
  IoKeyOutline,
  IoFingerPrintOutline,
  IoDevicesOutline,
  IoLogOutOutline,
  IoTrashOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline,
  IoHelpCircleOutline,
} from "react-icons/io5";

const AdminSettings = () => {
  const { user, updateUser } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    department: user?.department || "",
    position: user?.position || "Administrator",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    linkedin: user?.linkedin || "",
    twitter: user?.twitter || "",
  });

  // Security states
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: user?.twoFactorEnabled || false,
    loginNotifications: user?.loginNotifications !== false,
    sessionTimeout: user?.sessionTimeout || 60,
  });

  // System settings states
  const [systemSettings, setSystemSettings] = useState({
    siteName: "Aninex Internship Platform",
    siteDescription: "Professional Internship Management System",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    autoBackup: true,
    backupFrequency: "daily",
    maxFileSize: 10, // MB
    allowedFileTypes: "pdf,doc,docx,jpg,jpeg,png",
    sessionDuration: 24, // hours
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: {
      newApplications: user?.notifications?.newApplications !== false,
      taskUpdates: user?.notifications?.taskUpdates !== false,
      systemAlerts: user?.notifications?.systemAlerts !== false,
      weeklyReports: user?.notifications?.weeklyReports !== false,
      userRegistrations: user?.notifications?.userRegistrations !== false,
    },
    inAppNotifications: {
      realTimeUpdates: user?.inAppNotifications?.realTimeUpdates !== false,
      soundEnabled: user?.inAppNotifications?.soundEnabled !== false,
      desktopNotifications:
        user?.inAppNotifications?.desktopNotifications !== false,
    },
    frequency: user?.notificationFrequency || "immediate",
  });

  // Theme and display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: localStorage.getItem("admin_theme") || "light",
    language: user?.language || "en",
    timezone:
      user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: user?.dateFormat || "MM/DD/YYYY",
    timeFormat: user?.timeFormat || "12h",
    density: user?.density || "comfortable",
    sidebar: user?.sidebarCollapsed ? "collapsed" : "expanded",
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [uploading, setUploading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load system settings from localStorage or API
      const savedSettings = getData("systemSettings");
      if (savedSettings) {
        setSystemSettings({ ...systemSettings, ...savedSettings });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        setMessage({
          type: "error",
          text: "First name and last name are required",
        });
        return;
      }

      // Update user profile
      const updatedUser = {
        ...user,
        ...profileData,
        name: `${profileData.firstName} ${profileData.lastName}`,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage and context
      await updateUser(updatedUser);

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    setSaving(true);
    try {
      // Validate passwords
      if (
        securityData.newPassword &&
        securityData.newPassword !== securityData.confirmPassword
      ) {
        setMessage({ type: "error", text: "New passwords don't match" });
        return;
      }

      if (securityData.newPassword && securityData.newPassword.length < 8) {
        setMessage({
          type: "error",
          text: "Password must be at least 8 characters long",
        });
        return;
      }

      // Update security settings
      const updatedUser = {
        ...user,
        twoFactorEnabled: securityData.twoFactorEnabled,
        loginNotifications: securityData.loginNotifications,
        sessionTimeout: securityData.sessionTimeout,
        updatedAt: new Date().toISOString(),
      };

      // If password is being changed, add password change log
      if (securityData.newPassword) {
        updatedUser.passwordChangedAt = new Date().toISOString();
      }

      await updateUser(updatedUser);

      // Clear password fields
      setSecurityData({
        ...securityData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: "success",
        text: "Security settings updated successfully!",
      });
    } catch (error) {
      console.error("Failed to update security settings:", error);
      setMessage({ type: "error", text: "Failed to update security settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    setSaving(true);
    try {
      // Save system settings
      await saveData("systemSettings", systemSettings);

      setMessage({
        type: "success",
        text: "System settings updated successfully!",
      });
    } catch (error) {
      console.error("Failed to update system settings:", error);
      setMessage({ type: "error", text: "Failed to update system settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    try {
      // Update notification settings in user profile
      const updatedUser = {
        ...user,
        notifications: notificationSettings.emailNotifications,
        inAppNotifications: notificationSettings.inAppNotifications,
        notificationFrequency: notificationSettings.frequency,
        updatedAt: new Date().toISOString(),
      };

      await updateUser(updatedUser);

      setMessage({
        type: "success",
        text: "Notification preferences updated!",
      });
    } catch (error) {
      console.error("Failed to update notifications:", error);
      setMessage({
        type: "error",
        text: "Failed to update notification settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisplaySettingsSave = async () => {
    setSaving(true);
    try {
      // Save theme to localStorage
      localStorage.setItem("admin_theme", displaySettings.theme);

      // Update user preferences
      const updatedUser = {
        ...user,
        language: displaySettings.language,
        timezone: displaySettings.timezone,
        dateFormat: displaySettings.dateFormat,
        timeFormat: displaySettings.timeFormat,
        density: displaySettings.density,
        sidebarCollapsed: displaySettings.sidebar === "collapsed",
        updatedAt: new Date().toISOString(),
      };

      await updateUser(updatedUser);

      setMessage({ type: "success", text: "Display preferences updated!" });
    } catch (error) {
      console.error("Failed to update display settings:", error);
      setMessage({ type: "error", text: "Failed to update display settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, "avatars");
      setProfileData({ ...profileData, avatar: result.url });
      setMessage({ type: "success", text: "Avatar uploaded successfully!" });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setMessage({ type: "error", text: "Failed to upload avatar" });
    } finally {
      setUploading(false);
    }
  };

  const handleMaintenanceToggle = () => {
    setConfirmModal({
      isOpen: true,
      type: "maintenance",
      title: systemSettings.maintenanceMode
        ? "Disable Maintenance Mode"
        : "Enable Maintenance Mode",
      message: systemSettings.maintenanceMode
        ? "This will make the platform accessible to all users again."
        : "This will temporarily disable access for all users except administrators. Are you sure?",
    });
  };

  const confirmMaintenanceToggle = () => {
    setSystemSettings({
      ...systemSettings,
      maintenanceMode: !systemSettings.maintenanceMode,
    });
    setConfirmModal({ isOpen: false, type: null, title: "", message: "" });
    setMessage({
      type: "success",
      text: `Maintenance mode ${!systemSettings.maintenanceMode ? "enabled" : "disabled"}`,
    });
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: IoPersonOutline },
    { id: "security", name: "Security", icon: IoShieldCheckmarkOutline },
    {
      id: "notifications",
      name: "Notifications",
      icon: IoNotificationsOutline,
    },
    { id: "display", name: "Display", icon: IoColorPaletteOutline },
    { id: "system", name: "System", icon: IoServerOutline },
    { id: "advanced", name: "Advanced", icon: IoCogOutline },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile and system configuration
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
          <p
            className={
              message.type === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-md transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Profile Information
                  </h2>
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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

                {/* Avatar Section */}
                <div className="flex items-center mb-8">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IoPersonOutline className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Profile Photo
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload a new avatar for your profile
                    </p>
                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        {uploading ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                        />
                      </label>
                      {profileData.avatar && (
                        <button
                          onClick={() =>
                            setProfileData({ ...profileData, avatar: "" })
                          }
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          position: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) =>
                        setProfileData({ ...profileData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profileData.country}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Security Settings
                  </h2>
                  <button
                    onClick={handleSecuritySave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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

                <div className="space-y-8">
                  {/* Password Change */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Change Password
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            value={securityData.currentPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                current: !showPassword.current,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.current ? (
                              <IoEyeOffOutline className="h-4 w-4 text-gray-400" />
                            ) : (
                              <IoEyeOutline className="h-4 w-4 text-gray-400" />
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
                            type={showPassword.new ? "text" : "password"}
                            value={securityData.newPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                newPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                new: !showPassword.new,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.new ? (
                              <IoEyeOffOutline className="h-4 w-4 text-gray-400" />
                            ) : (
                              <IoEyeOutline className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            value={securityData.confirmPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                confirm: !showPassword.confirm,
                              })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword.confirm ? (
                              <IoEyeOffOutline className="h-4 w-4 text-gray-400" />
                            ) : (
                              <IoEyeOutline className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t border-gray-200 pt-8">
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
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) =>
                            setSecurityData({
                              ...securityData,
                              twoFactorEnabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {securityData.twoFactorEnabled && (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-blue-700">
                          Two-factor authentication is enabled. You'll need to
                          scan a QR code with your authenticator app.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Login Notifications */}
                  <div className="border-t border-gray-200 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Login Notifications
                        </h3>
                        <p className="text-sm text-gray-500">
                          Get notified of new login attempts
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityData.loginNotifications}
                          onChange={(e) =>
                            setSecurityData({
                              ...securityData,
                              loginNotifications: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Session Timeout */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Session Timeout
                    </h3>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout Duration (minutes)
                      </label>
                      <select
                        value={securityData.sessionTimeout}
                        onChange={(e) =>
                          setSecurityData({
                            ...securityData,
                            sessionTimeout: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={480}>8 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Notification Preferences
                  </h2>
                  <button
                    onClick={handleNotificationsSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" color="white" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IoSaveOutline className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(
                        notificationSettings.emailNotifications
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {key === "newApplications" &&
                                "Get notified when new applications are submitted"}
                              {key === "taskUpdates" &&
                                "Receive updates when tasks are completed or need review"}
                              {key === "systemAlerts" &&
                                "Important system notifications and alerts"}
                              {key === "weeklyReports" &&
                                "Weekly summary reports and analytics"}
                              {key === "userRegistrations" &&
                                "Notifications for new user registrations"}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  emailNotifications: {
                                    ...notificationSettings.emailNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      In-App Notifications
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(
                        notificationSettings.inAppNotifications
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {key === "realTimeUpdates" &&
                                "Show real-time notifications in the app"}
                              {key === "soundEnabled" &&
                                "Play notification sounds"}
                              {key === "desktopNotifications" &&
                                "Show browser desktop notifications"}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  inAppNotifications: {
                                    ...notificationSettings.inAppNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Settings */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Notification Frequency
                    </h3>
                    <div className="max-w-xs">
                      <select
                        value={notificationSettings.frequency}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            frequency: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === "display" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Display & Interface
                  </h2>
                  <button
                    onClick={handleDisplaySettingsSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" color="white" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IoSaveOutline className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Theme */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Theme
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {["light", "dark", "auto"].map((theme) => (
                        <div key={theme} className="relative">
                          <input
                            type="radio"
                            name="theme"
                            value={theme}
                            checked={displaySettings.theme === theme}
                            onChange={(e) =>
                              setDisplaySettings({
                                ...displaySettings,
                                theme: e.target.value,
                              })
                            }
                            className="sr-only peer"
                          />
                          <label className="flex flex-col items-center p-4 border border-gray-300 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50">
                            {theme === "light" && (
                              <IoSunnyOutline className="w-8 h-8 mb-2 text-yellow-500" />
                            )}
                            {theme === "dark" && (
                              <IoMoonOutline className="w-8 h-8 mb-2 text-purple-500" />
                            )}
                            {theme === "auto" && (
                              <IoColorPaletteOutline className="w-8 h-8 mb-2 text-blue-500" />
                            )}
                            <span className="text-sm font-medium capitalize">
                              {theme}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Language & Region */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Language & Region
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={displaySettings.language}
                          onChange={(e) =>
                            setDisplaySettings({
                              ...displaySettings,
                              language: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={displaySettings.timezone}
                          onChange={(e) =>
                            setDisplaySettings({
                              ...displaySettings,
                              timezone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">
                            Pacific Time
                          </option>
                          <option value="Europe/London">GMT</option>
                          <option value="Asia/Kolkata">IST</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                        <select
                          value={displaySettings.dateFormat}
                          onChange={(e) =>
                            setDisplaySettings({
                              ...displaySettings,
                              dateFormat: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Format
                        </label>
                        <select
                          value={displaySettings.timeFormat}
                          onChange={(e) =>
                            setDisplaySettings({
                              ...displaySettings,
                              timeFormat: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="12h">12 Hour</option>
                          <option value="24h">24 Hour</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Interface Density */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Interface Density
                    </h3>
                    <div className="space-y-3">
                      {["compact", "comfortable", "spacious"].map((density) => (
                        <div key={density} className="flex items-center">
                          <input
                            type="radio"
                            name="density"
                            value={density}
                            checked={displaySettings.density === density}
                            onChange={(e) =>
                              setDisplaySettings({
                                ...displaySettings,
                                density: e.target.value,
                              })
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <label className="ml-3 block text-sm font-medium text-gray-700 capitalize">
                            {density}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === "system" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    System Configuration
                  </h2>
                  <button
                    onClick={handleSystemSettingsSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" color="white" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IoSaveOutline className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-8">
                  {/* General Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      General Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={systemSettings.siteName}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              siteName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Description
                        </label>
                        <textarea
                          value={systemSettings.siteDescription}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              siteDescription: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="border-t border-gray-200 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Maintenance Mode
                        </h3>
                        <p className="text-sm text-gray-500">
                          Temporarily disable access for regular users
                        </p>
                      </div>
                      <button
                        onClick={handleMaintenanceToggle}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                          systemSettings.maintenanceMode
                            ? "bg-red-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            systemSettings.maintenanceMode
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {systemSettings.maintenanceMode && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                        <div className="flex items-center">
                          <IoWarningOutline className="w-5 h-5 text-red-600 mr-2" />
                          <p className="text-sm text-red-700">
                            Maintenance mode is currently enabled. Only
                            administrators can access the platform.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registration Settings */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      User Registration
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Allow Registration
                          </h4>
                          <p className="text-sm text-gray-500">
                            Enable new user registration
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.registrationEnabled}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                registrationEnabled: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Email Verification
                          </h4>
                          <p className="text-sm text-gray-500">
                            Require email verification for new accounts
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.emailVerificationRequired}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                emailVerificationRequired: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Settings */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      File Upload Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max File Size (MB)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={systemSettings.maxFileSize}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maxFileSize: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowed File Types
                        </label>
                        <input
                          type="text"
                          value={systemSettings.allowedFileTypes}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              allowedFileTypes: e.target.value,
                            })
                          }
                          placeholder="pdf,doc,docx,jpg,jpeg,png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Advanced Settings
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-red-600 font-medium">
                      ⚠️ Expert Settings
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
                  <div className="flex">
                    <IoWarningOutline className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning: Advanced Settings
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        These settings can affect system performance and
                        security. Only modify if you understand the
                        implications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Password Policy */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Password Policy
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Length
                        </label>
                        <input
                          type="number"
                          min="6"
                          max="32"
                          value={systemSettings.passwordPolicy.minLength}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              passwordPolicy: {
                                ...systemSettings.passwordPolicy,
                                minLength: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            key: "requireUppercase",
                            label: "Require Uppercase Letters",
                          },
                          {
                            key: "requireLowercase",
                            label: "Require Lowercase Letters",
                          },
                          { key: "requireNumbers", label: "Require Numbers" },
                          {
                            key: "requireSpecialChars",
                            label: "Require Special Characters",
                          },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={systemSettings.passwordPolicy[key]}
                              onChange={(e) =>
                                setSystemSettings({
                                  ...systemSettings,
                                  passwordPolicy: {
                                    ...systemSettings.passwordPolicy,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Session Management */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Session Management
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Duration (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={systemSettings.sessionDuration}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            sessionDuration: parseInt(e.target.value),
                          })
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        How long users stay logged in (1-168 hours)
                      </p>
                    </div>
                  </div>

                  {/* Backup Settings */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Backup & Recovery
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Automatic Backups
                          </h4>
                          <p className="text-sm text-gray-500">
                            Enable automatic data backups
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoBackup}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                autoBackup: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {systemSettings.autoBackup && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backup Frequency
                          </label>
                          <select
                            value={systemSettings.backupFrequency}
                            onChange={(e) =>
                              setSystemSettings({
                                ...systemSettings,
                                backupFrequency: e.target.value,
                              })
                            }
                            className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Actions */}
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      System Actions
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <IoRefreshOutline className="w-4 h-4 mr-2" />
                        Clear Cache
                      </button>

                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <IoDocumentTextOutline className="w-4 h-4 mr-2" />
                        Export Logs
                      </button>

                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <IoStatsChartOutline className="w-4 h-4 mr-2" />
                        System Health Check
                      </button>
                    </div>
                  </div>
                </div>
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
        onConfirm={confirmMaintenanceToggle}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={systemSettings.maintenanceMode ? "Disable" : "Enable"}
        cancelText="Cancel"
        danger={!systemSettings.maintenanceMode}
        loading={saving}
      />
    </div>
  );
};

export default AdminSettings;
