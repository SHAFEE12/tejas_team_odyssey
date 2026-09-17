/**
 * Skills.jsx — /student/skills
 *
 * Phase 4: Dedicated skill management page.
 * Students add, edit, and remove skills. Data persists via /api/skills.
 *
 * Uses AppContext — no direct API calls from this page.
 * Skill model: { name, level (beginner|intermediate|advanced|expert), yearsOfExperience }
 * No fake data. No placeholder metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ROUTES } from '../../utils/constants';

/* ── Constants ─────────────────────────────────────────────── */
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const LEVEL_META = {
  beginner:     { label: 'Beginner',     color: 'text-zinc-400',  dot: 'bg-zinc-600' },
  intermediate: { label: 'Intermediate', color: 'text-sky-400',   dot: 'bg-sky-500'  },
  advanced:     { label: 'Advanced',     color: 'text-violet-400',dot: 'bg-violet-500'},
  expert:       { label: 'Expert',       color: 'text-[#FC8200]', dot: 'bg-[#FC8200]'},
};

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'Java', 'C++', 'SQL', 'MongoDB', 'PostgreSQL',
  'Git', 'Docker', 'Kubernetes', 'AWS', 'REST APIs',
  'GraphQL', 'HTML', 'CSS', 'System Design', 'Data Structures',
];

/* ── Empty form ─────────────────────────────────────────────── */
const emptyForm = () => ({ name: '', level: 'beginner', yearsOfExperience: '' });

/* ── Icon ──────────────────────────────────────────────────── */
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

