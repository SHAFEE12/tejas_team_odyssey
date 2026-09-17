import React from 'react';

/**
 * ActionCard — High-impact executive focal card for "DO THIS NEXT"
 */
export default function ActionCard({
  tag = 'DO THIS NEXT',
  title,
  minutes,
  impact = 'HIGH',
  reason,
  origin,
  primaryCtaText = 'START TASK',
  onPrimaryCta,
  secondaryCtaText,
  onSecondaryCta,
  loading = false,
  className = '',
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/40 via-[#0d0f17] to-zinc-950 border border-orange-500/30 hover:border-orange-500/50 p-6 sm:p-7 shadow-2xl shadow-orange-950/30 transition-all duration-300 group ${className}`}
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/15 transition-all duration-500"
        aria-hidden="true"
      />

      {/* Header bar: Tag, Origin, Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-950" />
            </span>
            <span>{tag}</span>
          </span>

          {origin && (
            <span className="text-xs text-zinc-400 font-medium">
              via <span className="text-zinc-300 font-semibold">{origin}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {minutes && (
            <span className="flex items-center gap-1">
              <span>⏱</span>
              <span>{minutes} min</span>
            </span>
          )}
          {impact && (
            <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 text-xs tracking-wide">
              ⚡ {impact} IMPACT
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2.5 relative z-10 leading-snug">
        {title}
      </h2>

      {/* Why Explanation Box */}
      {reason && (
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] mb-5 relative z-10 backdrop-blur-md">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <strong className="text-orange-400 font-bold">Why this matters: </strong>
            {reason}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        <button
          type="button"
          onClick={onPrimaryCta}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? 'Starting...' : primaryCtaText}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>

        {secondaryCtaText && onSecondaryCta && (
          <button
            type="button"
            onClick={onSecondaryCta}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer hover:-translate-y-0.5"
          >
            {secondaryCtaText}
          </button>
        )}
      </div>
    </section>
  );
}