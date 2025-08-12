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
  IoImageOutline,
  IoDocumentTextOutline,
  IoVideocamOutline,
  IoLinkOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoStatsChartOutline,
  IoNotificationsOutline,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoAddOutline,
  IoCreateOutline,
  IoColorPaletteOutline,
  IoTextOutline,
  IoListOutline,
  IoCodeSlashOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoBulbOutline,
  IoCopyOutline,
  IoRefreshOutline,
  IoSettingsOutline,
  IoCloseCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoFolderOpenOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoGlobeOutline,
  IoMegaphoneOutline,
} from "react-icons/io5";

const UPDATE_TYPES = {
  Announcement: {
    color: "bg-blue-100 text-blue-800",
    icon: IoMegaphoneOutline,
    description: "General announcements and news",
  },
  "System Alert": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
    description: "Critical system notifications",
  },
  Maintenance: {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoSettingsOutline,
    description: "Scheduled maintenance updates",
  },
  "New Feature": {
    color: "bg-green-100 text-green-800",
    icon: IoBulbOutline,
    description: "Feature releases and updates",
  },
  "Policy Update": {
    color: "bg-purple-100 text-purple-800",
    icon: IoDocumentTextOutline,
    description: "Policy changes and guidelines",
  },
  Event: {
    color: "bg-indigo-100 text-indigo-800",
    icon: IoCalendarOutline,
    description: "Upcoming events and deadlines",
  },
};

const PRIORITY_LEVELS = {
  Low: { color: "bg-gray-100 text-gray-800", badge: "L" },
  Medium: { color: "bg-blue-100 text-blue-800", badge: "M" },
  High: { color: "bg-orange-100 text-orange-800", badge: "H" },
  Critical: { color: "bg-red-100 text-red-800", badge: "!" },
};

const DELIVERY_METHODS = {
  "Platform Only": {
    icon: IoGlobeOutline,
    description: "Show only in platform",
  },
  "Email + Platform": {
    icon: IoMailOutline,
    description: "Send email and show in platform",
  },
  "Push + Platform": {
    icon: IoPhonePortraitOutline,
    description: "Send push notification and show in platform",
  },
  "All Channels": {
    icon: IoNotificationsOutline,
    description: "Use all available channels",
  },
};

