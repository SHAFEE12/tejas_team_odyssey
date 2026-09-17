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