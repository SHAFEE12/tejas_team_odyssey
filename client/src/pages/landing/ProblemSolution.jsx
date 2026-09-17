import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function ProblemSolution() {
  const [activeView, setActiveView] = useState('solution');
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const problems = [
    { title: 'Disconnected Learning', desc: 'Coursework completed without knowing whether it reflects current employer needs.' },
    { title: 'Unclear Career Trajectory', desc: 'Struggling to pick between diverse tech roles without objective diagnostic fit.' },
    { title: 'Hidden Skill Deficits', desc: 'Failing technical screenings without knowing which precise concepts were lacking.' },
    { title: 'Passive Resume Submissions', desc: 'Applying blindly into ATS black holes without actionable diagnostics.' },
    { title: 'Isolated Mentorship', desc: 'Faculty mentors lack continuous visibility into student capstone progress.' },
    { title: 'Fragmented Opportunities', desc: 'Campus placement cells manage recruiter relationships through scattered spreadsheets.' }
  ];

  const solutions = [
    { title: 'Connected Curriculum', desc: 'Academic coursework mapped continuously to industry competency standards.' },
    { title: 'Deterministic Compass', desc: 'Data-driven career trajectory based on education, skills, and personal goals.' },
    { title: 'Skill Gap Differential', desc: 'Pinpoint exact missing competencies with customized learning sprints.' },
    { title: 'ATS Resume Diagnostics', desc: 'Actionable keyword, formatting, and impact scoring before applying.' },
    { title: 'Active Faculty Telemetry', desc: 'Academicians track student progress and endorse capstone milestones.' },
    { title: 'Direct Enterprise Pipeline', desc: 'Recruiters hire pre-vetted candidates with verified competency scores.' }
  ];

  return (
    <section
      id="problemsolution"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-14 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            From Uncertainty to Clarity
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Connecting the{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              fragmented journey.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Traditional career navigation relies on disjointed tools and guesswork. Career Odyssey connects every phase into a synchronized system.
          </p>

          {/* Interactive Toggle Pill */}
          <div className="pt-4 inline-flex p-1 rounded-xl bg-[#141418] border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveView('problem')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'problem'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              The Fragmented Experience
            </button>
            <button
              type="button"
              onClick={() => setActiveView('solution')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'solution'
                  ? 'bg-gradient-to-r from-[#fc8200] to-[#ff4d00] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              The Career Odyssey System
            </button>
          </div>
        </div>

        {/* Transition Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(activeView === 'problem' ? problems : solutions).map((item, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                activeView === 'problem'
                  ? 'bg-[#120e0e] border-red-900/30 hover:border-red-500/40'
                  : 'bg-[#131415] border-white/10 hover:border-[#fc8200]/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      activeView === 'problem' ? 'text-red-400' : 'text-[#fc8200]'
                    }`}
                  >
                    {activeView === 'problem' ? 'error_outline' : 'check_circle'}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                    Phase 0{index + 1}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white">{item.title}</h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}