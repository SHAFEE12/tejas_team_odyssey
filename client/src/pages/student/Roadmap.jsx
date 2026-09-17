/**
 * Roadmap.jsx — /student/roadmap
 *
 * Personalized Career Roadmap for Career Odyssey.
 *
 * Converts the student's:
 * Career Goal + Skill Gap + My Skills + Resume + GitHub + DSA
 * into an actionable, multi-phase engineering career roadmap.
 *
 * Design: Executive Obsidian / Dark SaaS, multi-phase progressive timeline,
 * 3-state interactive task status checkboxes, task detail modal, and data synthesis telemetry.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRoadmap, generateRoadmap, updateTaskStatus } from '../../api/roadmap.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icon primitive ───────────────────────────────── */
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
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  roadmap:   ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  target:    ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  skills:    ['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  gap:       ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  info:      ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 16v-4', 'M12 8h.01'],
  arrow:     'M5 12h14M12 5l7 7-7 7',
  check:     'M20 6L9 17l-5-5',
  alert:     ['M12 9v2m0 4h.01', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'],
  resume:    ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  github:    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  dsa:       ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  close:     ['M18 6L6 18', 'M6 6l12 12'],
  clock:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 6v6l4 2'],
  calendar:  ['M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  tag:       ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z', 'M7 7h.01'],
  sparkles:  'M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36l-2.12 2.12M8.76 15.24l-2.12 2.12M17.24 15.24l-2.12-2.12M8.76 8.76L6.64 6.64',
  layers:    ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
};

/* ── Badge Helpers ───────────────────────────────────────────── */
function getPriorityBadge(priority) {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'High Priority',
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
        dot: 'bg-rose-400',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Priority',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
        dot: 'bg-amber-400',
      };
    case 'LOW':
    default:
      return {
        label: 'Low Priority',
        badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
        dot: 'bg-zinc-400',
      };
  }
}