/* ── Level badge ────────────────────────────────────────────── */
function LevelBadge({ level }) {
  const meta = LEVEL_META[level] ?? LEVEL_META.beginner;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/* ── Skill card ─────────────────────────────────────────────── */
function SkillCard({ skill, onEdit, onDelete }) {
  return (
    <div className="group flex items-start justify-between gap-3 p-3.5 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.10] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-200 truncate mb-1">{skill.name}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <LevelBadge level={skill.level} />
          {skill.yearsOfExperience > 0 && (
            <span className="text-[11px] text-zinc-600">
              {skill.yearsOfExperience} yr{skill.yearsOfExperience !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={() => onEdit(skill)}
          aria-label={`Edit ${skill.name}`}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        >
          <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(skill.name)}
          aria-label={`Remove ${skill.name}`}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/[0.08] transition-colors"
        >
          <Icon d={['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6']} size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Skills() {
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

  const [skills,       setSkills]      = useState([]);
  const [form,         setForm]        = useState(emptyForm());
  const [editingName,  setEditingName] = useState(null);
  const [formError,    setFormError]   = useState('');
  const [isDirty,      setIsDirty]     = useState(false);

  /* Sync from context */
  useEffect(() => {
    if (profile) {
      setSkills(Array.isArray(profile.skills) ? profile.skills : []);
    } else if (profile === null) {
      setSkills([]);
    }
  }, [profile]);

  /* ── Form handlers ─────────────────────────────────────────── */
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleEdit = useCallback((skill) => {
    setEditingName(skill.name);
    setForm({
      name:              skill.name,
      level:             skill.level,
      yearsOfExperience: String(skill.yearsOfExperience ?? ''),
    });
    setFormError('');
    document.getElementById('skill-name-input')?.focus();
  }, []);

  const handleDelete = useCallback((name) => {
    setSkills(prev => prev.filter(s => s.name !== name));
    setIsDirty(true);
    dismissSaveStatus();
  }, [dismissSaveStatus]);

  const handleAddOrUpdate = () => {
    const name = form.name.trim();
    if (!name) { setFormError('Skill name is required.'); return; }

    if (!SKILL_LEVELS.includes(form.level)) {
      setFormError('Please select a valid level.'); return;
    }

    const yoe = parseFloat(form.yearsOfExperience);
    const years = isNaN(yoe) ? 0 : yoe;
    if (years < 0) { setFormError('Years of experience cannot be negative.'); return; }

    const isDuplicate = skills.some(
      s => s.name.toLowerCase() === name.toLowerCase() && s.name !== editingName
    );
    if (isDuplicate) { setFormError(`"${name}" is already in your list.`); return; }

    const skill = { name, level: form.level, yearsOfExperience: years };
    setSkills(prev =>
      editingName
        ? prev.map(s => s.name === editingName ? skill : s)
        : [...prev, skill]
    );
    setForm(emptyForm());
    setEditingName(null);
    setFormError('');
    setIsDirty(true);
    dismissSaveStatus();
  };

  const handleCancelEdit = () => {
    setForm(emptyForm());
    setEditingName(null);
    setFormError('');
  };

  const handleSuggest = (name) => {
    if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    setForm(prev => ({ ...prev, name }));
    setFormError('');
    document.getElementById('skill-name-input')?.focus();
  };

  /* ── Save ──────────────────────────────────────────────────── */
  const handleSave = async () => {
    dismissSaveStatus();
    await saveProfile({
      skills,
      targetRole:     profile?.targetRole     ?? '',
      targetIndustry: profile?.targetIndustry ?? '',
    });
    setIsDirty(false);
  };

  /* ── Group by level ────────────────────────────────────────── */
  const grouped = SKILL_LEVELS.reduce((acc, lvl) => {
    const group = skills.filter(s => s.level === lvl);
    if (group.length) acc[lvl] = group;
    return acc;
  }, {});

  /* ── Loading ───────────────────────────────────────────────── */
  if (isLoadingProfile) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-10 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6">
            <div className="h-3 w-1/4 bg-zinc-800 rounded animate-pulse mb-5" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(j => <div key={j} className="h-16 bg-zinc-800 rounded animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-[13px] text-red-400 mb-3">{profileError}</p>
          <button type="button" onClick={() => window.location.reload()} className="text-[12px] text-zinc-400 hover:text-white underline underline-offset-4">Reload</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Icon d={['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5']} size={15} className="text-zinc-300" />
            </span>
            <h1 className="text-[22px] font-bold text-white tracking-tight">My Skills</h1>
          </div>
          <p className="text-[13px] text-zinc-500 ml-10">
            {skills.length === 0
              ? 'Add your skills to unlock personalised skill-gap analysis.'
              : `${skills.length} skill${skills.length !== 1 ? 's' : ''} — save to persist changes.`}
          </p>
        </div>

        {/* Save button (top) */}
        {(isDirty || skills.length > 0) && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isDirty ? 'Save changes' : 'Save'}
          </button>
        )}
      </div>

      {/* ── Status banners ── */}
      {saveSuccess && (
        <div role="status" className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 text-[13px]">
          <Icon d="M20 6L9 17l-5-5" size={15} />
          Skills saved successfully.
        </div>
      )}
      {saveError && (
        <div role="alert" className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 text-[13px]">
          <Icon d={['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01']} size={15} />
          {saveError}
        </div>
      )}

      {/* ── Add / Edit form ── */}
      <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          {editingName ? `Editing "${editingName}"` : 'Add a skill'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {/* Name */}
          <div className="sm:col-span-1">
            <label htmlFor="skill-name-input" className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
              Skill name <span className="text-[#FC8200]">*</span>
            </label>
            <input
              id="skill-name-input"
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddOrUpdate()}
              placeholder="e.g. React"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 text-[13px] bg-black/40 border border-white/[0.08] text-zinc-200 placeholder-zinc-600 rounded-lg focus:outline-none focus:border-[#FC8200]/50 focus:ring-1 focus:ring-[#FC8200]/20 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Level */}
          <div>
            <label htmlFor="skill-level-select" className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
              Level
            </label>
            <select
              id="skill-level-select"
              value={form.level}
              onChange={e => handleChange('level', e.target.value)}
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 text-[13px] bg-black/40 border border-white/[0.08] text-zinc-200 rounded-lg focus:outline-none focus:border-[#FC8200]/50 focus:ring-1 focus:ring-[#FC8200]/20 transition-colors disabled:opacity-50 appearance-none"
            >
              {SKILL_LEVELS.map(l => (
                <option key={l} value={l}>{LEVEL_META[l].label}</option>
              ))}
            </select>
          </div>

          {/* Years */}
          <div>
            <label htmlFor="skill-years-input" className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
              Years of exp.
            </label>
            <input
              id="skill-years-input"
              type="number"
              value={form.yearsOfExperience}
              onChange={e => handleChange('yearsOfExperience', e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 text-[13px] bg-black/40 border border-white/[0.08] text-zinc-200 placeholder-zinc-600 rounded-lg focus:outline-none focus:border-[#FC8200]/50 focus:ring-1 focus:ring-[#FC8200]/20 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {formError && <p role="alert" className="text-[12px] text-red-400 mb-3">{formError}</p>}

        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={handleAddOrUpdate}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-[#FC8200] text-black text-[12px] font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {editingName ? 'Update skill' : '+ Add skill'}
          </button>
          {editingName && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-lg text-zinc-500 hover:text-white text-[12px] font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 mb-2">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.map(s => {
              const already = skills.some(sk => sk.name.toLowerCase() === s.toLowerCase());
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggest(s)}
                  disabled={already || isSaving}
                  className={[
                    'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                    already
                      ? 'border-emerald-500/25 text-emerald-600 bg-emerald-500/5 cursor-default'
                      : 'border-white/[0.07] text-zinc-500 hover:border-white/[0.18] hover:text-zinc-300',
                  ].join(' ')}
                >
                  {already ? '✓ ' : '+ '}{s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Skill list ── */}
      {skills.length === 0 ? (
        <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] py-12 text-center">
          <Icon d={['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5']} size={28} className="text-zinc-800 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-600">No skills added yet.</p>
          <p className="text-[12px] text-zinc-700 mt-1">Use the form above or pick from quick-add suggestions.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-5 sm:p-6 space-y-6">
          {Object.entries(grouped).map(([level, group]) => (
            <div key={level}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2.5">
                <LevelBadge level={level} />
                <span className="text-zinc-700 ml-2">· {group.length}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.map(skill => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-1">
        <Link
          to={ROUTES.STUDENT_CAREER_GOAL}
          className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          ← Career Goal
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.STUDENT_SKILL_GAP}
            className="text-[12px] font-semibold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Next: Analyze Skill Gap</span>
            <Icon d="M5 12h14M12 5l7 7-7 7" size={12} />
          </Link>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : 'Save changes'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}