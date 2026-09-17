/**
 * SkillGap.jsx — /student/skill-gap
 *
 * Deterministic Skill Gap Analyzer for Career Odyssey.
 *
 * Compares target career role baseline requirements against:
 * 1. My Skills (SkillProfile)
 * 2. Resume Analyzer (Resume extracted data & projects)
 * 3. GitHub Profile (Languages & Repositories)
 * 4. DSA Tracker (LeetCode & Topics)
 *
 * Design: Executive Obsidian / Dark SaaS, Circular SVG Gauge,
 * 4 interactive telemetry filters, priority gaps showcase, and evidence inspection drawer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSkillGap } from '../../api/skillGap.api';
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
  search:    ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  close:     ['M18 6L6 18', 'M6 6l12 12'],
  sparkles:  'M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36l-2.12 2.12M8.76 15.24l-2.12 2.12M17.24 15.24l-2.12-2.12M8.76 8.76L6.64 6.64',
  shieldCheck: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
};

/* ── Status Theme Helpers ────────────────────────────────────── */
function getStatusBadge(status) {
  switch (status) {
    case 'COVERED':
      return {
        label: 'Covered',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dot: 'bg-emerald-400',
        ring: 'border-emerald-500/30',
        color: '#10b981',
      };
    case 'PARTIAL':
      return {
        label: 'Partial Coverage',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        dot: 'bg-amber-400',
        ring: 'border-amber-500/30',
        color: '#f59e0b',
      };
    case 'RESUME_EVIDENCE_MISSING':
      return {
        label: 'Resume Gap',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
        dot: 'bg-purple-400',
        ring: 'border-purple-500/30',
        color: '#a855f7',
      };
    case 'MISSING':
    default:
      return {
        label: 'Missing Skill',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dot: 'bg-rose-400',
        ring: 'border-rose-500/30',
        color: '#f43f5e',
      };
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'High Priority',
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: '🔴',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Priority',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: '🟠',
      };
    case 'LOW':
    default:
      return {
        label: 'Low Priority',
        badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
        icon: '🟢',
      };
  }
}