const PostUpdate = () => {
  const { user } = useAuth();

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "Announcement",
    priority: "Medium",
    targetRole: "All",
    targetUserId: "",
    targetDepartment: "",
    targetUniversity: "",
    deliveryMethod: "Platform Only",

    // Scheduling
    publishNow: true,
    scheduledDate: "",
    scheduledTime: "",
    expiryDate: "",

    // Media
    featuredImage: null,
    attachments: [],
    videoUrl: "",

    // Call to action
    ctaEnabled: false,
    ctaLabel: "",
    ctaLink: "",
    ctaStyle: "primary",

    // Advanced options
    allowComments: true,
    sendNotification: true,
    trackEngagement: true,
    requireAcknowledgment: false,
    tags: [],

    // Draft options
    isDraft: false,
    templateName: "",
  });

  // Data states
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [targetUsers, setTargetUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [activeTab, setActiveTab] = useState("content");
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Rich text editor state
  const [editorTools, setEditorTools] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: "16",
    textAlign: "left",
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [usersData, templatesData, draftsData] = await Promise.all([
        getData("users") || [],
        getData("update_templates") || [],
        getData("update_drafts") || [],
      ]);

      setUsers(usersData);
      setTemplates(templatesData);
      setDrafts(draftsData.filter((draft) => draft.createdBy === user.id));

      // Extract departments and universities
      const uniqueDepartments = [
        ...new Set(
          usersData.filter((u) => u.department).map((u) => u.department)
        ),
      ].sort();

      const uniqueUniversities = [
        ...new Set(
          usersData
            .filter((u) => u.university && u.role === "intern")
            .map((u) => u.university)
        ),
      ].sort();

      setDepartments(uniqueDepartments);
      setUniversities(uniqueUniversities);
    } catch (error) {
      console.error("Failed to load data:", error);
      setMessage({
        type: "error",
        text: "Failed to load data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update target users when filters change
  useEffect(() => {
    let filtered = users.filter((u) => u.id !== user.id);

    // Filter by role
    if (formData.targetRole !== "All") {
      filtered = filtered.filter((u) => u.role === formData.targetRole);
    }

    // Filter by department
    if (formData.targetDepartment && formData.targetDepartment !== "All") {
      filtered = filtered.filter(
        (u) => u.department === formData.targetDepartment
      );
    }

    // Filter by university
    if (formData.targetUniversity && formData.targetUniversity !== "All") {
      filtered = filtered.filter(
        (u) => u.university === formData.targetUniversity
      );
    }

    setTargetUsers(filtered);
  }, [
    formData.targetRole,
    formData.targetDepartment,
    formData.targetUniversity,
    users,
    user.id,
  ]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate target audience size
  const targetAudienceSize = useMemo(() => {
    if (formData.targetRole === "Specific" && formData.targetUserId) {
      return 1;
    }
    return targetUsers.length;
  }, [formData.targetRole, formData.targetUserId, targetUsers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        // Validate file type
        const allowedTypes =
          type === "image"
            ? ["image/jpeg", "image/png", "image/gif", "image/webp"]
            : [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain",
              ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has invalid type`);
        }

        const result = await uploadFile(file, `updates/${type}`);
        return {
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      if (type === "image" && uploadedFiles.length > 0) {
        setFormData((prev) => ({ ...prev, featuredImage: uploadedFiles[0] }));
      } else {
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedFiles],
        }));
      }

      setMessage({
        type: "success",
        text: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("File upload failed:", error);
      setMessage({
        type: "error",
        text: error.message || "File upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const draftsData = getData("update_drafts") || [];
      const draftId = `draft_${Date.now()}`;

      const draft = {
        id: draftId,
        ...formData,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveData("update_drafts", [...draftsData, draft]);
      setDrafts((prev) => [...prev, draft]);
      setMessage({ type: "success", text: "Draft saved successfully!" });
    } catch (error) {
      console.error("Failed to save draft:", error);
      setMessage({ type: "error", text: "Failed to save draft" });
    } finally {
      setSaving(false);
    }
  };

  const loadDraft = (draft) => {
    setFormData({
      ...draft,
      isDraft: false,
      templateName: "",
    });
    setMessage({ type: "success", text: "Draft loaded successfully" });
  };

  const saveTemplate = async () => {
    if (!formData.templateName.trim()) {
      setMessage({ type: "error", text: "Please provide a template name" });
      return;
    }

    setSaving(true);
    try {
      const templatesData = getData("update_templates") || [];
      const templateId = `template_${Date.now()}`;

      const template = {
        id: templateId,
        name: formData.templateName,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        ctaEnabled: formData.ctaEnabled,
        ctaLabel: formData.ctaLabel,
        ctaStyle: formData.ctaStyle,
        allowComments: formData.allowComments,
        sendNotification: formData.sendNotification,
        trackEngagement: formData.trackEngagement,
        requireAcknowledgment: formData.requireAcknowledgment,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };

      await saveData("update_templates", [...templatesData, template]);
      setTemplates((prev) => [...prev, template]);
      setMessage({ type: "success", text: "Template saved successfully!" });
    } catch (error) {
      console.error("Failed to save template:", error);
      setMessage({ type: "error", text: "Failed to save template" });
    } finally {
      setSaving(false);
    }
  };

  const loadTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      content: template.content,
      type: template.type,
      priority: template.priority,
      ctaEnabled: template.ctaEnabled,
      ctaLabel: template.ctaLabel,
      ctaStyle: template.ctaStyle,
      allowComments: template.allowComments,
      sendNotification: template.sendNotification,
      trackEngagement: template.trackEngagement,
      requireAcknowledgment: template.requireAcknowledgment,
    }));
    setMessage({
      type: "success",
      text: `Template "${template.name}" loaded successfully`,
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push("Title is required");
    }

    if (!formData.content.trim()) {
      errors.push("Content is required");
    }

    if (formData.targetRole === "Specific" && !formData.targetUserId) {
      errors.push("Please select a specific user");
    }

    if (formData.ctaEnabled && !formData.ctaLabel.trim()) {
      errors.push("CTA label is required when CTA is enabled");
    }

    if (formData.ctaEnabled && !formData.ctaLink.trim()) {
      errors.push("CTA link is required when CTA is enabled");
    }

    if (!formData.publishNow && !formData.scheduledDate) {
      errors.push("Scheduled date is required for scheduled posts");
    }

    if (!formData.publishNow && !formData.scheduledTime) {
      errors.push("Scheduled time is required for scheduled posts");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setMessage({ type: "error", text: validationErrors.join(", ") });
      return;
    }

    // Show confirmation for critical or high priority updates
    if (["Critical", "High"].includes(formData.priority)) {
      setConfirmModal({
        isOpen: true,
        type: "publish",
        title: "Confirm High Priority Update",
        message: `Are you sure you want to publish this ${formData.priority.toLowerCase()} priority update to ${targetAudienceSize} user(s)?`,
        data: formData,
      });
      return;
    }

    await publishUpdate(formData);
  };

  const publishUpdate = async (updateData) => {
    setSaving(true);
    try {
      const updates = getData("updates") || [];
      const updateId = `update_${Date.now()}`;

      const newUpdate = {
        id: updateId,
        title: updateData.title,
        content: updateData.content,
        type: updateData.type,
        priority: updateData.priority,

        // Author information
        postedByUserId: user.id,
        postedByUserRole: user.role,
        postedByName: user.name,

        // Targeting
        targetRole: updateData.targetRole,
        targetUserId:
          updateData.targetRole === "Specific" ? updateData.targetUserId : null,
        targetDepartment: updateData.targetDepartment || null,
        targetUniversity: updateData.targetUniversity || null,
        targetAudienceSize,

        // Timing
        timestamp: updateData.publishNow
          ? new Date().toISOString()
          : new Date(
              `${updateData.scheduledDate}T${updateData.scheduledTime}:00`
            ).toISOString(),
        isScheduled: !updateData.publishNow,
        scheduledDate: updateData.scheduledDate || null,
        scheduledTime: updateData.scheduledTime || null,
        expiryDate: updateData.expiryDate || null,

        // Media and attachments
        featuredImage: updateData.featuredImage,
        attachments: updateData.attachments,
        videoUrl: updateData.videoUrl || null,

        // Call to action
        ctaEnabled: updateData.ctaEnabled,
        ctaLabel: updateData.ctaLabel || null,
        ctaLink: updateData.ctaLink || null,
        ctaStyle: updateData.ctaStyle,

        // Settings
        deliveryMethod: updateData.deliveryMethod,
        allowComments: updateData.allowComments,
        sendNotification: updateData.sendNotification,
        trackEngagement: updateData.trackEngagement,
        requireAcknowledgment: updateData.requireAcknowledgment,
        tags: updateData.tags,

        // Tracking
        readBy: [],
        acknowledgedBy: [],
        likes: 0,
        comments: [],
        views: 0,
        clickThroughs: 0,

        // Status
        status: updateData.publishNow ? "Published" : "Scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveData("updates", [...updates, newUpdate]);

      setMessage({
        type: "success",
        text: updateData.publishNow
          ? `Update published successfully to ${targetAudienceSize} user(s)!`
          : `Update scheduled successfully for ${updateData.scheduledDate} at ${updateData.scheduledTime}!`,
      });

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to publish update:", error);
      setMessage({
        type: "error",
        text: "Failed to publish update. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "Announcement",
      priority: "Medium",
      targetRole: "All",
      targetUserId: "",
      targetDepartment: "",
      targetUniversity: "",
      deliveryMethod: "Platform Only",
      publishNow: true,
      scheduledDate: "",
      scheduledTime: "",
      expiryDate: "",
      featuredImage: null,
      attachments: [],
      videoUrl: "",
      ctaEnabled: false,
      ctaLabel: "",
      ctaLink: "",
      ctaStyle: "primary",
      allowComments: true,
      sendNotification: true,
      trackEngagement: true,
      requireAcknowledgment: false,
      tags: [],
      isDraft: false,
      templateName: "",
    });
    setActiveTab("content");
    setShowPreview(false);
    setShowAdvanced(false);
  };

  const confirmAction = async () => {
    const { type, data } = confirmModal;

    if (type === "publish") {
      await publishUpdate(data);
    }

    setConfirmModal({
      isOpen: false,
      type: null,
      title: "",
      message: "",
      data: null,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTypeIcon = (type) => {
    return UPDATE_TYPES[type]?.icon || IoInformationCircleOutline;
  };

  const getTypeBadge = (type) => {
    const config = UPDATE_TYPES[type] || UPDATE_TYPES["Announcement"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {type}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = PRIORITY_LEVELS[priority] || PRIORITY_LEVELS["Medium"];

    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${config.color}`}
      >
        {config.badge}
      </span>
    );
  };

  const tabs = [
    { id: "content", name: "Content", icon: IoTextOutline },
    { id: "targeting", name: "Audience", icon: IoPeopleOutline },
    { id: "media", name: "Media", icon: IoImageOutline },
    { id: "schedule", name: "Schedule", icon: IoCalendarOutline },
    { id: "settings", name: "Settings", icon: IoSettingsOutline },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading update composer..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Update</h1>
          <p className="text-gray-600 mt-2">
            Compose and publish announcements to your audience
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {drafts.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const draft = drafts.find((d) => d.id === e.target.value);
                  if (draft) loadDraft(draft);
                }}
                value=""
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Load Draft</option>
                {drafts.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.title || "Untitled Draft"} -{" "}
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {templates.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const template = templates.find(
                    (t) => t.id === e.target.value
                  );
                  if (template) loadTemplate(template);
                }}
                value=""
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Load Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoEyeOutline className="w-4 h-4 mr-2" />
            {showPreview ? "Edit" : "Preview"}
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
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Preview Mode */}
          {showPreview ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Preview
                </h2>

                {/* Update Preview Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {React.createElement(getTypeIcon(formData.type), {
                          className: "w-5 h-5 text-blue-600",
                        })}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formData.title || "Preview Title"}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {getTypeBadge(formData.type)}
                          {getPriorityBadge(formData.priority)}
                          <span className="text-sm text-gray-500">
                            by {user.name} •{" "}
                            {formData.publishNow
                              ? "Now"
                              : `${formData.scheduledDate} at ${formData.scheduledTime}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Featured Image */}
                  {formData.featuredImage && (
                    <div className="mb-4">
                      <img
                        src={formData.featuredImage.url}
                        alt="Featured"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-blue max-w-none mb-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {formData.content ||
                        "Preview content will appear here..."}
                    </div>
                  </div>

                  {/* Video */}
                  {formData.videoUrl && (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-4 rounded-lg flex items-center">
                        <IoVideocamOutline className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-600">
                          Video: {formData.videoUrl}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {formData.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Attachments
                      </h4>
                      <div className="space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center p-2 bg-white rounded-md border"
                          >
                            <IoDocumentTextOutline className="w-4 h-4 text-gray-600 mr-2" />
                            <span className="text-sm font-medium">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  {formData.ctaEnabled && formData.ctaLabel && (
                    <div className="mb-4">
                      <button
                        className={`px-6 py-2 rounded-md font-medium ${
                          formData.ctaStyle === "primary"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : formData.ctaStyle === "secondary"
                              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {formData.ctaLabel}
                      </button>
                    </div>
                  )}

                  {/* Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Content Tab */}
                {activeTab === "content" && (
                  <div className="space-y-6">
                    {/* Update Type and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Type *
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {Object.entries(UPDATE_TYPES).map(
                            ([type, config]) => (
                              <option key={type} value={type}>
                                {type} - {config.description}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority *
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          {Object.keys(PRIORITY_LEVELS).map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Method
                        </label>
                        <select
                          name="deliveryMethod"
                          value={formData.deliveryMethod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Object.entries(DELIVERY_METHODS).map(
                            ([method, config]) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter a compelling title for your update..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.title.length}/100 characters
                      </p>
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content *
                      </label>

                      {/* Rich Text Toolbar */}
                      <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditorTools((prev) => ({
                              ...prev,
                              bold: !prev.bold,
                            }))
                          }
                          className={`p-2 rounded ${editorTools.bold ? "bg-blue-200" : "hover:bg-gray-200"}`}
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditorTools((prev) => ({
                              ...prev,
                              italic: !prev.italic,
                            }))
                          }
                          className={`p-2 rounded ${editorTools.italic ? "bg-blue-200" : "hover:bg-gray-200"}`}
                        >
                          <em>I</em>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditorTools((prev) => ({
                              ...prev,
                              underline: !prev.underline,
                            }))
                          }
                          className={`p-2 rounded ${editorTools.underline ? "bg-blue-200" : "hover:bg-gray-200"}`}
                        >
                          <u>U</u>
                        </button>
                        <div className="border-l border-gray-300 h-6 mx-2"></div>
                        <select
                          value={editorTools.fontSize}
                          onChange={(e) =>
                            setEditorTools((prev) => ({
                              ...prev,
                              fontSize: e.target.value,
                            }))
                          }
                          className="text-sm border-0 bg-transparent"
                        >
                          <option value="12">12px</option>
                          <option value="14">14px</option>
                          <option value="16">16px</option>
                          <option value="18">18px</option>
                          <option value="20">20px</option>
                        </select>
                      </div>

                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={8}
                        placeholder="Write your update content here. Use clear, concise language and include all relevant information..."
                        className="w-full px-3 py-2 border-x border-b border-gray-300 rounded-b-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                        style={{
                          fontWeight: editorTools.bold ? "bold" : "normal",
                          fontStyle: editorTools.italic ? "italic" : "normal",
                          textDecoration: editorTools.underline
                            ? "underline"
                            : "none",
                          fontSize: `${editorTools.fontSize}px`,
                        }}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.content.length}/2000 characters
                      </p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags.join(", ")}
                        onChange={handleTagsChange}
                        placeholder="urgent, maintenance, new-feature"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Tags help categorize and make updates searchable
                      </p>
                    </div>
                  </div>
                )}

                {/* Targeting Tab */}
                {activeTab === "targeting" && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <IoInformationCircleOutline className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          Current audience: {targetAudienceSize} user(s)
                        </span>
                      </div>
                    </div>

                    {/* Primary Targeting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience *
                      </label>
                      <select
                        name="targetRole"
                        value={formData.targetRole}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="All">All Users</option>
                        <option value="intern">Interns Only</option>
                        <option value="mentor">Mentors Only</option>
                        <option value="admin">Admins Only</option>
                        <option value="Specific">Specific User</option>
                      </select>
                    </div>

                    {/* Specific User Selection */}
                    {formData.targetRole === "Specific" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select User *
                        </label>
                        <select
                          name="targetUserId"
                          value={formData.targetUserId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required={formData.targetRole === "Specific"}
                        >
                          <option value="">Choose a user...</option>
                          {targetUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role}) - {u.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Additional Filters */}
                    {formData.targetRole !== "Specific" && (
                      <>
                        {/* Department Filter */}
                        {departments.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Filter by Department (optional)
                            </label>
                            <select
                              name="targetDepartment"
                              value={formData.targetDepartment}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Departments</option>
                              {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* University Filter */}
                        {universities.length > 0 &&
                          formData.targetRole === "intern" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by University (optional)
                              </label>
                              <select
                                name="targetUniversity"
                                value={formData.targetUniversity}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">All Universities</option>
                                {universities.map((uni) => (
                                  <option key={uni} value={uni}>
                                    {uni}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                      </>
                    )}

                    {/* Target Audience Preview */}
                    {targetUsers.length > 0 &&
                      formData.targetRole !== "Specific" && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Target Audience Preview ({targetUsers.length} users)
                          </h4>
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                            {targetUsers.slice(0, 10).map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center p-2 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium text-blue-700">
                                    {user.name?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.role} • {user.email}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {targetUsers.length > 10 && (
                              <div className="p-2 text-center text-sm text-gray-500">
                                ... and {targetUsers.length - 10} more users
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {/* Featured Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Featured Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          {formData.featuredImage ? (
                            <div className="relative">
                              <img
                                src={formData.featuredImage.url}
                                alt="Featured"
                                className="mx-auto h-32 w-auto rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    featuredImage: null,
                                  }))
                                }
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                              </button>
                              <p className="text-sm text-gray-500 mt-2">
                                {formData.featuredImage.name}
                              </p>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "image")}
                                className="hidden"
                                id="featured-image-upload"
                                disabled={uploading}
                              />
                              <label
                                htmlFor="featured-image-upload"
                                className="cursor-pointer"
                              >
                                <IoImageOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <div className="text-sm text-gray-600">
                                  {uploading
                                    ? "Uploading..."
                                    : "Click to upload featured image"}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URL (YouTube, Vimeo, etc.)
                      </label>
                      <input
                        type="url"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleFileUpload(e, "attachment")}
                          className="hidden"
                          id="attachments-upload"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="attachments-upload"
                          className="cursor-pointer flex items-center justify-center"
                        >
                          <IoCloudUploadOutline className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-600">
                              {uploading
                                ? "Uploading..."
                                : "Click to upload attachments"}
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, TXT up to 10MB each
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Attachment List */}
                      {formData.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex items-center">
                                <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Call to Action */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          name="ctaEnabled"
                          checked={formData.ctaEnabled}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm font-medium text-gray-700">
                          Add Call-to-Action Button
                        </label>
                      </div>

                      {formData.ctaEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Button Text *
                            </label>
                            <input
                              type="text"
                              name="ctaLabel"
                              value={formData.ctaLabel}
                              onChange={handleInputChange}
                              placeholder="Learn More"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Button Link *
                            </label>
                            <input
                              type="url"
                              name="ctaLink"
                              value={formData.ctaLink}
                              onChange={handleInputChange}
                              placeholder="https://example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Button Style
                            </label>
                            <select
                              name="ctaStyle"
                              value={formData.ctaStyle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="primary">Primary (Blue)</option>
                              <option value="secondary">
                                Secondary (Gray)
                              </option>
                              <option value="outline">Outline</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule Tab */}
                {activeTab === "schedule" && (
                  <div className="space-y-6">
                    {/* Publishing Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Publishing Options
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="publishNow"
                            checked={formData.publishNow}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                publishNow: true,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Publish immediately
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="publishNow"
                            checked={!formData.publishNow}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                publishNow: false,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Schedule for later
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Date and Time */}
                    {!formData.publishNow && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Date *
                          </label>
                          <input
                            type="date"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Time *
                          </label>
                          <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date (optional)
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Update will be automatically hidden after this date
                      </p>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="allowComments"
                          checked={formData.allowComments}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Allow comments and reactions
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="sendNotification"
                          checked={formData.sendNotification}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Send push notification
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="trackEngagement"
                          checked={formData.trackEngagement}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Track engagement analytics
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="requireAcknowledgment"
                          checked={formData.requireAcknowledgment}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Require user acknowledgment
                        </label>
                      </div>
                    </div>

                    {/* Template Options */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        Template Options
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            name="templateName"
                            value={formData.templateName}
                            onChange={handleInputChange}
                            placeholder="Template name (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={saveTemplate}
                          disabled={!formData.templateName.trim() || saving}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? "Saving..." : "Save as Template"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <IoSaveOutline className="w-4 h-4 mr-2" />
                      Save Draft
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" color="white" className="mr-2" />
                        {formData.publishNow
                          ? "Publishing..."
                          : "Scheduling..."}
                      </>
                    ) : (
                      <>
                        <IoSendOutline className="w-4 h-4 mr-2" />
                        {formData.publishNow
                          ? "Publish Update"
                          : "Schedule Update"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Publishing Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Publishing Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority:</span>
                  {getPriorityBadge(formData.priority)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Audience:</span>
                  <span className="font-medium">
                    {targetAudienceSize} users
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publish:</span>
                  <span className="font-medium">
                    {formData.publishNow ? "Immediately" : "Scheduled"}
                  </span>
                </div>
                {formData.featuredImage && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Media:</span>
                    <span className="font-medium">Image attached</span>
                  </div>
                )}
                {formData.attachments.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Files:</span>
                    <span className="font-medium">
                      {formData.attachments.length} attached
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
                >
                  <IoEyeOutline className="w-4 h-4 mr-2" />
                  {showPreview ? "Edit Mode" : "Preview"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
                >
                  <IoSettingsOutline className="w-4 h-4 mr-2" />
                  Advanced Options
                  {showAdvanced ? (
                    <IoChevronUpOutline className="w-4 h-4 ml-auto" />
                  ) : (
                    <IoChevronDownOutline className="w-4 h-4 ml-auto" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center disabled:opacity-50"
                >
                  <IoSaveOutline className="w-4 h-4 mr-2" />
                  Save Draft
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                💡 Tips for Effective Updates
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Use clear, actionable titles</li>
                <li>• Keep content concise and scannable</li>
                <li>• Include relevant visuals when possible</li>
                <li>• Test different delivery methods</li>
                <li>• Use tags for better organization</li>
              </ul>
            </div>
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
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Publish"
        cancelText="Cancel"
        loading={saving}
      />
    </div>
  );
};

export default PostUpdate;
