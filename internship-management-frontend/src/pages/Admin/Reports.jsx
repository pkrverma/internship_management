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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { IoStatsChartOutline } from "react-icons/io5";

// Register Chart.js modules
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
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dateRange, setDateRange] = useState("all");

  const loadReportData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [users, internships, applications, tasks, meetings] =
        await Promise.all([
          getData("users") || [],
          getData("internships") || [],
          getData("applications") || [],
          getData("tasks") || [],
          getData("meetings") || [],
        ]);

      // In a real app, apply date filtering here
      const overview = {
        totalUsers: users.length,
        totalInterns: users.filter((u) => u.role?.toLowerCase() === "intern")
          .length,
        totalMentors: users.filter((u) => u.role?.toLowerCase() === "mentor")
          .length,
        totalInternships: internships.length,
        activeInternships: internships.filter((i) => i.status === "Open")
          .length,
        totalApplications: applications.length,
        totalTasks: tasks.length,
      };

      setReportData((rd) => ({
        ...rd,
        overview,
        applications,
        internships,
        users,
        tasks,
      }));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load reports" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
    const interval = setInterval(() => loadReportData(true), 300000);
    return () => clearInterval(interval);
  }, [loadReportData]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
  };
  const applicationTrendData = useMemo(
    () => ({
      labels: ["Jan", "Feb", "Mar"], // Example data
      datasets: [
        {
          label: "Applications",
          data: [10, 20, 15],
          borderColor: "rgb(59,130,246)",
          fill: true,
        },
      ],
    }),
    []
  );

  if (loading) return <Spinner fullScreen text="Loading reports..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <IoStatsChartOutline /> Reports
      </h1>
      {message.text && (
        <div
          className={`mb-4 p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          Users: {reportData.overview.totalUsers}
        </div>
        <div className="p-4 bg-white rounded shadow">
          Internships: {reportData.overview.totalInternships}
        </div>
        <div className="p-4 bg-white rounded shadow">
          Applications: {reportData.overview.totalApplications}
        </div>
        <div className="p-4 bg-white rounded shadow">
          Tasks: {reportData.overview.totalTasks}
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-4">Application Trends</h2>
        <div className="h-64">
          <Line options={chartOptions} data={applicationTrendData} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
