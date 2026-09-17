/**
 * Projects.jsx — /student/projects
 *
 * Personalized Projects & Portfolio Module for Career Odyssey.
 *
 * Integrates:
 * Career Goal + Skill Gap + Roadmap + My Skills + GitHub + Resume
 *
 * Features:
 * - Deterministic Project Recommendations with Career Relevance Scoring (0–100)
 * - My Projects Portfolio Management with Milestone Checklists
 * - GitHub Repository Linking & Live Deployment URLs
 * - Structured Resume Bullet Point Generator (Action + Tech + Impact)
 * - Portfolio Quality Indicator (0–100)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getProjects,
  getProjectRecommendations,
  createProject,
  updateProject,
  updateMilestoneStatus,
  deleteProject,
  connectGithubRepo,
  disconnectGithubRepo,
  updateDeployment,
} from '../../api/projects.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icon primitive ───────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  projects:  ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  target:    ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
  gap:       ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  roadmap:   ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  check:     'M20 6L9 17l-5-5',
  alert:     ['M12 9v2m0 4h.01', 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'],
  github:    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  external:  ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6', 'M10 14L21 3'],
  search:    ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  close:     ['M18 6L6 18', 'M6 6l12 12'],
  copy:      ['M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z', 'M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2'],
  plus:      ['M12 5v14', 'M5 12h14'],
  trash:     ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2'],
  sparkles:  ['M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z'],
  arrow:     'M5 12h14M12 5l7 7-7 7',
};

/* ── Badges ──────────────────────────────────────────────────── */
function getDifficultyBadge(diff) {
  switch (diff) {
    case 'ADVANCED':
      return { label: 'Advanced', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    case 'INTERMEDIATE':
      return { label: 'Intermediate', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    case 'BEGINNER':
    default:
      return { label: 'Beginner', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' };
    case 'ARCHIVED':
      return { label: 'Archived', badge: 'bg-zinc-700/40 text-zinc-400 border-zinc-700', dot: 'bg-zinc-500' };
    case 'PLANNED':
    default:
      return { label: 'Planned', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700', dot: 'bg-zinc-400' };
  }
}

export default function Projects() {
  const [activeMainTab, setActiveMainTab] = useState('RECOMMENDED'); // 'RECOMMENDED' or 'MY_PROJECTS'
  const [projectsData, setProjectsData] = useState({ projects: [], summary: {} });
  const [recommendationsData, setRecommendationsData] = useState({ recommendations: [], targetRole: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Modals & Details State
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [selectedMyProject, setSelectedMyProject] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);

  // Forms in Project Modal
  const [githubInput, setGithubInput] = useState('');
  const [deploymentInput, setDeploymentInput] = useState('');
  const [customForm, setCustomForm] = useState({ title: '', description: '', skills: '', difficulty: 'INTERMEDIATE' });

  // Filters
  const [recFilter, setRecFilter] = useState('ALL');
  const [myFilter, setMyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [projRes, recRes] = await Promise.all([
        getProjects(),
        getProjectRecommendations(),
      ]);

      if (projRes?.success && projRes?.data) {
        setProjectsData(projRes.data);
      }
      if (recRes?.success && recRes?.data) {
        setRecommendationsData(recRes.data);
      }
    } catch (err) {
      console.error('Error loading projects data:', err);
      setError(err.message || 'Unable to load project recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Blueprint to My Projects
  const handleAddBlueprint = async (blueprintId, e) => {
    if (e) e.stopPropagation();
    setAddingId(blueprintId);
    try {
      const res = await createProject({ blueprintId });
      if (res?.success) {
        await loadData(true);
        if (selectedBlueprint) setSelectedBlueprint(null);
        setActiveMainTab('MY_PROJECTS');
      }
    } catch (err) {
      console.error('Error adding project:', err);
    } finally {
      setAddingId(null);
    }
  };

  // Handle Create Custom Project
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.title.trim()) return;

    try {
      const skillsArray = customForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createProject({
        title: customForm.title,
        description: customForm.description,
        difficulty: customForm.difficulty,
        skills: skillsArray,
      });

      if (res?.success) {
        await loadData(true);
        setShowCustomModal(false);
        setCustomForm({ title: '', description: '', skills: '', difficulty: 'INTERMEDIATE' });
        setActiveMainTab('MY_PROJECTS');
      }
    } catch (err) {
      console.error('Error creating custom project:', err);
    }
  };

  // Handle Milestone Toggle
  const handleToggleMilestone = async (projectId, milestoneId, currentStatus) => {
    const nextStatus =
      currentStatus === 'NOT_STARTED'
        ? 'IN_PROGRESS'
        : currentStatus === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'NOT_STARTED';

    try {
      const res = await updateMilestoneStatus(projectId, milestoneId, nextStatus);
      if (res?.success && res?.data) {
        setProjectsData((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p._id === projectId ? res.data : p)),
        }));
        if (selectedMyProject && selectedMyProject._id === projectId) {
          setSelectedMyProject(res.data);
        }
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  // Handle GitHub Connect
  const handleConnectGithub = async (projectId) => {
    if (!githubInput.trim()) return;
    try {
      const res = await connectGithubRepo(projectId, githubInput.trim());
      if (res?.success && res?.data) {
        setSelectedMyProject(res.data);
        setGithubInput('');
        loadData(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to connect GitHub repository.');
    }
  };

  // Handle GitHub Disconnect
  const handleDisconnectGithub = async (projectId) => {
    if (!window.confirm('Disconnect this GitHub repository?')) return;
    try {
      const res = await disconnectGithubRepo(projectId);
      if (res?.success && res?.data) {
        setSelectedMyProject(res.data);
        loadData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Deployment Update
  const handleUpdateDeployment = async (projectId) => {
    if (!deploymentInput.trim()) return;
    try {
      const res = await updateDeployment(projectId, deploymentInput.trim());
      if (res?.success && res?.data) {
        setSelectedMyProject(res.data);
        setDeploymentInput('');
        loadData(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to update deployment URL.');
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to remove this project from your portfolio?')) return;
    try {
      const res = await deleteProject(projectId);
      if (res?.success) {
        setSelectedMyProject(null);
        loadData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Copy Resume Bullets
  const handleCopyResumeBullets = (bullets) => {
    if (!bullets || bullets.length === 0) return;
    navigator.clipboard.writeText(bullets.join('\n'));
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  // Filtered Recommendations
  const filteredRecs = useMemo(() => {
    let list = recommendationsData.recommendations || [];

    if (recFilter === 'BEGINNER') list = list.filter((r) => r.difficulty === 'BEGINNER');
    else if (recFilter === 'INTERMEDIATE') list = list.filter((r) => r.difficulty === 'INTERMEDIATE');
    else if (recFilter === 'ADVANCED') list = list.filter((r) => r.difficulty === 'ADVANCED');
    else if (recFilter === 'FULL_STACK') list = list.filter((r) => r.type === 'FULL_STACK');
    else if (recFilter === 'FRONTEND') list = list.filter((r) => r.type === 'WEB');
    else if (recFilter === 'BACKEND') list = list.filter((r) => r.type === 'BACKEND');
    else if (recFilter === 'DATA') list = list.filter((r) => r.type === 'DATA' || r.type === 'MACHINE_LEARNING');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.shortDescription.toLowerCase().includes(q) ||
          r.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [recommendationsData, recFilter, searchQuery]);

  // Filtered My Projects
  const filteredMyProjects = useMemo(() => {
    let list = projectsData.projects || [];

    if (myFilter === 'PLANNED') list = list.filter((p) => p.status === 'PLANNED');
    else if (myFilter === 'IN_PROGRESS') list = list.filter((p) => p.status === 'IN_PROGRESS');
    else if (myFilter === 'COMPLETED') list = list.filter((p) => p.status === 'COMPLETED');
    else if (myFilter === 'ARCHIVED') list = list.filter((p) => p.status === 'ARCHIVED');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [projectsData, myFilter, searchQuery]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-[#FC8200] rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Synthesizing personalized project blueprints...</p>
      </div>
    );
  }

  // Error State
  if (error && projectsData.projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <Icon d={ICONS.alert} size={24} />
          </div>
          <h3 className="text-lg font-semibold text-rose-200 mb-2">Unable to Load Projects</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary } = projectsData;
  const targetRole = recommendationsData.targetRole || 'Software Engineer';

  return (
    <div className="max-w-6xl mx-auto py-7 px-4 sm:px-6 space-y-8">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Icon d={ICONS.projects} size={16} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Project Portfolio</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 border border-orange-500/25 text-orange-400">
              Curated Baseline v1.0
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Personalized engineering blueprints aligned with your target role{' '}
            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white font-semibold inline-flex items-center gap-1">
              <span>🎯</span> {targetRole}
            </span>
            , addressing verified Skill Gaps and Roadmap milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white font-bold text-xs transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:scale-[1.02] cursor-pointer"
          >
            <Icon d={ICONS.plus} size={14} />
            <span>Add Custom Project</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh recommendations"
          >
            <Icon d={ICONS.refresh} size={14} className={refreshing ? 'animate-spin text-orange-400' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Portfolio Overview Metrics ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Metric 1: My Projects */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950/80 border border-white/[0.08] border-t-2 border-t-zinc-500/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">My Projects</span>
            <span className="text-xs">📁</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {summary.totalProjects || 0}
          </p>
          <span className="text-xs text-zinc-500 mt-1">Total in portfolio</span>
        </div>

        {/* Metric 2: In Progress */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950/80 border border-white/[0.08] border-t-2 border-t-zinc-500/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">In Progress</span>
            <span className="text-xs">⚡</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {summary.inProgress || 0}
          </p>
          <span className="text-xs text-zinc-500 mt-1">Active milestones</span>
        </div>

        {/* Metric 3: Completed */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/20 via-[#0d0f17] to-zinc-950 border border-white/[0.08] border-t-2 border-t-emerald-500 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Completed</span>
            <span className="text-xs">✓</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tracking-tight">
            {summary.completed || 0}
          </p>
          <span className="text-xs text-zinc-500 mt-1">Verified complete</span>
        </div>

        {/* Metric 4: GitHub Linked */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950/80 border border-white/[0.08] border-t-2 border-t-zinc-500/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">GitHub Repos</span>
            <span className="text-xs">🐙</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {summary.githubLinked || 0}
          </p>
          <span className="text-xs text-zinc-500 mt-1">Code repositories</span>
        </div>

        {/* Metric 5: Quality Score */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950/80 border border-white/[0.08] border-t-2 border-t-zinc-500/50 shadow-lg flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Quality Score</span>
            <span className="text-xs">💎</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {summary.averageQualityScore || 0}%
          </p>
          <span className="text-xs text-zinc-500 mt-1">Portfolio quality</span>
        </div>
      </div>

      {/* ── Main Navigation Segmented Control ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] inline-flex items-center gap-1 h-10">
          <button
            type="button"
            onClick={() => setActiveMainTab('RECOMMENDED')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer h-8 ${
              activeMainTab === 'RECOMMENDED'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md shadow-orange-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon d={ICONS.sparkles} size={14} className={activeMainTab === 'RECOMMENDED' ? 'text-white' : 'text-orange-400'} />
            <span>Recommended Blueprints</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeMainTab === 'RECOMMENDED' ? 'bg-black/25 text-white' : 'bg-white/10 text-zinc-300'
            }`}>
              {recommendationsData.recommendations?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('MY_PROJECTS')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer h-8 ${
              activeMainTab === 'MY_PROJECTS'
                ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md shadow-orange-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon d={ICONS.projects} size={14} />
            <span>My Projects</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeMainTab === 'MY_PROJECTS' ? 'bg-black/25 text-white' : 'bg-white/10 text-zinc-300'
            }`}>
              {projectsData.projects?.length || 0}
            </span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-64 h-10 flex items-center">
          <Icon d={ICONS.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={activeMainTab === 'RECOMMENDED' ? 'Search blueprints, skills...' : 'Search my projects...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-8.5 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/25 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <Icon d={ICONS.close} size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION 1: RECOMMENDED PROJECTS ───────────────────────── */}
      {activeMainTab === 'RECOMMENDED' && (
        <div className="space-y-5">
          <h2 className="sr-only">Recommended Project Blueprints</h2>
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: 'All Blueprints' },
              { id: 'FULL_STACK', label: 'Full Stack' },
              { id: 'FRONTEND', label: 'Frontend' },
              { id: 'BACKEND', label: 'Backend' },
              { id: 'DATA', label: 'Data & ML' },
              { id: 'BEGINNER', label: 'Beginner' },
              { id: 'INTERMEDIATE', label: 'Intermediate' },
              { id: 'ADVANCED', label: 'Advanced' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRecFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  recFilter === tab.id
                    ? 'bg-orange-500/15 border border-orange-500/35 text-orange-400 shadow-sm'
                    : 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Blueprint Cards Grid */}
          {filteredRecs.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-300">No project blueprints found</p>
              <p className="text-xs text-zinc-500">Try clearing the search query or adjusting your role/difficulty filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecs.map((rec) => {
                const diffTheme = getDifficultyBadge(rec.difficulty);
                const isAdding = addingId === rec.blueprintId;

                return (
                  <div
                    key={rec.blueprintId}
                    onClick={() => setSelectedBlueprint(rec)}
                    className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 border border-white/[0.08] hover:border-orange-500/35 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${diffTheme.badge}`}>
                            {diffTheme.label}
                          </span>
                          <span className="text-xs font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
                            {rec.category}
                          </span>
                        </div>

                        {/* Career Relevance Score */}
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold shrink-0 font-mono">
                          <Icon d={ICONS.sparkles} size={11} />
                          <span>{rec.relevanceScore}% Match</span>
                        </div>
                      </div>

                      {/* Title & Short Description */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                          {rec.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {rec.shortDescription}
                        </p>
                      </div>

                      {/* Why Recommended Callout */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-xs text-zinc-300 leading-snug flex items-start gap-2">
                        <span className="text-amber-400 shrink-0">💡</span>
                        <p>
                          <strong className="text-amber-300 font-semibold">Why recommended:</strong> {rec.whyRecommended}
                        </p>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {rec.requiredSkills.map((skill) => {
                          const isGap = rec.skillsAddressed.includes(skill);
                          return (
                            <span
                              key={skill}
                              className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                                isGap
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold'
                                  : 'bg-white/[0.04] text-zinc-300 border-white/10'
                              }`}
                            >
                              {skill} {isGap && '★'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
                        <span>📋 {rec.milestones?.length || 0} Milestones</span>
                        <span>·</span>
                        <span>⏱ {rec.estimatedEffort}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {rec.isAlreadyAdded ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/25 flex items-center gap-1">
                            <span>✓</span> In My Projects
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleAddBlueprint(rec.blueprintId, e)}
                            disabled={isAdding}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            {isAdding ? 'Adding...' : 'Add to My Projects →'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: MY PROJECTS PORTFOLIO ──────────────────────── */}
      {activeMainTab === 'MY_PROJECTS' && (
        <div className="space-y-5">
          <h2 className="sr-only">My Active Projects</h2>
          {/* Controls Bar: Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'ARCHIVED', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMyFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  myFilter === tab.id
                    ? 'bg-orange-500/15 border border-orange-500/35 text-orange-400 shadow-sm'
                    : 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredMyProjects.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
              <Icon d={ICONS.projects} size={36} className="mx-auto text-zinc-600" />
              <h3 className="text-base font-bold text-white">No Projects in this view</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Explore recommended project blueprints matched to your target role or add a custom project to your portfolio.
              </p>
              <button
                type="button"
                onClick={() => setActiveMainTab('RECOMMENDED')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 cursor-pointer"
              >
                Browse Recommended Blueprints
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyProjects.map((project) => {
                const statusTheme = getStatusBadge(project.status);
                const diffTheme = getDifficultyBadge(project.difficulty);
                const completedMilestones = project.milestones?.filter((m) => m.status === 'COMPLETED').length || 0;
                const totalMilestones = project.milestones?.length || 0;

                return (
                  <div
                    key={project._id}
                    onClick={() => setSelectedMyProject(project)}
                    className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] via-[#0d0f17] to-zinc-950 border border-white/[0.08] hover:border-orange-500/35 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusTheme.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`} />
                            {statusTheme.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${diffTheme.badge}`}>
                            {diffTheme.label}
                          </span>
                        </div>

                        {/* Portfolio Quality Score */}
                        <span className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full font-mono">
                          {project.qualityScore || 0}% Quality
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                          {project.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {project.shortDescription || project.description || 'Custom project portfolio item.'}
                        </p>
                      </div>

                      {/* Progress Bar & Milestones Count */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Milestone Progress</span>
                          <span className="font-bold text-white">
                            {completedMilestones} / {totalMilestones} ({project.progress}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex">
                          <div
                            style={{ width: `${project.progress}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#f97316] transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Evidence Indicators */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {project.github?.url ? (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/25 flex items-center gap-1.5 font-medium">
                            <Icon d={ICONS.github} size={12} />
                            <span>GitHub Linked</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.02] text-zinc-500 border border-white/5">
                            No GitHub Linked
                          </span>
                        )}

                        {project.deployment?.url && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5 font-medium">
                            <Icon d={ICONS.external} size={12} />
                            <span>Live Deployment</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-orange-400 font-bold text-xs group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Manage Project</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Evidence Sources Footer ───────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] to-zinc-950 border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Connected Portfolio Systems</span>
          </h4>
          <span className="text-xs text-zinc-400">
            Target Role: <strong className="text-white font-semibold">{targetRole}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
            <Icon d={ICONS.gap} size={15} className="text-orange-400" />
            <span className="text-zinc-300 font-medium">Skill Gap Informed</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
            <Icon d={ICONS.roadmap} size={15} className="text-orange-400" />
            <span className="text-zinc-300 font-medium">Roadmap Synchronized</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
            <Icon d={ICONS.github} size={15} className="text-sky-400" />
            <span className="text-zinc-300 font-medium">Public GitHub Verified</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
            <Icon d={ICONS.check} size={15} className="text-emerald-400" />
            <span className="text-zinc-300 font-medium">Resume-Ready Export</span>
          </div>
        </div>
      </div>

      {/* ── Journey Next Steps Card ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/20 via-[#0f121d] to-[#0d101a] border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
            Next In Your Career Journey
          </span>
          <h4 className="text-sm font-bold text-white">Validate Project Evidence in Your Resume & Public Repositories</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Now that you have structured proof-of-work, ensure these technical projects are indexed in your resume for ATS screening and synchronized with your authentic GitHub activity.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to={ROUTES.STUDENT_RESUME}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#fb923c] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 flex items-center gap-1.5"
          >
            <span>Analyze Resume</span>
            <Icon d={ICONS.arrow} size={12} />
          </Link>
          <Link
            to={ROUTES.STUDENT_GITHUB}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
          >
            Connect GitHub
          </Link>
        </div>
      </div>

      {/* ── MODAL 1: RECOMMENDED BLUEPRINT DETAILS ────────────────── */}
      {selectedBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl p-6 rounded-2xl bg-[#0b0d13] border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyBadge(selectedBlueprint.difficulty).badge}`}>
                    {getDifficultyBadge(selectedBlueprint.difficulty).label}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">{selectedBlueprint.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedBlueprint.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBlueprint(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {/* Description & Objectives */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Project Description
                </h5>
                <p className="text-zinc-200 leading-relaxed">{selectedBlueprint.description}</p>
              </div>

              {/* Milestones Preview */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Project Milestones ({selectedBlueprint.milestones?.length || 0})
                </h5>
                <ul className="space-y-2">
                  {selectedBlueprint.milestones?.map((m) => (
                    <li key={m.milestoneId} className="flex items-start gap-2.5 text-zinc-300">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {m.order}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{m.title}</p>
                        <p className="text-zinc-400 text-[11px]">{m.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills Breakdown */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Technologies Practiced
                </h5>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedBlueprint.requiredSkills.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-zinc-200 text-[11px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBlueprint(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleAddBlueprint(selectedBlueprint.blueprintId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 cursor-pointer"
              >
                Add to My Projects
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MY PROJECT MANAGEMENT & EVIDENCE ─────────────── */}
      {selectedMyProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl p-6 rounded-2xl bg-[#0b0d13] border border-white/10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedMyProject.status).badge}`}>
                    {getStatusBadge(selectedMyProject.status).label}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">{selectedMyProject.type}</span>
                  <span className="text-[11px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full font-mono">
                    {selectedMyProject.qualityScore || 0}% Portfolio Quality
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedMyProject.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMyProject(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Project Milestones ({selectedMyProject.progress}% complete)
                </h5>
                <span className="text-[11px] text-zinc-500">Click checkbox to cycle status</span>
              </div>

              <div className="space-y-2">
                {selectedMyProject.milestones?.map((milestone) => {
                  const isDone = milestone.status === 'COMPLETED';
                  const isInProg = milestone.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={milestone.milestoneId}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        isDone
                          ? 'bg-zinc-950/40 border-white/[0.06] opacity-80'
                          : isInProg
                          ? 'bg-amber-500/[0.04] border-amber-500/25'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleMilestone(selectedMyProject._id, milestone.milestoneId, milestone.status)
                        }
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : isInProg
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-700 text-transparent hover:border-zinc-500'
                        }`}
                      >
                        {isDone ? <Icon d={ICONS.check} size={12} /> : isInProg ? <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> : null}
                      </button>

                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
                            {milestone.title}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-medium capitalize">{milestone.status.replace('_', ' ')}</span>
                        </div>
                        {milestone.description && <p className="text-zinc-400 mt-0.5 leading-relaxed">{milestone.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GitHub & Deployment Connections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* GitHub Link Form */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Icon d={ICONS.github} size={14} className="text-sky-400" />
                    GitHub Repository
                  </span>
                  {selectedMyProject.github?.url && (
                    <button
                      type="button"
                      onClick={() => handleDisconnectGithub(selectedMyProject._id)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {selectedMyProject.github?.url ? (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-300 truncate font-mono text-[11px]">
                      {selectedMyProject.github.repoName || selectedMyProject.github.url}
                    </span>
                    <a
                      href={selectedMyProject.github.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 ml-2"
                    >
                      <Icon d={ICONS.external} size={13} />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="https://github.com/user/repo"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleConnectGithub(selectedMyProject._id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
                    >
                      Link
                    </button>
                  </div>
                )}
              </div>

              {/* Deployment Link Form */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Icon d={ICONS.external} size={14} className="text-emerald-400" />
                  Live Deployment
                </span>

                {selectedMyProject.deployment?.url ? (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-300 truncate font-mono text-[11px]">
                      {selectedMyProject.deployment.url}
                    </span>
                    <a
                      href={selectedMyProject.deployment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 ml-2"
                    >
                      <Icon d={ICONS.external} size={13} />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="https://my-app.vercel.app"
                      value={deploymentInput}
                      onChange={(e) => setDeploymentInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateDeployment(selectedMyProject._id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Resume Bullets Generator */}
            {selectedMyProject.resumeData?.bulletPoints?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Icon d={ICONS.check} size={14} />
                    Resume-Ready Bullet Points
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyResumeBullets(selectedMyProject.resumeData.bulletPoints)}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 cursor-pointer"
                  >
                    <Icon d={ICONS.copy} size={12} />
                    <span>{copiedResume ? 'Copied ✓' : 'Copy All'}</span>
                  </button>
                </div>

                <ul className="space-y-1.5 text-zinc-300">
                  {selectedMyProject.resumeData.bulletPoints.map((bp, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions & Delete */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteProject(selectedMyProject._id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                <Icon d={ICONS.trash} size={13} />
                <span>Remove Project</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMyProject(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADD CUSTOM PROJECT FORM ──────────────────────── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#0b0d13] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Add Custom Project</h3>
                <p className="text-xs text-zinc-400">Track a personal project not in our curated blueprints.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Key-Value Store"
                  value={customForm.title}
                  onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of architectural highlights..."
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Technologies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Redis, Docker"
                  value={customForm.skills}
                  onChange={(e) => setCustomForm({ ...customForm, skills: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Difficulty</label>
                <select
                  value={customForm.difficulty}
                  onChange={(e) => setCustomForm({ ...customForm, difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold shadow-md shadow-orange-500/25 cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}