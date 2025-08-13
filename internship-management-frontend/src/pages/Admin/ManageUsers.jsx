import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
} from "../../services/userService";
import { getData } from "../../services/dataService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import CreateUserModal from "../../components/admin/CreateUserModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoPersonAddOutline,
  IoDownloadOutline,
} from "react-icons/io5";

const ManageUsers = () => {
  const navigate = useNavigate();

  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sort
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // UI
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    user: null,
    newValue: null,
    title: "",
    message: "",
  });
  const [createUserModal, setCreateUserModal] = useState(false);

  // 🔹 Fetch Users
  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users list");
      // fallback to local storage
      try {
        const localUsers = getData("users") || [];
        setUsers(localUsers);
      } catch (e) {
        console.error("No fallback user data found.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => fetchUsers(true), 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Auto-clear messages
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter + Sort
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      list = list.filter(
        (u) => u.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((u) => {
        if (statusFilter === "active")
          return u.status?.toLowerCase() !== "suspended";
        if (statusFilter === "suspended")
          return u.status?.toLowerCase() === "suspended";
        return true;
      });
    }
    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "email":
          aVal = a.email?.toLowerCase() || "";
          bVal = b.email?.toLowerCase() || "";
          break;
        case "role":
          aVal = a.role?.toLowerCase() || "";
          bVal = b.role?.toLowerCase() || "";
          break;
        case "created":
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
          break;
        default:
          aVal = a[sortBy] || "";
          bVal = b[sortBy] || "";
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
  }, [users, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Actions
  const handleRoleChange = (user, newRole) => {
    if (newRole === user.role) return;
    setConfirmModal({
      isOpen: true,
      type: "role_change",
      user,
      newValue: newRole,
      title: "Confirm Role Change",
      message: `Change ${user.name}'s role to ${newRole}?`,
    });
  };

  const handleStatusChange = (user, newStatus) => {
    setConfirmModal({
      isOpen: true,
      type: "status_change",
      user,
      newValue: newStatus,
      title: `Confirm ${newStatus === "suspended" ? "Suspension" : "Activation"}`,
      message: `${newStatus === "suspended" ? "Suspend" : "Activate"} ${user.name}'s account?`,
    });
  };

  const handleDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      user,
      title: "Confirm Delete",
      message: `Delete ${user.name}? This action cannot be undone.`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, user, newValue } = confirmModal;
    try {
      setRefreshing(true);
      if (type === "role_change") {
        await updateUser(user.id, { role: newValue });
        setMessage({ type: "success", text: `Role updated to ${newValue}` });
      } else if (type === "status_change") {
        await updateUser(user.id, { status: newValue });
        setMessage({ type: "success", text: `Status updated` });
      } else if (type === "delete") {
        await deleteUser(user.id);
        setMessage({ type: "success", text: `User deleted` });
      }
      await fetchUsers(true);
    } catch (err) {
      console.error("User update failed", err);
      setMessage({ type: "error", text: "Action failed" });
    } finally {
      setRefreshing(false);
      setConfirmModal({
        isOpen: false,
        type: null,
        user: null,
        newValue: null,
        title: "",
        message: "",
      });
    }
  };

  const handleCreateUser = async (data) => {
    try {
      setRefreshing(true);
      await createUser(data);
      setMessage({ type: "success", text: `User ${data.name} created` });
      await fetchUsers(true);
    } catch (err) {
      setMessage({ type: "error", text: "Create user failed" });
    } finally {
      setRefreshing(false);
      setCreateUserModal(false);
    }
  };

  const exportUsers = () => {
    try {
      const csvData = [
        ["Name", "Email", "Role", "Status", "Created"],
        ...filteredUsers.map((u) => [
          u.name,
          u.email,
          u.role,
          u.status || "active",
          new Date(u.createdAt || Date.now()).toLocaleDateString(),
        ]),
      ];
      const blob = new Blob([csvData.map((r) => r.join(",")).join("\n")], {
        type: "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: "error", text: "Export failed" });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading users..." />;

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Manage Users</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateUserModal(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded"
          >
            <IoPersonAddOutline /> New User
          </button>
          <button
            onClick={exportUsers}
            className="flex items-center gap-1 border px-3 py-1 rounded"
          >
            <IoDownloadOutline /> Export
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-3 p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}
      {error && <div className="mb-3 p-2 bg-red-100 text-red-700">{error}</div>}

      {/* Search & filters */}
      <div className="flex gap-2 mb-3">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow p-1 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Mentor">Mentor</option>
          <option value="Intern">Intern</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-1"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    className="border rounded text-xs p-1"
                  >
                    {["Admin", "Mentor", "Intern"].map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${u.status?.toLowerCase() === "suspended" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                  >
                    {u.status || "active"}
                  </span>
                </td>
                <td className="p-2">
                  {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        u,
                        u.status?.toLowerCase() === "suspended"
                          ? "active"
                          : "suspended"
                      )
                    }
                    className="text-blue-600 mr-2"
                  >
                    {u.status?.toLowerCase() === "suspended"
                      ? "Activate"
                      : "Suspend"}
                  </button>
                  {u.role?.toLowerCase() !== "admin" && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? "bg-blue-500 text-white" : ""}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.type === "delete"}
      />

      <CreateUserModal
        isOpen={createUserModal}
        onClose={() => setCreateUserModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
};

export default ManageUsers;
