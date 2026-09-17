import React from 'react';

/**
 * MetricCard — Unified metric display primitive.
 */
export default function MetricCard({
  label,
  value,
  max,
  subtext,
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral'
  color = 'text-white',
  icon,
  onClick,
  className = '',
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] flex flex-col justify-between transition-all ${
        isClickable ? 'hover:bg-white/[0.04] hover:border-white/15 cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11.5px] font-semibold text-zinc-400 tracking-wide">{label}</span>
        {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
      </div>

      <div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-2xl font-black tracking-tight ${color}`}>{value}</span>
          {max !== undefined && max !== null && (
            <span className="text-xs text-zinc-500 font-normal">/ {max}</span>
          )}
          {delta !== undefined && delta !== null && (
            <span
              className={`text-xs font-bold ml-auto ${
                deltaType === 'positive'
                  ? 'text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-rose-400'
                  : 'text-zinc-400'
              }`}
            >
              {typeof delta === 'number' && delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
        {subtext && <p className="text-[11px] text-zinc-500 mt-1 leading-snug truncate">{subtext}</p>}
      </div>
    </div>
  );
}