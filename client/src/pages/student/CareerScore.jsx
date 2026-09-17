/**
 * CareerScore.jsx — /student/career-score
 *
 * Executive Career Readiness Score (0–100) calculated deterministically
 * across 4 core pillars: Profile & Direction (15 pts), Skills (25 pts),
 * DSA (25 pts), and GitHub (25 pts).
 *
 * Design: Obsidian / Dark SaaS aesthetic, glowing SVG circular gauge,
 * 4 pillar breakdown telemetry cards, targeted action recommendations,
 * and data source integrity tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCareerScore } from '../../api/careerScore.api';
import { ROUTES } from '../../utils/constants';

/* ── SVG Icons ────────────────────────────────────────────────── */
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
  scoreBadge: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  profile: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 3a4 4 0 100 8 4 4 0 000-8z'],
  skills:  ['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  dsa:     ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  github:  'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  info:    ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 16v-4', 'M12 8h.01'],
  arrow:   'M5 12h14M12 5l7 7-7 7',
  check:   'M20 6L9 17l-5-5',
  alert:   ['M12 9v2m0 4h.01', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'],
  sparkles:'M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36l-2.12 2.12M8.76 15.24l-2.12 2.12M17.24 15.24l-2.12-2.12M8.76 8.76L6.64 6.64',
  shieldCheck: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  database: ['M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3z', 'M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6', 'M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6']
};

/* ── Status Tier Theme Configuration ─────────────────────────── */
function getStatusTheme(status) {
  switch (status) {
    case 'Strong':
      return {
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        ringColor: '#10b981',
        barColor: 'from-emerald-500 to-teal-400',
        textColor: 'text-emerald-400',
        halo: 'from-emerald-500/10 via-transparent to-transparent',
        tierLabel: 'Strong Candidate',
        headline: 'Your profile demonstrates exceptional recruiter readiness',
        description: 'You possess balanced technical execution, well-rounded GitHub portfolios, and consistent DSA discipline. Keep polishing behavioral narratives.'
      };
    case 'Developing':
      return {
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        ringColor: '#38bdf8',
        barColor: 'from-blue-500 to-cyan-400',
        textColor: 'text-blue-400',
        halo: 'from-blue-500/10 via-transparent to-transparent',
        tierLabel: 'Developing Candidate',
        headline: 'Solid foundational execution with high upward velocity',
        description: 'You have reliable core competency. Closing your highest-weighted skill gaps and boosting problem counts will elevate you to the top quartile.'
      };
    case 'Building':
      return {
        badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
        ringColor: '#f97316',
        barColor: 'from-[#ea580c] to-[#f97316]',
        textColor: 'text-orange-400',
        halo: 'from-orange-500/10 via-transparent to-transparent',
        tierLabel: 'Building Momentum',
        headline: 'Promising trajectory with actionable near-term milestones',
        description: 'You have started accumulating real proof of work. Connect your GitHub repos and maintain a 7-day problem streak to unlock the next score threshold.'
      };
    default:
      return {
        badgeBg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25',
        ringColor: '#71717a',
        barColor: 'from-zinc-500 to-zinc-400',
        textColor: 'text-zinc-400',
        halo: 'from-zinc-500/10 via-transparent to-transparent',
        tierLabel: 'Getting Started',
        headline: 'Baseline calibration ready for fast score acceleration',
        description: 'Complete initial profile setups, configure your target career goal, and connect your public GitHub to populate your initial scorecard.'
      };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not available';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CareerScore() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getCareerScore();
      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to retrieve career score');
      }
    } catch (err) {
      console.error('Error loading career score:', err);
      setError(err.message || 'Unable to load readiness score. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const score = data?.score ?? 0;
  const status = data?.status ?? 'Getting Started';
  const breakdown = data?.breakdown ?? {};
  const recommendations = data?.recommendations ?? [];
  const dataSources = data?.dataSources ?? {};
  const statusTheme = getStatusTheme(status);

  // SVG Gauge calculations
  const radius = 68;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Icon d={ICONS.scoreBadge} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Career Readiness Score
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Realtime Calibration
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 max-w-2xl leading-relaxed">
            Deterministic 0–100 candidate benchmark computed across profile completeness, verified skill mastery, continuous problem solving, and public GitHub code output.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchScore(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-200 bg-white/[0.04] border border-white/[0.1] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.16] transition-all disabled:opacity-50 shadow-sm"
          >
            <Icon d={ICONS.refresh} size={14} className={refreshing ? 'animate-spin text-orange-400' : 'text-zinc-400'} />
            <span>{refreshing ? 'Recalculating...' : 'Refresh Score'}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
          <Icon d={ICONS.alert} size={18} className="text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-300">{error}</p>
            <button
              onClick={() => fetchScore()}
              className="mt-2 text-[12px] font-medium text-red-400 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-6">
          <div className="h-72 rounded-2xl bg-[#0f121d] border border-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 rounded-xl bg-[#0f121d] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Hero Score Card ── */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#0a0c13] p-6 sm:p-8 shadow-2xl">
            {/* Ambient Halo */}
            <div className={`absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br ${statusTheme.halo} rounded-full blur-3xl pointer-events-none opacity-60`} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center shrink-0 mx-auto lg:mx-0">
                <svg width="180" height="180" className="rotate-[-90deg] drop-shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Active Gradient Arc */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke={statusTheme.ringColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[44px] font-black text-white tracking-tight font-mono leading-none">
                    {score}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                    out of 100
                  </span>
                </div>
              </div>

              {/* Score Narrative & Status Bands */}
              <div className="flex flex-col justify-center text-center lg:text-left space-y-3">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <span className={`text-[12px] font-bold tracking-wide uppercase px-3 py-1 rounded-full border ${statusTheme.badgeBg}`}>
                    {status}
                  </span>
                  <span className="text-[12px] font-medium text-zinc-400">
                    Calculated on <span className="text-zinc-300 font-mono">{formatDate(data?.calculatedAt)}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {statusTheme.headline}
                </h2>

                <p className="text-[13px] sm:text-[14px] text-zinc-300 max-w-2xl leading-relaxed">
                  {statusTheme.description}
                </p>

                {/* Status Bands Segmented Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/[0.06]">
                  {[
                    { label: 'Getting Started', range: '0–39', active: score < 40, color: 'border-zinc-500/40 text-zinc-300' },
                    { label: 'Building', range: '40–59', active: score >= 40 && score < 60, color: 'border-orange-500/40 text-orange-300' },
                    { label: 'Developing', range: '60–79', active: score >= 60 && score < 80, color: 'border-blue-500/40 text-blue-300' },
                    { label: 'Strong', range: '80–100', active: score >= 80, color: 'border-emerald-500/40 text-emerald-300' },
                  ].map((band) => (
                    <div
                      key={band.label}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        band.active
                          ? `bg-white/[0.08] ${band.color} shadow-md shadow-black/40 ring-1 ring-white/10`
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-500 opacity-60'
                      }`}
                    >
                      <p className="text-[11px] font-bold leading-tight truncate">{band.label}</p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{band.range} pts</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 4 Pillars Telemetry Grid (100 Total Points) ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-400">
                  Readiness Pillars Breakdown
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  100 points calibrated across direction, verified technical skills, problem solving, and real repositories.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 self-start sm:self-auto">
                4 Pillars · 100 Pts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pillar 1: Profile & Career Direction (15 pts) */}
              <BreakdownCard
                icon={ICONS.profile}
                title="Profile & Direction"
                subtitle="Goal clarity, resume completeness, target role defined"
                earned={breakdown.profile?.earned ?? 0}
                max={breakdown.profile?.max ?? 15}
                colorClass="text-amber-400"
                barColor="from-amber-500 to-yellow-400"
                ringColor="border-amber-500/30"
                details={breakdown.profile?.details}
                sourceType="Application Data"
                sourceBadge="bg-amber-500/10 text-amber-300 border-amber-500/20"
                linkTo={ROUTES.STUDENT_CAREER_GOAL}
                linkLabel="Edit Target Role"
              />

              {/* Pillar 2: Skill Inventory (25 pts) */}
              <BreakdownCard
                icon={ICONS.skills}
                title="Skill Inventory"
                subtitle="Verified technical stack against industry benchmarks"
                earned={breakdown.skills?.earned ?? 0}
                max={breakdown.skills?.max ?? 25}
                colorClass="text-sky-400"
                barColor="from-sky-500 to-blue-500"
                ringColor="border-sky-500/30"
                details={breakdown.skills?.details}
                sourceType="Application Data"
                sourceBadge="bg-sky-500/10 text-sky-300 border-sky-500/20"
                linkTo={ROUTES.STUDENT_SKILLS}
                linkLabel="Manage Skills"
              />

              {/* Pillar 3: DSA & Problem Solving (25 pts) */}
              <BreakdownCard
                icon={ICONS.dsa}
                title="DSA & Problem Solving"
                subtitle="Consistency cadence, problem volume, medium/hard depth"
                earned={breakdown.dsa?.earned ?? 0}
                max={breakdown.dsa?.max ?? 25}
                colorClass="text-purple-400"
                barColor="from-purple-500 to-indigo-500"
                ringColor="border-purple-500/30"
                details={breakdown.dsa?.details}
                sourceType="Manual / Self-Reported"
                sourceBadge="bg-purple-500/10 text-purple-300 border-purple-500/20"
                linkTo={ROUTES.STUDENT_DSA}
                linkLabel="Log DSA Practice"
              />

              {/* Pillar 4: GitHub & Projects (25 pts) */}
              <BreakdownCard
                icon={ICONS.github}
                title="GitHub & Projects"
                subtitle="Public commit volume, repo variety, verified open source"
                earned={breakdown.github?.earned ?? 0}
                max={breakdown.github?.max ?? 25}
                colorClass="text-emerald-400"
                barColor="from-emerald-500 to-teal-400"
                ringColor="border-emerald-500/30"
                details={breakdown.github?.details}
                sourceType="Real Public GitHub API"
                sourceBadge="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                linkTo={ROUTES.STUDENT_GITHUB}
                linkLabel="Sync Repositories"
              />
            </div>
          </div>

          {/* ── Recommendations Section ── */}
          {recommendations.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Icon d={ICONS.sparkles} size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Highest-Impact Score Accelerators
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Actionable steps to reach the next readiness milestone in the shortest time.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-orange-500/30 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-sm shadow-orange-500/50" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.05] text-orange-400 border border-white/[0.08]">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-[13px] text-zinc-200 leading-relaxed font-medium">
                          {rec.text}
                        </p>
                      </div>
                    </div>

                    {rec.actionUrl && (
                      <Link
                        to={rec.actionUrl}
                        className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-[12px] font-semibold text-zinc-200 bg-white/[0.04] border border-white/[0.08] group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all"
                      >
                        <span>{rec.actionLabel || 'Take action'}</span>
                        <Icon d={ICONS.arrow} size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Data Sources & Integrity ── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Icon d={ICONS.database} size={16} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Data Sources & Telemetry Integrity
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Audited distinction between verified third-party API synchronization and self-reported metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <DataSourceTile
                title="Career Direction"
                type={dataSources.profile?.type || 'Application Data'}
                status={dataSources.profile?.status}
                updatedAt={dataSources.profile?.updatedAt}
                badgeClass="bg-amber-500/10 text-amber-300 border-amber-500/20"
              />
              <DataSourceTile
                title="Skills Profile"
                type={dataSources.skills?.type || 'Application Data'}
                status={dataSources.skills?.status}
                updatedAt={dataSources.skills?.updatedAt}
                badgeClass="bg-sky-500/10 text-sky-300 border-sky-500/20"
              />
              <DataSourceTile
                title="DSA Progress"
                type={dataSources.dsa?.type || 'Manual / Self-Reported'}
                status={dataSources.dsa?.status}
                updatedAt={dataSources.dsa?.lastUpdated}
                badgeClass="bg-purple-500/10 text-purple-300 border-purple-500/20"
                isSelfReported
              />
              <DataSourceTile
                title="GitHub Repositories"
                type={dataSources.github?.type || 'Real Public GitHub API'}
                status={dataSources.github?.status}
                updatedAt={dataSources.github?.lastSyncedAt}
                badgeClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                isVerified
              />
            </div>
          </div>

          {/* ── Methodology & Transparency ── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon d={ICONS.shieldCheck} size={16} className="text-zinc-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Scoring Methodology & Transparency
              </h4>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
              {data?.disclaimer || 'This score is a deterministic indicator calibrated against software engineering industry hiring bars. Points are strictly earned through verified artifacts and structured self-reporting.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-zinc-400">
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className="text-amber-400 font-bold block">15 pts max</span>
                Career Direction
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className="text-sky-400 font-bold block">25 pts max</span>
                Skill Inventory
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className="text-purple-400 font-bold block">25 pts max</span>
                DSA Problem Practice
              </div>
              <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className="text-emerald-400 font-bold block">25 pts max</span>
                Public GitHub API
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pillar Breakdown Card Component ─────────────────────────── */
function BreakdownCard({
  icon,
  title,
  subtitle,
  earned,
  max,
  colorClass,
  barColor,
  ringColor,
  details = [],
  sourceType,
  sourceBadge,
  linkTo,
  linkLabel,
}) {
  const pct = Math.min(100, Math.round((earned / max) * 100));

  return (
    <div className={`flex flex-col justify-between p-6 rounded-2xl border border-white/[0.08] bg-[#0f121d] hover:border-white/[0.14] transition-all duration-200 ${ringColor}`}>
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-200 shrink-0">
              <Icon d={icon} size={18} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white tracking-tight">{title}</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{subtitle}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className={`text-xl font-bold font-mono ${colorClass}`}>
              {earned}
            </span>
            <span className="text-xs text-zinc-500 font-mono font-medium"> / {max}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span>Completion</span>
            <span className="font-semibold text-zinc-200">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Granular Sub-items */}
        {details.length > 0 && (
          <div className="space-y-2 mb-4 p-3 rounded-xl bg-black/20 border border-white/[0.03]">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[12px] py-1 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-zinc-300 truncate pr-2 text-[11px]">{item.label}</span>
                <span className="font-mono text-[11px] text-zinc-200 font-semibold shrink-0">
                  {item.earned}/{item.max}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta & Action */}
      <div className="pt-4 border-t border-white/[0.05] mt-auto flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${sourceBadge}`}>
          {sourceType}
        </span>

        {linkTo && (
          <Link
            to={linkTo}
            className="text-[12px] font-semibold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 group"
          >
            <span>{linkLabel || 'View details'}</span>
            <Icon d={ICONS.arrow} size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Data Source Tile Component ──────────────────────────────── */
function DataSourceTile({ title, type, status, updatedAt, badgeClass, isSelfReported, isVerified }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            {title}
          </p>
          {isVerified && (
            <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-0.5">
              <Icon d={ICONS.check} size={10} /> Verified
            </span>
          )}
        </div>

        <span
          className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded border mb-2.5 ${badgeClass}`}
        >
          {type}
        </span>

        <p className="text-[13px] text-zinc-200 font-medium truncate">
          {status || '—'}
        </p>
      </div>

      <p className="text-[10px] font-mono text-zinc-500 mt-3 pt-2 border-t border-white/[0.04]">
        {updatedAt ? `Synced: ${formatDate(updatedAt)}` : 'No sync recorded'}
      </p>
    </div>
  );
}