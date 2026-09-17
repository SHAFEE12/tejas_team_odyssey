/**
 * Sidebar.jsx — Streamlined & Compact Premium Left Sidebar
 *
 * Space-Optimized Information Architecture:
 * - Brand Header: Logo + "Career Odyssey" + "Build Your Future" (h-14)
 * - User Progress Card: Compact avatar, name, level, 72% progress bar, streak & badges (~85px)
 * - Main Categorized Navigation (clean, compact padding):
 *   • OVERVIEW: Home
 *   • CAREER: Goal, Roadmap, Trajectory
 *   • BUILD SKILLS: Skills, DSA, Projects
 *   • PROOF: Resume, GitHub
 *   • OPPORTUNITIES: Applications, Jobs
 *   • INSIGHTS: Analytics
 * - Special AI Section: Compact ✨ AI Career Copilot Card
 * - Compact Bottom Footer:
 *   • Module Hub shortcut
 *   • Quick icon actions: Settings, Profile, Collapse Toggle, Sign Out
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import BrandLogo from '../common/BrandLogo';

import NavigationItem from './Sidebar/NavigationItem';
import SectionHeader from './Sidebar/SectionHeader';
import UserProgressCard from './Sidebar/UserProgressCard';
import AICopilotCard from './Sidebar/AICopilotCard';

/* ── Modern crisp SVG icon set ───────────────────────────────── */
const SVGIcon = ({ children, size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {children}
  </svg>
);

const ICONS = {
  home: () => (
    <SVGIcon size={16}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </SVGIcon>
  ),
  goal: () => (
    <SVGIcon size={16}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </SVGIcon>
  ),
  roadmap: () => (
    <SVGIcon size={16}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </SVGIcon>
  ),
  trajectory: () => (
    <SVGIcon size={16}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </SVGIcon>
  ),
  skills: () => (
    <SVGIcon size={16}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
    </SVGIcon>
  ),
  dsa: () => (
    <SVGIcon size={16}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </SVGIcon>
  ),
  projects: () => (
    <SVGIcon size={16}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
      <path d="M15 12v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
    </SVGIcon>
  ),
  resume: () => (
    <SVGIcon size={16}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </SVGIcon>
  ),
  github: () => (
    <SVGIcon size={16}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
    </SVGIcon>
  ),
  applications: () => (
    <SVGIcon size={16}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </SVGIcon>
  ),
  jobs: () => (
    <SVGIcon size={16}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SVGIcon>
  ),
  analytics: () => (
    <SVGIcon size={16}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </SVGIcon>
  ),
  hub: () => (
    <SVGIcon size={15}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </SVGIcon>
  ),
  settings: () => (
    <SVGIcon size={16}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </SVGIcon>
  ),
  profile: () => (
    <SVGIcon size={16}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SVGIcon>
  ),
  collapse: () => (
    <SVGIcon size={16}>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </SVGIcon>
  ),
  expand: () => (
    <SVGIcon size={16}>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </SVGIcon>
  ),
};

/* ── Categorized Navigation Mapping ──────────────────────────── */
const NAVIGATION_CATEGORIES = [
  {
    category: 'OVERVIEW',
    items: [
      {
        id: 'command-center',
        label: 'Home',
        path: ROUTES.STUDENT_COMMAND_CENTER,
        icon: ICONS.home,
        isPrimary: true,
      },
    ],
  },
  {
    category: 'CAREER',
    items: [
      { id: 'career-goal', label: 'Career Goal', path: ROUTES.STUDENT_CAREER_GOAL, icon: ICONS.goal },
      { id: 'roadmap',     label: 'Roadmap',     path: ROUTES.STUDENT_ROADMAP,     icon: ICONS.roadmap },
      { id: 'trajectory',  label: 'Trajectory',  path: ROUTES.STUDENT_CAREER_TRAJECTORY, icon: ICONS.trajectory },
    ],
  },
  {
    category: 'BUILD SKILLS',
    items: [
      { id: 'skills',      label: 'Skills',      path: ROUTES.STUDENT_SKILLS,      icon: ICONS.skills },
      { id: 'assessments', label: 'Assessments', path: ROUTES.STUDENT_ASSESSMENTS, icon: ICONS.dsa },
      { id: 'dsa',         label: 'DSA',         path: ROUTES.STUDENT_DSA,         icon: ICONS.dsa },
      { id: 'projects',    label: 'Projects',    path: ROUTES.STUDENT_PROJECTS,    icon: ICONS.projects },
    ],
  },
  {
    category: 'PROOF',
    items: [
      { id: 'resume', label: 'Resume', path: ROUTES.STUDENT_RESUME, icon: ICONS.resume },
      { id: 'github', label: 'GitHub', path: ROUTES.STUDENT_GITHUB, icon: ICONS.github },
    ],
  },
  {
    category: 'OPPORTUNITIES',
    items: [
      {
        id: 'internships',
        label: 'Internships',
        path: ROUTES.STUDENT_INTERNSHIPS,
        icon: ICONS.jobs,
      },
      {
        id: 'applications',
        label: 'Applications',
        path: ROUTES.STUDENT_APPLICATIONS,
        icon: ICONS.applications,
      },
      {
        id: 'opportunities',
        label: 'Jobs',
        path: ROUTES.STUDENT_OPPORTUNITIES,
        icon: ICONS.jobs,
      },
    ],
  },
  {
    category: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics', path: ROUTES.STUDENT_ANALYTICS, icon: ICONS.analytics },
    ],
  },
];

