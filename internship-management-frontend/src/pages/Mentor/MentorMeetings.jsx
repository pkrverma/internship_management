// src/pages/mentor/MentorMeetings.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import {
  getMeetingsByMentorId,
  getInternsByMentorId,
} from "../../services/mockDataService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoVideocamOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoPeopleOutline,
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoGridOutline,
  IoListOutline,
  IoCalendarNumberOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoMailOutline,
  IoNotificationsOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoCloseOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoPlayOutline,
  IoStopOutline,
  IoPauseOutline,
  IoDocumentTextOutline,
  IoStarOutline,
  IoBookmarkOutline,
  IoArchiveOutline,
  IoRepeatOutline,
  IoAlarmOutline,
  IoLocationOutline,
  IoLinkOutline,
  IoShareOutline,
  IoCopyOutline,
  IoOptionsOutline,
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoClockOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoRadioButtonOffOutline,
  IoEllipsisVerticalOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoSyncOutline,
  IoCloudUploadOutline,
  IoSparklesOutline,
  IoRocketOutline,
  IoTrophyOutline,
  IoHeartOutline,
  IoBulbOutline,
  IoBusinessOutline,
  IoSchoolOutline,
  IoLibraryOutline,
} from "react-icons/io5";

const MEETING_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

const MEETING_TYPES = {
  ONE_ON_ONE: "one_on_one",
  GROUP: "group",
  WORKSHOP: "workshop",
  REVIEW: "review",
  CASUAL: "casual",
};

const VIEW_MODES = {
  LIST: "list",
  GRID: "grid",
  CALENDAR: "calendar",
};

const FILTER_OPTIONS = {
  ALL: "all",
  TODAY: "today",
  THIS_WEEK: "this_week",
  THIS_MONTH: "this_month",
  UPCOMING: "upcoming",
  PAST: "past",
};

const DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const MEETING_TEMPLATES = [
  {
    id: "weekly_checkin",
    name: "Weekly Check-in",
    description: "Regular progress review and guidance",
    duration: 30,
    type: MEETING_TYPES.ONE_ON_ONE,
    agenda: [
      "Review previous week's progress",
      "Discuss current challenges",
      "Set goals for upcoming week",
      "Q&A session",
    ],
  },
  {
    id: "project_review",
    name: "Project Review",
    description: "In-depth project evaluation and feedback",
    duration: 60,
    type: MEETING_TYPES.REVIEW,
    agenda: [
      "Project demonstration",
      "Code/work quality review",
      "Feedback and suggestions",
      "Next steps planning",
    ],
  },
  {
    id: "career_mentoring",
    name: "Career Mentoring",
    description: "Career guidance and professional development",
    duration: 45,
    type: MEETING_TYPES.ONE_ON_ONE,
    agenda: [
      "Career goals discussion",
      "Skill development planning",
      "Industry insights sharing",
      "Networking advice",
    ],
  },
];

