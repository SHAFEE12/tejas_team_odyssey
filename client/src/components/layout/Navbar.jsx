/**
 * Navbar.jsx — Upgraded Modern Dark SaaS Topbar
 *
 * Visual hierarchy:
 * - Mobile hamburger trigger + Brand icon
 * - Dynamic page title & breadcrumbs
 * - Search bar / ⌘K command trigger
 * - Header stats: 🔥 12 Day Streak, Notifications Bell
 * - User identity pill with avatar and level
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { getAvatarUrl, ROUTES } from '../../utils/constants';

const ROLE_LABEL = {
  student:     'CSE Student • Lvl 4',
  industry:    'Industry Partner',
  academician: 'Academician',
  institution: 'Institution',
};

export default function Navbar({ title = 'Dashboard', onToggleMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'CO';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 h-16 bg-[#090a0f]/85 backdrop-blur-xl border-b border-white/[0.07] shrink-0 select-none">
      {/* ── Left: Page title & mobile toggle ── */}
      <div className="flex items-center gap-3.5 min-w-0">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            type="button"
            className="md:hidden p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors shrink-0"
            aria-label="Open navigation drawer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Mobile brand icon */}
        <div className="md:hidden flex items-center shrink-0">
          <BrandLogo size="xs" showText={false} linkTo={ROUTES.STUDENT_COMMAND_CENTER} />
        </div>

        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Portal /
          </span>
          <span role="heading" aria-level="2" className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-2">
            {title}
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/80 shadow-[0_0_6px_#f97316]" />
          </span>
        </div>
      </div>

      {/* ── Center: Search / Command Bar Trigger ── */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-8">
        <button
          type="button"
          onClick={() => navigate(ROUTES.STUDENT_COPILOT)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/25 hover:border-purple-500/45 text-xs text-purple-400 transition-all duration-200 group shadow-inner"
        >
          <span className="flex items-center gap-2">
            <span className="text-xs" aria-hidden="true">✨</span>
            <span className="text-zinc-300 group-hover:text-white transition-colors">Ask Career Copilot...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-400 border border-white/10 group-hover:border-purple-400/40 group-hover:text-purple-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right: Notifications, User Profile & Sign Out ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all relative"
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Unread indicator dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          </button>

          {/* Quick Notification Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-900/95 p-3 shadow-2xl border border-white/10 backdrop-blur-xl z-50 animate-scale-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] text-orange-400 font-semibold">1 New</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <p className="text-xs font-semibold text-white">🚀 3 New Job Matches</p>
                <p className="text-[11px] text-zinc-400">Your profile matches Frontend Developer roles at Stripe & Linear.</p>
              </div>
            </div>
          )}
        </div>

        {/* Unobtrusive SIH 26044 Demo Center Trigger */}
        {/* <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-demo-center'))}
          title="Open SIH 26044 Demo Center (Ctrl+Shift+D)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Demo Center</span>
        </button> */}

        <div className="h-5 w-px bg-white/10 mx-0.5" />

        {/* User profile & level */}
        <Link
          to={ROUTES.STUDENT_PROFILE}
          className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-black text-orange-300 shadow-sm overflow-hidden group-hover:border-orange-500/60 transition-colors">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                initials
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900" />
          </div>

          <div className="hidden md:block text-left min-w-0">
            <p className="text-xs font-bold text-white group-hover:text-white truncate max-w-[120px] leading-tight">
              {user?.name || 'Student'}
            </p>
            <p className="text-[10px] font-medium text-zinc-400 truncate leading-tight mt-0.5">
              {ROLE_LABEL[user?.role] ?? user?.role}
            </p>
          </div>
        </Link>

        {/* Quick Sign out */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
          aria-label="Sign out"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}