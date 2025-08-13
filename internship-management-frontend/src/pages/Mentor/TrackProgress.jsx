import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getInternsByMentorId } from "../../services/mockDataService";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import { IoStatsChartOutline, IoSearchOutline } from "react-icons/io5";

const VIEW_MODES = {
  OVERVIEW: "overview",
  DETAILED: "detailed",
  ANALYTICS: "analytics",
};

const TrackProgress = () => {
  const { user } = useAuth();

  const [interns, setInterns] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.OVERVIEW);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const internsList = await getInternsByMentorId(user.id);
        const enriched = {};
        for (const intern of internsList) {
          enriched[intern.id] = getData(`progress_${intern.id}`) || {
            overallProgress: Math.floor(Math.random() * 40) + 50,
            recentTasks: [],
            skillsProgress: {},
          };
        }
        setInterns(internsList);
        setProgressData(enriched);
        if (internsList.length > 0) {
          setSelectedIntern(internsList[0].id);
        }
      } catch (err) {
        console.error("Failed to load progress data:", err);
        setMessage({ type: "error", text: "Failed to load progress data" });
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) loadData();
  }, [user]);

  // Auto clear messages
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredInterns = useMemo(() => {
    if (!searchQuery) return interns;
    const q = searchQuery.toLowerCase();
    return interns.filter(
      (i) =>
        i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q)
    );
  }, [interns, searchQuery]);

  if (loading) return <Spinner fullScreen text="Loading progress..." />;

  const currentIntern = interns.find((i) => i.id === selectedIntern);
  const currentData = progressData[selectedIntern] || {};

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-bold text-xl flex items-center gap-2">
        <IoStatsChartOutline /> Track Progress
      </h1>

      {message.text && (
        <div
          className={`p-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search & Intern Select */}
      <div className="flex gap-2 mb-3">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            placeholder="Search interns..."
            className="flex-grow p-1 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedIntern || ""}
          onChange={(e) => setSelectedIntern(e.target.value)}
          className="border rounded p-1"
        >
          {filteredInterns.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="border rounded p-1"
        >
          <option value={VIEW_MODES.OVERVIEW}>Overview</option>
          <option value={VIEW_MODES.DETAILED}>Detailed</option>
          <option value={VIEW_MODES.ANALYTICS}>Analytics</option>
        </select>
      </div>

      {/* View panels */}
      {!currentIntern ? (
        <div className="p-4 border rounded bg-white text-gray-500">
          Select an intern to view progress details.
        </div>
      ) : viewMode === VIEW_MODES.OVERVIEW ? (
        <div className="p-4 border rounded bg-white">
          <h2 className="font-semibold mb-2">{currentIntern.name}</h2>
          <p>Overall Progress: {currentData.overallProgress || 0}%</p>
          <p>
            Recent Tasks:{" "}
            {Array.isArray(currentData.recentTasks)
              ? currentData.recentTasks.length
              : 0}
          </p>
        </div>
      ) : viewMode === VIEW_MODES.DETAILED ? (
        <div className="p-4 border rounded bg-white">
          <h3 className="font-semibold mb-2">Detailed Tasks</h3>
          {Array.isArray(currentData.recentTasks) &&
          currentData.recentTasks.length > 0 ? (
            <ul>
              {currentData.recentTasks.map((t, idx) => (
                <li key={idx} className="border-b py-1">
                  {t.title || "Untitled Task"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent tasks.</p>
          )}
        </div>
      ) : (
        <div className="p-4 border rounded bg-white">
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p>
            Skills Progress:{" "}
            {currentData.skillsProgress
              ? JSON.stringify(currentData.skillsProgress)
              : "No data"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackProgress;
