/**
 * Reminders.jsx
 *
 * Reminders & Daily Career Planner module (/student/reminders).
 *
 * Turns Career Odyssey analytics into daily execution:
 * 1. Today's Career Plan (Interactive checklist, estimated time, progress %)
 * 2. Today's Focus & Overdue Reminders
 * 3. Upcoming Scheduled Milestones & Deadlines
 * 4. Completed & Dismissed History
 * 5. Custom Reminder creation & management modal
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getReminders,
  getDailyPlan,
  createReminder,
  updateReminder,
  completeReminder,
  dismissReminder,
  deleteReminder,
} from '../../api/reminders.api';
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
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  check: (
    <polyline points="20 6 9 17 4 12" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  dismiss: (
    <line x1="18" y1="12" x2="6" y2="12" />
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
};

const TYPE_ICONS = {
  APPLICATION: (
    <>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  INTERVIEW: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  DEADLINE: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  ROADMAP: (
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  DSA: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  PROJECT: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  RESUME: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  GITHUB: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
  CUSTOM: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
};

/* ── Priority Styles ────────────────────────────────────────── */
const PRIORITY_BADGES = {
  URGENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  MEDIUM: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  LOW: 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
};

/* ── Date formatting helper ─────────────────────────────────── */
function formatDueDate(dateStr) {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  const now = new Date();
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0 && Math.abs(diffHours) > 2) {
    return `Overdue (${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
  }
  if (diffHours >= 0 && diffHours <= 12) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffHours > 12 && diffHours <= 36) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ── Reminder Card Component ────────────────────────────────── */
function ReminderCard({ reminder, onComplete, onDismiss, onEdit, onDelete }) {
  const isOverdue =
    reminder.status === 'PENDING' &&
    reminder.dueAt &&
    new Date(reminder.dueAt).getTime() < Date.now();

  const iconKey = reminder.type || 'CUSTOM';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 backdrop-blur-md ${
        reminder.status === 'COMPLETED'
          ? 'bg-zinc-900/20 border-white/[0.04] opacity-60'
          : reminder.status === 'DISMISSED'
          ? 'bg-zinc-900/10 border-white/[0.03] opacity-40'
          : isOverdue
          ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/20'
          : 'bg-[#0d101a]/90 border-white/[0.08] hover:border-white/15 shadow-md'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-300 border border-white/[0.06]">
              <Icon d={TYPE_ICONS[iconKey] || TYPE_ICONS.CUSTOM} size={14} />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
              {reminder.type}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                PRIORITY_BADGES[reminder.priority] || PRIORITY_BADGES.MEDIUM
              }`}
            >
              {reminder.priority}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Overdue
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h4
          className={`text-sm font-bold tracking-tight leading-snug ${
            reminder.status === 'COMPLETED'
              ? 'line-through text-zinc-500'
              : 'text-white'
          }`}
        >
          {reminder.title}
        </h4>

        {reminder.description && (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {reminder.description}
          </p>
        )}
      </div>

      {/* Due Date + Actions */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className={`font-mono text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-zinc-400'}`}>
          {formatDueDate(reminder.dueAt)}
        </span>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {reminder.status === 'PENDING' && (
            <>
              <button
                onClick={() => onComplete(reminder._id)}
                title="Mark as completed"
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
              >
                <Icon d={ICONS.check} size={13} />
              </button>
              <button
                onClick={() => onDismiss(reminder._id)}
                title="Dismiss reminder"
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
              >
                <Icon d={ICONS.dismiss} size={13} />
              </button>
            </>
          )}
          <button
            onClick={() => onEdit(reminder)}
            title="Edit reminder"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Icon d={ICONS.edit} size={13} />
          </button>
          <button
            onClick={() => onDelete(reminder._id)}
            title="Delete reminder"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Icon d={ICONS.trash} size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create / Edit Reminder Modal ───────────────────────────── */
function ReminderModal({ reminder, onClose, onSave }) {
  const [title, setTitle] = useState(reminder?.title || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [type, setType] = useState(reminder?.type || 'CUSTOM');
  const [priority, setPriority] = useState(reminder?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(
    reminder?.dueAt ? new Date(reminder.dueAt).toISOString().slice(0, 16) : ''
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(reminder?.estimatedMinutes || 30);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onSave({
        title,
        description,
        type,
        priority,
        dueAt: dueDate ? new Date(dueDate) : null,
        estimatedMinutes: Number(estimatedMinutes) || 30,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save reminder:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d101a] border border-white/15 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white">
              {reminder ? 'Edit Reminder' : 'Create Custom Reminder'}
            </h3>
            <p className="text-xs text-zinc-400">Set milestone deadlines, interviews, or custom study targets.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Icon d={ICONS.close} size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Follow up on Stripe frontend application"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Description / Links / Context
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Add key context, job links, or preparation notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="CUSTOM">Custom</option>
                <option value="APPLICATION">Application</option>
                <option value="INTERVIEW">Interview</option>
                <option value="DEADLINE">Deadline</option>
                <option value="ROADMAP">Roadmap</option>
                <option value="DSA">DSA</option>
                <option value="PROJECT">Project</option>
                <option value="RESUME">Resume</option>
                <option value="GITHUB">GitHub</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Estimated Minutes
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full bg-[#131722] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : reminder ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Reminders Page ─────────────────────────────────────── */
export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING | ALL | COMPLETED | DISMISSED
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [remRes, planRes] = await Promise.all([
        getReminders({ status: statusFilter, priority: priorityFilter }),
        getDailyPlan(),
      ]);

      if (remRes?.data?.reminders) {
        setReminders(remRes.data.reminders);
      }
      if (planRes?.data) {
        setDailyPlan(planRes.data);
      }
    } catch (err) {
      console.error('Failed to load reminders & daily plan:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleComplete = async (id) => {
    try {
      await completeReminder(id);
      fetchData();
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissReminder(id);
      fetchData();
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminder(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleSaveModal = async (payload) => {
    if (editingReminder) {
      await updateReminder(editingReminder._id, payload);
    } else {
      await createReminder(payload);
    }
    fetchData();
  };

  // Groupings
  const todayAndOverdue = useMemo(() => {
    return reminders.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (!r.dueAt) return true; // Undated pending counts in focus
      const dueTime = new Date(r.dueAt).getTime();
      const endOfTomorrow = Date.now() + 36 * 60 * 60 * 1000;
      return dueTime <= endOfTomorrow;
    });
  }, [reminders]);

  const upcoming = useMemo(() => {
    return reminders.filter((r) => {
      if (r.status !== 'PENDING' || !r.dueAt) return false;
      const dueTime = new Date(r.dueAt).getTime();
      const endOfTomorrow = Date.now() + 36 * 60 * 60 * 1000;
      return dueTime > endOfTomorrow;
    });
  }, [reminders]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-zinc-100">
      
      {/* ── Top Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 font-semibold">
                Daily Execution Planner
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Deadline & Cadence Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Reminders & <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Daily Planner</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              What should I execute today? Never miss an application deadline, interview schedule, or critical roadmap milestone.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingReminder(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Icon d={ICONS.plus} size={15} />
            <span>Create Reminder</span>
          </button>
        </div>
      </div>

      {/* ── 1. Today's Career Plan Section ── */}
      {dailyPlan && (
        <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Today's Execution Focus
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 text-xs font-mono font-bold border border-orange-500/30">
                  {dailyPlan.careerFocus}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Daily Career Plan Checklist</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2">
                <span className="text-zinc-400 block text-[10px] uppercase">Today's Progress</span>
                <span className="font-bold text-white">
                  {dailyPlan.completedCount} / {dailyPlan.totalCount} completed ({dailyPlan.progressPercentage}%)
                </span>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2">
                <span className="text-zinc-400 block text-[10px] uppercase">Estimated Effort</span>
                <span className="font-bold text-amber-400">
                  ~{dailyPlan.totalEstimatedMinutes} mins
                </span>
              </div>

              {dailyPlan.streak && dailyPlan.streak.days > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2">
                  <span className="text-zinc-400 block text-[10px] uppercase">Streak</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Icon d={ICONS.flame} size={13} />
                    {dailyPlan.streak.days} Days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${dailyPlan.progressPercentage}%` }}
            />
          </div>

          {/* Task Checklist */}
          {dailyPlan.tasks.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs font-mono">
              Your plan is clear today. Great job staying ahead on all deadlines!
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailyPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    task.completed
                      ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
                      : 'bg-[#111422]/70 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={!task.reminderId}
                      onClick={() => task.reminderId && handleComplete(task.reminderId)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                          : 'border-zinc-600 hover:border-orange-500 bg-transparent'
                      }`}
                    >
                      {task.completed && <Icon d={ICONS.check} size={12} />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold tracking-tight leading-snug truncate ${
                          task.completed ? 'line-through text-zinc-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                      ~{task.estimatedMinutes} min
                    </span>
                    {task.link && (
                      <Link
                        to={task.link}
                        className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                      >
                        <span>Action</span>
                        <Icon d={ICONS.arrowRight} size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dailyPlan.hasAdditionalTasks && (
            <p className="text-[11px] font-mono text-zinc-400 text-right">
              +{dailyPlan.additionalTasksCount} additional items scheduled in your backlog.
            </p>
          )}
        </div>
      )}

      {/* ── 2. Filter & Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Status buttons */}
          {['PENDING', 'ALL', 'COMPLETED', 'DISMISSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {st === 'PENDING' ? 'Active' : st === 'ALL' ? 'All Items' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-mono text-zinc-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ── 3. Reminders Content Grid ── */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          <p className="text-xs font-mono">Syncing reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-orange-400">
            <Icon d={ICONS.bell} size={24} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No reminders found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-5">
            Create a custom task or track applications to generate deterministic reminders.
          </p>
          <button
            onClick={() => {
              setEditingReminder(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
          >
            + Create Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group 1: Today's Focus & Overdue */}
          {todayAndOverdue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Today's Focus & Overdue</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                    {todayAndOverdue.length}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayAndOverdue.map((rem) => (
                  <ReminderCard
                    key={rem._id}
                    reminder={rem}
                    onComplete={handleComplete}
                    onDismiss={handleDismiss}
                    onEdit={(r) => {
                      setEditingReminder(r);
                      setModalOpen(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Upcoming Milestones</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                    {upcoming.length}
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((rem) => (
                  <ReminderCard
                    key={rem._id}
                    reminder={rem}
                    onComplete={handleComplete}
                    onDismiss={handleDismiss}
                    onEdit={(r) => {
                      setEditingReminder(r);
                      setModalOpen(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group 3: History (Completed or Dismissed when showing ALL/History) */}
          {statusFilter !== 'PENDING' && (
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h3 className="text-sm font-bold text-zinc-400 tracking-tight">
                Resolved / Dismissed Archive
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reminders
                  .filter((r) => r.status !== 'PENDING')
                  .map((rem) => (
                    <ReminderCard
                      key={rem._id}
                      reminder={rem}
                      onComplete={handleComplete}
                      onDismiss={handleDismiss}
                      onEdit={(r) => {
                        setEditingReminder(r);
                        setModalOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal for Create / Edit ── */}
      {modalOpen && (
        <ReminderModal
          reminder={editingReminder}
          onClose={() => {
            setModalOpen(false);
            setEditingReminder(null);
          }}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}