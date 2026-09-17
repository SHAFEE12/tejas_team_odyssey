import useScrollReveal from './useScrollReveal';

export default function Approach({ onRegister }) {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section
      id="approach"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#070709] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Framer */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-20 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Our Approach
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Know what works. Know what’s missing.{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              Know what to improve.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Eliminate career uncertainty with deterministic diagnostics, realistic interview simulations, and actionable resume optimization.
          </p>
        </div>

        {/* 2 Major Approach Bento Cards matching Framer */}
        <div className="space-y-12 max-w-5xl mx-auto">
          
          {/* Card 1: mock interview. */}
          <div
            className={`rounded-3xl border border-white/10 bg-[#131415] overflow-hidden p-6 sm:p-10 shadow-2xl transition-all duration-700 ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#fc8200]" />
                  <span>PREPARATION SUITE</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
                  mock interview<span className="text-[#fc8200]">.</span>
                </h3>

                <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed">
                  We bring realistic interviews, instant feedback, and focused practice together to help you perform better.
                </p>

                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Practice with an adaptive interviewer calibrated to your target role, experience level, and academic background. Answer realistic scenario questions, receive qualitative performance breakdowns, and review targeted recommendations for your next technical round.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    Adaptive Scenarios
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    Instant Analysis
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    Role-Specific Rubrics
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => onRegister && onRegister('student')}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#fc8200] to-[#ff4d00] hover:from-[#ff9326] hover:to-[#ff5e1a] shadow-lg shadow-[#fc8200]/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Practice Mock Interview</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 flex justify-center">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group w-full">
                  <img
                    src="/framer/approach-interview.png"
                    alt="Mock Interview Interface"
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: resume analyser */}
          <div
            className={`rounded-3xl border border-white/10 bg-[#131415] overflow-hidden p-6 sm:p-10 shadow-2xl transition-all duration-700 delay-150 ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1 flex justify-center">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group w-full">
                  <img
                    src="/framer/approach-resume.png"
                    alt="Resume Analyzer Interface"
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>ATS REQUISITION MATCH</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
                  resume analyser<span className="text-[#fc8200]">.</span>
                </h3>

                <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed">
                  CareerOdyssey’s Resume Analyzer evaluates your resume across ATS compatibility, skills, experience, formatting, and relevance to your target role.
                </p>

                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Transform passive project bullet points into high-impact, outcome-driven statements. Uncover missing keyword vectors before submitting applications into enterprise recruiter systems.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    ATS Readability
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    Action Verbs
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                    Keyword Density
                  </span>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => onRegister && onRegister('student')}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#fc8200] to-[#ff4d00] hover:from-[#ff9326] hover:to-[#ff5e1a] shadow-lg shadow-[#fc8200]/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Analyze Your Resume</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}