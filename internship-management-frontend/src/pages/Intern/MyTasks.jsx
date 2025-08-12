// src/pages/Intern/MyTasks.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoSendOutline,
  IoDownloadOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoPrismOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoBookOutline,
  IoCodeSlashOutline,
  IoDesktopOutline,
  IoFolderOpenOutline,
  IoChatbubbleOutline,
  IoPersonOutline,
  IoFlagOutline,
  IoAlarmOutline,
  IoArrowUp,
  IoArrowDown,
  IoPauseCircleOutline,
} from "react-icons/io5";

const TASK_STATUS_CONFIG = {
  "Not Started": {
    color: "bg-gray-100 text-gray-800",
    icon: IoPauseCircleOutline,
    description: "Task hasn't been started yet",
    progress: 0,
    actionable: true,
  },
  "In Progress": {
    color: "bg-blue-100 text-blue-800",
    icon: IoTimeOutline,
    description: "Currently working on this task",
    progress: 25,
    actionable: true,
  },
  "Pending Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
    description: "Submitted and awaiting mentor review",
    progress: 75,
    actionable: false,
  },
  "Needs Revision": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
    description: "Requires changes based on feedback",
    progress: 50,
    actionable: true,
  },
  Approved: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
    description: "Task completed successfully",
    progress: 100,
    actionable: false,
  },
  Overdue: {
    color: "bg-red-200 text-red-900",
    icon: IoAlarmOutline,
    description: "Task is past due date",
    progress: 0,
    actionable: true,
  },
};

const PRIORITY_CONFIG = {
  Low: { color: "text-green-600", icon: IoArrowDown },
  Medium: { color: "text-yellow-600", icon: IoArrowUp },
  High: { color: "text-red-600", icon: IoArrowUp },
  Urgent: { color: "text-red-700", icon: IoFlagOutline },
};

const CATEGORY_CONFIG = {
  Development: { color: "bg-blue-100 text-blue-800", icon: IoCodeSlashOutline },
  Design: { color: "bg-purple-100 text-purple-800", icon: IoDesktopOutline },
  Research: { color: "bg-green-100 text-green-800", icon: IoBookOutline },
  Documentation: {
    color: "bg-orange-100 text-orange-800",
    icon: IoDocumentTextOutline,
  },
  Training: { color: "bg-indigo-100 text-indigo-800", icon: IoPrismOutline },
  General: { color: "bg-gray-100 text-gray-800", icon: IoFolderOpenOutline },
};