/* ── Sidebar Internal Body ───────────────────────────────────── */
function SidebarBody({ isCollapsed, onToggleCollapse, onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-[#090a0f] border-r border-white/[0.07] select-none text-zinc-300">
      {/* ── 1. Top Section: Brand Header ── */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3.5'} h-14 shrink-0 border-b border-white/[0.06]`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo size="xs" showText={false} linkTo={ROUTES.STUDENT_COMMAND_CENTER} />
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-[13px] font-black tracking-tight text-white flex items-center gap-1.5 truncate leading-tight">
                Career{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#FF5100] via-[#FF7A00] to-[#FFA726] bg-clip-text text-transparent">
                  Odyssey
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
              </span>
              <p className="text-[10px] font-medium text-orange-400/90 leading-tight mt-0.5">
                Build your future
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseMobile && !isCollapsed && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 2. Main Navigation (Scrollable with subtle scrollbar) ── */}
      <nav
        className="flex-1 py-2 overflow-y-auto space-y-2.5 custom-sidebar-scroll"
        aria-label="Student Navigation"
      >
        {NAVIGATION_CATEGORIES.map((cat) => (
          <div key={cat.category}>
            <SectionHeader label={cat.category} isCollapsed={isCollapsed} />
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                  onClick={onCloseMobile}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── 3. Special AI Section: Career Copilot Card ── */}
        <div className="pt-1">
          <SectionHeader label="AI COPILOT" isCollapsed={isCollapsed} />
          <AICopilotCard isCollapsed={isCollapsed} onClick={onCloseMobile} />
        </div>
      </nav>

      {/* ── 4. Bottom Utility Toolbar (Settings, Profile, Collapse) ── */}
      <div className="shrink-0 border-t border-white/[0.06] p-2 bg-black/25">
        <div className={`flex ${isCollapsed ? 'flex-col gap-1.5' : 'items-center justify-around'} py-1`}>
          <NavLink
            to={ROUTES.STUDENT_SETTINGS}
            onClick={onCloseMobile}
            title="Settings"
            className={({ isActive }) =>
              `w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'text-orange-400 bg-orange-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <ICONS.settings />
          </NavLink>

          <NavLink
            to={ROUTES.STUDENT_PROFILE}
            onClick={onCloseMobile}
            title="Profile"
            className={({ isActive }) =>
              `w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'text-orange-400 bg-orange-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <ICONS.profile />
          </NavLink>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="w-9 h-9 rounded-xl hidden md:flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ICONS.expand /> : <ICONS.collapse />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Exported Sidebar Component ───────────────────────────────── */
export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 ease-in-out z-20 ${
          isCollapsed ? 'w-[72px]' : 'w-[250px]'
        }`}
      >
        <SidebarBody
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#090a0f] shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarBody
          isCollapsed={false}
          onCloseMobile={onCloseMobile}
        />
      </aside>
    </>
  );
}