/**
 * constants.js — Application-wide constants.
 * Single source of truth for API base URL, role strings, and route paths.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ROLES = {
  STUDENT:           'student',
  ACADEMIA:          'academician', // canonical primary role alias
  ACADEMICIAN:       'academician',
  INSTITUTION_ADMIN: 'institution_admin',
  INSTITUTION:       'institution', // legacy alias for institution_admin
  INDUSTRY:          'industry',
  ADMIN:             'super_admin',
  SUPER_ADMIN:       'super_admin',
};

export const ROUTES = {
  LOGIN:    '/login',
  REGISTER: '/register',

  // Role Portals
  ACADEMIA_PORTAL:    '/academia',
  ACADEMICIAN_PORTAL: '/academician',
  INSTITUTION_PORTAL: '/institution',
  INDUSTRY_PORTAL:    '/industry',
  ADMIN_PORTAL:       '/admin',

  // Student routes — extended phase by phase
  STUDENT_COMMAND_CENTER: '/student/command-center',
  STUDENT_DASHBOARD:    '/student/dashboard',
  STUDENT_CAREER_SCORE: '/student/career-score',
  STUDENT_CAREER_GOAL:  '/student/career-goal',
  STUDENT_ROADMAP:      '/student/roadmap',
  STUDENT_SKILLS:       '/student/skills',
  STUDENT_ASSESSMENTS:  '/student/assessments',
  STUDENT_SKILL_GAP:    '/student/skill-gap',
  STUDENT_DSA:          '/student/dsa',
  STUDENT_PROJECTS:     '/student/projects',
  STUDENT_GITHUB:       '/student/github',
  STUDENT_RESUME:       '/student/resume',
  STUDENT_INTERNSHIPS:  '/student/internships',
  STUDENT_OPPORTUNITIES:'/student/opportunities',
  STUDENT_APPLICATIONS: '/student/applications',
  STUDENT_ANALYTICS:    '/student/analytics',
  STUDENT_REMINDERS:    '/student/reminders',
  STUDENT_COPILOT:      '/student/copilot',
  STUDENT_CAREER_INTELLIGENCE: '/student/career-intelligence',
  STUDENT_EXECUTION:    '/student/execution',
  STUDENT_ADAPTIVE_PLAN:'/student/adaptive-plan',
  STUDENT_CAREER_TRAJECTORY: '/student/career-trajectory',
  STUDENT_PROFILE:      '/student/profile',
  STUDENT_SETTINGS:     '/student/settings',
};

/**
 * Format an avatar URL to handle relative, full, data, and blob URLs.
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:') || avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:')) {
    return avatar;
  }
  return `${API_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
};