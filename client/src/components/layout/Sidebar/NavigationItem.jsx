/**
 * NavigationItem.jsx — Reusable Sidebar Navigation Link (Space-Optimized)
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function NavigationItem({
  item,
  isCollapsed = false,
  onClick,
  badge,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <NavLink
        to={item.path}
        end={item.id === 'overview' || item.id === 'command-center'}
        onClick={onClick}
        className={({ isActive }) =>
          [
            'relative group flex items-center rounded-lg text-[12.5px] font-medium transition-all duration-150 select-none',
            isCollapsed
              ? 'justify-center w-9 h-9 mx-auto my-0.5'
              : 'px-3 py-1.5 mx-2 my-0.5 gap-2.5',
            isActive
              ? 'bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent text-white font-semibold shadow-sm shadow-orange-950/20 border border-orange-500/25'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Left Indicator Bar */}
            {isActive && !isCollapsed && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <span
              className={`shrink-0 transition-all duration-150 flex items-center justify-center ${
                isActive
                  ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)] scale-105'
                  : 'text-zinc-400 group-hover:text-orange-300 group-hover:scale-110'
              }`}
            >
              {typeof item.icon === 'function' ? (
                <item.icon />
              ) : (
                item.icon
              )}
            </span>

            {/* Label */}
            {!isCollapsed && (
              <span className="truncate transition-transform duration-150 group-hover:translate-x-0.5">
                {item.label}
              </span>
            )}

            {/* Notification Badge */}
            {!isCollapsed && badge && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/10 shrink-0">
                {badge}
              </span>
            )}

            {/* Pulsing Active Indicator Dot */}
            {!isCollapsed && isActive && !item.isPrimary && !badge && (
              <span
                className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] shrink-0"
                aria-hidden="true"
              />
            )}

            {/* Collapsed Active Dot */}
            {isCollapsed && isActive && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]"
                aria-hidden="true"
              />
            )}
          </>
        )}
      </NavLink>

      {/* Floating Tooltip in Collapsed Mode */}
      {isCollapsed && showTooltip && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1 rounded-lg bg-zinc-900/95 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 backdrop-blur-md pointer-events-none animate-scale-in">
          {item.label}
          {badge && (
            <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-orange-500/30 text-orange-300">
              {badge}
            </span>
          )}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900/95" />
        </div>
      )}
    </div>
  );
}