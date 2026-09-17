import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROLE_LABELS = {
  student: 'Student',
  industry: 'Industry',
  academician: 'Academician',
  institution: 'Institution',
};

/**
 * Role-aware welcome/success page.
 * Shown after successful signup or login to demonstrate
 * that the selected role is real application state.
 */
export default function Welcome() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const handleContinue = () => {
    alert(
      `The ${roleLabel} dashboard is not built yet — this is a frontend prototype.\n\n` +
      `In the full application, this button would navigate to the ${roleLabel} dashboard.`
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-lowest flex items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-[520px] px-2 text-center flex flex-col items-center gap-10">
        {/* ── Success Icon ── */}
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[40px]" aria-hidden="true">
            check_circle
          </span>
        </div>

        {/* ── Welcome Text ── */}
        <div className="w-full flex flex-col gap-3">
          <h1 className="text-headline-lg text-primary tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Role: {roleLabel}
          </p>
          <p className="text-body-md text-on-surface-variant">
            Your {roleLabel} workspace is ready.
          </p>
        </div>

        {/* ── Continue Button ── */}
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-primary text-on-primary text-label-md rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2 whitespace-nowrap"
        >
          Continue to {roleLabel} Portal
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            arrow_forward
          </span>
        </button>

        {/* ── Sign Out ── */}
        <button
          onClick={handleLogout}
          className="text-body-md text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-white/30 hover:decoration-primary whitespace-nowrap"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}