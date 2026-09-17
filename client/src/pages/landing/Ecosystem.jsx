import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function Ecosystem({ onRegister }) {
  const [activeRole, setActiveRole] = useState('student');
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const roles = [
    {
      id: 'student',
      title: 'Student & Job Seeker',
      icon: 'school',
      tagline: 'Self-Discovery, Skill Mastery & Career Roadmaps',
      description:
        'Discover suitable career directions, pinpoint skill differentials against industry requisitions, audit resumes against ATS criteria, and follow structured milestones.',
      cta: 'Join as Student',
      connections: [
        { to: 'Academician', desc: 'Receives capstone feedback & curriculum guidance' },
        { to: 'Institute', desc: 'Contributes to placement readiness indices' },
        { to: 'Industry', desc: 'Discovered through verified competency credentials' }
      ],
      capabilities: [
        'Personalized Career Compass',
        'Diagnostic Skill Gap Analysis',
        'ATS Resume Diagnostics',
        'Dynamic Milestone Roadmap'
      ]
    },
    {
      id: 'academician',
      title: 'Academician & Mentor',
      icon: 'psychology_alt',
      tagline: 'Curriculum Realignment & Research Mentorship',
      description:
        'Bridge classroom syllabi with current industry demand vectors. Monitor cohort learning sprints, mentor research capstones, and endorse student achievements.',
      cta: 'Join as Academician',
      connections: [
        { to: 'Student', desc: 'Provides research mentorship & project evaluation' },
        { to: 'Institute', desc: 'Aligns department curriculum with market demand' },
        { to: 'Industry', desc: 'Translates corporate tech stacks into coursework' }
      ],
      capabilities: [
        'Curriculum-to-Market Mapping',
        'Cohort Skill Gap Dashboard',
        'Student Capstone Telemetry',
        'Verified Faculty Endorsements'
      ]
    },
    {
      id: 'institution',
      title: 'Institute & University',
      icon: 'domain',
      tagline: 'Cohort Readiness & Placement Governance',
      description:
        'Institutional command center providing department-wide employability indices, recruiter engagement tracking, and accredited outcome reporting.',
      cta: 'Join as Institute',
      connections: [
        { to: 'Student', desc: 'Tracks overall student cohort career outcomes' },
        { to: 'Academician', desc: 'Empowers faculty with department performance metrics' },
        { to: 'Industry', desc: 'Establishes verified corporate hiring partnerships' }
      ],
      capabilities: [
        'Cohort Employability Analytics',
        'Placement Readiness Dashboard',
        'Corporate Relationship Management',
        'Institutional Outcome Telemetry'
      ]
    },
    {
      id: 'industry',
      title: 'Industry & Employer',
      icon: 'apartment',
      tagline: 'Precision Sourcing & Competency Mapping',
      description:
        'Publish requisitions directly into university pipelines. Discover pre-assessed candidates with demonstrated project execution and verified competency scores.',
      cta: 'Join as Industry',
      connections: [
        { to: 'Student', desc: 'Accesses pre-vetted candidate competency profiles' },
        { to: 'Academician', desc: 'Shares upcoming technology stack requirements' },
        { to: 'Institute', desc: 'Conducts streamlined campus placement drives' }
      ],
      capabilities: [
        'Competency Requisition Mapping',
        'Verified Talent Pipeline',
        'Direct Candidate Fast-Track',
        'Campus Placement Partnerships'
      ]
    }
  ];

  const current = roles.find((r) => r.id === activeRole) || roles[0];

  return (
    <section
      id="ecosystem"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#070709] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-14 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Synchronized Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Four participants.{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              One connected loop.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Select any role below to observe how data and mentorship circulate continuously between all four pillars.
          </p>

          {/* Interactive Role Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {roles.map((r) => {
              const isSelected = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRole(r.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#fc8200] to-[#ff4d00] text-white shadow-lg shadow-[#fc8200]/20'
                      : 'bg-[#131415] text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {r.icon}
                  </span>
                  <span>{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Interactive Card & Connectivity Visualizer */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Role Details Panel (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#131415] border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#fc8200]/15 border border-[#fc8200]/30 flex items-center justify-center text-[#fc8200]">
                  <span className="material-symbols-outlined text-2xl">
                    {current.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {current.title}
                  </h3>
                  <span className="text-xs text-[#fc8200] font-mono">
                    {current.tagline}
                  </span>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed pt-2">
                {current.description}
              </p>

              <div className="pt-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Key Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  {current.capabilities.map((cap, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-zinc-200"
                    >
                      <span className="material-symbols-outlined text-[#fc8200] text-sm">
                        check_circle
                      </span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct CTA into existing Registration with Role pre-selected */}
            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">
                Connect directly through the portal
              </span>
              <button
                type="button"
                onClick={() => onRegister(current.id)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#fc8200] hover:bg-orange-600 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{current.cta}</span>
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Interconnected Network Visualizer (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#111114] border border-white/10 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ecosystem Telemetry
                </span>
                <span className="text-zinc-500">Node Sync Active</span>
              </div>

              <div className="mt-4 space-y-3">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
                  Active Connections from {current.title.split(' ')[0]}:
                </span>
                {current.connections.map((conn, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 hover:border-[#fc8200]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-[#fc8200]">
                          sync_alt
                        </span>
                        <span>{conn.to}</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Synchronized
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {conn.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-[10px] font-mono text-zinc-500 text-center">
              *Interactive demonstration of multi-stakeholder data exchange
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}