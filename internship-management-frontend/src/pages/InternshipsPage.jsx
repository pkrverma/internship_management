import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAvailableInternships } from "../services/internshipService";
import Spinner from "../components/ui/Spinner";
import {
  IoSearchOutline,
  IoFilterOutline,
  IoLocationOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoCloseOutline,
  IoHeartOutline,
  IoHeart,
  IoGridOutline,
  IoListOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";

const InternshipsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    location: searchParams.get("location") || "",
    department: searchParams.get("department") || "",
    duration: searchParams.get("duration") || "",
    stipendRange: searchParams.get("stipend") || "",
    type: searchParams.get("type") || "",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load internships
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAvailableInternships();
        setInternships(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch internships:", err);
        setError("Failed to load internships. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    if (user) {
      const savedFavorites = JSON.parse(
        localStorage.getItem(`favorites_${user.id}`) || "[]"
      );
      setFavorites(new Set(savedFavorites));
    }
  }, [user]);

  // Filtering and sorting
  const filteredAndSortedInternships = useMemo(() => {
    let result = [...internships];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(query) ||
          i.description?.toLowerCase().includes(query) ||
          i.company?.toLowerCase().includes(query) ||
          i.location?.toLowerCase().includes(query) ||
          i.department?.toLowerCase().includes(query)
      );
    }

    // Filters
    if (filters.location) {
      result = result.filter((i) =>
        i.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.department) {
      result = result.filter((i) =>
        i.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }
    if (filters.duration) {
      result = result.filter((i) =>
        i.duration?.toLowerCase().includes(filters.duration.toLowerCase())
      );
    }
    if (filters.type) {
      result = result.filter(
        (i) => i.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }
    if (filters.stipendRange) {
      result = result.filter((i) => {
        const stipend = i.stipend?.toLowerCase() || "";
        switch (filters.stipendRange) {
          case "paid":
            return (
              !stipend.includes("unpaid") && !stipend.includes("no stipend")
            );
          case "unpaid":
            return stipend.includes("unpaid") || stipend.includes("no stipend");
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "deadline":
          return (
            new Date(a.applicationDeadline || 0) -
            new Date(b.applicationDeadline || 0)
          );
        case "alphabetical":
          return (a.title || "").localeCompare(b.title || "");
        case "stipend": {
          const aAmt = parseInt(a.stipend?.replace(/[^0-9]/g, "") || 0);
          const bAmt = parseInt(b.stipend?.replace(/[^0-9]/g, "") || 0);
          return bAmt - aAmt;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [internships, searchQuery, filters, sortBy]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filters.location) params.set("location", filters.location);
    if (filters.department) params.set("department", filters.department);
    if (filters.duration) params.set("duration", filters.duration);
    if (filters.stipendRange) params.set("stipend", filters.stipendRange);
    if (filters.type) params.set("type", filters.type);
    setSearchParams(params);
  }, [searchQuery, filters, setSearchParams]);

  // Pagination handling
  const totalPages = Math.ceil(
    filteredAndSortedInternships.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInternships = filteredAndSortedInternships.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handlers
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({
      location: "",
      department: "",
      duration: "",
      stipendRange: "",
      type: "",
    });
    setCurrentPage(1);
  };
  const toggleFavorite = (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const updated = new Set(favorites);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setFavorites(updated);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify([...updated]));
  };
  const handleApply = (id) => {
    if (!isAuthenticated) {
      navigate("/register", {
        state: { from: `/internships`, internshipId: id },
      });
      return;
    }
    if (user?.role?.toLowerCase() !== "intern") {
      alert(
        "Only interns can apply for internships. Please register as an intern."
      );
      navigate("/register");
      return;
    }
    navigate(`/intern/apply/${id}`);
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };
  const isDeadlineApproaching = (deadline) => {
    if (!deadline) return false;
    const daysLeft = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 7 && daysLeft > 0;
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);

  if (loading) return <Spinner fullScreen text="Loading internships..." />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Browse Internships</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-100" : ""}`}
          >
            <IoGridOutline />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100" : ""}`}
          >
            <IoListOutline />
          </button>
        </div>
      </div>

      {/* Search and filter actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex flex-1 items-center border rounded-lg px-2">
          <IoSearchOutline className="text-gray-500" />
          <input
            type="text"
            placeholder="Search internships..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 p-2 outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-lg"
        >
          <IoFilterOutline className="mr-2" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="border rounded p-2"
            />
            <input
              type="text"
              placeholder="Department"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="border rounded p-2"
            />
            <select
              value={filters.stipendRange}
              onChange={(e) =>
                handleFilterChange("stipendRange", e.target.value)
              }
              className="border rounded p-2"
            >
              <option value="">Any stipend</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={clearAllFilters}
              className="text-red-500 hover:underline"
            >
              Clear All
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded p-2"
            >
              <option value="newest">Newest</option>
              <option value="deadline">Application Deadline</option>
              <option value="stipend">Highest Stipend</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
        </div>
      )}

      {/* Internship listings */}
      {paginatedInternships.length === 0 ? (
        <div className="text-center text-gray-500">No internships found.</div>
      ) : (
        <div
          className={`grid gap-4 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {paginatedInternships.map((internship) => (
            <div
              key={internship.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold mb-2">{internship.title}</h3>
              <p className="text-sm text-gray-500">{internship.company}</p>
              <p className="text-sm mt-2">{internship.location}</p>
              <p className="text-xs text-gray-400">
                Apply by: {formatDate(internship.applicationDeadline)}
                {isDeadlineApproaching(internship.applicationDeadline) && (
                  <span className="ml-1 text-red-500">(Closing soon!)</span>
                )}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => toggleFavorite(internship.id)}
                  className="text-red-500"
                >
                  {favorites.has(internship.id) ? (
                    <IoHeart />
                  ) : (
                    <IoHeartOutline />
                  )}
                </button>
                <button
                  onClick={() => handleApply(internship.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === idx + 1 ? "bg-blue-500 text-white" : ""
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
