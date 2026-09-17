/**
 * AdaptivePlan.jsx
 *
 * Adaptive Career Operating System (/student/adaptive-plan).
 * Pure deterministic adaptation dashboard:
 * - Active operating mode & reasoning
 * - Workload calibration & daily targets
 * - Task sizing adaptations & cognitive friction mitigation
 * - Category priority re-ranking
 * - Non-shaming execution friction detection
 * - Student preferences (Adaptive vs Standard, pause/resume)
 * - Snapshot history & Copilot integration
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getAdaptivePlan,
  getSnapshots,
  getFriction,
  updatePreferences,
  refreshPlan,
} from '../../api/adaptiveCareer.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icon helper ──────────────────────────────────────── */
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
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const ICONS = {
  refresh: (
    <>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </>
  ),
  trendUp: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  trendDown: (
    <>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  play: (
    <polygon points="5 3 19 12 5 21 5 3" />
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 14 14" />
    </>
  ),
  copilot: (
    <>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
};

/* ── Mode Colors & Styles ────────────────────────────────────────── */
const MODE_CONFIG = {
  DEADLINE_MODE: {
    label: 'Deadline Sprint',
    gradient: 'from-rose-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  INTERVIEW_MODE: {
    label: 'Interview Prep Sprint',
    gradient: 'from-amber-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  EXECUTION_RECOVERY: {
    label: 'Cadence Recovery',
    gradient: 'from-sky-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  SKILL_GAP_CLOSURE: {
    label: 'Skill Gap Focus',
    gradient: 'from-purple-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
  },
  PROJECT_EXECUTION: {
    label: 'Project Milestone',
    gradient: 'from-teal-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-teal-500/30',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-400',
  },
  APPLICATION_CAMPAIGN: {
    label: 'Application Campaign',
    gradient: 'from-blue-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  NORMAL: {
    label: 'Balanced Cadence',
    gradient: 'from-emerald-500/15 via-[#0d101a] to-[#0b0d13]',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  INSUFFICIENT_DATA: {
    label: 'Setup Required',
    gradient: 'from-zinc-800/20 via-[#0d101a] to-[#0b0d13]',
    border: 'border-zinc-700/30',
    badge: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
    dot: 'bg-zinc-400',
  },
};

export default function AdaptivePlan() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [friction, setFriction] = useState(null);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [planRes, snapsRes, frictRes] = await Promise.all([
        forceRefresh ? refreshPlan() : getAdaptivePlan(),
        getSnapshots().catch(() => ({ success: true, data: [] })),
        getFriction().catch(() => ({ success: true, data: {} })),
      ]);

      if (planRes && planRes.success && planRes.data) {
        setPlan(planRes.data);
      } else {
        throw new Error(planRes?.message || 'Failed to load adaptive plan.');
      }

      if (snapsRes && snapsRes.data) {
        setSnapshots(snapsRes.data);
      }
      if (frictRes && frictRes.data) {
        setFriction(frictRes.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to sync Adaptive Career Operating System.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePreference = async () => {
    if (!plan) return;
    const nextPref = plan.planPreference === 'ADAPTIVE' ? 'STANDARD' : 'ADAPTIVE';
    try {
      const res = await updatePreferences({ planPreference: nextPref });
      if (res && res.success && res.data) {
        setPlan((prev) => ({ ...prev, planPreference: nextPref }));
      }
    } catch (err) {
      console.error('Failed to update preference:', err);
    }
  };

  const handleTogglePause = async () => {
    if (!plan) return;
    const nextPaused = !plan.isPaused;
    try {
      const res = await updatePreferences({ isPaused: nextPaused });
      if (res && res.success && res.data) {
        setPlan((prev) => ({ ...prev, isPaused: nextPaused }));
      }
    } catch (err) {
      console.error('Failed to update pause state:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-10 w-72 bg-zinc-900/60 rounded-xl animate-pulse" />
        <div className="h-40 w-full bg-zinc-900/40 rounded-2xl animate-pulse border border-white/[0.04]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-zinc-900/40 rounded-xl animate-pulse border border-white/[0.04]" />
          <div className="h-32 bg-zinc-900/40 rounded-xl animate-pulse border border-white/[0.04]" />
          <div className="h-32 bg-zinc-900/40 rounded-xl animate-pulse border border-white/[0.04]" />
        </div>
      </div>
    );
  }

  const modeCfg = MODE_CONFIG[plan?.mode] || MODE_CONFIG.NORMAL;
  const isAdaptiveActive = plan?.planPreference === 'ADAPTIVE' && !plan?.isPaused;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-zinc-100">
      
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 font-semibold">
                Autonomous Career Calibration
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Pacing Velocity Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Adaptive Career <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Operating System</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Dynamically calibrates weekly workload, task sizing, and priority weights learned from your authentic execution consistency.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pause / Resume Button */}
            <button
              onClick={handleTogglePause}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                plan?.isPaused
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08]'
              }`}
              title={plan?.isPaused ? 'Resume auto-adaptation' : 'Pause automatic weekly adaptation'}
            >
              <Icon d={plan?.isPaused ? ICONS.play : ICONS.pause} size={13} />
              <span>{plan?.isPaused ? 'Adaptation Paused' : 'Pause Adaptation'}</span>
            </button>

            {/* Adaptive vs Standard Toggle */}
            <button
              onClick={handleTogglePreference}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                plan?.planPreference === 'ADAPTIVE'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
              }`}
              title="Toggle between Adaptive AI plan and Standard curriculum"
            >
              <span className={`w-2 h-2 rounded-full ${plan?.planPreference === 'ADAPTIVE' ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>Mode: {plan?.planPreference || 'ADAPTIVE'}</span>
            </button>

            {/* Recalibrate Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Icon d={ICONS.refresh} size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Calibrating...' : 'Recalibrate Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadData(true)} className="underline hover:text-white text-xs font-semibold">
            Retry Sync
          </button>
        </div>
      )}

      {/* ── Active Operating Mode Banner ──────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 bg-gradient-to-br ${modeCfg.gradient} ${modeCfg.border} backdrop-blur-md shadow-xl`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${modeCfg.badge}`}>
                <span className={`w-2 h-2 rounded-full ${modeCfg.dot} animate-ping`} />
                {modeCfg.label}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Focus Area: {plan?.focusArea || 'Balanced Career Acceleration'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {plan?.focusArea || 'Balanced Career Acceleration'}
            </h2>

            <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
              {plan?.modeReason || 'Maintaining a balanced execution pace across skills, coding practice, and project development.'}
            </p>
          </div>

          {/* Confidence Meter */}
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 bg-black/40 px-5 py-4 rounded-2xl border border-white/[0.08] backdrop-blur-md">
            <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Confidence Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {plan?.confidence ?? 50}%
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">High Signal</span>
            </div>
            <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${plan?.confidence ?? 50}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Key Adaptation Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Workload Target */}
        <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] flex flex-col gap-2 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Weekly Workload
            </span>
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Icon d={ICONS.clock} size={15} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {plan?.recommendedHours ?? 10}
            </span>
            <span className="text-sm font-mono text-zinc-400 font-medium">hrs / week</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-mono">
            Targeting ~{((plan?.recommendedHours || 10) / 5).toFixed(1)} hrs/day. Calibrated within safe 5–15h boundary.
          </p>
        </div>

        {/* Card 2: Task Sizing Calibration */}
        <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] flex flex-col gap-2 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Task Sizing Calibration
            </span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Icon d={ICONS.target} size={15} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {plan?.taskRecommendations?.[0]?.adaptedMinutes ?? 35}
            </span>
            <span className="text-sm font-mono text-zinc-400 font-medium">min avg chunk</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-mono">
            Tasks in high-resistance domains downsized to prevent schedule rollover and activation hesitation.
          </p>
        </div>

        {/* Card 3: Execution Velocity */}
        <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] flex flex-col gap-2 relative overflow-hidden backdrop-blur-md hover:border-white/15 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Execution Velocity
            </span>
            <span className={`p-2 rounded-xl border ${
              plan?.behaviorSummary?.velocityTrend === 'ACCELERATING'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : plan?.behaviorSummary?.velocityTrend === 'CRITICAL_DROP'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              <Icon
                d={plan?.behaviorSummary?.velocityTrend === 'CRITICAL_DROP' ? ICONS.trendDown : ICONS.trendUp}
                size={15}
              />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {plan?.behaviorSummary?.completionRate !== null
                ? `${plan?.behaviorSummary?.completionRate ?? 0}%`
                : 'Steady'}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
              {plan?.behaviorSummary?.velocityTrend || 'STEADY'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-mono">
            {plan?.behaviorSummary?.overdueCount || 0} overdue items flagged for rescheduling.
          </p>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Priority Re-ranking & Adapted Tasks */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section: Priority Adjustments */}
          <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Dynamic Priority Re-Ranking
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time category weight adjustments driven by current operating mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(plan?.priorityAdjustments || []).map((adj, idx) => {
                const isPositive = adj.weightChange > 0;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white uppercase">{adj.category}</span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isPositive ? `+${adj.weightChange}%` : `${adj.weightChange}%`}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {adj.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Adapted Task Recommendations */}
          <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Adapted Weekly Tasks
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calibrated task sizes and prioritized execution units for maximum momentum.
                </p>
              </div>
              <Link
                to={ROUTES.STUDENT_EXECUTION}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Execute in OS</span>
                <Icon d={ICONS.arrowRight} size={12} />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {(plan?.taskRecommendations || []).slice(0, 5).map((task, idx) => (
                <div
                  key={task.taskId || idx}
                  className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1 max-w-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{task.title}</span>
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06]">
                        {task.category}
                      </span>
                      {task.urgency === 'CRITICAL' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{task.sizingAdjustmentReason}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {task.adaptedMinutes}m
                      </span>
                      {task.originalMinutes && task.originalMinutes !== task.adaptedMinutes && (
                        <span className="text-[11px] font-mono text-zinc-500 line-through">
                          {task.originalMinutes}m
                        </span>
                      )}
                    </div>
                    <Link
                      to={ROUTES.STUDENT_EXECUTION}
                      className="p-2 rounded-lg bg-white/[0.05] hover:bg-orange-500/20 hover:text-orange-300 text-zinc-300 border border-white/[0.08] transition-colors"
                      title="Run Task in Execution OS"
                    >
                      <Icon d={ICONS.play} size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Weekly Objectives */}
          <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-base font-bold text-white tracking-tight pb-2 border-b border-white/[0.06]">
              Strategic Week Objectives
            </h3>
            <div className="flex flex-col gap-2.5">
              {(plan?.objectives || []).map((obj, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#111422]/60 border border-white/[0.04]">
                  <span className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Icon d={ICONS.check} size={12} />
                  </span>
                  <span className="text-xs text-zinc-300 leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Friction Radar & Historical Snapshots */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Friction Radar */}
          <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Icon d={ICONS.alert} size={15} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Execution Friction Radar
                </h3>
                <p className="text-xs text-zinc-400">
                  Identifies hesitation patterns before they become dropouts.
                </p>
              </div>
            </div>

            {(!plan?.frictionSummary || plan.frictionSummary.length === 0) ? (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <p className="text-xs text-emerald-300 font-semibold">
                  Zero Critical Friction Detected
                </p>
                <p className="text-[11px] text-zinc-400">
                  Execution patterns are steady and well-proportioned across all tracked categories.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {plan.frictionSummary.map((frict, i) => {
                  const isHigh = frict.frictionLevel === 'HIGH';
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                        isHigh
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">{frict.category}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isHigh
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {frict.frictionLevel} FRICTION
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{frict.evidence}</p>
                      <div className="mt-1 pt-2 border-t border-white/[0.05] text-[11px] text-zinc-400">
                        <strong className="text-zinc-200">Recommended fix:</strong> {frict.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Adaptation Snapshots */}
          <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Icon d={ICONS.history} size={15} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Snapshot History
                </h3>
                <p className="text-xs text-zinc-400">
                  Authentic weekly audit of adaptation decisions.
                </p>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">
                No past snapshots recorded yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {snapshots.slice(0, 5).map((snap, i) => (
                  <div
                    key={snap._id || i}
                    className="p-3.5 rounded-xl bg-[#111422]/60 border border-white/[0.05] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">
                        {MODE_CONFIG[snap.mode]?.label || snap.mode}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {new Date(snap.generatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300 font-mono">{snap.recommendedHours}h/wk</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{snap.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copilot Deep Query Prompts */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-[#0d101a] to-[#0b0d13] border border-orange-500/25 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Icon d={ICONS.copilot} size={16} className="text-orange-400" />
              <span>Ask Copilot About Adaptations</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Explore why specific task sizes changed or how your recovery plan was calculated.
            </p>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                'Why did my plan adapt?',
                'What is slowing me down?',
                'How did my plan adapt this week?',
                'Activate recovery plan',
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`${ROUTES.STUDENT_COPILOT}?q=${encodeURIComponent(query)}`)}
                  className="text-left px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-zinc-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>"{query}"</span>
                  <Icon d={ICONS.arrowRight} size={12} className="text-zinc-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}