import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import { getNotifications } from "../../services/notificationService";
import Spinner from "../../components/ui/Spinner";
import {
  IoStatsChartOutline,
  IoEyeOutline,
  IoPulseOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoAlarmOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  "Not Started": { color: "bg-gray-100 text-gray-800", icon: IoEyeOutline },
  "In Progress": { color: "bg-blue-100 text-blue-800", icon: IoPulseOutline },
  "Pending Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoEyeOutline,
  },
  "Needs Revision": {
    color: "bg-red-100 text-red-800",
    icon: IoWarningOutline,
  },
  Approved: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Overdue: { color: "bg-red-200 text-red-900", icon: IoAlarmOutline },
};

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignedInterns, setAssignedInterns] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const calculatePerformanceScore = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "Approved").length;
    const onTime = tasks.filter((t) => {
      if (t.status !== "Approved") return false;
      return new Date(t.updatedAt || t.completedAt) <= new Date(t.dueDate);
    }).length;
    const completionRate = (completed / tasks.length) * 100;
    const onTimeRate = (onTime / tasks.length) * 100;
    return Math.round(completionRate * 0.7 + onTimeRate * 0.3);
  };

  const loadDashboardData = useCallback(
    async (showRefreshing = false) => {
      try {
        showRefreshing ? setRefreshing(true) : setLoading(true);
        setMessage({ type: "", text: "" });

        const [users, tasks, apps, updates] = await Promise.all([
          getData("users") || [],
          getData("tasks") || [],
          getData("applications") || [],
          getNotifications({ limit: 4 }),
        ]);

        const mentorInterns = (users || []).filter(
          (u) =>
            u.role?.toLowerCase() === "intern" &&
            (u.mentorId === user.id ||
              u.assignedMentor === user.id ||
              u.mentor === user.name)
        );

        const internIds = mentorInterns.map((i) => i.id);
        const internTasks = (tasks || []).filter(
          (t) =>
            internIds.includes(t.assignedTo || t.internId) ||
            t.mentorId === user.id
        );

        const tasksNeedingReview = internTasks.filter((t) =>
          ["Pending Review", "Needs Revision"].includes(t.status)
        );

        const enrichedInterns = mentorInterns.map((intern) => {
          const internTaskList = internTasks.filter(
            (t) => t.assignedTo === intern.id || t.internId === intern.id
          );
          return {
            ...intern,
            totalTasks: internTaskList.length,
            tasksCompleted: internTaskList.filter(
              (t) => t.status === "Approved"
            ).length,
            overdueTasks: internTaskList.filter(
              (t) => t.status !== "Approved" && new Date(t.dueDate) < new Date()
            ).length,
            applications: (apps || []).filter(
              (a) => a.internId === intern.id || a.userId === intern.id
            ),
            performance: calculatePerformanceScore(internTaskList),
          };
        });

        setAssignedInterns(enrichedInterns);
        setPendingTasks(tasksNeedingReview.slice(0, 5));
        setRecentUpdates(Array.isArray(updates) ? updates : []);
        setApplications(Array.isArray(apps) ? apps : []);
        setAllTasks(internTasks);
      } catch (err) {
        console.error("Mentor Dashboard load failed:", err);
        setMessage({ type: "error", text: "Failed to load dashboard data" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user?.id) loadDashboardData();
  }, [user, loadDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => loadDashboardData(true), 60000);
    return () => clearInterval(timer);
  }, [loadDashboardData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      totalInterns: assignedInterns.length,
      activeInterns: assignedInterns.filter((i) => {
        const lastActive = new Date(i.lastActive || 0);
        return lastActive >= new Date(now.getTime() - 3 * 86400000);
      }).length,
      totalTasks: allTasks.length,
      pendingReview: allTasks.filter((t) => t.status === "Pending Review")
        .length,
      overdueTasks: allTasks.filter(
        (t) => t.status !== "Approved" && new Date(t.dueDate) < now
      ).length,
      avgPerformance:
        assignedInterns.length > 0
          ? Math.round(
              assignedInterns.reduce(
                (sum, i) => sum + (i.performance || 0),
                0
              ) / assignedInterns.length
            )
          : 0,
    };
  }, [assignedInterns, allTasks]);

  if (loading) return <Spinner fullScreen text="Loading mentor dashboard..." />;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <IoStatsChartOutline /> Mentor Dashboard
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

      {/* Stats section */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-3 bg-white rounded shadow">
          <p className="text-xs text-gray-500">Total Interns</p>
          <p className="text-lg font-semibold">{stats.totalInterns}</p>
        </div>
        <div className="p-3 bg-white rounded shadow">
          <p className="text-xs text-gray-500">Active Interns</p>
          <p className="text-lg font-semibold">{stats.activeInterns}</p>
        </div>
        <div className="p-3 bg-white rounded shadow">
          <p className="text-xs text-gray-500">Pending Reviews</p>
          <p className="text-lg font-semibold">{stats.pendingReview}</p>
        </div>
      </div>

      {/* Pending Tasks */}
      <section>
        <h2 className="font-semibold mb-2">Pending Tasks for Review</h2>
        {pendingTasks.length === 0 ? (
          <p className="text-gray-500">No tasks needing review right now.</p>
        ) : (
          <ul className="space-y-2">
            {pendingTasks.map((task) => {
              const conf =
                STATUS_CONFIG[task.status] || STATUS_CONFIG["Not Started"];
              const Icon = conf.icon;
              return (
                <li
                  key={task.id}
                  className="p-2 border rounded flex justify-between"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.status}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${conf.color}`}
                  >
                    <Icon className="inline mr-1" />
                    {task.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recent Updates */}
      <section>
        <h2 className="font-semibold mb-2">Recent Updates</h2>
        {recentUpdates.length === 0 ? (
          <p className="text-gray-500">No updates available.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {recentUpdates.map((n) => (
              <li key={n.id}>{n.title || n.message}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MentorDashboard;