function getTypeBadge(type) {
  switch (type) {
    case 'PROJECT':
      return { label: 'Project', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' };
    case 'DSA':
      return { label: 'DSA', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' };
    case 'RESUME':
      return { label: 'Resume', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/25' };
    case 'GITHUB':
      return { label: 'GitHub', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/25' };
    case 'INTERVIEW':
      return { label: 'Interview Prep', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/25' };
    case 'PRACTICE':
      return { label: 'Practice', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/25' };
    case 'LEARN':
    default:
      return { label: 'Learn', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25' };
  }
}

export default function Roadmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Filters & Accordion State
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL'); // ALL, NOT_STARTED, IN_PROGRESS, COMPLETED, HIGH_PRIORITY
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchRoadmapData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getRoadmap();
      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to retrieve roadmap');
      }
    } catch (err) {
      console.error('Error loading roadmap:', err);
      setError(err.message || 'Unable to load personalized roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmapData();
  }, [fetchRoadmapData]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await generateRoadmap();
      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to regenerate roadmap');
      }
    } catch (err) {
      console.error('Error regenerating roadmap:', err);
      setError(err.message || 'Failed to regenerate roadmap.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus, e) => {
    if (e) e.stopPropagation();
    setUpdatingTaskId(taskId);

    try {
      const res = await updateTaskStatus(taskId, newStatus);
      if (res?.success && res?.data) {
        setData(res.data);
        if (selectedTask && selectedTask.taskId === taskId) {
          const updated = res.data.tasks.find((t) => t.taskId === taskId);
          if (updated) setSelectedTask(updated);
        }
      } else {
        throw new Error(res?.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const togglePhase = (phaseId) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const toggleAllPhases = () => {
    if (!data?.phases) return;
    const allCollapsed = data.phases.every((p) => collapsedPhases[p.phaseId]);
    const newState = {};
    data.phases.forEach((p) => {
      newState[p.phaseId] = !allCollapsed;
    });
    setCollapsedPhases(newState);
  };

  // Filter tasks
  const filteredPhasesWithTasks = useMemo(() => {
    if (!data?.phases || !data?.tasks) return [];

    return data.phases.map((phase) => {
      let phaseTasks = data.tasks.filter((t) => t.phaseId === phase.phaseId);

      if (activeStatusFilter === 'NOT_STARTED') {
        phaseTasks = phaseTasks.filter((t) => t.status === 'NOT_STARTED');
      } else if (activeStatusFilter === 'IN_PROGRESS') {
        phaseTasks = phaseTasks.filter((t) => t.status === 'IN_PROGRESS');
      } else if (activeStatusFilter === 'COMPLETED') {
        phaseTasks = phaseTasks.filter((t) => t.status === 'COMPLETED');
      } else if (activeStatusFilter === 'HIGH_PRIORITY') {
        phaseTasks = phaseTasks.filter((t) => t.priority === 'HIGH');
      }

      return {
        ...phase,
        tasks: phaseTasks,
      };
    });
  }, [data, activeStatusFilter]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Building your personalized career roadmap...</p>
      </div>
    );
  }

  // Error State
  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <Icon d={ICONS.alert} size={24} />
          </div>
          <h3 className="text-lg font-bold text-rose-200 mb-2">Unable to Load Career Roadmap</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchRoadmapData()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State: No Career Goal Configured
  if (!data?.targetRole || data?.hasCareerGoal === false) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 text-orange-400">
          <Icon d={ICONS.target} size={30} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Configure Your Career Target First
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
          The Personalized Career Roadmap synthesizes your target role, skill gap analysis, resume proof, and LeetCode/GitHub activity into a structured, step-by-step career path.
        </p>
        <Link
          to={ROUTES.STUDENT_CAREER_GOAL}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/25"
        >
          <span>Select Career Goal</span>
          <Icon d={ICONS.arrow} size={14} />
        </Link>
      </div>
    );
  }

  const { targetRole, progress, totalTasks, completedTasks, inProgressTasks } = data;
  const notStartedTasks = totalTasks - completedTasks - inProgressTasks;

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Icon d={ICONS.layers} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Personalized Career Roadmap
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Dynamic Architecture
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 max-w-2xl leading-relaxed">
            Personalized step-by-step engineering curriculum towards{' '}
            <strong className="text-white font-semibold">{targetRole}</strong>. Derived deterministically from your active Skill Gap analysis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={ROUTES.STUDENT_SKILL_GAP}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] hover:border-orange-500/30 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            <Icon d={ICONS.gap} size={13} className="text-orange-400" />
            <span>View Skill Gap</span>
          </Link>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            title="Regenerate roadmap from current profile, resume, GitHub, and DSA data"
          >
            <Icon d={ICONS.refresh} size={13} className={regenerating ? 'animate-spin text-orange-400' : 'text-zinc-400'} />
            <span>{regenerating ? 'Regenerating...' : 'Refresh Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* ── SIH 26044 Feedback Loop Banner ── */}
      {data.tasks && data.tasks.some((t) => t.taskId?.includes('remediation') || t.title?.includes('Remediate Recruiter Feedback')) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 text-sm font-bold shrink-0">
              ⚡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Industry Recruiter Feedback Loop Active
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  SIH 26044
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Actionable improvement recommendations automatically synthesized from your recent industry interview evaluation.
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.STUDENT_SKILL_GAP}
            className="text-xs font-semibold text-purple-300 hover:text-white underline underline-offset-4 self-start sm:self-auto shrink-0"
          >
            Inspect Feedback in Skill Gap ↗
          </Link>
        </div>
      )}

      {/* ── Progress Card & Summary HUD ───────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#0a0c13] border border-white/[0.08] space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold text-orange-400 uppercase tracking-wider">
              Overall Roadmap Execution
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">{progress}%</span>
              <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                ({completedTasks} of {totalTasks} milestones completed)
              </span>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              {completedTasks} Completed
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              {inProgressTasks} In Progress
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-xs font-semibold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              {notStartedTasks} Backlog
            </span>
          </div>
        </div>

        {/* Multi-gradient Progress Bar */}
        <div className="relative z-10 w-full h-3 rounded-full bg-zinc-900 border border-white/[0.06] overflow-hidden p-0.5">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#f97316] transition-all duration-700 ease-out shadow-sm"
          />
        </div>
      </div>

      {/* ── Filters & Controls Bar ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'ALL', label: `All Tasks (${totalTasks})` },
            { id: 'IN_PROGRESS', label: `In Progress (${inProgressTasks})` },
            { id: 'NOT_STARTED', label: `Backlog (${notStartedTasks})` },
            { id: 'COMPLETED', label: `Completed (${completedTasks})` },
            { id: 'HIGH_PRIORITY', label: 'High Priority' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeStatusFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Expand/Collapse All Button */}
        <button
          onClick={toggleAllPhases}
          className="text-xs text-zinc-400 hover:text-white transition-colors self-end sm:self-center font-medium font-mono"
        >
          {data.phases.every((p) => collapsedPhases[p.phaseId]) ? 'Expand All Phases' : 'Collapse All Phases'}
        </button>
      </div>

      {/* ── 6 Roadmap Phases Accordion ────────────────────────────── */}
      <div className="space-y-4">
        {filteredPhasesWithTasks.map((phase) => {
          const isCollapsed = !!collapsedPhases[phase.phaseId];
          const phaseCompleted = phase.completedTaskCount === phase.taskCount && phase.taskCount > 0;

          return (
            <div
              key={phase.phaseId}
              className="rounded-2xl bg-[#0f121d] border border-white/[0.08] overflow-hidden transition-all shadow-md"
            >
              {/* Phase Header Accordion Toggle */}
              <div
                onClick={() => togglePhase(phase.phaseId)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/25 text-xs font-black font-mono text-orange-400 flex items-center justify-center shrink-0">
                    P{phase.phaseNumber}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-white truncate">
                        {phase.title}
                      </h3>
                      {phaseCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          Phase Completed ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{phase.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 shrink-0">
                  <span className="text-xs font-mono font-semibold text-zinc-400">
                    {phase.completedTaskCount} / {phase.taskCount} tasks
                  </span>
                  <span className="p-1 rounded-lg text-zinc-400 hover:text-white">
                    <Icon
                      d={isCollapsed ? ICONS.chevronRight : ICONS.chevronDown}
                      size={16}
                    />
                  </span>
                </div>
              </div>

              {/* Phase Tasks List */}
              {!isCollapsed && (
                <div className="p-5 pt-1 space-y-3 border-t border-white/[0.04]">
                  {phase.tasks.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-xs text-zinc-500 font-medium">
                      No tasks matching the active filter in this phase.
                    </div>
                  ) : (
                    phase.tasks.map((task) => {
                      const priorityTheme = getPriorityBadge(task.priority);
                      const typeTheme = getTypeBadge(task.type);
                      const isCompleted = task.status === 'COMPLETED';
                      const isInProgress = task.status === 'IN_PROGRESS';

                      return (
                        <div
                          key={task.taskId}
                          onClick={() => setSelectedTask(task)}
                          className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                            isCompleted
                              ? 'bg-black/30 border-white/[0.04] opacity-75'
                              : isInProgress
                              ? 'bg-amber-500/[0.03] border-amber-500/25 hover:border-amber-500/40'
                              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14]'
                          }`}
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            {/* Interactive 3-State Checkbox */}
                            <button
                              onClick={(e) => {
                                const nextStatus =
                                  task.status === 'NOT_STARTED'
                                    ? 'IN_PROGRESS'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'COMPLETED'
                                    : 'NOT_STARTED';
                                handleStatusChange(task.taskId, nextStatus, e);
                              }}
                              disabled={updatingTaskId === task.taskId}
                              title={`Advance status (${task.status})`}
                              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-400 text-black shadow-sm shadow-emerald-500/30'
                                  : isInProgress
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                  : 'bg-zinc-900 border-zinc-700 hover:border-orange-500 text-transparent'
                              }`}
                            >
                              {updatingTaskId === task.taskId ? (
                                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : isCompleted ? (
                                <Icon d={ICONS.check} size={12} />
                              ) : isInProgress ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                              ) : null}
                            </button>

                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`text-[14px] sm:text-[15px] font-bold transition-colors ${
                                    isCompleted
                                      ? 'text-zinc-400 line-through'
                                      : 'text-white group-hover:text-orange-400'
                                  }`}
                                >
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${typeTheme.badge}`}>
                                  {typeTheme.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${priorityTheme.badge}`}>
                                  {priorityTheme.label}
                                </span>
                              </div>

                              <p className="text-xs text-zinc-300 line-clamp-1 leading-relaxed">
                                {task.description}
                              </p>

                              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Icon d={ICONS.clock} size={11} />
                                  {task.estimatedEffort}
                                </span>
                                {task.relatedSkill && (
                                  <span className="flex items-center gap-1">
                                    <Icon d={ICONS.tag} size={11} />
                                    {task.relatedSkill}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className="text-xs font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              View Task <Icon d={ICONS.arrow} size={11} />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Active Data Sources Telemetry Matrix ──────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0f121d] border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">Roadmap Synthesis Telemetry</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalized based on active capability telemetry without continuous external calls.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Last Updated: {new Date(data.updatedAt || data.generatedAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Icon d={ICONS.target} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Target Role</p>
              <p className="text-[11px] font-mono text-zinc-400 truncate">{targetRole}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Icon d={ICONS.gap} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Skill Gap</p>
              <p className="text-[11px] font-mono text-zinc-400">Active Baseline</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Icon d={ICONS.resume} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Resume Analyzer</p>
              <p className="text-[11px] font-mono text-zinc-400">Evidence Active</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Icon d={ICONS.dsa} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">DSA / GitHub</p>
              <p className="text-[11px] font-mono text-zinc-400">Synced Telemetry</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Journey Next Steps Card ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/20 via-[#0f121d] to-[#0d101a] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            Next In Your Career Journey
          </span>
          <h4 className="text-sm font-bold text-white">Turn Roadmap Milestones Into Verified Proof-of-Work</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Recruiters prioritize evidence over self-reported study. Build full-stack projects tailored to your target role and solve algorithmic problems to substantiate your competencies.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to={ROUTES.STUDENT_PROJECTS}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5"
          >
            <span>Projects Portfolio</span>
            <Icon d={ICONS.arrow} size={12} />
          </Link>
          <Link
            to={ROUTES.STUDENT_DSA}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
          >
            DSA Tracker
          </Link>
        </div>
      </div>

      {/* ── Task Detail Modal / Drawer ────────────────────────────── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-2xl bg-[#0d101a] border border-white/[0.12] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getTypeBadge(selectedTask.type).badge}`}>
                    {getTypeBadge(selectedTask.type).label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border ${getPriorityBadge(selectedTask.priority).badge}`}>
                    {getPriorityBadge(selectedTask.priority).label}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Phase {selectedTask.phaseNumber}: {selectedTask.phaseTitle}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {/* Description & Why It Matters */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400">
                  Task Overview
                </h5>
                <p className="text-zinc-200 leading-relaxed font-medium">{selectedTask.description}</p>
                {selectedTask.whyItMatters && (
                  <p className="text-zinc-400 pt-2 leading-relaxed border-t border-white/[0.04]">
                    <strong className="text-zinc-300">Recruiter context:</strong> {selectedTask.whyItMatters}
                  </p>
                )}
              </div>

              {/* Completion Criteria Checklist */}
              {selectedTask.completionCriteria?.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2.5">
                  <h5 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    Completion Criteria
                  </h5>
                  <ul className="space-y-2">
                    {selectedTask.completionCriteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-zinc-300 leading-snug">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] font-mono font-semibold uppercase text-zinc-500">Estimated Effort</span>
                  <p className="text-white font-mono font-bold mt-0.5">{selectedTask.estimatedEffort}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] font-mono font-semibold uppercase text-zinc-500">Related Competency</span>
                  <p className="text-white font-bold mt-0.5">{selectedTask.relatedSkill || 'General'}</p>
                </div>
              </div>

              {selectedTask.evidenceExpected && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5">
                    Expected Verification Evidence
                  </span>
                  <p className="leading-snug text-xs">{selectedTask.evidenceExpected}</p>
                </div>
              )}
            </div>

            {/* Status Switcher & Actions */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleStatusChange(selectedTask.taskId, 'NOT_STARTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
                    selectedTask.status === 'NOT_STARTED'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
                  }`}
                >
                  Backlog
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTask.taskId, 'IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
                    selectedTask.status === 'IN_PROGRESS'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTask.taskId, 'COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
                    selectedTask.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent'
                  }`}
                >
                  Completed ✓
                </button>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors self-end sm:self-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}