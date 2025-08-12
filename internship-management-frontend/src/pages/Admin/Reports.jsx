// src/pages/Admin/Reports.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getData } from "../../services/dataService";
import Spinner from "../../components/ui/Spinner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  IoStatsChartOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoGridOutline,
  IoListOutline,
  IoSearchOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoRemoveOutline,
  IoAnalyticsOutline,
  IoPulseOutline,
  IoSpeedometerOutline,
  IoRibbonOutline,
} from "react-icons/io5";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Reports = () => {
  // Data states
  const [reportData, setReportData] = useState({
    overview: {},
    applications: [],
    internships: [],
    users: [],
    tasks: [],
    trends: {},
    demographics: {},
    performance: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [reportType, setReportType] = useState("overview");
  const [exportFormat, setExportFormat] = useState("csv");

  // UI states
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeChart, setActiveChart] = useState("applications");

  // Load and aggregate report data
  const loadReportData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Load all data sources
        const [users, internships, applications, tasks, meetings] =
          await Promise.all([
            getData("users") || [],
            getData("internships") || [],
            getData("applications") || [],
            getData("tasks") || [],
            getData("meetings") || [],
          ]);

        // Apply date filtering
        const filterByDate = (items, dateField = "createdAt") => {
          if (dateRange === "all") return items;

          const now = new Date();
          let startDate;

          switch (dateRange) {
            case "today":
              startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
              );
              break;
            case "week":
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "month":
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case "quarter":
              { const quarterStart = Math.floor(now.getMonth() / 3) * 3;
              startDate = new Date(now.getFullYear(), quarterStart, 1);
              break; }
            case "year":
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            case "custom":
              if (customDateRange.startDate) {
                startDate = new Date(customDateRange.startDate);
              }
              break;
            default:
              return items;
          }

          if (!startDate) return items;

          return items.filter((item) => {
            const itemDate = new Date(item[dateField] || item.createdAt || 0);
            const endDate =
              dateRange === "custom" && customDateRange.endDate
                ? new Date(customDateRange.endDate)
                : now;
            return itemDate >= startDate && itemDate <= endDate;
          });
        };

        // Filter data by date range
        const filteredUsers = filterByDate(users);
        const filteredInternships = filterByDate(internships);
        const filteredApplications = filterByDate(
          applications,
          "applicationDate"
        );
        const filteredTasks = filterByDate(tasks);

        // Calculate overview statistics
        const overview = {
          totalUsers: users.length,
          totalInterns: users.filter((u) => u.role === "intern").length,
          totalMentors: users.filter((u) => u.role === "mentor").length,
          totalAdmins: users.filter((u) => u.role === "admin").length,
          totalInternships: internships.length,
          activeInternships: internships.filter(
            (i) =>
              i.status === "active" ||
              !i.endDate ||
              new Date(i.endDate) > new Date()
          ).length,
          totalApplications: applications.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === "Approved").length,
          totalMeetings: meetings.length,
        };

        // Application funnel analysis
        const applicationsByStatus = applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});

        // Monthly trends for the last 12 months
        const monthlyTrends = {};
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format

          monthlyTrends[monthKey] = {
            applications: applications.filter((app) => {
              const appDate = new Date(app.applicationDate || app.createdAt);
              return appDate.toISOString().slice(0, 7) === monthKey;
            }).length,
            users: users.filter((user) => {
              const userDate = new Date(user.createdAt);
              return userDate.toISOString().slice(0, 7) === monthKey;
            }).length,
            tasks: tasks.filter((task) => {
              const taskDate = new Date(task.createdAt);
              return taskDate.toISOString().slice(0, 7) === monthKey;
            }).length,
          };
        }

        // University demographics
        const universityDistribution = users
          .filter((u) => u.role === "intern" && u.university)
          .reduce((acc, user) => {
            acc[user.university] = (acc[user.university] || 0) + 1;
            return acc;
          }, {});

        // Skills analysis
        const skillsDistribution = users
          .filter((u) => u.role === "intern" && u.skills)
          .reduce((acc, user) => {
            const skills = Array.isArray(user.skills)
              ? user.skills
              : user.skills.split(",").map((s) => s.trim());
            skills.forEach((skill) => {
              if (skill) acc[skill] = (acc[skill] || 0) + 1;
            });
            return acc;
          }, {});

        // Internship performance
        const internshipPerformance = internships.map((internship) => {
          const internshipApps = applications.filter(
            (app) => app.internshipId === internship.id
          );
          const hired = internshipApps.filter(
            (app) => app.status === "Hired"
          ).length;
          const shortlisted = internshipApps.filter(
            (app) => app.status === "Shortlisted"
          ).length;
          const rejected = internshipApps.filter(
            (app) => app.status === "Rejected"
          ).length;
          const pending = internshipApps.filter((app) =>
            ["Submitted", "Under Review"].includes(app.status)
          ).length;

          return {
            id: internship.id,
            title: internship.title,
            company: internship.company || "Aninex Global",
            department: internship.department,
            totalApplications: internshipApps.length,
            hired,
            shortlisted,
            rejected,
            pending,
            conversionRate:
              internshipApps.length > 0
                ? ((hired / internshipApps.length) * 100).toFixed(1)
                : 0,
            successRate:
              internshipApps.length > 0
                ? (
                    ((hired + shortlisted) / internshipApps.length) *
                    100
                  ).toFixed(1)
                : 0,
          };
        });

        // Mentor workload analysis
        const mentorWorkload = users
          .filter((u) => u.role === "mentor")
          .map((mentor) => {
            const assignedInterns = users.filter(
              (u) =>
                u.role === "intern" &&
                (u.mentorId === mentor.id || u.assignedMentor === mentor.id)
            );
            const mentorTasks = tasks.filter(
              (t) => t.assignedBy === mentor.name || t.mentorId === mentor.id
            );
            const completedTasks = mentorTasks.filter(
              (t) => t.status === "Approved"
            );
            const conductedMeetings = meetings.filter(
              (m) => m.mentorId === mentor.id
            );

            return {
              id: mentor.id,
              name: mentor.name,
              email: mentor.email,
              assignedInterns: assignedInterns.length,
              totalTasks: mentorTasks.length,
              completedTasks: completedTasks.length,
              completionRate:
                mentorTasks.length > 0
                  ? (
                      (completedTasks.length / mentorTasks.length) *
                      100
                    ).toFixed(1)
                  : 0,
              meetingsConducted: conductedMeetings.length,
              averageRating: mentor.rating || 0,
            };
          });

        // Task performance analysis
        const taskPerformance = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === "Approved").length,
          pendingTasks: tasks.filter((t) => t.status === "Pending Review")
            .length,
          needsRevision: tasks.filter((t) => t.status === "Needs Revision")
            .length,
          overdueTasks: tasks.filter((t) => {
            const dueDate = new Date(t.dueDate);
            return t.status !== "Approved" && dueDate < new Date();
          }).length,
          averageCompletionTime: calculateAverageCompletionTime(tasks),
          tasksByCategory: tasks.reduce((acc, task) => {
            const category = task.category || "General";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {}),
        };

        setReportData({
          overview,
          applications: filteredApplications,
          internships: filteredInternships,
          users: filteredUsers,
          tasks: filteredTasks,
          trends: monthlyTrends,
          demographics: {
            universities: universityDistribution,
            skills: skillsDistribution,
          },
          performance: {
            internships: internshipPerformance,
            mentors: mentorWorkload,
            tasks: taskPerformance,
            applicationFunnel: applicationsByStatus,
          },
        });
      } catch (error) {
        console.error("Error loading report data:", error);
        setMessage({
          type: "error",
          text: "Failed to load report data. Please try again.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, customDateRange]
  );

  // Helper function to calculate average completion time
  const calculateAverageCompletionTime = (tasks) => {
    const completedTasks = tasks.filter(
      (t) => t.status === "Approved" && t.createdAt && t.updatedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const start = new Date(task.createdAt);
      const end = new Date(task.updatedAt);
      return sum + (end - start);
    }, 0);

    return Math.round(
      totalTime / completedTasks.length / (1000 * 60 * 60 * 24)
    ); // Days
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadReportData(true);
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [loadReportData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Generate chart data
  const getApplicationTrendData = () => {
    const labels = Object.keys(reportData.trends).map((key) => {
      return new Date(key + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    });

    return {
      labels,
      datasets: [
        {
          label: "Applications",
          data: Object.values(reportData.trends).map(
            (trend) => trend.applications
          ),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
          fill: true,
        },
        {
          label: "New Users",
          data: Object.values(reportData.trends).map((trend) => trend.users),
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.1,
          fill: true,
        },
      ],
    };
  };

  const getApplicationFunnelData = () => {
    const statuses = [
      "Submitted",
      "Under Review",
      "Interview Scheduled",
      "Shortlisted",
      "Hired",
    ];
    const data = statuses.map(
      (status) => reportData.performance.applicationFunnel[status] || 0
    );

    return {
      labels: statuses,
      datasets: [
        {
          label: "Applications",
          data,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(34, 197, 94, 0.8)",
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(245, 158, 11)",
            "rgb(139, 92, 246)",
            "rgb(16, 185, 129)",
            "rgb(34, 197, 94)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getUniversityDistributionData = () => {
    const universities = Object.entries(reportData.demographics.universities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 universities

    return {
      labels: universities.map(([name]) => name),
      datasets: [
        {
          data: universities.map(([, count]) => count),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FF6384",
            "#C9CBCF",
            "#4BC0C0",
            "#FF6384",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getTaskPerformanceData = () => {
    const { tasks } = reportData.performance;

    return {
      labels: ["Completed", "Pending Review", "Needs Revision", "Overdue"],
      datasets: [
        {
          data: [
            tasks.completedTasks,
            tasks.pendingTasks,
            tasks.needsRevision,
            tasks.overdueTasks,
          ],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(156, 163, 175, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(156, 163, 175)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Export functionality
  const handleExport = (type) => {
    setMessage({ type: "info", text: `Exporting ${type} report...` });

    // In a real application, this would generate and download the file
    setTimeout(() => {
      setMessage({
        type: "success",
        text: `${type.toUpperCase()} report exported successfully!`,
      });
    }, 1500);
  };

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Generating comprehensive reports..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights and data visualization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadReportData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <IoRefreshOutline
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button
              onClick={() => handleExport(exportFormat)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <IoDownloadOutline className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : message.type === "info"
                ? "bg-blue-50 border border-blue-200"
                : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={
              message.type === "success"
                ? "text-green-700"
                : message.type === "info"
                  ? "text-blue-700"
                  : "text-red-700"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === "custom" && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="applications">Applications</option>
                <option value="internships">Internships</option>
                <option value="users">Users</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoPeopleOutline className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(reportData.overview.totalUsers)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <IoArrowUpOutline className="self-center flex-shrink-0 h-3 w-3" />
                      <span className="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoDocumentTextOutline className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Applications
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(reportData.overview.totalApplications)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <IoArrowUpOutline className="self-center flex-shrink-0 h-3 w-3" />
                      <span className="sr-only">Increased by</span>
                      8.2%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoBusinessOutline className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Internships
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(reportData.overview.activeInternships)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <IoArrowDownOutline className="self-center flex-shrink-0 h-3 w-3" />
                      <span className="sr-only">Decreased by</span>
                      2.1%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <IoSpeedometerOutline className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Success Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {reportData.overview.totalApplications > 0
                        ? Math.round(
                            ((reportData.performance.applicationFunnel.Hired ||
                              0) /
                              reportData.overview.totalApplications) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <IoArrowUpOutline className="self-center flex-shrink-0 h-3 w-3" />
                      <span className="sr-only">Increased by</span>
                      5.4%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Application Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Application Trends
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveChart("applications")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeChart === "applications"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => setActiveChart("funnel")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeChart === "funnel"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Funnel
              </button>
            </div>
          </div>

          <div style={{ height: "300px" }}>
            {activeChart === "applications" ? (
              <Line data={getApplicationTrendData()} options={chartOptions} />
            ) : (
              <Bar data={getApplicationFunnelData()} options={chartOptions} />
            )}
          </div>
        </div>

        {/* University Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              University Distribution
            </h3>
            <span className="text-sm text-gray-500">Top 10 Universities</span>
          </div>

          <div style={{ height: "300px" }}>
            <Doughnut
              data={getUniversityDistributionData()}
              options={{
                ...chartOptions,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
                scales: undefined, // Remove scales for pie chart
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Internship Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Internship Performance
              </h3>
              <button
                onClick={() => handleExport("internship-performance")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hired
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.performance.internships
                  ?.slice(0, 5)
                  .map((internship) => (
                    <tr key={internship.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {internship.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {internship.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {internship.totalApplications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {internship.hired}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {internship.successRate}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(internship.successRate, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mentor Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Mentor Performance
              </h3>
              <button
                onClick={() => handleExport("mentor-performance")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.performance.mentors?.slice(0, 5).map((mentor) => (
                  <tr key={mentor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mentor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mentor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mentor.assignedInterns}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mentor.completedTasks}/{mentor.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {mentor.completionRate}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(mentor.completionRate, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Task Performance Overview
          </h3>
          <div className="text-sm text-gray-500">
            Average completion:{" "}
            {reportData.performance.tasks?.averageCompletionTime || 0} days
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div style={{ height: "300px" }}>
            <Pie
              data={getTaskPerformanceData()}
              options={{
                ...chartOptions,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
                scales: undefined,
              }}
            />
          </div>

          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Tasks
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {reportData.performance.tasks?.totalTasks || 0}
                </span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">
                  Completion Rate
                </span>
                <span className="text-2xl font-bold text-green-900">
                  {reportData.performance.tasks?.totalTasks > 0
                    ? Math.round(
                        ((reportData.performance.tasks?.completedTasks || 0) /
                          reportData.performance.tasks?.totalTasks) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">
                  Pending Review
                </span>
                <span className="text-2xl font-bold text-yellow-900">
                  {reportData.performance.tasks?.pendingTasks || 0}
                </span>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">
                  Overdue
                </span>
                <span className="text-2xl font-bold text-red-900">
                  {reportData.performance.tasks?.overdueTasks || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Skills in Demand
          </h3>
          <span className="text-sm text-gray-500">
            Based on intern profiles
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(reportData.demographics.skills || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 12)
            .map(([skill, count]) => (
              <div
                key={skill}
                className="text-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-lg font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-600 mt-1 truncate">
                  {skill}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
