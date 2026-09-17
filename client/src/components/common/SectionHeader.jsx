import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SectionHeader — Consistent section title with optional subtitle, badge, and link.
 */
export default function SectionHeader({
  title,
  subtitle,
  badge,
  actionLabel,
  actionTo,
  onAction,
  level = 2,
  as,
  className = '',
}) {
  const HeadingTag = as || (level === 3 ? 'h3' : 'h2');

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <HeadingTag className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            {title}
          </HeadingTag>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {(actionLabel && actionTo) && (
        <Link
          to={actionTo}
          className="text-xs font-semibold text-orange-400 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>{actionLabel}</span>
          <span>→</span>
        </Link>
      )}

      {(actionLabel && onAction && !actionTo) && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-orange-400 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>{actionLabel}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
}