const MentorMeetings = () => {
  const { user } = useAuth();

  // Core data state
  const [meetings, setMeetings] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeetings, setSelectedMeetings] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Form state
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    internId: "",
    date: "",
    time: "",
    duration: 30,
    type: MEETING_TYPES.ONE_ON_ONE,
    location: "Online",
    meetingLink: "",
    agenda: [],
    isRecurring: false,
    recurringPattern: "weekly",
    recurringEnd: "",
    reminders: [15], // minutes before
    notes: "",
    tags: [],
  });

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month"); // month, week, day

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    completedMeetings: 0,
    totalDuration: 0,
    averageRating: 0,
    attendanceRate: 0,
    noShowRate: 0,
    meetingsPerIntern: {},
    monthlyTrend: [],
  });

  // Messages and modals
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Load initial data
  useEffect(() => {
    loadMentorData();
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate analytics when meetings change
  useEffect(() => {
    calculateAnalytics();
  }, [meetings]);

  const loadMentorData = async () => {
    setLoading(true);
    try {
      // Load meetings and interns in parallel
      const [meetingsData, internsData] = await Promise.all([
        getMeetingsByMentorId(user.id),
        getInternsByMentorId(user.id),
      ]);

      // Enrich meetings with additional data
      const enrichedMeetings = meetingsData.map((meeting) => ({
        ...meeting,
        status: meeting.status || MEETING_STATUS.SCHEDULED,
        type: meeting.type || MEETING_TYPES.ONE_ON_ONE,
        duration: meeting.duration || 30,
        attendeeRating: meeting.attendeeRating || null,
        mentorNotes: meeting.mentorNotes || "",
        agenda: meeting.agenda || [],
        createdAt: meeting.createdAt || new Date().toISOString(),
        updatedAt: meeting.updatedAt || new Date().toISOString(),
      }));

      setMeetings(enrichedMeetings);
      setInterns(internsData);
    } catch (error) {
      console.error("Failed to load mentor data:", error);
      setMessage({ type: "error", text: "Failed to load meetings" });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const now = new Date();
    const totalMeetings = meetings.length;

    const upcomingMeetings = meetings.filter(
      (meeting) =>
        new Date(`${meeting.date}T${meeting.time}`) > now &&
        meeting.status === MEETING_STATUS.SCHEDULED
    ).length;

    const completedMeetings = meetings.filter(
      (meeting) => meeting.status === MEETING_STATUS.COMPLETED
    ).length;

    const totalDuration = meetings
      .filter((meeting) => meeting.status === MEETING_STATUS.COMPLETED)
      .reduce((sum, meeting) => sum + (meeting.duration || 30), 0);

    const ratingsWithValues = meetings
      .filter((meeting) => meeting.attendeeRating)
      .map((meeting) => meeting.attendeeRating);

    const averageRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) /
          ratingsWithValues.length
        : 0;

    const attendanceRate =
      totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

    const noShowCount = meetings.filter(
      (meeting) => meeting.status === MEETING_STATUS.NO_SHOW
    ).length;

    const noShowRate =
      totalMeetings > 0 ? (noShowCount / totalMeetings) * 100 : 0;

    // Meetings per intern
    const meetingsPerIntern = {};
    meetings.forEach((meeting) => {
      if (meeting.internId) {
        meetingsPerIntern[meeting.internId] =
          (meetingsPerIntern[meeting.internId] || 0) + 1;
      }
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const monthMeetings = meetings.filter((meeting) => {
        const meetingDate = new Date(meeting.date);
        const meetingMonthKey = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, "0")}`;
        return meetingMonthKey === monthKey;
      }).length;

      monthlyTrend.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        meetings: monthMeetings,
      });
    }

    setAnalytics({
      totalMeetings,
      upcomingMeetings,
      completedMeetings,
      totalDuration,
      averageRating,
      attendanceRate,
      noShowRate,
      meetingsPerIntern,
      monthlyTrend,
    });
  };

  const handleCreateMeeting = async () => {
    try {
      const newMeeting = {
        id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mentorId: user.id,
        mentorName: user.name,
        internId: meetingForm.internId,
        internName: interns.find((i) => i.id === meetingForm.internId)?.name,
        title: meetingForm.title,
        description: meetingForm.description,
        date: meetingForm.date,
        time: meetingForm.time,
        duration: meetingForm.duration,
        type: meetingForm.type,
        status: MEETING_STATUS.SCHEDULED,
        location: meetingForm.location,
        link: meetingForm.meetingLink || generateMeetingLink(),
        agenda: meetingForm.agenda,
        notes: meetingForm.notes,
        tags: meetingForm.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminders: meetingForm.reminders,
        isRecurring: meetingForm.isRecurring,
        recurringPattern: meetingForm.recurringPattern,
        recurringEnd: meetingForm.recurringEnd,
      };

      // If recurring, create multiple meetings
      const meetingsToCreate = meetingForm.isRecurring
        ? generateRecurringMeetings(newMeeting)
        : [newMeeting];

      // Save to storage
      const existingMeetings = getData("meetings") || [];
      const updatedMeetings = [...existingMeetings, ...meetingsToCreate];
      await saveData("meetings", updatedMeetings);

      // Update local state
      setMeetings((prev) => [...prev, ...meetingsToCreate]);

      // Reset form and close modal
      resetMeetingForm();
      setShowCreateModal(false);

      setMessage({
        type: "success",
        text: `Successfully created ${meetingsToCreate.length} meeting(s)`,
      });
    } catch (error) {
      console.error("Failed to create meeting:", error);
      setMessage({ type: "error", text: "Failed to create meeting" });
    }
  };

  const handleUpdateMeeting = async () => {
    try {
      const updatedMeeting = {
        ...selectedMeeting,
        ...meetingForm,
        internName: interns.find((i) => i.id === meetingForm.internId)?.name,
        updatedAt: new Date().toISOString(),
      };

      // Save to storage
      const existingMeetings = getData("meetings") || [];
      const updatedMeetings = existingMeetings.map((meeting) =>
        meeting.id === selectedMeeting.id ? updatedMeeting : meeting
      );
      await saveData("meetings", updatedMeetings);

      // Update local state
      setMeetings((prev) =>
        prev.map((meeting) =>
          meeting.id === selectedMeeting.id ? updatedMeeting : meeting
        )
      );

      // Reset and close
      resetMeetingForm();
      setShowEditModal(false);
      setSelectedMeeting(null);

      setMessage({ type: "success", text: "Meeting updated successfully" });
    } catch (error) {
      console.error("Failed to update meeting:", error);
      setMessage({ type: "error", text: "Failed to update meeting" });
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      // Remove from storage
      const existingMeetings = getData("meetings") || [];
      const updatedMeetings = existingMeetings.filter(
        (meeting) => meeting.id !== meetingId
      );
      await saveData("meetings", updatedMeetings);

      // Update local state
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));

      setMessage({ type: "success", text: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      setMessage({ type: "error", text: "Failed to delete meeting" });
    }
  };

  const handleBulkAction = async (action) => {
    try {
      const selectedIds = Array.from(selectedMeetings);
      const existingMeetings = getData("meetings") || [];

      let updatedMeetings;
      let message_text;

      switch (action) {
        case "delete":
          updatedMeetings = existingMeetings.filter(
            (meeting) => !selectedIds.includes(meeting.id)
          );
          message_text = `Deleted ${selectedIds.length} meeting(s)`;
          break;
        case "cancel":
          updatedMeetings = existingMeetings.map((meeting) =>
            selectedIds.includes(meeting.id)
              ? {
                  ...meeting,
                  status: MEETING_STATUS.CANCELLED,
                  updatedAt: new Date().toISOString(),
                }
              : meeting
          );
          message_text = `Cancelled ${selectedIds.length} meeting(s)`;
          break;
        default:
          return;
      }

      await saveData("meetings", updatedMeetings);
      setMeetings(
        updatedMeetings.filter((meeting) => meeting.mentorId === user.id)
      );
      setSelectedMeetings(new Set());

      setMessage({ type: "success", text: message_text });
    } catch (error) {
      console.error(`Failed to ${action} meetings:`, error);
      setMessage({ type: "error", text: `Failed to ${action} meetings` });
    }
  };

  const generateMeetingLink = () => {
    // Generate a mock meeting link (in real app, integrate with Zoom/Teams/Meet)
    const meetingId = Math.random().toString(36).substr(2, 9);
    return `https://meet.company.com/room/${meetingId}`;
  };

  const generateRecurringMeetings = (baseMeeting) => {
    const meetings = [];
    const startDate = new Date(`${baseMeeting.date}T${baseMeeting.time}`);
    const endDate = new Date(baseMeeting.recurringEnd);

    let currentDate = new Date(startDate);
    let meetingCounter = 0;

    while (currentDate <= endDate && meetingCounter < 52) {
      // Max 52 meetings
      const meeting = {
        ...baseMeeting,
        id: `${baseMeeting.id}_${meetingCounter}`,
        date: currentDate.toISOString().split("T")[0],
        title:
          meetingCounter === 0
            ? baseMeeting.title
            : `${baseMeeting.title} (${meetingCounter + 1})`,
      };

      meetings.push(meeting);

      // Calculate next occurrence
      switch (baseMeeting.recurringPattern) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "biweekly":
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          break;
      }

      meetingCounter++;
    }

    return meetings;
  };

  const resetMeetingForm = () => {
    setMeetingForm({
      title: "",
      description: "",
      internId: "",
      date: "",
      time: "",
      duration: 30,
      type: MEETING_TYPES.ONE_ON_ONE,
      location: "Online",
      meetingLink: "",
      agenda: [],
      isRecurring: false,
      recurringPattern: "weekly",
      recurringEnd: "",
      reminders: [15],
      notes: "",
      tags: [],
    });
  };

  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter((meeting) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.internName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filter
      const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );

      let matchesDate = true;
      switch (selectedFilter) {
        case FILTER_OPTIONS.TODAY:
          matchesDate =
            meetingDate >= today &&
            meetingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          break;
        case FILTER_OPTIONS.THIS_WEEK:
          matchesDate = meetingDate >= today && meetingDate < weekFromNow;
          break;
        case FILTER_OPTIONS.THIS_MONTH:
          matchesDate = meetingDate >= today && meetingDate < monthFromNow;
          break;
        case FILTER_OPTIONS.UPCOMING:
          matchesDate =
            meetingDate >= now && meeting.status === MEETING_STATUS.SCHEDULED;
          break;
        case FILTER_OPTIONS.PAST:
          matchesDate =
            meetingDate < now || meeting.status === MEETING_STATUS.COMPLETED;
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesDate;
    });

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

    return filtered;
  }, [meetings, searchQuery, selectedFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case MEETING_STATUS.SCHEDULED:
        return "text-blue-600 bg-blue-100";
      case MEETING_STATUS.IN_PROGRESS:
        return "text-green-600 bg-green-100";
      case MEETING_STATUS.COMPLETED:
        return "text-gray-600 bg-gray-100";
      case MEETING_STATUS.CANCELLED:
        return "text-red-600 bg-red-100";
      case MEETING_STATUS.NO_SHOW:
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const isUpcoming = (meeting) => {
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    return (
      meetingDate > new Date() && meeting.status === MEETING_STATUS.SCHEDULED
    );
  };

  const canJoinMeeting = (meeting) => {
    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
    const now = new Date();
    const timeDiff = meetingDate - now;

    // Can join 15 minutes before and during the meeting
    return (
      timeDiff <= 15 * 60 * 1000 && timeDiff >= -meeting.duration * 60 * 1000
    );
  };

  const renderMeetingCard = (meeting) => {
    const intern = interns.find((i) => i.id === meeting.internId);
    const isSelected = selectedMeetings.has(meeting.id);
    const upcoming = isUpcoming(meeting);
    const canJoin = canJoinMeeting(meeting);

    return (
      <div
        key={meeting.id}
        className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-all duration-200 ${
          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                const newSelected = new Set(selectedMeetings);
                if (e.target.checked) {
                  newSelected.add(meeting.id);
                } else {
                  newSelected.delete(meeting.id);
                }
                setSelectedMeetings(newSelected);
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {meeting.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <IoCalendarOutline className="w-4 h-4 mr-1" />
                  {formatDate(meeting.date)}
                </span>
                <span className="flex items-center">
                  <IoTimeOutline className="w-4 h-4 mr-1" />
                  {formatTime(meeting.time)}
                </span>
                <span className="flex items-center">
                  <IoClockOutline className="w-4 h-4 mr-1" />
                  {formatDuration(meeting.duration)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}
            >
              {meeting.status.replace("_", " ").toUpperCase()}
            </span>

            <button
              onClick={() => {
                setSelectedMeeting(meeting);
                setShowDetailsModal(true);
              }}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="View Details"
            >
              <IoInformationCircleOutline className="w-5 h-5" />
            </button>
          </div>
        </div>

        {meeting.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {meeting.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {intern && (
              <>
                <ProfileAvatar user={intern} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {intern.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {meeting.type.replace("_", " ")}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canJoin && (
              <a
                href={meeting.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                <IoVideocamOutline className="w-4 h-4 mr-2" />
                Join Now
              </a>
            )}

            {upcoming && !canJoin && (
              <a
                href={meeting.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <IoVideocamOutline className="w-4 h-4 mr-2" />
                Join Meeting
              </a>
            )}

            <button
              onClick={() => {
                setSelectedMeeting(meeting);
                setMeetingForm({
                  title: meeting.title,
                  description: meeting.description || "",
                  internId: meeting.internId,
                  date: meeting.date,
                  time: meeting.time,
                  duration: meeting.duration,
                  type: meeting.type,
                  location: meeting.location || "Online",
                  meetingLink: meeting.link || "",
                  agenda: meeting.agenda || [],
                  isRecurring: false,
                  recurringPattern: "weekly",
                  recurringEnd: "",
                  reminders: meeting.reminders || [15],
                  notes: meeting.notes || "",
                  tags: meeting.tags || [],
                });
                setShowEditModal(true);
              }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Meeting"
            >
              <IoCreateOutline className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  type: "delete",
                  title: "Delete Meeting",
                  message: `Are you sure you want to delete "${meeting.title}"?`,
                  data: meeting.id,
                })
              }
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete Meeting"
            >
              <IoTrashOutline className="w-4 h-4" />
            </button>
          </div>
        </div>

        {meeting.agenda && meeting.agenda.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Agenda Items: {meeting.agenda.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {meeting.agenda.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                >
                  {item.length > 20 ? `${item.substring(0, 20)}...` : item}
                </span>
              ))}
              {meeting.agenda.length > 3 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  +{meeting.agenda.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMeetingRow = (meeting) => {
    const intern = interns.find((i) => i.id === meeting.internId);
    const isSelected = selectedMeetings.has(meeting.id);
    const upcoming = isUpcoming(meeting);
    const canJoin = canJoinMeeting(meeting);

    return (
      <tr
        key={meeting.id}
        className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSelected = new Set(selectedMeetings);
              if (e.target.checked) {
                newSelected.add(meeting.id);
              } else {
                newSelected.delete(meeting.id);
              }
              setSelectedMeetings(newSelected);
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {meeting.title}
            </div>
            <div className="text-sm text-gray-500">
              {meeting.type.replace("_", " ")}
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {intern && (
              <ProfileAvatar user={intern} size="xs" className="mr-3" />
            )}
            <span className="text-sm text-gray-900">
              {intern ? intern.name : "Unknown"}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDate(meeting.date)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatTime(meeting.time)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDuration(meeting.duration)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}
          >
            {meeting.status.replace("_", " ").toUpperCase()}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            {canJoin ? (
              <a
                href={meeting.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-900"
                title="Join Now"
              >
                <IoPlayOutline className="w-4 h-4" />
              </a>
            ) : upcoming ? (
              <a
                href={meeting.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-900"
                title="Join Meeting"
              >
                <IoVideocamOutline className="w-4 h-4" />
              </a>
            ) : null}

            <button
              onClick={() => {
                setSelectedMeeting(meeting);
                setShowDetailsModal(true);
              }}
              className="text-gray-600 hover:text-gray-900"
              title="View Details"
            >
              <IoInformationCircleOutline className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSelectedMeeting(meeting);
                setMeetingForm({
                  title: meeting.title,
                  description: meeting.description || "",
                  internId: meeting.internId,
                  date: meeting.date,
                  time: meeting.time,
                  duration: meeting.duration,
                  type: meeting.type,
                  location: meeting.location || "Online",
                  meetingLink: meeting.link || "",
                  agenda: meeting.agenda || [],
                  isRecurring: false,
                  recurringPattern: "weekly",
                  recurringEnd: "",
                  reminders: meeting.reminders || [15],
                  notes: meeting.notes || "",
                  tags: meeting.tags || [],
                });
                setShowEditModal(true);
              }}
              className="text-blue-600 hover:text-blue-900"
              title="Edit"
            >
              <IoCreateOutline className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  type: "delete",
                  title: "Delete Meeting",
                  message: `Are you sure you want to delete "${meeting.title}"?`,
                  data: meeting.id,
                })
              }
              className="text-red-600 hover:text-red-900"
              title="Delete"
            >
              <IoTrashOutline className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading meetings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <IoCalendarOutline className="mr-3" />
            Meeting Management
          </h1>
          <p className="text-gray-600 mt-2">
            Schedule and manage meetings with your assigned interns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Schedule Meeting
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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCalendarOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Meetings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.totalMeetings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoRocketOutline className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.upcomingMeetings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoTimeOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(analytics.totalDuration / 60)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStarOutline className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.averageRating > 0
                  ? analytics.averageRating.toFixed(1)
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoSearchOutline className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meetings by title, intern name, or description..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={FILTER_OPTIONS.ALL}>All Meetings</option>
              <option value={FILTER_OPTIONS.TODAY}>Today</option>
              <option value={FILTER_OPTIONS.THIS_WEEK}>This Week</option>
              <option value={FILTER_OPTIONS.THIS_MONTH}>This Month</option>
              <option value={FILTER_OPTIONS.UPCOMING}>Upcoming</option>
              <option value={FILTER_OPTIONS.PAST}>Past</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            {selectedMeetings.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedMeetings.size} selected
                </span>
                <button
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      type: "bulkCancel",
                      title: "Cancel Meetings",
                      message: `Are you sure you want to cancel ${selectedMeetings.size} meeting(s)?`,
                      data: null,
                    })
                  }
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Cancel Selected
                </button>
                <button
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      type: "bulkDelete",
                      title: "Delete Meetings",
                      message: `Are you sure you want to delete ${selectedMeetings.size} meeting(s)?`,
                      data: null,
                    })
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={`p-2 ${viewMode === VIEW_MODES.LIST ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.GRID)}
                className={`p-2 ${viewMode === VIEW_MODES.GRID ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings Display */}
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <IoCalendarOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No meetings found
          </h3>
          <p className="text-gray-500 mb-6">
            {meetings.length === 0
              ? "Start by scheduling your first meeting with an intern"
              : "Try adjusting your search or filters to find what you're looking for"}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Schedule First Meeting
          </button>
        </div>
      ) : viewMode === VIEW_MODES.GRID ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMeetings.map(renderMeetingCard)}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      selectedMeetings.size === filteredMeetings.length &&
                      filteredMeetings.length > 0
                    }
                    onChange={() => {
                      if (selectedMeetings.size === filteredMeetings.length) {
                        setSelectedMeetings(new Set());
                      } else {
                        setSelectedMeetings(
                          new Set(filteredMeetings.map((m) => m.id))
                        );
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeetings.map(renderMeetingRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Schedule New Meeting
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetMeetingForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meeting Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Start Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MEETING_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setMeetingForm((prev) => ({
                          ...prev,
                          title: template.name,
                          description: template.description,
                          duration: template.duration,
                          type: template.type,
                          agenda: template.agenda,
                        }));
                      }}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.duration}min •{" "}
                        {template.type.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Weekly Check-in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Intern *
                  </label>
                  <select
                    value={meetingForm.internId}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        internId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Intern --</option>
                    {interns.map((intern) => (
                      <option key={intern.id} value={intern.id}>
                        {intern.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={meetingForm.duration}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={meetingForm.type}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(MEETING_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value.replace("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the meeting purpose and goals..."
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  value={meetingForm.meetingLink}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({
                      ...prev,
                      meetingLink: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to auto-generate a meeting link
                </p>
              </div>

              {/* Recurring Meeting */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={meetingForm.isRecurring}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        isRecurring: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isRecurring"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Recurring Meeting
                  </label>
                </div>

                {meetingForm.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={meetingForm.recurringPattern}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            recurringPattern: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={meetingForm.recurringEnd}
                        onChange={(e) =>
                          setMeetingForm((prev) => ({
                            ...prev,
                            recurringEnd: e.target.value,
                          }))
                        }
                        min={meetingForm.date}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetMeetingForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                disabled={
                  !meetingForm.title ||
                  !meetingForm.internId ||
                  !meetingForm.date ||
                  !meetingForm.time
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCalendarOutline className="w-4 h-4 mr-2 inline" />
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {showEditModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Meeting
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMeeting(null);
                  resetMeetingForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Same form structure as create modal but with update functionality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={meetingForm.title}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Intern *
                  </label>
                  <select
                    value={meetingForm.internId}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        internId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Intern --</option>
                    {interns.map((intern) => (
                      <option key={intern.id} value={intern.id}>
                        {intern.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={meetingForm.duration}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={meetingForm.type}
                    onChange={(e) =>
                      setMeetingForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(MEETING_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value.replace("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={meetingForm.meetingLink}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({
                      ...prev,
                      meetingLink: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMeeting(null);
                  resetMeetingForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMeeting}
                disabled={
                  !meetingForm.title ||
                  !meetingForm.internId ||
                  !meetingForm.date ||
                  !meetingForm.time
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCreateOutline className="w-4 h-4 mr-2 inline" />
                Update Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {showDetailsModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Meeting Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMeeting(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Meeting Title
                  </h4>
                  <p className="text-gray-900">{selectedMeeting.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Intern
                  </h4>
                  <div className="flex items-center">
                    {interns.find((i) => i.id === selectedMeeting.internId) && (
                      <>
                        <ProfileAvatar
                          user={interns.find(
                            (i) => i.id === selectedMeeting.internId
                          )}
                          size="sm"
                        />
                        <span className="ml-3 text-gray-900">
                          {
                            interns.find(
                              (i) => i.id === selectedMeeting.internId
                            ).name
                          }
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </h4>
                  <p className="text-gray-900">
                    {formatDate(selectedMeeting.date)} at{" "}
                    {formatTime(selectedMeeting.time)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </h4>
                  <p className="text-gray-900">
                    {formatDuration(selectedMeeting.duration)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Type
                  </h4>
                  <p className="text-gray-900">
                    {selectedMeeting.type.replace("_", " ").toUpperCase()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Status
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedMeeting.status)}`}
                  >
                    {selectedMeeting.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedMeeting.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedMeeting.description}
                  </p>
                </div>
              )}

              {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Agenda
                  </h4>
                  <ul className="space-y-1">
                    {selectedMeeting.agenda.map((item, index) => (
                      <li
                        key={index}
                        className="text-gray-900 flex items-start"
                      >
                        <span className="text-gray-400 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Meeting Link
                </h4>
                <a
                  href={selectedMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline break-all"
                >
                  {selectedMeeting.link}
                </a>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              {canJoinMeeting(selectedMeeting) && (
                <a
                  href={selectedMeeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <IoVideocamOutline className="w-4 h-4 mr-2" />
                  Join Meeting
                </a>
              )}

              <button
                onClick={() => {
                  setSelectedMeeting(selectedMeeting);
                  setMeetingForm({
                    title: selectedMeeting.title,
                    description: selectedMeeting.description || "",
                    internId: selectedMeeting.internId,
                    date: selectedMeeting.date,
                    time: selectedMeeting.time,
                    duration: selectedMeeting.duration,
                    type: selectedMeeting.type,
                    location: selectedMeeting.location || "Online",
                    meetingLink: selectedMeeting.link || "",
                    agenda: selectedMeeting.agenda || [],
                    isRecurring: false,
                    recurringPattern: "weekly",
                    recurringEnd: "",
                    reminders: selectedMeeting.reminders || [15],
                    notes: selectedMeeting.notes || "",
                    tags: selectedMeeting.tags || [],
                  });
                  setShowDetailsModal(false);
                  setShowEditModal(true);
                }}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                <IoCreateOutline className="w-4 h-4 mr-2 inline" />
                Edit Meeting
              </button>

              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
        onConfirm={() => {
          if (confirmModal.type === "delete") {
            handleDeleteMeeting(confirmModal.data);
          } else if (confirmModal.type === "bulkDelete") {
            handleBulkAction("delete");
          } else if (confirmModal.type === "bulkCancel") {
            handleBulkAction("cancel");
          }
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
            data: null,
          });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={
          confirmModal.type?.includes("Delete") ? "Delete" : "Cancel"
        }
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
};

export default MentorMeetings;
