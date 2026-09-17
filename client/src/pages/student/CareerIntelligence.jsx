/**
 * CareerIntelligence.jsx
 *
 * Career Intelligence Engine & Personalized Weekly Strategy (/student/career-intelligence).
 * Transforms raw metrics across modules into an actionable, adaptive career operating strategy.
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getCareerIntelligence,
  refreshCareerIntelligence,
} from '../../api/careerIntelligence.api';
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
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const ICONS = {
  refresh: (
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  ),
  sparkles: (
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  ),
  trendUp: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
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
  alertTriangle: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  zap: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  pauseCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="15" x2="10" y2="9" />
      <line x1="14" y1="15" x2="14" y2="9" />
    </>
  ),
};

export default function CareerIntelligence() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchIntelligence = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = forceRefresh
        ? await refreshCareerIntelligence()
        : await getCareerIntelligence();

      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        throw new Error('Failed to load career intelligence.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading career intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const handleActionNavigate = (actionType, defaultRoute) => {
    switch (actionType) {
      case 'OPEN_PROFILE': navigate(ROUTES.STUDENT_PROFILE); break;
      case 'OPEN_CAREER_GOAL': navigate(ROUTES.STUDENT_CAREER_GOAL); break;
      case 'OPEN_SKILLS': navigate(ROUTES.STUDENT_SKILLS); break;
      case 'OPEN_SKILL_GAP': navigate(ROUTES.STUDENT_SKILL_GAP); break;
      case 'OPEN_DSA': navigate(ROUTES.STUDENT_DSA); break;
      case 'OPEN_GITHUB': navigate(ROUTES.STUDENT_GITHUB); break;
      case 'OPEN_RESUME': navigate(ROUTES.STUDENT_RESUME); break;
      case 'OPEN_PROJECTS': navigate(ROUTES.STUDENT_PROJECTS); break;
      case 'OPEN_ROADMAP': navigate(ROUTES.STUDENT_ROADMAP); break;
      case 'OPEN_OPPORTUNITIES': navigate(ROUTES.STUDENT_OPPORTUNITIES); break;
      case 'OPEN_APPLICATIONS': navigate(ROUTES.STUDENT_APPLICATIONS); break;
      case 'OPEN_ANALYTICS': navigate(ROUTES.STUDENT_ANALYTICS); break;
      case 'OPEN_REMINDERS':
      case 'OPEN_DAILY_PLAN': navigate(ROUTES.STUDENT_REMINDERS); break;
      default:
        if (defaultRoute) navigate(defaultRoute);
        break;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-10 w-72 bg-zinc-900/60 rounded-xl animate-pulse" />
        <div className="h-44 w-full bg-zinc-900/40 rounded-2xl animate-pulse border border-white/[0.04]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-900/40 rounded-xl animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-2xl bg-[#0d101a] border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <Icon d={ICONS.alertTriangle} size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to Load Career Intelligence</h2>
        <p className="text-sm text-zinc-400">{error || 'Unable to synthesize career context.'}</p>
        <button
          onClick={() => fetchIntelligence()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    overallStatus,
    momentumScore,
    currentMetrics = {},
    biggestWeakness = {},
    nextBestAction = {},
    weeklyStrategy = {},
    trends = {},
    stopDoing = [],
    leverageActions = [],
  } = data;

  const STATUS_CONFIG = {
    ACCELERATING: {
      label: 'Accelerating Momentum',
      pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    BUILDING_MOMENTUM: {
      label: 'Building Momentum',
      pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      dot: 'bg-sky-400',
    },
    STABLE: {
      label: 'Stable Trajectory',
      pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    NEEDS_ATTENTION: {
      label: 'Needs Immediate Attention',
      pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    GETTING_STARTED: {
      label: 'Getting Started',
      pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400',
    },
  };

  const statusConfig = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.STABLE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-zinc-100">
      
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 font-semibold">
                Strategic Career Intelligence
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Autonomous Decision Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Intelligence Studio</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Your adaptive career operating strategy, derived continuously from your real platform milestones, market benchmarks, and skill readiness metrics.
            </p>
          </div>

          <button
            onClick={() => fetchIntelligence(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            <Icon d={ICONS.refresh} size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Recalculating...' : 'Recalculate Intelligence'}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Section: Career Momentum ─────────────────────────── */}
      <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Career Momentum Score
            </span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight leading-none">
                {momentumScore}
              </span>
              <span className="text-sm font-mono text-zinc-500">/ 100</span>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${statusConfig.pill}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={ROUTES.STUDENT_COPILOT}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] transition-all cursor-pointer shadow-md"
            >
              <Icon d={ICONS.sparkles} size={14} className="text-orange-400" />
              <span>Ask Copilot Strategy →</span>
            </Link>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] space-y-1 backdrop-blur-sm">
            <span className="text-xs font-mono text-zinc-400 block uppercase">Career Health</span>
            <div className="text-2xl font-extrabold font-mono text-white">
              {currentMetrics.careerHealth !== null && currentMetrics.careerHealth !== undefined
                ? `${currentMetrics.careerHealth}/100`
                : '—'}
            </div>
            <span className="text-[11px] font-mono text-zinc-500 block">Normalized platform health</span>
          </div>

          <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] space-y-1 backdrop-blur-sm">
            <span className="text-xs font-mono text-zinc-400 block uppercase">Career Readiness</span>
            <div className="text-2xl font-extrabold font-mono text-sky-400">
              {currentMetrics.careerReadiness !== null && currentMetrics.careerReadiness !== undefined
                ? `${currentMetrics.careerReadiness}/100`
                : '—'}
            </div>
            <span className="text-[11px] font-mono text-zinc-500 block">Market hiring competitiveness</span>
          </div>

          <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] space-y-1 backdrop-blur-sm">
            <span className="text-xs font-mono text-zinc-400 block uppercase">Skill Coverage</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {currentMetrics.skillCoverage !== null && currentMetrics.skillCoverage !== undefined
                ? `${currentMetrics.skillCoverage}%`
                : '—'}
            </div>
            <span className="text-[11px] font-mono text-zinc-500 block">Target role core benchmark</span>
          </div>

          <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] space-y-1 backdrop-blur-sm">
            <span className="text-xs font-mono text-zinc-400 block uppercase">Roadmap Progress</span>
            <div className="text-2xl font-extrabold font-mono text-purple-400">
              {currentMetrics.roadmapProgress !== null && currentMetrics.roadmapProgress !== undefined
                ? `${currentMetrics.roadmapProgress}%`
                : '—'}
            </div>
            <span className="text-[11px] font-mono text-zinc-500 block">Verified milestones done</span>
          </div>
        </div>
      </div>

      {/* ── Two Column Grid: Biggest Weakness & Next Best Action ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Biggest Weakness Card */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-rose-500/25 p-6 backdrop-blur-md flex flex-col justify-between gap-5 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Icon d={ICONS.alertTriangle} size={14} />
                Biggest Career Gap
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {biggestWeakness.impact || 'HIGH'} IMPACT
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              {biggestWeakness.title}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {biggestWeakness.reason}
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate(biggestWeakness.fixAction?.route || ROUTES.STUDENT_SKILL_GAP)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Fix This Gap</span>
              <Icon d={ICONS.arrowRight} size={12} />
            </button>
          </div>
        </div>

        {/* Next Best Action Card */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 via-[#0d101a] to-[#0b0d13] border border-orange-500/30 p-6 backdrop-blur-md flex flex-col justify-between gap-5 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Icon d={ICONS.zap} size={14} />
                Next Best Action
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
                PRIORITY SCORE {nextBestAction.priorityScore || 85}/100
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              {nextBestAction.title}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {nextBestAction.reason}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
              <span>Module: <strong className="text-white">{nextBestAction.module}</strong></span>
              <span>•</span>
              <span>Est: <strong className="text-white">{nextBestAction.estimatedMinutes} min</strong></span>
            </div>
          </div>

          <div>
            <button
              onClick={() => handleActionNavigate(nextBestAction.actionType)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Start Action</span>
              <Icon d={ICONS.arrowRight} size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Weekly Strategy Section ────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Personalized Weekly Strategy
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {weeklyStrategy.weekLabel || 'Current Sprint'} • Target: {weeklyStrategy.totalEstimatedHours || 10} hours allocated
            </p>
          </div>

          {/* Time Budget Breakdown */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
              Skills: {weeklyStrategy.timeBudgetDistribution?.skillDevelopment ?? 35}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Projects: {weeklyStrategy.timeBudgetDistribution?.projects ?? 30}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              DSA: {weeklyStrategy.timeBudgetDistribution?.dsa ?? 20}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Interviews: {weeklyStrategy.timeBudgetDistribution?.resumeAndInterviews ?? 15}%
            </span>
          </div>
        </div>

        {/* Strategy Objectives */}
        <div className="space-y-3">
          {weeklyStrategy.objectives?.map((obj) => (
            <div
              key={obj.order}
              className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {obj.order}
                </span>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white tracking-tight">{obj.title}</h4>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      obj.priority === 'URGENT'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {obj.priority}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{obj.why}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <span className="text-xs font-mono text-zinc-500">
                  ~{obj.estimatedMinutes}m / session
                </span>
                <button
                  onClick={() => handleActionNavigate(obj.actionType)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] text-xs font-semibold transition-all cursor-pointer"
                >
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two Column Analytical Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Authentic Trends */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Icon d={ICONS.trendUp} size={16} className="text-emerald-400" />
              <span>Measurable Platform Changes</span>
            </h3>
            <span className="text-xs font-mono text-zinc-500">Snapshot comparison</span>
          </div>

          {!trends.hasHistory || !trends.changes ? (
            <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <p className="text-xs text-zinc-300 font-semibold">
                Baseline snapshot established.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">
                Meaningful metric shifts will appear automatically after your next active session.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(trends.changes).map(([metric, val]) => (
                <div
                  key={metric}
                  className="p-3 rounded-xl bg-[#111422]/60 border border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-zinc-300 capitalize">
                    {metric.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-zinc-500">{val.from ?? '—'} → {val.to ?? '—'}</span>
                    <span className={`px-2 py-0.5 rounded-md ${
                      val.diff > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : val.diff < 0
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : 'bg-white/[0.04] text-zinc-400'
                    }`}>
                      {val.diff > 0 ? `+${val.diff}` : val.diff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* "Stop Doing" Engine */}
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Icon d={ICONS.pauseCircle} size={16} className="text-amber-400" />
              <span>Temporarily Deprioritize</span>
            </h3>
            <span className="text-xs font-mono text-zinc-500">Efficiency pivots</span>
          </div>

          <div className="space-y-3">
            {stopDoing.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#111422]/60 border-l-4 border-amber-500 border-t border-r border-b border-white/[0.04] space-y-1.5"
              >
                <span className="text-xs font-bold text-white block">
                  {item.title}
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.reason}</p>
                <div className="pt-1 text-[11px] font-mono text-sky-400 font-semibold">
                  Actionable Pivot: {item.actionablePivot}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── High Career Leverage Actions ───────────────────────────── */}
      {leverageActions?.length > 0 && (
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-md space-y-5 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Icon d={ICONS.shield} size={17} className="text-orange-400" />
              <span>High Career Leverage Actions</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Single high-impact moves that compound across Skill Gap benchmarks, Resume ATS readiness, and Live Opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leverageActions.map((act, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] hover:border-white/15 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{act.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
                    {act.leverageScore} LEVERAGE
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {act.affectedModules.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{act.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}