import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { getInternsByMentorId } from "../../services/mockDataService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoTrendingUpOutline,
  IoStatsChartOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoStarOutline,
  IoTrophyOutline,
  IoRocketOutline,
  IoSparklesOutline,
  IoTargetOutline,
  IoFlagOutline,
  IoBookmarkOutline,
  IoClipboardOutline,
  IoDocumentTextOutline,
  IoAnalyticsOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoGridOutline,
  IoListOutline,
  IoBarChartOutline,
  IoLineChartOutline,
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoShareOutline,
  IoRefreshOutline,
  IoSettingsOutline,
  IoNotificationsOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoPlayOutline,
  IoPauseOutline,
  IoStopOutline,
  IoSyncOutline,
  IoCloudUploadOutline,
  IoFolderOpenOutline,
  IoAlarmOutline,
  IoConstructOutline,
  IoBulbOutline,
  IoSchoolOutline,
  IoBusinessOutline,
  IoCodeSlashOutline,
  IoLibraryOutline,
  IoGitBranchOutline,
  IoFlashOutline,
  IoHeartOutline,
  IoCafeOutline,
  IoGameControllerOutline,
  IoMusicalNotesOutline,
  IoColorPaletteOutline,
  IoEllipsisVerticalOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoChevronForwardOutline,
  IoChevronBackOutline,
  IoCaretUpOutline,
  IoCaretDownOutline,
} from "react-icons/io5";

const PROGRESS_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  REVIEW_PENDING: "review_pending",
  COMPLETED: "completed",
  BLOCKED: "blocked",
  OVERDUE: "overdue",
};

const TASK_TYPES = {
  ASSIGNMENT: "assignment",
  PROJECT: "project",
  LEARNING: "learning",
  ASSESSMENT: "assessment",
  MILESTONE: "milestone",
};

const SKILL_CATEGORIES = {
  TECHNICAL: "technical",
  SOFT_SKILLS: "soft_skills",
  DOMAIN: "domain",
  TOOLS: "tools",
  LEADERSHIP: "leadership",
};

const PERFORMANCE_METRICS = {
  TASK_COMPLETION_RATE: "task_completion_rate",
  AVERAGE_SCORE: "average_score",
  TIME_EFFICIENCY: "time_efficiency",
  SKILL_GROWTH: "skill_growth",
  ENGAGEMENT_LEVEL: "engagement_level",
  MENTOR_SATISFACTION: "mentor_satisfaction",
};

const VIEW_MODES = {
  OVERVIEW: "overview",
  DETAILED: "detailed",
  ANALYTICS: "analytics",
  TIMELINE: "timeline",
  COMPARISON: "comparison",
};

const TIME_PERIODS = {
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
  YEAR: "year",
  ALL_TIME: "all_time",
};

const GOAL_TYPES = {
  SKILL_DEVELOPMENT: "skill_development",
  PROJECT_COMPLETION: "project_completion",
  LEARNING_OBJECTIVE: "learning_objective",
  PERFORMANCE_TARGET: "performance_target",
  CAREER_MILESTONE: "career_milestone",
};

