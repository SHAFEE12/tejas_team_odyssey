import React from 'react';

/**
 * EmptyState — User-friendly empty state replacing walls of zeros with constructive guidance.
 */
export default function EmptyState({
  title = 'No data available yet',
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) {
  return (
    <div
      className={`p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-3.5">
        {icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <h4 className="text-sm font-bold text-zinc-200 mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-4">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}