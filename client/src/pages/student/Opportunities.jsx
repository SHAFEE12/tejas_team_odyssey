/**
 * Opportunities.jsx — /student/opportunities
 *
 * Career Opportunities & Application Tracking module.
 * Executive Obsidian Design System matching Career Odyssey Dashboard theme.
 *
 * Features:
 * - Card layout inspired by modern job board design:
 *   [Brand Logo + Fit Pill] [Save Bookmark]
 *   [Company • Relative Date]
 *   [Role Title (Bold, Title-Cased)]
 *   [Pill Badges: Type, Work Mode, Experience, Skill]
 *   [Bold Salary / Stipend + Location] [Apply Now / Applied]
 * - 100% theme-aligned with dashboard dark obsidian palette (#08090d, #0f121d, orange accents)
 * - Deterministic Job Fit score telemetry
 * - Enterprise Quick Apply modal with verified telemetry preview
 * - Deep 8-vector explainability drawer & Kanban-style Pipeline Tracker
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getOpportunities,
  getApplications,
  saveOpportunity,
  updateApplication,
  deleteApplication,
} from '../../api/opportunities.api';
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
  compass: ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z'],
  pipeline: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'],
  location: ['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', 'M12 7a2 2 0 100 4 2 2 0 000-4z'],
  clock: ['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 6v6l4 2'],
  money: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
  search: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  arrow: 'M5 12h14M12 5l7 7-7 7',
  check: 'M20 6L9 17l-5-5',
  send: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
};

/* ── Typography & Relative Date Helpers ───────────────────────── */
const ROLE_TITLE_FORMAT = {
  'frontend developer': 'Frontend Developer',
  'software engineering': 'Software Engineering',
  'swe': 'Software Engineer',
  'devops intern': 'DevOps Intern',
  'backend engineer': 'Backend Engineer',
  'mobile app developer intern': 'Mobile App Developer Intern',
  'full stack developer intern': 'Full Stack Developer Intern',
  'junior software engineer': 'Junior Software Engineer',
  'software engineering intern': 'Software Engineering Intern',
  'senior ui/ux designer': 'Senior UI/UX Designer',
  'graphic designer': 'Graphic Designer',
  'senior motion designer': 'Senior Motion Designer',
  'ux designer': 'UX Designer',
  'junior ui/ux designer': 'Junior UI/UX Designer',
};

