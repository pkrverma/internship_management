import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
} from "../../services/userService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import CreateUserModal from "../../components/admin/CreateUserModal";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoPersonAddOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoWarningOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

const ManageUsers = () => {
  const navigate = useNavigate();

  // Data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'role_change', 'delete', 'status_change'
    user: null,
    newValue: null,
    title: "",
    message: "",
  });
  const [createUserModal, setCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Messages
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load users from backend
  const fetchUsers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use real API call instead of just localStorage
      const userData = await getAllUsers();
      setUsers(userData || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Failed to load users. Please try again.");

      // Fallback to localStorage
      try {
        const fallbackUsers = getData("users") || [];
        setUsers(fallbackUsers);
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.status !== "suspended") ||
        (statusFilter === "suspended" && user.status === "suspended");

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
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

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "Admin").length,
      mentors: users.filter((u) => u.role === "Mentor").length,
      interns: users.filter((u) => u.role === "Intern").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      active: users.filter((u) => u.status !== "suspended").length,
    };
  }, [users]);

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;

    setConfirmModal({
      isOpen: true,
      type: "role_change",
      user,
      newValue: newRole,
      title: "Confirm Role Change",
      message: `Are you sure you want to change ${user.name}'s role from ${user.role} to ${newRole}?`,
    });
  };

  const handleStatusChange = async (user, newStatus) => {
    const action = newStatus === "suspended" ? "suspend" : "activate";

    setConfirmModal({
      isOpen: true,
      type: "status_change",
      user,
      newValue: newStatus,
      title: `Confirm Account ${action === "suspend" ? "Suspension" : "Activation"}`,
      message: `Are you sure you want to ${action} ${user.name}'s account?`,
    });
  };

  const handleDeleteUser = (user) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      user,
      newValue: null,
      title: "Confirm User Deletion",
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, user, newValue } = confirmModal;

    try {
      setRefreshing(true);

      switch (type) {
        case "role_change":
          await updateUser(user.id, { role: newValue });
          setMessage({
            type: "success",
            text: `${user.name}'s role changed to ${newValue} successfully!`,
          });
          break;

        case "status_change": {
          await updateUser(user.id, { status: newValue });
          const action = newValue === "suspended" ? "suspended" : "activated";
          setMessage({
            type: "success",
            text: `${user.name}'s account has been ${action} successfully!`,
          });
          break;
        }

        case "delete":
          await deleteUser(user.id);
          setMessage({
            type: "success",
            text: `${user.name} has been deleted successfully!`,
          });
          break;

        default:
          break;
      }

      await fetchUsers(true);
    } catch (error) {
      console.error("Failed to perform action:", error);
      setMessage({
        type: "error",
        text: `Failed to ${type.replace("_", " ")} user. Please try again.`,
      });
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

  const handleCreateUser = async (userData) => {
    try {
      setRefreshing(true);
      await createUser(userData);
      setMessage({
        type: "success",
        text: `User ${userData.name} created successfully!`,
      });
      await fetchUsers(true);
      setCreateUserModal(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      setMessage({
        type: "error",
        text: "Failed to create user. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const exportUsers = () => {
    try {
      const csvData = [
        ["Name", "Email", "Role", "Status", "Created Date"],
        ...filteredAndSortedUsers.map((user) => [
          user.name,
          user.email,
          user.role,
          user.status || "active",
          new Date(user.createdAt || Date.now()).toLocaleDateString(),
        ]),
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Users exported successfully!" });
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({ type: "error", text: "Failed to export users." });
    }
  };

  const getRoleOptions = (currentRole) => {
    const baseOptions = ["Admin", "Mentor", "Intern"];
    return baseOptions;
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Mentor":
        return "bg-blue-100 text-blue-800";
      case "Intern":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === "suspended"
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" text="Loading users..." />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <IoWarningOutline className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Users
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={() => fetchUsers()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={exportUsers}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoDownloadOutline className="w-4 h-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => setCreateUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoPersonAddOutline className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={
              message.type === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoShieldCheckmarkOutline className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.admins}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Mentors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.mentors}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Interns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.interns}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoStatsChartOutline className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoWarningOutline className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Suspended</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.suspended}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <IoFilterOutline className="mr-2 h-4 w-4" />
          Filters
          {(roleFilter !== "all" || statusFilter !== "all") && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
              {[
                roleFilter !== "all" ? 1 : 0,
                statusFilter !== "all" ? 1 : 0,
              ].reduce((a, b) => a + b)}
            </span>
          )}
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Mentor">Mentor</option>
              <option value="Intern">Intern</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Role</option>
              <option value="created">Sort by Created Date</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-
            {Math.min(startIndex + usersPerPage, filteredAndSortedUsers.length)}{" "}
            of {filteredAndSortedUsers.length} users
          </span>
          {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {paginatedUsers.length === 0 ? (
          <div className="text-center py-12">
            <IoPeopleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No users have been created yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user, e.target.value)
                          }
                          disabled={refreshing}
                          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                          {getRoleOptions(user.role).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              user,
                              user.status === "suspended"
                                ? "active"
                                : "suspended"
                            )
                          }
                          disabled={refreshing}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            user.status
                          )} hover:opacity-80 transition-opacity disabled:opacity-50`}
                        >
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </button>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(
                          user.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View Details"
                          >
                            <IoEyeOutline className="w-4 h-4" />
                          </button>

                          {user.role !== "Admin" && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={refreshing}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="Delete User"
                            >
                              <IoTrashOutline className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(
                          startIndex + usersPerPage,
                          filteredAndSortedUsers.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredAndSortedUsers.length}
                      </span>{" "}
                      results
                    </p>
                  </div>

                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            user: null,
            newValue: null,
            title: "",
            message: "",
          })
        }
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.type === "delete" ? "Delete" : "Confirm"}
        cancelText="Cancel"
        danger={
          confirmModal.type === "delete" ||
          confirmModal.newValue === "suspended"
        }
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createUserModal}
        onClose={() => setCreateUserModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
};

export default ManageUsers;
