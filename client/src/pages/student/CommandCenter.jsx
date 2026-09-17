/**
 * CommandCenter.jsx — Executive Career Operating System (Phase 8 Consolidated UX)
 *
 * Route: /student/command-center
 * Primary student home for Career Odyssey.
 *
 * Core Questions Answered:
 * 1. WHERE AM I? (Clean Executive Header with Goal, Stage, Readiness & Trajectory)
 * 2. WHAT SHOULD I DO NOW? (Dominant "DO THIS NEXT" focal action card)
 * 3. WHAT IS BLOCKING ME? (Single primary bottleneck with direct resolution action)
 * 4. HOW AM I DOING THIS WEEK? (Simple weekly progress with consistency bar)
 * 5. WHAT CHANGED? (Meaningful progress deltas without micro-noise)
 *
 * Plus:
 * - Four Core Hub Cards (Career, Build, Proof, Opportunities) with dual primary & secondary quick links
 * - Career Copilot natural language chips
 * - Direct executive jump pills (Analytics, Trajectory, Settings, Overview Hub)
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
import BrandLogo from '../../components/common/BrandLogo';
import ProgressBar from '../../components/common/ProgressBar';
import StatusBadge from '../../components/common/StatusBadge';
import ActionCard from '../../components/common/ActionCard';
import SectionHeader from '../../components/common/SectionHeader';

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
        <div className="max-w-xl mx-auto my-16 p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-white">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-rose-400 mb-2">Display Error in Command Center</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering your dashboard.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 bg-white/[0.05] rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-white/[0.03] rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-white/[0.05] rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-white/[0.05] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-48 w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />

      {/* Bottleneck skeleton */}
      <div className="h-28 w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />

      {/* Weekly + What Changed split skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
      </div>

      {/* 4 Hubs skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ── Route Helper ────────────────────────────────────────────── */

const getModuleRoute = (mod) => {
  const m = String(mod || '').toLowerCase();
  if (m.includes('resume')) return ROUTES.STUDENT_RESUME;
  if (m.includes('skill')) return ROUTES.STUDENT_SKILL_GAP;
  if (m.includes('project')) return ROUTES.STUDENT_PROJECTS;
  if (m.includes('dsa') || m.includes('leetcode')) return ROUTES.STUDENT_DSA;
  if (m.includes('road')) return ROUTES.STUDENT_ROADMAP;
  if (m.includes('app')) return ROUTES.STUDENT_APPLICATIONS;
  if (m.includes('exec') || m.includes('plan')) return ROUTES.STUDENT_EXECUTION;
  if (m.includes('goal')) return ROUTES.STUDENT_CAREER_GOAL;
  if (m.includes('git')) return ROUTES.STUDENT_GITHUB;
  if (m.includes('traj')) return ROUTES.STUDENT_CAREER_TRAJECTORY;
  if (m.includes('setting')) return ROUTES.STUDENT_SETTINGS;
  return ROUTES.STUDENT_COMMAND_CENTER;
};

/* ── Main Component ─────────────────────────────────────────── */

function CommandCenterContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState(null);
  const [error, setError] = useState(null);
  const [partialWarning, setPartialWarning] = useState(null);
  const [showAllBlockers, setShowAllBlockers] = useState(false);
  const [activeSecondarySection, setActiveSecondarySection] = useState('sprint'); // 'sprint' | 'trajectory' | 'pillars' | 'all'

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Student';

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

  // Execution task trigger
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
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl">
          !
        </div>
        <h2 className="text-lg font-bold text-rose-400 mb-2">Command Center Offline</h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const rawData = data || {};

  // 1. Where am I? (Overview / Career Context)
  const overview = rawData.overview || rawData.contextSummary || {};
  const careerHealthScore = overview.careerReadiness ?? overview.overallCareerReadiness ?? null;
  const targetRole = overview.targetRole || 'Software Engineer';

  // Current State
  const currentState = rawData.currentState || {};
  const currentStateKey = currentState.state || 'BUILDING_FOUNDATION';
  const currentStateTitle = (currentState.label || currentState.title || 'Building Foundation').replace(/_/g, ' ');

  // Trajectory
  const trajectory = rawData.trajectory || {};
  const trajectoryStatus = (trajectory.trajectoryStatus || 'STEADY').replace(/_/g, ' ');
  const trajectoryDelta = trajectory.trajectoryDelta ?? null;
  const isTrajectoryPositive = trajectoryDelta > 0 || trajectoryStatus === 'IMPROVING' || trajectoryStatus === 'ACCELERATING';
  const isTrajectoryDeclining = trajectoryDelta < 0 || trajectoryStatus === 'DECLINING';

  // 2. What should I do now? (Next Best Action)
  const nextBestAction = rawData.nextBestAction || null;
  const nbaModule = (
    nextBestAction?.relatedModule ||
    nextBestAction?.category ||
    nextBestAction?.module ||
    'Strategy'
  );
  const nbaActionType = nextBestAction?.actionType;
  const nbaRoute = nextBestAction?.route || nextBestAction?.targetUrl || (nbaModule === 'Strategy' ? ROUTES.STUDENT_ROADMAP : `/student/${nbaModule.toLowerCase().replace(/\s+/g, '-')}`);
  const nbaTaskId = nextBestAction?.taskId;
  const nbaTitle = nextBestAction?.title || 'Prioritize High Impact Career Tasks';
  const nbaReason = nextBestAction?.reason || nextBestAction?.reasoning || 'Recommended by Career Intelligence.';
  const nbaMinutes = nextBestAction?.estimatedMinutes || 45;
  const nbaPriority = nextBestAction?.priority || 'HIGH';

  // 3. What is blocking me? (Single Primary Bottleneck)
  const primaryBottleneck = trajectory.bottleneck || rawData.biggestGap || (rawData.risks && rawData.risks[0]) || null;
  const secondaryRisks = (rawData.risks || []).filter(
    (r) => !primaryBottleneck || r.title !== primaryBottleneck.title
  );

  // 4. How am I doing this week? (Weekly Progress)
  const todayExecution = rawData.today || rawData.todayExecution || {};
  const weeklyStrategy = rawData.weeklyStrategy || {};
  const tasksCompleted = todayExecution.completedTasks ?? 0;
  const tasksPlanned = Math.max(tasksCompleted, todayExecution.plannedTasks ?? 5);
  const timeCompletedHrs = Number(((todayExecution.completedMinutes ?? 0) / 60).toFixed(1));
  const timeTargetHrs = weeklyStrategy.totalHours ?? 10;

  // Sanitize consistency score — prevent invented values and raw 'INSUFFICIENT_DATA%' display
  const rawConsistency = overview.consistencyScore;
  const isConsistencyNumeric = typeof rawConsistency === 'number' && !isNaN(rawConsistency);
  const consistencyScoreDisplay = isConsistencyNumeric
    ? `${rawConsistency}%`
    : (rawConsistency && rawConsistency !== 'INSUFFICIENT_DATA')
    ? `${rawConsistency}%`
    : 'Insufficient data';
  const consistencyScoreLabel = 'Consistency';

  // Format bottleneck helper
  const bottleneckTitle = primaryBottleneck?.name || primaryBottleneck?.title || 'Core Requirement Missing';
  const isBalancedProgression =
    bottleneckTitle.toLowerCase().includes('balanced progression') ||
    (primaryBottleneck?.description || '').toLowerCase().includes('no critical blockers');

  const getBottleneckButtonLabel = () => {
    if (isBalancedProgression) return 'View Milestones →';
    const action = primaryBottleneck?.recommendedAction || primaryBottleneck?.fixAction?.label;
    if (!action) return 'Resolve Blocker →';
    if (action.length > 22) return 'Resolve Blocker →';
    return `${action} →`;
  };

  // 5. What changed? (Meaningful Deltas)
  const trends = rawData.trends || {};
  const deltas = trends.deltas || {};
  const hasHistory = trends.status && trends.status !== 'INSUFFICIENT_DATA' && Boolean(deltas && Object.keys(deltas).length > 0);

  // 6. Four Core Areas
  const pillarsList = Array.isArray(rawData.pillars) ? rawData.pillars : [];
  const pillarsMap = pillarsList.reduce((acc, p) => {
    if (p && p.id) acc[p.id] = p;
    return acc;
  }, {});

  const skillsPillar = rawData.careerPillars?.skills || pillarsMap['skills'] || {};
  const portfolioPillar = rawData.careerPillars?.portfolio || pillarsMap['portfolio'] || {};
  const proofPillar = rawData.careerPillars?.proof || pillarsMap['proof'] || {};
  const portfolioData = rawData.portfolio || rawData.pulse?.portfolio || {};
  const applicationsData = rawData.applications || rawData.pulse?.applications || {};

  const totalProjectsCount = portfolioData.totalProjects ?? portfolioPillar.totalProjects ?? 0;
  const deployedProjectsCount = portfolioData.deployed ?? portfolioPillar.deployedCount ?? 0;
  const isGithubConnected = portfolioData.hasGithub || (portfolioPillar.githubVerifiedCount > 0);
  const totalAppsCount = applicationsData.total ?? 0;
  const inFlightAppsCount = applicationsData.active ?? applicationsData.inFlight ?? 0;
  const upcomingInterviewsCount = applicationsData.interviews ?? applicationsData.upcomingInterviews ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 text-white animate-fadeIn">
      {/* ── Stale warning toast if live sync delayed ── */}
      {partialWarning && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs">
          <span>{partialWarning}</span>
          <button
            onClick={() => setPartialWarning(null)}
            className="text-amber-400 hover:text-white ml-3 font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 1. WHERE AM I? (Executive Header — Spacious 2-Tier Layout) ── */}
      <section className="flex flex-col gap-3.5 border-b border-white/[0.08] pb-5">
        {/* Tier 1: Title Greeting & Primary Operational Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {getGreeting()}, {studentFirstName}.
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-orange-400 bg-orange-500/10 border border-orange-500/25">
              Executive Cockpit
            </span>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer ml-1 sm:ml-2"
              title="Sync metrics"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Spacious Metadata Strip */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-zinc-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400">Career Goal:</span>
            <span
              className="text-white font-semibold hover:text-orange-400 cursor-pointer transition-colors"
              onClick={() => navigate(ROUTES.STUDENT_CAREER_GOAL)}
            >
              {targetRole}
            </span>
          </span>

          <span className="text-zinc-400 hidden sm:inline" aria-hidden="true">•</span>

          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400">Stage:</span>
            <StatusBadge
              label={currentStateTitle}
              variant={currentStateKey.includes('READY') ? 'success' : 'primary'}
              size="xs"
            />
          </span>

          <span className="text-zinc-400 hidden sm:inline" aria-hidden="true">•</span>

          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400">Readiness:</span>
            <span
              onClick={() => navigate(ROUTES.STUDENT_CAREER_SCORE)}
              className="text-orange-400 font-bold hover:underline cursor-pointer"
              title="View Readiness Score Breakdown"
            >
              {careerHealthScore !== null && careerHealthScore !== undefined ? `${careerHealthScore} / 100` : 'Insufficient data'}
            </span>
          </span>

          <span className="text-zinc-400 hidden sm:inline" aria-hidden="true">•</span>

          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400">Trajectory:</span>
            <span
              onClick={() => navigate(ROUTES.STUDENT_CAREER_TRAJECTORY)}
              className={`font-bold flex items-center gap-1 cursor-pointer hover:underline ${
                isTrajectoryPositive
                  ? 'text-emerald-400'
                  : isTrajectoryDeclining
                  ? 'text-rose-400'
                  : 'text-zinc-300'
              }`}
            >
              <span>{isTrajectoryPositive ? '↑' : isTrajectoryDeclining ? '↓' : '→'}</span>
              <span>{trajectoryStatus}</span>
              {trajectoryDelta !== null && trajectoryDelta !== 0 && (
                <span className="text-[10px] opacity-80">
                  ({trajectoryDelta > 0 ? `+${trajectoryDelta}` : trajectoryDelta} pts)
                </span>
              )}
            </span>
          </span>
        </div>
      </section>

      {/* ── 2. WHAT SHOULD I DO NOW? (Primary Hero Action Card) ── */}
      {nextBestAction ? (
        <ActionCard
          tag="🎯 DO THIS NEXT"
          origin={nbaModule}
          title={nbaTitle}
          minutes={nbaMinutes}
          impact={nbaPriority}
          reason={nbaReason}
          primaryCtaText={nbaActionType === 'START_EXECUTION_TASK' ? 'START TASK' : `OPEN ${String(nbaModule).toUpperCase()}`}
          onPrimaryCta={() => handleStartTask(nbaTaskId, nbaRoute)}
          secondaryCtaText="Open Daily Planner"
          onSecondaryCta={() => navigate(ROUTES.STUDENT_EXECUTION)}
          loading={startingTaskId === nbaTaskId}
        />
      ) : (
        <ActionCard
          tag="🎯 NEXT STEP"
          title="Set your career goal to unlock your personalized plan."
          reason="Career Odyssey needs your target role and domain to generate high-leverage recommendations."
          primaryCtaText="SET CAREER GOAL"
          onPrimaryCta={() => navigate(ROUTES.STUDENT_CAREER_GOAL)}
        />
      )}

      {/* ── 3. WHAT IS BLOCKING ME? (Single Primary Bottleneck Card) ── */}
      {primaryBottleneck && (
        <section
          className={`p-5 rounded-2xl relative overflow-hidden transition-all duration-300 border backdrop-blur-md shadow-xl ${
            isBalancedProgression
              ? 'bg-gradient-to-r from-emerald-950/20 via-[#0d101a] to-[#07090e] border-emerald-500/30'
              : 'bg-gradient-to-r from-amber-950/20 via-[#0d101a] to-[#07090e] border-amber-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-inner ${
                  isBalancedProgression
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isBalancedProgression ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold tracking-wide ${
                      isBalancedProgression ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isBalancedProgression ? 'System Cadence' : 'Primary Bottleneck'}
                  </span>
                  <StatusBadge
                    label={isBalancedProgression ? 'ON TRACK' : (primaryBottleneck.severity || 'ATTENTION')}
                    variant={isBalancedProgression ? 'success' : 'danger'}
                    size="xs"
                  />
                </div>

                <h2 className="text-base font-bold text-white mt-0.5">
                  {bottleneckTitle}
                </h2>

                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  {primaryBottleneck.description || primaryBottleneck.reason || primaryBottleneck.detail || 'Address this constraint to unblock progression toward the next milestone.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const target =
                  primaryBottleneck.fixAction?.route ||
                  primaryBottleneck.action?.route ||
                  primaryBottleneck.deepLink ||
                  getModuleRoute(primaryBottleneck.category || primaryBottleneck.area);
                navigate(target);
              }}
              className="shrink-0 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer self-start sm:self-auto border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white shadow-sm active:scale-95"
            >
              {getBottleneckButtonLabel()}
            </button>
          </div>

          {/* Progressive disclosure for secondary risks */}
          {secondaryRisks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowAllBlockers(!showAllBlockers)}
                className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showAllBlockers ? '▲ Hide secondary blockers' : `▼ View ${secondaryRisks.length} other potential blockers`}</span>
              </button>

              {showAllBlockers && (
                <div className="mt-3 flex flex-col gap-2">
                  {secondaryRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/30 border border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-300 block truncate">{risk.title}</span>
                        <span className="text-xs text-zinc-400 truncate block">{risk.reason || risk.detail}</span>
                      </div>
                      <button
                        onClick={() => navigate(risk.action?.route || risk.deepLink || ROUTES.STUDENT_ROADMAP)}
                        className="shrink-0 text-orange-400 hover:text-white font-semibold"
                      >
                        Resolve →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Progressive Disclosure Controls: Connected Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-white/[0.1] -mb-px flex-wrap gap-2">
        <div className="flex items-center gap-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSecondarySection === 'sprint'}
            onClick={() => setActiveSecondarySection('sprint')}
            className={`px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer border-b-2 ${
              activeSecondarySection === 'sprint'
                ? 'border-orange-500 text-orange-400 bg-white/[0.02]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Weekly Sprint & Habits
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSecondarySection === 'trajectory'}
            onClick={() => setActiveSecondarySection('trajectory')}
            className={`px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer border-b-2 ${
              activeSecondarySection === 'trajectory'
                ? 'border-orange-500 text-orange-400 bg-white/[0.02]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Trajectory & Deltas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSecondarySection === 'pillars'}
            onClick={() => setActiveSecondarySection('pillars')}
            className={`px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer border-b-2 ${
              activeSecondarySection === 'pillars'
                ? 'border-orange-500 text-orange-400 bg-white/[0.02]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Core Career Pillars
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveSecondarySection(activeSecondarySection === 'all' ? 'sprint' : 'all')}
          className="text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer py-2"
        >
          {activeSecondarySection === 'all' ? '− Collapse to Tabs' : '+ Expand All Insights'}
        </button>
      </div>

      {/* ── 4. Split Row: HOW AM I DOING THIS WEEK? & WHAT CHANGED? ── */}
      {(activeSecondarySection === 'all' || activeSecondarySection === 'sprint' || activeSecondarySection === 'trajectory') && (
        <section className={`grid gap-5 ${activeSecondarySection === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Weekly Progress Card */}
          {(activeSecondarySection === 'all' || activeSecondarySection === 'sprint') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0d101a] border border-white/[0.08] flex flex-col justify-between shadow-xl backdrop-blur-md">
              <div>
                <SectionHeader
                  title="THIS WEEK"
                  subtitle="Daily execution consistency and habit pacing"
                  actionLabel="VIEW PROGRESS"
                  actionTo={ROUTES.STUDENT_EXECUTION}
                />

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide block">Tasks</span>
                    <span className="text-base font-bold text-white mt-0.5 block font-mono">
                      {tasksCompleted} / {tasksPlanned}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide block">Focus Time</span>
                    <span className="text-base font-bold text-white mt-0.5 block font-mono">
                      {timeCompletedHrs} / {timeTargetHrs}h
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide block truncate">
                      {consistencyScoreLabel}
                    </span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block font-mono">
                      {consistencyScoreDisplay}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={tasksCompleted}
                  max={tasksPlanned}
                  tone="emerald"
                  height="h-2"
                  showLabel
                  label="Weekly Goal Velocity"
                />

                {/* 7-Day Habit Tracker Rhythm */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    7-Day Cadence
                  </span>
                  <div className="flex items-center gap-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dIdx) => {
                      const todayIdx = (new Date().getDay() + 6) % 7; // Monday=0
                      const isPastOrToday = dIdx <= todayIdx;
                      const isToday = dIdx === todayIdx;
                      return (
                        <div key={dIdx} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-zinc-400 font-mono font-bold">{day}</span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isToday
                                ? 'bg-orange-500 text-zinc-950 shadow-[0_0_10px_#f97316] ring-2 ring-orange-500/30'
                                : isPastOrToday
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-zinc-400 border border-white/5'
                            }`}
                          >
                            {isPastOrToday && !isToday ? '✓' : isToday ? '•' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* What Changed Card */}
          {(activeSecondarySection === 'all' || activeSecondarySection === 'trajectory') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0d101a] border border-white/[0.08] flex flex-col justify-between shadow-xl backdrop-blur-md">
              <div>
                <SectionHeader
                  title="WHAT CHANGED"
                  subtitle="Meaningful progress deltas this period"
                  actionLabel="VIEW TRAJECTORY"
                  actionTo={ROUTES.STUDENT_CAREER_TRAJECTORY}
                />

                {hasHistory ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                      <span className="text-[10px] text-zinc-400 uppercase block">Career Readiness</span>
                      <span className={`text-base font-bold mt-0.5 block ${(deltas.careerReadiness ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(deltas.careerReadiness ?? 0) > 0 ? `+${deltas.careerReadiness}` : deltas.careerReadiness ?? 0} pts
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                      <span className="text-[10px] text-zinc-400 uppercase block">Skill Coverage</span>
                      <span className={`text-base font-bold mt-0.5 block ${(deltas.skillCoverage ?? deltas.skillsPillar ?? 0) >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {(deltas.skillCoverage ?? deltas.skillsPillar ?? 0) > 0 ? `+${deltas.skillCoverage ?? deltas.skillsPillar}` : (deltas.skillCoverage ?? deltas.skillsPillar ?? 0)} pts
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                      <span className="text-[10px] text-zinc-400 uppercase block">Project Evidence</span>
                      <span className={`text-base font-bold mt-0.5 block ${(deltas.portfolioQuality ?? deltas.portfolioPillar ?? 0) >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {(deltas.portfolioQuality ?? deltas.portfolioPillar ?? 0) > 0 ? `+${deltas.portfolioQuality ?? deltas.portfolioPillar}` : (deltas.portfolioQuality ?? deltas.portfolioPillar ?? 0)} pts
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080a10] border border-white/[0.05]">
                      <span className="text-[10px] text-zinc-400 uppercase block">Applications</span>
                      <span className={`text-base font-bold mt-0.5 block ${(deltas.applicationActivity ?? 0) >= 0 ? 'text-orange-400' : 'text-rose-400'}`}>
                        {(deltas.applicationActivity ?? 0) > 0 ? `+${deltas.applicationActivity}` : deltas.applicationActivity ?? 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#080a10] border border-white/[0.05] text-xs text-zinc-400 leading-relaxed">
                    <span className="text-zinc-300 font-bold block mb-1">Baseline initialization active.</span>
                    Continue completing scheduled tasks and tracking milestones to record authentic trajectory deltas across your career milestones.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 5. FOUR CORE HUBS (Consolidated Cards with Aligned Headers & Dual Actions) ── */}
      {(activeSecondarySection === 'all' || activeSecondarySection === 'pillars') && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-wider text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Core Career Pillars & Direct Hubs</span>
            </h2>
            <Link
              to={ROUTES.STUDENT_DASHBOARD}
              className="text-xs font-semibold text-orange-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Explore All 16 Capabilities</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hub 1: CAREER */}
            <div className="p-5 rounded-2xl bg-[#0d101a] border border-white/[0.08] border-t-2 border-t-orange-500 flex flex-col justify-between gap-4 shadow-xl hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-orange-500/10 transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between h-7 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <span aria-hidden="true">🎯</span>
                    <span>Career</span>
                  </span>
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 rounded-full font-mono">
                    {careerHealthScore !== null ? `${careerHealthScore} / 100` : 'N/A'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">{targetRole}</h3>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                  <span>Stage:</span>
                  <strong className="text-zinc-300 font-semibold">{currentStateTitle}</strong>
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_CAREER_GOAL)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Career Goal →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_ROADMAP)}
                  className="w-full py-1 text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors text-center block"
                >
                  Interactive Roadmap
                </button>
              </div>
            </div>

            {/* Hub 2: BUILD */}
            <div className="p-5 rounded-2xl bg-[#0d101a] border border-white/[0.08] border-t-2 border-t-sky-500 flex flex-col justify-between gap-4 shadow-xl hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-sky-500/10 transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between h-7 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <span aria-hidden="true">🚀</span>
                    <span>Build</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-300 bg-white/[0.06] border border-white/10 px-2.5 py-0.5 rounded-full font-mono">
                    {skillsPillar.score !== null && skillsPillar.score !== undefined ? `${skillsPillar.score}%` : '80%'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">Skills & Projects</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  <strong className="text-zinc-300 font-semibold">{totalProjectsCount} projects</strong> · {deployedProjectsCount} deployed
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_PROJECTS)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Projects Portfolio →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_DSA)}
                  className="w-full py-1 text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors text-center block"
                >
                  DSA Problem Tracker
                </button>
              </div>
            </div>

            {/* Hub 3: PROOF */}
            <div className="p-5 rounded-2xl bg-[#0d101a] border border-white/[0.08] border-t-2 border-t-emerald-500 flex flex-col justify-between gap-4 shadow-xl hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between h-7 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span aria-hidden="true">📄</span>
                    <span>Proof</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-mono">
                    {proofPillar.score !== null && proofPillar.score !== undefined ? `${proofPillar.score} ATS` : '73 ATS'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">Resume & Code</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isGithubConnected ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span>✓</span> GitHub Live Connected
                    </span>
                  ) : (
                    'GitHub sync ready'
                  )}
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_RESUME)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Resume Analyzer →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_GITHUB)}
                  className="w-full py-1 text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors text-center block"
                >
                  GitHub Showcase
                </button>
              </div>
            </div>

            {/* Hub 4: OPPORTUNITIES */}
            <div className="p-5 rounded-2xl bg-[#0d101a] border border-white/[0.08] border-t-2 border-t-purple-500 flex flex-col justify-between gap-4 shadow-xl hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-purple-500/10 transition-all duration-200 group">
              <div>
                <div className="flex items-center justify-between h-7 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <span aria-hidden="true">💼</span>
                    <span>Pipeline</span>
                  </span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full font-mono">
                    {inFlightAppsCount} Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">Jobs & Pipeline</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  <strong className="text-zinc-300 font-semibold">{upcomingInterviewsCount} interviews</strong> · {totalAppsCount} tracked
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_APPLICATIONS)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Applications Pipeline →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_OPPORTUNITIES)}
                  className="w-full py-1 text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors text-center block"
                >
                  Explore Opportunities
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Career Copilot Quick Inquiries ── */}
      <section className="border-t border-white/[0.08] pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">✨</span>
            <h2 className="text-xs font-bold tracking-wider text-white">
              Ask Career Copilot
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              AI Advisory Engine
            </span>
          </div>
          <Link
            to={ROUTES.STUDENT_COPILOT}
            className="text-xs font-semibold text-orange-400 hover:text-white flex items-center gap-1"
          >
            <span>Open Studio</span>
            <span>→</span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2.5">
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
              className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-500/30 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:scale-[1.01] active:scale-95"
            >
              <span className="text-purple-400 text-xs" aria-hidden="true">✨</span>
              <span>"{prompt}"</span>
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