/**
 * AICopilotCard.jsx — Compact & Elevated AI Career Copilot Card
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';

export default function AICopilotCard({ isCollapsed = false, onClick }) {
  const [tooltip, setTooltip] = useState(false);

  if (isCollapsed) {
    return (
      <div
        className="relative mx-auto my-1.5 flex justify-center"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
      >
        <NavLink
          to={ROUTES.STUDENT_COPILOT}
          onClick={onClick}
          className={({ isActive }) =>
            [
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative group',
              'bg-gradient-to-br from-purple-600/30 via-zinc-900 to-orange-600/30 border border-purple-500/40 hover:border-orange-500/60 shadow-sm hover:scale-105',
              isActive ? 'ring-2 ring-purple-500/50' : '',
            ].join(' ')
          }
        >
          <span className="text-sm animate-pulse">✨</span>
        </NavLink>

        {tooltip && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1.5 rounded-xl bg-zinc-900/95 text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-purple-500/40 backdrop-blur-md pointer-events-none animate-scale-in">
            <span className="text-purple-300 font-bold flex items-center gap-1.5">
              ✨ AI Career Copilot
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Ask anything about your career →
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={ROUTES.STUDENT_COPILOT}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'relative group flex items-center rounded-lg text-xs font-medium transition-all duration-150 select-none px-3 py-1.5 mx-2 my-0.5 gap-2.5',
          isActive
            ? 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent text-white font-semibold shadow-sm border border-purple-500/30'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]',
        ].join(' ')
      }
    >
      <span className="text-xs shrink-0 text-purple-400 group-hover:scale-110 transition-transform">
        ✨
      </span>
      <span className="truncate transition-transform duration-150 group-hover:translate-x-0.5">
        AI Career Copilot
      </span>
      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
        PRO
      </span>
    </NavLink>
  );
}