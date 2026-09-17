/**
 * AppRoutes — single source of truth for all application routes.
 *
 * Structure:
 *  /                           → Landing Page
 *  /login                      → Login (public-only: redirects if already authed)
 *  /register                   → Register (public-only: redirects if already authed)
 *  /student/*                  → ProtectedRoute > RoleGuard('student') > DashboardLayout
 *  /student/dashboard          → StudentDashboard
 *  /student/*                  → Student application pages
 *  /academia/*                 → Unified Academia Portal
 *  /academician/*              → Academician Portal
 *  /institution/*              → Institution Portal
 *  /industry/*                 → Industry Portal
 *  /admin/*                    → SIH Admin Portal
 *  *                           → redirect to /login
 *
 * NOTE: Login.jsx and Register.jsx use callback props for switching
 * between each other. We pass navigate-based callbacks here so
 * the auth pages remain completely unmodified.
 */

import React, {
  lazy,
  Suspense,
  useState,
  useEffect
} from 'react';

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';

import LandingPage from '../pages/landing/LandingPage';

import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleGuard from '../components/common/RoleGuard';
import DashboardLayout from '../components/layout/DashboardLayout';
import DemoCenterModal from '../components/common/DemoCenterModal';

// Direct load for core immediate experiences
import CommandCenter from '../pages/student/CommandCenter';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Code-split / lazy-load secondary pages
const StudentDashboard = lazy(
  () => import('../pages/student/StudentDashboard')
);

const Profile = lazy(
  () => import('../pages/student/Profile')
);

const CareerGoal = lazy(
  () => import('../pages/student/CareerGoal')
);

const Skills = lazy(
  () => import('../pages/student/Skills')
);

const DSA = lazy(
  () => import('../pages/student/DSA')
);

const GitHub = lazy(
  () => import('../pages/student/GitHub')
);

const CareerScore = lazy(
  () => import('../pages/student/CareerScore')
);

const Resume = lazy(
  () => import('../pages/student/Resume')
);

const SkillGap = lazy(
  () => import('../pages/student/SkillGap')
);

const Roadmap = lazy(
  () => import('../pages/student/Roadmap')
);

const Projects = lazy(
  () => import('../pages/student/Projects')
);

const Opportunities = lazy(
  () => import('../pages/student/Opportunities')
);

const Applications = lazy(
  () => import('../pages/student/Applications')
);

const Analytics = lazy(
  () => import('../pages/student/Analytics')
);

const Reminders = lazy(
  () => import('../pages/student/Reminders')
);

const Copilot = lazy(
  () => import('../pages/student/Copilot')
);

const CareerIntelligence = lazy(
  () => import('../pages/student/CareerIntelligence')
);

const Execution = lazy(
  () => import('../pages/student/Execution')
);

const AdaptivePlan = lazy(
  () => import('../pages/student/AdaptivePlan')
);

const CareerTrajectory = lazy(
  () => import('../pages/student/CareerTrajectory')
);

const Settings = lazy(
  () => import('../pages/student/Settings')
);

const StudentAssessments = lazy(
  () => import('../pages/student/StudentAssessments')
);

const StudentInternships = lazy(
  () => import('../pages/student/StudentInternships')
);

// Ecosystem role portals
const AcademicianDashboard = lazy(
  () => import('../pages/academician/AcademicianDashboard')
);

const InstitutionDashboard = lazy(
  () => import('../pages/institution/InstitutionDashboard')
);

const IndustryDashboard = lazy(
  () => import('../pages/industry/IndustryDashboard')
);

const AcademiaCommandCenter = lazy(
  () => import('../pages/academia/AcademiaCommandCenter')
);

/* ── Fallback Loading Skeleton ─────────────────────────────── */

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />

        <span className="text-xs text-zinc-500 font-medium tracking-wide">
          Loading module...
        </span>
      </div>
    </div>
  );
}

import { useAuth } from '../hooks/useAuth';
import { ROUTES, ROLES } from '../utils/constants';

/* ── Public-only gate ───────────────────────────────────────── */

