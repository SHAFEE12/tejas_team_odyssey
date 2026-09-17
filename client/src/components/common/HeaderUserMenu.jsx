import React from 'react';
import { getAvatarUrl } from '../../utils/constants';

const THEMES = {
  student: {
    avatarBg: 'from-orange-500/30 to-amber-500/20 border-orange-500/30 text-orange-300',
    dot: 'bg-orange-500',
    defaultSubtitle: 'Student',
  },
  academician: {
    avatarBg: 'from-indigo-500/30 to-blue-500/20 border-indigo-500/30 text-indigo-300',
    dot: 'bg-indigo-500',
    defaultSubtitle: 'Faculty Mentor',
  },
  institution: {
    avatarBg: 'from-emerald-500/30 to-teal-500/20 border-emerald-500/30 text-emerald-300',
    dot: 'bg-emerald-500',
    defaultSubtitle: 'Institution Admin',
  },
  industry: {
    avatarBg: 'from-purple-500/30 to-fuchsia-500/20 border-purple-500/30 text-purple-300',
    dot: 'bg-purple-500',
    defaultSubtitle: 'Industry Partner',
  },
};

export default function HeaderUserMenu({
  user,
  onLogout,
  role = 'student',
  subtitle = null,
  extraAction = null,
}) {
  const theme = THEMES[role] || THEMES.student;

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO';

  const displaySubtitle = subtitle || user?.email || theme.defaultSubtitle;

  return (
    <div className="flex items-center gap-3 shrink-0">
      {extraAction}

      {/* Unobtrusive SIH 26044 Demo Center Trigger */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-demo-center'))}
        title="Open SIH 26044 Demo Center"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 transition-all cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">Demo Center</span>
      </button>

      {/* User Profile Info & Avatar */}
      <div className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl">
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.avatarBg} border flex items-center justify-center text-xs font-black shadow-sm overflow-hidden`}
          >
            {user?.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user?.name || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              initials
            )}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${theme.dot} border border-zinc-900`} />
        </div>

        <div className="hidden sm:block text-left min-w-0">
          <p className="text-xs font-bold text-white truncate max-w-[150px] leading-tight">
            {user?.name || 'Authorized User'}
          </p>
          <p className="text-[10px] font-medium text-zinc-400 truncate max-w-[160px] leading-tight mt-0.5">
            {displaySubtitle}
          </p>
        </div>
      </div>

      <div className="h-5 w-px bg-white/10 mx-0.5" />

      {/* Exit / Sign Out Button (Identical to Student Dashboard) */}
      <button
        type="button"
        onClick={onLogout}
        title="Sign out"
        className="flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
        aria-label="Sign out"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
}