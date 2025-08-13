import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoHourglassOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoBusinessOutline,
} from "react-icons/io5";

const STATUS_CONFIG = {
  Draft: { color: "bg-gray-100 text-gray-800", icon: IoCreateOutline },
  Submitted: {
    color: "bg-blue-100 text-blue-800",
    icon: IoDocumentTextOutline,
  },
  "Under Review": {
    color: "bg-yellow-100 text-yellow-800",
    icon: IoHourglassOutline,
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

const MyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("my_apps_view_mode") || "cards"
  );

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    application: null,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (!user?.id) return setLoading(false);
      try {
        showRefreshing ? setRefreshing(true) : setLoading(true);
        const allApps = getData("applications") || [];
        const internshipsData = getData("internships") || [];
        const myApps = allApps.filter(
          (app) => app.internId === user.id || app.userId === user.id
        );
        const enriched = myApps.map((app) => {
          const internship = internshipsData.find(
            (i) => i.id === app.internshipId
          );
          return {
            ...app,
            internshipTitle: internship?.title || "Unknown",
            internshipCompany: internship?.company || "N/A",
            internshipLocation: internship?.location || "N/A",
            internshipDuration: internship?.duration || "N/A",
            applicationDate:
              app.applicationDate || app.submittedAt || app.createdAt,
          };
        });
        setApplications(enriched);
        setInternships(internshipsData);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load applications" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredApps = useMemo(() => {
    let list = [...applications];
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.internshipTitle.toLowerCase().includes(q) ||
          a.internshipCompany.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((a) => a.status === statusFilter);
    }
    list.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.applicationDate) - new Date(a.applicationDate)
        : new Date(a.applicationDate) - new Date(b.applicationDate)
    );
    return list;
  }, [applications, searchQuery, statusFilter, sortOrder]);

  const withdrawApplication = (app) => {
    setConfirmModal({ isOpen: true, application: app });
  };

  const confirmWithdraw = async () => {
    const { application } = confirmModal;
    try {
      setRefreshing(true);
      const all = getData("applications") || [];
      const updated = all.filter(
        (a) =>
          a.id !== application.id &&
          a.applicationId !== application.applicationId
      );
      localStorage.setItem("applications", JSON.stringify(updated));
      setMessage({ type: "success", text: "Application withdrawn." });
      fetchData(true);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to withdraw." });
    } finally {
      setRefreshing(false);
      setConfirmModal({ isOpen: false, application: null });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading applications..." />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">My Applications</h1>
      {message.text && (
        <div
          className={`p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center border rounded px-2">
          <IoSearchOutline />
          <input
            className="p-1 outline-none"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="All">All Status</option>
          {Object.keys(STATUS_CONFIG).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border rounded p-1"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <button
          onClick={() => setViewMode((v) => (v === "cards" ? "list" : "cards"))}
          className="border rounded px-3"
        >
          {viewMode === "cards" ? <IoListOutline /> : <IoGridOutline />}
        </button>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="border rounded px-3"
        >
          <IoRefreshOutline />
        </button>
      </div>

      {/* List */}
      {filteredApps.length === 0 ? (
        <p className="text-gray-500">No applications found.</p>
      ) : viewMode === "cards" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredApps.map((app) => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.Submitted;
            const Icon = cfg.icon;
            return (
              <div
                key={app.id || app.applicationId}
                className="p-3 border rounded bg-white flex flex-col"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">{app.internshipTitle}</h2>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${cfg.color}`}
                  >
                    <Icon className="inline mr-1" />
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {app.internshipCompany} — {app.internshipLocation}
                </p>
                <p className="mt-2 text-xs">
                  Applied on{" "}
                  {new Date(app.applicationDate).toLocaleDateString()}
                </p>
                <div className="mt-auto flex justify-between text-sm pt-3">
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setIsDetailsModalOpen(true);
                    }}
                    className="text-blue-600 flex items-center gap-1"
                  >
                    <IoEyeOutline /> View
                  </button>
                  <button
                    onClick={() => withdrawApplication(app)}
                    className="text-red-600 flex items-center gap-1"
                  >
                    <IoTrashOutline /> Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Position</th>
                <th className="p-2">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2">Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id || app.applicationId} className="border-t">
                  <td className="p-2">{app.internshipTitle}</td>
                  <td className="p-2">{app.internshipCompany}</td>
                  <td className="p-2">{app.status}</td>
                  <td className="p-2">
                    {new Date(app.applicationDate).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsDetailsModalOpen(true);
                      }}
                      className="text-blue-600 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => withdrawApplication(app)}
                      className="text-red-600"
                    >
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Withdraw Application"
        message={`Are you sure you want to withdraw your application for "${confirmModal.application?.internshipTitle}"?`}
        onConfirm={confirmWithdraw}
        onCancel={() => setConfirmModal({ isOpen: false, application: null })}
      />

      {/* Details Modal */}
      {isDetailsModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-lg">
            <h2 className="font-bold mb-2">
              {selectedApplication.internshipTitle}
            </h2>
            <p>{selectedApplication.internshipCompany}</p>
            <p>Status: {selectedApplication.status}</p>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="mt-4 bg-gray-300 px-3 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
