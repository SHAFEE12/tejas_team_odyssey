/**
 * Execution.jsx
 *
 * Career Execution OS (/student/execution).
 * Closed-loop execution system tracking goals, daily execution, time investments,
 * consistency, skipped patterns, adaptive difficulty, and weekly reviews.
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getTodayExecution,
  getExecutionAnalytics,
  getWeeklyReview,
  getExecutionHeatmap,
  getGoals,
  createGoal,
  createTask,
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  skipTask,
  cancelTask,
  deleteTask,
  deleteGoal,
  getCurrentWeekCheckIn,
  submitWeeklyCheckIn,
} from '../../api/execution.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icons ────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const ICONS = {
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  flame: (
    <>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  play: (
    <polygon points="5 3 19 12 5 21 5 3" />
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  skip: (
    <>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  refresh: (
    <>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </>
  ),
};

export default function Execution() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [goals, setGoals] = useState([]);
  const [checkInData, setCheckInData] = useState(null);

  // Modals & form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Task Form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    estimatedMinutes: 30,
    priority: 'MEDIUM',
    category: 'SKILL',
    goalId: '',
  });

  // New Goal Form
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'CAREER',
    priority: 'HIGH',
    targetDate: '',
    weeklyTargetMinutes: 120,
  });

  // Check-In Form
  const [checkInRating, setCheckInRating] = useState(4);
  const [checkInReflection, setCheckInReflection] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dailyRes, analyticsRes, reviewRes, heatmapRes, goalsRes, checkInRes] =
        await Promise.all([
          getTodayExecution(),
          getExecutionAnalytics(),
          getWeeklyReview(),
          getExecutionHeatmap(14),
          getGoals(),
          getCurrentWeekCheckIn(),
        ]);

      if (dailyRes?.success) setDailyData(dailyRes.data);
      if (analyticsRes?.success) setAnalytics(analyticsRes.data);
      if (reviewRes?.success) setWeeklyReview(reviewRes.data);
      if (heatmapRes?.success) setHeatmap(heatmapRes.data || []);
      if (goalsRes?.success) setGoals(goalsRes.data || []);
      if (checkInRes?.success) setCheckInData(checkInRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load execution data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ── Task Actions ──────────────────────────────────────────────── */

  const handleStartTask = async (taskId) => {
    try {
      setActionLoading(true);
      await startTask(taskId);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseTask = async (taskId) => {
    const minStr = prompt('Minutes spent before pausing?', '15');
    if (minStr === null) return;
    const min = Number(minStr) || 0;
    try {
      setActionLoading(true);
      await pauseTask(taskId, min);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      setActionLoading(true);
      await resumeTask(taskId);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (taskId, defaultMinutes) => {
    const minStr = prompt('Minutes spent on this task?', String(defaultMinutes || 30));
    if (minStr === null) return;
    const min = Number(minStr) || defaultMinutes || 30;
    try {
      setActionLoading(true);
      await completeTask(taskId, min);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipTask = async (taskId) => {
    const note = prompt('Reason for skipping this task? (Optional)', '') || '';
    try {
      setActionLoading(true);
      await skipTask(taskId, note);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    if (!confirm('Are you sure you want to cancel this task? It will be removed from planned workload.')) return;
    try {
      setActionLoading(true);
      await cancelTask(taskId);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Permanently delete this task and its history?')) return;
    try {
      setActionLoading(true);
      await deleteTask(taskId);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Permanently delete this goal?')) return;
    try {
      setActionLoading(true);
      await deleteGoal(goalId);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Form Submissions ──────────────────────────────────────────── */

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      setActionLoading(true);
      await createTask({
        ...taskForm,
        estimatedMinutes: Number(taskForm.estimatedMinutes) || 30,
        goalId: taskForm.goalId || null,
      });
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        estimatedMinutes: 30,
        priority: 'MEDIUM',
        category: 'SKILL',
        goalId: '',
      });
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;
    try {
      setActionLoading(true);
      await createGoal({
        ...goalForm,
        weeklyTargetMinutes: Number(goalForm.weeklyTargetMinutes) || 0,
        targetDate: goalForm.targetDate || null,
      });
      setShowGoalModal(false);
      setGoalForm({
        title: '',
        description: '',
        category: 'CAREER',
        priority: 'HIGH',
        targetDate: '',
        weeklyTargetMinutes: 120,
      });
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCheckIn = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await submitWeeklyCheckIn({
        selfRating: checkInRating,
        reflection: checkInReflection,
      });
      setShowCheckInModal(false);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Status Badge Styles ───────────────────────────────────────── */

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HIGH_PERFORMANCE':
      case 'COMPLETED':
      case 'ON_TRACK':
        return {
          pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'EXECUTING':
      case 'IN_PROGRESS':
        return {
          pill: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
        };
      case 'INCONSISTENT':
      case 'PAUSED':
      case 'AT_RISK':
        return {
          pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'OFF_TRACK':
      case 'OVERDUE':
        return {
          pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'SKIPPED':
        return {
          pill: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          dot: 'bg-orange-400',
        };
      case 'CANCELLED':
        return {
          pill: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
          dot: 'bg-zinc-400',
        };
      default:
        return {
          pill: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
          dot: 'bg-zinc-400',
        };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/25';
      case 'MEDIUM':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/25';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-36 rounded-2xl bg-zinc-900/60 border border-white/[0.06] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-900/40 border border-white/[0.04] animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-zinc-900/40 border border-white/[0.04] animate-pulse" />
      </div>
    );
  }

  const execScore = analytics?.executionScore ?? 'INSUFFICIENT_DATA';
  const compRate = analytics?.completionRate ?? 'INSUFFICIENT_DATA';
  const timeRate = analytics?.timeExecutionRate ?? 'INSUFFICIENT_DATA';
  const streak = analytics?.streaks?.dailyStreak || 0;
  const consistencyScore = analytics?.consistencyScore ?? 'INSUFFICIENT_DATA';

  const todayTasks = dailyData?.tasks || [];
  const nextTask = dailyData?.nextTask;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ── Top Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 font-semibold">
                Closed-Loop Execution OS
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Cadence & Velocity Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Daily Execution <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Tracker</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Bridge the gap between strategic career direction and measurable daily habits.
              Tracks goals, effort, consistency, and automatically downsizes task friction when roadblocks occur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <Icon d={ICONS.plus} size={15} />
              <span>Add Task</span>
            </button>

            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Icon d={ICONS.target} size={15} />
              <span>Add Goal</span>
            </button>

            <button
              onClick={() => setShowCheckInModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-95 cursor-pointer ${
                checkInData?.hasSubmitted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
              }`}
            >
              <Icon d={checkInData?.hasSubmitted ? ICONS.checkCircle : ICONS.calendar} size={15} />
              <span>{checkInData?.hasSubmitted ? 'Check-In Submitted' : 'Weekly Check-In'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Overview Cards (4 HUD Cards) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Execution Score */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-5 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Execution Score
            </span>
            {analytics?.weekly?.status && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getStatusBadge(analytics.weekly.status).pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(analytics.weekly.status).dot}`} />
                {analytics.weekly.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {execScore !== 'INSUFFICIENT_DATA' ? execScore : '—'}
            </span>
            {execScore !== 'INSUFFICIENT_DATA' && (
              <span className="text-xs text-zinc-500 font-mono">/ 100</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            {execScore !== 'INSUFFICIENT_DATA'
              ? 'Weighted: Completion, Time, Habit & Goals'
              : 'Log daily activity to compute'}
          </p>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-5 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Sprint Completion
            </span>
            <span className="text-sky-400/80">
              <Icon d={ICONS.checkCircle} size={15} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-sky-400 tracking-tight">
              {compRate !== 'INSUFFICIENT_DATA' ? `${compRate}%` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            {analytics?.weekly?.completedTasks || 0} completed / {(analytics?.weekly?.completedTasks || 0) + (analytics?.weekly?.skippedTasks || 0)} eligible tasks
          </p>
        </div>

        {/* Card 3: Execution Streak */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-5 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Execution Streak
            </span>
            <span className="text-amber-400">
              <Icon d={ICONS.flame} size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              {streak}
            </span>
            <span className="text-xs text-zinc-500 font-mono">days continuous</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Consistency: {consistencyScore !== 'INSUFFICIENT_DATA' ? `${consistencyScore}/100` : 'Building baseline'}
          </p>
        </div>

        {/* Card 4: Time Invested */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-5 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Time Invested (Week)
            </span>
            <span className="text-emerald-400">
              <Icon d={ICONS.clock} size={15} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {analytics?.weekly?.completedMinutes || 0}
            </span>
            <span className="text-xs text-zinc-500 font-mono">min executed</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Planned: {analytics?.weekly?.plannedMinutes || 0} min ({timeRate !== 'INSUFFICIENT_DATA' ? `${timeRate}%` : '0%'} velocity)
          </p>
        </div>
      </div>

      {/* ── "Do This Next" Section (Deterministic Priority Hero Card) ── */}
      {nextTask && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/[0.08] via-[#0f121d] to-[#0b0d13] border border-orange-500/30 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 text-white uppercase tracking-wider">
                  <Icon d={ICONS.zap} size={11} />
                  Do This Next
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getPriorityStyle(nextTask.priority)}`}>
                  {nextTask.priority} PRIORITY
                </span>
                <span className="text-zinc-600">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <Icon d={ICONS.clock} size={12} />
                  Est: {nextTask.estimatedMinutes} min
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                  {nextTask.category}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {nextTask.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {nextTask.description || `High-impact ${nextTask.category} task aligned with your target career milestone.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {nextTask.status === 'PLANNED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStartTask(nextTask._id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-950 bg-sky-400 hover:bg-sky-300 transition-all active:scale-95 cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Icon d={ICONS.play} size={14} />
                  <span>Start Task</span>
                </button>
              )}
              {nextTask.status === 'IN_PROGRESS' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleCompleteTask(nextTask._id, nextTask.estimatedMinutes)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Icon d={ICONS.checkCircle} size={14} />
                  <span>Complete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Execution Cadence ─────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Today's Execution Cadence
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {todayTasks.length} Tasks
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Completed {dailyData?.completedTasks || 0} / {dailyData?.plannedTasks || 0} tasks • {dailyData?.completedMinutes || 0} / {dailyData?.plannedMinutes || 0} min
            </p>
          </div>

          {/* Daily Progress Mini Bar */}
          <div className="flex items-center gap-3">
            <div className="w-36 sm:w-48 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${dailyData?.plannedTasks > 0 ? Math.min(100, (dailyData.completedTasks / dailyData.plannedTasks) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">
              {dailyData?.plannedTasks > 0 ? Math.round((dailyData.completedTasks / dailyData.plannedTasks) * 100) : 0}%
            </span>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Icon d={ICONS.calendar} size={22} />
            </div>
            <h3 className="text-sm font-semibold text-white">No tasks scheduled for today</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Plan high-leverage execution steps for today to build streak velocity.
            </p>
            <button
              onClick={() => setShowTaskModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] transition-all cursor-pointer"
            >
              <Icon d={ICONS.plus} size={13} />
              <span>Schedule a Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((t) => {
              const badge = getStatusBadge(t.status);
              const isDone = t.status === 'COMPLETED';

              return (
                <div
                  key={t._id}
                  className={`rounded-xl border p-4 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                    isDone
                      ? 'bg-white/[0.02] border-white/[0.04] opacity-75'
                      : 'bg-[#111422]/70 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badge.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {t.status}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                        {t.category}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getPriorityStyle(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Est: {t.estimatedMinutes}m {t.actualMinutes > 0 ? `| Act: ${t.actualMinutes}m` : ''}
                      </span>
                    </div>

                    <h3 className={`text-sm font-semibold tracking-tight ${isDone ? 'line-through text-zinc-400' : 'text-white'}`}>
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Task Action Bar */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {t.status === 'PLANNED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleStartTask(t._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer"
                      >
                        <Icon d={ICONS.play} size={12} />
                        <span>Start</span>
                      </button>
                    )}

                    {t.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handlePauseTask(t._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                        >
                          <Icon d={ICONS.pause} size={12} />
                          <span>Pause</span>
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleCompleteTask(t._id, t.estimatedMinutes)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer shadow-sm shadow-emerald-500/25"
                        >
                          <Icon d={ICONS.checkCircle} size={12} />
                          <span>Complete</span>
                        </button>
                      </>
                    )}

                    {t.status === 'PAUSED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleResumeTask(t._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer"
                      >
                        <Icon d={ICONS.play} size={12} />
                        <span>Resume</span>
                      </button>
                    )}

                    {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.status !== 'SKIPPED' && (
                      <>
                        {t.status !== 'IN_PROGRESS' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleCompleteTask(t._id, t.estimatedMinutes)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            <Icon d={ICONS.checkCircle} size={12} />
                            <span>Done</span>
                          </button>
                        )}
                        <button
                          disabled={actionLoading}
                          onClick={() => handleSkipTask(t._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 transition-all cursor-pointer"
                        >
                          <Icon d={ICONS.skip} size={12} />
                          <span>Skip</span>
                        </button>
                      </>
                    )}

                    {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleCancelTask(t._id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all cursor-pointer"
                        title="Cancel task"
                      >
                        <Icon d={ICONS.close} size={13} />
                      </button>
                    )}

                    <button
                      disabled={actionLoading}
                      onClick={() => handleDeleteTask(t._id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete task permanently"
                    >
                      <Icon d={ICONS.trash} size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Active Career Goals Section ──────────────────────────── */}
      <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Active Career Goals & Milestones
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {goals.length} Goals
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Track milestones, target completion dates, and algorithmic goal risk health.
            </p>
          </div>

          <button
            onClick={() => setShowGoalModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] transition-all cursor-pointer self-start sm:self-auto"
          >
            <Icon d={ICONS.plus} size={13} />
            <span>Add Goal</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
            <p className="text-xs text-zinc-400">
              No milestones tracked yet. Create your first career goal to begin closed-loop execution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const risk = analytics?.atRiskGoals?.find((r) => r.goalId === g._id);
              const statusBadge = getStatusBadge(risk?.status || g.status);

              return (
                <div
                  key={g._id}
                  className="rounded-xl bg-[#111422]/80 border border-white/[0.06] p-5 flex flex-col justify-between gap-4 hover:border-white/15 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                        {g.category}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {risk?.status || g.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {g.title}
                    </h3>

                    {g.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {g.description}
                      </p>
                    )}

                    {g.targetDate && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                        <Icon d={ICONS.calendar} size={12} />
                        <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {risk?.recommendation && risk.status !== 'ON_TRACK' && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-normal flex items-start gap-2">
                        <span className="shrink-0 mt-0.5 text-amber-400">
                          <Icon d={ICONS.alertTriangle} size={13} />
                        </span>
                        <span>{risk.recommendation}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                    <span className="font-mono text-[11px] text-zinc-400">
                      {g.weeklyTargetMinutes > 0 ? `${g.weeklyTargetMinutes} min/week` : 'Flexible cadence'}
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(g._id)}
                      className="text-zinc-600 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Weekly Review & Habit Engine (2-Column Grid) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Weekly Review Card */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-orange-400">
                <Icon d={ICONS.award} size={18} />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Weekly Sprint Review
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Closed-Loop Output
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5 mb-2">
                <Icon d={ICONS.checkCircle} size={13} />
                Key Achievements
              </span>
              <ul className="space-y-1.5 pl-1">
                {(weeklyReview?.topAchievements || ['Logging daily execution cadence.']).map((ach, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5 mb-1.5">
                <Icon d={ICONS.alertTriangle} size={13} />
                Friction Points
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                {weeklyReview?.biggestExecutionProblem || 'No systemic blockers recorded for this cycle.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Icon d={ICONS.sparkles} size={12} />
                Next Sprint Recommendation
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {weeklyReview?.nextWeekRecommendation || 'Maintain current cadence and reinforce high-priority milestones.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Adaptive Difficulty & 14-Day Activity Heatmap */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-orange-400">
                <Icon d={ICONS.target} size={18} />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Adaptive Friction & Habit Heatmap
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              14-Day Velocity
            </span>
          </div>

          {/* Friction Detection Banner */}
          {(analytics?.skippedPatterns || []).length === 0 ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <Icon d={ICONS.checkCircle} size={16} />
              <span>Zero repeated skip friction detected. Task sizing aligns with your execution velocity.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {analytics.skippedPatterns.map((p, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">
                      {p.category} Tasks Repeatedly Skipped ({p.skipped} skips)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 font-semibold">{p.skipRate}% skip rate</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {p.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 14-Day Habit Heatmap */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                14-Day Execution Heatmap
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Done
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Partial
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Missed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
              {heatmap.map((d, i) => {
                let cellStyle = 'bg-white/[0.05] border-white/[0.05] text-zinc-500';
                if (d.level === 'COMPLETED') {
                  cellStyle = 'bg-emerald-500/80 border-emerald-400 text-white shadow-sm shadow-emerald-500/20';
                } else if (d.level === 'PARTIAL') {
                  cellStyle = 'bg-sky-500/80 border-sky-400 text-white shadow-sm shadow-sky-500/20';
                } else if (d.level === 'PLANNED_INCOMPLETE') {
                  cellStyle = 'bg-rose-500/80 border-rose-400 text-white shadow-sm shadow-rose-500/20';
                }

                return (
                  <div
                    key={i}
                    title={`${d.date}: ${d.completedCount || 0}/${d.plannedCount || 0} completed`}
                    className={`h-9 rounded-lg border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer font-mono text-[10px] font-bold ${cellStyle}`}
                  >
                    <span>{d.date?.slice(8) || i + 1}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1">
              <span>14 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal: Create Task ────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d101a] border border-white/15 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white">Add Execution Task</h2>
                <p className="text-xs text-zinc-400">Schedule concrete daily practice or project milestone.</p>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Task Title *
                </label>
                <input
                  required
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement JWT authentication middleware"
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description / Acceptance Criteria
                </label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Brief career purpose or acceptance criteria"
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Est. Minutes (5–480)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={taskForm.estimatedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: e.target.value })}
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="SKILL">SKILL</option>
                  <option value="DSA">DSA</option>
                  <option value="PROJECT">PROJECT</option>
                  <option value="RESUME">RESUME</option>
                  <option value="GITHUB">GITHUB</option>
                  <option value="APPLICATION">APPLICATION</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="ROADMAP">ROADMAP</option>
                  <option value="CAREER">CAREER</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              {goals.length > 0 && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Link to Career Goal (Optional)
                  </label>
                  <select
                    value={taskForm.goalId}
                    onChange={(e) => setTaskForm({ ...taskForm, goalId: e.target.value })}
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">-- No Linked Goal --</option>
                    {goals.map((g) => (
                      <option key={g._id} value={g._id}>{g.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create Goal ────────────────────────────────────── */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d101a] border border-white/15 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white">Add Career Goal</h2>
                <p className="text-xs text-zinc-400">Establish a target milestone with weekly time commitments.</p>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Goal Title *
                </label>
                <input
                  required
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g. Master Distributed Systems Architecture"
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Define success criteria for this milestone"
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="CAREER">CAREER</option>
                    <option value="SKILL">SKILL</option>
                    <option value="DSA">DSA</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="RESUME">RESUME</option>
                    <option value="APPLICATION">APPLICATION</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="ROADMAP">ROADMAP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Weekly Target Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  value={goalForm.weeklyTargetMinutes}
                  onChange={(e) => setGoalForm({ ...goalForm, weeklyTargetMinutes: e.target.value })}
                  className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Weekly Check-In ────────────────────────────────── */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d101a] border border-white/15 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Reflection & Check-In</h2>
                <p className="text-xs text-zinc-400">Review your execution pace and align your strategy.</p>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {checkInData?.hasSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Icon d={ICONS.checkCircle} size={16} />
                  <span>You have already completed this week's check-in (Rating: {checkInData.checkIn?.selfRating} / 5).</span>
                </div>
                <p className="text-zinc-300 italic">
                  "{checkInData.checkIn?.reflection || 'No notes added.'}"
                </p>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                    1. How would you rate your execution velocity this week?
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setCheckInRating(star)}
                        className={`w-10 h-10 rounded-xl text-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                          checkInRating >= star
                            ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 scale-105'
                            : 'bg-white/[0.04] text-zinc-500 border border-white/[0.08] hover:bg-white/[0.08]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                    2. Qualitative Reflection (Successes, Blockers, Adjustments)
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={checkInReflection}
                    onChange={(e) => setCheckInReflection(e.target.value)}
                    placeholder="e.g. Completed 4 project milestones and solved medium DSA problems. Need to schedule resume reviews earlier in the week."
                    className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors leading-relaxed"
                  />
                  <div className="flex justify-end text-[10px] font-mono text-zinc-500 mt-1">
                    {checkInReflection.length} / 2000 characters
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowCheckInModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading}
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Reflection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}