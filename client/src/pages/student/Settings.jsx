/**
 * Settings.jsx — Career Odyssey Student Settings & Preferences
 *
 * Obsidian Dark SaaS Executive Dashboard:
 * - Tab 1: Profile & Identity Overview (Avatar management, Verified Credentials, Session Tokens)
 * - Tab 2: Adaptive Career OS Tuning (Adaptive vs Standard mode, Workload capacity slider 5-15h, Task Sizing)
 * - Tab 3: Connected Proof Integrations (GitHub, LeetCode DSA, Gemini Copilot, Hardened Resume Enclave)
 * - Tab 4: Alerts & Reminders (Daily focus, 48h deadline warnings, milestones, audio toggles)
 * - Tab 5: Data Sovereignty & Security (JSON Export, Cache reset, Session termination)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../context/AppContext';
import { getAvatarUrl, ROUTES } from '../../utils/constants';
import { updateAvatarApi, deleteAvatarApi } from '../../api/auth.api';
import {
  getAdaptivePlan,
  updatePreferences,
  refreshPlan,
} from '../../api/adaptiveCareer.api';

/* ── Inline SVG Icon Helper ─────────────────────────────────────────── */
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
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  cpu: ['M4 4h16v16H4z', 'M9 9h6v6H9z', 'M9 1v3', 'M15 1v3', 'M9 20v3', 'M15 20v3', 'M20 9h3', 'M20 14h3', 'M1 9h3', 'M1 14h3'],
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  check: 'M20 6L9 17l-5-5',
  alert: ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', 'M10 11v6', 'M14 11v6'],
  camera: ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z', 'M12 13a4 4 0 100-8 4 4 0 000 8z'],
  sparkles: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  key: 'M21 2l-2 2m-1.5 1.5L14 9m0 0l-1.5-1.5a4.95 4.95 0 00-7 0 5 5 0 000 7.07 5 5 0 007.07 0L14 13m0-4l3 3',
};

