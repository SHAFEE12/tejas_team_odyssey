import { useState } from 'react';
import AuthLayout, { AuthVisualPanel, GoogleIcon } from '../../components/auth/AuthLayout';

const API_URL = import.meta.env.VITE_API_URL;

const Login = ({ onRegister, onHome }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed.'
        );
      }

      // Store authentication data
      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      // Role-based navigation
      switch (data.user.role) {
        case 'student':
          window.location.href =
            '/student/command-center';
          break;

        case 'industry':
          window.location.href =
            '/industry/dashboard';
          break;

        case 'academician':
          window.location.href =
            '/academician/dashboard';
          break;

        case 'institution':
          window.location.href =
            '/institution/dashboard';
          break;

        default:
          window.location.href = '/';
      }
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      setError(
        error.message ||
          'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login" onNavigate={onRegister} onHome={onHome}>

      {/* ── Left Column: Headline + Auth Card ── */}
      <section className="lg:col-span-6 flex flex-col justify-center max-w-xl mx-auto lg:max-w-none w-full py-4">

        {/* Editorial Headline */}
        <div className="text-center lg:text-left mb-8">
          <h1 className="serif-title text-[36px] sm:text-[40px] md:text-[52px] leading-[1.08] tracking-tight text-white text-glow mb-2">
            Start your{' '}
            <span className="font-black font-sans text-[34px] sm:text-[38px] md:text-[50px] tracking-tight text-white block sm:inline">
              Career{' '}
              <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFA726] bg-clip-text text-transparent">
                Odyssey
              </span>
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 font-normal">
            Your intelligent compass for professional growth and big ambitions.
          </p>
        </div>

        {/* ── Obsidian Glass Auth Card ── */}
        <div className="glass-panel bg-[#131314]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden">

          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Google Login */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-white/25 text-sm font-medium text-white transition-all duration-150 shadow-sm group"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#131314] px-3 text-zinc-500 tracking-widest text-[11px] font-semibold">
                OR
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 text-sm rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <span className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 text-sm rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10 transition-colors"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FFA726] hover:from-[#FF7A00] hover:to-[#FFB74D] text-zinc-950 font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
              {!loading && (
                <span className="transition-transform group-hover:translate-x-0.5 text-zinc-900 font-bold">
                  →
                </span>
              )}
            </button>

          </form>

          {/* Card Footer — Terms / Privacy */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-zinc-500">
              By proceeding, you agree to our{' '}
              <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</a>.
            </p>
          </div>

        </div>

        {/* Below-card link */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-xs text-zinc-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onRegister}
              className="text-white underline font-semibold hover:text-zinc-300 ml-1"
            >
              Create an account
            </button>
          </p>
        </div>

      </section>

      {/* ── Right Column: Visual Panel ── */}
      <AuthVisualPanel variant="login" />

    </AuthLayout>
  );
};

export default Login;