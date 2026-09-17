/**
 * UserProgressCard.jsx — Compact & Sleek User Progress Card
 *
 * Space-optimized design:
 * - Avatar + User Name + "CSE Student • Lvl 4"
 * - Slim 72% Career Progress bar
 * - Single-line gamification stats: 🔥 12d Streak · 🏆 3 Badges
 * - Preserves subtle orange glow and dark gradient
 */

import React, { useState } from 'react';
import { getAvatarUrl } from '../../../utils/constants';

export default function UserProgressCard({ user, isCollapsed = false }) {
  const [tooltip, setTooltip] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'CO';

  const studentTitle = user?.role === 'student'
    ? 'CSE Student • Lvl 4'
    : `${user?.role || 'User'} • Lvl 4`;

  // Collapsed icon view
  if (isCollapsed) {
    return (
      <div
        className="relative mx-auto my-2.5 flex justify-center cursor-pointer"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
      >
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 via-zinc-900 to-orange-950/40 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300 shadow-md group-hover:border-orange-500/60 transition-all duration-200 overflow-hidden">
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
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
        </div>

        {tooltip && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 p-3 rounded-xl bg-zinc-900/95 text-white shadow-2xl border border-orange-500/30 backdrop-blur-md w-48 pointer-events-none animate-scale-in">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-zinc-400 mb-2">{studentTitle}</p>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-zinc-400">Career Progress</span>
              <span className="text-orange-400 font-bold">72%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 w-[72%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-1.5 border-t border-white/10 mt-2">
              <span>🔥 12d Streak</span>
              <span>🏆 3 Badges</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-2.5 my-1.5 p-2.5 rounded-xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-orange-950/20 border border-orange-500/20 hover:border-orange-500/35 shadow-sm transition-all duration-200 group select-none">
      {/* Top row: Avatar + Name + Subtitle */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/35 flex items-center justify-center text-xs font-bold text-orange-200 shadow-inner overflow-hidden">
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
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-[12px] font-bold text-white truncate group-hover:text-white transition-colors leading-tight">
            {user?.name || 'Student'}
          </h4>
          <p className="text-[9.5px] font-medium text-orange-400 truncate tracking-tight leading-tight mt-0.5">
            {studentTitle}
          </p>
        </div>
      </div>

      {/* Progress bar with inline percentage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className="text-zinc-400">Career Progress</span>
          <span className="text-orange-400 font-bold">72%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_6px_rgba(249,115,22,0.5)] transition-all duration-700 ease-out"
            style={{ width: '72%' }}
          />
        </div>
      </div>

      {/* Single-row clean stats */}
      <div className="flex items-center justify-between text-[9.5px] font-medium text-zinc-300 pt-1.5 mt-1.5 border-t border-white/[0.05]">
        <span className="flex items-center gap-1 text-orange-400">
          <span>🔥</span> 12d Streak
        </span>
        <span className="text-zinc-400">•</span>
        <span className="flex items-center gap-1 text-zinc-300">
          <span>🏆</span> 3 Badges
        </span>
      </div>
    </div>
  );
}