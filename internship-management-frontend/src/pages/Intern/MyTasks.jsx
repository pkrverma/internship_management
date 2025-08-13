import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";

const TASK_STATUS_CONFIG = {
  "Not Started": { color: "bg-gray-100 text-gray-800" },
  "In Progress": { color: "bg-blue-100 text-blue-800" },
  "Pending Review": { color: "bg-yellow-100 text-yellow-800" },
  "Needs Revision": { color: "bg-red-100 text-red-800" },
  Approved: { color: "bg-green-100 text-green-800" },
  Overdue: { color: "bg-red-200 text-red-900" },
};

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("tasks_view_mode") || "cards"
  );

  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadTasks = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        showRefreshing ? setRefreshing(true) : setLoading(true);
        const allTasks = getData("tasks") || [];
        const myTasks = allTasks.filter(
          (t) => t.assignedTo === user.id || t.internId === user.id
        );
        setTasks(myTasks);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load tasks" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  useEffect(() => {
    const id = setInterval(() => loadTasks(true), 60000);
    return () => clearInterval(id);
  }, [loadTasks]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredTasks = useMemo(() => {
    let list = Array.isArray(tasks) ? [...tasks] : [];
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all")
      list = list.filter((t) => t.status === statusFilter);
    return list;
  }, [tasks, searchQuery, statusFilter]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!selectedTask || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setMessage({
            type: "error",
            text: `${file.name} is too large (max 10MB)`,
          });
          continue;
        }
        const res = await uploadFile(file, `tasks/${selectedTask.id}`);
        uploaded.push({ name: file.name, url: res.url, size: file.size });
      }
      setSubmissionFiles((prev) => [...prev, ...uploaded]);
      setMessage({
        type: "success",
        text: `${uploaded.length} file(s) uploaded`,
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to upload file" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionNotes.trim()) {
      setMessage({ type: "error", text: "Notes are required" });
      return;
    }
    try {
      const all = getData("tasks") || [];
      const updated = all.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              status: "Pending Review",
              submissions: [
                ...(t.submissions || []),
                {
                  id: `sub_${Date.now()}`,
                  notes: submissionNotes,
                  files: submissionFiles,
                  submittedAt: new Date().toISOString(),
                },
              ],
            }
          : t
      );
      await saveData("tasks", updated);
      setMessage({ type: "success", text: "Task submitted" });
      setSelectedTask(null);
      setSubmissionNotes("");
      setSubmissionFiles([]);
      loadTasks(true);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Submit failed" });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading tasks..." />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-bold text-xl">My Tasks</h1>
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
      <div className="flex gap-2">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            placeholder="Search tasks..."
            className="flex-grow p-1 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          {Object.keys(TASK_STATUS_CONFIG).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <button
          onClick={() => setViewMode((v) => (v === "cards" ? "list" : "cards"))}
          className="border rounded px-3"
        >
          {viewMode === "cards" ? <IoListOutline /> : <IoGridOutline />}
        </button>
        <button
          onClick={() => loadTasks(true)}
          disabled={refreshing}
          className="border rounded px-3"
        >
          <IoRefreshOutline />
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : viewMode === "cards" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTasks.map((t) => (
            <div key={t.id} className="p-3 border rounded bg-white">
              <h2 className="font-semibold">{t.title}</h2>
              <p className="text-sm">{t.description}</p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                  TASK_STATUS_CONFIG[t.status]?.color || ""
                }`}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.title}</td>
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

export default MyTasks;
