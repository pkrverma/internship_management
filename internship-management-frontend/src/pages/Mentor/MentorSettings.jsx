import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoPersonOutline,
  IoStarOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoGlobeOutline,
  IoNotificationsOutline,
  IoShieldCheckmarkOutline,
  IoSettingsOutline,
  IoLockClosedOutline,
  IoAnalyticsOutline,
  IoSaveOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";

const TABS_CONFIG = [
  { id: "profile", name: "Professional Profile", icon: IoPersonOutline },
  { id: "expertise", name: "Expertise & Skills", icon: IoStarOutline },
  { id: "availability", name: "Availability", icon: IoCalendarOutline },
  { id: "mentoring", name: "Mentoring Preferences", icon: IoHeartOutline },
  { id: "social", name: "Social & Professional", icon: IoGlobeOutline },
  { id: "notifications", name: "Notifications", icon: IoNotificationsOutline },
  {
    id: "privacy",
    name: "Privacy & Visibility",
    icon: IoShieldCheckmarkOutline,
  },
  { id: "preferences", name: "App Preferences", icon: IoSettingsOutline },
  { id: "security", name: "Security", icon: IoLockClosedOutline },
  { id: "analytics", name: "Analytics & Reports", icon: IoAnalyticsOutline },
];

const MentorSettings = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const fileInputRef = useRef(null);

  // Load settings
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const savedSettings = getData(`mentor_settings_${user.id}`);
      if (savedSettings) {
        setFormData(savedSettings);
      } else {
        setFormData({
          firstName: user.name?.split(" ")[0] || "",
          lastName: user.name?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
        });
      }
    } catch (e) {
      console.error("Failed to load mentor settings:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-clear message
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
      setMessage({ type: "error", text: "Only image files allowed" });
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file, `profiles/${user?.id}`);
      setFormData((prev) => ({ ...prev, profilePictureUrl: result.url }));
      setMessage({ type: "success", text: "Profile picture updated" });
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveData(`mentor_settings_${user.id}`, formData);
      updateUser && updateUser({ ...user, ...formData });
      setMessage({ type: "success", text: "Settings saved" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading settings..." />;

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Mentor Settings</h1>
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
              className={`flex items-center gap-1 px-3 py-1 rounded ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              <Icon /> {tab.name}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div className="bg-white p-4 rounded shadow">
        {activeTab === "profile" && (
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
              <label className="block text-sm font-medium">Email</label>
              <input
                disabled
                className="border p-2 rounded w-full bg-gray-100"
                value={formData.email || ""}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium">
                Profile Picture
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>
          </>
        )}

        {activeTab === "expertise" && (
          <p>Expertise & Skills editing will go here...</p>
        )}

        {/* Add other tab contents similarly */}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
          disabled={saving}
        >
          <IoSaveOutline /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default MentorSettings;
