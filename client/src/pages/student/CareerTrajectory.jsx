/**
 * CareerTrajectory.jsx
 *
 * Career Outcome & Trajectory Engine (Phase 7).
 * Route: /student/career-trajectory
 *
 * Measures whether student preparation is converting into authentic career progress:
 * - 10 Deterministic Career Stages
 * - Multi-Dimensional Trajectory Status (Skills, Portfolio, Resume, DSA, GitHub, Execution, Applications, Interviews)
 * - Career Conversion Funnel (Applied → OA → Interview → Final → Offer)
 * - Primary Career Bottleneck diagnostic & action
 * - Milestone Engine & Conservative Milestone Forecasting
 * - Weekly & Monthly Outcome Reviews
 * - Copilot integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getCareerOutcome,
  getWeeklyOutcomeReview,
  getMonthlyOutcomeReview,
  refreshCareerOutcome,
  updateCareerMilestone,
} from '../../api/careerOutcome.api';
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
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
  sparkles: ['M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122m8.485 8.485l2.122 2.122M5.636 18.364l2.122-2.122m8.485-8.485l2.122-2.122'],
  arrowUp: ['M12 19V5', 'M5 12l7-7 7 7'],
  arrowDown: ['M12 5v14', 'M19 12l-7 7-7-7'],
  arrowRight: ['M5 12h14', 'M12 5l7 7-7 7'],
  flag: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
  target: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  funnel: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  alert: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  check: ['M20 6L9 17l-5-5'],
  clock: ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 6v6l4 2'],
  copilot: ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 8v4', 'M12 16h.01'],
};

/* ── Stage Visual Config ─────────────────────────────────────────── */

const STAGE_CONFIG = {
  FOUNDATION: { label: 'Foundation Stage', color: 'from-zinc-700/30 to-zinc-800/10 border-zinc-700 text-zinc-300' },
  SKILL_BUILDING: { label: 'Skill Building', color: 'from-purple-500/25 to-pink-500/10 border-purple-500/30 text-purple-300' },
  PORTFOLIO_BUILDING: { label: 'Portfolio Building', color: 'from-blue-500/25 to-cyan-500/10 border-blue-500/30 text-blue-300' },
  PROOF_BUILDING: { label: 'Proof & Verification', color: 'from-teal-500/25 to-emerald-500/10 border-teal-500/30 text-teal-300' },
  APPLICATION_READY: { label: 'Application Ready', color: 'from-emerald-500/25 to-green-500/10 border-emerald-500/30 text-emerald-300' },
  APPLICATION_ACTIVE: { label: 'Active Applications', color: 'from-indigo-500/25 to-blue-500/10 border-indigo-500/30 text-indigo-300' },
  INTERVIEW_PREPARATION: { label: 'Interview Preparation', color: 'from-amber-500/25 to-yellow-500/10 border-amber-500/30 text-amber-300' },
  INTERVIEW_ACTIVE: { label: 'Active Interview Pipeline', color: 'from-orange-500/25 to-amber-500/10 border-orange-500/30 text-orange-300' },
  OFFER_STAGE: { label: 'Offer Stage', color: 'from-yellow-400/25 to-emerald-500/15 border-yellow-400/40 text-yellow-200' },
  INSUFFICIENT_DATA: { label: 'Setup Required', color: 'from-zinc-800/20 to-zinc-900/10 border-zinc-700 text-zinc-400' },
};

