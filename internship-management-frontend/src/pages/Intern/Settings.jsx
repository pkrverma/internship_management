import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoGlobeOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoLockClosedOutline,
  IoStatsChartOutline,
  IoSaveOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";

const TABS_CONFIG = [
  { id: "account", name: "Account", icon: IoPersonOutline },
  { id: "profile", name: "Profile", icon: IoSchoolOutline },
  { id: "social", name: "Social Links", icon: IoGlobeOutline },
  { id: "preferences", name: "Preferences", icon: IoSettingsOutline },
  { id: "notifications", name: "Notifications", icon: IoNotificationsOutline },
  { id: "privacy", name: "Privacy", icon: IoShieldCheckmarkOutline },
  { id: "security", name: "Security", icon: IoLockClosedOutline },
  { id: "data", name: "Data & Storage", icon: IoStatsChartOutline },
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const fileInputRef = useRef();

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const saved = getData(`user_settings_${user.id}`);
      if (saved) setFormData(saved);
      else {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          profilePictureUrl: user.profilePictureUrl || null,
        });
      }
    } catch (err) {
      console.error("Load settings failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image upload allowed" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Max file size 5MB" });
      return;
    }
    try {
      setUploading(true);
      const res = await uploadFile(file, `profiles/${user.id}`);
      setFormData((prev) => ({ ...prev, profilePictureUrl: res.url }));
      setMessage({ type: "success", text: "Profile picture updated" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveData(`user_settings_${user.id}`, formData);
      updateUser && updateUser({ ...user, ...formData });
      setMessage({ type: "success", text: "Settings saved" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading settings..." />;

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Settings</h1>
      {message.text && (
        <div
          className={`mb-4 p-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              <Icon /> {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white p-4 rounded shadow">
        {activeTab === "account" && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium">First Name</label>
              <input
                className="border p-2 rounded w-full"
                value={formData.firstName || ""}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium">Last Name</label>
              <input
                className="border p-2 rounded w-full"
                value={formData.lastName || ""}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label>Email</label>
              <input
                className="border p-2 rounded w-full bg-gray-100"
                value={formData.email || ""}
                disabled
              />
            </div>
            <div className="mb-3">
              <label>Profile Picture</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
              {formData.profilePictureUrl && (
                <img
                  src={formData.profilePictureUrl}
                  alt="Profile"
                  className="mt-2 w-20 h-20 rounded-full object-cover"
                />
              )}
            </div>
          </>
        )}

        {/* Future expansion for profile/social/preferences etc. */}
        {activeTab !== "account" && (
          <p className="text-gray-500">
            Settings for "{activeTab}" will go here.
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          <IoSaveOutline />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
