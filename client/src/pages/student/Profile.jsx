/**
 * Profile.jsx — Student career profile editor (/student/profile)
 *
 * Scope:
 *  A. Identity — Display with avatar upload, verified student role, college, registration number.
 *  B. Career Direction — targetRole (required) + targetIndustry (optional).
 *  C. Skills Inventory — add / edit / remove with name, level, yearsOfExperience.
 *  D. Connected Platforms — GitHub & Resume status shortcuts.
 *  E. Save — POST (create) or PUT (update) via AppContext.saveProfile().
 *
 * Design: Executive Obsidian / Dark SaaS palette, vibrant orange accents,
 * profile completion meter, and glassmorphic card containers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../context/AppContext';
import { getAvatarUrl, ROUTES } from '../../utils/constants';
import { updateAvatarApi, deleteAvatarApi, updateProfileApi } from '../../api/auth.api';

/* ── Constants matching the backend enum exactly ─────────────── */
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const LEVEL_LABELS = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
  expert:       'Expert',
};

const LEVEL_COLORS = {
  beginner:     'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
  intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  advanced:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  expert:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

/* ── Camera icon for avatar upload ───────────────────────────── */
const CameraIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/* ── Inline icon primitive ───────────────────────────────────── */
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
  user: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 3a4 4 0 100 8 4 4 0 000-8z'],
  target: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  skills: ['M12 2L2 7l10 5 10-5-10-5', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  resume: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8'],
  check: 'M20 6L9 17l-5-5',
  alert: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  arrow: 'M5 12h14M12 5l7 7-7 7',
  mentor: ['M12 14l9-5-9-5-9 5 9 5z', 'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'],
};

/* ── Profile completion calculator ──────────────────────────── */
function calcCompletion(targetRole, targetIndustry, skills) {
  const steps = [
    { label: 'Target role', done: Boolean(targetRole?.trim()) },
    { label: 'Target industry', done: Boolean(targetIndustry?.trim()) },
    { label: 'At least one skill', done: Array.isArray(skills) && skills.length > 0 },
  ];
  const completed = steps.filter(s => s.done).length;
  return { steps, completed, total: steps.length, pct: Math.round((completed / steps.length) * 100) };
}

/* ── Empty skill form state ──────────────────────────────────── */
const emptySkillForm = () => ({ name: '', level: 'beginner', yearsOfExperience: '' });

/* ── Skill row ───────────────────────────────────────────────── */
function SkillRow({ skill, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.01] px-2 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-white truncate">{skill.name}</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${LEVEL_COLORS[skill.level] || 'border-white/10 text-zinc-400'}`}>
            {LEVEL_LABELS[skill.level] ?? skill.level}
          </span>
        </div>
        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
          {skill.yearsOfExperience > 0 ? `${skill.yearsOfExperience} yr${skill.yearsOfExperience !== 1 ? 's' : ''} experience` : 'Foundational'}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(skill)}
          aria-label={`Edit ${skill.name}`}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <Icon d={ICONS.edit} size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(skill.name)}
          aria-label={`Remove ${skill.name}`}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Icon d={ICONS.trash} size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Section card wrapper ────────────────────────────────────── */
function SectionCard({ title, icon, subtitle, children, action }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 sm:p-7 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Icon d={icon} size={16} />
            </span>
          )}
          <div>
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── Field label ─────────────────────────────────────────────── */
function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
      {children}
      {required && <span className="text-orange-400 ml-0.5">*</span>}
    </label>
  );
}

/* ── Text input ──────────────────────────────────────────────── */
function TextInput({ id, value, onChange, placeholder, disabled, type = 'text', min, step }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      step={step}
      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
    />
  );
}

/* ── Select ──────────────────────────────────────────────────── */
function SelectInput({ id, value, onChange, disabled, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-white/[0.08] text-white rounded-xl focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {children}
    </select>
  );
}

