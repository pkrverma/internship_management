import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllInternships,
  toggleInternshipStatus,
  deleteInternship,
} from "../../services/internshipService";
import { getData, saveData } from "../../services/dataService";
import InternshipDetailsModal from "../../components/admin/InternshipDetailsModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoAddOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoListOutline,
  IoStopCircleOutline,
  IoPlayCircleOutline,
} from "react-icons/io5";

const AllInternships = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("internships_view_mode") || "grid"
  );

  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    internship: null,
    title: "",
    message: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [
        allInternshipsResult,
        statsResult,
        applicationsResult,
        usersResult,
      ] = await Promise.allSettled([
        getAllInternships(),
        getData("internshipStats"),
        getData("applications"),
        getData("users"),
      ]);

      const internshipsData =
        allInternshipsResult.status === "fulfilled"
          ? allInternshipsResult.value
          : [];
      const statsData =
        statsResult.status === "fulfilled" ? statsResult.value : [];
      const applicationsData =
        applicationsResult.status === "fulfilled"
          ? applicationsResult.value
          : [];
      const usersData =
        usersResult.status === "fulfilled" ? usersResult.value : [];

      const enriched = internshipsData.map((internship) => {
        const stat = statsData.find((s) => s.id === internship.id) || {};
        const relatedApps = applicationsData.filter(
          (app) => app.internshipId === internship.id
        );
        return {
          ...internship,
          applicantCount: relatedApps.length,
          viewCount: stat.viewCount || 0,
          active: stat.active !== false && internship.status !== "Closed",
        };
      });

      setInternships(enriched);
    } catch (err) {
      console.error("Failed to load internships:", err);
      setError("Failed to load internships. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    setSearchParams(params);
  }, [searchQuery, statusFilter, setSearchParams]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    localStorage.setItem("internships_view_mode", viewMode);
  }, [viewMode]);

  const filtered = useMemo(() => {
    let list = internships;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.company?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [internships, searchQuery, statusFilter]);

  const handleStatusChange = async (internshipId, newStatus) => {
    try {
      setRefreshing(true);
      await toggleInternshipStatus(internshipId, newStatus);
      setMessage({ type: "success", text: `Status updated to ${newStatus}` });
      await loadData(true);
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (internship) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      internship,
      title: "Delete Internship",
      message: `Are you sure you want to permanently delete "${internship.title}"?`,
    });
  };

  const confirmAction = async () => {
    const { type, internship } = confirmModal;
    try {
      setRefreshing(true);
      if (type === "delete") {
        await deleteInternship(internship.id);
        setMessage({ type: "success", text: "Internship deleted" });
      }
      await loadData(true);
    } catch {
      setMessage({ type: "error", text: `Failed to ${type} internship` });
    } finally {
      setRefreshing(false);
      setConfirmModal({
        isOpen: false,
        type: null,
        internship: null,
        title: "",
        message: "",
      });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading internships..." />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">All Internships</h1>
        <button
          onClick={() => navigate("/admin/post-internship")}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          <IoAddOutline /> Post Internship
        </button>
      </div>

      {message.text && (
        <div
          className={`p-2 mb-4 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded flex justify-between">
          {error}{" "}
          <button onClick={() => loadData()} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex border rounded px-2 items-center flex-grow">
          <IoSearchOutline className="text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search internships..."
            className="flex-grow p-1 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">All statuses</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Internship grid/list */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-2"
        }
      >
        {filtered.map((i) => (
          <div key={i.id} className="border rounded p-3 bg-white shadow-sm">
            <h2 className="font-semibold">{i.title}</h2>
            <p className="text-sm text-gray-500">{i.company}</p>
            <p className="text-sm">{i.location}</p>
            <p className="text-xs text-gray-400">
              Applications: {i.applicantCount}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() =>
                  handleStatusChange(i.id, i.active ? "Closed" : "Open")
                }
                className={`px-2 py-1 rounded text-xs ${
                  i.active
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {i.active ? (
                  <>
                    <IoStopCircleOutline className="inline" /> Close
                  </>
                ) : (
                  <>
                    <IoPlayCircleOutline className="inline" /> Open
                  </>
                )}
              </button>
              <button
                onClick={() => handleDelete(i)}
                className="px-2 py-1 rounded text-xs bg-red-100 text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <InternshipDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        internship={selectedInternship}
        applicants={applicants}
        onStatusChange={handleStatusChange}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmAction}
        danger
      />
    </div>
  );
};

export default AllInternships;