// Redirects already-authenticated users away from login/register.
function PublicRoute({ children }) {
  const {
    isAuthenticated,
    user
  } = useAuth();

  if (isAuthenticated) {
    if (user?.role === ROLES.STUDENT) {
      return (
        <Navigate
          to={ROUTES.STUDENT_COMMAND_CENTER}
          replace
        />
      );
    }

    if (user?.role === ROLES.ACADEMICIAN) {
      return (
        <Navigate
          to={ROUTES.ACADEMICIAN_PORTAL}
          replace
        />
      );
    }

    if (
      user?.role === ROLES.INSTITUTION_ADMIN ||
      user?.role === ROLES.INSTITUTION
    ) {
      return (
        <Navigate
          to={ROUTES.INSTITUTION_PORTAL}
          replace
        />
      );
    }

    if (user?.role === ROLES.INDUSTRY) {
      return (
        <Navigate
          to={ROUTES.INDUSTRY_PORTAL}
          replace
        />
      );
    }

    if (user?.role === ROLES.SUPER_ADMIN) {
      return (
        <Navigate
          to={ROUTES.INSTITUTION_PORTAL}
          replace
        />
      );
    }

    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
      />
    );
  }

  return children;
}

/* ── Landing Page wrapper ──────────────────────────────────── */

function LandingPageRoute() {
  const navigate = useNavigate();

  return (
    <LandingPage
      onLogin={() => navigate(ROUTES.LOGIN)}

      onRegister={(role = 'student') =>
        navigate(ROUTES.REGISTER, {
          state: { role }
        })
      }

      onExplore={() => {
        const el =
          document.getElementById('world-journey') ||
          document.getElementById('capabilities');

        el?.scrollIntoView({
          behavior: 'smooth'
        });
      }}
    />
  );
}

/* ── Login wrapper ──────────────────────────────────────────── */

// Passes navigate-based callbacks so Login.jsx stays untouched.
function LoginPage() {
  const navigate = useNavigate();

  return (
    <Login
      onRegister={() =>
        navigate(ROUTES.REGISTER)
      }
      onHome={() =>
        navigate('/')
      }
    />
  );
}

/* ── Register wrapper ───────────────────────────────────────── */

function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialRole =
    location.state?.role || 'student';

  return (
    <Register
      initialRole={initialRole}
      onLogin={() =>
        navigate(ROUTES.LOGIN)
      }
      onHome={() =>
        navigate('/')
      }
    />
  );
}

/* ── Coming-soon placeholder ────────────────────────────────── */

function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">

      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-500"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />

          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      <h2 className="text-[18px] font-semibold text-zinc-200 mb-2">
        In development
      </h2>

      <p className="text-[13px] text-zinc-500 max-w-[280px] leading-relaxed mb-6">
        This section is being built. Check back in a future phase.
      </p>

      <button
        onClick={() =>
          navigate(ROUTES.STUDENT_DASHBOARD)
        }
        className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
      >
        ← Back to Overview
      </button>

    </div>
  );
}

/* ── Route tree ─────────────────────────────────────────────── */

