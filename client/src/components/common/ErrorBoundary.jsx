import React, { Component } from 'react';
import BrandLogo from './BrandLogo';

/**
 * ErrorBoundary — Production-grade React top-level error boundary.
 *
 * Catches unhandled rendering errors and displays a safe, user-friendly
 * recovery interface without exposing stack traces, filesystem paths,
 * database details, or authentication internals.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, errors are logged securely to server diagnostics if configured.
    // Client-side execution intentionally strips internal details.
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary captured error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl flex flex-col items-center text-center animate-fadeIn">
            {/* Brand Logo Mark */}
            <div className="mb-6">
              <BrandLogo size="md" showText={true} />
            </div>

            {/* Error Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight mb-2">
              Something went wrong.
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 max-w-sm">
              An unexpected error occurred while rendering this view. Your progress and data remain securely stored.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/25 transition-all cursor-pointer border border-white/15"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-white font-medium text-xs transition-all cursor-pointer border border-white/10"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}