/* ── Main Profile Component ──────────────────────────────────── */
export default function Profile() {
  const { user, updateUser } = useAuth();
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

  /* ── Avatar management ────────────────────────────────────── */
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const avatarUrl = !imgError && user?.avatar ? getAvatarUrl(user.avatar) : null;

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarMessage(null);
    setImgError(false);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setAvatarMessage({ text: 'Please select a valid image file (JPG, PNG, WEBP, or GIF).', isError: true });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ text: 'Image size must be less than 5 MB.', isError: true });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await updateAvatarApi(formData);
      if (res?.user && updateUser) {
        updateUser(res.user);
      } else if (res?.avatar && updateUser) {
        updateUser({ avatar: res.avatar });
      }
      setAvatarMessage({ text: 'Profile picture updated successfully!', isError: false });
      setTimeout(() => setAvatarMessage(null), 4000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setAvatarMessage({ text: err.message || 'Failed to upload profile picture.', isError: true });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    try {
      setIsUploadingAvatar(true);
      setAvatarMessage(null);
      const res = await deleteAvatarApi();
      if (res?.user && updateUser) {
        updateUser(res.user);
      } else if (updateUser) {
        updateUser({ avatar: '' });
      }
      setAvatarMessage({ text: 'Profile picture removed.', isError: false });
      setTimeout(() => setAvatarMessage(null), 3000);
    } catch (err) {
      console.error('Avatar delete error:', err);
      setAvatarMessage({ text: err.message || 'Failed to remove profile picture.', isError: true });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /* ── Academic Identity Editing State ──────────────────────── */
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    registrationNumber: '',
    collegeName: '',
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setIdentityForm({
        registrationNumber: user.registrationNumber || '',
        collegeName: user.collegeName || '',
      });
    }
  }, [user?.registrationNumber, user?.collegeName]);

  const handleSaveIdentity = async (e) => {
    e?.preventDefault?.();
    try {
      setIsSavingIdentity(true);
      setIdentityMessage(null);
      const res = await updateProfileApi({
        registrationNumber: identityForm.registrationNumber.trim(),
        collegeName: identityForm.collegeName.trim(),
      });
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      setIdentityMessage({ text: 'Academic identity updated successfully!', isError: false });
      setIsEditingIdentity(false);
      setTimeout(() => setIdentityMessage(null), 3500);
    } catch (err) {
      setIdentityMessage({ text: err.message || 'Failed to update academic identity.', isError: true });
    } finally {
      setIsSavingIdentity(false);
    }
  };

  /* ── Local form state ─────────────────────────────────────── */
  const [targetRole,     setTargetRole]     = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [skills,         setSkills]         = useState([]);

  // Skill form (add/edit)
  const [skillForm,    setSkillForm]    = useState(emptySkillForm());
  const [editingName,  setEditingName]  = useState(null);
  const [skillError,   setSkillError]   = useState('');

  /* ── Sync form from AppContext profile ───────────────────── */
  useEffect(() => {
    if (profile) {
      setTargetRole(profile.targetRole     ?? '');
      setTargetIndustry(profile.targetIndustry ?? '');
      setSkills(Array.isArray(profile.skills) ? profile.skills : []);
    } else if (profile === null) {
      setTargetRole('');
      setTargetIndustry('');
      setSkills([]);
    }
  }, [profile]);

  /* ── Completion ──────────────────────────────────────────── */
  const completion = calcCompletion(targetRole, targetIndustry, skills);

  /* ── Skill form handlers ─────────────────────────────────── */
  const handleSkillChange = (field, value) => {
    setSkillForm(prev => ({ ...prev, [field]: value }));
    setSkillError('');
  };

  const handleEditSkill = useCallback((skill) => {
    setEditingName(skill.name);
    setSkillForm({
      name:              skill.name,
      level:             skill.level,
      yearsOfExperience: String(skill.yearsOfExperience ?? ''),
    });
    setSkillError('');
    document.getElementById('skill-name-input')?.focus();
  }, []);

  const handleDeleteSkill = useCallback((name) => {
    setSkills(prev => prev.filter(s => s.name !== name));
    dismissSaveStatus();
  }, [dismissSaveStatus]);

  const handleAddOrUpdateSkill = () => {
    const name = skillForm.name.trim();
    if (!name) {
      setSkillError('Skill name is required.');
      return;
    }

    const level = skillForm.level;
    if (!SKILL_LEVELS.includes(level)) {
      setSkillError('Please select a valid skill level.');
      return;
    }

    const yoe = parseFloat(skillForm.yearsOfExperience);
    const years = isNaN(yoe) ? 0 : yoe;
    if (years < 0) {
      setSkillError('Years of experience cannot be negative.');
      return;
    }

    const isDuplicate = skills.some(
      s => s.name.toLowerCase() === name.toLowerCase() && s.name !== editingName
    );
    if (isDuplicate) {
      setSkillError(`"${name}" is already in your skill inventory.`);
      return;
    }

    const newSkill = { name, level, yearsOfExperience: years };

    setSkills(prev =>
      editingName
        ? prev.map(s => s.name === editingName ? newSkill : s)
        : [...prev, newSkill]
    );

    setSkillForm(emptySkillForm());
    setEditingName(null);
    setSkillError('');
    dismissSaveStatus();
  };

  const handleCancelEdit = () => {
    setSkillForm(emptySkillForm());
    setEditingName(null);
    setSkillError('');
  };

  const handleSave = async () => {
    if (!targetRole.trim()) {
      document.getElementById('target-role-input')?.focus();
      return;
    }
    dismissSaveStatus();
    await saveProfile({ skills, targetRole, targetIndustry });
  };

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  if (isLoadingProfile) {
    return (
      <div className="max-w-[860px] mx-auto px-6 py-12 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-6 animate-pulse">
            <div className="h-4 w-1/3 bg-zinc-800 rounded mb-4" />
            <div className="h-10 bg-zinc-800 rounded mb-3" />
            <div className="h-10 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-[860px] mx-auto px-6 py-12">
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

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Student Profile
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              Evidence-Based Profile
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-zinc-400">
            Calibrate your core profile and active skill inventory to power deterministic roadmap and gap scores.
          </p>
        </div>

        {/* Profile Completeness Pill */}
        <div className="shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0f121d] border border-white/[0.08]">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Completeness</span>
              <span className={`text-sm font-black font-mono ${completion.pct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {completion.pct}%
              </span>
            </div>
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${completion.pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}
                style={{ width: `${completion.pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Banners ── */}
      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-xs font-semibold animate-fadeIn"
        >
          <Icon d={ICONS.check} size={15} />
          Profile and skills saved successfully.
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

      {/* ── A. Identity Section ── */}
      <SectionCard
        title="Candidate Identity"
        icon={ICONS.user}
        subtitle="Academic records & account authentication"
        action={
          !isEditingIdentity ? (
            <button
              type="button"
              onClick={() => {
                setIdentityForm({
                  registrationNumber: user?.registrationNumber || '',
                  collegeName: user?.collegeName || '',
                });
                setIsEditingIdentity(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Icon d={ICONS.edit} size={13} />
              <span>Edit Academic Info</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingIdentity(false)}
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
            >
              Cancel
            </button>
          )
        }
      >
        {identityMessage && (
          <div
            role="alert"
            className={`mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono border ${
              identityMessage.isError
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <Icon d={identityMessage.isError ? ICONS.alert : ICONS.check} size={14} />
            <span>{identityMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Upload */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-xl overflow-hidden relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-xl font-black font-mono text-white select-none">
                  {initials}
                </span>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                title="Change profile picture"
              >
                {isUploadingAvatar ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CameraIcon className="w-5 h-5 text-orange-400" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-transform shadow-md cursor-pointer border-2 border-[#0f121d]"
              title="Upload photo"
            >
              <CameraIcon className="w-3 h-3" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
          </div>

          {/* Details / Edit Form */}
          <div className="flex-1 min-w-0 w-full">
            {!isEditingIdentity ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Full Name</p>
                  <p className="text-sm font-bold text-white truncate">{user?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-xs font-mono text-zinc-300 truncate">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Account Role</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {user?.role ?? 'student'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Registration Number</p>
                  {user?.registrationNumber ? (
                    <p className="text-xs font-mono text-zinc-200">{user.registrationNumber}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentityForm({
                          registrationNumber: user?.registrationNumber || '',
                          collegeName: user?.collegeName || '',
                        });
                        setIsEditingIdentity(true);
                      }}
                      className="text-xs font-mono text-orange-400 hover:text-orange-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add Registration No</span>
                    </button>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">University / College</p>
                  {user?.collegeName ? (
                    <p className="text-xs font-semibold text-zinc-200 truncate">{user.collegeName}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentityForm({
                          registrationNumber: user?.registrationNumber || '',
                          collegeName: user?.collegeName || '',
                        });
                        setIsEditingIdentity(true);
                      }}
                      className="text-xs font-mono text-orange-400 hover:text-orange-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add College / University</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveIdentity} className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-white/[0.06]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="edit-reg-no">Registration / Roll Number</FieldLabel>
                    <TextInput
                      id="edit-reg-no"
                      value={identityForm.registrationNumber}
                      onChange={(e) => setIdentityForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="e.g. 231051570151"
                    />
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">Used by mentors & placement intelligence.</p>
                  </div>
                  <div>
                    <FieldLabel htmlFor="edit-college-name">University / College Name</FieldLabel>
                    <TextInput
                      id="edit-college-name"
                      value={identityForm.collegeName}
                      onChange={(e) => setIdentityForm(prev => ({ ...prev, collegeName: e.target.value }))}
                      placeholder="e.g. National Institute of Technology"
                    />
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">Connects to your campus institution cohort.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingIdentity}
                    className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    {isSavingIdentity ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Icon d={ICONS.check} size={13} />
                        <span>Save Info</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingIdentity(false)}
                    disabled={isSavingIdentity}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Avatar feedback / controls */}
            <div className="mt-3 flex items-center gap-3">
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="text-[11px] font-mono text-rose-400/80 hover:text-rose-300 transition-colors"
                >
                  Remove photo
                </button>
              )}
              {avatarMessage && (
                <span className={`text-[11px] font-mono ${avatarMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {avatarMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Connected Platform Footprints */}
        <div className="mt-6 pt-4 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to={ROUTES.STUDENT_GITHUB}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-orange-500/30 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Icon d={ICONS.github} size={15} className="text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">GitHub Integration</span>
            </div>
            <span className="text-[11px] font-mono text-orange-400">Manage →</span>
          </Link>

          <Link
            to={ROUTES.STUDENT_RESUME}
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-orange-500/30 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Icon d={ICONS.resume} size={15} className="text-purple-400" />
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">Resume Evidence Studio</span>
            </div>
            <span className="text-[11px] font-mono text-orange-400">View →</span>
          </Link>
        </div>
      </SectionCard>

      {/* ── Academic Mentor Section ── */}
      <SectionCard
        title="Academic Mentor"
        icon={ICONS.mentor}
        subtitle="Assigned faculty advisor guiding your academic and professional trajectory"
      >
        {profile?.assignedMentor ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {profile.assignedMentor.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {profile.assignedMentor.status || 'Assigned'}
                  </span>
                </div>
                {profile.assignedMentor.designation && (
                  <p className="text-xs font-mono text-zinc-400">
                    {profile.assignedMentor.designation}
                  </p>
                )}
              </div>

              {ROUTES.STUDENT_COPILOT && (
                <Link
                  to={ROUTES.STUDENT_COPILOT}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-semibold transition-colors self-start sm:self-center"
                >
                  <span>View Mentoring</span>
                  <Icon d={ICONS.arrow} size={12} />
                </Link>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.assignedMentor.department && (
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Department</p>
                  <p className="text-xs font-medium text-zinc-200">{profile.assignedMentor.department}</p>
                </div>
              )}
              {profile.assignedMentor.institution && (
                <div>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Institution</p>
                  <p className="text-xs font-medium text-zinc-200">{profile.assignedMentor.institution}</p>
                </div>
              )}
              {profile.assignedMentor.email && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-0.5">Official Email</p>
                  <p className="text-xs font-mono text-zinc-300">{profile.assignedMentor.email}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 text-center border border-dashed border-white/[0.06] rounded-xl">
            <p className="text-xs text-zinc-400 font-medium">No academic mentor assigned yet.</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">
              Your institution's academic department will assign a mentor to your profile.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── B. Career Direction Section ── */}
      <SectionCard title="Career Direction" icon={ICONS.target} subtitle="Benchmark targets used by the Skill Gap and Roadmap engines">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="target-role-input" required>
              Target Technical Role
            </FieldLabel>
            <TextInput
              id="target-role-input"
              value={targetRole}
              onChange={e => { setTargetRole(e.target.value); dismissSaveStatus(); }}
              placeholder="e.g. Full Stack Developer"
              disabled={isSaving}
            />
            <p className="text-[10px] font-mono text-zinc-500 mt-1">Required for curriculum calibration</p>
          </div>
          <div>
            <FieldLabel htmlFor="target-industry-input">
              Target Industry / Vertical
            </FieldLabel>
            <TextInput
              id="target-industry-input"
              value={targetIndustry}
              onChange={e => { setTargetIndustry(e.target.value); dismissSaveStatus(); }}
              placeholder="e.g. Fintech or SaaS"
              disabled={isSaving}
            />
            <p className="text-[10px] font-mono text-zinc-500 mt-1">Optional domain context</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-end">
          <Link
            to={ROUTES.STUDENT_CAREER_GOAL}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1"
          >
            <span>Explore Curated Roles & Salary Benchmarks</span>
            <Icon d={ICONS.arrow} size={12} />
          </Link>
        </div>
      </SectionCard>

      {/* ── C. Skills Inventory Section ── */}
      <SectionCard title="Technical Skill Inventory" icon={ICONS.skills} subtitle="Verified core competencies assessed during market matching">
        {/* Skill form */}
        <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 mb-3">
            {editingName ? `Editing "${editingName}"` : 'Add New Competency'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <FieldLabel htmlFor="skill-name-input" required>Skill Name</FieldLabel>
              <TextInput
                id="skill-name-input"
                value={skillForm.name}
                onChange={e => handleSkillChange('name', e.target.value)}
                placeholder="e.g. React.js"
                disabled={isSaving}
              />
            </div>

            <div>
              <FieldLabel htmlFor="skill-level-select">Proficiency Level</FieldLabel>
              <SelectInput
                id="skill-level-select"
                value={skillForm.level}
                onChange={e => handleSkillChange('level', e.target.value)}
                disabled={isSaving}
              >
                {SKILL_LEVELS.map(l => (
                  <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                ))}
              </SelectInput>
            </div>

            <div>
              <FieldLabel htmlFor="skill-years-input">Experience (Years)</FieldLabel>
              <TextInput
                id="skill-years-input"
                type="number"
                value={skillForm.yearsOfExperience}
                onChange={e => handleSkillChange('yearsOfExperience', e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
                disabled={isSaving}
              />
            </div>
          </div>

          {skillError && (
            <p role="alert" className="text-xs text-rose-400 mb-3 font-medium">{skillError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddOrUpdateSkill}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {editingName ? 'Update Skill' : 'Add to Inventory'}
            </button>
            {editingName && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Skill list */}
        {skills.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/[0.06] rounded-xl text-xs text-zinc-500">
            No competencies registered yet. Use the form above to add your primary technical stack.
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {skills.length} Registered Competenc{skills.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {skills.map(skill => (
                <SkillRow
                  key={skill.name}
                  skill={skill}
                  onEdit={handleEditSkill}
                  onDelete={handleDeleteSkill}
                />
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Save Action Bar ── */}
      <div className="p-4 rounded-2xl bg-[#0f121d] border border-white/[0.08] flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-400">
          <span className="text-orange-400 font-bold">*</span> Target Role is required to save profile.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Profile Changes'
          )}
        </button>
      </div>
    </div>
  );
}