const TABS = [
  { id: 'profile', label: 'Profile & Account', icon: ICONS.user, badge: 'Core' },
  { id: 'adaptive', label: 'Adaptive Career OS', icon: ICONS.cpu, badge: 'AI Engine' },
  { id: 'proof', label: 'Connected Proof', icon: ICONS.link, badge: '4 Active' },
  { id: 'notifications', label: 'Alerts & Reminders', icon: ICONS.bell, badge: 'Realtime' },
  { id: 'privacy', label: 'Data & Security', icon: ICONS.shield, badge: 'Hardened' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { profile } = useAppContext();

  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Avatar upload
  const fileInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Adaptive Career OS state
  const [planPreference, setPlanPreference] = useState('ADAPTIVE');
  const [isPaused, setIsPaused] = useState(false);
  const [targetHours, setTargetHours] = useState(10);
  const [taskSizing, setTaskSizing] = useState('BALANCED'); // 'SPRINT' | 'BALANCED' | 'DEEP'

  // Notification toggles (persisted in localStorage)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('careerodyssey_settings_notifications');
      return saved ? JSON.parse(saved) : {
        dailyDigest: true,
        deadlineWarnings: true,
        milestoneAlerts: true,
        soundEffects: true,
      };
    } catch {
      return {
        dailyDigest: true,
        deadlineWarnings: true,
        milestoneAlerts: true,
        soundEffects: true,
      };
    }
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load existing adaptive preferences
  useEffect(() => {
    let isMounted = true;
    getAdaptivePlan()
      .then((res) => {
        if (!isMounted || !res?.data) return;
        const data = res.data;
        if (data.mode) {
          setPlanPreference(data.planPreference || 'ADAPTIVE');
        }
        if (typeof data.recommendedHours === 'number') {
          setTargetHours(data.recommendedHours);
        }
      })
      .catch(() => {
        // Fallback to defaults
      });

    return () => { isMounted = false; };
  }, []);

  // Sync notifications to localStorage
  const handleToggleNotification = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('careerodyssey_settings_notifications', JSON.stringify(next));
      return next;
    });
    showToast('Notification preference updated.');
  };

  // Save Adaptive Preferences
  const handleSaveAdaptivePreferences = async () => {
    try {
      setIsSaving(true);
      await updatePreferences({
        planPreference,
        isPaused,
        targetHours,
      });
      showToast('Adaptive Career OS preferences updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Immediate Plan Adaptation
  const handleTriggerAdaptation = async () => {
    try {
      setIsRefreshing(true);
      await refreshPlan();
      showToast('Fresh adaptive snapshot synthesized successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to refresh adaptive plan.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Avatar Upload Handlers
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Avatar image must be under 5MB.', 'error');
      return;
    }

    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await updateAvatarApi(formData);
      if (res?.user) {
        updateUser(res.user);
        showToast('Profile avatar updated.');
      }
    } catch (err) {
      showToast(err.message || 'Avatar upload failed.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setAvatarLoading(true);
      const res = await deleteAvatarApi();
      if (res?.user) {
        updateUser(res.user);
        showToast('Avatar removed.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove avatar.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Export Career Data
  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?._id || user?.id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          collegeName: user?.collegeName,
          registrationNumber: user?.registrationNumber,
        },
        profile: profile || null,
        adaptivePreferences: {
          planPreference,
          targetHours,
          isPaused,
          taskSizing,
        },
        notifications,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career_odyssey_profile_${user?.name?.replace(/\s+/g, '_') || 'student'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Career archive exported successfully.');
    } catch {
      showToast('Failed to export career data.', 'error');
    }
  };

  // Clear Local Cache
  const handleClearCache = () => {
    if (window.confirm('Clear local UI cache? Your server-saved career data will remain safe.')) {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      localStorage.clear();
      if (token) localStorage.setItem('token', token);
      if (savedUser) localStorage.setItem('user', savedUser);
      showToast('Local UI cache cleared.');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium border backdrop-blur-xl transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/50'
              : 'bg-[#0f1422]/95 text-emerald-300 border-emerald-500/30 shadow-emerald-950/40'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
          <Icon d={toast.type === 'error' ? ICONS.alert : ICONS.check} size={15} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#111625] via-[#0d101a] to-[#0a0c13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                System Control & Identity
              </span>
              <span className="text-zinc-600">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.05]">
                Kernel v2.4 Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Settings & Student Account Preferences
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Manage your authenticated candidate credentials, calibrate the Adaptive Career OS pacing, review connected platform proof statuses, and audit security controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(ROUTES.STUDENT_COMMAND_CENTER)}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all duration-200 flex items-center gap-2 hover:border-white/[0.15] shadow-sm"
            >
              <span>← Command Center</span>
            </button>
            <button
              onClick={handleExportData}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-orange-600/20 border border-orange-400/30 active:scale-[0.98]"
            >
              <Icon d={ICONS.download} size={14} />
              <span>Export JSON Archive</span>
            </button>
          </div>
        </div>

        {/* ── Sub-navigation Tab Bar ────────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-950/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon d={tab.icon} size={15} className={isActive ? 'text-orange-400' : 'text-zinc-400'} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'bg-white/[0.04] text-zinc-400 border border-white/[0.04]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Profile & Identity Overview                               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0d101a] border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <Icon d={ICONS.user} size={18} className="text-orange-400" />
                  Identity & Authenticated Credentials
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verified security attributes linked to your candidate career profile.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-700/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Session
              </span>
            </div>

            {/* Avatar & High Level Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-white/[0.06]">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/[0.12] bg-[#121624] flex items-center justify-center text-zinc-300 font-bold text-2xl shadow-xl transition-all group-hover:border-orange-500/40">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-400 font-mono text-3xl">
                      {user?.name?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute -bottom-2 -right-2 p-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl shadow-xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 border border-white/20"
                  title="Upload avatar photo"
                >
                  <Icon d={ICONS.camera} size={14} />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {user?.name || 'Candidate'}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-600/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {user?.role || 'student'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                    UID: {user?._id?.slice(-6) || user?.id?.slice(-6) || 'active'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 font-mono flex items-center gap-2">
                  <span>{user?.email || 'student@careerodyssey.internal'}</span>
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5"
                  >
                    <span>Upload New Photo</span>
                  </button>
                  {user?.avatar && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        disabled={avatarLoading}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Remove Photo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Credential Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {/* Target Role */}
              <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-orange-500/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Target Career Role
                    </span>
                    <span className="w-2 h-2 rounded-full bg-orange-400/80" />
                  </div>
                  <p className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                    {profile?.targetRole || 'Not configured yet'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Primary trajectory target for roadmap milestones & benchmark calculations.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_CAREER_GOAL)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Edit Career Goal</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>

              {/* Institution / Reg ID */}
              <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Affiliated Institution
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>
                  <p className="text-base font-bold text-white">
                    {user?.collegeName || 'Self-Directed / Unspecified'}
                  </p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">
                    Reg ID: {user?.registrationNumber || 'Not assigned'}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Campus Cohort</span>
                  <Link
                    to="/student/profile"
                    className="text-[11px] font-mono text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                  >
                    <span>Edit in Profile →</span>
                  </Link>
                </div>
              </div>

              {/* Security Session Token */}
              <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Security & Session Token
                    </span>
                    <Icon d={ICONS.key} size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-xs font-mono text-zinc-200 mt-1 truncate">
                    HMAC-SHA256 • 7-Day Session Active
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    JWT cryptographic signature validated across all micro-services.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ownership-Scoped & Secure
                  </span>
                </div>
              </div>

              {/* Full Profile Management */}
              <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-orange-500/20 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Student Competencies
                    </span>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-800/40">
                      Phase 2 Matrix
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                    Executive Profile & Skills Studio
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Update technical strengths, domain benchmarks, and portfolio repositories.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_PROFILE)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Manage Full Profile</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Adaptive Career OS Preferences                           */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'adaptive' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0d101a] border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <Icon d={ICONS.cpu} size={18} className="text-orange-400" />
                  Adaptive Career Engine Calibration
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dynamically balances daily task volumes, friction points, and streak fatigue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerAdaptation}
                disabled={isRefreshing}
                className="px-4 py-2.5 text-xs font-bold text-orange-300 bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/30 rounded-xl transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 active:scale-[0.98] shadow-md shadow-orange-950/30"
              >
                <Icon d={ICONS.refresh} size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Synthesizing...' : 'Trigger Immediate Adaptation'}</span>
              </button>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Planning Strategy Mode
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPlanPreference('ADAPTIVE')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    planPreference === 'ADAPTIVE'
                      ? 'bg-gradient-to-br from-orange-950/40 via-[#131726] to-[#0d101a] border-orange-500/60 shadow-xl shadow-orange-950/30 ring-1 ring-orange-500/30'
                      : 'bg-[#080a10] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        <Icon d={ICONS.sparkles} size={14} />
                      </span>
                      Adaptive Mode (Recommended)
                    </span>
                    <input
                      type="radio"
                      name="planPreference"
                      checked={planPreference === 'ADAPTIVE'}
                      onChange={() => setPlanPreference('ADAPTIVE')}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    Continually resizes task requirements based on real velocity, automatically demotes lower-priority tasks when friction is detected, and escalates impending deadlines.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-orange-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Recommended for active job hunts & university placement
                  </div>
                </div>

                <div
                  onClick={() => setPlanPreference('STANDARD')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    planPreference === 'STANDARD'
                      ? 'bg-gradient-to-br from-orange-950/40 via-[#131726] to-[#0d101a] border-orange-500/60 shadow-xl shadow-orange-950/30 ring-1 ring-orange-500/30'
                      : 'bg-[#080a10] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                        <Icon d={ICONS.cpu} size={14} />
                      </span>
                      Standard Mode
                    </span>
                    <input
                      type="radio"
                      name="planPreference"
                      checked={planPreference === 'STANDARD'}
                      onChange={() => setPlanPreference('STANDARD')}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    Maintains static milestone assignments without dynamic re-ranking. Recommended if you already run an external task planner or prefer unadapted workloads.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Fixed milestone cadence without automated tuning
                  </div>
                </div>
              </div>
            </div>

            {/* Target Weekly Hours Slider */}
            <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Target Weekly Execution Capacity
                  </label>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Clamped between 5h and 15h to protect against burnout while maintaining steady milestone velocity.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-orange-400 font-mono">
                    {targetHours}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">hours / week</span>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="1"
                  value={targetHours}
                  onChange={(e) => setTargetHours(Number(e.target.value))}
                  className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-white/[0.04]">
                <span className={targetHours <= 7 ? 'text-orange-400 font-bold' : ''}>5h (Sustainable)</span>
                <span className={targetHours > 7 && targetHours <= 12 ? 'text-orange-400 font-bold' : ''}>10h (Balanced Focus)</span>
                <span className={targetHours > 12 ? 'text-orange-400 font-bold' : ''}>15h (Intensive Sprint)</span>
              </div>
            </div>

            {/* Task Sizing Granularity */}
            <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Daily Focus Session Sizing
                </label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  How the scheduler breaks down high-level objectives into daily execution units.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'SPRINT', title: 'Sprint Blocks', duration: '15–30 min', desc: 'Atomic tasks designed for quick momentum and minimal barrier to entry.' },
                  { id: 'BALANCED', title: 'Deep Focus', duration: '45–60 min', desc: 'Standard blocks suited for DSA problem sets and core feature prototyping.' },
                  { id: 'DEEP', title: 'Build Marathon', duration: '90–120 min', desc: 'Extended flow sessions reserved for complex architectural builds and mock interviews.' },
                ].map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setTaskSizing(size.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      taskSizing === size.id
                        ? 'bg-gradient-to-b from-orange-500/15 to-transparent border-orange-500/50 shadow-md shadow-orange-950/20'
                        : 'bg-[#0b0e17] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{size.title}</span>
                      <span className="text-[10px] font-mono text-orange-400 font-semibold">{size.duration}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{size.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pause Adaptation Toggle */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-[#080a10] border border-white/[0.06]">
              <div className="pr-4">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  Pause Automatic Dynamic Adaptation
                </span>
                <span className="text-xs text-zinc-400 mt-0.5 block leading-relaxed">
                  Temporarily freezes your current week’s priorities without re-ranking tasks or shifting deadlines.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  isPaused ? 'bg-orange-500 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
              </button>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSaveAdaptivePreferences}
                disabled={isSaving}
                className="px-6 py-3 text-xs font-extrabold text-zinc-950 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-300 hover:to-amber-300 rounded-xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? 'Saving Preferences...' : 'Save Adaptive Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Connected Proof & Integrations                           */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'proof' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0d101a] border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="border-b border-white/[0.06] pb-5 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <Icon d={ICONS.link} size={18} className="text-orange-400" />
                Connected Career Evidence & Platform Integrations
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                External platforms verify engineering competencies with tangible proof points for your Readiness Score.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GitHub */}
              <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white/[0.05] text-white border border-white/[0.08]">
                        <Icon d={ICONS.github} size={18} />
                      </div>
                      <span className="text-sm font-bold text-white">GitHub Showcase</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      API LIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    Continuously aggregates repository activity, commit frequency, and multi-language breakdown into verifiable project cards.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Sync: Cached Hourly</span>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_GITHUB)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5"
                  >
                    <span>Configure GitHub</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>

              {/* LeetCode / DSA */}
              <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Icon d={ICONS.cpu} size={18} />
                      </div>
                      <span className="text-sm font-bold text-white">LeetCode / Algorithmic Hub</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      DUAL SYNC
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    Validates algorithmic problem-solving depth across Easy, Medium, and Hard tiers with direct LeetCode graph scraping.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Manual + Auto Sync</span>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_DSA)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5"
                  >
                    <span>DSA Hub</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>

              {/* Gemini Copilot AI */}
              <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Icon d={ICONS.sparkles} size={18} />
                      </div>
                      <span className="text-sm font-bold text-white">Career Copilot AI Core</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-700/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      HYBRID AI
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    Powers context-aware advisory chat with intelligent fallback heuristics to provide high response availability.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Strict Context Guard</span>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_COPILOT)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5"
                  >
                    <span>Launch Copilot</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>

              {/* Resume Vault */}
              <div className="p-6 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Icon d={ICONS.shield} size={18} />
                      </div>
                      <span className="text-sm font-bold text-white">Hardened Resume Vault</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      SECURED ENCLAVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    Resumes are strictly isolated behind authenticated stream endpoints. Direct HTTP access is blocked, preventing unauthorized exposure.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Ownership-Enforced</span>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_RESUME)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5"
                  >
                    <span>Resume Vault</span>
                    <Icon d={ICONS.external} size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: Alerts & Reminders                                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0d101a] border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="border-b border-white/[0.06] pb-5 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <Icon d={ICONS.bell} size={18} className="text-orange-400" />
                Alerts & Execution Notifications
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize operational notification signals for application deadlines, morning digests, and milestones.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'dailyDigest',
                  title: 'Morning Execution Priority Digest',
                  desc: 'Displays the prioritized "DO THIS NEXT" career action card immediately upon entering the Command Center.',
                },
                {
                  key: 'deadlineWarnings',
                  title: 'Application Deadline Urgency Alert (48h)',
                  desc: 'Triggers persistent high-priority warnings for opportunity listings expiring in under 48 hours.',
                },
                {
                  key: 'milestoneAlerts',
                  title: 'Career Trajectory Milestone Notifications',
                  desc: 'Notifies you when a GitHub project verification, LeetCode streak, or skill benchmark target is recorded.',
                },
                {
                  key: 'soundEffects',
                  title: 'Execution Audio Feedback',
                  desc: 'Emits subtle audible confirmation upon completing daily focus sessions or marking roadmap goals done.',
                },
              ].map((item) => {
                const isEnabled = notifications[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] hover:border-white/[0.1] transition-all"
                  >
                    <div className="pr-6">
                      <span className="text-sm font-bold text-white block">
                        {item.title}
                      </span>
                      <span className="text-xs text-zinc-400 mt-1 block leading-relaxed max-w-2xl">
                        {item.desc}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotification(item.key)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        isEnabled
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 justify-end shadow-md shadow-orange-950/40'
                          : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: Data Sovereignty & Security                               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0d101a] border border-white/[0.08] p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
            <div className="border-b border-white/[0.06] pb-5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <Icon d={ICONS.shield} size={18} className="text-orange-400" />
                Data Sovereignty & Security Controls
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Zero-fabrication and complete data portability. Your career records are strictly yours.
              </p>
            </div>

            {/* Export & Backup */}
            <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">Export Complete Career Archive</span>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  Download an offline JSON bundle with your target goals, verified skill scores, roadmap nodes, and project proofs.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2.5 text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm active:scale-[0.98]"
              >
                <Icon d={ICONS.download} size={14} />
                <span>Download JSON</span>
              </button>
            </div>

            {/* Cache Reset */}
            <div className="p-5 rounded-2xl bg-[#080a10] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">Purge Local UI Cache</span>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  Clears local client cache objects and forces fresh fetch on next reload without impacting database state.
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all shrink-0"
              >
                Purge UI Cache
              </button>
            </div>

            {/* SIH 26044 Demo Center */}
            <div className="p-5 rounded-2xl bg-[#080a10] border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white block">SIH 26044 Demo Center</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Judge Mode
                  </span>
                </div>
                <span className="text-xs text-zinc-400 mt-1 block">
                  Switch canonical roles (Student, Academia, Industry, Admin), review the 10-step evaluation guide, or reset demo data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-demo-center'))}
                className="px-4 py-2.5 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm cursor-pointer"
              >
                <span>Launch Demo Center</span>
                <span>→</span>
              </button>
            </div>

            {/* Danger Zone: Session Termination */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/20 via-[#140b0f] to-[#080a10] border border-rose-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-rose-300 block">Terminate Active Session</span>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  Revokes current client credentials and redirects immediately to the sign-in authentication gateway.
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-all flex items-center gap-2 shrink-0 active:scale-[0.98]"
              >
                <Icon d={ICONS.trash} size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}