import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoVideocamOutline,
  IoDocumentTextOutline,
  IoSendOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoAddOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseCircleOutline,
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoAlarmOutline,
  IoRepeatOutline,
  IoNotificationsOutline,
  IoStatsChartOutline,
  IoGridOutline,
  IoListOutline,
  IoChevronForward,
  IoChevronBack,
  IoCopyOutline,
  IoLinkOutline,
  IoClipboardOutline,
  IoBusinessOutline,
  IoSchoolOutline,
  IoPulseOutline,
  IoSpeedometerOutline,
} from "react-icons/io5";

const INTERVIEW_STATUS_CONFIG = {
  Scheduled: { color: "bg-blue-100 text-blue-800", icon: IoCalendarOutline },
  "In Progress": { color: "bg-green-100 text-green-800", icon: IoPulseOutline },
  Completed: {
    color: "bg-gray-100 text-gray-800",
    icon: IoCheckmarkCircleOutline,
  },
  Cancelled: { color: "bg-red-100 text-red-800", icon: IoCloseCircleOutline },
  Rescheduled: {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoRepeatOutline,
  },
  "No Show": { color: "bg-orange-100 text-orange-800", icon: IoWarningOutline },
};

const INTERVIEW_TYPES = {
  Technical: {
    color: "bg-purple-100 text-purple-800",
    description: "Technical assessment and coding",
  },
  HR: {
    color: "bg-green-100 text-green-800",
    description: "HR screening and culture fit",
  },
  Behavioral: {
    color: "bg-blue-100 text-blue-800",
    description: "Behavioral and situational questions",
  },
  Final: {
    color: "bg-red-100 text-red-800",
    description: "Final interview with leadership",
  },
  Group: {
    color: "bg-yellow-100 text-yellow-800",
    description: "Group discussion and collaboration",
  },
};

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const InterviewScheduler = () => {
  // Data states
  const [interviews, setInterviews] = useState([]);
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    internId: "",
    mentorId: "",
    applicationId: "",
    internshipId: "",
    type: "Technical",
    date: "",
    startTime: "",
    duration: 30,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meetingLink: "",
    location: "",
    agenda: "",
    instructions: "",
    materials: [],
    isRecurring: false,
    recurringPattern: "weekly",
    recurringEnd: "",
    sendReminders: true,
    reminderTimes: [24, 2], // hours before
    notes: "",
  });

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("interview_view_mode") || "table"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // UI feedback states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    data: null,
    title: "",
    message: "",
  });

  // Load all data
  const loadData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load all necessary data
      const [usersData, applicationsData, internshipsData, meetingsData] =
        await Promise.all([
          getData("users") || [],
          getData("applications") || [],
          getData("internships") || [],
          getData("meetings") || [],
        ]);

      // Filter users by role
      const internsData = usersData.filter((user) => user.role === "intern");
      const mentorsData = usersData.filter((user) => user.role === "mentor");

      // Enrich interviews with related data
      const enrichedInterviews = meetingsData.map((meeting) => {
        const intern = internsData.find(
          (u) => u.id === meeting.participants?.[0] || u.id === meeting.internId
        );
        const mentor = mentorsData.find(
          (u) => u.id === meeting.mentor || u.id === meeting.mentorId
        );
        const application = applicationsData.find(
          (app) => app.applicationId === meeting.applicationId
        );
        const internship = internshipsData.find(
          (i) => i.id === meeting.internshipId
        );

        // Calculate interview timing
        const interviewDate = new Date(
          `${meeting.date}T${meeting.time || meeting.startTime}:00`
        );
        const duration = parseInt(meeting.duration) || 30;
        const endTime = new Date(interviewDate.getTime() + duration * 60000);
        const now = new Date();

        // Determine status based on timing and current status
        let status = meeting.status || "Scheduled";
        if (status === "Scheduled") {
          if (now > endTime) {
            status = "Completed";
          } else if (now > interviewDate && now < endTime) {
            status = "In Progress";
          }
        }

        return {
          ...meeting,
          id: meeting.id || `interview_${Date.now()}_${Math.random()}`,
          intern: intern || {
            name: "Unknown Intern",
            email: "",
            university: "",
          },
          mentor: mentor || { name: "Unknown Mentor", email: "" },
          application: application || {},
          internship: internship || { title: "Unknown Position" },
          startTime: meeting.time || meeting.startTime,
          endTime: `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`,
          status,
          type: meeting.type || "Technical",
          materials: meeting.materials || [],
          feedback: meeting.feedback || "",
          rating: meeting.rating || 0,
          createdAt: meeting.createdAt || new Date().toISOString(),
          updatedAt: meeting.updatedAt || new Date().toISOString(),
        };
      });

      setInterviews(enrichedInterviews);
      setInterns(internsData);
      setMentors(mentorsData);
      setApplications(applicationsData);
      setInternships(internshipsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      setMessage({
        type: "error",
        text: "Failed to load interview data. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadData]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("interview_view_mode", viewMode);
  }, [viewMode]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Get available applications for selected intern
  const availableApplications = useMemo(() => {
    if (!formData.internId) return [];

    return applications
      .filter(
        (app) =>
          (app.internId === formData.internId ||
            app.userId === formData.internId) &&
          [
            "Submitted",
            "Under Review",
            "Interview Scheduled",
            "Shortlisted",
          ].includes(app.status)
      )
      .map((app) => {
        const internship = internships.find((i) => i.id === app.internshipId);
        return {
          ...app,
          internshipTitle: internship?.title || "Unknown Position",
        };
      });
  }, [formData.internId, applications, internships]);

  // Check for scheduling conflicts
  const checkConflicts = useCallback(
    (date, startTime, duration, excludeId = null) => {
      const newStart = new Date(`${date}T${startTime}:00`);
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      return interviews.filter((interview) => {
        if (excludeId && interview.id === excludeId) return false;

        const existingStart = new Date(
          `${interview.date}T${interview.startTime}:00`
        );
        const existingEnd = new Date(
          existingStart.getTime() + parseInt(interview.duration) * 60000
        );

        return (
          newStart < existingEnd &&
          newEnd > existingStart &&
          (interview.mentorId === formData.mentorId ||
            interview.mentor === formData.mentorId)
        );
      });
    },
    [interviews, formData.mentorId]
  );

  // Filter and sort interviews
  const filteredAndSortedInterviews = useMemo(() => {
    let filtered = interviews.filter((interview) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        interview.intern?.name?.toLowerCase().includes(searchLower) ||
        interview.mentor?.name?.toLowerCase().includes(searchLower) ||
        interview.internship?.title?.toLowerCase().includes(searchLower) ||
        interview.agenda?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" || interview.status === statusFilter;
      const matchesType = typeFilter === "all" || interview.type === typeFilter;
      const matchesMentor =
        mentorFilter === "all" ||
        interview.mentor?.id === mentorFilter ||
        interview.mentorId === mentorFilter;

      const matchesDate = (() => {
        if (dateFilter === "all") return true;

        const interviewDate = new Date(interview.date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() + 7);

        switch (dateFilter) {
          case "today":
            return interviewDate.toDateString() === today.toDateString();
          case "tomorrow":
            return interviewDate.toDateString() === tomorrow.toDateString();
          case "this_week":
            return interviewDate >= today && interviewDate <= thisWeek;
          case "past":
            return interviewDate < today;
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesMentor &&
        matchesDate
      );
    });

    // Sort interviews
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "date":
          aVal = new Date(`${a.date}T${a.startTime}:00`);
          bVal = new Date(`${b.date}T${b.startTime}:00`);
          break;
        case "intern":
          aVal = a.intern?.name?.toLowerCase() || "";
          bVal = b.intern?.name?.toLowerCase() || "";
          break;
        case "mentor":
          aVal = a.mentor?.name?.toLowerCase() || "";
          bVal = b.mentor?.name?.toLowerCase() || "";
          break;
        case "position":
          aVal = a.internship?.title?.toLowerCase() || "";
          bVal = b.internship?.title?.toLowerCase() || "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        default:
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [
    interviews,
    searchQuery,
    statusFilter,
    typeFilter,
    mentorFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = interviews.length;
    const scheduled = interviews.filter((i) => i.status === "Scheduled").length;
    const completed = interviews.filter((i) => i.status === "Completed").length;
    const cancelled = interviews.filter((i) => i.status === "Cancelled").length;

    const today = new Date();
    const todayInterviews = interviews.filter((i) => {
      const interviewDate = new Date(i.date);
      return interviewDate.toDateString() === today.toDateString();
    }).length;

    const thisWeekInterviews = interviews.filter((i) => {
      const interviewDate = new Date(i.date);
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return interviewDate >= today && interviewDate <= weekFromNow;
    }).length;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      today: todayInterviews,
      thisWeek: thisWeekInterviews,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [interviews]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedInterviews.length / itemsPerPage
  );
  const paginatedInterviews = filteredAndSortedInterviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMaterialUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        const result = await uploadFile(file, "interview-materials");
        return {
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        materials: [...prev.materials, ...uploadedFiles],
      }));

      setMessage({
        type: "success",
        text: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("File upload failed:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to upload files",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.internId ||
      !formData.mentorId ||
      !formData.date ||
      !formData.startTime
    ) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    // Check for conflicts
    const conflicts = checkConflicts(
      formData.date,
      formData.startTime,
      formData.duration,
      editingInterview?.id
    );

    if (conflicts.length > 0) {
      setMessage({
        type: "error",
        text: `Scheduling conflict detected with existing interview at ${conflicts[0].startTime}`,
      });
      return;
    }

    setSaving(true);
    try {
      const interviewData = {
        id: editingInterview?.id || `interview_${Date.now()}`,
        internId: formData.internId,
        mentorId: formData.mentorId,
        applicationId: formData.applicationId,
        internshipId: formData.internshipId,
        type: formData.type,
        title: formData.type + " Interview",
        date: formData.date,
        startTime: formData.startTime,
        time: formData.startTime, // Backward compatibility
        duration: formData.duration.toString(),
        timezone: formData.timezone,
        link: formData.meetingLink,
        location: formData.location,
        agenda: formData.agenda,
        instructions: formData.instructions,
        materials: formData.materials,
        status: "Scheduled",
        participants: [formData.internId], // Backward compatibility
        mentor: formData.mentorId, // Backward compatibility
        sendReminders: formData.sendReminders,
        reminderTimes: formData.reminderTimes,
        notes: formData.notes,
        createdAt: editingInterview?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentInterviews = getData("meetings") || [];
      let updatedInterviews;

      if (editingInterview) {
        updatedInterviews = currentInterviews.map((interview) =>
          interview.id === editingInterview.id ? interviewData : interview
        );
        setMessage({
          type: "success",
          text: "Interview updated successfully!",
        });
      } else {
        updatedInterviews = [...currentInterviews, interviewData];
        setMessage({
          type: "success",
          text: "Interview scheduled successfully!",
        });
      }

      await saveData("meetings", updatedInterviews);

      // Reset form
      resetForm();
      await loadData(true);
    } catch (error) {
      console.error("Failed to save interview:", error);
      setMessage({
        type: "error",
        text: "Failed to save interview. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      internId: "",
      mentorId: "",
      applicationId: "",
      internshipId: "",
      type: "Technical",
      date: "",
      startTime: "",
      duration: 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingLink: "",
      location: "",
      agenda: "",
      instructions: "",
      materials: [],
      isRecurring: false,
      recurringPattern: "weekly",
      recurringEnd: "",
      sendReminders: true,
      reminderTimes: [24, 2],
      notes: "",
    });
    setEditingInterview(null);
    setShowForm(false);
  };

  const handleEdit = (interview) => {
    const selectedApplication = applications.find(
      (app) => app.applicationId === interview.applicationId
    );

    setFormData({
      internId: interview.internId || interview.intern?.id || "",
      mentorId: interview.mentorId || interview.mentor?.id || "",
      applicationId: interview.applicationId || "",
      internshipId:
        selectedApplication?.internshipId || interview.internshipId || "",
      type: interview.type || "Technical",
      date: interview.date || "",
      startTime: interview.startTime || interview.time || "",
      duration: parseInt(interview.duration) || 30,
      timezone:
        interview.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingLink: interview.link || "",
      location: interview.location || "",
      agenda: interview.agenda || "",
      instructions: interview.instructions || "",
      materials: interview.materials || [],
      sendReminders: interview.sendReminders !== false,
      reminderTimes: interview.reminderTimes || [24, 2],
      notes: interview.notes || "",
    });

    setEditingInterview(interview);
    setShowForm(true);
  };

  const handleDelete = (interview) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      data: interview,
      title: "Delete Interview",
      message: `Are you sure you want to delete the interview with ${interview.intern?.name}? This action cannot be undone.`,
    });
  };

  const handleStatusChange = async (interview, newStatus) => {
    try {
      setRefreshing(true);

      const currentInterviews = getData("meetings") || [];
      const updatedInterviews = currentInterviews.map((item) =>
        item.id === interview.id
          ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
          : item
      );

      await saveData("meetings", updatedInterviews);
      await loadData(true);

      setMessage({
        type: "success",
        text: `Interview status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      setMessage({ type: "error", text: "Failed to update interview status" });
    } finally {
      setRefreshing(false);
    }
  };

  const confirmAction = async () => {
    const { type, data } = confirmModal;

    try {
      setRefreshing(true);

      if (type === "delete") {
        const currentInterviews = getData("meetings") || [];
        const updatedInterviews = currentInterviews.filter(
          (interview) => interview.id !== data.id
        );

        await saveData("meetings", updatedInterviews);
        setMessage({ type: "success", text: "Interview deleted successfully" });
      }

      await loadData(true);
    } catch (error) {
      console.error("Action failed:", error);
      setMessage({ type: "error", text: "Action failed. Please try again." });
    } finally {
      setRefreshing(false);
      setConfirmModal({
        isOpen: false,
        type: null,
        data: null,
        title: "",
        message: "",
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage({ type: "success", text: "Copied to clipboard!" });
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes] = timeString.split(":");
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status) => {
    const config =
      INTERVIEW_STATUS_CONFIG[status] || INTERVIEW_STATUS_CONFIG["Scheduled"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const config = INTERVIEW_TYPES[type] || INTERVIEW_TYPES["Technical"];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
      >
        {type}
      </span>
    );
  };

  const renderInterviewCard = (interview) => (
    <div
      key={interview.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {interview.internship?.title || "Interview"}
              </h3>
              {getTypeBadge(interview.type)}
            </div>
            <p className="text-sm text-gray-600">
              with <span className="font-medium">{interview.intern?.name}</span>
            </p>
            <p className="text-xs text-gray-500">
              {interview.intern?.university}
            </p>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(interview.status)}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedInterview(interview)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="View Details"
              >
                <IoEyeOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(interview)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Edit"
              >
                <IoCreateOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(interview)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <IoTrashOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <IoCalendarOutline className="w-4 h-4 mr-2" />
            {formatDate(interview.date)}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <IoTimeOutline className="w-4 h-4 mr-2" />
            {formatTime(interview.startTime)} - {formatTime(interview.endTime)}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <IoPersonOutline className="w-4 h-4 mr-2" />
            {interview.mentor?.name}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <IoAlarmOutline className="w-4 h-4 mr-2" />
            {interview.duration} min
          </div>
        </div>

        {interview.agenda && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-3 rounded-md">
              {interview.agenda}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {interview.materials && interview.materials.length > 0 && (
              <span className="flex items-center">
                <IoDocumentTextOutline className="w-3 h-3 mr-1" />
                {interview.materials.length} file(s)
              </span>
            )}
            {interview.link && (
              <span className="flex items-center">
                <IoVideocamOutline className="w-3 h-3 mr-1" />
                Video call
              </span>
            )}
          </div>

          {interview.link && (
            <button
              onClick={() => copyToClipboard(interview.link)}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <IoLinkOutline className="w-3 h-3 mr-1 inline" />
              Copy Link
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderInterviewRow = (interview) => (
    <tr key={interview.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-blue-700">
              {interview.intern?.name?.charAt(0) || "I"}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {interview.intern?.name || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">
              {interview.intern?.university}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{interview.mentor?.name}</div>
        <div className="text-sm text-gray-500">{interview.mentor?.email}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {interview.internship?.title || "N/A"}
        </div>
        {getTypeBadge(interview.type)}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>{formatDate(interview.date)}</div>
        <div className="text-gray-500">
          {formatTime(interview.startTime)} - {formatTime(interview.endTime)}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(interview.status)}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedInterview(interview);
              setShowInterviewModal(true);
            }}
            className="text-blue-600 hover:text-blue-700"
            title="View Details"
          >
            <IoEyeOutline className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleEdit(interview)}
            className="text-green-600 hover:text-green-700"
            title="Edit"
          >
            <IoCreateOutline className="w-4 h-4" />
          </button>

          {interview.link && (
            <button
              onClick={() => copyToClipboard(interview.link)}
              className="text-purple-600 hover:text-purple-700"
              title="Copy Meeting Link"
            >
              <IoLinkOutline className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleDelete(interview)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <IoTrashOutline className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading interview scheduler..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Scheduler
          </h1>
          <p className="text-gray-600 mt-2">
            Schedule and manage candidate interviews
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Schedule Interview
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCalendarOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoTimeOutline className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.scheduled}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoAlarmOutline className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.today}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStatsChartOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.thisWeek}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoSpeedometerOutline className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search interviews by intern name, mentor, or position..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <IoFilterOutline className="mr-2 h-4 w-4" />
            Filters
            {(statusFilter !== "all" ||
              typeFilter !== "all" ||
              mentorFilter !== "all" ||
              dateFilter !== "all") && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                Active
              </span>
            )}
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.keys(INTERVIEW_STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {Object.keys(INTERVIEW_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={mentorFilter}
              onChange={(e) => setMentorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Mentors</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this_week">This Week</option>
              <option value="past">Past Interviews</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-asc">Date (Earliest First)</option>
              <option value="date-desc">Date (Latest First)</option>
              <option value="intern-asc">Intern Name (A-Z)</option>
              <option value="mentor-asc">Mentor Name (A-Z)</option>
              <option value="status-asc">Status</option>
              <option value="type-asc">Type</option>
            </select>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedInterviews.length} of {interviews.length}{" "}
          interviews
        </div>
      </div>

      {/* Interview List */}
      {filteredAndSortedInterviews.length === 0 ? (
        <div className="text-center py-12">
          <IoCalendarOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {interviews.length === 0
              ? "No interviews scheduled"
              : "No interviews found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {interviews.length === 0
              ? "Get started by scheduling your first interview"
              : "Try adjusting your search or filters"}
          </p>
          {interviews.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <IoAddOutline className="w-4 h-4 mr-2" />
              Schedule First Interview
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {paginatedInterviews.map((interview) =>
                renderInterviewCard(interview)
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInterviews.map((interview) =>
                    renderInterviewRow(interview)
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedInterviews.length
                  )}{" "}
                  of {filteredAndSortedInterviews.length} interviews
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoChevronBack className="w-4 h-4" />
                </button>

                <span className="text-sm font-medium text-gray-900">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoChevronForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule Interview Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingInterview ? "Edit Interview" : "Schedule New Interview"}
              </h2>
              <button
                onClick={resetForm}
                disabled={saving}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
              >
                <IoCloseCircleOutline size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Intern Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Intern *
                  </label>
                  <select
                    name="internId"
                    value={formData.internId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose intern...</option>
                    {interns.map((intern) => (
                      <option key={intern.id} value={intern.id}>
                        {intern.name} - {intern.university}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mentor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Mentor *
                  </label>
                  <select
                    name="mentorId"
                    value={formData.mentorId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose mentor...</option>
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.name} - {mentor.department || "Admin"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Application Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application
                  </label>
                  <select
                    name="applicationId"
                    value={formData.applicationId}
                    onChange={handleInputChange}
                    disabled={
                      !formData.internId || availableApplications.length === 0
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {!formData.internId
                        ? "Select intern first"
                        : availableApplications.length === 0
                          ? "No applications available"
                          : "Choose application..."}
                    </option>
                    {availableApplications.map((app) => (
                      <option key={app.applicationId} value={app.applicationId}>
                        {app.internshipTitle}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interview Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {Object.entries(INTERVIEW_TYPES).map(([type, config]) => (
                      <option key={type} value={type}>
                        {type} - {config.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/xyz or https://zoom.us/j/123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (if in-person)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Conference Room A, Floor 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">GMT</option>
                    <option value="Asia/Kolkata">IST</option>
                  </select>
                </div>
              </div>

              {/* Agenda */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda
                </label>
                <textarea
                  name="agenda"
                  value={formData.agenda}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Interview agenda and topics to be covered..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Instructions */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Participant
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Special instructions, preparation materials, or requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Materials Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Materials
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleMaterialUpload}
                      className="hidden"
                      id="materials-upload"
                      disabled={uploading}
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                    />
                    <label
                      htmlFor="materials-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                          Upload Materials
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload interview questions, job descriptions, or other
                      materials
                    </p>
                  </div>
                </div>

                {/* Uploaded Materials */}
                {formData.materials.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.materials.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center">
                          <IoDocumentTextOutline className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              materials: prev.materials.filter(
                                (_, i) => i !== index
                              ),
                            }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder Settings */}
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="sendReminders"
                    checked={formData.sendReminders}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    Send email reminders
                  </label>
                </div>

                {formData.sendReminders && (
                  <div className="ml-6">
                    <p className="text-sm text-gray-600 mb-2">
                      Reminder schedule:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[24, 2, 1].map((hours) => (
                        <label key={hours} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.reminderTimes.includes(hours)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.reminderTimes, hours]
                                : formData.reminderTimes.filter(
                                    (h) => h !== hours
                                  );
                              setFormData((prev) => ({
                                ...prev,
                                reminderTimes: updated,
                              }));
                            }}
                            className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-1 text-xs text-gray-600">
                            {hours === 1 ? "1 hour" : `${hours} hours`} before
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Internal notes for admin use only..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Conflict Warning */}
              {formData.date &&
                formData.startTime &&
                formData.mentorId &&
                (() => {
                  const conflicts = checkConflicts(
                    formData.date,
                    formData.startTime,
                    formData.duration,
                    editingInterview?.id
                  );
                  return (
                    conflicts.length > 0 && (
                      <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <IoWarningOutline className="h-5 w-5 text-red-400 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-red-800">
                              Scheduling Conflict Detected
                            </h3>
                            <p className="mt-1 text-sm text-red-700">
                              The selected mentor has another interview at{" "}
                              {conflicts[0].startTime} on this date.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  );
                })()}

              {/* Form Actions */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      {editingInterview ? "Updating..." : "Scheduling..."}
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="w-4 h-4 mr-2" />
                      {editingInterview
                        ? "Update Interview"
                        : "Schedule Interview"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Details Modal */}
      {showInterviewModal && selectedInterview && (
        <InterviewDetailsModal
          isOpen={showInterviewModal}
          onClose={() => {
            setShowInterviewModal(false);
            setSelectedInterview(null);
          }}
          interview={selectedInterview}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            data: null,
            title: "",
            message: "",
          })
        }
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
        loading={refreshing}
      />
    </div>
  );
};

// Interview Details Modal Component
const InterviewDetailsModal = ({
  isOpen,
  onClose,
  interview,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !interview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Interview Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {interview.internship?.title || "Interview"}
              </h3>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${INTERVIEW_STATUS_CONFIG[interview.status]?.color}`}
                >
                  {React.createElement(
                    INTERVIEW_STATUS_CONFIG[interview.status]?.icon,
                    { className: "w-4 h-4 mr-2" }
                  )}
                  {interview.status}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${INTERVIEW_TYPES[interview.type]?.color}`}
                >
                  {interview.type}
                </span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Intern</h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {interview.intern?.name?.charAt(0) || "I"}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {interview.intern?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {interview.intern?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {interview.intern?.university}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Interviewer
              </h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700">
                    {interview.mentor?.name?.charAt(0) || "M"}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {interview.mentor?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {interview.mentor?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {interview.mentor?.department || "Admin"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Schedule</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <div className="font-medium">
                  {new Date(interview.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <div className="font-medium">
                  {new Date(
                    `${interview.date}T${interview.startTime}:00`
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  - {interview.endTime}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="font-medium">{interview.duration} minutes</div>
              </div>
              <div>
                <span className="text-gray-500">Timezone:</span>
                <div className="font-medium">{interview.timezone || "UTC"}</div>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          {(interview.link || interview.location) && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Meeting Details
              </h4>
              <div className="space-y-2">
                {interview.link && (
                  <div className="flex items-center space-x-2">
                    <IoVideocamOutline className="w-4 h-4 text-blue-600" />
                    <a
                      href={interview.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Join Video Call
                    </a>
                  </div>
                )}
                {interview.location && (
                  <div className="flex items-center space-x-2">
                    <IoLocationOutline className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">{interview.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Agenda */}
          {interview.agenda && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Agenda</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {interview.agenda}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {interview.instructions && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Instructions
              </h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {interview.instructions}
                </p>
              </div>
            </div>
          )}

          {/* Materials */}
          {interview.materials && interview.materials.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Materials
              </h4>
              <div className="space-y-2">
                {interview.materials.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {interview.status === "Scheduled" && (
                <>
                  <button
                    onClick={() => onStatusChange(interview, "In Progress")}
                    className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                  >
                    Start Interview
                  </button>
                  <button
                    onClick={() => onStatusChange(interview, "Rescheduled")}
                    className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => onStatusChange(interview, "Cancelled")}
                    className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Cancel
                  </button>
                </>
              )}
              {interview.status === "In Progress" && (
                <button
                  onClick={() => onStatusChange(interview, "Completed")}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Created: {new Date(interview.createdAt).toLocaleString()}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => onEdit(interview)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Edit Interview
            </button>

            <button
              onClick={() => onDelete(interview)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              Delete
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;