const MyTasks = () => {
  const { user } = useAuth();

  // Data states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("tasks_view_mode") || "cards"
  );
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Submission states
  const [submissionData, setSubmissionData] = useState({
    notes: "",
    files: [],
    timeSpent: "",
    challenges: "",
    learnings: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    task: null,
    title: "",
    message: "",
  });

  // Load tasks data
  const loadTasks = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Load tasks from localStorage (in a real app, this would be an API call)
        const allTasks = getData("tasks") || [];
        const userTasks = allTasks.filter(
          (task) => task.assignedTo === user.id || task.internId === user.id
        );

        // Enrich tasks with calculated fields
        const enrichedTasks = userTasks.map((task) => {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const isOverdue = dueDate < now && task.status !== "Approved";

          return {
            ...task,
            isOverdue,
            daysUntilDue: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)),
            status:
              isOverdue && task.status !== "Approved" ? "Overdue" : task.status,
            priority: task.priority || "Medium",
            category: task.category || "General",
            estimatedHours: task.estimatedHours || 0,
            actualHours: task.actualHours || 0,
            submissions: task.submissions || [],
            lastSubmission:
              task.submissions && task.submissions.length > 0
                ? task.submissions[task.submissions.length - 1]
                : null,
          };
        });

        setTasks(enrichedTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        setMessage({
          type: "error",
          text: "Failed to load tasks. Please try again.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  // Initial load and periodic refresh
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadTasks]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("tasks_view_mode", viewMode);
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

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      // Priority filter
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;

      // Due date filter
      const matchesDueDate = (() => {
        if (dueDateFilter === "all") return true;

        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        switch (dueDateFilter) {
          case "overdue":
            return daysDiff < 0;
          case "today":
            return daysDiff === 0;
          case "tomorrow":
            return daysDiff === 1;
          case "this_week":
            return daysDiff <= 7 && daysDiff >= 0;
          case "this_month":
            return daysDiff <= 30 && daysDiff >= 0;
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesDueDate
      );
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "dueDate":
          aVal = new Date(a.dueDate || 0);
          bVal = new Date(b.dueDate || 0);
          break;
        case "priority":
          { const priorityOrder = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
          aVal = priorityOrder[a.priority] || 2;
          bVal = priorityOrder[b.priority] || 2;
          break; }
        case "status":
          aVal = TASK_STATUS_CONFIG[a.status]?.progress || 0;
          bVal = TASK_STATUS_CONFIG[b.status]?.progress || 0;
          break;
        case "category":
          aVal = a.category?.toLowerCase() || "";
          bVal = b.category?.toLowerCase() || "";
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
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    dueDateFilter,
    sortBy,
    sortOrder,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const statusCounts = {};
    Object.keys(TASK_STATUS_CONFIG).forEach((status) => {
      statusCounts[status] = tasks.filter(
        (task) => task.status === status
      ).length;
    });

    const overdueTasks = tasks.filter((task) => task.isOverdue).length;
    const dueTodayTasks = tasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    }).length;

    const completionRate =
      tasks.length > 0
        ? Math.round(((statusCounts.Approved || 0) / tasks.length) * 100)
        : 0;

    return {
      total: tasks.length,
      ...statusCounts,
      overdue: overdueTasks,
      dueToday: dueTodayTasks,
      completionRate,
    };
  }, [tasks]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleStartTask = (task) => {
    updateTaskStatus(task.id, "In Progress");
  };

  const handleSubmitTask = (task) => {
    setSelectedTask(task);
    setSubmissionData({
      notes: "",
      files: [],
      timeSpent: "",
      challenges: "",
      learnings: "",
    });
    setIsSubmissionModalOpen(true);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setRefreshing(true);

      const allTasks = getData("tasks") || [];
      const updatedTasks = allTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
          : task
      );

      await saveData("tasks", updatedTasks);
      await loadTasks(true);

      setMessage({
        type: "success",
        text: `Task status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      setMessage({ type: "error", text: "Failed to update task status" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        const result = await uploadFile(
          file,
          `tasks/${selectedTask.id}/submissions`
        );
        return {
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      setSubmissionData((prev) => ({
        ...prev,
        files: [...prev.files, ...uploadedFiles],
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

  const handleSubmitTaskSubmission = async () => {
    if (!selectedTask || !submissionData.notes.trim()) {
      setMessage({ type: "error", text: "Please provide submission notes" });
      return;
    }

    setSubmitting(true);

    try {
      const submission = {
        id: `sub_${Date.now()}`,
        taskId: selectedTask.id,
        internId: user.id,
        notes: submissionData.notes,
        files: submissionData.files,
        timeSpent: submissionData.timeSpent,
        challenges: submissionData.challenges,
        learnings: submissionData.learnings,
        submittedAt: new Date().toISOString(),
        status: "Pending Review",
      };

      // Update task with new submission
      const allTasks = getData("tasks") || [];
      const updatedTasks = allTasks.map((task) => {
        if (task.id === selectedTask.id) {
          return {
            ...task,
            status: "Pending Review",
            submissions: [...(task.submissions || []), submission],
            lastSubmission: submission,
            actualHours:
              (task.actualHours || 0) +
              (parseInt(submissionData.timeSpent) || 0),
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });

      await saveData("tasks", updatedTasks);
      await loadTasks(true);

      setMessage({ type: "success", text: "Task submitted successfully!" });
      setIsSubmissionModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to submit task:", error);
      setMessage({
        type: "error",
        text: "Failed to submit task. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getDueDateColor = (task) => {
    if (task.status === "Approved") return "text-green-600";
    if (task.isOverdue) return "text-red-600";
    if (task.daysUntilDue <= 1) return "text-orange-600";
    if (task.daysUntilDue <= 7) return "text-yellow-600";
    return "text-gray-600";
  };

  const getStatusBadge = (status) => {
    const config =
      TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG["Not Started"];
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

  const getPriorityBadge = (priority) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Medium"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {priority}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["General"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {category}
      </span>
    );
  };

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => handleTaskClick(task)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {task.description}
            </p>
          </div>

          <div className="ml-4 flex flex-col items-end space-y-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {getCategoryBadge(task.category)}
          <div className="text-right">
            <p className={`text-sm font-medium ${getDueDateColor(task)}`}>
              {formatDate(task.dueDate)}
            </p>
            {task.daysUntilDue !== null && task.status !== "Approved" && (
              <p className="text-xs text-gray-500">
                {task.isOverdue
                  ? `${Math.abs(task.daysUntilDue)} days overdue`
                  : task.daysUntilDue === 0
                    ? "Due today"
                    : `${task.daysUntilDue} days left`}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{TASK_STATUS_CONFIG[task.status]?.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${TASK_STATUS_CONFIG[task.status]?.progress || 0}%`,
              }}
            />
          </div>
        </div>

        {/* Task Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {task.estimatedHours > 0 && (
              <span>Est. {task.estimatedHours}h</span>
            )}
            {task.actualHours > 0 && (
              <span className="ml-2">• Actual: {task.actualHours}h</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {task.status === "Not Started" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTask(task);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                Start Task
              </button>
            )}

            {(task.status === "In Progress" ||
              task.status === "Needs Revision") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitTask(task);
                }}
                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
              >
                Submit
              </button>
            )}

            {task.submissions && task.submissions.length > 0 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                {task.submissions.length} submission
                {task.submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaskRow = (task) => (
    <div
      key={task.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 flex items-center space-x-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 truncate">{task.description}</p>
          </div>

          <div className="hidden md:block">
            {getCategoryBadge(task.category)}
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-600">
            <span>{formatDate(task.dueDate)}</span>
          </div>

          <div className="hidden lg:block">
            {getPriorityBadge(task.priority)}
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(task.status)}

            <div className="flex items-center space-x-1">
              {task.status === "Not Started" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTask(task);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Start Task"
                >
                  <IoCreateOutline className="w-4 h-4" />
                </button>
              )}

              {(task.status === "In Progress" ||
                task.status === "Needs Revision") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitTask(task);
                  }}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Submit Task"
                >
                  <IoSendOutline className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading your tasks..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your assigned tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadTasks(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStatsChartOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoTimeOutline className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats["In Progress"] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.Approved || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoAlarmOutline className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.overdue}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCalendarOutline className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Due Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.dueToday}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoTrendingUpOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description, or category..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <IoFilterOutline className="mr-2 h-4 w-4" />
            Advanced Filters
            {(statusFilter !== "all" ||
              priorityFilter !== "all" ||
              categoryFilter !== "all" ||
              dueDateFilter !== "all") && (
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
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.keys(TASK_STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              {Object.keys(PRIORITY_CONFIG).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_CONFIG).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const parts = e.target.value.split("-");
                setSortBy(parts[0]);
                setSortOrder(parts);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dueDate-asc">Due Date (Soon First)</option>
              <option value="dueDate-desc">Due Date (Later First)</option>
              <option value="priority-desc">Priority (High First)</option>
              <option value="status-asc">Status (Progress)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="category-asc">Category</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setCategoryFilter("all");
                setDueDateFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Tasks List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tasks.length === 0 ? "No tasks assigned yet" : "No tasks found"}
          </h3>
          <p className="text-gray-500">
            {tasks.length === 0
              ? "Tasks assigned by your mentor will appear here"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "cards"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedTasks.map((task) =>
            viewMode === "cards" ? renderTaskCard(task) : renderTaskRow(task)
          )}
        </div>
      )}

      {/* Task Details Modal */}
      {isTaskModalOpen && selectedTask && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onStartTask={handleStartTask}
          onSubmitTask={handleSubmitTask}
        />
      )}

      {/* Task Submission Modal */}
      {isSubmissionModalOpen && selectedTask && (
        <TaskSubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => {
            setIsSubmissionModalOpen(false);
            setSelectedTask(null);
            setSubmissionData({
              notes: "",
              files: [],
              timeSpent: "",
              challenges: "",
              learnings: "",
            });
          }}
          task={selectedTask}
          submissionData={submissionData}
          setSubmissionData={setSubmissionData}
          onFileUpload={handleFileUpload}
          onSubmit={handleSubmitTaskSubmission}
          uploading={uploading}
          submitting={submitting}
        />
      )}
    </div>
  );
};

