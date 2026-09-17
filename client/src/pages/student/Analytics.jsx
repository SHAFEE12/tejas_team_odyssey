/**
 * Analytics.jsx
 *
 * Career Analytics & Trajectory Performance Studio (/student/analytics).
 * Transforms Career Odyssey into a measurable, closed-loop career operating system.
 *
 * Visual sections:
 * 1. Career Health Score (0–100) & Component Breakdown
 * 2. Career Readiness Score & History Trend
 * 3. Application Funnel & Conversion Rates
 * 4. Next Best Actions (Deterministic)
 * 5. Skill Gap Analytics & Recurring Opportunity Gaps
 * 6. Roadmap Analytics
 * 7. Project Portfolio Analytics
 * 8. DSA / LeetCode Analytics (Unavailable-aware)
 * 9. GitHub Analytics (Unavailable-aware)
 * 10. Resume Analysis Status
 * 11. Weekly Activity Summary
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../api/analytics.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icon primitive ──────────────────────────────── */
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
  activity: (
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  trendUp: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  zap: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  map: (
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  folder: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  code: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  git: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),
};

/* ── Health Score Ring ──────────────────────────────────────── */
function HealthScoreGauge({ score = 0, size = 140 }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const progress = circ - (Math.min(100, Math.max(0, score)) / 100) * circ;

  const color =
    score >= 80 ? '#10b981' : // emerald
    score >= 65 ? '#38bdf8' : // sky
    score >= 45 ? '#f59e0b' : // amber
    '#f43f5e'; // rose

  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        {/* Track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="8" />
        {/* Fill */}
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] uppercase font-mono font-semibold text-zinc-500 tracking-wider">
          out of 100
        </span>
      </div>
    </div>
  );
}

/* ── Metric Card Primitive ──────────────────────────────────── */
function MetricStat({ label, value, subtext, color = 'text-white', icon = null }) {
  return (
    <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.06] flex flex-col justify-between backdrop-blur-sm hover:border-white/15 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div>
        <p className={`text-2xl font-extrabold font-mono tracking-tight ${color}`}>{value}</p>
        {subtext && <p className="text-[11px] font-mono text-zinc-500 mt-1 leading-snug">{subtext}</p>}
      </div>
    </div>
  );
}

