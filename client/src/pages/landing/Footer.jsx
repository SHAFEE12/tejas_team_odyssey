import { useState } from 'react';

export default function Footer({ onLogin, onRegister, onNavigate }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#050505] border-t border-white/[0.08] text-zinc-400 text-xs relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Newsletter Section */}
        <div className="max-w-2xl">
          <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight">
            Join our newsletter
          </h3>

          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Sign up to our mailing list below and be the first to know about
            new updates. Don't worry, we hate spam too.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="mt-5 flex flex-col sm:flex-row gap-3 max-w-md"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-2.5 rounded-xl bg-[#131415] border border-white/10 text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-[#fc8200] transition-colors flex-1"
            />

            <button
              type="submit"
              disabled={subscribed}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fc8200] to-[#ff4d00] hover:from-[#ff9326] hover:to-[#ff5e1a] disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-md cursor-pointer shrink-0"
            >
              {subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          </form>

          {subscribed && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-emerald-400 font-mono mt-2"
            >
              Thank you for subscribing to OdysseyLab updates.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/5 my-14" />

        {/* Sitemap */}
        <div className="pb-14 grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-white/5">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#fc8200]/20 border border-[#fc8200]/30 flex items-center justify-center text-[#fc8200]">
                <span className="material-symbols-outlined text-base">
                  explore
                </span>
              </div>

              <span className="font-bold text-white font-mono text-sm">
                CareerOdyssey
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              We are the unified ecosystem and mentor of your professional
              journey.
            </p>
          </div>

          {/* Pages */}
          <div className="space-y-3">
            <span className="text-white font-mono text-xs uppercase tracking-wider font-semibold">
              Pages
            </span>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('approach')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Our Approach
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('why-us')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Why Us
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('features')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Features
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('faq')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div className="space-y-3">
            <span className="text-white font-mono text-xs uppercase tracking-wider font-semibold">
              Portals
            </span>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('student')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Student Portal
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('academician')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Academician Portal
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('institution')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Institution Portal
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('industry')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Industry Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <span className="text-white font-mono text-xs uppercase tracking-wider font-semibold">
              Account
            </span>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onLogin}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Sign In
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('student')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Created by OdysseyLab •
            CareerOdyssey. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Privacy</span>

            <span className="text-zinc-600">•</span>

            <span className="text-zinc-400">
              Terms of Service
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}