const MentorTrackProgress = () => {
  const { user } = useAuth();

  // Core data state
  const [interns, setInterns] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [tasks, setTasks] = useState({});
  const [goals, setGoals] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState(VIEW_MODES.OVERVIEW);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    TIME_PERIODS.MONTH
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("progress_desc");

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form states
  const [goalForm, setGoalForm] = useState({
    internId: "",
    title: "",
    description: "",
    type: GOAL_TYPES.SKILL_DEVELOPMENT,
    targetDate: "",
    targetValue: "",
    currentValue: 0,
    priority: "medium",
    category: "",
    metrics: [],
  });

  const [taskForm, setTaskForm] = useState({
    internId: "",
    title: "",
    description: "",
    type: TASK_TYPES.ASSIGNMENT,
    dueDate: "",
    estimatedHours: 0,
    priority: "medium",
    skills: [],
    resources: [],
  });

  const [evaluationForm, setEvaluationForm] = useState({
    internId: "",
    period: "",
    overallRating: 5,
    technicalSkills: 5,
    softSkills: 5,
    communication: 5,
    initiative: 5,
    teamwork: 5,
    strengths: "",
    areasForImprovement: "",
    recommendations: "",
    goals: [],
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    overallProgress: 0,
    completionRate: 0,
    avgScore: 0,
    skillGrowth: 0,
    engagementLevel: 0,
    timeEfficiency: 0,
    trendsData: [],
    skillsBreakdown: {},
    performanceComparison: {},
  });

  // Messages and confirmations
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Load initial data
  useEffect(() => {
    loadProgressData();
  }, [user]);

  // Calculate analytics when data changes
  useEffect(() => {
    calculateAnalytics();
  }, [interns, progressData, tasks, goals, evaluations, selectedTimePeriod]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // Load assigned interns
      const internsData = await getInternsByMentorId(user.id);
      setInterns(internsData);

      // Load progress data for each intern
      const progressPromises = internsData.map(async (intern) => {
        const [progress, internTasks, internGoals, internEvaluations] =
          await Promise.all([
            getData(`progress_${intern.id}`) ||
              generateMockProgressData(intern.id),
            getData(`tasks_${intern.id}`) || generateMockTasksData(intern.id),
            getData(`goals_${intern.id}`) || generateMockGoalsData(intern.id),
            getData(`evaluations_${intern.id}`) ||
              generateMockEvaluationsData(intern.id),
          ]);

        return {
          internId: intern.id,
          progress,
          tasks: internTasks,
          goals: internGoals,
          evaluations: internEvaluations,
        };
      });

      const allProgressData = await Promise.all(progressPromises);

      // Organize data by intern ID
      const progressByIntern = {};
      const tasksByIntern = {};
      const goalsByIntern = {};
      const evaluationsByIntern = {};

      allProgressData.forEach(
        ({ internId, progress, tasks, goals, evaluations }) => {
          progressByIntern[internId] = progress;
          tasksByIntern[internId] = tasks;
          goalsByIntern[internId] = goals;
          evaluationsByIntern[internId] = evaluations;
        }
      );

      setProgressData(progressByIntern);
      setTasks(tasksByIntern);
      setGoals(goalsByIntern);
      setEvaluations(evaluationsByIntern);

      // Set first intern as selected if none selected
      if (internsData.length > 0 && !selectedIntern) {
        setSelectedIntern(internsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
      setMessage({ type: "error", text: "Failed to load progress data" });
    } finally {
      setLoading(false);
    }
  };

  const generateMockProgressData = (internId) => {
    // Generate realistic mock progress data
    return {
      overallProgress: Math.floor(Math.random() * 40) + 30, // 30-70%
      skillsProgress: {
        technical: Math.floor(Math.random() * 30) + 40,
        communication: Math.floor(Math.random() * 25) + 50,
        problemSolving: Math.floor(Math.random() * 35) + 35,
        teamwork: Math.floor(Math.random() * 20) + 60,
        leadership: Math.floor(Math.random() * 40) + 20,
      },
      weeklyProgress: Array.from({ length: 12 }, (_, i) => ({
        week: i + 1,
        progress: Math.floor(Math.random() * 20) + i * 5 + 10,
        tasksCompleted: Math.floor(Math.random() * 8) + 2,
        hoursWorked: Math.floor(Math.random() * 15) + 25,
      })),
      monthlyScores: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(
          Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", { month: "short" }),
        score: Math.floor(Math.random() * 2) + 3.5 + i * 0.2,
        tasksCompleted: Math.floor(Math.random() * 15) + 10,
        skillsImproved: Math.floor(Math.random() * 5) + 2,
      })),
      recentActivities: [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          activity: "Completed React project",
          type: "task_completion",
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          activity: "Submitted code review",
          type: "submission",
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          activity: "Achieved JavaScript milestone",
          type: "milestone",
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          activity: "Started Node.js learning path",
          type: "learning_start",
        },
      ],
    };
  };

  const generateMockTasksData = (internId) => {
    const taskTypes = Object.values(TASK_TYPES);
    const statuses = Object.values(PROGRESS_STATUS);

    return Array.from({ length: 15 }, (_, i) => ({
      id: `task_${internId}_${i}`,
      title: `Task ${i + 1}: ${["Build React Component", "API Integration", "Database Design", "Testing Implementation", "Documentation"][i % 5]}`,
      description: `Detailed description for task ${i + 1}`,
      type: taskTypes[i % taskTypes.length],
      status: statuses[i % statuses.length],
      priority: ["high", "medium", "low"][i % 3],
      assignedDate: new Date(
        Date.now() - (15 - i) * 24 * 60 * 60 * 1000
      ).toISOString(),
      dueDate: new Date(
        Date.now() + (i - 7) * 24 * 60 * 60 * 1000
      ).toISOString(),
      completedDate:
        i < 8
          ? new Date(Date.now() - (8 - i) * 24 * 60 * 60 * 1000).toISOString()
          : null,
      estimatedHours: Math.floor(Math.random() * 20) + 5,
      actualHours: i < 8 ? Math.floor(Math.random() * 25) + 3 : 0,
      score: i < 8 ? Math.floor(Math.random() * 2) + 3.5 : null,
      feedback: i < 8 ? "Great work on this task!" : null,
      skills: ["JavaScript", "React", "Node.js", "CSS", "Testing"][i % 5],
    }));
  };

  const generateMockGoalsData = (internId) => {
    const goalTypes = Object.values(GOAL_TYPES);

    return Array.from({ length: 8 }, (_, i) => ({
      id: `goal_${internId}_${i}`,
      title: `Goal ${i + 1}: ${["Master React Hooks", "Complete Full Stack Project", "Improve Code Quality", "Learn Testing", "Build Portfolio"][i % 5]}`,
      description: `Detailed description for goal ${i + 1}`,
      type: goalTypes[i % goalTypes.length],
      targetDate: new Date(
        Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000
      ).toISOString(),
      priority: ["high", "medium", "low"][i % 3],
      targetValue: 100,
      currentValue: Math.floor(Math.random() * 80) + 10,
      category: ["Frontend", "Backend", "DevOps", "Soft Skills", "Tools"][
        i % 5
      ],
      createdDate: new Date(
        Date.now() - (30 - i * 2) * 24 * 60 * 60 * 1000
      ).toISOString(),
      milestones: [
        {
          name: "Phase 1",
          completed: true,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: "Phase 2",
          completed: i < 4,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { name: "Phase 3", completed: false, date: null },
      ],
    }));
  };

  const generateMockEvaluationsData = (internId) => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: `eval_${internId}_${i}`,
      period: `${["Q1", "Q2", "Q3", "Q4"][i]} 2025`,
      date: new Date(
        Date.now() - (120 - i * 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      overallRating: Math.floor(Math.random() * 2) + 3.5,
      ratings: {
        technicalSkills: Math.floor(Math.random() * 2) + 3.5,
        softSkills: Math.floor(Math.random() * 2) + 3.5,
        communication: Math.floor(Math.random() * 2) + 3.8,
        initiative: Math.floor(Math.random() * 2) + 3.2,
        teamwork: Math.floor(Math.random() * 2) + 4.0,
      },
      strengths: [
        "Quick learner",
        "Great problem solver",
        "Excellent communication",
        "Team player",
      ][i],
      areasForImprovement: [
        "Time management",
        "Code optimization",
        "Testing practices",
        "Documentation",
      ][i],
      recommendations:
        "Continue focusing on technical skill development while building project experience.",
      goals: [],
    }));
  };

  const calculateAnalytics = () => {
    if (interns.length === 0) return;

    const currentPeriodData = getCurrentPeriodData();

    // Calculate overall metrics
    let totalProgress = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let totalScore = 0;
    let scoredTasks = 0;
    let totalSkillGrowth = 0;
    let totalEngagement = 0;

    interns.forEach((intern) => {
      const internProgress = progressData[intern.id];
      const internTasks = tasks[intern.id] || [];

      if (internProgress) {
        totalProgress += internProgress.overallProgress || 0;

        internTasks.forEach((task) => {
          totalTasks++;
          if (task.status === PROGRESS_STATUS.COMPLETED) {
            completedTasks++;
          }
          if (task.score) {
            totalScore += task.score;
            scoredTasks++;
          }
        });

        // Calculate skill growth and engagement (mock calculation)
        totalSkillGrowth += Math.random() * 20 + 60; // 60-80%
        totalEngagement += Math.random() * 25 + 70; // 70-95%
      }
    });

    const internCount = interns.length;
    const overallProgress = internCount > 0 ? totalProgress / internCount : 0;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const avgScore = scoredTasks > 0 ? totalScore / scoredTasks : 0;
    const skillGrowth = internCount > 0 ? totalSkillGrowth / internCount : 0;
    const engagementLevel = internCount > 0 ? totalEngagement / internCount : 0;
    const timeEfficiency = Math.random() * 20 + 75; // Mock calculation

    // Generate trends data
    const trendsData = generateTrendsData();
    const skillsBreakdown = generateSkillsBreakdown();
    const performanceComparison = generatePerformanceComparison();

    setAnalytics({
      overallProgress,
      completionRate,
      avgScore,
      skillGrowth,
      engagementLevel,
      timeEfficiency,
      trendsData,
      skillsBreakdown,
      performanceComparison,
    });
  };

  const getCurrentPeriodData = () => {
    const now = new Date();
    const periodStart = new Date();

    switch (selectedTimePeriod) {
      case TIME_PERIODS.WEEK:
        periodStart.setDate(now.getDate() - 7);
        break;
      case TIME_PERIODS.MONTH:
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case TIME_PERIODS.QUARTER:
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case TIME_PERIODS.YEAR:
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setFullYear(2020); // All time
    }

    return { start: periodStart, end: now };
  };

  const generateTrendsData = () => {
    return Array.from({ length: 8 }, (_, i) => ({
      period: new Date(
        Date.now() - (7 - i) * 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      progress: Math.floor(Math.random() * 15) + 65 + i * 2,
      tasks: Math.floor(Math.random() * 8) + 12,
      engagement: Math.floor(Math.random() * 12) + 78 + i,
    }));
  };

  const generateSkillsBreakdown = () => {
    return {
      technical: Math.floor(Math.random() * 15) + 75,
      communication: Math.floor(Math.random() * 20) + 70,
      problemSolving: Math.floor(Math.random() * 18) + 72,
      teamwork: Math.floor(Math.random() * 12) + 80,
      leadership: Math.floor(Math.random() * 25) + 60,
      timeManagement: Math.floor(Math.random() * 22) + 68,
    };
  };

  const generatePerformanceComparison = () => {
    return {
      current: {
        tasksCompleted: Math.floor(Math.random() * 15) + 25,
        avgScore: Math.random() * 1 + 3.8,
        hoursWorked: Math.floor(Math.random() * 20) + 120,
      },
      previous: {
        tasksCompleted: Math.floor(Math.random() * 12) + 20,
        avgScore: Math.random() * 0.8 + 3.5,
        hoursWorked: Math.floor(Math.random() * 25) + 100,
      },
    };
  };

  const handleCreateGoal = async () => {
    try {
      const newGoal = {
        id: `goal_${Date.now()}`,
        ...goalForm,
        createdDate: new Date().toISOString(),
        currentValue: 0,
        milestones: [],
      };

      const internGoals = goals[goalForm.internId] || [];
      const updatedGoals = [...internGoals, newGoal];

      await saveData(`goals_${goalForm.internId}`, updatedGoals);
      setGoals((prev) => ({ ...prev, [goalForm.internId]: updatedGoals }));

      setShowGoalModal(false);
      resetGoalForm();
      setMessage({ type: "success", text: "Goal created successfully!" });
    } catch (error) {
      console.error("Failed to create goal:", error);
      setMessage({ type: "error", text: "Failed to create goal" });
    }
  };

  const handleCreateTask = async () => {
    try {
      const newTask = {
        id: `task_${Date.now()}`,
        ...taskForm,
        status: PROGRESS_STATUS.NOT_STARTED,
        assignedDate: new Date().toISOString(),
        actualHours: 0,
        score: null,
        feedback: null,
      };

      const internTasks = tasks[taskForm.internId] || [];
      const updatedTasks = [...internTasks, newTask];

      await saveData(`tasks_${taskForm.internId}`, updatedTasks);
      setTasks((prev) => ({ ...prev, [taskForm.internId]: updatedTasks }));

      setShowTaskModal(false);
      resetTaskForm();
      setMessage({ type: "success", text: "Task assigned successfully!" });
    } catch (error) {
      console.error("Failed to create task:", error);
      setMessage({ type: "error", text: "Failed to assign task" });
    }
  };

  const handleCreateEvaluation = async () => {
    try {
      const newEvaluation = {
        id: `eval_${Date.now()}`,
        ...evaluationForm,
        date: new Date().toISOString(),
        ratings: {
          technicalSkills: evaluationForm.technicalSkills,
          softSkills: evaluationForm.softSkills,
          communication: evaluationForm.communication,
          initiative: evaluationForm.initiative,
          teamwork: evaluationForm.teamwork,
        },
      };

      const internEvaluations = evaluations[evaluationForm.internId] || [];
      const updatedEvaluations = [...internEvaluations, newEvaluation];

      await saveData(
        `evaluations_${evaluationForm.internId}`,
        updatedEvaluations
      );
      setEvaluations((prev) => ({
        ...prev,
        [evaluationForm.internId]: updatedEvaluations,
      }));

      setShowEvaluationModal(false);
      resetEvaluationForm();
      setMessage({
        type: "success",
        text: "Evaluation submitted successfully!",
      });
    } catch (error) {
      console.error("Failed to create evaluation:", error);
      setMessage({ type: "error", text: "Failed to submit evaluation" });
    }
  };

  const resetGoalForm = () => {
    setGoalForm({
      internId: "",
      title: "",
      description: "",
      type: GOAL_TYPES.SKILL_DEVELOPMENT,
      targetDate: "",
      targetValue: "",
      currentValue: 0,
      priority: "medium",
      category: "",
      metrics: [],
    });
  };

  const resetTaskForm = () => {
    setTaskForm({
      internId: "",
      title: "",
      description: "",
      type: TASK_TYPES.ASSIGNMENT,
      dueDate: "",
      estimatedHours: 0,
      priority: "medium",
      skills: [],
      resources: [],
    });
  };

  const resetEvaluationForm = () => {
    setEvaluationForm({
      internId: "",
      period: "",
      overallRating: 5,
      technicalSkills: 5,
      softSkills: 5,
      communication: 5,
      initiative: 5,
      teamwork: 5,
      strengths: "",
      areasForImprovement: "",
      recommendations: "",
      goals: [],
    });
  };

  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      const matchesSearch =
        !searchQuery ||
        intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.email.toLowerCase().includes(searchQuery.toLowerCase());

      const internProgress = progressData[intern.id];
      let matchesStatus = true;

      if (filterStatus !== "all" && internProgress) {
        switch (filterStatus) {
          case "excellent":
            matchesStatus = internProgress.overallProgress >= 80;
            break;
          case "good":
            matchesStatus =
              internProgress.overallProgress >= 60 &&
              internProgress.overallProgress < 80;
            break;
          case "needs_improvement":
            matchesStatus = internProgress.overallProgress < 60;
            break;
          default:
            matchesStatus = true;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [interns, searchQuery, filterStatus, progressData]);

  const getProgressColor = (progress) => {
    if (progress >= 80) return "text-green-600 bg-green-100";
    if (progress >= 60) return "text-blue-600 bg-blue-100";
    if (progress >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PROGRESS_STATUS.COMPLETED:
        return <IoCheckmarkCircleOutline className="w-4 h-4 text-green-600" />;
      case PROGRESS_STATUS.IN_PROGRESS:
        return <IoPlayOutline className="w-4 h-4 text-blue-600" />;
      case PROGRESS_STATUS.REVIEW_PENDING:
        return <IoEyeOutline className="w-4 h-4 text-orange-600" />;
      case PROGRESS_STATUS.BLOCKED:
        return <IoWarningOutline className="w-4 h-4 text-red-600" />;
      case PROGRESS_STATUS.OVERDUE:
        return <IoAlarmOutline className="w-4 h-4 text-red-600" />;
      default:
        return <IoTimeOutline className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Overall Progress
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.overallProgress.toFixed(1)}%
              </p>
            </div>
            <IoTrendingUpOutline className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Task Completion
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.completionRate.toFixed(1)}%
              </p>
            </div>
            <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.avgScore.toFixed(1)}/5
              </p>
            </div>
            <IoStarOutline className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <IoStarOutline
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(analytics.avgScore) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Skill Growth</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.skillGrowth.toFixed(1)}%
              </p>
            </div>
            <IoRocketOutline className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Engagement Level
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.engagementLevel.toFixed(1)}%
              </p>
            </div>
            <IoHeartOutline className="w-8 h-8 text-pink-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Time Efficiency
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.timeEfficiency.toFixed(1)}%
              </p>
            </div>
            <IoFlashOutline className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Interns Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterns.map((intern) => {
          const internProgress = progressData[intern.id];
          const internTasks = tasks[intern.id] || [];
          const recentTasks = internTasks.slice(0, 3);

          return (
            <div
              key={intern.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedIntern(intern.id)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <ProfileAvatar user={intern} size="md" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{intern.name}</h3>
                  <p className="text-sm text-gray-500">{intern.email}</p>
                </div>
              </div>

              {internProgress && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Overall Progress
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(internProgress.overallProgress)}`}
                      >
                        {internProgress.overallProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${internProgress.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Recent Tasks
                    </h4>
                    {recentTasks.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No tasks assigned yet
                      </p>
                    ) : (
                      recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600 truncate">
                            {task.title}
                          </span>
                          {getStatusIcon(task.status)}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {
                    internTasks.filter(
                      (t) => t.status === PROGRESS_STATUS.COMPLETED
                    ).length
                  }{" "}
                  tasks completed
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIntern(intern.id);
                    setViewMode(VIEW_MODES.DETAILED);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDetailedTab = () => {
    if (!selectedIntern) {
      return (
        <div className="text-center py-12">
          <IoPeopleOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select an Intern
          </h3>
          <p className="text-gray-500">
            Choose an intern from the overview to view detailed progress
          </p>
        </div>
      );
    }

    const intern = interns.find((i) => i.id === selectedIntern);
    const internProgress = progressData[selectedIntern];
    const internTasks = tasks[selectedIntern] || [];
    const internGoals = goals[selectedIntern] || [];
    const internEvaluations = evaluations[selectedIntern] || [];

    if (!intern || !internProgress) {
      return <div className="text-center py-12">Loading intern data...</div>;
    }

    return (
      <div className="space-y-8">
        {/* Intern Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ProfileAvatar user={intern} size="lg" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {intern.name}
                </h2>
                <p className="text-gray-600">{intern.email}</p>
                <p className="text-sm text-gray-500">{intern.university}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setGoalForm((prev) => ({
                    ...prev,
                    internId: selectedIntern,
                  }));
                  setShowGoalModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <IoTargetOutline className="w-4 h-4 mr-2" />
                Set Goal
              </button>

              <button
                onClick={() => {
                  setTaskForm((prev) => ({
                    ...prev,
                    internId: selectedIntern,
                  }));
                  setShowTaskModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <IoAddOutline className="w-4 h-4 mr-2" />
                Assign Task
              </button>

              <button
                onClick={() => {
                  setEvaluationForm((prev) => ({
                    ...prev,
                    internId: selectedIntern,
                  }));
                  setShowEvaluationModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
              >
                <IoStarOutline className="w-4 h-4 mr-2" />
                Evaluate
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {internProgress.overallProgress}%
              </div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {
                  internTasks.filter(
                    (t) => t.status === PROGRESS_STATUS.COMPLETED
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500">Completed Tasks</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {internGoals.length}
              </div>
              <div className="text-sm text-gray-500">Active Goals</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {internEvaluations.length > 0
                  ? internEvaluations[
                      internEvaluations.length - 1
                    ].overallRating.toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-sm text-gray-500">Latest Rating</div>
            </div>
          </div>
        </div>

        {/* Skills Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Skills Progress
          </h3>
          <div className="space-y-4">
            {Object.entries(internProgress.skillsProgress).map(
              ([skill, progress]) => (
                <div key={skill}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {skill.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Tasks
            </h3>
            <button
              onClick={() => {
                setTaskForm((prev) => ({ ...prev, internId: selectedIntern }));
                setShowTaskModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Assign New Task
            </button>
          </div>

          <div className="space-y-4">
            {internTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <span className="text-sm text-gray-500 capitalize">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Due: {formatDate(task.dueDate)}</span>
                  <span>Priority: {task.priority}</span>
                  {task.score && (
                    <span className="text-yellow-600">
                      Score: {task.score}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Goals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Goals
            </h3>
            <button
              onClick={() => {
                setGoalForm((prev) => ({ ...prev, internId: selectedIntern }));
                setShowGoalModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Set New Goal
            </button>
          </div>

          <div className="space-y-4">
            {internGoals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      goal.priority === "high"
                        ? "text-red-600 bg-red-100"
                        : goal.priority === "medium"
                          ? "text-yellow-600 bg-yellow-100"
                          : "text-green-600 bg-green-100"
                    }`}
                  >
                    {goal.priority}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm font-medium">
                      {goal.currentValue}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.currentValue}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Target: {formatDate(goal.targetDate)}</span>
                  <span>Category: {goal.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Trends
        </h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <IoBarChartOutline className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">
              Interactive charts would be rendered here
            </p>
          </div>
        </div>
      </div>

      {/* Skills Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Skills Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analytics.skillsBreakdown).map(([skill, value]) => (
            <div key={skill} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {skill.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-sm text-gray-500">{value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analytics.performanceComparison.current.tasksCompleted}
            </div>
            <div className="text-sm text-gray-500">Current Period</div>
            <div className="text-sm text-green-600">
              +
              {analytics.performanceComparison.current.tasksCompleted -
                analytics.performanceComparison.previous.tasksCompleted}{" "}
              tasks
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analytics.performanceComparison.current.avgScore.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Average Score</div>
            <div className="text-sm text-green-600">
              +
              {(
                analytics.performanceComparison.current.avgScore -
                analytics.performanceComparison.previous.avgScore
              ).toFixed(1)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {analytics.performanceComparison.current.hoursWorked}
            </div>
            <div className="text-sm text-gray-500">Hours Worked</div>
            <div className="text-sm text-green-600">
              +
              {analytics.performanceComparison.current.hoursWorked -
                analytics.performanceComparison.previous.hoursWorked}
              h
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading progress data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <IoTrendingUpOutline className="mr-3" />
            Track Intern Progress
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor performance, track goals, and evaluate intern development
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={TIME_PERIODS.WEEK}>This Week</option>
            <option value={TIME_PERIODS.MONTH}>This Month</option>
            <option value={TIME_PERIODS.QUARTER}>This Quarter</option>
            <option value={TIME_PERIODS.YEAR}>This Year</option>
            <option value={TIME_PERIODS.ALL_TIME}>All Time</option>
          </select>

          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoDownloadOutline className="w-4 h-4 mr-2" />
            Export Report
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
          <div className="flex items-center">
            {message.type === "success" ? (
              <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <IoWarningOutline className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoSearchOutline className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interns by name or email..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Performance Levels</option>
              <option value="excellent">Excellent (80%+)</option>
              <option value="good">Good (60-79%)</option>
              <option value="needs_improvement">
                Needs Improvement (&lt;60%)
              </option>
            </select>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode(VIEW_MODES.OVERVIEW)}
                className={`px-4 py-2 text-sm font-medium ${viewMode === VIEW_MODES.OVERVIEW ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-l-lg transition-colors`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.DETAILED)}
                className={`px-4 py-2 text-sm font-medium ${viewMode === VIEW_MODES.DETAILED ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} transition-colors`}
              >
                Detailed
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.ANALYTICS)}
                className={`px-4 py-2 text-sm font-medium ${viewMode === VIEW_MODES.ANALYTICS ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"} rounded-r-lg transition-colors`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {viewMode === VIEW_MODES.OVERVIEW && renderOverviewTab()}
        {viewMode === VIEW_MODES.DETAILED && renderDetailedTab()}
        {viewMode === VIEW_MODES.ANALYTICS && renderAnalyticsTab()}
      </div>

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Goal
              </h3>
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  resetGoalForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Master React Hooks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Type
                  </label>
                  <select
                    value={goalForm.type}
                    onChange={(e) =>
                      setGoalForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(GOAL_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        targetDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) =>
                    setGoalForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what the intern should achieve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={goalForm.category}
                  onChange={(e) =>
                    setGoalForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Frontend Development, Soft Skills"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  resetGoalForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={!goalForm.title || !goalForm.targetDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Assign New Task
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Build React Component"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Type
                  </label>
                  <select
                    value={taskForm.type}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(TASK_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        estimatedHours: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide detailed instructions for the task..."
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={
                  !taskForm.title || !taskForm.dueDate || !taskForm.description
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Performance Evaluation
              </h3>
              <button
                onClick={() => {
                  setShowEvaluationModal(false);
                  resetEvaluationForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Period *
                  </label>
                  <input
                    type="text"
                    value={evaluationForm.period}
                    onChange={(e) =>
                      setEvaluationForm((prev) => ({
                        ...prev,
                        period: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q1 2025, January 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating *
                  </label>
                  <select
                    value={evaluationForm.overallRating}
                    onChange={(e) =>
                      setEvaluationForm((prev) => ({
                        ...prev,
                        overallRating: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}/5 -{" "}
                        {rating <= 2
                          ? "Needs Improvement"
                          : rating <= 3
                            ? "Meets Expectations"
                            : rating <= 4
                              ? "Exceeds Expectations"
                              : "Outstanding"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "technicalSkills", label: "Technical Skills" },
                  { key: "softSkills", label: "Soft Skills" },
                  { key: "communication", label: "Communication" },
                  { key: "initiative", label: "Initiative" },
                  { key: "teamwork", label: "Teamwork" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}
                    </label>
                    <select
                      value={evaluationForm[key]}
                      onChange={(e) =>
                        setEvaluationForm((prev) => ({
                          ...prev,
                          [key]: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}/5
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Strengths
                </label>
                <textarea
                  value={evaluationForm.strengths}
                  onChange={(e) =>
                    setEvaluationForm((prev) => ({
                      ...prev,
                      strengths: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Highlight the intern's main strengths and accomplishments..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Areas for Improvement
                </label>
                <textarea
                  value={evaluationForm.areasForImprovement}
                  onChange={(e) =>
                    setEvaluationForm((prev) => ({
                      ...prev,
                      areasForImprovement: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Identify specific areas where the intern can improve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations & Next Steps
                </label>
                <textarea
                  value={evaluationForm.recommendations}
                  onChange={(e) =>
                    setEvaluationForm((prev) => ({
                      ...prev,
                      recommendations: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide actionable recommendations for future development..."
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEvaluationModal(false);
                  resetEvaluationForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvaluation}
                disabled={!evaluationForm.period}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorTrackProgress;
