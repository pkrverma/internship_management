import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoAlarmOutline,
  IoPulseOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoRefreshOutline,
  IoListOutline,
  IoGridOutline,
} from "react-icons/io5";

const TASK_STATUS_CONFIG = {
  "Pending Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
  },
  "Needs Revision": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
  },
  "In Progress": { color: "bg-blue-100 text-blue-800", icon: IoPulseOutline },
  Approved: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Overdue: { color: "bg-red-200 text-red-900", icon: IoAlarmOutline },
};

const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3, Urgent: 4 };

const ReviewTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Review");
  const [internFilter, setInternFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("submittedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("review_tasks_view") || "cards"
  );

  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = useCallback(
    async (refresh = false) => {
      if (!user?.id) return;
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const [allTasks = [], allUsers = []] = await Promise.all([
          getData("tasks") || [],
          getData("users") || [],
        ]);
        const mentorInterns = allUsers.filter(
          (u) =>
            u.role?.toLowerCase() === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              u.mentor === user.name)
        );
        const internIds = mentorInterns.map((i) => i.id);
        const mentorTasks = allTasks.filter(
          (t) =>
            internIds.includes(t.assignedTo || t.internId) ||
            t.mentorId === user.id ||
            t.reviewerId === user.id
        );
        const enriched = mentorTasks.map((t) => {
          const intern = mentorInterns.find(
            (i) => i.id === t.assignedTo || i.id === t.internId
          );
          return {
            ...t,
            internName: intern?.name || "Unknown",
            internEmail: intern?.email || "",
            internUniversity: intern?.university || "",
          };
        });
        setTasks(enriched);
        setInterns(mentorInterns);
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setMessage({ type: "error", text: "Failed to load tasks" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    const id = setInterval(() => loadData(true), 60000);
    return () => clearInterval(id);
  }, [loadData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.internName?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all")
      list = list.filter((t) => t.status === statusFilter);
    if (internFilter !== "all")
      list = list.filter((t) => t.assignedTo === internFilter);
    if (priorityFilter !== "all")
      list = list.filter((t) => t.priority === priorityFilter);

    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "priority":
          aVal = PRIORITY_ORDER[a.priority] || 0;
          bVal = PRIORITY_ORDER[b.priority] || 0;
          break;
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "submittedDate":
          aVal = new Date(a.submittedDate || 0);
          bVal = new Date(b.submittedDate || 0);
          break;
        default:
          aVal = new Date(a.submittedDate || 0);
          bVal = new Date(b.submittedDate || 0);
      }
      return sortOrder === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });

    return list;
  }, [
    tasks,
    searchQuery,
    statusFilter,
    internFilter,
    priorityFilter,
    sortBy,
    sortOrder,
  ]);

  if (loading) return <Spinner fullScreen text="Loading review tasks..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Review Tasks</h1>
      {message.text && (
        <div
          className={`mb-3 p-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}
      {/* Search + Filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="p-1 flex-grow outline-none"
          />
        </div>
        <button
          onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}
          className="border rounded px-3 py-1 flex items-center gap-1"
        >
          {viewMode === "cards" ? <IoListOutline /> : <IoGridOutline />}
          {viewMode === "cards" ? "List" : "Cards"}
        </button>
        <button
          onClick={() => loadData(true)}
          className="border rounded px-3 py-1 flex items-center gap-1"
        >
          <IoRefreshOutline /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <p className="text-gray-500 p-4 border rounded">
          {tasks.length === 0
            ? "No tasks found from your interns"
            : "Try changing filters or searching"}
        </p>
      ) : viewMode === "cards" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTasks.map((t) => {
            const conf =
              TASK_STATUS_CONFIG[t.status] ||
              TASK_STATUS_CONFIG["Pending Review"];
            const Icon = conf.icon;
            return (
              <div key={t.id} className="p-3 border rounded bg-white">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">{t.title}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${conf.color}`}
                  >
                    <Icon className="inline mr-1" /> {t.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{t.internName}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2">Intern</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.internName}</td>
                  <td className="p-2">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReviewTasks;
