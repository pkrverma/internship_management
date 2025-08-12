// src/pages/Mentor/ReviewTasks.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoCloudDownloadOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoSendOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoStarOutline,
  IoStarHalfOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoFolderOpenOutline,
  IoAlarmOutline,
  IoPulseOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCheckboxOutline,
  IoSquareOutline,
} from "react-icons/io5";

const TASK_STATUS_CONFIG = {
  "Pending Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
    description: "Awaiting your review",
    actionable: true,
  },
  "Needs Revision": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
    description: "Requires changes",
    actionable: true,
  },
  "In Progress": {
    color: "bg-blue-100 text-blue-800",
    icon: IoPulseOutline,
    description: "Currently being worked on",
    actionable: false,
  },
  Approved: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
    description: "Task completed successfully",
    actionable: false,
  },
  Overdue: {
    color: "bg-red-200 text-red-900",
    icon: IoAlarmOutline,
    description: "Past due date",
    actionable: true,
  },
};

const PRIORITY_CONFIG = {
  Low: { color: "text-green-600", icon: IoArrowDownOutline },
  Medium: { color: "text-yellow-600", icon: IoArrowUpOutline },
  High: { color: "text-red-600", icon: IoArrowUpOutline },
  Urgent: { color: "text-red-700", icon: IoWarningOutline },
};

const ReviewTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Review");
  const [internFilter, setInternFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("submittedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("review_tasks_view") || "cards"
  );
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review states
  const [reviewData, setReviewData] = useState({
    status: "",
    feedback: "",
    grade: "",
    timeSpent: "",
    suggestions: "",
    nextSteps: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Load tasks and related data
  const loadData = useCallback(
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

        // Load all necessary data
        const [allTasks, allUsers] = await Promise.all([
          getData("tasks") || [],
          getData("users") || [],
        ]);

        // Filter interns assigned to this mentor
        const mentorInterns = allUsers.filter(
          (u) =>
            u.role === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              u.mentor === user.name)
        );

        // Get tasks assigned to mentor's interns or directly to mentor
        const internIds = mentorInterns.map((intern) => intern.id);
        const mentorTasks = allTasks.filter(
          (task) =>
            internIds.includes(task.assignedTo || task.internId) ||
            task.mentorId === user.id ||
            task.assignedBy === user.name ||
            task.reviewerId === user.id
        );

        // Enrich tasks with intern information and submission data
        const enrichedTasks = mentorTasks.map((task) => {
          const assignedIntern = mentorInterns.find(
            (intern) =>
              intern.id === task.assignedTo || intern.id === task.internId
          );

          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const isOverdue = dueDate < now && task.status !== "Approved";

          const latestSubmission =
            task.submissions && task.submissions.length > 0
              ? task.submissions[task.submissions.length - 1]
              : null;

          return {
            ...task,
            internName:
              assignedIntern?.name ||
              assignedIntern?.firstName + " " + assignedIntern?.lastName ||
              "Unknown",
            internEmail: assignedIntern?.email || "",
            internUniversity: assignedIntern?.university || "",
            isOverdue,
            daysOverdue: isOverdue
              ? Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24))
              : 0,
            submittedDate:
              latestSubmission?.submittedAt ||
              task.submittedAt ||
              task.updatedAt,
            submissionNotes: latestSubmission?.notes || "",
            submissionFiles: latestSubmission?.files || [],
            timeSpent: latestSubmission?.timeSpent || task.actualHours || 0,
            challenges: latestSubmission?.challenges || "",
            learnings: latestSubmission?.learnings || "",
            priority: task.priority || "Medium",
            category: task.category || "General",
          };
        });

        setTasks(enrichedTasks);
        setInterns(mentorInterns);
      } catch (error) {
        console.error("Failed to load review tasks:", error);
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
    localStorage.setItem("review_tasks_view", viewMode);
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
        task.internName?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      // Intern filter
      const matchesIntern =
        internFilter === "all" ||
        task.assignedTo === internFilter ||
        task.internId === internFilter;

      // Priority filter
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

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
        matchesIntern &&
        matchesPriority &&
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
        case "internName":
          aVal = a.internName?.toLowerCase() || "";
          bVal = b.internName?.toLowerCase() || "";
          break;
        case "submittedDate":
          aVal = new Date(a.submittedDate || 0);
          bVal = new Date(b.submittedDate || 0);
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
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          aVal = new Date(a.submittedDate || 0);
          bVal = new Date(b.submittedDate || 0);
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
    internFilter,
    priorityFilter,
    dueDateFilter,
    sortBy,
    sortOrder,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendingReview = tasks.filter(
      (task) => task.status === "Pending Review"
    ).length;
    const needsRevision = tasks.filter(
      (task) => task.status === "Needs Revision"
    ).length;
    const overdue = tasks.filter((task) => task.isOverdue).length;
    const avgTimeSpent =
      tasks.length > 0
        ? Math.round(
            (tasks.reduce(
              (sum, task) => sum + (parseFloat(task.timeSpent) || 0),
              0
            ) /
              tasks.length) *
              10
          ) / 10
        : 0;

    return {
      total,
      pendingReview,
      needsRevision,
      overdue,
      avgTimeSpent,
    };
  }, [tasks]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setReviewData({
      status: task.status === "Pending Review" ? "Approved" : task.status,
      feedback: "",
      grade: "",
      timeSpent: task.timeSpent?.toString() || "",
      suggestions: "",
      nextSteps: "",
    });
    setIsReviewModalOpen(true);
  };

  const handleBulkAction = (action) => {
    if (selectedTasks.size === 0) {
      setMessage({
        type: "error",
        text: "Please select tasks to perform bulk action",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "bulk_action",
      title: `Bulk ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} ${selectedTasks.size} selected task(s)?`,
      data: { action, taskIds: Array.from(selectedTasks) },
    });
  };

  const handleReviewSubmit = async () => {
    if (!selectedTask || !reviewData.feedback.trim()) {
      setMessage({
        type: "error",
        text: "Please provide feedback for the task",
      });
      return;
    }

    setSubmitting(true);

    try {
      const allTasks = getData("tasks") || [];
      const updatedTasks = allTasks.map((task) => {
        if (task.id === selectedTask.id) {
          const review = {
            id: `review_${Date.now()}`,
            reviewerId: user.id,
            reviewerName: user.name,
            status: reviewData.status,
            feedback: reviewData.feedback,
            grade: reviewData.grade,
            suggestions: reviewData.suggestions,
            nextSteps: reviewData.nextSteps,
            reviewedAt: new Date().toISOString(),
          };

          return {
            ...task,
            status: reviewData.status,
            reviews: [...(task.reviews || []), review],
            lastReview: review,
            reviewedAt: new Date().toISOString(),
            reviewedBy: user.name,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });

      await saveData("tasks", updatedTasks);
      await loadData(true);

      setMessage({
        type: "success",
        text: `Task review submitted successfully! Status changed to ${reviewData.status}`,
      });

      setIsReviewModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to submit review:", error);
      setMessage({
        type: "error",
        text: "Failed to submit review. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAction = async () => {
    const { type, data } = confirmModal;

    try {
      setRefreshing(true);

      if (type === "bulk_action") {
        const allTasks = getData("tasks") || [];
        const updatedTasks = allTasks.map((task) => {
          if (data.taskIds.includes(task.id)) {
            const newStatus =
              data.action === "Approve" ? "Approved" : "Needs Revision";
            const review = {
              id: `review_${Date.now()}`,
              reviewerId: user.id,
              reviewerName: user.name,
              status: newStatus,
              feedback: `Bulk ${data.action.toLowerCase()} by mentor`,
              reviewedAt: new Date().toISOString(),
            };

            return {
              ...task,
              status: newStatus,
              reviews: [...(task.reviews || []), review],
              lastReview: review,
              reviewedAt: new Date().toISOString(),
              reviewedBy: user.name,
              updatedAt: new Date().toISOString(),
            };
          }
          return task;
        });

        await saveData("tasks", updatedTasks);
        setSelectedTasks(new Set());
        setMessage({
          type: "success",
          text: `${data.action} applied to ${data.taskIds.length} task(s)`,
        });
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
        title: "",
        message: "",
        data: null,
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map((task) => task.id)));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const config = TASK_STATUS_CONFIG[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: IoTimeOutline,
    };
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

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      className={`bg-white rounded-lg shadow-sm border-2 hover:shadow-md transition-all duration-200 cursor-pointer ${
        selectedTasks.has(task.id)
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200"
      } ${task.isOverdue ? "ring-2 ring-red-200" : ""}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedTasks.has(task.id)}
              onChange={(e) => {
                e.stopPropagation();
                const newSelected = new Set(selectedTasks);
                if (e.target.checked) {
                  newSelected.add(task.id);
                } else {
                  newSelected.delete(task.id);
                }
                setSelectedTasks(newSelected);
              }}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {task.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Submitted by:{" "}
                <span className="font-medium">{task.internName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Submitted:</span>
            <span className="font-medium">
              {formatDate(task.submittedDate)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Due Date:</span>
            <span
              className={`font-medium ${task.isOverdue ? "text-red-600" : "text-gray-900"}`}
            >
              {formatDate(task.dueDate)}
              {task.isOverdue && ` (${task.daysOverdue} days overdue)`}
            </span>
          </div>

          {task.timeSpent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Time Spent:</span>
              <span className="font-medium">{task.timeSpent}h</span>
            </div>
          )}

          {task.category && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Category:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium">
                {task.category}
              </span>
            </div>
          )}
        </div>

        {task.submissionNotes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-md">
              {task.submissionNotes}
            </p>
          </div>
        )}

        {task.submissionFiles && task.submissionFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <IoDocumentTextOutline className="w-4 h-4" />
              <span>{task.submissionFiles.length} file(s) attached</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <IoPersonOutline className="w-3 h-3" />
            <span>{task.internUniversity || "University"}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskClick(task);
              }}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Review Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaskRow = (task) => (
    <div
      key={task.id}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200 ${
        selectedTasks.has(task.id)
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200"
      } ${task.isOverdue ? "ring-1 ring-red-200" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={selectedTasks.has(task.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedTasks);
              if (e.target.checked) {
                newSelected.add(task.id);
              } else {
                newSelected.delete(task.id);
              }
              setSelectedTasks(newSelected);
            }}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {task.internName} • {task.internUniversity}
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs text-gray-600">
            <span>{formatDate(task.submittedDate)}</span>
            <span className={task.isOverdue ? "text-red-600" : ""}>
              {formatDate(task.dueDate)}
            </span>
          </div>

          <div className="hidden lg:block">
            {getPriorityBadge(task.priority)}
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(task.status)}

            <button
              onClick={() => handleTaskClick(task)}
              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
              title="Review Task"
            >
              <IoEyeOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading tasks for review..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Review Intern Tasks
          </h1>
          <p className="text-gray-600 mt-1">
            Review and provide feedback on submitted tasks
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoDocumentTextOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoEyeOutline className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Pending Review
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendingReview}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoWarningOutline className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Needs Revision
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.needsRevision}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoAlarmOutline className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.overdue}
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
            placeholder="Search tasks by title, intern name, or category..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline className="mr-2 h-4 w-4" />
              Advanced Filters
              {(statusFilter !== "all" ||
                internFilter !== "all" ||
                priorityFilter !== "all" ||
                dueDateFilter !== "all") && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  Active
                </span>
              )}
            </button>

            {/* Bulk Actions */}
            {selectedTasks.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedTasks.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction("Approve")}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => handleBulkAction("Request Revision")}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  Bulk Revision
                </button>
              </div>
            )}
          </div>

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
              value={internFilter}
              onChange={(e) => setInternFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Interns</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name}
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
                const [sort, order] = e.target.value.split("-");
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="submittedDate-desc">Newest First</option>
              <option value="submittedDate-asc">Oldest First</option>
              <option value="dueDate-asc">Due Date (Soon First)</option>
              <option value="priority-desc">Priority (High First)</option>
              <option value="internName-asc">Intern Name (A-Z)</option>
              <option value="title-asc">Task Title (A-Z)</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter("all");
                setInternFilter("all");
                setPriorityFilter("all");
                setDueDateFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={
                selectedTasks.size === filteredAndSortedTasks.length &&
                filteredAndSortedTasks.length > 0
              }
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              Select All ({filteredAndSortedTasks.length} tasks)
            </span>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tasks.length === 0 ? "No tasks to review" : "No tasks found"}
          </h3>
          <p className="text-gray-500">
            {tasks.length === 0
              ? "Tasks submitted by your interns will appear here for review"
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

      {/* Task Review Modal */}
      {isReviewModalOpen && selectedTask && (
        <TaskReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedTask(null);
            setReviewData({
              status: "",
              feedback: "",
              grade: "",
              timeSpent: "",
              suggestions: "",
              nextSteps: "",
            });
          }}
          task={selectedTask}
          reviewData={reviewData}
          setReviewData={setReviewData}
          onSubmit={handleReviewSubmit}
          submitting={submitting}
        />
      )}

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
        confirmText="Confirm"
        cancelText="Cancel"
        loading={refreshing}
      />
    </div>
  );
};

// Task Review Modal Component
const TaskReviewModal = ({
  isOpen,
  onClose,
  task,
  reviewData,
  setReviewData,
  onSubmit,
  submitting,
}) => {
  if (!isOpen || !task) return null;

  const gradeOptions = [
    { value: "", label: "No Grade" },
    { value: "A+", label: "A+ (Outstanding)" },
    { value: "A", label: "A (Excellent)" },
    { value: "B+", label: "B+ (Very Good)" },
    { value: "B", label: "B (Good)" },
    { value: "C+", label: "C+ (Satisfactory)" },
    { value: "C", label: "C (Needs Improvement)" },
    { value: "D", label: "D (Poor)" },
    { value: "F", label: "F (Fail)" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Review Task</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <IoCloseCircleOutline size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {task.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Intern:</span>
                <span className="ml-2 text-gray-900">{task.internName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Submitted:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(task.submittedDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Due Date:</span>
                <span
                  className={`ml-2 ${task.isOverdue ? "text-red-600 font-medium" : "text-gray-900"}`}
                >
                  {new Date(task.dueDate).toLocaleDateString()}
                  {task.isOverdue && ` (${task.daysOverdue} days overdue)`}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time Spent:</span>
                <span className="ml-2 text-gray-900">{task.timeSpent}h</span>
              </div>
            </div>
          </div>

          {/* Task Description */}
          {task.description && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Task Description
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Submission Notes */}
          {task.submissionNotes && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Intern's Submission Notes
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.submissionNotes}
                </p>
              </div>
            </div>
          )}

          {/* Challenges & Learnings */}
          {(task.challenges || task.learnings) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {task.challenges && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                    Challenges Faced
                  </h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {task.challenges}
                    </p>
                  </div>
                </div>
              )}

              {task.learnings && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                    Key Learnings
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {task.learnings}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attached Files */}
          {task.submissionFiles && task.submissionFiles.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Attached Files
              </h4>
              <div className="space-y-2">
                {task.submissionFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <IoDocumentTextOutline className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">{file.name}</span>
                      {file.size && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Form */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Your Review
            </h4>

            <div className="space-y-4">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Status *
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Approved">
                    Approved - Task completed successfully
                  </option>
                  <option value="Needs Revision">
                    Needs Revision - Requires changes
                  </option>
                </select>
              </div>

              {/* Grade Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade (Optional)
                </label>
                <select
                  value={reviewData.grade}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      grade: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {gradeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Feedback *
                </label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      feedback: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Provide detailed feedback on the intern's work, what they did well, and areas for improvement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Suggestions for Improvement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggestions for Improvement (Optional)
                </label>
                <textarea
                  value={reviewData.suggestions}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      suggestions: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Specific suggestions on how the intern can improve their work..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Steps (Optional)
                </label>
                <textarea
                  value={reviewData.nextSteps}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      nextSteps: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="What should the intern focus on next or what tasks should they work on..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Reviewing task: {task.title}
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
              disabled={
                !reviewData.status || !reviewData.feedback.trim() || submitting
              }
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" color="white" className="mr-2" />
                  Submitting Review...
                </>
              ) : (
                <>
                  <IoSendOutline className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewTasks;
