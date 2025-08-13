import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoColorPaletteOutline,
  IoServerOutline,
  IoCogOutline,
} from "react-icons/io5";

const AdminSettings = () => {
  const { user, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    position: "Administrator",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: "Aninex Internship Platform",
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    theme: localStorage.getItem("admin_theme") || "light",
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const savedSettings = await getData("systemSettings");
      if (savedSettings)
        setSystemSettings((prev) => ({ ...prev, ...savedSettings }));
      if (user) {
        const [first, ...last] = user.name?.split(" ") || ["", ""];
        setProfileData({
          firstName: first,
          lastName: last.join(" "),
          email: user.email || "",
          phone: user.phone || "",
          avatar: user.avatar || "",
          position: user.position || "Administrator",
        });
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
      if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        setMessage({ type: "error", text: "First and last name are required" });
        return;
      }
      const updatedUser = {
        ...user,
        ...profileData,
        name: `${profileData.firstName} ${profileData.lastName}`,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update failed:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    setSaving(true);
    try {
      if (
        securityData.newPassword &&
        securityData.newPassword !== securityData.confirmPassword
      ) {
        setMessage({ type: "error", text: "Passwords do not match" });
        return;
      }
      setMessage({ type: "success", text: "Security settings updated" });
    } catch (error) {
      console.error("Security update failed:", error);
      setMessage({ type: "error", text: "Failed to update security settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    setSaving(true);
    try {
      await saveData("systemSettings", systemSettings);
      setMessage({ type: "success", text: "System settings updated" });
    } catch (error) {
      console.error("Failed to save system settings:", error);
      setMessage({ type: "error", text: "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be < 5MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Invalid file type" });
      return;
    }
    try {
      const result = await uploadFile(file, { folder: "avatars" });
      setProfileData((prev) => ({ ...prev, avatar: result.url }));
      setMessage({ type: "success", text: "Avatar uploaded" });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "Upload failed" });
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
        ? "This will make the platform accessible again."
        : "This will disable the platform for all users except admins.",
    });
  };

  const confirmMaintenanceToggle = () => {
    setSystemSettings((prev) => ({
      ...prev,
      maintenanceMode: !prev.maintenanceMode,
    }));
    setConfirmModal({ isOpen: false, type: null, title: "", message: "" });
    setMessage({
      type: "success",
      text: `Maintenance mode ${
        !systemSettings.maintenanceMode ? "enabled" : "disabled"
      }`,
    });
  };

  if (loading) return <Spinner fullScreen text="Loading settings..." />;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
      {message.text && (
        <div
          className={`p-2 mb-4 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        {[
          { id: "profile", label: "Profile", icon: IoPersonOutline },
          { id: "security", label: "Security", icon: IoShieldCheckmarkOutline },
          {
            id: "notifications",
            label: "Notifications",
            icon: IoNotificationsOutline,
          },
          { id: "display", label: "Display", icon: IoColorPaletteOutline },
          { id: "system", label: "System", icon: IoServerOutline },
          { id: "advanced", label: "Advanced", icon: IoCogOutline },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 pb-2 ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-3">
          <div>
            <label>First Name</label>
            <input
              className="border p-2 w-full"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
            />
          </div>
          <div>
            <label>Last Name</label>
            <input
              className="border p-2 w-full"
              value={profileData.lastName}
              onChange={(e) =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
            />
          </div>
          <div>
            <label>Email</label>
            <input
              className="border p-2 w-full"
              value={profileData.email}
              disabled
            />
          </div>
          <div>
            <label>Phone</label>
            <input
              className="border p-2 w-full"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
            />
          </div>
          <div>
            <label>Avatar</label>
            <input type="file" onChange={handleAvatarUpload} />
            {profileData.avatar && (
              <img
                src={profileData.avatar}
                alt="Avatar"
                className="w-16 h-16 mt-2 rounded-full"
              />
            )}
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current Password"
            className="border p-2 w-full"
            value={securityData.currentPassword}
            onChange={(e) =>
              setSecurityData({
                ...securityData,
                currentPassword: e.target.value,
              })
            }
          />
          <input
            type="password"
            placeholder="New Password"
            className="border p-2 w-full"
            value={securityData.newPassword}
            onChange={(e) =>
              setSecurityData({ ...securityData, newPassword: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="border p-2 w-full"
            value={securityData.confirmPassword}
            onChange={(e) =>
              setSecurityData({
                ...securityData,
                confirmPassword: e.target.value,
              })
            }
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={securityData.twoFactorEnabled}
              onChange={(e) =>
                setSecurityData({
                  ...securityData,
                  twoFactorEnabled: e.target.checked,
                })
              }
            />
            Enable Two-Factor Authentication
          </label>
          <button
            onClick={handleSecuritySave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Security Settings
          </button>
        </div>
      )}

      {activeTab === "system" && (
        <div className="space-y-3">
          <input
            value={systemSettings.siteName}
            className="border p-2 w-full"
            onChange={(e) =>
              setSystemSettings({ ...systemSettings, siteName: e.target.value })
            }
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={systemSettings.maintenanceMode}
              onChange={handleMaintenanceToggle}
            />
            Maintenance Mode
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={systemSettings.registrationEnabled}
              onChange={(e) =>
                setSystemSettings({
                  ...systemSettings,
                  registrationEnabled: e.target.checked,
                })
              }
            />
            Registration Enabled
          </label>
          <button
            onClick={handleSystemSettingsSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save System Settings
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={confirmMaintenanceToggle}
        title={confirmModal.title}
        message={confirmModal.message}
        danger
      />
    </div>
  );
};

export default AdminSettings;
