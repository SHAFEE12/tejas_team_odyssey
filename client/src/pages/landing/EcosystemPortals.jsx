import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function EcosystemPortals({ onRegister }) {
  const [activeTab, setActiveTab] = useState('student');
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const portals = [
    {
      id: 'student',
      title: 'Student & Job Seeker',
      tagline: 'Self-Discovery, Skill Mastery & Career Trajectory',
      desc: 'Discover fitting career directions, pinpoint skill differentials against industry requisitions, audit resumes against ATS criteria, and follow structured milestones.',
      cta: 'Launch Student Portal',
      role: 'student',
      highlights: [
        'Personalized Career Compass',
        'Diagnostic Skill Gap Analysis',
        'ATS Resume Diagnostics',
        'Adaptive Mock Interview Practice'
      ]
    },
    {
      id: 'academician',
      title: 'Academician & Mentor',
      tagline: 'Curriculum Realignment & Research Mentorship',
      desc: 'Bridge classroom syllabi with current industry demand vectors. Monitor cohort learning sprints, mentor research capstones, and endorse student achievements.',
      cta: 'Launch Academician Portal',
      role: 'academician',
      highlights: [
        'Curriculum-to-Market Mapping',
        'Cohort Skill Gap Dashboard',
        'Student Capstone Telemetry',
        'Verified Faculty Endorsements'
      ]
    },
    {
      id: 'institution',
      title: 'Institution & University',
      tagline: 'Cohort Readiness & Placement Governance',
      desc: 'Institutional command center providing department-wide employability indices, recruiter engagement tracking, and accredited outcome reporting.',
      cta: 'Launch Institution Portal',
      role: 'institution',
      highlights: [
        'Cohort Employability Analytics',
        'Placement Readiness Dashboard',
        'Corporate Relationship Management',
        'Institutional Outcome Telemetry'
      ]
    },
    {
      id: 'industry',
      title: 'Industry & Employer',
      tagline: 'Precision Sourcing & Competency Mapping',
      desc: 'Publish requisitions directly into university pipelines. Discover pre-assessed candidates with demonstrated project execution and verified competency scores.',
      cta: 'Launch Industry Portal',
      role: 'industry',
      highlights: [
        'Competency Requisition Mapping',
        'Verified Talent Pipeline',
        'Direct Candidate Fast-Track',
        'Campus Placement Partnerships'
      ]
    }
  ];

  const current = portals.find((p) => p.id === activeTab) || portals[0];

  return (
    <section
      id="ecosystem"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-16 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Multi-Stakeholder Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Four roles unified in{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              one ecosystem.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Select your role to explore dedicated capabilities, specialized dashboards, and reciprocal connections.
          </p>

          {/* Interactive Role Tabs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {portals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeTab === p.id
                    ? 'bg-[#18181d] text-[#fc8200] border-[#fc8200]/40 shadow-lg shadow-[#fc8200]/10'
                    : 'bg-[#131415] text-zinc-400 border-white/5 hover:text-white hover:border-white/15'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Portal Card */}
        <div
          className={`max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#131415] p-8 sm:p-12 shadow-2xl transition-all duration-700 delay-150 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="pb-6 border-b border-white/10">
            <span className="text-xs font-mono uppercase text-[#fc8200] font-semibold">
              PORTAL OVERVIEW
            </span>
            <h3 className="text-2xl font-bold text-white mt-1">{current.title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{current.tagline}</p>
          </div>

          <div className="py-6 space-y-6">
            <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
              {current.desc}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {current.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <span className="material-symbols-outlined text-[#fc8200] text-sm shrink-0">
                    check_circle
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onRegister && onRegister(current.role)}
              className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#fc8200] to-[#ff4d00] hover:from-[#ff9326] hover:to-[#ff5e1a] shadow-lg shadow-[#fc8200]/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>{current.cta}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <span className="text-xs font-mono text-zinc-500">
              *Instant role-calibrated access
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}