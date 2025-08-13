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
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCloseCircleOutline,
  IoRepeatOutline,
} from "react-icons/io5";

const INTERVIEW_STATUS_CONFIG = {
  Scheduled: { color: "bg-blue-100 text-blue-800", icon: IoCalendarOutline },
  "In Progress": {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
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

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
];

const InterviewScheduler = () => {
  const [interviews, setInterviews] = useState([]);
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    internId: "",
    mentorId: "",
    internshipId: "",
    applicationId: "",
    date: "",
    startTime: "",
    duration: 30,
    location: "",
    meetingLink: "",
    agenda: "",
    status: "Scheduled",
  });

  const [editingInterview, setEditingInterview] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    data: null,
  });

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setMessage({ type: "", text: "" });

      const [users, apps, ints, meets] = await Promise.all([
        getData("users") || [],
        getData("applications") || [],
        getData("internships") || [],
        getData("meetings") || [],
      ]);

      const internsList = users.filter(
        (u) => u.role?.toLowerCase() === "intern"
      );
      const mentorsList = users.filter(
        (u) => u.role?.toLowerCase() === "mentor"
      );

      const enriched = (meets || []).map((m) => {
        const intern = internsList.find((u) => u.id === m.internId) || {};
        const mentor = mentorsList.find((u) => u.id === m.mentorId) || {};
        const internship = ints.find((i) => i.id === m.internshipId) || {};
        return { ...m, intern, mentor, internship };
      });

      setInterviews(enriched);
      setInterns(internsList);
      setMentors(mentorsList);
      setApplications(apps);
      setInternships(ints);
    } catch (err) {
      console.error("Failed to load interview data:", err);
      setMessage({ type: "error", text: "Failed to load interview data." });
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const checkConflicts = (date, startTime, duration, excludeId = null) => {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(start.getTime() + duration * 60000);
    return interviews.some((i) => {
      if (excludeId && i.id === excludeId) return false;
      const existingStart = new Date(`${i.date}T${i.startTime}`);
      const existingEnd = new Date(
        existingStart.getTime() + (parseInt(i.duration) || 0) * 60000
      );
      return (
        start < existingEnd &&
        end > existingStart &&
        i.mentorId === formData.mentorId
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.internId ||
      !formData.mentorId ||
      !formData.date ||
      !formData.startTime
    ) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }
    if (
      checkConflicts(
        formData.date,
        formData.startTime,
        formData.duration,
        editingInterview?.id
      )
    ) {
      setMessage({
        type: "error",
        text: "Time conflict with another interview.",
      });
      return;
    }
    try {
      const meets = getData("meetings") || [];
      if (editingInterview) {
        const updated = meets.map((m) =>
          m.id === editingInterview.id ? { ...formData, id: m.id } : m
        );
        await saveData("meetings", updated);
        setMessage({
          type: "success",
          text: "Interview updated successfully.",
        });
      } else {
        await saveData("meetings", [
          ...meets,
          { ...formData, id: `meet_${Date.now()}` },
        ]);
        setMessage({
          type: "success",
          text: "Interview scheduled successfully.",
        });
      }
      setFormData({
        internId: "",
        mentorId: "",
        internshipId: "",
        applicationId: "",
        date: "",
        startTime: "",
        duration: 30,
        location: "",
        meetingLink: "",
        agenda: "",
        status: "Scheduled",
      });
      setEditingInterview(null);
      loadData(true);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save interview." });
    }
  };

  const handleDelete = (interview) => {
    setConfirmModal({ isOpen: true, data: interview });
  };

  const confirmDelete = async () => {
    try {
      const meets = getData("meetings") || [];
      await saveData(
        "meetings",
        meets.filter((m) => m.id !== confirmModal.data.id)
      );
      setMessage({ type: "success", text: "Interview deleted." });
      loadData(true);
    } catch {
      setMessage({ type: "error", text: "Failed to delete interview." });
    }
    setConfirmModal({ isOpen: false, data: null });
  };

  if (loading) return <Spinner fullScreen text="Loading interviews..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Interview Scheduler</h1>
      {message.text && (
        <div
          className={`p-2 mb-3 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* List of interviews */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-50 text-left text-sm font-medium">
              <th className="p-2">Intern</th>
              <th className="p-2">Mentor</th>
              <th className="p-2">Internship</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((i) => {
              const StatusIcon =
                INTERVIEW_STATUS_CONFIG[i.status]?.icon || IoCalendarOutline;
              return (
                <tr key={i.id} className="border-t">
                  <td className="p-2">{i.intern?.name}</td>
                  <td className="p-2">{i.mentor?.name}</td>
                  <td className="p-2">{i.internship?.title}</td>
                  <td className="p-2">{i.date}</td>
                  <td className="p-2">{i.startTime}</td>
                  <td className="p-2 flex items-center gap-1">
                    <StatusIcon className="text-lg" /> {i.status}
                  </td>
                  <td className="p-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingInterview(i)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {interviews.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No interviews scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, data: null })}
        onConfirm={confirmDelete}
        title="Delete Interview"
        message={`Are you sure you want to delete the interview for "${confirmModal.data?.intern?.name}"?`}
        danger
      />
    </div>
  );
};

export default InterviewScheduler;
