import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function Roadmap({ onRegister }) {
  const [activeMilestone, setActiveMilestone] = useState(1);
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const milestones = [
    {
      id: 0,
      phase: 'Phase 01',
      title: 'Academic & Theoretical Foundations',
      status: 'Academic Baseline Verified',
      statusType: 'complete',
      timeline: 'Semesters 1-4',
      description: 'Mastery of foundational discrete mathematics, data structures, algorithms, and computer system architecture.',
      deliverables: ['Algorithms & Complexity Analysis', 'Computer Architecture Labs', 'Database Management Fundamentals'],
      outcome: 'Theoretical baseline established with verified university coursework transcript.'
    },
    {
      id: 1,
      phase: 'Phase 02',
      title: 'Core Engineering & Microservices Sprints',
      status: 'In Active Progress',
      statusType: 'current',
      timeline: 'Semester 5 (Current Sprint)',
      description: 'Hands-on architectural implementation of authenticated API gateways, relational indexing, and containerized backends.',
      deliverables: ['Production REST & GraphQL Endpoints', 'Containerization with Docker Compose', 'CI/CD Pipeline Configuration'],
      outcome: 'Working software repositories demonstrating production-ready engineering standards.'
    },
    {
      id: 2,
      phase: 'Phase 03',
      title: 'Distributed Systems & Cloud Orchestration',
      status: 'Prescribed Learning Sprint',
      statusType: 'upcoming',
      timeline: 'Upcoming Sprint (Weeks 1-6)',
      description: 'Bridging the identified skill gap: deploy distributed locks, message brokers (Kafka), and Kubernetes orchestration.',
      deliverables: ['Asynchronous Pub/Sub Pipeline', 'Kubernetes Helm Deployment', 'Terraform Multi-Tier Cloud IaC'],
      outcome: 'Resolves critical candidate competency differential for Cloud Architect trajectories.'
    },
    {
      id: 3,
      phase: 'Phase 04',
      title: 'Faculty Endorsed Capstone Project',
      status: 'Collaborative Milestone',
      statusType: 'upcoming',
      timeline: 'Semester 7',
      description: 'Independent system implementation reviewed and certified by academician mentors with code audits.',
      deliverables: ['Production System Deployment', 'Academic Mentor Code Review', 'Performance Benchmark Report'],
      outcome: 'Demonstrated execution credibility endorsed by university faculty.'
    },
    {
      id: 4,
      phase: 'Phase 05',
      title: 'Verified Competency Industry Pipeline',
      status: 'Target Destination',
      statusType: 'target',
      timeline: 'Graduation & Placement',
      description: 'Profile highlighted directly to verified enterprise recruiters seeking candidates with demonstrated technical competencies.',
      deliverables: ['Verified Technical Competency Portfolio', 'ATS-Optimized Credential', 'Direct Recruiter Fast-Track'],
      outcome: 'Streamlined interview conversion without cold application fatigue.'
    }
  ];

  const current = milestones[activeMilestone];

  return (
    <section
      id="roadmap"
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
            Progressive Milestone Roadmap
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            A clear trajectory from{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              classroom to career.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Move beyond ambiguous job hunting. Follow sequenced milestones calibrated to your academic year and target industry role.
          </p>
        </div>

        {/* Interactive Roadmap Stepper Navigation */}
        <div
          className={`relative max-w-5xl mx-auto mb-10 transition-all duration-700 delay-100 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Connector Line */}
          <div className="hidden md:block absolute top-6 left-8 right-8 h-0.5 bg-white/10 -z-0" />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10">
            {milestones.map((m) => {
              const isActive = activeMilestone === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMilestone(m.id)}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? 'bg-[#18181d] border-[#fc8200] shadow-lg shadow-[#fc8200]/15 -translate-y-1'
                      : 'bg-[#131415] border-white/5 hover:border-white/20 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                      {m.phase}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        m.statusType === 'complete'
                          ? 'bg-emerald-400'
                          : m.statusType === 'current'
                          ? 'bg-[#fc8200] animate-pulse'
                          : m.statusType === 'target'
                          ? 'bg-amber-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <div
                    className={`text-xs font-semibold line-clamp-2 ${
                      isActive ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {m.title}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">
                    {m.timeline}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Milestone Detail Card */}
        <div
          className={`max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#131415] shadow-2xl p-6 sm:p-8 transition-all duration-700 delay-200 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#fc8200] font-semibold">
                  {current.phase}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-zinc-400">{current.timeline}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{current.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">{current.description}</p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium border self-start sm:self-auto ${
                current.statusType === 'complete'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : current.statusType === 'current'
                  ? 'bg-[#fc8200]/15 text-[#fc8200] border-[#fc8200]/30'
                  : current.statusType === 'target'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {current.status}
            </span>
          </div>

          {/* Key Deliverables */}
          <div className="py-6 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Verified Deliverables & Proof of Work
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5"
                >
                  <span className="material-symbols-outlined text-sm text-[#fc8200] mt-0.5 shrink-0">
                    check_circle
                  </span>
                  <span className="text-xs text-zinc-200 font-medium leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Outcome */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#fc8200] text-xl shrink-0">
                flag
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Milestone Competency Target
                </span>
                <span className="text-xs text-zinc-200">{current.outcome}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRegister && onRegister('student')}
              className="shrink-0 px-4 py-2 rounded-lg bg-[#fc8200] hover:bg-[#ff9326] text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Join Trajectory
            </button>
          </div>

          {/* Truthful Demo Notice */}
          <div className="mt-4 text-center text-[10px] font-mono text-zinc-500">
            *Interactive product demonstration using simulated data
          </div>
        </div>

      </div>
    </section>
  );
}