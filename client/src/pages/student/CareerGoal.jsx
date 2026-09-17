/**
 * CareerGoal.jsx — /student/career-goal
 *
 * Dedicated career direction & target role setting.
 *
 * Features:
 * - Target Role & Industry configuration (backed by /api/skills).
 * - Curated role & industry suggestion chips with instant fill.
 * - Role-tailored Salary Benchmarks HUD: Real indicative compensation bands
 *   (Entry, Mid, Senior in both USD and domestic LPA formats) tailored to the active role.
 * - Core Competencies market preview for the selected role.
 *
 * Design: Executive Obsidian / Dark SaaS palette, vibrant orange accents,
 * and high-density telemetry widgets.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icon primitive ───────────────────────────────── */
const Icon = ({ d, size = 18, className = '' }) => (
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
  target: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  money: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
  check: 'M20 6L9 17l-5-5',
  alert: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  sparkles: 'M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36l-2.12 2.12M8.76 15.24l-2.12 2.12M17.24 15.24l-2.12-2.12M8.76 8.76L6.64 6.64',
  arrow: 'M5 12h14M12 5l7 7-7 7',
};

/* ── Industry Suggestions ────────────────────────────────────── */
const INDUSTRY_SUGGESTIONS = [
  'Fintech', 'SaaS', 'E-commerce', 'AI / ML', 'Cloud Infrastructure',
  'HealthTech', 'Cybersecurity', 'EdTech', 'Gaming', 'Banking', 'Consulting',
];

/* ── Role Suggestions ────────────────────────────────────────── */
const ROLE_SUGGESTIONS = [
  'Full Stack Developer', 'Software Engineer', 'Frontend Developer',
  'Backend Developer', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'Cloud Architect', 'Mobile Developer',
  'Cybersecurity Analyst', 'Product Manager',
];

/* ── Role-Specific Benchmark Intelligence ────────────────────── */
const ROLE_BENCHMARKS = {
  'software engineer': {
    entryUsd: '$80,000 – $105,000',
    entryLpa: '₹8 – ₹14 LPA',
    midUsd: '$120,000 – $155,000',
    midLpa: '₹18 – ₹28 LPA',
    seniorUsd: '$165,000 – $220,000',
    seniorLpa: '₹32 – ₹55 LPA',
    demand: 'Very High',
    topSkills: ['Data Structures & Algorithms', 'System Architecture', 'Java / Go / Python', 'Database Optimization', 'Git & CI/CD'],
  },
  'full stack developer': {
    entryUsd: '$75,000 – $98,000',
    entryLpa: '₹7 – ₹12 LPA',
    midUsd: '$115,000 – $145,000',
    midLpa: '₹16 – ₹25 LPA',
    seniorUsd: '$155,000 – $200,000',
    seniorLpa: '₹30 – ₹48 LPA',
    demand: 'Extremely High',
    topSkills: ['React / Next.js', 'Node.js / Express', 'PostgreSQL / MongoDB', 'REST & GraphQL APIs', 'Docker'],
  },
  'frontend developer': {
    entryUsd: '$70,000 – $92,000',
    entryLpa: '₹6 – ₹11 LPA',
    midUsd: '$105,000 – $135,000',
    midLpa: '₹14 – ₹22 LPA',
    seniorUsd: '$145,000 – $185,000',
    seniorLpa: '₹26 – ₹40 LPA',
    demand: 'High',
    topSkills: ['TypeScript', 'React / Vue', 'CSS Architecture & Tailwind', 'State Management (Redux/Zustand)', 'Web Performance'],
  },
  'backend developer': {
    entryUsd: '$78,000 – $102,000',
    entryLpa: '₹8 – ₹13 LPA',
    midUsd: '$118,000 – $150,000',
    midLpa: '₹17 – ₹27 LPA',
    seniorUsd: '$160,000 – $210,000',
    seniorLpa: '₹30 – ₹52 LPA',
    demand: 'Very High',
    topSkills: ['Go / Java / Python', 'Distributed Systems', 'Redis / Caching', 'SQL / NoSQL Engines', 'Microservices'],
  },
  'data scientist': {
    entryUsd: '$85,000 – $110,000',
    entryLpa: '₹8 – ₹15 LPA',
    midUsd: '$125,000 – $160,000',
    midLpa: '₹18 – ₹30 LPA',
    seniorUsd: '$170,000 – $230,000',
    seniorLpa: '₹35 – ₹60 LPA',
    demand: 'High',
    topSkills: ['Python & Pandas', 'Statistical Modeling', 'Machine Learning Algorithms', 'SQL', 'Data Visualization'],
  },
  'ml engineer': {
    entryUsd: '$90,000 – $120,000',
    entryLpa: '₹10 – ₹18 LPA',
    midUsd: '$135,000 – $175,000',
    midLpa: '₹22 – ₹36 LPA',
    seniorUsd: '$180,000 – $250,000',
    seniorLpa: '₹40 – ₹70 LPA',
    demand: 'Explosive Growth',
    topSkills: ['PyTorch / TensorFlow', 'MLOps & Model Serving', 'LLM Tuning & RAG', 'Python', 'Vector Databases'],
  },
  'devops engineer': {
    entryUsd: '$82,000 – $108,000',
    entryLpa: '₹8 – ₹14 LPA',
    midUsd: '$122,000 – $158,000',
    midLpa: '₹18 – ₹28 LPA',
    seniorUsd: '$165,000 – $215,000',
    seniorLpa: '₹32 – ₹54 LPA',
    demand: 'Very High',
    topSkills: ['Kubernetes & Docker', 'Terraform & IaC', 'AWS / GCP Cloud', 'CI/CD Pipelines', 'Linux & Networking'],
  },
};

