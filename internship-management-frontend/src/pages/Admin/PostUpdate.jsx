import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSendOutline,
  IoSaveOutline,
  IoEyeOutline,
  IoMegaphoneOutline,
  IoWarningOutline,
  IoSettingsOutline,
  IoBulbOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoNotificationsOutline,
} from "react-icons/io5";

const UPDATE_TYPES = {
  Announcement: { icon: IoMegaphoneOutline, desc: "General announcements" },
  "System Alert": { icon: IoWarningOutline, desc: "Critical system messages" },
  Maintenance: { icon: IoSettingsOutline, desc: "Scheduled maintenance info" },
  "New Feature": { icon: IoBulbOutline, desc: "Feature releases" },
  "Policy Update": { icon: IoDocumentTextOutline, desc: "Policy changes" },
  Event: { icon: IoCalendarOutline, desc: "Upcoming event details" },
};

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const DELIVERY_METHODS = [
  "Platform Only",
  "Email + Platform",
  "Push + Platform",
  "All Channels",
];

const PostUpdate = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "Announcement",
    priority: "Medium",
    targetRole: "All",
    publishNow: true,
    scheduledDate: "",
    scheduledTime: "",
    deliveryMethod: "Platform Only",
    featuredImage: null,
    attachments: [],
    ctaEnabled: false,
    ctaLabel: "",
    ctaLink: "",
    sendNotification: true,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    data: null,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const u = (await getData("users")) || [];
      setUsers(u);
    } catch (err) {
      console.error("Load users failed:", err);
      setMessage({ type: "error", text: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const targetUsers = useMemo(() => {
    if (formData.targetRole === "All")
      return users.filter((u) => u.id !== user.id);
    if (formData.targetRole === "Specific" && formData.targetUserId) {
      return users.filter((u) => u.id === formData.targetUserId);
    }
    return users.filter((u) => u.role === formData.targetRole);
  }, [formData.targetRole, formData.targetUserId, users, user.id]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const uploaded = [];
      for (let file of files) {
        const res = await uploadFile(file, "updates");
        uploaded.push({ name: file.name, url: res.url });
      }
      if (field === "featuredImage") {
        setFormData((prev) => ({ ...prev, featuredImage: uploaded[0] }));
      } else {
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...uploaded],
        }));
      }
      setMessage({ type: "success", text: "Upload successful" });
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage({ type: "error", text: "File upload failed" });
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.content.trim()) return "Content is required";
    if (
      !formData.publishNow &&
      (!formData.scheduledDate || !formData.scheduledTime)
    )
      return "Schedule date and time are required";
    if (
      formData.ctaEnabled &&
      (!formData.ctaLabel.trim() || !formData.ctaLink.trim())
    )
      return "CTA label and link required when CTA enabled";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    if (["High", "Critical"].includes(formData.priority)) {
      setConfirmModal({ isOpen: true, data: formData });
    } else {
      publishUpdate(formData);
    }
  };

  const publishUpdate = async (data) => {
    try {
      const updates = (await getData("updates")) || [];
      const newUpdate = {
        ...data,
        id: `update_${Date.now()}`,
        postedBy: { id: user.id, name: user.name },
        targetCount: targetUsers.length,
        createdAt: new Date().toISOString(),
        status: data.publishNow ? "Published" : "Scheduled",
      };
      await saveData("updates", [...updates, newUpdate]);
      setMessage({ type: "success", text: "Update published successfully" });
      setFormData({
        title: "",
        content: "",
        type: "Announcement",
        priority: "Medium",
        targetRole: "All",
        publishNow: true,
        scheduledDate: "",
        scheduledTime: "",
        deliveryMethod: "Platform Only",
        featuredImage: null,
        attachments: [],
        ctaEnabled: false,
        ctaLabel: "",
        ctaLink: "",
        sendNotification: true,
      });
    } catch (err) {
      console.error("Publish failed:", err);
      setMessage({ type: "error", text: "Failed to publish update" });
    } finally {
      setConfirmModal({ isOpen: false, data: null });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Post Update</h1>
      {message.text && (
        <div
          className={`mb-3 p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <textarea
          name="content"
          placeholder="Content"
          value={formData.content}
          onChange={handleChange}
          className="w-full border p-2"
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="border p-2"
        >
          {Object.keys(UPDATE_TYPES).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="border p-2"
        >
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          name="targetRole"
          value={formData.targetRole}
          onChange={handleChange}
          className="border p-2"
        >
          <option value="All">All</option>
          <option value="Intern">Intern</option>
          <option value="Mentor">Mentor</option>
          <option value="Admin">Admin</option>
          <option value="Specific">Specific User</option>
        </select>
        {!formData.publishNow && (
          <>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="border p-2"
            />
            <input
              type="time"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              className="border p-2"
            />
          </>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="publishNow"
            checked={formData.publishNow}
            onChange={handleChange}
          />{" "}
          Publish Now
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
        >
          <IoSendOutline /> Publish
        </button>
      </form>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, data: null })}
        onConfirm={() => publishUpdate(confirmModal.data)}
        title="High Priority Confirmation"
        message="Are you sure you want to send this high priority update?"
        danger
      />
    </div>
  );
};

export default PostUpdate;
