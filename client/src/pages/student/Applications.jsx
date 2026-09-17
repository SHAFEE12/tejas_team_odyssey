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
    pipeline: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'],
  location: ['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', 'M12 7a2 2 0 100 4 2 2 0 000-4z'],
  arrow: 'M5 12h14M12 5l7 7-7 7',
  close: ['M18 6L6 18', 'M6 6l12 12'],
  search: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  resume: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  project: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  analytics: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6L9 17l-5-5',
};

/* ── Pipeline Status Configuration ────────────────────────────── */
const PIPELINE_COLUMNS = [
  { id: 'SAVED', label: 'Saved', color: 'zinc', dot: 'bg-zinc-400', badge: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' },
  { id: 'PLANNING', label: 'Planning', color: 'amber', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'APPLIED', label: 'Applied', color: 'blue', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'OA', label: 'Online Assessment', color: 'indigo', dot: 'bg-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'INTERVIEW', label: 'Interview', color: 'purple', dot: 'bg-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'FINAL_ROUND', label: 'Final Round', color: 'fuchsia', dot: 'bg-fuchsia-400', badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  { id: 'OFFER', label: 'Offer', color: 'emerald', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

const SECONDARY_STATUSES = [
  { id: 'REJECTED', label: 'Rejected', color: 'rose', dot: 'bg-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'WITHDRAWN', label: 'Withdrawn', color: 'zinc', dot: 'bg-zinc-500', badge: 'bg-zinc-600/10 text-zinc-400 border-zinc-600/20' },
];

const ALL_STATUSES = [...PIPELINE_COLUMNS, ...SECONDARY_STATUSES];

/* ── Readiness Badge ────────────────────────────────────────── */
function ReadinessBadge({ label }) {
  const map = {
    READY_TO_APPLY: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', text: 'Ready' },
    PREPARE_AND_APPLY: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/25', text: 'Prepare & Apply' },
    PREPARE_FIRST: { cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25', text: 'Prepare First' },
    UNAVAILABLE: { cls: 'bg-zinc-800 text-zinc-400 border-zinc-700', text: 'No Resume' },
  };
  const item = map[label] || map.UNAVAILABLE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${item.cls}`}>
      {item.text}
    </span>
  );
}

/* ── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const item = ALL_STATUSES.find((s) => s.id === status) || {
    label: status,
    badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${item.badge}`}>
      {item.label}
    </span>
  );
}

/* ── Fit Score Pill ─────────────────────────────────────────── */
function FitPill({ score }) {
  const color =
    score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
    score >= 60 ? 'text-blue-400 bg-blue-500/10 border-blue-500/25' :
    score >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
    'text-rose-400 bg-rose-500/10 border-rose-500/25';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${color}`}>
      <span className="text-[10px] text-zinc-400 font-normal">Fit:</span>
      <span>{score}%</span>
    </span>
  );
}

/* ── Single Application Kanban Card ─────────────────────────── */
function ApplicationCard({ app, onSelect, onStatusChange }) {
  const opp = app.opportunity || {};
  const currentIdx = PIPELINE_COLUMNS.findIndex((col) => col.id === app.status);

  return (
    <div
      onClick={() => onSelect(app)}
      className="group flex flex-col gap-3 p-4 rounded-xl bg-[#0f121d] border border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.02] transition-all cursor-pointer shadow-md relative"
    >
      {/* Top Header: Company Avatar + Names + Fit */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(opp.company?.[0] || 'D').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white truncate group-hover:text-orange-400 transition-colors">
              {opp.company || 'Direct Application'}
            </p>
            <p className="text-[12px] text-zinc-400 truncate">
              {opp.title || 'Opportunity'}
            </p>
          </div>
        </div>
        <FitPill score={app.fitScore || opp.fitScore || 0} />
      </div>

      {/* Location + Readiness */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="truncate flex items-center gap-1.5">
          <Icon d={ICONS.location} size={12} className="text-zinc-500" />
          {opp.location || 'Remote'}
        </span>
        <ReadinessBadge label={app.applicationReadinessLabel} />
      </div>

      {/* Next Action Target */}
      {app.nextAction && (
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-zinc-300 flex items-start gap-1.5">
          <span className="text-orange-400 mt-0.5">↳</span>
          <span className="line-clamp-2 leading-relaxed">{app.nextAction}</span>
        </div>
      )}

      {/* Dates & Fast Transition Arrows */}
      <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>
          {app.appliedAt ? (
            `Applied: ${new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
          ) : app.deadline ? (
            `Due: ${new Date(app.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
          ) : (
            `Tracked: ${new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
          )}
        </span>

        {/* Quick Transition Controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {currentIdx > 0 && (
            <button
              title={`Move back to ${PIPELINE_COLUMNS[currentIdx - 1].label}`}
              onClick={() => onStatusChange(app._id, PIPELINE_COLUMNS[currentIdx - 1].id)}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold transition-colors"
            >
              ←
            </button>
          )}
          {currentIdx >= 0 && currentIdx < PIPELINE_COLUMNS.length - 1 && (
            <button
              title={`Advance to ${PIPELINE_COLUMNS[currentIdx + 1].label}`}
              onClick={() => onStatusChange(app._id, PIPELINE_COLUMNS[currentIdx + 1].id)}
              className="px-2 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white text-[11px] font-mono font-bold transition-colors"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Application Detail Drawer ──────────────────────────────── */
function ApplicationDetailDrawer({
  appId,
  onClose,
  onUpdate,
  onDelete,
  allProjects = [],
}) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Editable form fields
  const [status, setStatus] = useState('SAVED');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [preparationNotes, setPreparationNotes] = useState('');
  const [resumeVersion, setResumeVersion] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await getApplicationById(appId);
        if (mounted && res.data?.application) {
          const a = res.data.application;
          setApp(a);
          setStatus(a.status || 'SAVED');
          setNotes(a.notes || '');
          setNextAction(a.nextAction || '');
          setRecruiterNotes(a.recruiterNotes || '');
          setInterviewNotes(a.interviewNotes || '');
          setPreparationNotes(a.preparationNotes || '');
          setResumeVersion(a.resumeVersion || '');
          setSelectedProjects(a.projectReferences || []);
          setDeadline(a.deadline ? a.deadline.split('T')[0] : '');
          setInterviewDate(a.interviewDate ? a.interviewDate.split('T')[0] : '');
          setOfferDate(a.offerDate ? a.offerDate.split('T')[0] : '');
        }
      } catch (err) {
        console.error('Failed to load application detail:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => { mounted = false; };
  }, [appId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(appId, {
        status,
        notes,
        nextAction,
        recruiterNotes,
        interviewNotes,
        preparationNotes,
        resumeVersion,
        projectReferences: selectedProjects,
        deadline: deadline || null,
        interviewDate: interviewDate || null,
        offerDate: offerDate || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleProject = (pid) => {
    setSelectedProjects((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const opp = app?.opportunity || {};

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-[#0d101a] border-l border-white/[0.12] flex flex-col shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/[0.08] sticky top-0 bg-[#0d101a]/95 backdrop-blur z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                Application Detail
              </span>
              <StatusBadge status={status} />
            </div>
            <h2 className="text-xl font-bold text-white">{opp.title || 'Direct Opportunity'}</h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{opp.company || 'Employer'} • {opp.location || 'Remote'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            <Icon d={ICONS.close} size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24 text-zinc-500 text-sm">
            Loading application details...
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <p className="text-[11px] font-mono text-zinc-400">Match Fit Score</p>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{app?.fitScore || opp.fitScore || 0}%</p>
              </div>
              <div>
                <p className="text-[11px] font-mono text-zinc-400">Candidate Readiness</p>
                <div className="mt-1.5">
                  <ReadinessBadge label={app?.applicationReadinessLabel} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-mono text-zinc-400">Applied At</p>
                <p className="text-xs font-mono text-zinc-300 font-medium mt-1.5">
                  {app?.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Not applied yet'}
                </p>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">Pipeline Stage</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ALL_STATUSES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      status === st.id
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Interview Scheduled</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Offer Date</label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
            </div>

            {/* Resume Version */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Icon d={ICONS.resume} size={15} className="text-orange-400" />
                Submitted Resume Version
              </label>
              <input
                type="text"
                placeholder='e.g. "Resume v3 - Backend Systems Focus"'
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Supporting Projects Evidence */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Icon d={ICONS.project} size={15} className="text-orange-400" />
                  Supporting Projects Evidence
                </label>
                <Link to={ROUTES.STUDENT_PROJECTS} className="text-[11px] font-semibold text-orange-400 hover:text-orange-300">
                  Manage Projects →
                </Link>
              </div>
              {allProjects.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">No projects created yet in your portfolio.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                  {allProjects.map((p) => {
                    const isChecked = selectedProjects.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-orange-500/10 border-orange-500/30 text-zinc-200'
                            : 'bg-zinc-900/60 border-white/[0.05] text-zinc-400 hover:border-white/[0.1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProject(p._id)}
                            className="rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-0"
                          />
                          <span className="text-xs font-semibold truncate">{p.title}</span>
                          <span className="text-[11px] text-zinc-500">({p.status})</span>
                        </div>
                        {p.qualityScore > 0 && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            {p.qualityScore}%
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Required Skills from Opportunity */}
            {opp.requiredSkills && opp.requiredSkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Required Opportunity Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {opp.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-mono"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Sections */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                  Next Action Target
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Review System Design questions by Thursday"'
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">Personal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Application thoughts, referrals, salary expectations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    Recruiter Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Recruiter contact, follow-up..."
                    value={recruiterNotes}
                    onChange={(e) => setRecruiterNotes(e.target.value)}
                    maxLength={2000}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                    Interview Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Prompts, feedback..."
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    maxLength={2000}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-zinc-300 block mb-1">
                  Preparation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific topics to brush up on, mock links..."
                  value={preparationNotes}
                  onChange={(e) => setPreparationNotes(e.target.value)}
                  maxLength={2000}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 sticky bottom-0 bg-[#0d101a] py-4">
              <div>
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400">Confirm?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(appId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
                    >
                      Yes, Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-2.5 py-1.5 text-zinc-400 text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="text-xs font-medium text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    Delete Application
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold animate-fadeIn">
                    ✓ Changes saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Applications Page ─────────────────────────────────── */
export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, projRes] = await Promise.all([
        getApplications(),
        getStudentProjects(),
      ]);
      if (appRes.data?.applications) {
        setApplications(appRes.data.applications);
        setMetrics(appRes.data.metrics);
      }
      if (projRes.data?.portfolio) {
        setProjects(projRes.data.portfolio);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplication(appId, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDelete = async (appId) => {
    try {
      await deleteApplication(appId);
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const opp = app.opportunity || {};
      const matchesSearch =
        !search ||
        (opp.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (opp.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (opp.location || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const kanbanGroups = useMemo(() => {
    const groups = {};
    for (const col of PIPELINE_COLUMNS) {
      groups[col.id] = [];
    }
    for (const app of filteredApps) {
      if (groups[app.status]) {
        groups[app.status].push(app);
      }
    }
    return groups;
  }, [filteredApps]);

  const rejectedApps = filteredApps.filter((a) => a.status === 'REJECTED');
  const withdrawnApps = filteredApps.filter((a) => a.status === 'WITHDRAWN');

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-7 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Icon d={ICONS.pipeline} size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Application Tracker</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Full Funnel
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-zinc-400 max-w-2xl leading-relaxed">
            Manage your opportunities across every stage of recruitment from initial planning to interview rounds and final offers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.STUDENT_ANALYTICS}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            <Icon d={ICONS.analytics} size={14} />
            <span>Career Analytics</span>
          </Link>
          <Link
            to={ROUTES.STUDENT_OPPORTUNITIES}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25"
          >
            <Icon d={ICONS.plus} size={14} />
            <span>Browse Opportunities</span>
          </Link>
        </div>
      </div>