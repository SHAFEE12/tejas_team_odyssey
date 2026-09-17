/**
 * Applications.jsx — /student/applications
 *
 * Application Tracker module for Career Odyssey.
 *
 * Features:
 * - Executive Kanban-style application pipeline:
 *   Columns: SAVED, PLANNING, APPLIED, OA, INTERVIEW, FINAL ROUND, OFFER
 *   Secondary outcomes: REJECTED, WITHDRAWN
 * - Application detail drawer:
 *   Opportunity info, stage status management, timeline dates, resume version,
 *   supporting project references, required skills, and structured notes.
 * - Application conversion metrics & funnel velocity telemetry.
 * - Switchable Kanban Board and List/Table view.
 *
 * Design: Executive Obsidian / Dark SaaS palette, vibrant orange accents,
 * smooth hover states, and glassmorphic drawer elements.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getStudentProjects,
} from '../../api/applications.api';
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