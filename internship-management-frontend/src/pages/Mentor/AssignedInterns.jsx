// src/pages/mentor/AssignedInterns.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoPeopleOutline,
  IoEyeOutline,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoLocationOutline,
  IoMailOutline,
  IoCallOutline,
  IoPersonOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoAddOutline,
  IoCreateOutline,
  IoArrowForward,
  IoChevronForward,
  IoPulseOutline,
  IoStarOutline,
  IoRibbonOutline,
} from "react-icons/io5";

const INTERN_STATUS_CONFIG = {
  Active: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Inactive: { color: "bg-red-100 text-red-800", icon: IoWarningOutline },
  "On Break": { color: "bg-yellow-100 text-yellow-800", icon: IoTimeOutline },
  Completed: { color: "bg-blue-100 text-blue-800", icon: IoRibbonOutline },
  Probation: { color: "bg-orange-100 text-orange-800", icon: IoWarningOutline },
};

const AssignedInterns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);

  // Loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // View
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("assigned_interns_view") || "cards"
  );
  const [selectedIntern, setSelectedIntern] = useState(null);

  // UI
  const [message, setMessage] = useState({ type: "", text: "" });

  // Helpers
  const calculateGrade = (score) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "C+";
    if (score >= 70) return "C";
    if (score >= 65) return "D+";
    if (score >= 60) return "D";
    return "F";
  };

  const calculateTrend = (taskList) => {
    const list = Array.isArray(taskList) ? taskList : [];
    if (list.length < 2) return "stable";
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recent = list.filter(
      (t) => new Date(t.createdAt || t.assignedAt) >= twoWeeksAgo
    );
    const older = list.filter((t) => {
      const d = new Date(t.createdAt || t.assignedAt);
      return d < twoWeeksAgo && d >= fourWeeksAgo;
    });

    const rc =
      recent.length > 0
        ? recent.filter((t) => t.status === "Approved").length / recent.length
        : 0;
    const oc =
      older.length > 0
        ? older.filter((t) => t.status === "Approved").length / older.length
        : 0;

    if (rc > oc + 0.1) return "improving";
    if (rc < oc - 0.1) return "declining";
    return "stable";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const conf = INTERN_STATUS_CONFIG[status] || INTERN_STATUS_CONFIG.Active;
    const Icon = conf.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${conf.color}`}
      >
        <Icon /> {status}
      </span>
    );
  };

  // Load data
  const loadData = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        showRefreshing ? setRefreshing(true) : setLoading(true);
        setMessage({ type: "", text: "" });

        const [allUsers = [], allTasks = [], allApplications = []] =
          await Promise.all([
            getData("users") || [],
            getData("tasks") || [],
            getData("applications") || [],
          ]);

        // Link interns to mentor robustly
        const mentorInterns = allUsers.filter((u) => {
          const role = u.role?.toLowerCase();
          return (
            role === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              (u.mentor && u.mentor === user.name))
          );
        });

        const internIds = mentorInterns.map((i) => i.id);
        const internTasks = (allTasks || []).filter((t) =>
          internIds.includes(t.assignedTo || t.internId)
        );
        const internApps = (allApplications || []).filter((a) =>
          internIds.includes(a.internId || a.userId)
        );

        const enriched = mentorInterns.map((intern) => {
          const list = internTasks.filter(
            (t) => t.assignedTo === intern.id || t.internId === intern.id
          );
          const apps = internApps.filter(
            (a) => a.internId === intern.id || a.userId === intern.id
          );

          const totalTasks = list.length;
          const completedTasks = list.filter(
            (t) => t.status === "Approved"
          ).length;

          const onTimeTasks = list.filter((t) => {
            if (t.status !== "Approved") return false;
            const due = new Date(t.dueDate);
            const done = new Date(t.updatedAt || t.completedAt);
            return done <= due;
          }).length;

          const overdueTasks = list.filter((t) => {
            const due = new Date(t.dueDate);
            return t.status !== "Approved" && due < new Date();
          }).length;

          const pendingTasks = list.filter(
            (t) =>
              t.status === "Pending Review" || t.status === "Needs Revision"
          ).length;

          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
          const onTimeRate =
            totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;
          const performanceScore = Math.round(
            completionRate * 0.7 + onTimeRate * 0.3
          );

          const lastActiveDate =
            intern.lastLogin || intern.lastActive || intern.updatedAt;
          const daysInactive = lastActiveDate
            ? Math.floor(
                (new Date() - new Date(lastActiveDate)) / (1000 * 60 * 60 * 24)
              )
            : null;

          return {
            ...intern,
            totalTasks,
            completedTasks,
            onTimeTasks,
            overdueTasks,
            pendingTasks,
            completionRate,
            onTimeRate,
            performanceScore,
            grade: calculateGrade(performanceScore),
            trend: calculateTrend(list),
            applications: apps,
            daysInactive,
            lastActiveDate,
            joinDate: intern.startDate || intern.joinedAt || intern.createdAt,
            currentUniversity: intern.university || intern.currentUniversity,
            status: intern.status || (daysInactive > 7 ? "Inactive" : "Active"),
          };
        });

        setInterns(enriched);
        setTasks(internTasks);
        setApplications(internApps);
      } catch (err) {
        console.error("Failed to load assigned interns:", err);
        setMessage({
          type: "error",
          text: "Failed to load interns. Please try again.",
        });
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
    const interval = setInterval(() => loadData(true), 300000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem("assigned_interns_view", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Filtering & sorting
  const filteredAndSortedInterns = useMemo(() => {
    let list = [...interns];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          `${i.firstName || ""} ${i.lastName || ""}`
            .toLowerCase()
            .includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.currentUniversity?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all")
      list = list.filter((i) => i.status === statusFilter);

    if (universityFilter !== "all")
      list = list.filter((i) => i.currentUniversity === universityFilter);

    if (performanceFilter !== "all") {
      list = list.filter((i) => {
        const s = i.performanceScore || 0;
        switch (performanceFilter) {
          case "excellent":
            return s >= 90;
          case "good":
            return s >= 75 && s < 90;
          case "average":
            return s >= 60 && s < 75;
          case "needs_improvement":
            return s < 60;
          default:
            return true;
        }
      });
    }

    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = (
            a.name || `${a.firstName || ""} ${a.lastName || ""}`
          ).toLowerCase();
          bVal = (
            b.name || `${b.firstName || ""} ${b.lastName || ""}`
          ).toLowerCase();
          break;
        case "performance":
          aVal = a.performanceScore || 0;
          bVal = b.performanceScore || 0;
          break;
        case "completionRate":
          aVal = a.completionRate || 0;
          bVal = b.completionRate || 0;
          break;
        case "joinDate":
          aVal = new Date(a.joinDate || 0);
          bVal = new Date(b.joinDate || 0);
          break;
        case "lastActive":
          aVal = new Date(a.lastActiveDate || 0);
          bVal = new Date(b.lastActiveDate || 0);
          break;
        case "university":
          aVal = a.currentUniversity?.toLowerCase() || "";
          bVal = b.currentUniversity?.toLowerCase() || "";
          break;
        default:
          aVal = (
            a.name || `${a.firstName || ""} ${a.lastName || ""}`
          ).toLowerCase();
          bVal = (
            b.name || `${b.firstName || ""} ${b.lastName || ""}`
          ).toLowerCase();
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
    interns,
    searchQuery,
    statusFilter,
    universityFilter,
    performanceFilter,
    sortBy,
    sortOrder,
  ]);

  const universities = useMemo(() => {
    const set = new Set(
      interns.map((i) => i.currentUniversity).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [interns]);

  const stats = useMemo(() => {
    const total = interns.length;
    const active = interns.filter((i) => i.status === "Active").length;
    const avgPerformance =
      total > 0
        ? Math.round(
            interns.reduce((s, i) => s + (i.performanceScore || 0), 0) / total
          )
        : 0;
    const highPerformers = interns.filter(
      (i) => (i.performanceScore || 0) >= 85
    ).length;
    const needsAttention = interns.filter(
      (i) => (i.overdueTasks || 0) > 0 || (i.performanceScore || 0) < 60
    ).length;
    return { total, active, avgPerformance, highPerformers, needsAttention };
  }, [interns]);

  if (loading) return <Spinner fullScreen text="Loading assigned interns..." />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Assigned Interns</h1>
        <div className="flex gap-2">
          <button
            onClick={() => loadData(true)}
            className="flex items-center gap-1 border px-3 py-1 rounded"
          >
            <IoRefreshOutline /> Refresh
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1 border px-3 py-1 rounded"
          >
            <IoFilterOutline /> Filters
          </button>
          <button
            onClick={() =>
              setViewMode((v) => (v === "cards" ? "list" : "cards"))
            }
            className="flex items-center gap-1 border px-3 py-1 rounded"
          >
            {viewMode === "cards" ? <IoListOutline /> : <IoGridOutline />} View
          </button>
        </div>
      </div>

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500">Total Interns</div>
          <div className="text-lg font-semibold">{stats.total}</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500">Active</div>
          <div className="text-lg font-semibold">{stats.active}</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500">Avg Performance</div>
          <div className="text-lg font-semibold">{stats.avgPerformance}%</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500">High Performers</div>
          <div className="text-lg font-semibold">{stats.highPerformers}</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-500">Needs Attention</div>
          <div className="text-lg font-semibold">{stats.needsAttention}</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex items-center border rounded px-2 flex-grow min-w-[240px]">
          <IoSearchOutline />
          <input
            className="flex-grow p-1 outline-none"
            placeholder="Search by name, email, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showFilters && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded p-1"
            >
              <option value="all">All Status</option>
              {Object.keys(INTERN_STATUS_CONFIG).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="border rounded p-1"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="border rounded p-1"
            >
              <option value="all">All Performance</option>
              <option value="excellent">Excellent (90+)</option>
              <option value="good">Good (75-89)</option>
              <option value="average">Average (60-74)</option>
              <option value="needs_improvement">
                Needs Improvement (&lt;60)
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded p-1"
            >
              <option value="name">Name</option>
              <option value="performance">Performance</option>
              <option value="completionRate">Completion Rate</option>
              <option value="joinDate">Join Date</option>
              <option value="lastActive">Last Active</option>
              <option value="university">University</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border rounded p-1"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </>
        )}
      </div>

      {/* Content */}
      {filteredAndSortedInterns.length === 0 ? (
        <div className="p-6 text-center text-gray-600 border rounded bg-white">
          {interns.length === 0
            ? "You don't have any interns assigned to you yet"
            : "Try adjusting your search or filters"}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAndSortedInterns.map((intern) => (
            <div key={intern.id} className="p-3 bg-white rounded border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">
                    {intern.name ||
                      `${intern.firstName || ""} ${intern.lastName || ""}`}
                  </div>
                  <div className="text-xs text-gray-500">{intern.email}</div>
                  <div className="text-xs text-gray-500">
                    {intern.currentUniversity}
                  </div>
                </div>
                {getStatusBadge(intern.status)}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Performance</div>
                  <div className="flex items-center gap-1">
                    <IoPulseOutline className="text-blue-600" />{" "}
                    {intern.performanceScore}%
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Completion</div>
                  <div>{intern.completionRate}%</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">On-time</div>
                  <div>{intern.onTimeRate}%</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Overdue</div>
                  <div>{intern.overdueTasks}</div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  {intern.trend === "improving" ? (
                    <IoTrendingUpOutline className="text-green-600" />
                  ) : intern.trend === "declining" ? (
                    <IoTrendingDownOutline className="text-red-600" />
                  ) : (
                    <IoPulseOutline className="text-gray-500" />
                  )}
                  {intern.trend}
                </span>
                <span>• Grade {intern.grade}</span>
              </div>

              <div className="mt-3 flex justify-between">
                <Link
                  to={`/mentor/track-progress?intern=${intern.id}`}
                  className="text-blue-600 text-sm inline-flex items-center gap-1"
                >
                  <IoEyeOutline /> View Progress
                </Link>
                <Link
                  to={`/mentor/review-tasks?intern=${intern.id}`}
                  className="text-blue-600 text-sm inline-flex items-center gap-1"
                >
                  <IoDocumentTextOutline /> Review Tasks
                </Link>
                <Link
                  to={`/mentor/meetings?intern=${intern.id}`}
                  className="text-blue-600 text-sm inline-flex items-center gap-1"
                >
                  <IoCalendarOutline /> Meetings
                </Link>
                <Link
                  to={`/mentor/chat?intern=${intern.id}`}
                  className="text-blue-600 text-sm inline-flex items-center gap-1"
                >
                  <IoChatbubbleOutline /> Chat
                </Link>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Joined: {formatDate(intern.joinDate)} • Last active:{" "}
                {formatDate(intern.lastActiveDate)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Intern</th>
                <th className="p-2 text-left">University</th>
                <th className="p-2">Status</th>
                <th className="p-2">Perf</th>
                <th className="p-2">Complete</th>
                <th className="p-2">On-time</th>
                <th className="p-2">Overdue</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInterns.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">
                      {i.name || `${i.firstName || ""} ${i.lastName || ""}`}
                    </div>
                    <div className="text-xs text-gray-500">{i.email}</div>
                  </td>
                  <td className="p-2">{i.currentUniversity || "-"}</td>
                  <td className="p-2">{getStatusBadge(i.status)}</td>
                  <td className="p-2">{i.performanceScore}%</td>
                  <td className="p-2">{i.completionRate}%</td>
                  <td className="p-2">{i.onTimeRate}%</td>
                  <td className="p-2">{i.overdueTasks}</td>
                  <td className="p-2 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        className="text-blue-600"
                        to={`/mentor/track-progress?intern=${i.id}`}
                      >
                        Progress
                      </Link>
                      <Link
                        className="text-blue-600"
                        to={`/mentor/review-tasks?intern=${i.id}`}
                      >
                        Tasks
                      </Link>
                      <Link
                        className="text-blue-600"
                        to={`/mentor/meetings?intern=${i.id}`}
                      >
                        Meetings
                      </Link>
                      <Link
                        className="text-blue-600"
                        to={`/mentor/chat?intern=${i.id}`}
                      >
                        Chat
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedInterns.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    Try adjusting your search or filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedInterns;
