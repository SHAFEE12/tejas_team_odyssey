/**
 * SectionHeader.jsx — Compact category header for navigation sections
 */

import React from 'react';

export default function SectionHeader({ label, isCollapsed = false }) {
  if (isCollapsed) {
    return <div className="w-5 h-px bg-white/10 mx-auto my-1.5" />;
  }

  return (
    <div className="px-3.5 pt-1.5 pb-0.5 flex items-center justify-between">
      <span className="text-[9.5px] font-bold tracking-wider uppercase text-zinc-500 select-none">
        {label}
      </span>
    </div>
  );
}