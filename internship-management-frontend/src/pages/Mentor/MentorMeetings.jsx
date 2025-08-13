import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import {
  getMeetingsByMentorId,
  getInternsByMentorId,
} from "../../services/mockDataService";
import Spinner from "../../components/ui/Spinner";
import {
  IoVideocamOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoAddOutline,
  IoTrashOutline,
  IoSearchOutline,
  IoRefreshOutline,
} from "react-icons/io5";

const MEETING_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

const MEETING_TYPES = {
  ONE_ON_ONE: "One-on-one",
  GROUP: "Group",
  WORKSHOP: "Workshop",
  REVIEW: "Review",
  CASUAL: "Casual",
};

const VIEW_MODES = { LIST: "list", GRID: "grid" };

const FILTER_OPTIONS = {
  ALL: "all",
  TODAY: "today",
  UPCOMING: "upcoming",
  PAST: "past",
};

const MentorMeetings = () => {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS.ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeetings, setSelectedMeetings] = useState(new Set());

  const [message, setMessage] = useState({ type: "", text: "" });

  const loadMentorData = useCallback(
    async (refresh = false) => {
      try {
        setLoading(true);
        const [meetingsData, internsData] = await Promise.all([
          getMeetingsByMentorId(user.id),
          getInternsByMentorId(user.id),
        ]);
        setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
        setInterns(Array.isArray(internsData) ? internsData : []);
      } catch (err) {
        console.error("Failed to load meetings:", err);
        setMessage({ type: "error", text: "Failed to load meetings" });
      } finally {
        setLoading(false);
      }
    },
    [user.id]
  );

  useEffect(() => {
    if (user?.id) loadMentorData();
  }, [user, loadMentorData]);

  // Clear messages after 5s
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => {
        const matchesSearch =
          !searchQuery ||
          m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.internName?.toLowerCase().includes(searchQuery.toLowerCase());
        const meetingDate = new Date(`${m.date}T${m.time}`);
        let matchesFilter = true;
        switch (selectedFilter) {
          case FILTER_OPTIONS.TODAY:
            matchesFilter = meetingDate.toDateString() === now.toDateString();
            break;
          case FILTER_OPTIONS.UPCOMING:
            matchesFilter = meetingDate >= now;
            break;
          case FILTER_OPTIONS.PAST:
            matchesFilter = meetingDate < now;
            break;
          default:
            break;
        }
        return matchesSearch && matchesFilter;
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
      );
  }, [meetings, searchQuery, selectedFilter]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (timeStr) =>
    new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  if (loading) return <Spinner fullScreen text="Loading meetings..." />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <IoVideocamOutline /> Mentor Meetings
      </h1>
      {message.text && (
        <div
          className={`p-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search & View Toggle */}
      <div className="flex gap-2">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="flex-grow p-1 outline-none"
          />
        </div>
        <button
          onClick={() =>
            setViewMode((v) =>
              v === VIEW_MODES.LIST ? VIEW_MODES.GRID : VIEW_MODES.LIST
            )
          }
          className="border rounded px-3 py-1"
        >
          {viewMode === VIEW_MODES.LIST ? "Grid" : "List"}
        </button>
        <button
          onClick={() => loadMentorData(true)}
          className="border rounded px-3 py-1 flex items-center gap-1"
        >
          <IoRefreshOutline /> Refresh
        </button>
      </div>

      {/* Meetings */}
      {filteredMeetings.length === 0 ? (
        <p className="text-gray-500 mt-4">
          No meetings found. Try adjusting your search or filters.
        </p>
      ) : viewMode === VIEW_MODES.LIST ? (
        <div className="overflow-x-auto border rounded bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2">Intern</th>
                <th className="p-2">Date</th>
                <th className="p-2">Time</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.title}</td>
                  <td className="p-2">{m.internName}</td>
                  <td className="p-2">{formatDate(m.date)}</td>
                  <td className="p-2">{formatTime(m.time)}</td>
                  <td className="p-2 capitalize">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredMeetings.map((m) => (
            <div key={m.id} className="border rounded p-3 bg-white">
              <h2 className="font-semibold">{m.title}</h2>
              <p className="text-sm text-gray-500">{m.internName}</p>
              <p className="text-sm">
                {formatDate(m.date)}, {formatTime(m.time)}
              </p>
              <p className="capitalize mt-1">Status: {m.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorMeetings;
