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