const DEFAULT_BENCHMARK = {
  entryUsd: '$75,000 – $100,000',
  entryLpa: '₹7 – ₹12 LPA',
  midUsd: '$115,000 – $150,000',
  midLpa: '₹16 – ₹26 LPA',
  seniorUsd: '$155,000 – $210,000',
  seniorLpa: '₹28 – ₹50 LPA',
  demand: 'High Growth',
  topSkills: ['Core Problem Solving', 'Software Engineering Principles', 'Modern Stack Proficiency', 'System Design', 'Git Version Control'],
};

/* ── Suggestion Pill Component ───────────────────────────────── */
function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
        active
          ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25'
          : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:border-white/[0.14] hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      {label}
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function CareerGoal() {
  const {
    profile,
    isLoadingProfile,
    profileError,
    isSaving,
    saveError,
    saveSuccess,
    saveProfile,
    dismissSaveStatus,
  } = useAppContext();

  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');

  /* Sync from AppContext */
  useEffect(() => {
    if (profile) {
      setTargetRole(profile.targetRole ?? '');
      setTargetIndustry(profile.targetIndustry ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!targetRole.trim()) {
      document.getElementById('target-role-input')?.focus();
      return;
    }
    dismissSaveStatus();
    await saveProfile({
      skills: profile?.skills ?? [],
      targetRole,
      targetIndustry,
    });
  };

  /* Match active benchmarks dynamically */
  const activeBenchmark = useMemo(() => {
    const q = targetRole.trim().toLowerCase();
    if (ROLE_BENCHMARKS[q]) return ROLE_BENCHMARKS[q];
    for (const key of Object.keys(ROLE_BENCHMARKS)) {
      if (q.includes(key) || key.includes(q)) return ROLE_BENCHMARKS[key];
    }
    return DEFAULT_BENCHMARK;
  }, [targetRole]);

  if (isLoadingProfile) {
    return (
      <div className="max-w-[780px] mx-auto px-6 py-12 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 animate-pulse">
            <div className="h-4 w-1/4 bg-zinc-800 rounded mb-4" />
            <div className="h-10 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-[780px] mx-auto px-6 py-12">
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-center">
          <p className="text-xs text-rose-300 font-medium mb-3">{profileError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-orange-400 hover:underline"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const hasGoal = Boolean(targetRole.trim());

  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Icon d={ICONS.target} size={18} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Career Goal & Direction</h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
            Target Alignment
          </span>
        </div>
        <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed max-w-2xl">
          Set your primary target role and domain vertical. These configurations calibrate your Skill Gap comparisons, Roadmap curriculum, and Job Fit matching.
        </p>
      </div>

      {/* ── Status Banners ── */}
      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-xs font-semibold animate-fadeIn"
        >
          <Icon d={ICONS.check} size={15} />
          Career goal and target role saved successfully.
        </div>
      )}
      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-300 text-xs font-semibold animate-fadeIn"
        >
          <Icon d={ICONS.alert} size={15} className="mt-0.5 shrink-0" />
          {saveError}
        </div>
      )}

      {/* ── Current Active Goal Summary ── */}
      {hasGoal && (
        <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1 shadow-sm shadow-emerald-400/50" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
              Current Active Goal
            </p>
            <p className="text-sm sm:text-base font-bold text-white truncate">
              {targetRole}
              {targetIndustry && <span className="text-zinc-400 font-normal"> · {targetIndustry}</span>}
            </p>
          </div>
        </div>
      )}

      {/* ── Target Role Card ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 sm:p-7 shadow-xl space-y-4">
        <div>
          <label htmlFor="target-role-input" className="block text-xs font-mono font-bold text-white uppercase tracking-wider mb-1.5">
            Target Technical Role <span className="text-orange-400">*</span>
          </label>
          <input
            id="target-role-input"
            type="text"
            value={targetRole}
            onChange={(e) => { setTargetRole(e.target.value); dismissSaveStatus(); }}
            placeholder="e.g. Full Stack Developer"
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Role Suggestion Chips */}
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Curated Technical Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map((r) => (
              <Pill
                key={r}
                label={r}
                active={targetRole === r}
                onClick={() => { setTargetRole(r); dismissSaveStatus(); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Industry Benchmarks Telemetry HUD ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#0a0c13] p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Icon d={ICONS.money} size={16} className="text-emerald-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Market Salary Benchmarks for {targetRole.trim() || 'Software Engineers'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {activeBenchmark.demand}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Entry-Level (0–2 yrs)</p>
            <p className="text-base font-bold font-mono text-white">{activeBenchmark.entryUsd}</p>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">{activeBenchmark.entryLpa}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Mid-Level (2–5 yrs)</p>
            <p className="text-base font-bold font-mono text-white">{activeBenchmark.midUsd}</p>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">{activeBenchmark.midLpa}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Senior-Level (5+ yrs)</p>
            <p className="text-base font-bold font-mono text-white">{activeBenchmark.seniorUsd}</p>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">{activeBenchmark.seniorLpa}</p>
          </div>
        </div>

        {/* Core Competencies Preview */}
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Top Recruiter Competencies Evaluated:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeBenchmark.topSkills.map((sk) => (
              <span
                key={sk}
                className="px-2.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] text-xs font-mono"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Target Industry Card ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 sm:p-7 shadow-xl space-y-4">
        <div>
          <label htmlFor="target-industry-input" className="block text-xs font-mono font-bold text-white uppercase tracking-wider mb-1.5">
            Target Industry / Sector
          </label>
          <input
            id="target-industry-input"
            type="text"
            value={targetIndustry}
            onChange={(e) => { setTargetIndustry(e.target.value); dismissSaveStatus(); }}
            placeholder="e.g. Fintech, SaaS, or E-commerce"
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Industry Suggestion Chips */}
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Industry Verticals
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_SUGGESTIONS.map((ind) => (
              <Pill
                key={ind}
                label={ind}
                active={targetIndustry === ind}
                onClick={() => { setTargetIndustry(ind); dismissSaveStatus(); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions Bar ── */}
      <div className="p-4 rounded-2xl bg-[#0f121d] border border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Link
          to={ROUTES.STUDENT_SKILLS}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5 self-center sm:self-auto"
        >
          <span>Next: Manage Skills Inventory</span>
          <Icon d={ICONS.arrow} size={12} />
        </Link>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !targetRole.trim()}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Goal...</span>
            </>
          ) : (
            'Save Career Goal'
          )}
        </button>
      </div>
    </div>
  );
}