export default function SkillGap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & State
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, HIGH_PRIORITY, MISSING, PARTIAL, RESUME_GAP, COVERED
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // priority, importance, name
  const [selectedSkill, setSelectedSkill] = useState(null);

  const fetchAnalysis = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getSkillGap();
      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to retrieve skill gap analysis');
      }
    } catch (err) {
      console.error('Error loading skill gap:', err);
      setError(err.message || 'Unable to load skill gap analysis. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Filtered and Sorted Skills
  const filteredSkills = useMemo(() => {
    if (!data?.skills) return [];

    let list = [...data.skills];

    // Tab Filter
    if (activeTab === 'HIGH_PRIORITY') {
      list = list.filter((s) => s.priority === 'HIGH' && s.status !== 'COVERED');
    } else if (activeTab === 'MISSING') {
      list = list.filter((s) => s.status === 'MISSING');
    } else if (activeTab === 'PARTIAL') {
      list = list.filter((s) => s.status === 'PARTIAL');
    } else if (activeTab === 'RESUME_GAP') {
      list = list.filter((s) => s.status === 'RESUME_EVIDENCE_MISSING');
    } else if (activeTab === 'COVERED') {
      list = list.filter((s) => s.status === 'COVERED');
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.skill.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.reason.toLowerCase().includes(q)
      );
    }

    // Sorting
    const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        if (a.importance === 'required' && b.importance !== 'required') return -1;
        if (b.importance === 'required' && a.importance !== 'required') return 1;
        return a.skill.localeCompare(b.skill);
      }
      if (sortBy === 'importance') {
        if (a.importance === 'required' && b.importance !== 'required') return -1;
        if (b.importance === 'required' && a.importance !== 'required') return 1;
        return a.skill.localeCompare(b.skill);
      }
      if (sortBy === 'name') {
        return a.skill.localeCompare(b.skill);
      }
      return 0;
    });

    return list;
  }, [data, activeTab, searchQuery, sortBy]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Analyzing your skill profile & target role baselines...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <Icon d={ICONS.alert} size={24} />
          </div>
          <h3 className="text-lg font-bold text-rose-200 mb-2">Unable to Load Skill Gap</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchAnalysis()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State: No Career Goal Configured
  if (!data?.metadata?.hasCareerGoal) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 text-orange-400">
          <Icon d={ICONS.target} size={30} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Configure Your Career Target First
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
          The Skill Gap Analyzer compares your active skills, resume evidence, and GitHub/DSA projects against curated industry baselines for your desired target role.
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

  const { targetRole, summary, topPriorityGaps, dataSources } = data;
  const score = summary.overallScore;

  // Score color ring calculations
  const strokeDashoffset = 283 - (283 * score) / 100;
  const scoreRingColor =
    score >= 75 ? '#10b981' : score >= 50 ? '#f97316' : '#f43f5e';

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Icon d={ICONS.gap} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Skill Gap Analyzer
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Curated Baseline v1.0
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 max-w-2xl leading-relaxed">
            Evidence-based gap comparison of your active skills, resume proof, GitHub repos, and DSA against industry hiring baselines for{' '}
            <strong className="text-white font-semibold">{targetRole.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={ROUTES.STUDENT_CAREER_GOAL}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] hover:border-orange-500/30 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            <Icon d={ICONS.target} size={13} className="text-orange-400" />
            <span>Target: <strong className="text-white">{targetRole.name}</strong></span>
          </Link>

          <button
            onClick={() => fetchAnalysis(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            title="Recalculate analysis"
          >
            <Icon d={ICONS.refresh} size={13} className={refreshing ? 'animate-spin text-orange-400' : 'text-zinc-400'} />
            <span>{refreshing ? 'Recalculating...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {/* ── Score & Metrics Overview HUD ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Coverage Score Circular Gauge Card */}
        <div className="md:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#0a0c13] border border-white/[0.08] flex items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90 drop-shadow-[0_0_12px_rgba(249,115,22,0.15)]" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={scoreRingColor}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{score}</span>
              <span className="text-[10px] text-zinc-400 font-mono font-medium">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-orange-400 mb-1">
              Role Match Coverage
            </p>
            <h4 className="text-base font-bold text-white truncate mb-1">
              {score >= 75 ? 'Strong Role Alignment' : score >= 50 ? 'Moderate Foundation' : 'Core Gaps Identified'}
            </h4>
            <p className="text-xs text-zinc-400 leading-snug">
              Calibrated across <strong className="text-zinc-200">{summary.requiredSkillCount} required</strong> & {summary.preferredSkillCount} preferred competencies.
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Covered */}
          <div
            onClick={() => setActiveTab('COVERED')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'COVERED'
                ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                : 'bg-[#0f121d] border-white/[0.06] hover:border-emerald-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">Covered</span>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{summary.coveredCount}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Skills verified</p>
            </div>
          </div>

          {/* Partial */}
          <div
            onClick={() => setActiveTab('PARTIAL')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'PARTIAL'
                ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                : 'bg-[#0f121d] border-white/[0.06] hover:border-amber-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider">Partial</span>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{summary.partialCount}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Developing</p>
            </div>
          </div>

          {/* Missing */}
          <div
            onClick={() => setActiveTab('MISSING')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'MISSING'
                ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20'
                : 'bg-[#0f121d] border-white/[0.06] hover:border-rose-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
              <span className="text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider">Missing</span>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{summary.missingCount}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">No evidence</p>
            </div>
          </div>

          {/* Resume Gap */}
          <div
            onClick={() => setActiveTab('RESUME_GAP')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeTab === 'RESUME_GAP'
                ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20'
                : 'bg-[#0f121d] border-white/[0.06] hover:border-purple-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
              <span className="text-[10px] font-mono font-semibold text-purple-400 uppercase tracking-wider">Resume Gap</span>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{summary.resumeEvidenceMissingCount}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Lacks proof</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SIH 26044 Closed Feedback Loop: Industry Recruiter Evaluation ── */}
      {data.industryEvaluations && data.industryEvaluations.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0f121d] to-zinc-900 border border-purple-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <span>Industry Recruiter Evaluation Feedback Loop</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    SIH 26044
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Direct interview evaluation telemetry received from healthcare industry recruitment partners.
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.STUDENT_ROADMAP}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>View Actionable Roadmap →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.industryEvaluations.map((evalItem, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 font-mono">
                    Evaluation Recommendation: <strong className="text-white px-2 py-0.5 rounded bg-purple-500/20">{evalItem.recommendation}</strong>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Overall Score: <strong className="text-white">{evalItem.scores?.overall}%</strong>
                  </span>
                </div>

                {/* Scores grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 block">Technical</span>
                    <span className="font-bold text-white">{evalItem.scores?.technical}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 block">Problem Solving</span>
                    <span className="font-bold text-white">{evalItem.scores?.problemSolving}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 block">Communication</span>
                    <span className="font-bold text-white">{evalItem.scores?.communication}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-zinc-500 block">Teamwork</span>
                    <span className="font-bold text-white">{evalItem.scores?.teamwork}%</span>
                  </div>
                </div>

                {/* Weaknesses / Missing Competencies */}
                {evalItem.weaknesses && evalItem.weaknesses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                      Recruiter-Observed Weaknesses &amp; Gaps:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {evalItem.weaknesses.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/30 text-xs flex items-center gap-1.5"
                        >
                          <span className="text-amber-400">⚠️</span>
                          <span>{w}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qualitative Feedback */}
                {evalItem.feedback && (
                  <div className="pt-2 border-t border-white/5 text-xs text-zinc-300">
                    <span className="text-zinc-500 font-medium block text-[10px] uppercase">Recruiter Notes:</span>
                    <p className="italic text-zinc-300 mt-0.5">"{evalItem.feedback}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Priority Gaps Hero Banner ─────────────────────────── */}
      {topPriorityGaps.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Top Priority Missing Competencies
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[11px] font-bold font-mono border border-rose-500/25">
                {topPriorityGaps.length} Critical Blocker{topPriorityGaps.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Closing these primary gaps will yield the highest readiness score jump.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPriorityGaps.slice(0, 3).map((gap) => {
              const statusTheme = getStatusBadge(gap.status);
              const priorityTheme = getPriorityBadge(gap.priority);

              return (
                <div
                  key={gap.skill}
                  onClick={() => setSelectedSkill(gap)}
                  className="p-5 rounded-2xl bg-[#0f121d] border border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.02] transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${priorityTheme.badge}`}>
                        {priorityTheme.icon} {priorityTheme.label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusTheme.badge}`}>
                        {statusTheme.label}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors mb-1.5">
                      {gap.skill}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {gap.reason}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                      {gap.status === 'RESUME_EVIDENCE_MISSING' ? 'Proof missing from resume' : gap.recommendation}
                    </span>
                    <span className="text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-1 text-[11px]">
                      Inspect <Icon d={ICONS.arrow} size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Skills Explorer Section ───────────────────────────────── */}
      <div className="space-y-4">
        {/* Controls Bar: Tabs, Search & Sort */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: `All Skills (${data.skills.length})` },
              { id: 'HIGH_PRIORITY', label: 'High Priority' },
              { id: 'MISSING', label: `Missing (${summary.missingCount})` },
              { id: 'PARTIAL', label: `Partial (${summary.partialCount})` },
              { id: 'RESUME_GAP', label: `Resume Gap (${summary.resumeEvidenceMissingCount})` },
              { id: 'COVERED', label: `Covered (${summary.coveredCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-56">
              <Icon
                d={ICONS.search}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search skills, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
            >
              <option value="priority">Sort: Priority</option>
              <option value="importance">Sort: Importance</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Skills Cards Grid */}
        {filteredSkills.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0f121d] border border-white/[0.06] text-center">
            <p className="text-zinc-400 text-sm font-medium">No skills match the current search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((item) => {
              const statusTheme = getStatusBadge(item.status);
              const priorityTheme = getPriorityBadge(item.priority);

              return (
                <div
                  key={item.skill}
                  onClick={() => setSelectedSkill(item)}
                  className="p-5 rounded-2xl bg-[#0f121d] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02] transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[15px] font-bold text-white group-hover:text-orange-400 transition-colors">
                            {item.skill}
                          </h4>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 capitalize mt-0.5 block">
                          {item.importance} requirement • Min: <strong className="text-zinc-300">{item.minProficiency}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusTheme.badge}`}>
                          {statusTheme.label}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {item.reason}
                    </p>

                    {/* Evidence Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* My Skills Evidence */}
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                          item.evidence.profile.hasProfile
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        <Icon d={ICONS.skills} size={11} />
                        {item.evidence.profile.hasProfile
                          ? `Profile: ${item.evidence.profile.level}`
                          : 'Not in Skills'}
                      </span>

                      {/* Resume Evidence */}
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                          item.evidence.resume.hasEvidence
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : item.status === 'RESUME_EVIDENCE_MISSING'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        <Icon d={ICONS.resume} size={11} />
                        {item.evidence.resume.hasEvidence
                          ? `Resume: ${item.evidence.resume.mentions} mention${item.evidence.resume.mentions > 1 ? 's' : ''}`
                          : item.status === 'RESUME_EVIDENCE_MISSING'
                          ? 'Resume Proof Missing'
                          : 'No Resume Proof'}
                      </span>

                      {/* GitHub Evidence */}
                      {item.evidence.github.hasEvidence && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                          <Icon d={ICONS.github} size={11} />
                          GitHub: {item.evidence.github.repoCount} repo{item.evidence.github.repoCount > 1 ? 's' : ''}
                        </span>
                      )}

                      {/* DSA Evidence */}
                      {item.evidence.dsa.hasEvidence && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                          <Icon d={ICONS.dsa} size={11} />
                          DSA: {item.evidence.dsa.totalSolved} solved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommendation Preview & Action */}
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                      💡 {item.recommendation}
                    </span>
                    <span className="text-orange-400 font-semibold text-[11px] shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Inspect <Icon d={ICONS.arrow} size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Evidence Sources Footer & Disclaimers ──────────────────── */}
      <div className="p-6 rounded-2xl bg-[#0f121d] border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">Synthesized Evidence Sources</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deterministic skill mapping evaluated from your active platform profiles.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Calculated: {new Date(data.metadata.calculatedAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* My Skills */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dataSources.skillProfile.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
              <Icon d={ICONS.skills} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">My Skills</p>
              <p className="text-[11px] font-mono text-zinc-400">
                {dataSources.skillProfile.connected ? `${dataSources.skillProfile.count} skills listed` : 'Not configured'}
              </p>
            </div>
          </div>

          {/* Resume */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dataSources.resume.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
              <Icon d={ICONS.resume} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Resume Analyzer</p>
              <p className="text-[11px] font-mono text-zinc-400">
                {dataSources.resume.connected ? 'Analysis active' : 'No resume uploaded'}
              </p>
            </div>
          </div>

          {/* GitHub */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dataSources.github.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
              <Icon d={ICONS.github} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">GitHub</p>
              <p className="text-[11px] font-mono text-zinc-400">
                {dataSources.github.connected ? `@${dataSources.github.username}` : 'Not connected'}
              </p>
            </div>
          </div>

          {/* DSA */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dataSources.dsa.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
              <Icon d={ICONS.dsa} size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">DSA / LeetCode</p>
              <p className="text-[11px] font-mono text-zinc-400">
                {dataSources.dsa.connected ? `${dataSources.dsa.totalSolved} solved` : 'No data recorded'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
          * Requirements are curated software engineering industry baselines for student benchmarking and do not constitute official external mandates. Skill profiles and resume files are never modified automatically without explicit student confirmation.
        </p>
      </div>

      {/* ── Journey Next Steps Card ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/20 via-[#0f121d] to-[#0d101a] border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
            Next In Your Career Journey
          </span>
          <h4 className="text-sm font-bold text-white">Bridge Missing Competencies with Structured Milestones</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Convert detected skill gaps into an actionable curriculum through your dynamic career roadmap, or build recommended portfolio projects to generate recruiter-verified proof of work.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to={ROUTES.STUDENT_ROADMAP}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5"
          >
            <span>View Roadmap</span>
            <Icon d={ICONS.arrow} size={12} />
          </Link>
          <Link
            to={ROUTES.STUDENT_PROJECTS}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
          >
            Build Projects
          </Link>
        </div>
      </div>

      {/* ── Skill Detail Inspection Modal / Drawer ────────────────── */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#0d101a] border border-white/[0.12] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{selectedSkill.skill}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(selectedSkill.status).badge}`}>
                    {getStatusBadge(selectedSkill.status).label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {selectedSkill.category} • <span className="capitalize">{selectedSkill.importance}</span> requirement for {targetRole.name}
                </p>
              </div>

              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {/* Why it Matters */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <h5 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-orange-400">
                Why this skill is required
              </h5>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {selectedSkill.reason}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-400">
                <span>Target Minimum: <strong className="text-white capitalize">{selectedSkill.minProficiency}</strong></span>
                <span>•</span>
                <span>Your Level: <strong className="text-white capitalize">{selectedSkill.studentProficiency || 'None'}</strong></span>
              </div>
            </div>

            {/* Evidence Evaluation */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Multi-Vector Evidence Evaluation
              </h5>

              {/* My Skills */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                <Icon d={ICONS.skills} size={16} className="text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-white">My Skills Profile</p>
                  <p className="text-zinc-400 mt-0.5">
                    {selectedSkill.evidence.profile.hasProfile
                      ? `Listed as ${selectedSkill.evidence.profile.level} proficiency (${selectedSkill.evidence.profile.yearsOfExperience} yrs experience).`
                      : 'Skill not currently registered in your My Skills profile.'}
                  </p>
                </div>
              </div>

              {/* Resume Analyzer */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                <Icon d={ICONS.resume} size={16} className="text-purple-400 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-white">Resume Evidence</p>
                  <p className="text-zinc-400 mt-0.5">
                    {selectedSkill.evidence.resume.hasEvidence
                      ? `Detected ${selectedSkill.evidence.resume.mentions} time(s) across projects and experience bullets.`
                      : selectedSkill.status === 'RESUME_EVIDENCE_MISSING'
                      ? 'No project or experience proof detected on your current resume.'
                      : 'Not found in resume text analysis.'}
                  </p>
                  {selectedSkill.evidence.resume.projectNames?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSkill.evidence.resume.projectNames.map((p) => (
                        <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub */}
              {selectedSkill.evidence.github.hasEvidence && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                  <Icon d={ICONS.github} size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-white">GitHub Activity</p>
                    <p className="text-zinc-400 mt-0.5">
                      Found in {selectedSkill.evidence.github.repoCount} repository language tags or descriptions.
                    </p>
                  </div>
                </div>
              )}

              {/* DSA */}
              {selectedSkill.evidence.dsa.hasEvidence && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                  <Icon d={ICONS.dsa} size={16} className="text-sky-400 mt-0.5 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-white">DSA / Problem Solving</p>
                    <p className="text-zinc-400 mt-0.5">
                      {selectedSkill.evidence.dsa.totalSolved} problems tracked. Algorithmic implementation verified.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation Box */}
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-1">
              <h5 className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                Actionable Recommendation
              </h5>
              <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                {selectedSkill.recommendation}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              {selectedSkill.status === 'RESUME_EVIDENCE_MISSING' && (
                <Link
                  to={ROUTES.STUDENT_RESUME}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20"
                >
                  Improve Resume
                </Link>
              )}

              {!selectedSkill.evidence.profile.hasProfile && (
                <Link
                  to={ROUTES.STUDENT_SKILLS}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.1] transition-all"
                >
                  Add to My Skills
                </Link>
              )}

              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}git