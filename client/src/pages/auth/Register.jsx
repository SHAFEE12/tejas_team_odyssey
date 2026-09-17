import { useState } from 'react';
import AuthLayout, { AuthVisualPanel, GoogleIcon } from '../../components/auth/AuthLayout';
import RoleSelector from '../../components/auth/RoleSelector';

const API_URL = import.meta.env.VITE_API_URL;

const Register = ({ onLogin, onHome, initialRole = 'student' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole || 'student',
    registrationNumber: '',
    collegeName: '',
    academicianId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const {
      name,
      email,
      password,
      confirmPassword,
      role
    } = formData;

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (role === 'student') {
      if (!formData.registrationNumber.trim() || !formData.collegeName.trim()) {
        setError('Registration number and college name are required for students.');
        return;
      }
    } else if (role === 'academician') {
      if (!formData.collegeName.trim() || !formData.academicianId.trim()) {
        setError('College name and academician ID are required for academicians.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role
      };

      if (role === 'student') {
        payload.registrationNumber = formData.registrationNumber.trim();
        payload.collegeName = formData.collegeName.trim();
      } else if (role === 'academician') {
        payload.collegeName = formData.collegeName.trim();
        payload.academicianId = formData.academicianId.trim();
      } else if (formData.collegeName?.trim()) {
        payload.collegeName = formData.collegeName.trim();
      }

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Registration failed.'
        );
      }

      setSuccess(
        'Account created successfully. You can now log in.'
      );

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: initialRole || 'student',
        registrationNumber: '',
        collegeName: '',
        academicianId: ''
      });
    } catch (error) {
      console.error('Registration error:', error);

      setError(
        error.message ||
          'Unable to create your account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register" onNavigate={onLogin} onHome={onHome}>

      {/* ── Left Column: Headline + Auth Card ── */}
      <section className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left justify-center py-4">

        {/* Editorial Headline */}
        <div className="w-full max-w-[500px] mb-7">
          <h1 className="serif-title text-[40px] sm:text-[44px] md:text-[52px] leading-[1.08] tracking-tight text-white text-glow mb-2">
            Start your{' '}
            <span className="font-black font-sans text-[38px] sm:text-[42px] md:text-[50px] tracking-tight text-white">
              Career Odyssey
            </span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base font-normal tracking-normal">
            Your intelligent compass for professional growth
          </p>
        </div>

        {/* ── Obsidian Glass Auth Card ── */}
        <div className="w-full max-w-[500px] glass-panel bg-[#141418]/90 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/60 relative overflow-hidden">

          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Role Selector */}
          <div className="mb-6">
            <RoleSelector
              value={formData.role}
              onChange={(roleId) =>
                setFormData((prev) => ({ ...prev, role: roleId }))
              }
              label="CHOOSE YOUR PATH"
              disabled={loading}
            />
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-[#202025] hover:bg-[#282830] text-zinc-200 font-medium py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 text-sm shadow-md"
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold">
              <span className="bg-[#141418] px-3 text-zinc-500 tracking-wider">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                autoComplete="name"
                className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
              />
            </div>

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
                placeholder="Email address"
                autoComplete="email"
                className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
              />
            </div>

            {/* Student Specific Fields */}
            {formData.role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="registrationNumber" className="sr-only">
                    Registration Number
                  </label>
                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Registration Number"
                    className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                  />
                </div>
                <div>
                  <label htmlFor="collegeName" className="sr-only">
                    College Name
                  </label>
                  <input
                    id="collegeName"
                    name="collegeName"
                    type="text"
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="College Name"
                    className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                  />
                </div>
              </div>
            )}

            {/* Academician Specific Fields */}
            {formData.role === 'academician' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="academicianId" className="sr-only">
                    Academician ID
                  </label>
                  <input
                    id="academicianId"
                    name="academicianId"
                    type="text"
                    value={formData.academicianId}
                    onChange={handleChange}
                    placeholder="Academician ID"
                    className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                  />
                </div>
                <div>
                  <label htmlFor="collegeName" className="sr-only">
                    College Name
                  </label>
                  <input
                    id="collegeName"
                    name="collegeName"
                    type="text"
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="College Name"
                    className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                  />
                </div>
              </div>
            )}

            {/* Institution Specific Field */}
            {(formData.role === 'institution' || formData.role === 'institution_admin') && (
              <div>
                <label htmlFor="collegeName" className="sr-only">
                  Institution Name
                </label>
                <input
                  id="collegeName"
                  name="collegeName"
                  type="text"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Institution Name"
                  className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                />
              </div>
            )}

            {/* Industry Specific Field */}
            {formData.role === 'industry' && (
              <div>
                <label htmlFor="collegeName" className="sr-only">
                  Company / Organization Name
                </label>
                <input
                  id="collegeName"
                  name="collegeName"
                  type="text"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Company / Organization Name"
                  className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                />
              </div>
            )}

            {/* Password + Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className="w-full bg-[#1b1b22] text-sm text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-3 border border-white/5 focus:border-white/30 focus:bg-[#202028] focus:outline-none focus:ring-0 transition-all duration-150"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading ? 'Creating account...' : 'Create Account'}
              </span>
              {!loading && (
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 font-bold">
                  →
                </span>
              )}
            </button>

          </form>

          {/* Card Footer — Log In link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLogin}
                className="text-white underline font-semibold hover:text-amber-400 transition-colors"
              >
                Log in
              </button>
            </p>
          </div>

        </div>
      </section>

      {/* ── Right Column: Visual Panel ── */}
      <AuthVisualPanel variant="register" />

    </AuthLayout>
  );
};

export default Register;