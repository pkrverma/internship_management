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

  // State management
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Filter and search state
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
  const [sortBy, setSortBy] = useState("newest"); // newest, deadline, stipend, alphabetical
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
        setInternships(data || []);
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

  // Apply filters and search
  const filteredAndSortedInternships = useMemo(() => {
    let result = internships;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (internship) =>
          internship.title?.toLowerCase().includes(query) ||
          internship.description?.toLowerCase().includes(query) ||
          internship.company?.toLowerCase().includes(query) ||
          internship.location?.toLowerCase().includes(query) ||
          internship.department?.toLowerCase().includes(query)
      );
    }

    // Apply filters
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
      // Basic stipend filtering - you can make this more sophisticated
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

    // Apply sorting
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
          // Basic stipend sorting - you can make this more sophisticated
          const aStipend = a.stipend?.includes("₹")
            ? parseInt(a.stipend.match(/\d+/)?.[0] || 0)
            : 0;
          const bStipend = b.stipend?.includes("₹")
            ? parseInt(b.stipend.match(/\d+/)?.[0] || 0)
            : 0;
          return bStipend - aStipend;
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

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedInternships.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInternships = filteredAndSortedInternships.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
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

  const toggleFavorite = (internshipId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const newFavorites = new Set(favorites);
    if (newFavorites.has(internshipId)) {
      newFavorites.delete(internshipId);
    } else {
      newFavorites.add(internshipId);
    }

    setFavorites(newFavorites);
    localStorage.setItem(
      `favorites_${user.id}`,
      JSON.stringify([...newFavorites])
    );
  };

  const handleApply = (internshipId) => {
    if (!isAuthenticated) {
      navigate("/register", { state: { from: `/internships`, internshipId } });
      return;
    }

    if (user?.role !== "Intern") {
      alert(
        "Only interns can apply for internships. Please register as an intern."
      );
      navigate("/register");
      return;
    }

    navigate(`/intern/apply/${internshipId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const isDeadlineApproaching = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate - now) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Discover Your Next Opportunity
          </h1>
          <p className="text-lg text-gray-600">
            Explore {internships.length} internship opportunities and kickstart
            your career journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IoSearchOutline className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search internships by title, company, or description..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-4">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="deadline">Deadline Soon</option>
                <option value="alphabetical">A-Z</option>
                <option value="stipend">Highest Stipend</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
                >
                  <IoGridOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
                >
                  <IoListOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <select
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  <option value="Remote">Remote</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>

                <select
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>

                <select
                  value={filters.duration}
                  onChange={(e) =>
                    handleFilterChange("duration", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Duration</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                </select>

                <select
                  value={filters.stipendRange}
                  onChange={(e) =>
                    handleFilterChange("stipendRange", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Stipend</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Showing {filteredAndSortedInternships.length} of{" "}
                    {internships.length} internships
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {filteredAndSortedInternships.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No internships found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters to find more
              opportunities.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Grid/List View */}
            <div
              className={`grid gap-6 mb-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {paginatedInternships.map((internship) => (
                <div
                  key={internship._id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 ${
                    viewMode === "list" ? "flex p-6" : "p-6"
                  }`}
                >
                  {/* Deadline Warning */}
                  {isDeadlineApproaching(internship.applicationDeadline) && (
                    <div className="mb-4 flex items-center px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <IoTrendingUpOutline className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-700 font-medium">
                        Deadline approaching!
                      </span>
                    </div>
                  )}

                  <div className={`${viewMode === "list" ? "flex-1" : ""}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {internship.department || "General"}
                          </span>
                          {internship.type && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {internship.type}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                          {internship.title}
                        </h3>
                        {internship.company && (
                          <p className="text-sm text-gray-600 font-medium">
                            {internship.company}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => toggleFavorite(internship.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Add to favorites"
                      >
                        {favorites.has(internship.id) ? (
                          <IoHeart className="w-5 h-5 text-red-500" />
                        ) : (
                          <IoHeartOutline className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {internship.description}
                    </p>

                    {/* Details */}
                    <div
                      className={`space-y-2 mb-6 text-sm ${
                        viewMode === "list"
                          ? "grid grid-cols-2 gap-x-6 gap-y-2"
                          : ""
                      }`}
                    >
                      <div className="flex items-center text-gray-600">
                        <IoLocationOutline className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {internship.location || "Location not specified"}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <IoTimeOutline className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {internship.duration || "Duration not specified"}
                        </span>
                      </div>

                      {internship.stipend && (
                        <div className="flex items-center text-gray-600">
                          <IoCashOutline className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{internship.stipend}</span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-600">
                        <IoCalendarOutline className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          Apply by:{" "}
                          {formatDate(
                            internship.applicationDeadline || internship.applyBy
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Skills/Requirements */}
                    {internship.skills && internship.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {internship.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {internship.skills.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                              +{internship.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className={`${viewMode === "list" ? "ml-6 flex-shrink-0 flex items-center" : ""}`}
                  >
                    <button
                      onClick={() => handleApply(internship.id)}
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {!isAuthenticated ? "Sign Up to Apply" : "Apply Now"}
                      <IoBriefcaseOutline className="ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? "text-blue-600 bg-blue-50 border border-blue-300"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InternshipsPage;
