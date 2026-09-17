/**
 * AuthLayout — shared page shell used by both Register and Login pages.
 * Provides the sticky header, two-column grid, footer, and visual panel.
 *
 * Uses callback-based navigation (onNavigate) instead of react-router
 * since the app currently uses App.jsx state toggling for auth pages.
 *
 * Also exports AuthHeader, AuthFooter, AuthVisualPanel, and GoogleIcon
 * as named exports so pages can compose them independently if needed.
 */

import authImage from '../../assets/images/auth.png';
import BrandLogo from '../common/BrandLogo';

// Compass/star icon SVG
function CompassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

// Official Google G SVG (4-color)
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

/**
 * AuthHeader — sticky top navigation bar.
 * mode: 'register' | 'login'
 * onNavigate: callback to switch between login/register
 */
function AuthHeader({ mode, onNavigate, onHome }) {
  return (
    <header className="sticky top-0 z-20 w-full px-6 lg:px-14 py-4 flex items-center justify-between border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md shrink-0">
      {/* Brand */}
      <div
        onClick={onHome}
        className={`flex items-center group ${onHome ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label="Career Odyssey Home"
      >
        <BrandLogo size="md" showText={true} />
      </div>

      {/* Header CTA */}
      <div className="flex items-center gap-4">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={onNavigate}
            className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg border border-white/10 hover:border-white/25 transition-colors cursor-pointer"
          >
            Log In
          </button>
        ) : (
          <button
            type="button"
            onClick={onNavigate}
            className="text-sm font-semibold bg-gradient-to-r from-[#FF6B00] to-[#FFA726] hover:from-[#FF7A00] hover:to-[#FFB74D] text-zinc-950 px-4 py-2 rounded-lg transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            Create Account
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * AuthFooter — minimal footer with copyright and links.
 */
function AuthFooter() {
  return (
    <footer className="py-4 border-t border-white/5 text-xs text-zinc-500 shrink-0">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Career Odyssey Inc. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Security</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">System Status</a>
        </div>
      </div>
    </footer>
  );
}

/**
 * AuthVisualPanel — right-side visual panel with atmospheric CSS treatment.
 * Uses the shared auth image with subtle atmospheric overlays.
 * variant: 'register' | 'login'
 */
function AuthVisualPanel({ variant }) {
  return (
    <section className="lg:col-span-6 hidden lg:flex items-center justify-center h-full" aria-hidden="true">
      <div className="relative w-full aspect-[4/5] max-h-[720px] max-w-[600px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl group">
        {/* Warm atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-stone-900 to-zinc-950" />

        {/* Secondary glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-gradient-to-t from-amber-700/15 via-amber-900/8 to-transparent rounded-full blur-3xl" />

        {/* Architectural grid lines */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Center emblem */}
        <img
          src={authImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Spiral path suggestion — decorative SVG */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {/* Top subtle highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent pointer-events-none" />
        {/* Inset ring */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />

        {/* Floating Brand Badge */}
        <div className="absolute bottom-6 left-6 right-6 p-3.5 rounded-2xl bg-[#0c0c0e]/85 backdrop-blur-xl border border-white/10 flex items-center justify-between shadow-2xl shadow-black/80">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" showText={false} />
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Career Operating System</p>
              <p className="text-[11px] text-zinc-400">Strategy, Daily Execution & Intelligence</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B00]/20 to-[#FFA500]/15 text-[#FFA726] border border-[#FF6B00]/30 uppercase">
            OS 2.0
          </span>
        </div>
      </div>
    </section>
  );
}

export { AuthHeader, AuthFooter, AuthVisualPanel, GoogleIcon };

/**
 * Default export: full-page layout shell.
 * mode: 'register' | 'login'
 * onNavigate: callback to switch between login/register
 */
export default function AuthLayout({ mode, onNavigate, onHome, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0f] text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-white">
      <AuthHeader mode={mode} onNavigate={onNavigate} onHome={onHome} />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-14 py-8 lg:py-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 w-full items-center">
          {children}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
