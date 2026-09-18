/**
 * CommandCenter.jsx — Personal Career Dashboard & Dynamic Portfolio Snapshot
 *
 * Route: /student/command-center
 * The primary student home for Career Odyssey.
 *
 * Visual & Structural Guidelines (Restrained & Professional Pass):
 * - RESTRICTED COLOR PALETTE: 85-90% neutral obsidian/dark surfaces (#090a0f, #0c0e14),
 *   white/off-white typography, muted zinc secondary text, CareerOdyssey Orange (#f97316)
 *   as the singular brand accent.
 * - ZERO RAINBOW EFFECT: Removed multi-color icons, glowing neon cards, and excessive colored pills.
 * - TRUE CAREER PROFILE: Clear student identity, target role, stage, and level without pill clutter.
 * - AUTHENTIC READINESS: Professional empty/baseline state ("Not assessed yet · Insufficient verified signals")
 *   when real data is insufficient, smoothly transitioning to numeric score when signals exist.
 * - DYNAMIC PORTFOLIO: Neutral evidence cards displaying projects, tech stacks, live links, and verified signals.
 */

import React, { useState, useEffect, Component } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getCommandCenter,
  refreshCommandCenter,
} from '../../api/commandCenter.api';
import { startTask } from '../../api/execution.api';
import { ROUTES } from '../../utils/constants';

/* ── Defensive Error Boundary ─────────────────────────────────── */

class CommandCenterErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CommandCenter error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 text-center bg-[#0c0e14] border border-white/[0.08] rounded-xl text-white">
          <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 flex items-center justify-center font-bold text-lg">
            !
          </div>
          <h2 className="text-base font-semibold text-zinc-200 mb-1.5">Display Error in Career Home</h2>
          <p className="text-zinc-400 text-xs mb-5 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering your career dashboard.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Skeletons ───────────────────────────────────────────────── */

function CommandCenterSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 animate-fadeIn">
      <div className="h-28 w-full rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="h-64 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          <div className="h-40 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          <div className="h-72 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="h-44 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          <div className="h-40 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
          <div className="h-48 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Career Odyssey Stage Map Helper ──────────────────────────── */

const CAREER_STAGES = [
  { id: 'FOUNDATION', label: 'Foundation' },
  { id: 'SKILLS', label: 'Skills' },
  { id: 'PROJECTS', label: 'Projects' },
  { id: 'PROOF', label: 'Proof' },
  { id: 'JOB_READY', label: 'Job Ready' },
];

function getStageIndex(stateKey) {
  const k = String(stateKey || '').toUpperCase();
  if (k.includes('FOUNDATION') || k.includes('EXPLOR')) return 0;
  if (k.includes('SKILL')) return 1;
  if (k.includes('PROJECT') || k.includes('PORTFOLIO')) return 2;
  if (k.includes('PROOF') || k.includes('VERIF') || k.includes('EVIDENCE')) return 3;
  if (k.includes('READY') || k.includes('APP') || k.includes('HIRED')) return 4;
  return 2;
}

/* ── Main Dashboard Component ────────────────────────────────── */

function CommandCenterContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState(null);
  const [error, setError] = useState(null);
  const [partialWarning, setPartialWarning] = useState(null);
  const [proofTab, setProofTab] = useState('projects'); // 'projects' | 'skills' | 'verification'

  const studentName = user?.name || 'Student';
  const userInitials = studentName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'CO';

  const fetchData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setPartialWarning(null);

      const res = forceRefresh
        ? await refreshCommandCenter()
        : await getCommandCenter();

      if (res && res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to sync career systems.');
      }
    } catch (err) {
      if (data) {
        setPartialWarning(err.message || 'Live synchronization temporarily delayed. Showing latest status.');
      } else {
        setError(err.message || 'Unable to connect to Career Command Center.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Execution task trigger for Next Best Action
  const handleStartTask = async (taskId, targetUrl) => {
    if (taskId) {
      try {
        setStartingTaskId(taskId);
        await startTask(taskId);
        navigate(ROUTES.STUDENT_EXECUTION);
      } catch {
        navigate(ROUTES.STUDENT_EXECUTION);
      } finally {
        setStartingTaskId(null);
      }
    } else if (targetUrl) {
      navigate(targetUrl);
    } else {
      navigate(ROUTES.STUDENT_ROADMAP);
    }
  };

  if (loading) {
    return <CommandCenterSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-[#0c0e14] border border-white/[0.08] rounded-xl text-white">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-base font-semibold text-zinc-200 mb-1.5">Command Center Offline</h2>
        <p className="text-zinc-400 text-xs mb-5 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const rawData = data || {};

  // 1. Career Overview & Identity
  const overview = rawData.overview || {};
  const targetRole = overview.targetRole || 'Software Engineer';
  const rawReadiness = overview.careerReadiness;
  const isReadinessAvailable = typeof rawReadiness === 'number' && !isNaN(rawReadiness);
  const careerReadinessScore = isReadinessAvailable ? rawReadiness : null;

  // Current Career Stage
  const currentState = rawData.currentState || {};
  const currentStateKey = currentState.state || 'PORTFOLIO_BUILDING';
  const currentStateTitle = (currentState.label || currentState.title || 'Building Portfolio').replace(/_/g, ' ');
  const currentStageIndex = getStageIndex(currentStateKey);

  // Trajectory
  const trajectory = rawData.trajectory || {};
  const trajectoryStatus = (trajectory.trajectoryStatus || 'STEADY').replace(/_/g, ' ');
  const trajectoryDelta = trajectory.trajectoryDelta ?? null;
  const isTrajectoryPositive = trajectoryDelta > 0 || trajectoryStatus === 'IMPROVING' || trajectoryStatus === 'ACCELERATING';
  const isTrajectoryDeclining = trajectoryDelta < 0 || trajectoryStatus === 'DECLINING';

  // 2. Pillars & Proof Breakdown
  const pillarsList = Array.isArray(rawData.pillars) ? rawData.pillars : [];
  const pillarsMap = pillarsList.reduce((acc, p) => {
    if (p && p.id) acc[p.id] = p;
    return acc;
  }, {});

  const skillsPillar = rawData.careerPillars?.skills || pillarsMap['skills'] || {};
  const portfolioPillar = rawData.careerPillars?.portfolio || pillarsMap['portfolio'] || {};
  const proofPillar = rawData.careerPillars?.proof || pillarsMap['proof'] || {};
  const executionPillar = rawData.careerPillars?.execution || pillarsMap['execution'] || {};

  const proofData = rawData.proof || {};
  const projectsList = rawData.projectsList || [];
  const skillsList = rawData.skillsList || [];
  const skillCoverage = rawData.skillCoverage ?? (typeof skillsPillar.score === 'number' ? skillsPillar.score : null);

  // 3. Primary Bottleneck
  const primaryBottleneck = trajectory.bottleneck || rawData.biggestGap || (rawData.risks && rawData.risks[0]) || null;
  const bottleneckTitle = primaryBottleneck?.name || primaryBottleneck?.title || 'Core Requirement Missing';
  const isBalancedProgression =
    bottleneckTitle.toLowerCase().includes('balanced progression') ||
    (primaryBottleneck?.description || '').toLowerCase().includes('no critical blockers');

  // 4. Strategic Next Best Action
  const isReminderAction = (action) => {
    if (!action) return false;
    const mod = (action.relatedModule || action.category || action.module || '').toLowerCase();
    const actType = (action.actionType || '').toUpperCase();
    const title = (action.title || '').toLowerCase();
    return mod === 'reminders' || actType === 'OPEN_REMINDERS' || title.includes('reminder');
  };

  let careerNba = null;
  if (rawData.nextBestAction && !isReminderAction(rawData.nextBestAction)) {
    careerNba = rawData.nextBestAction;
  } else {
    const candidate = (rawData.recommendations || []).find((a) => !isReminderAction(a));
    if (candidate) {
      careerNba = candidate;
    } else if (primaryBottleneck && !isBalancedProgression) {
      careerNba = {
        title: `Address Core Competency: ${bottleneckTitle}`,
        reason: primaryBottleneck.description || primaryBottleneck.reason || `High-impact milestone to unblock progression toward your ${targetRole} target.`,
        estimatedMinutes: 45,
        priority: 'HIGH',
        relatedModule: primaryBottleneck.category || 'Skill Gap',
        route: primaryBottleneck.fixAction?.route || ROUTES.STUDENT_SKILL_GAP,
      };
    } else {
      careerNba = {
        title: `Advance Milestones for ${targetRole}`,
        reason: 'Continue building verified competencies and project evidence aligned with your target career goal.',
        estimatedMinutes: 45,
        priority: 'HIGH',
        relatedModule: 'Roadmap',
        route: ROUTES.STUDENT_ROADMAP,
      };
    }
  }

  // 5. Overdue Reminder Attention (Secondary)
  let reminderData = null;
  if (isReminderAction(rawData.nextBestAction)) {
    const match = (rawData.nextBestAction.reason || '').match(/(\d+)\s+reminder/i);
    const count = match ? parseInt(match[1], 10) : 1;
    const topTitle = rawData.reminders?.overdueList?.[0]?.title || rawData.reminders?.highPriority?.[0]?.title || 'Update your career portfolio';
    reminderData = {
      overdueCount: count,
      title: topTitle,
      estimatedMinutes: rawData.nextBestAction.estimatedMinutes || 20,
    };
  } else if (rawData.reminders?.overdueCount > 0) {
    reminderData = {
      overdueCount: rawData.reminders.overdueCount,
      title: rawData.reminders?.overdueList?.[0]?.title || rawData.reminders?.highPriority?.[0]?.title || 'Update your career portfolio',
      estimatedMinutes: 20,
    };
  }

  // 6. Weekly Progress Execution
  const todayExecution = rawData.today || {};
  const weeklyStrategy = rawData.weeklyStrategy || {};
  const tasksCompleted = todayExecution.completedTasks ?? 0;
  const tasksPlanned = Math.max(tasksCompleted, todayExecution.plannedTasks ?? 5);
  const timeCompletedHrs = Number(((todayExecution.completedMinutes ?? 0) / 60).toFixed(1));
  const timeTargetHrs = weeklyStrategy.totalHours ?? 10;
  const consistencyScore = overview.consistencyScore;
  const isConsistencyNumeric = typeof consistencyScore === 'number' && !isNaN(consistencyScore);
  const consistencyDisplay = isConsistencyNumeric ? `${consistencyScore}%` : 'Insufficient data';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 text-white animate-fadeIn">
      {/* ── Stale warning toast if live sync delayed ── */}
      {partialWarning && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/[0.03] border border-amber-500/30 text-amber-300 text-xs">
          <span>{partialWarning}</span>
          <button
            onClick={() => setPartialWarning(null)}
            className="text-zinc-400 hover:text-white ml-3 font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SECTION 1 — STUDENT PROFESSIONAL IDENTITY / HERO
          Clean, authoritative identity section with restrained typography and zero pill clutter
         ═════════════════════════════════════════════════════════════ */}
      <section className="p-6 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-200 font-bold text-lg sm:text-xl font-mono shrink-0">
              {userInitials}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {studentName}
              </h1>

              <div className="text-sm font-medium text-zinc-300 mt-0.5">
                {targetRole}
              </div>

              {/* Clean typographic metadata without pill bubbles */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1.5 flex-wrap">
                <span>CSE Student</span>
                <span className="text-zinc-600" aria-hidden="true">•</span>
                <span>Level 4</span>
                <span className="text-zinc-600" aria-hidden="true">•</span>
                <span className="text-zinc-300">{currentStateTitle}</span>
                <span className="text-zinc-600" aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-zinc-500">Trajectory:</span>
                  <Link
                    to={ROUTES.STUDENT_CAREER_TRAJECTORY}
                    className="text-zinc-300 font-medium hover:text-white transition-colors"
                  >
                    {trajectoryStatus}
                    {trajectoryDelta !== null && trajectoryDelta !== 0 && (
                      <span className="ml-1 text-[11px] text-zinc-500">
                        ({trajectoryDelta > 0 ? `+${trajectoryDelta}` : trajectoryDelta} pts)
                      </span>
                    )}
                  </Link>
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>View Portfolio</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.STUDENT_PROFILE)}
              className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Edit Profile
            </button>

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="Sync career telemetry"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 2 — CAREER KPI ROW (Monochromatic, Reference-Inspired Cards)
          Neutral icon containers, clear numbers, unified visual language
         ═════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Career Readiness */}
        <div
          onClick={() => navigate(ROUTES.STUDENT_CAREER_SCORE)}
          className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Career Readiness
            </span>
            <span className="w-6 h-6 rounded-md bg-white/[0.03] text-zinc-400 border border-white/5 flex items-center justify-center text-xs">
              ↗
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {isReadinessAvailable ? `${careerReadinessScore}%` : 'Not assessed'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
              {isReadinessAvailable ? (
                <>
                  <span className="text-zinc-400">
                    {careerReadinessScore >= 80 ? 'Strong' : careerReadinessScore >= 60 ? 'Developing' : 'Building'}
                  </span>
                  <span>•</span>
                  <span>{trajectoryDelta && trajectoryDelta > 0 ? `+${trajectoryDelta} pts` : 'Stable'}</span>
                </>
              ) : (
                <span>Awaiting verified signals</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Career Level & Stage */}
        <div
          onClick={() => navigate(ROUTES.STUDENT_ROADMAP)}
          className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Career Level
            </span>
            <span className="w-6 h-6 rounded-md bg-white/[0.03] text-zinc-400 border border-white/5 flex items-center justify-center text-xs">
              ✦
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              Level 4
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
              <span className="text-zinc-400 truncate">{currentStateTitle}</span>
              <span>•</span>
              <span>Phase {proofData.roadmapProgress ? `${proofData.roadmapProgress}%` : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Skill Strength */}
        <div
          onClick={() => navigate(ROUTES.STUDENT_SKILL_GAP)}
          className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Skill Strength
            </span>
            <span className="w-6 h-6 rounded-md bg-white/[0.03] text-zinc-400 border border-white/5 flex items-center justify-center text-xs">
              ⚡
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {typeof skillCoverage === 'number' ? `${skillCoverage}%` : skillsList.length > 0 ? `${skillsList.length} Skills` : 'Pending'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
              <span className="text-zinc-400">
                {skillsList.length > 0 ? `${skillsList.length} catalogued` : 'Inspect gap'}
              </span>
              <span>•</span>
              <span>Core stack</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Career Proof */}
        <div
          onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
          className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] hover:border-white/20 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Career Proof
            </span>
            <span className="w-6 h-6 rounded-md bg-white/[0.03] text-zinc-400 border border-white/5 flex items-center justify-center text-xs">
              📄
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-white">
              {projectsList.length > 0 ? `${projectsList.length} Projects` : 'Building'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
              <span className="text-zinc-400">
                {proofData.githubConnected ? 'GitHub synced' : 'Proof ready'}
              </span>
              <span>•</span>
              <span>{proofData.resumeAts ? `${proofData.resumeAts} ATS` : 'ATS unverified'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          MAIN BALANCED DASHBOARD GRID (Asymmetric 2-Column Composition)
          Left Column (7 cols): Career Readiness, Odyssey Stepper, Portfolio & Proof
          Right Column (5 cols): Primary Bottleneck, Next Best Action, Reminders, Weekly Progress
         ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: Living Profile & Career Intelligence (~60% width) ── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* ═══════════════════════════════════════════════════════════
              SECTION 3 — CAREER READINESS (Major Visual Element)
              Clean, professional empty state when unassessed, monochromatic metric bars
             ═══════════════════════════════════════════════════════════ */}
          <section className="p-6 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Career Readiness Breakdown
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Multi-signal verification toward your {targetRole} standard
                </p>
              </div>

              <Link
                to={ROUTES.STUDENT_CAREER_SCORE}
                className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                Detailed Score →
              </Link>
            </div>

            {/* Split: Overall Score/Empty State + 6 Monochromatic Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mt-5 items-center">
              {/* Overall Readiness Card / Baseline State */}
              {isReadinessAvailable ? (
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-center">
                  <div className="text-4xl font-bold font-mono text-orange-400">
                    {careerReadinessScore}%
                  </div>
                  <span className="text-xs font-medium text-white mt-1.5">
                    {careerReadinessScore >= 80 ? 'Strong Alignment' : careerReadinessScore >= 60 ? 'Developing' : 'Building'}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 max-w-[130px] leading-tight">
                    Multi-signal career health score
                  </span>
                </div>
              ) : (
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-center">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] text-zinc-400 border border-white/5 flex items-center justify-center text-sm mb-2">
                    ◎
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">
                    Not assessed yet
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1 max-w-[130px] leading-tight">
                    Insufficient verified signals
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.STUDENT_CAREER_SCORE)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Build Profile →
                  </button>
                </div>
              )}

              {/* 6 Monochromatic Competency Bars (No rainbow fills) */}
              <div className="sm:col-span-8 flex flex-col gap-3">
                {/* 1. Technical Skills */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Technical Skills Coverage</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {typeof skillCoverage === 'number' ? `${skillCoverage}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${typeof skillCoverage === 'number' ? Math.min(100, Math.max(0, skillCoverage)) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. Portfolio Projects */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Portfolio Projects Evidence</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {typeof portfolioPillar.score === 'number' ? `${portfolioPillar.score}%` : projectsList.length > 0 ? `${projectsList.length} logged` : '0%'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${typeof portfolioPillar.score === 'number' ? Math.min(100, Math.max(0, portfolioPillar.score)) : projectsList.length > 0 ? 30 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 3. Resume ATS */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Resume ATS Alignment</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {proofData.resumeAts ? `${proofData.resumeAts}%` : 'Upload required'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${proofData.resumeAts || 0}%` }}
                    />
                  </div>
                </div>

                {/* 4. GitHub Code Proof */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">GitHub Verified Code</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {proofData.githubConnected ? `${proofData.githubRepos} repos` : 'Not connected'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${proofData.githubConnected ? 80 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 5. DSA & Problem Solving */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">DSA & Problem Solving</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {proofData.dsaConnected ? `${proofData.dsaSolved} solved` : proofData.dsaSolved > 0 ? `${proofData.dsaSolved} solved` : 'Not connected'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((proofData.dsaSolved / 150) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 6. Execution Cadence */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Execution Cadence</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {typeof executionPillar.score === 'number' ? `${executionPillar.score}%` : consistencyDisplay}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                      style={{ width: `${typeof executionPillar.score === 'number' ? Math.min(100, Math.max(0, executionPillar.score)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 4 — CAREER ODYSSEY JOURNEY (Brand Stepper)
              Clean neutral steps with orange indicating active position
             ═══════════════════════════════════════════════════════════ */}
          <section className="p-6 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Career Odyssey Journey
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your structured progression toward job readiness
                </p>
              </div>

              <Link
                to={ROUTES.STUDENT_ROADMAP}
                className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                Roadmap Milestones →
              </Link>
            </div>

            {/* Stepper Dots & Stage Names */}
            <div className="grid grid-cols-5 gap-2 text-center my-2">
              {CAREER_STAGES.map((st, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={st.id} className="flex flex-col items-center gap-1.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                          : isPassed
                          ? 'bg-white/[0.05] text-zinc-300 border border-white/10'
                          : 'bg-white/[0.02] text-zinc-600 border border-white/[0.04]'
                      }`}
                    >
                      {isPassed ? '✓' : isCurrent ? '●' : idx + 1}
                    </div>
                    <span
                      className={`text-xs truncate w-full ${
                        isCurrent ? 'text-orange-400 font-semibold' : isPassed ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {st.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contextual Career Journey Reason */}
            <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-zinc-400 flex items-center justify-between gap-3">
              <span>
                You are currently in <strong className="text-zinc-200 font-medium">{currentStateTitle}</strong>. Build verified project evidence to advance to Proof Verification.
              </span>
              <button
                type="button"
                onClick={() => navigate(ROUTES.STUDENT_ROADMAP)}
                className="text-orange-400 hover:text-orange-300 font-medium text-xs shrink-0 cursor-pointer"
              >
                Track →
              </button>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 5 — CAREER PROOF & PORTFOLIO SNAPSHOT
              Quiet, structured evidence display without garish badges
             ═══════════════════════════════════════════════════════════ */}
          <section className="p-6 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Career Proof & Evidence
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verified artifacts and external technical signals
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProofTab('projects')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    proofTab === 'projects'
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Projects ({projectsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProofTab('skills')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    proofTab === 'skills'
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Skills ({skillsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProofTab('verification')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    proofTab === 'verification'
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Verification
                </button>
              </div>
            </div>

            {/* Proof Tab 1: Projects Showcase */}
            {proofTab === 'projects' && (
              <div className="mt-4 space-y-2.5">
                {projectsList.length > 0 ? (
                  projectsList.slice(0, 4).map((proj) => (
                    <div
                      key={proj.id || proj._id}
                      onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
                      className="p-3.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                            {proj.title}
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            {proj.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        {/* Tech Stack Pills (Monochromatic) */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {(proj.techStack || []).slice(0, 4).map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] font-mono text-zinc-400 border border-white/5"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Neutral Links */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-zinc-400">
                        {proj.hasLiveUrl && (
                          <span className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                            🔗 Live Demo
                          </span>
                        )}
                        {proj.hasGithub && (
                          <span className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                            🐙 Code
                          </span>
                        )}
                        <span className="text-zinc-600 group-hover:text-zinc-300">→</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-7 text-center bg-white/[0.01] rounded-lg border border-dashed border-white/10">
                    <p className="text-xs text-zinc-400">No portfolio projects catalogued yet.</p>
                    <button
                      onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
                      className="mt-1.5 text-xs text-orange-400 font-medium hover:underline cursor-pointer"
                    >
                      Add project blueprint →
                    </button>
                  </div>
                )}

                <div className="pt-2 text-right">
                  <Link
                    to={ROUTES.STUDENT_PROJECTS}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    View All Projects ({projectsList.length}) →
                  </Link>
                </div>
              </div>
            )}

            {/* Proof Tab 2: Skills Evidence */}
            {proofTab === 'skills' && (
              <div className="mt-4">
                {skillsList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {skillsList.slice(0, 9).map((sk, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-zinc-200 truncate">{sk.name}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">
                          {sk.level || 'Intermediate'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-7 text-center bg-white/[0.01] rounded-lg border border-dashed border-white/10">
                    <p className="text-xs text-zinc-400">No verified skills profile recorded.</p>
                    <button
                      onClick={() => navigate(ROUTES.STUDENT_SKILLS)}
                      className="mt-1.5 text-xs text-orange-400 font-medium hover:underline cursor-pointer"
                    >
                      Complete Skills Assessment →
                    </button>
                  </div>
                )}

                <div className="pt-2.5 text-right">
                  <Link
                    to={ROUTES.STUDENT_SKILLS}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Explore Complete Inventory →
                  </Link>
                </div>
              </div>
            )}

            {/* Proof Tab 3: External Signals Verification */}
            {proofTab === 'verification' && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">Resume ATS</span>
                    <span className="text-[11px] text-zinc-500">
                      {proofData.resumeAts ? `${proofData.resumeAts}/100 score` : 'Not uploaded'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_RESUME)}
                    className="text-xs font-medium text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {proofData.resumeAts ? 'Inspect' : 'Upload'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">GitHub Profile</span>
                    <span className="text-[11px] text-zinc-500">
                      {proofData.githubConnected ? `@${proofData.githubUsername || 'connected'}` : 'Not connected'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_GITHUB)}
                    className="text-xs font-medium text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {proofData.githubConnected ? 'Synced' : 'Connect'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">LeetCode / DSA</span>
                    <span className="text-[11px] text-zinc-500">
                      {proofData.dsaSolved > 0 ? `${proofData.dsaSolved} solved` : 'Not linked'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_DSA)}
                    className="text-xs font-medium text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {proofData.dsaSolved > 0 ? 'Practice' : 'Link'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">Deployments</span>
                    <span className="text-[11px] text-zinc-500">
                      {projectsList.filter((p) => p.hasLiveUrl).length} live URLs
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
                    className="text-xs font-medium text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    Deploy
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT COLUMN: Strategic Intelligence, Actions & Execution (~40% width) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* ═══════════════════════════════════════════════════════════
              SECTION 6 — PRIMARY BOTTLENECK (Career Intelligence Block)
              Calm, restrained container with clear diagnostic messaging
             ═══════════════════════════════════════════════════════════ */}
          {primaryBottleneck && (
            <section className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05]">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Career Intelligence
                </span>
                <span className={`text-[11px] font-medium ${isBalancedProgression ? 'text-zinc-400' : 'text-amber-400/90'}`}>
                  {isBalancedProgression ? 'On Track' : 'Attention Required'}
                </span>
              </div>

              <div className="mt-1.5">
                <h3 className="text-sm font-semibold text-zinc-200 leading-snug">
                  {bottleneckTitle}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {primaryBottleneck.description || primaryBottleneck.reason || 'Address this requirement to advance your readiness toward the next milestone.'}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Actionable Resolution</span>
                <button
                  type="button"
                  onClick={() => {
                    const target =
                      primaryBottleneck.fixAction?.route ||
                      primaryBottleneck.action?.route ||
                      ROUTES.STUDENT_SKILL_GAP;
                    navigate(target);
                  }}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  Resolve Gap →
                </button>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SECTION 7 — NEXT BEST ACTION (Strategic Guidance Card)
              Compact, single clear orange CTA button
             ═══════════════════════════════════════════════════════════ */}
          <section className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05]">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Next Best Action
                </span>
                <span className="text-[11px] text-zinc-500">
                  High Impact
                </span>
              </div>

              <h3 className="text-sm font-semibold text-zinc-200 mt-1 leading-snug">
                {careerNba?.title || 'Prioritize High Impact Career Tasks'}
              </h3>

              <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                {careerNba?.reason || 'Recommended by Career Intelligence based on your target role milestones.'}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-2.5">
                <span>⏱ {careerNba?.estimatedMinutes || 30} min</span>
                <span>•</span>
                <span>{careerNba?.relatedModule || 'Strategy'}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(ROUTES.STUDENT_EXECUTION)}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Daily Planner
              </button>

              <button
                type="button"
                onClick={() => handleStartTask(careerNba?.taskId, careerNba?.route)}
                disabled={startingTaskId === careerNba?.taskId}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {startingTaskId === careerNba?.taskId ? 'Starting...' : 'Start Action →'}
              </button>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 8 — SECONDARY OVERDUE REMINDER NOTICE
              Quiet 1-line amber notice only rendered if overdue items exist
             ═══════════════════════════════════════════════════════════ */}
          {reminderData && reminderData.overdueCount > 0 && (
            <section className="px-3.5 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.07] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-amber-400 font-bold" aria-hidden="true">•</span>
                <span className="text-zinc-300 font-medium truncate">
                  <strong className="text-amber-300 font-medium">{reminderData.overdueCount} overdue</strong> · {reminderData.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.STUDENT_REMINDERS)}
                className="text-xs font-medium text-orange-400 hover:text-orange-300 shrink-0 cursor-pointer"
              >
                Open →
              </button>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SECTION 9 — WEEKLY EXECUTION OVERVIEW
              Neutral execution summary with quiet 7-day dots
             ═══════════════════════════════════════════════════════════ */}
          <section className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.05]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Weekly Execution
              </span>
              <Link
                to={ROUTES.STUDENT_EXECUTION}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Pacing →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center my-2">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase block">Tasks</span>
                <span className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 block">
                  {tasksCompleted} / {tasksPlanned}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase block">Focus</span>
                <span className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 block">
                  {timeCompletedHrs}h / {timeTargetHrs}h
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 uppercase block">Consistency</span>
                <span className="text-sm font-semibold font-mono text-zinc-200 mt-0.5 block">
                  {consistencyDisplay}
                </span>
              </div>
            </div>

            {/* 7-Day Cadence Rhythm (Muted dots) */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                7-Day Cadence
              </span>
              <div className="flex items-center gap-1.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dIdx) => {
                  const todayIdx = (new Date().getDay() + 6) % 7;
                  const isPastOrToday = dIdx <= todayIdx;
                  const isToday = dIdx === todayIdx;
                  return (
                    <div key={dIdx} className="flex flex-col items-center gap-1">
                      <span className="text-[8px] text-zinc-500 font-mono">{day}</span>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          isToday
                            ? 'ring-1 ring-orange-500 text-orange-400 bg-orange-500/10 font-bold'
                            : isPastOrToday
                            ? 'bg-white/10 text-zinc-300'
                            : 'bg-white/[0.02] text-zinc-600'
                        }`}
                      >
                        {isPastOrToday && !isToday ? '✓' : isToday ? '•' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 10 — ASK CAREER COPILOT (AI Advisory Layer)
          Quiet, neutral inquiry chips
         ═════════════════════════════════════════════════════════════ */}
      <section className="p-5 rounded-xl bg-[#0c0e14] border border-white/[0.07] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Ask Career Copilot
            </h2>
            <span className="text-[11px] text-zinc-500">
              AI Advisory Studio
            </span>
          </div>

          <Link
            to={ROUTES.STUDENT_COPILOT}
            className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>Open Studio</span>
            <span>→</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'What should I do today?',
            'Why am I not job ready?',
            'What skill should I learn next?',
            'How can I improve my resume?',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`${ROUTES.STUDENT_COPILOT}?prompt=${encodeURIComponent(prompt)}`)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-normal text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CommandCenter() {
  return (
    <CommandCenterErrorBoundary>
      <CommandCenterContent />
    </CommandCenterErrorBoundary>
  );
}
