import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllApplications,
  updateApplicationStatus,
} from "../../services/applicationService";
import { getData, saveData } from "../../services/dataService";
import ApplicationDetailsModal from "../../components/admin/ApplicationDetailsModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoTimeOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Submitted: {
    color: "bg-blue-100 text-blue-800",
    icon: IoDocumentTextOutline,
  },
  "Under Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoTimeOutline,
  },
  "Interview Scheduled": {
    color: "bg-purple-100 text-purple-800",
    icon: IoCalendarOutline,
  },
  Shortlisted: {
    color: "bg-green-100 text-green-800",
    icon: IoCheckmarkCircleOutline,
  },
  Hired: { color: "bg-green-600 text-white", icon: IoCheckmarkCircleOutline },
  Rejected: { color: "bg-red-100 text-red-800", icon: IoCloseCircleOutline },
};

const ManageApplications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorAssignments, setMentorAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const [appsRes, usersRes, assignmentsRes] = await Promise.allSettled([
        getAllApplications(),
        getData("users"),
        getData("mentorAssignments"),
      ]);

      const apps =
        appsRes.status === "fulfilled" && Array.isArray(appsRes.value)
          ? appsRes.value
          : [];
      const users =
        usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
          ? usersRes.value
          : [];
      const assignments =
        assignmentsRes.status === "fulfilled" ? assignmentsRes.value : {};

      setMentors(users.filter((u) => u.role?.toLowerCase() === "mentor"));
      setMentorAssignments(assignments);

      const internships = await getData("internships");

      const enriched = apps.map((app) => {
        const intern = users.find(
          (u) => u.id === app.internId || u.id === app.userId
        );
        const internship = internships?.find((i) => i.id === app.internshipId);
        return {
          ...app,
          internName: intern?.name || "Unknown Intern",
          internEmail: intern?.email || "",
          internshipTitle: internship?.title || "Unknown Position",
          mentorName: null,
          status: app.status || "Submitted",
        };
      });

      setApplications(enriched);
    } catch (err) {
      console.error("Failed loading applications:", err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filtered = useMemo(() => {
    let list = [...applications];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.internName.toLowerCase().includes(q) ||
          a.internshipTitle.toLowerCase().includes(q) ||
          a.internEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    return list;
  }, [applications, searchQuery, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateApplicationStatus(id, newStatus);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === id || a.applicationId === id
            ? { ...a, status: newStatus }
            : a
        )
      );
      setMessage({ type: "success", text: "Status updated" });
    } catch {
      setMessage({ type: "error", text: "Update failed" });
    }
  };

  const handleBulkConfirm = async () => {
    const ids = [...selectedApplications];
    try {
      await Promise.all(
        ids.map((id) => updateApplicationStatus(id, bulkAction))
      );
      fetchData(true);
      setSelectedApplications(new Set());
      setBulkAction("");
      setMessage({ type: "success", text: "Bulk update successful" });
    } catch {
      setMessage({ type: "error", text: "Bulk update failed" });
    } finally {
      setConfirmModal({ isOpen: false, action: null });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading applications..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Applications</h1>

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
      {error && <div className="bg-red-100 text-red-700 p-2 mb-3">{error}</div>}

      {/* Search & filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            className="flex-grow p-1 outline-none"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Intern</th>
              <th className="p-2">Internship</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No applications found.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const cfg =
                  STATUS_CONFIG[app.status] || STATUS_CONFIG["Submitted"];
                const Icon = cfg.icon;
                return (
                  <tr key={app.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{app.internName}</p>
                      <p className="text-xs text-gray-500">{app.internEmail}</p>
                    </td>
                    <td className="p-2">{app.internshipTitle}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.color}`}
                      >
                        <Icon size={12} /> {app.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="border rounded p-1 text-xs"
                      >
                        {Object.keys(STATUS_CONFIG).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ApplicationDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        application={selectedApplication}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={handleBulkConfirm}
        title="Confirm Bulk Update"
        message={`Are you sure you want to update ${selectedApplications.size} applications to "${bulkAction}"?`}
        danger
      />
    </div>
  );
};

export default ManageApplications;
