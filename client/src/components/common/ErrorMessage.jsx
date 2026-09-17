import React from 'react';

/**
 * ErrorMessage — Accessible, sanitizing error display primitive.
 *
 * Ensures user-friendly messaging without leaking stack traces,
 * file paths, SQL/Mongo queries, or server internals.
 */
export default function ErrorMessage({
  message = 'Unable to load data. Please try again.',
  title = 'Something went wrong',
  onRetry = null,
  className = '',
}) {
  // Strip raw stack traces or internal diagnostic symbols if accidentally passed
  const safeMessage = typeof message === 'string'
    ? message.replace(/(at\s+.+\(.*\)|Error:\s+|MongoError:.+|ECONNREFUSED.+)/gi, '').trim() || 'An error occurred. Please try again.'
    : 'An error occurred. Please try again.';

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          {title && <strong className="font-bold text-rose-300 block mb-0.5">{title}</strong>}
          <span className="text-zinc-300">{safeMessage}</span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white font-medium text-xs transition-colors border border-rose-500/30 cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}