// Task Details Modal Component
const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  onStartTask,
  onSubmitTask,
}) => {
  if (!isOpen || !task) return null;

  const config =
    TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG["Not Started"];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Header */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {task.status}
              </span>
              <span
                className={`inline-flex items-center text-sm font-medium ${PRIORITY_CONFIG[task.priority]?.color || "text-gray-600"}`}
              >
                {React.createElement(
                  PRIORITY_CONFIG[task.priority]?.icon || IoWarningOutline,
                  { className: "w-4 h-4 mr-1" }
                )}
                {task.priority} Priority
              </span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${CATEGORY_CONFIG[task.category]?.color || "bg-gray-100 text-gray-800"}`}
              >
                {React.createElement(
                  CATEGORY_CONFIG[task.category]?.icon || IoFolderOpenOutline,
                  { className: "w-4 h-4 mr-1" }
                )}
                {task.category}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${config.progress}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">
              Description
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          </div>

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Task Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span
                    className={`font-medium ${task.isOverdue ? "text-red-600" : "text-gray-900"}`}
                  >
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium text-gray-900">
                    {task.estimatedHours || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Time:</span>
                  <span className="font-medium text-gray-900">
                    {task.actualHours || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submissions:</span>
                  <span className="font-medium text-gray-900">
                    {task.submissions?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Assignment Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned By:</span>
                  <span className="font-medium text-gray-900">
                    {task.assignedBy || "Mentor"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(
                      task.updatedAt || task.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {task.requirements && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Requirements
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.requirements}
                </p>
              </div>
            </div>
          )}

          {/* Resources */}
          {task.resources && task.resources.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Resources
              </h4>
              <div className="space-y-2">
                {task.resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">
                        {resource.name}
                      </span>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Submissions */}
          {task.submissions && task.submissions.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Previous Submissions
              </h4>
              <div className="space-y-3">
                {task.submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Submission #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {submission.notes}
                    </p>
                    {submission.files && submission.files.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <IoDocumentTextOutline className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-500">
                          {submission.files.length} file(s) attached
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">Task ID: {task.id}</div>

          <div className="flex space-x-3">
            {task.status === "Not Started" && (
              <button
                onClick={() => {
                  onStartTask(task);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Start Task
              </button>
            )}

            {(task.status === "In Progress" ||
              task.status === "Needs Revision") && (
              <button
                onClick={() => {
                  onSubmitTask(task);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Submit Task
              </button>
            )}

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

// Task Submission Modal Component
const TaskSubmissionModal = ({
  isOpen,
  onClose,
  task,
  submissionData,
  setSubmissionData,
  onFileUpload,
  onSubmit,
  uploading,
  submitting,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submit Task</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>

          {/* Submission Form */}
          <div className="space-y-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Notes *
              </label>
              <textarea
                value={submissionData.notes}
                onChange={(e) =>
                  setSubmissionData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe what you've completed, any challenges faced, and key outcomes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Time Spent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Spent (hours)
              </label>
              <input
                type="number"
                value={submissionData.timeSpent}
                onChange={(e) =>
                  setSubmissionData((prev) => ({
                    ...prev,
                    timeSpent: e.target.value,
                  }))
                }
                min="0"
                step="0.5"
                placeholder="e.g., 8.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenges Faced (Optional)
              </label>
              <textarea
                value={submissionData.challenges}
                onChange={(e) =>
                  setSubmissionData((prev) => ({
                    ...prev,
                    challenges: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Describe any challenges or obstacles you encountered..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Learnings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Learnings (Optional)
              </label>
              <textarea
                value={submissionData.learnings}
                onChange={(e) =>
                  setSubmissionData((prev) => ({
                    ...prev,
                    learnings: e.target.value,
                  }))
                }
                rows={3}
                placeholder="What did you learn from completing this task?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <input
                    type="file"
                    multiple
                    onChange={onFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading || submitting}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                    )}
                    Upload Files
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload screenshots, documents, or other relevant files (Max
                    10MB each)
                  </p>
                </div>
              </div>

              {/* Uploaded Files */}
              {submissionData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {submissionData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSubmissionData((prev) => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index),
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
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Submitting for review by your mentor
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={onSubmit}
              disabled={!submissionData.notes.trim() || submitting || uploading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" color="white" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <IoSendOutline className="w-4 h-4 mr-2" />
                  Submit Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
