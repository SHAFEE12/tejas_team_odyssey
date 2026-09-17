import useScrollReveal from './useScrollReveal';

export default function Features({ onRegister }) {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const features = [
    {
      id: 'resume',
      title: 'resume analyser',
      svg: '/framer/icon-resume.svg',
      desc: 'we analyse the resume end to end across formatting, ATS keywords, and quantified achievement bullets.',
      badge: 'STUDENT • PLACEMENT'
    },
    {
      id: 'interview',
      title: 'mock interview',
      svg: '/framer/icon-interview.svg',
      desc: 'realistic simulated interviews with adaptive questioning, role calibration, and instant feedback rubrics.',
      badge: 'STUDENT • MENTOR'
    },
    {
      id: 'institute',
      title: 'institute partnership',
      svg: '/framer/icon-institution.svg',
      desc: 'admin and HOD can track student performance, departmental readiness indices, and placement drives.',
      badge: 'INSTITUTE • FACULTY'
    },
    {
      id: 'dsa',
      title: 'DSA tracker',
      svg: '/framer/icon-dsa.svg',
      desc: 'structured problem-solving roadmap categorized by pattern, algorithmic complexity, and interview prevalence.',
      badge: 'ALGORITHMS • SKILLS'
    },
    {
      id: 'group',
      title: 'group study',
      svg: '/framer/icon-group.svg',
      desc: 'form 5 to 6 person peer cohorts to tackle challenge-based sprints, peer code reviews, and shared milestones.',
      badge: 'COLLABORATIVE • COHORT'
    },
    {
      id: 'hackathon',
      title: 'hackathon playground',
      svg: '/framer/icon-hackathon.svg',
      desc: 'assemble cross-disciplinary teams and compete in intra-college and inter-college software hackathons.',
      badge: 'PROJECTS • INDUSTRY'
    }
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#070709] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Framer */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-20 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Capabilities Matrix
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            What we help teams{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              build and scale.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Six interconnected modules empowering learners, mentors, and academic administrators across every phase of preparation.
          </p>
        </div>

        {/* 6 Grid Cards with authentic Framer SVGs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feat, index) => (
            <div
              key={feat.id}
              style={{ transitionDelay: `${index * 80}ms` }}
              className={`p-7 rounded-2xl bg-[#131415] border border-white/10 hover:border-[#fc8200]/40 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 shadow-xl hover:shadow-[#fc8200]/5 ${
                isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:bg-[#fc8200]/15 group-hover:border-[#fc8200]/30 transition-colors">
                    {feat.id === 'dsa' ? (
                      <span className="material-symbols-outlined text-white group-hover:text-[#fc8200] text-2xl transition-colors">
                        account_tree
                      </span>
                    ) : (
                      <img
                        src={feat.svg}
                        alt={feat.title}
                        className="w-full h-full object-contain filter invert opacity-90 group-hover:opacity-100"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-[#fc8200] font-semibold tracking-wider block">
                    {feat.badge}
                  </span>
                  <h3 className="text-xl font-medium text-white tracking-tight">
                    {feat.title}
                  </h3>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onRegister && onRegister('student')}
                  className="text-xs font-mono text-[#fc8200] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Explore Feature</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}