export default function CareerTrajectory() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [reviewTab, setReviewTab] = useState('WEEKLY');
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [monthlyReview, setMonthlyReview] = useState(null);
  const [showVectorDetails, setShowVectorDetails] = useState(false);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [outcomeRes, weekRes, monthRes] = await Promise.all([
        forceRefresh ? refreshCareerOutcome() : getCareerOutcome(),
        getWeeklyOutcomeReview().catch(() => ({ success: true, data: null })),
        getMonthlyOutcomeReview().catch(() => ({ success: true, data: null })),
      ]);

      if (outcomeRes && outcomeRes.success && outcomeRes.data) {
        setData(outcomeRes.data);
      } else {
        throw new Error(outcomeRes?.message || 'Failed to sync career trajectory.');
      }

      if (weekRes?.data) setWeeklyReview(weekRes.data);
      if (monthRes?.data) setMonthlyReview(monthRes.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to Career Outcome Engine.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMilestone = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    try {
      const res = await updateCareerMilestone(id, {
        status: nextStatus,
        progress: nextStatus === 'COMPLETED' ? 100 : 50,
      });
      if (res && res.success) {
        setData((prev) => ({
          ...prev,
          milestones: prev.milestones.map((m) => (m._id === id ? res.data : m)),
        }));
      }
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="h-8 w-64 bg-white/[0.04] rounded-lg animate-pulse" />
        <div className="h-32 w-full bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.05]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  const stageCfg = STAGE_CONFIG[data?.careerStage] || STAGE_CONFIG.FOUNDATION;
  const isImproving = data?.trajectoryStatus === 'IMPROVING' || data?.trajectoryStatus === 'ACCELERATING';
  const isDeclining = data?.trajectoryStatus === 'DECLINING';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-7 text-zinc-100">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Icon d={ICONS.target} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Career Trajectory & Outcome Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 border border-orange-500/25 text-orange-400 font-mono">
              Phase 7 System
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Measures whether daily skill acquisition and project milestones are converting into authentic market momentum, pipeline interviews, and offer readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={ROUTES.STUDENT_ADAPTIVE_PLAN}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            Adaptive Plan →
          </Link>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Icon d={ICONS.refresh} size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Trajectory'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="underline hover:text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Executive Trajectory & Stage Banner ─────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 bg-gradient-to-r ${stageCfg.color} backdrop-blur-md shadow-2xl`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/40 border border-white/15 text-white shadow-sm font-mono">
                {stageCfg.label}
              </span>
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <span className="text-orange-400">⚡</span>
                <span>Next Unlock: {data?.unlockCriteria || 'Advance through current milestone requirements.'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {data?.careerStageReason || 'Active career progression in progress.'}
            </h2>
          </div>

          {/* Trajectory Status Pill */}
          <div className="flex items-center gap-4 shrink-0 bg-black/40 px-5 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-400 font-mono tracking-wide">
                Overall Trajectory
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`p-1 rounded-lg ${isImproving ? 'bg-emerald-500/20 text-emerald-400' : isDeclining ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/20 text-sky-400'}`}>
                  <Icon d={isImproving ? ICONS.arrowUp : isDeclining ? ICONS.arrowDown : ICONS.arrowRight} size={15} />
                </span>
                <span className="text-lg font-black text-white tracking-tight">
                  {data?.trajectoryStatus || 'STABLE'}
                </span>
              </div>
            </div>

            <div className="w-px h-9 bg-white/10" />

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-400 font-mono tracking-wide">
                Movement
              </span>
              <span className={`text-lg font-black font-mono ${data?.trajectoryDelta > 0 ? 'text-emerald-400' : data?.trajectoryDelta < 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {data?.trajectoryDelta > 0 ? `+${data.trajectoryDelta}%` : `${data?.trajectoryDelta ?? 0}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary Career Bottleneck (Promoted to Top) ── */}
      {data?.bottleneck && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/20 via-[#0d0f17] to-zinc-950 border border-amber-500/30 border-t-2 border-t-amber-500 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Icon d={ICONS.alert} size={18} />
              </span>
              <div>
                <span className="text-xs font-semibold text-amber-400 font-mono tracking-wide">
                  Primary Career Bottleneck
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {data.bottleneck.title}
                </h3>
              </div>
            </div>

            <Link
              to={data.bottleneck.actionRoute || ROUTES.STUDENT_ROADMAP}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white transition-all shrink-0 shadow-md shadow-orange-500/25 cursor-pointer"
            >
              Unblock Now →
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {data.bottleneck.reason}
          </p>

          <div className="text-xs text-zinc-400 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider font-mono">Evidence:</span>
            <span className="text-zinc-300 font-medium">{data.bottleneck.evidence}</span>
          </div>
        </div>
      )}

      {/* ── Progressive Disclosure: 8-Vector Breakdown Toggle ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🧭</span>
              <span>Multi-Dimensional Career Vectors</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Detailed momentum tracking across all 8 core career development vectors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowVectorDetails(!showVectorDetails)}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-zinc-200 transition-all cursor-pointer self-start sm:self-auto"
          >
            {showVectorDetails ? 'Hide Detailed Breakdown ▲' : 'View Detailed Breakdown ▼'}
          </button>
        </div>

        {showVectorDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4 pt-4 border-t border-white/[0.06]">
            {Object.entries(data?.dimensionTrends || {}).map(([dim, trend]) => {
              const isUp = trend.status === 'IMPROVING';
              const isDown = trend.status === 'DECLINING';
              return (
                <div
                  key={dim}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-1 shadow-sm"
                >
                  <span className="text-[11px] font-semibold text-zinc-400 capitalize">
                    {dim}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-bold ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-zinc-300'}`}>
                      {isUp ? '↑' : isDown ? '↓' : '→'} {trend.status}
                    </span>
                    {trend.delta !== 0 && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Career Conversion Funnel ──────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex flex-col gap-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Icon d={ICONS.funnel} size={16} />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Career Conversion Funnel
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tracks actual conversion drop-off across your job application and interview pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-zinc-400">Funnel Health:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border font-mono ${
              data?.funnel?.quality === 'STRONG'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : data?.funnel?.quality === 'HEALTHY'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {data?.funnel?.quality || 'INSUFFICIENT_DATA'}
            </span>
          </div>
        </div>

        {/* Funnel Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Saved', count: data?.funnel?.saved || 0, color: 'text-zinc-300', border: 'border-t-zinc-500' },
            { label: 'Applied', count: data?.funnel?.applied || 0, color: 'text-sky-400', border: 'border-t-sky-500' },
            { label: 'Online Assessment', count: data?.funnel?.oa || 0, color: 'text-blue-400', border: 'border-t-blue-500' },
            { label: 'Interviews', count: data?.funnel?.interview || 0, color: 'text-amber-400', border: 'border-t-amber-500' },
            { label: 'Final Rounds', count: data?.funnel?.finalRound || 0, color: 'text-orange-400', border: 'border-t-orange-500' },
            { label: 'Offers', count: data?.funnel?.offer || 0, color: 'text-emerald-400', border: 'border-t-emerald-500' },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] border-t-2 ${step.border} flex flex-col gap-1 text-center shadow-md`}
            >
              <span className="text-xs font-extrabold text-zinc-200 tracking-wide">{step.label}</span>
              <span className={`text-2xl font-black font-mono ${step.color}`}>{step.count}</span>
            </div>
          ))}
        </div>

        {/* Conversion Rates Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium">Response Rate</span>
            <span className="text-sm font-black text-white font-mono">
              {data?.funnel?.responseRate !== null ? `${data.funnel.responseRate}%` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium">Interview Rate</span>
            <span className="text-sm font-black text-white font-mono">
              {data?.funnel?.interviewRate !== null ? `${data.funnel.interviewRate}%` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium">Final Round Rate</span>
            <span className="text-sm font-black text-white font-mono">
              {data?.funnel?.finalRoundRate !== null ? `${data.funnel.finalRoundRate}%` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400 font-medium">Offer Conversion</span>
            <span className="text-sm font-black text-white font-mono">
              {data?.funnel?.offerRate !== null ? `${data.funnel.offerRate}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Milestones */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Career Milestones */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>🏁</span>
                  <span>Career Progression Milestones</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Deterministic unlocks representing tangible career advancement.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {(data?.milestones || []).map((ms) => {
                const isDone = ms.status === 'COMPLETED';
                return (
                  <div
                    key={ms._id || ms.stableKey}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(ms._id, ms.status)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'border-zinc-600 hover:border-emerald-400 text-transparent'
                        }`}
                        title={isDone ? 'Mark in progress' : 'Mark completed'}
                      >
                        <Icon d={ICONS.check} size={12} />
                      </button>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isDone ? 'line-through text-zinc-500' : 'text-white'}`}>
                            {ms.title}
                          </span>
                          <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/5 font-mono">
                            {ms.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{ms.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-zinc-300 font-mono">{ms.progress}%</span>
                        <div className="w-20 h-2.5 rounded-full bg-white/[0.08] border border-white/10 overflow-hidden mt-1 shadow-inner">
                          <div
                            className={`h-full rounded-full ${isDone ? 'bg-emerald-400' : 'bg-orange-500'}`}
                            style={{ width: `${ms.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Forecast, Reviews, Evidence Conversion */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Conservative Milestone Forecast Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Icon d={ICONS.clock} size={15} />
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Milestone Forecast
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                Confidence: {data?.forecast?.confidence || 'INSUFFICIENT_DATA'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col gap-2 shadow-sm">
              <span className="text-xs font-bold text-sky-300">
                Target: {data?.forecast?.targetMetric || 'Skill Coverage 75%'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {data?.forecast?.estimatedWeeks !== null ? `~${data.forecast.estimatedWeeks}` : '—'}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {data?.forecast?.estimatedWeeks !== null ? 'weeks estimated' : 'projection pending'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                {data?.forecast?.message}
              </p>
            </div>

            <p className="text-[11px] text-zinc-500 italic">
              * Conservative projection based strictly on verified historical movement. Career outcomes cannot be guaranteed.
            </p>
          </div>

          {/* Evidence Conversion Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>🛡️</span>
                <span>Evidence Conversion Ratio</span>
              </h3>
              <span className="text-xs font-black text-emerald-400 font-mono">
                {data?.evidenceGap?.evidenceConversionRatio !== null ? `${data.evidenceGap.evidenceConversionRatio}%` : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {data?.evidenceGap?.details}
            </p>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full"
                style={{ width: `${data?.evidenceGap?.evidenceConversionRatio || 0}%` }}
              />
            </div>
          </div>

          {/* Weekly / Monthly Outcome Review Tabs */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Outcome Review</span>
              </div>
              <div className="flex gap-1 p-0.5 rounded-xl bg-white/5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setReviewTab('WEEKLY')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    reviewTab === 'WEEKLY' ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Weekly (7d)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('MONTHLY')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    reviewTab === 'MONTHLY' ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Monthly (30d)
                </button>
              </div>
            </div>

            {reviewTab === 'WEEKLY' ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-emerald-400">Verified Wins:</span>
                  {(weeklyReview?.wins || data?.keyWins || []).map((win, i) => (
                    <div key={i} className="flex items-start gap-2 text-zinc-300">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{win}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.05]">
                  <span className="font-bold text-rose-400">Primary Friction:</span>
                  <span className="text-zinc-300">
                    {weeklyReview?.bottleneck?.title || data?.bottleneck?.title}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-sky-400">30-Day Stage Progress:</span>
                  <span className="text-zinc-300">{monthlyReview?.stageProgress || data?.unlockCriteria}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.05]">
                  <span className="font-bold text-emerald-400">Milestones Completed:</span>
                  <span className="text-zinc-300">
                    {monthlyReview?.milestonesSummary?.completed ?? 0} of {monthlyReview?.milestonesSummary?.total ?? data?.milestones?.length ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Copilot Deep Query Prompts */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-transparent border border-emerald-500/20 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Icon d={ICONS.copilot} size={16} className="text-emerald-400" />
              <span>Ask Copilot About Trajectory</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                'Am I actually progressing?',
                'What is blocking my career?',
                'How is my application conversion?',
                'Why am I stagnating?',
              ].map((query, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(`${ROUTES.STUDENT_COPILOT}?q=${encodeURIComponent(query)}`)}
                  className="text-left px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all flex items-center justify-between cursor-pointer border border-white/5 hover:border-white/15"
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