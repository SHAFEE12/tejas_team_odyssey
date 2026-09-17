import useScrollReveal from './useScrollReveal';

export default function HowItWorks() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const steps = [
    {
      num: '01',
      title: 'Discover Baseline',
      icon: 'explore',
      desc: 'Map your academic courses, projects, and personal affinities into a comprehensive foundational profile.'
    },
    {
      num: '02',
      title: 'Assess Competencies',
      icon: 'analytics',
      desc: 'Run vector diagnostics comparing your current profile against evolving enterprise technology requisitions.'
    },
    {
      num: '03',
      title: 'Understand Gaps',
      icon: 'troubleshoot',
      desc: 'Receive clear, qualitative insights into missing languages, distributed patterns, and system design concepts.'
    },
    {
      num: '04',
      title: 'Improve in Sprints',
      icon: 'sprint',
      desc: 'Execute structured milestone projects and optimize your resume phrasing for applicant tracking systems.'
    },
    {
      num: '05',
      title: 'Connect with Mentors',
      icon: 'supervised_user_circle',
      desc: 'Collaborate with university faculty for research guidance, code reviews, and verified academic endorsements.'
    },
    {
      num: '06',
      title: 'Progress to Industry',
      icon: 'verified',
      desc: 'Step into enterprise talent pipelines where recruiters evaluate candidates through verified competency outcomes.'
    }
  ];

  return (
    <section
      id="howitworks"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#070709] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-16 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            The Navigation Method
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            How Career Odyssey{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              guides your journey.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            A continuous, six-stage lifecycle engineered to take you from academic fundamentals to verified career readiness.
          </p>
        </div>

        {/* 6-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              style={{ transitionDelay: `${idx * 100}ms` }}
              className={`p-6 rounded-2xl bg-[#131415] border border-white/10 hover:border-[#fc8200]/40 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 shadow-lg hover:shadow-[#fc8200]/5 ${
                isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#fc8200] group-hover:bg-[#fc8200]/15 group-hover:border-[#fc8200]/30 transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      {step.icon}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-[#fc8200] transition-colors">
                    STAGE {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fc8200]" />
                <span>Deterministic Step</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}