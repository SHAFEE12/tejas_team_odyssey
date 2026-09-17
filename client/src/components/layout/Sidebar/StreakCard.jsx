/**
 * StreakCard.jsx — Bottom Gamification Streak Card
 *
 * Displays:
 * - Flame icon with subtle orange glow
 * - "🔥 12 Day Streak"
 * - "Keep going, you're doing great!"
 * - Clickable feedback with motivational message
 */

import React, { useState } from 'react';

export default function StreakCard({ isCollapsed = false }) {
  const [cheer, setCheer] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  const handleClick = () => {
    setCheer(true);
    setTimeout(() => setCheer(false), 2400);
  };

  if (isCollapsed) {
    return (
      <div
        className="relative mx-auto my-2 flex justify-center"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
      >
        <button
          type="button"
          onClick={handleClick}
          className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 hover:border-orange-500/50 flex items-center justify-center text-sm shadow-sm hover:scale-105 transition-all text-orange-400 group"
          aria-label="View streak"
        >
          <span className="group-hover:scale-125 transition-transform animate-bounce">
            🔥
          </span>
        </button>

        {tooltip && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 px-3 py-2 rounded-xl bg-zinc-900/95 text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-orange-500/30 backdrop-blur-md pointer-events-none animate-scale-in">
            <span className="text-orange-400 font-bold">🔥 12 Day Streak</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Keep going, you're doing great!
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-r from-orange-950/30 via-zinc-900/80 to-zinc-900 border border-orange-500/20 hover:border-orange-500/40 shadow-sm hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group select-none relative overflow-hidden"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-base shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          🔥
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-300 group-hover:text-orange-200 transition-colors">
              12 Day Streak
            </span>
            <span className="text-[10px] text-orange-400/80">🔥 Active</span>
          </div>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300 transition-colors">
            {cheer ? '🎉 +50 XP! You rock!' : "Keep going, you're doing great!"}
          </p>
        </div>
      </div>
    </div>
  );
}