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
