/**
 * DashboardLayout — the root shell for all authenticated student views.
 *
 * Structure:
 *   ┌──────────────────────────────────────────────┐
 *   │  Sidebar (fixed desktop, drawer on mobile)   │
 *   │  ┌────────────────────────────────────────┐  │
 *   │  │  Navbar (sticky top + mobile toggler)  │  │
 *   │  ├────────────────────────────────────────┤  │
 *   │  │  <Outlet /> — page content (scrolls)   │  │
 *   │  └────────────────────────────────────────┘  │
 *   └──────────────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

/* Map route paths → human-readable page titles */
const PAGE_TITLES = {
  '/student/command-center': 'Career Command Center',
  '/student/dashboard':     'Overview / Module Hub',
  '/student/career-goal':   'Career Goal',
  '/student/roadmap':       'Roadmap',
  '/student/skills':        'My Skills',
  '/student/skill-gap':     'Skill Gap',
  '/student/dsa':           'DSA Tracker',
  '/student/projects':      'Projects Portfolio',
  '/student/github':        'GitHub Evidence',
  '/student/resume':        'Resume Analyzer',
  '/student/opportunities': 'Opportunities',
  '/student/applications':  'Applications Pipeline',
  '/student/analytics':     'Career Analytics',
  '/student/reminders':     'Reminders & Planner',
  '/student/copilot':       'Career Copilot',
  '/student/career-intelligence': 'Career Intelligence',
  '/student/execution':     'Career Execution OS',
  '/student/adaptive-plan': 'Adaptive Plan',
  '/student/career-trajectory': 'Career Trajectory',
  '/student/profile':       'Student Profile',
  '/student/settings':      'Settings',
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('career_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('career_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  // Automatically close mobile drawer upon route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#08090d] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar with collapse & mobile drawer support */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          title={title}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />

        {/* Scrollable content area with graceful lazy-loading fallback */}
        <main className="flex-1 overflow-y-auto">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh] p-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-500 font-medium tracking-wide">Loading module...</span>
                </div>
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}