/**
 * StudentDashboard.jsx — Primary Student Executive Dashboard
 *
 * Route: /student/dashboard
 * Clean, modern, highly-polished SaaS interface with clear visual hierarchy:
 * 1. Header: Platform brand, Greeting, Career Goal
 * 2. 4 Key Metrics: Career Readiness (78/100), Verified Skills (11/18), Skill Gaps (3), Active Internships (4)
 * 3. DO THIS NEXT: Dominant action card (Complete DSA Assessment -> Start Now)
 * 4. Core Triad: Skill Profile | Top Skill Gaps | Recommended Internship
 * 5. Application Pipeline
 * 6. Weekly Progress & Quick Actions
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getToken } from '../../utils/storage';
import { API_URL, ROUTES } from '../../utils/constants';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [readinessScore, setReadinessScore] = useState(78);
  const [targetGoal, setTargetGoal] = useState('Software Engineer');
  const [applications, setApplications] = useState([]);
  const [recommendedInternship, setRecommendedInternship] = useState(null);

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Aarav';

  // Determine greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    let cancelled = false;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [profileRes, appRes, matchRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/skill-profile`, { headers }).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/api/applications`, { headers }).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/api/matching/internships?limit=1`, { headers }).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (cancelled) return;

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const p = profileRes.value.data;
          setProfile(p);
          if (p.targetRole) setTargetGoal(p.targetRole);
          if (p.overallReadiness) setReadinessScore(p.overallReadiness);
        }

        if (appRes.status === 'fulfilled' && appRes.value?.data) {
          setApplications(Array.isArray(appRes.value.data) ? appRes.value.data : []);
        }

        if (matchRes.status === 'fulfilled' && matchRes.value?.data?.matches?.length > 0) {
          setRecommendedInternship(matchRes.value.data.matches[0]);
        }
      } catch (err) {
        console.error('Error loading student dashboard telemetry:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Top skills to display
  const topSkills = [
    { name: 'EHR & Clinical Data Systems', level: 4, verified: true },
    { name: 'Python & Health Data Science', level: 4, verified: true },
    { name: 'Ayurveda Clinical Analytics', level: 3, verified: false },
    { name: 'React & Frontend Engineering', level: 3, verified: false },
  ];

  // Top Skill Gaps
  const topGaps = [
    { name: 'Data Structures & Algorithms', deficit: 38, priority: 'HIGH' },
    { name: 'HL7 / FHIR Clinical Interoperability', deficit: 25, priority: 'HIGH' },
    { name: 'Cloud Infrastructure & DevOps', deficit: 45, priority: 'MEDIUM' },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 p-4 sm:p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* ── 1. Executive Header ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Career Odyssey</span>
          <span className="w-1 h-1 rounded-full bg-zinc-600" />
          <span className="text-xs font-medium text-zinc-400">Student Operating System</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {studentFirstName}!
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-zinc-400">Career goal:</span>
              <Link
                to={ROUTES.STUDENT_CAREER_GOAL}
                className="text-sm font-semibold text-white hover:text-orange-400 transition-colors flex items-center gap-1 group"
              >
                <span>{targetGoal}</span>
                <span className="text-zinc-500 group-hover:text-orange-400 text-xs transition-colors">✎</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.STUDENT_COPILOT}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
            >
              Ask Copilot
            </Link>
            <Link
              to={ROUTES.STUDENT_ROADMAP}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/20 transition-all"
            >
              View Roadmap →
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Four Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 py-4">
        {/* Metric 1: Career Readiness */}
        <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors border border-transparent">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Career Readiness</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-white">{readinessScore}</span>
            <span className="text-sm font-medium text-zinc-400">/ 100</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Verified Skills */}
        <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors border border-transparent">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Verified Skills</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">11</span>
            <span className="text-sm font-medium text-zinc-400">/ 18</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Official institutional badge
          </p>
        </div>

        {/* Metric 3: Skill Gaps */}
        <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors border border-transparent">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Skill Gaps</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400">3</span>
            <span className="text-sm font-medium text-zinc-400">critical</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-3">2 benchmarks recommended</p>
        </div>

        {/* Metric 4: Active Internships */}
        <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors border border-transparent">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Internships</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-purple-400">4</span>
            <span className="text-sm font-medium text-zinc-400">openings</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-3">High explainable fit</p>
        </div>
      </div>

      {/* ── 3. Dominant Action Card: DO THIS NEXT ── */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#141926] via-[#10141f] to-[#0c0f18] shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              DO THIS NEXT
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Complete DSA Assessment
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Your target role requires verified Data Structures & Algorithms proficiency. Complete this 30-minute objective evaluation to boost your readiness score and qualify for tier-1 recruiter shortlists.
            </p>
          </div>

          <button
            onClick={() => navigate(ROUTES.STUDENT_ASSESSMENTS)}
            className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Now</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* ── 4. Core Intelligence Triad: Skill Profile | Top Skill Gaps | Recommended Internship ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triad Column 1: Skill Profile */}
        <div className="p-6 rounded-2xl bg-white/[0.015] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Skill Profile</h3>
            <Link
              to={ROUTES.STUDENT_SKILLS}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {topSkills.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-medium text-zinc-200 truncate">{s.name}</p>
                  <p className="text-[10px] text-zinc-400">
                    {s.verified ? 'Institutional Verified' : 'Self-declared / Assessment'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-zinc-300">
                    Lvl {s.level}
                  </span>
                  {s.verified && (
                    <span className="text-xs" title="Verified by Faculty">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Triad Column 2: Top Skill Gaps */}
        <div className="p-6 rounded-2xl bg-white/[0.015] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Top Skill Gaps</h3>
            <Link
              to={ROUTES.STUDENT_SKILL_GAP}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Full Analysis →
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {topGaps.map((g, idx) => (
              <div key={idx} className="py-2 border-b border-white/[0.04] last:border-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200 truncate">{g.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-amber-400 bg-amber-500/10">
                    {g.deficit}% gap
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="bg-amber-400/80 h-full rounded-full" style={{ width: `${g.deficit}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Triad Column 3: Recommended Internship */}
        <div className="p-6 rounded-2xl bg-white/[0.015] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">Recommended Internship</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                86% Match
              </span>
            </div>

            <div className="pt-3 space-y-1.5">
              <h4 className="text-sm font-bold text-white">
                {recommendedInternship?.title || 'Ayush Clinical Informatics Intern'}
              </h4>
              <p className="text-xs text-zinc-400">
                {recommendedInternship?.company || 'Ayush HealthTech Solutions Pvt Ltd'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-300">EHR FHIR</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-300">Python</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-300">Hybrid</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(ROUTES.STUDENT_INTERNSHIPS)}
            className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Review Explainable Match & Apply →
          </button>
        </div>
      </div>

      {/* ── 5. Application Pipeline ── */}
      <div className="p-6 rounded-2xl bg-white/[0.015] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Application Pipeline</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Live recruitment funnel tracking across active submissions</p>
          </div>
          <Link
            to={ROUTES.STUDENT_APPLICATIONS}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Manage Funnel →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Funnel Stage 1 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Applied</span>
              <span className="text-xs font-bold text-zinc-400">2</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Dabur Analytics, MedTech Hub</p>
          </div>

          {/* Funnel Stage 2 */}
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Interview</span>
              <span className="text-xs font-bold text-orange-400">1</span>
            </div>
            <p className="text-[11px] text-zinc-200 mt-2 font-medium">Ayush HealthTech Solutions</p>
            <p className="text-[10px] text-orange-400 mt-0.5">Technical Defense Scheduled</p>
          </div>

          {/* Funnel Stage 3 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Offer</span>
              <span className="text-xs font-bold text-emerald-400">1</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Junior Clinical Data Scientist (₹8.5 LPA)</p>
          </div>
        </div>
      </div>

      {/* ── 6. Weekly Progress & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Weekly Progress */}
        <div className="p-6 rounded-2xl bg-white/[0.015] space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Weekly Progress</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You completed <strong className="text-zinc-200">5 out of 7 milestones</strong> this week. Keep up the consistency to stay on track for your semester placement cycle.
          </p>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center">
                <div
                  className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i < 5 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/[0.03] text-zinc-600'
                  }`}
                >
                  {i < 5 ? '✓' : '—'}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl bg-white/[0.015] space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              to={ROUTES.STUDENT_ASSESSMENTS}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs font-semibold text-zinc-200 block"
            >
              📝 Take Assessment
            </Link>
            <Link
              to={ROUTES.STUDENT_INTERNSHIPS}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs font-semibold text-zinc-200 block"
            >
              🎯 Explore Internships
            </Link>
            <Link
              to={ROUTES.STUDENT_RESUME}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs font-semibold text-zinc-200 block"
            >
              📄 Optimize Resume
            </Link>
            <Link
              to={ROUTES.STUDENT_COPILOT}
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs font-semibold text-zinc-200 block"
            >
              ✨ Ask Career Copilot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}