export default function AppRoutes() {
  const [
    isDemoOpen,
    setIsDemoOpen
  ] = useState(false);

  useEffect(() => {
    const handleOpen = () =>
      setIsDemoOpen(true);

    window.addEventListener(
      'open-demo-center',
      handleOpen
    );

    const handleKeyDown = (e) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === 'D' ||
          e.key === 'd')
      ) {
        e.preventDefault();

        setIsDemoOpen(
          (prev) => !prev
        );
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'open-demo-center',
        handleOpen
      );

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, []);

  return (
    <>
      <DemoCenterModal
        isOpen={isDemoOpen}
        onClose={() =>
          setIsDemoOpen(false)
        }
      />

      <Routes>

        {/* Root → Landing Page */}
        <Route
          path="/"
          element={
            <LandingPageRoute />
          }
        />

        {/* Public auth pages */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Student portal — protected + role-gated */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRole={ROLES.STUDENT}
              >
                <DashboardLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >

          {/* /student → /student/command-center */}
          <Route
            index
            element={
              <Navigate
                to="command-center"
                replace
              />
            }
          />

          {/* Career Command Center */}
          <Route
            path="command-center"
            element={
              <CommandCenter />
            }
          />

          {/* Student Dashboard */}
          <Route
            path="dashboard"
            element={
              <StudentDashboard />
            }
          />

          {/* Career Readiness Score */}
          <Route
            path="career-score"
            element={
              <CareerScore />
            }
          />

          {/* Career Goal */}
          <Route
            path="career-goal"
            element={
              <CareerGoal />
            }
          />

          {/* Skills */}
          <Route
            path="skills"
            element={
              <Skills />
            }
          />

          {/* DSA */}
          <Route
            path="dsa"
            element={
              <DSA />
            }
          />

          {/* Skill Gap */}
          <Route
            path="skill-gap"
            element={
              <SkillGap />
            }
          />

          {/* Roadmap */}
          <Route
            path="roadmap"
            element={
              <Roadmap />
            }
          />

          {/* Projects */}
          <Route
            path="projects"
            element={
              <Projects />
            }
          />

          {/* GitHub */}
          <Route
            path="github"
            element={
              <GitHub />
            }
          />

          {/* Resume */}
          <Route
            path="resume"
            element={
              <Resume />
            }
          />

          {/* Opportunities */}
          <Route
            path="opportunities"
            element={
              <Opportunities />
            }
          />

          {/* Internships */}
          <Route
            path="internships"
            element={
              <StudentInternships />
            }
          />

          {/* Assessments */}
          <Route
            path="assessments"
            element={
              <StudentAssessments />
            }
          />

          {/* Applications */}
          <Route
            path="applications"
            element={
              <Applications />
            }
          />

          {/* Analytics */}
          <Route
            path="analytics"
            element={
              <Analytics />
            }
          />

          {/* Reminders */}
          <Route
            path="reminders"
            element={
              <Reminders />
            }
          />

          {/* Copilot */}
          <Route
            path="copilot"
            element={
              <Copilot />
            }
          />

          {/* Career Intelligence */}
          <Route
            path="career-intelligence"
            element={
              <CareerIntelligence />
            }
          />

          {/* Execution */}
          <Route
            path="execution"
            element={
              <Execution />
            }
          />

          {/* Adaptive Plan */}
          <Route
            path="adaptive-plan"
            element={
              <AdaptivePlan />
            }
          />

          {/* Career Trajectory */}
          <Route
            path="career-trajectory"
            element={
              <CareerTrajectory />
            }
          />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <Profile />
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <Settings />
            }
          />

        </Route>

        {/* Unified Academia Portal */}
        <Route
          path="/academia/*"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  ROLES.ACADEMICIAN,
                  ROLES.INSTITUTION_ADMIN,
                  ROLES.INSTITUTION,
                  ROLES.SUPER_ADMIN
                ]}
              >
                <Suspense
                  fallback={
                    <PageLoadingFallback />
                  }
                >
                  <AcademiaCommandCenter />
                </Suspense>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Academician Portal */}
        <Route
          path="/academician/*"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  ROLES.ACADEMICIAN,
                  ROLES.SUPER_ADMIN
                ]}
              >
                <Suspense
                  fallback={
                    <PageLoadingFallback />
                  }
                >
                  <AcademicianDashboard />
                </Suspense>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Institution Portal */}
        <Route
          path="/institution/*"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  ROLES.INSTITUTION_ADMIN,
                  ROLES.INSTITUTION,
                  ROLES.SUPER_ADMIN
                ]}
              >
                <Suspense
                  fallback={
                    <PageLoadingFallback />
                  }
                >
                  <InstitutionDashboard />
                </Suspense>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Industry Portal */}
        <Route
          path="/industry/*"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  ROLES.INDUSTRY,
                  ROLES.SUPER_ADMIN
                ]}
              >
                <Suspense
                  fallback={
                    <PageLoadingFallback />
                  }
                >
                  <IndustryDashboard />
                </Suspense>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* SIH Admin Portal */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  ROLES.SUPER_ADMIN,
                  ROLES.INSTITUTION_ADMIN
                ]}
              >
                <Suspense
                  fallback={
                    <PageLoadingFallback />
                  }
                >
                  <InstitutionDashboard />
                </Suspense>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <Navigate
              to={ROUTES.LOGIN}
              replace
            />
          }
        />

      </Routes>
    </>
  );
}