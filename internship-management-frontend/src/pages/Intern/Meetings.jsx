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
        .then((data) => setMeetings(data))
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-indigo-900">My Meetings</h1>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading meetings...</p>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <IoVideocamOutline className="mx-auto text-5xl mb-3 opacity-30" />
          No meetings found for{" "}
          <span className="font-medium">{statusFilter}</span> status.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-md transition"
            >
              {/* Meeting Details */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {meeting.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1 space-x-4">
                  <span className="flex items-center">
                    <IoCalendarOutline className="mr-1 text-gray-400" />
                    {formatDate(meeting.date)}
                  </span>
                  <span className="flex items-center">
                    <IoTimeOutline className="mr-1 text-gray-400" />
                    {meeting.time}
                  </span>
                </div>
                <span
                  className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                    STATUS_COLORS[meeting.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {meeting.status}
                </span>
              </div>

              {/* Join Button */}
              <div className="mt-4 md:mt-0 flex items-center gap-2">
                <a
                  href={meeting.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <IoVideocamOutline className="mr-2" />
                  Join Meeting
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternMeetings;
