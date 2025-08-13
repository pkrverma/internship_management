import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getMeetingsByInternId } from "../../services/mockDataService";
import {
  IoVideocamOutline,
  IoCalendarOutline,
  IoTimeOutline,
} from "react-icons/io5";

const STATUS_OPTIONS = ["all", "Scheduled", "Completed", "Cancelled"];
const STATUS_COLORS = {
  Scheduled: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const InternMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getMeetingsByInternId(user.id)
        .then((data) => setMeetings(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Failed to load meetings", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(
      (m) => statusFilter === "all" || m.status === statusFilter
    );
  }, [meetings, statusFilter]);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <IoVideocamOutline /> My Meetings
      </h1>

      <div className="flex gap-2 items-center">
        <label>Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading meetings...</p>
      ) : filteredMeetings.length === 0 ? (
        <p className="text-gray-500">No meetings found for this filter.</p>
      ) : (
        <div className="overflow-x-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.map((meeting) => (
                <tr key={meeting.id} className="border-t">
                  <td className="p-2">{meeting.title}</td>
                  <td className="p-2">{formatDate(meeting.scheduledAt)}</td>
                  <td className="p-2">{formatTime(meeting.scheduledAt)}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        STATUS_COLORS[meeting.status] || "bg-gray-100"
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InternMeetings;
