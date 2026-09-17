import React from 'react';

/**
 * ProgressBar — Accessible percentage progress bar.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  height = 'h-2',
  tone = 'orange', // 'orange' | 'emerald' | 'sky' | 'purple' | 'amber' | 'red'
  showLabel = false,
  label = '',
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, max > 0 ? Math.round((value / max) * 100) : 0));

  const TONES = {
    orange: 'bg-gradient-to-r from-[#FF6B00] to-[#FFA726]',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
  };

  const fillClass = TONES[tone] || TONES.orange;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          {label && <span className="font-medium text-zinc-300 truncate">{label}</span>}
          <span className="font-bold text-zinc-200 ml-auto">{percentage}%</span>
        </div>
      )}
      <div
        className={`w-full ${height} rounded-full bg-white/[0.06] overflow-hidden`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out ${fillClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}