function formatRoleTitle(title) {
  if (!title) return '';
  const lower = title.toLowerCase().trim();
  if (ROLE_TITLE_FORMAT[lower]) return ROLE_TITLE_FORMAT[lower];
  return title
    .split(' ')
    .map((word) => {
      const w = word.trim();
      if (!w) return '';
      const wLower = w.toLowerCase();
      if (['and', 'or', 'in', 'at', 'of', 'for', 'to', '&'].includes(wLower)) return wLower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

const SKILL_NAME_FORMAT = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  'java script': 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  react: 'React',
  'react.js': 'React',
  'react native': 'React Native',
  node: 'Node.js',
  'node.js': 'Node.js',
  mongodb: 'MongoDB',
  git: 'Git',
  'rest api': 'REST API',
  aws: 'AWS',
  gcp: 'GCP',
  docker: 'Docker',
  linux: 'Linux',
  dsa: 'DSA',
  sql: 'SQL',
  nosql: 'NoSQL',
  python: 'Python',
  java: 'Java',
  'c++': 'C++',
  bash: 'Bash',
};

function formatSkillName(s) {
  if (!s) return '';
  const lower = s.toLowerCase().trim();
  if (SKILL_NAME_FORMAT[lower]) return SKILL_NAME_FORMAT[lower];
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '3 days ago';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function getCompanyInitials(name) {
  if (!name) return 'CO';
  const clean = name.replace(/technologies|inc|labs|solutions|studio|systems/gi, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const COMPANY_GRADIENTS = [
  { bg: 'from-orange-500/20 via-amber-500/15 to-yellow-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { bg: 'from-indigo-500/20 via-purple-500/15 to-violet-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { bg: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'from-sky-500/20 via-blue-500/15 to-indigo-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
  { bg: 'from-rose-500/20 via-pink-500/15 to-fuchsia-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'from-teal-500/20 via-emerald-500/15 to-cyan-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
];

function getCompanyStyle(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COMPANY_GRADIENTS.length;
  return COMPANY_GRADIENTS[idx];
}

/* ── Brand Logo Component with Dark Palette Alignment ─────────── */
function CompanyLogo({ company }) {
  const c = (company || '').toLowerCase().trim();

  if (c.includes('google')) {
    return (
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md shrink-0 border border-white/10">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      </div>
    );
  }

  
  if (c.includes('amazon')) {
    return (
      <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-md shrink-0">
        <span className="font-serif font-black text-white text-2xl leading-none -translate-y-0.5">a</span>
      </div>
    );
  }

   if (c.includes('apple')) {
    return (
      <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-md shrink-0">
        <svg width="20" height="20" viewBox="0 0 170 170" fill="white">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.55-11.27-20.48-14.92-32.78-3.66-12.3-5.5-23.77-5.5-34.41 0-14.91 3.73-26.79 11.19-35.63 7.46-8.84 16.71-13.39 27.75-13.64 4.58 0 9.77 1.25 15.58 3.75 5.8 2.5 9.72 3.86 11.75 4.09 2.03-.23 6.13-1.64 12.3-4.22 6.17-2.58 11.28-3.75 15.34-3.51 12.05.61 21.84 4.78 29.36 12.51-10.42 6.25-15.51 14.86-15.26 25.82.25 8.71 3.59 16.03 10.02 21.96 6.44 5.94 14.12 9.29 23.05 10.05-2.03 6.09-4.58 12.51-7.65 19.26zm-32.32-114.7c0 6.64-2.51 13.06-7.53 18.25-5.02 5.2-11.27 8.35-18.75 9.47-.25-.97-.37-1.89-.37-2.77 0-6.4 2.65-12.83 7.95-18.3 5.3-5.46 11.47-8.52 18.52-9.17.13.84.18 1.68.18 2.52z"/>
        </svg>
      </div>
    );
  }

  if (c.includes('figma')) {
    return (
      <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-md shrink-0">
        <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
          <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
          <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
          <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
          <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
          <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
        </svg>
      </div>
    );
  }

   if (c.includes('airbnb')) {
    return (
      <div className="w-12 h-12 rounded-full bg-[#FF5A5F] border border-white/10 flex items-center justify-center shadow-md shrink-0">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="white">
          <path d="M16 1c-4.4 0-8 3.6-8 8 0 5.4 6.7 13.8 7.3 14.5.4.4 1 .4 1.4 0 .6-.7 7.3-9.1 7.3-14.5 0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
        </svg>
      </div>
    );
  }

   if (c.includes('dribbble')) {
    return (
      <div className="w-12 h-12 rounded-full bg-[#EA4C89] border border-white/10 flex items-center justify-center shadow-md shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94"/>
          <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32"/>
          <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72"/>
        </svg>
      </div>
    );
  }

  // Default circular avatar styled for dark theme
  const style = getCompanyStyle(company);
  const initials = getCompanyInitials(company);
  return (
    <div
      className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center font-mono font-black text-sm ${style.text} shadow-md shrink-0`}
    >
      {initials}
    </div>
  );
}
/* ── Executive Obsidian Job Card (Matching Reference Layout) ─── */
function OpportunityCard({ opp, onView, onSave, onApplyClick, isActioned, saving }) {
  const isSaved = opp.applicationStatus === 'saved';
  const isApplied = opp.applicationStatus === 'applied' || isActioned;
  const isPartner = opp.industry || opp.isDemo === false;
  const timeAgo = getTimeAgo(opp.createdAt);

  const levelLabel = opp.experienceLevel === 'senior' ? 'Senior Level' :
                     opp.experienceLevel === 'mid' ? 'Mid Level' :
                     opp.experienceLevel === 'internship' ? 'Internship' :
                     'Entry Level';

  const workModeLabel = opp.workMode === 'remote' || opp.remote ? 'Remote' :
                        opp.workMode === 'hybrid' ? 'Flexible Schedule' : 'In office';

                     return (
    <div
      id={`opp-card-${opp._id}`}
      className="group relative flex flex-col justify-between rounded-[28px] p-6 sm:p-7 cursor-pointer transition-all duration-300 bg-[#0f121d] hover:bg-[#141726] text-zinc-100 border border-white/[0.08] hover:border-orange-500/40 shadow-[0_12px_36px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.7),0_0_20px_rgba(249,115,22,0.06)] hover:-translate-y-0.5"
      onClick={() => onView(opp)}
    ></div>
      {/* Top row: Circular Logo + Fit Ring indicator + Save Bookmark button */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <CompanyLogo company={opp.company} />
            {opp.fitScore !== undefined && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/[0.05] border border-white/[0.08] text-zinc-200"
                title="Deterministic Job Fit"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      opp.fitScore >= 70 ? '#10b981' :
                      opp.fitScore >= 50 ? '#38bdf8' :
                      opp.fitScore >= 35 ? '#f97316' : '#f43f5e',
                    boxShadow:
                      opp.fitScore >= 70 ? '0 0 8px rgba(16,185,129,0.5)' :
                      opp.fitScore >= 50 ? '0 0 8px rgba(56,189,248,0.5)' :
                      opp.fitScore >= 35 ? '0 0 8px rgba(249,115,22,0.5)' : 'none',
                  }}
                />
                <span>{opp.fitScore}% Fit</span>
              </div>
            )}
          </div>
           {/* Bookmark Button */}
          <button
            type="button"
            id={`btn-save-${opp._id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSave(opp._id);
            }}
            disabled={saving === opp._id}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              isSaved
                ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08]'
            }`}
          >
            <span>{isSaved ? 'Saved' : 'Save'}</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
                   <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Company name + time ago */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-semibold text-sm text-zinc-300 truncate">
            {opp.company}
          </span>
          <span className="text-xs text-zinc-500 shrink-0 font-normal">
            {timeAgo}
          </span>
          {isPartner && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
              Partner
            </span>
          )}
        </div>
          {/* Job Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug mb-4 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {formatRoleTitle(opp.title)}
        </h3>

           {/* Pill Tags Row (Aligned with Dashboard Theme) */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <span className="px-3 py-1 rounded-xl text-xs font-medium capitalize bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {opp.type}
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
            {workModeLabel}
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-300 border border-white/[0.07]">
            {levelLabel}
          </span>
          {opp.requiredSkills?.[0] && (
            <span className="px-3 py-1 rounded-xl text-xs font-medium bg-white/[0.03] text-zinc-400 border border-white/[0.05]">
              {formatSkillName(opp.requiredSkills[0])}
            </span>
          )}
        </div>
          </div>

      {/* Footer: Salary & Location on Left, Apply Now on Right */}
      <div
        className="flex items-end justify-between gap-4 pt-4 border-t border-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5 min-w-0">
          <p className="text-base sm:text-lg font-extrabold text-white font-mono tracking-tight truncate">
            {opp.stipend && opp.stipend !== 'Not disclosed' ? opp.stipend : '$100-150k'}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {opp.location}
          </p>
        </div>

  {isApplied ? (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shrink-0">
            <Icon d={ICONS.check} size={13} />
            <span>Applied</span>
          </div>
        ) : (
          <button
            type="button"
            id={`btn-apply-${opp._id}`}
            disabled={saving === opp._id}
            onClick={() => onApplyClick(opp)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
              {saving === opp._id ? '…' : 'Apply now'}
          </button>
        )}
      </div>
    </div>
  );
}
         /* ── Quick Apply Confirmation Modal ──────────────────────────── */
function QuickApplyModal({ opp, onClose, onConfirm, submitting }) {
  if (!opp) return null;
  const isPartner = opp.industry || opp.isDemo === false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" role="dialog">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0c0e17] border border-white/[0.12] shadow-2xl p-6 sm:p-7 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CompanyLogo company={opp.company} />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
                Direct Recruiter Application
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {formatRoleTitle(opp.title)}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Icon d={ICONS.close} size={16} />
          </button>
        </div>

         {/* Company & Location Info */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-200">{opp.company}</p>
            <p className="text-[11px] text-zinc-400">{opp.location} • {opp.stipend || 'Competitive'}</p>
          </div>
          {isPartner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified Industry Partner
            </span>
          )}
        </div>

            {/* Telemetry Transmitted */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono font-semibold text-zinc-300 uppercase tracking-wider">
            Verified Proof Transmitted with Application:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-200">
              <Icon d={ICONS.check} size={13} className="text-emerald-400" />
              <span className="truncate">Skill Profile & Level</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-200">
              <Icon d={ICONS.check} size={13} className="text-blue-400" />
              <span className="truncate">Verified GitHub Evidence</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-purple-200">
              <Icon d={ICONS.check} size={13} className="text-purple-400" />
              <span className="truncate">Active Project Portfolio</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-200">
              <Icon d={ICONS.check} size={13} className="text-amber-400" />
              <span className="truncate">ATS-Parsed Resume</span>
            </div>
          </div>
        </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
          Your profile will be directly cataloged into the employer’s applicant tracking system with deterministic match explainability.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onConfirm(opp._id)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
             {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Transmitting…</span>
              </>
            ) : (
              <>
                <span>Confirm & Submit</span>
                <Icon d={ICONS.arrow} size={12} />
              </>
            )}
              </button>
              </div>
             </div>
            </div>
             );
            }       
          /* ── Opportunity Detail Drawer ──────────────────────────────── */
function DetailDrawer({ opp, onClose, onSave, onApplyClick, saving }) {
  if (!opp) return null;

  const isActioned = !!opp.applicationStatus;
  const isPartner = opp.industry || opp.isDemo === false;
  const bd = opp.fitBreakdown || {};
  const evidenceMatrix = opp.evidenceMatrix || [];
  const criticalMissing = opp.criticalMissing || [];
      return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fadeIn" role="dialog">
      <div
        className="relative z-10 flex flex-col w-full max-w-[620px] h-full bg-[#0b0d16] border-l border-white/[0.12] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 p-6 border-b border-white/[0.08] bg-[#0b0d16]/95 backdrop-blur">
          <div className="flex items-center gap-3.5 min-w-0">
            <CompanyLogo company={opp.company} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {isPartner ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Verified Industry Partner
                  </span>
                   ) : (
                  <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                    Curated Opening
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-tight truncate">
                {formatRoleTitle(opp.title)}
              </h2>
              <p className="text-xs text-zinc-400 font-medium truncate">
                {opp.company} • {opp.location}
              </p>
            </div>
          </div>
          <button
            id="btn-close-drawer"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
          >
          <Icon d={ICONS.close} size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 rounded-xl text-xs font-medium capitalize bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
              {opp.type}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
              {opp.workMode === 'remote' || opp.remote ? 'Remote' : 'In office'}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              {opp.fitScore ?? 0}% Fit Score
            </span>
          </div>

         {/* Compensation */}
          {opp.stipend && opp.stipend !== 'Not disclosed' && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Icon d={ICONS.money} size={16} className="text-emerald-400" />
                <span className="text-xs text-zinc-400">Compensation / Stipend</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">{opp.stipend}</span>
            </div>
          )}

          {/* Critical Missing Action */}
          {criticalMissing.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
              <p className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                Recommended Action Before Applying
              </p>
              {criticalMissing.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-rose-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          )}
         
            {/* Score Breakdown */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Deterministic 8-Vector Match Calibration
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Required Skills</span>
                <span className="font-mono">{bd.requiredSkillScore ?? 0}% (30%)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Preferred Skills</span>
                <span className="font-mono">{bd.preferredSkillScore ?? 0}% (20%)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Career Goal Alignment</span>
                <span className="font-mono">{bd.careerGoalScore ?? 0}% (15%)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Resume Evidence</span>
                <span className="font-mono">{bd.resumeScore ?? 0}% (10%)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Project Portfolio</span>
                <span className="font-mono">{bd.projectEvidenceScore ?? 0}% (10%)</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>GitHub Telemetry</span>
                <span className="font-mono">{bd.githubEvidenceScore ?? 0}% (5%)</span>
              </div>
            </div>
          </div>      

            {/* Required Skills Chips */}
          {opp.requiredSkills?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Required Technical Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {opp.requiredSkills.map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1 rounded-xl text-xs font-mono bg-white/[0.04] text-zinc-200 border border-white/[0.08]"
                  >
                    {formatSkillName(sk)}
                  </span>
                ))}
              </div>
            </div>
          )}
           

           {/* Action Footer */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3 sticky bottom-0 bg-[#0b0d16] py-4">
            {!isActioned ? (
              <>
                <button
                  disabled={saving === opp._id}
                  onClick={() => onSave(opp._id)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold border border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Save Opportunity
                </button>
                <button
                  disabled={saving === opp._id}
                  onClick={() => onApplyClick(opp)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Apply now
                </button>
              </>
            ) : (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Icon d={ICONS.check} size={14} />
                Tracked as <strong className="capitalize">{opp.applicationStatus}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
       /* ── Pipeline Column ─────────────────────────────────────────── */
function PipelineColumn({ status, apps, onDelete }) {
  const CONFIG = {
    SAVED:       { label: 'Saved',       dot: 'bg-zinc-400',    border: 'border-zinc-500/20' },
    PLANNING:    { label: 'Planning',    dot: 'bg-amber-400',   border: 'border-amber-500/20' },
    APPLIED:     { label: 'Applied',     dot: 'bg-blue-400',    border: 'border-blue-500/20' },
    OA:          { label: 'Online Assmt',dot: 'bg-indigo-400',  border: 'border-indigo-500/20' },
    INTERVIEW:   { label: 'Interview',   dot: 'bg-purple-400',  border: 'border-purple-500/20' },
    FINAL_ROUND: { label: 'Final Round', dot: 'bg-fuchsia-400', border: 'border-fuchsia-500/20' },
    OFFER:       { label: 'Offer',       dot: 'bg-emerald-400', border: 'border-emerald-500/20' },
    REJECTED:    { label: 'Rejected',    dot: 'bg-rose-400',    border: 'border-rose-500/20' },
  };
  const cfg = CONFIG[status] || { label: status, dot: 'bg-zinc-400', border: 'border-white/[0.08]' };

   return (
    <div className="flex flex-col gap-2.5 min-w-[240px] flex-1">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${cfg.border} bg-[#0c0e17]/80 backdrop-blur`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs font-mono font-bold uppercase text-zinc-200">{cfg.label}</span>
        <span className="ml-auto text-xs font-mono font-bold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
          {apps.length}
        </span>
      </div>
      
      {/* Cards */}
      <div className="flex flex-col gap-2.5">
        {apps.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-600 border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
            Empty stage
          </div>
        ) : (
          apps.map((app) => (
            <div
              key={app._id}
              className="flex flex-col gap-2 p-4 rounded-2xl bg-[#0f121d] border border-white/[0.08] hover:border-white/[0.2] transition-all shadow-sm"
            >
              <p className="text-xs font-bold text-white leading-snug line-clamp-2">
                {formatRoleTitle(app.opportunity?.title || '—')}
              </p>
              <p className="text-[11px] text-zinc-400">{app.opportunity?.company}</p>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/[0.04]">
                <span className="text-[11px] font-mono text-emerald-400">
                  {app.fitScore ? `${app.fitScore}% Fit` : 'Tracked'}
                </span>
                <button
                  onClick={() => onDelete(app._id)}
                  className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove application"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}