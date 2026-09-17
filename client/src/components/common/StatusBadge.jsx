import React from 'react';

/**
 * StatusBadge — Consistent badge component across all statuses, modes, and risks.
 */
export default function StatusBadge({
  status = '',
  label,
  variant = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'
  size = 'sm', // 'xs' | 'sm' | 'md'
  dot = false,
  className = '',
}) {
  const displayLabel = label || status.replace(/_/g, ' ');

  const VARIANTS = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    danger: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    primary: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    neutral: 'bg-white/5 border-white/10 text-zinc-400',
  };

  const SIZES = {
    xs: 'px-1.5 py-0.5 text-[9.5px]',
    sm: 'px-2.5 py-0.5 text-[10.5px]',
    md: 'px-3 py-1 text-xs',
  };

  const activeVariant = VARIANTS[variant] || VARIANTS.neutral;
  const activeSize = SIZES[size] || SIZES.sm;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border shrink-0 ${activeVariant} ${activeSize} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-emerald-400'
              : variant === 'warning'
              ? 'bg-amber-400'
              : variant === 'danger'
              ? 'bg-rose-400'
              : variant === 'info'
              ? 'bg-sky-400'
              : variant === 'primary'
              ? 'bg-orange-500'
              : 'bg-zinc-400'
          }`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}