/* ── Main Career Analytics Page ─────────────────────────────── */
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('SUMMARY');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load career analytics:', err);
      setError('Unable to load career analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-300">
          Generating Career Operating Analytics...
        </h2>
        <p className="text-xs text-zinc-500 max-w-sm font-mono">
          Synthesizing your skills, roadmap, portfolio, and applications data deterministically.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 py-8 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-[#0d101a] border border-rose-500/30 space-y-4 shadow-2xl">
          <p className="text-sm text-rose-400">{error || 'No analytics data available.'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    careerHealth = {},
    careerScore = {},
    applications = {},
    funnel = {},
    skillGap = {},
    roadmap = {},
    projects = {},
    dsa = {},
    github = {},
    resume = {},
    weeklyActivity = {},
    recommendations = [],
  } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-zinc-100">
      
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 font-semibold">
                Career Operating System
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Deterministic Performance Evaluation
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Analytics</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Measure your authentic career trajectory, benchmark skill readiness against recruiters, and execute high-leverage actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={ROUTES.STUDENT_APPLICATIONS}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] transition-all cursor-pointer"
            >
              <Icon d={ICONS.briefcase} size={14} />
              <span>View Applications</span>
            </Link>
            <Link
              to={ROUTES.STUDENT_ROADMAP}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <Icon d={ICONS.map} size={14} />
              <span>Continue Roadmap</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Progressive Disclosure Tab Bar ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        {[
          { id: 'SUMMARY', label: 'Summary & Readiness' },
          { id: 'SKILLS', label: 'Skills & Roadmap' },
          { id: 'PORTFOLIO', label: 'Portfolio & DSA' },
          { id: 'APPLICATIONS', label: 'Application Funnel' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-[#0d101a]/80 hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: SUMMARY & READINESS ── */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* 1. Career Health Score Top Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center gap-8">
            <HealthScoreGauge score={careerHealth.score} />

            <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1.5 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">Overall Career Health</h2>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                    Score: {careerHealth.score}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  {careerHealth.disclaimer || 'Comprehensive weighted evaluation of your platform activity, skill verification, and roadmap milestones.'}
                </p>
              </div>

              {/* Component contributions pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/[0.06]">
                {Object.entries(careerHealth.breakdown || {}).map(([key, item]) => (
                  <div key={key} className="p-3 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-left">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{item.weight}%</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-extrabold font-mono text-white">
                        {item.status === 'AVAILABLE' ? `${item.score}%` : 'N/A'}
                      </span>
                      {item.status === 'UNAVAILABLE' && (
                        <span className="text-[10px] font-mono text-zinc-500">(Not set)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Next Best Actions Banner */}
          {recommendations && recommendations.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/[0.08] via-[#0d101a] to-[#0b0d13] border border-orange-500/25 space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <Icon d={ICONS.zap} size={15} className="text-orange-400" />
                  <span>Recommended Next Actions</span>
                </h3>
                <span className="text-xs font-mono text-zinc-400">Deterministic recommendations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec.id}
                    to={rec.link}
                    className="group p-4 rounded-xl bg-[#111422]/90 border border-white/[0.06] hover:border-orange-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                          rec.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                          rec.priority === 'MEDIUM' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                          'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}>
                          {rec.priority} Priority
                        </span>
                        <span className="text-[10px] font-mono uppercase text-zinc-500">{rec.category}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-100 group-hover:text-orange-400 transition-colors leading-snug">
                        {rec.action}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {rec.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Take action</span>
                      <Icon d={ICONS.arrowRight} size={12} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Career Readiness Trend & Weekly Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between md:col-span-2 shadow-xl space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Career Readiness Score
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                      {careerScore.currentScore}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">/ 100</span>
                    {careerScore.change !== null && careerScore.change !== undefined ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        careerScore.change >= 0
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {careerScore.trendLabel}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-zinc-500 italic">
                        {careerScore.trendLabel}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={ROUTES.STUDENT_CAREER_SCORE}
                  className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Detailed Breakdown</span>
                  <Icon d={ICONS.arrowRight} size={12} />
                </Link>
              </div>

              <div className="pt-4 border-t border-white/[0.06] space-y-2">
                <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Recent Score Progression</p>
                {careerScore.history && careerScore.history.length > 0 ? (
                  <div className="flex items-end gap-3 h-20 pt-2">
                    {careerScore.history.slice(0, 8).map((snap, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                        <div
                          className="w-full bg-gradient-to-t from-orange-600/30 via-orange-500/70 to-amber-400 rounded-t transition-all group-hover:brightness-125"
                          style={{ height: `${Math.max(16, (snap.score / 100) * 56)}px` }}
                          title={`Score: ${snap.score} on ${new Date(snap.recordedAt).toLocaleDateString()}`}
                        />
                        <span className="text-[10px] font-mono text-zinc-500 truncate w-full text-center">
                          {snap.score}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-500 py-2">Historical trend unavailable.</p>
                )}
              </div>
            </div>

            {/* Weekly Activity Summary */}
            <div className="p-6 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Weekly Activity
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-2xl font-extrabold font-mono text-white">
                  {weeklyActivity.totalActions} Actions
                </p>
                <p className="text-xs text-zinc-400 leading-snug">
                  {weeklyActivity.message}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Applications submitted:</span>
                  <span className="font-bold text-white">{weeklyActivity.applicationsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Projects updated:</span>
                  <span className="font-bold text-white">{weeklyActivity.projectsUpdatedThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Roadmap milestones:</span>
                  <span className="font-bold text-emerald-400">{weeklyActivity.roadmapTasksCompletedThisWeek}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SKILLS & ROADMAP ── */}
      {activeTab === 'SKILLS' && (
        <div className="space-y-6">
          {/* Skill Gap Analytics */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Skill Gap Analytics</h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Target Role: <span className="text-orange-400 font-semibold">{skillGap.targetRole}</span> • Coverage: {skillGap.coveragePercent}%
                </p>
              </div>
              <Link
                to={ROUTES.STUDENT_SKILL_GAP}
                className="text-xs font-mono font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <span>Skill Gap Matrix</span>
                <Icon d={ICONS.arrowRight} size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <MetricStat label="Total Role Skills" value={skillGap.totalSkills} />
              <MetricStat label="Covered" value={skillGap.coveredCount} color="text-emerald-400" />
              <MetricStat label="Partial" value={skillGap.partialCount} color="text-sky-400" />
              <MetricStat label="Missing" value={skillGap.missingCount} color="text-rose-400" />
              <MetricStat label="Evidence Missing" value={skillGap.evidenceMissingCount} color="text-amber-400" />
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">
                  Top Gaps Required by Your Tracked Opportunities
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {skillGap.trackedOpportunitiesCount} tracked opportunities evaluated
                </span>
              </div>

              {skillGap.recurringGaps && skillGap.recurringGaps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {skillGap.recurringGaps.map((gap, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#111422]/70 border border-white/[0.05] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{gap.skill}</p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          Required in {gap.count} tracked {gap.count === 1 ? 'role' : 'roles'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {gap.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-zinc-500 py-2">
                  {skillGap.recurringGapsMessage || 'Save or track opportunities to see recurring required skill gaps.'}
                </p>
              )}
            </div>
          </div>

          {/* Roadmap Progress */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h4 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                <Icon d={ICONS.map} size={16} className="text-orange-400" />
                <span>Roadmap Progress</span>
              </h4>
              <Link to={ROUTES.STUDENT_ROADMAP} className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors">
                <span>View Tasks</span>
                <Icon d={ICONS.arrowRight} size={12} />
              </Link>
            </div>

            {roadmap.status === 'AVAILABLE' ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {roadmap.completionPercentage}%
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {roadmap.completedTasks} of {roadmap.totalTasks} tasks completed
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${roadmap.completionPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center font-mono">
                  <div className="p-3 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">Completed</span>
                    <span className="font-bold text-emerald-400 text-sm">{roadmap.completedTasks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">In Progress</span>
                    <span className="font-bold text-amber-400 text-sm">{roadmap.inProgressTasks}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">Remaining</span>
                    <span className="font-bold text-zinc-300 text-sm">{roadmap.notStartedTasks}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-500 py-4">No roadmap generated yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: PORTFOLIO & DSA ── */}
      {activeTab === 'PORTFOLIO' && (
        <div className="space-y-6">
          {/* Projects Portfolio */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h4 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                <Icon d={ICONS.folder} size={16} className="text-orange-400" />
                <span>Project Portfolio Metrics</span>
              </h4>
              <Link to={ROUTES.STUDENT_PROJECTS} className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors">
                <span>Manage Projects</span>
                <Icon d={ICONS.arrowRight} size={12} />
              </Link>
            </div>

            {projects.status === 'AVAILABLE' ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {projects.totalProjects} Projects
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Average Portfolio Quality: <strong className="text-emerald-400 font-bold">{projects.averageQuality}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3.5 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">Completed</span>
                    <span className="font-bold text-white text-base">{projects.completed}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">In Progress</span>
                    <span className="font-bold text-white text-base">{projects.inProgress}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">GitHub Linked</span>
                    <span className="font-bold text-indigo-400 text-base">{projects.githubLinked}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#111422]/70 border border-white/[0.05]">
                    <span className="text-zinc-500 block text-[10px] uppercase">Live Deployed</span>
                    <span className="font-bold text-teal-400 text-base">{projects.deployed}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-500 py-4">No portfolio projects logged yet.</p>
            )}
          </div>

          {/* DSA, GitHub, Resume Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DSA */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">DSA & LeetCode</span>
                  <Link to={ROUTES.STUDENT_DSA} className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold">Sync →</Link>
                </div>
                {dsa.status === 'AVAILABLE' ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-extrabold font-mono text-white">{dsa.totalSolved} Solved</p>
                    <div className="flex gap-2 text-xs font-mono text-zinc-400">
                      <span>Easy: <strong className="text-emerald-400">{dsa.easy}</strong></span>
                      <span>•</span>
                      <span>Med: <strong className="text-amber-400">{dsa.medium}</strong></span>
                      <span>•</span>
                      <span>Hard: <strong className="text-rose-400">{dsa.hard}</strong></span>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 pt-1">
                      Current Streak: <strong className="text-white">{dsa.currentStreak} days</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-500 py-2">DSA metrics unavailable</p>
                )}
              </div>
            </div>

            {/* GitHub */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">GitHub Activity</span>
                  <Link to={ROUTES.STUDENT_GITHUB} className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold">Profile →</Link>
                </div>
                {github.status === 'AVAILABLE' ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-extrabold font-mono text-white">{github.publicRepos} Repositories</p>
                    <div className="flex gap-2 text-xs font-mono text-zinc-400">
                      <span>★ <strong className="text-amber-400">{github.stars}</strong> Stars</span>
                      <span>•</span>
                      <span>⑂ <strong className="text-sky-400">{github.forks}</strong> Forks</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-500 pt-1 truncate">
                      Languages: {(github.topLanguages || []).slice(0, 3).join(', ') || 'N/A'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-500 py-2">GitHub metrics unavailable</p>
                )}
              </div>
            </div>

            {/* Resume */}
            <div className="p-5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Resume ATS Analysis</span>
                  <Link to={ROUTES.STUDENT_RESUME} className="text-xs font-mono text-orange-400 hover:text-orange-300 font-semibold">Studio →</Link>
                </div>
                {resume.status !== 'NOT_UPLOADED' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-extrabold font-mono text-white">Score: {resume.resumeScore || '—'}</p>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {resume.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400">
                      Evidence Strength: <strong className="text-white font-bold">{resume.evidenceStrength}</strong>
                    </p>
                    <p className="text-xs font-mono text-zinc-500 truncate pt-1">
                      File: {resume.fileName}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-500 py-2">No resume uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: APPLICATION FUNNEL ── */}
      {activeTab === 'APPLICATIONS' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Application Pipeline Funnel</h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                {applications.disclaimer || 'Deterministic conversion analysis across active interview and application stages.'}
              </p>
            </div>
            <Link
              to={ROUTES.STUDENT_APPLICATIONS}
              className="text-xs font-mono font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage Pipeline</span>
              <Icon d={ICONS.arrowRight} size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">1. Tracked</span>
              <p className="text-2xl font-extrabold font-mono text-white">{funnel.tracked}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">2. Applied</span>
              <p className="text-2xl font-extrabold font-mono text-sky-400">{funnel.applied}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">3. Assessment</span>
              <p className="text-2xl font-extrabold font-mono text-indigo-400">{funnel.oa}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">4. Interview</span>
              <p className="text-2xl font-extrabold font-mono text-purple-400">{funnel.interview}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-400">5. Final Round</span>
              <p className="text-2xl font-extrabold font-mono text-fuchsia-400">{funnel.finalRound}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#111422]/70 border border-white/[0.05] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">6. Offer</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-400">{funnel.offer}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
            <div className="p-4 rounded-xl bg-[#111422]/60 border border-white/[0.05] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-sky-400">Response Rate</span>
                <span className="text-xl font-extrabold font-mono text-sky-400">{applications.responseRate}%</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Applications reaching OA, Interview, Final Round, or Offer divided by total submitted applications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111422]/60 border border-white/[0.05] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-fuchsia-400">Interview Rate</span>
                <span className="text-xl font-extrabold font-mono text-fuchsia-400">{applications.interviewRate}%</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Applications reaching Interview, Final Round, or Offer stages divided by submitted applications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111422]/60 border border-white/[0.05] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-emerald-400">Offer Rate</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">{applications.offerRate}%</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Applications resulting in confirmed employment or internship offers divided by submitted applications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}