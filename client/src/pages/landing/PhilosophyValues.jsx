import useScrollReveal from './useScrollReveal';

export default function PhilosophyValues() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const values = [
    {
      id: 'human',
      title: 'Human Focused',
      icon: 'diversity_3',
      description:
        'Every layout, motion, and diagnostic is shaped around real human ambition and academic realities — not short-term visual hype, but lasting career momentum.'
    },
    {
      id: 'clarity',
      title: 'Clarity Driven',
      icon: 'lightbulb',
      description:
        'We design interfaces that feel instantly understandable, guiding students and mentors naturally through each milestone without friction, confusion, or ambiguity.'
    },
    {
      id: 'scale',
      title: 'Built for Scale',
      icon: 'all_inclusive',
      description:
        'Our systems are designed to expand across entire university departments, student cohorts, and enterprise talent pipelines while maintaining high performance and consistency.'
    },
    {
      id: 'precision',
      title: 'Precision Crafted',
      icon: 'tune',
      description:
        'From typography and interaction timing to deterministic skill gap calculations, every detail is refined to deliver an authoritative and trustworthy experience.'
    }
  ];

  return (
    <section
      id="philosophy"
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
            Our Core Principles
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Designing tools that{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              move careers forward.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Every capability inside Career Odyssey is built upon four foundational design standards to turn career goals into deterministic steps.
          </p>
        </div>

        {/* 4 Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, index) => (
            <div
              key={val.id}
              style={{ transitionDelay: `${index * 120}ms` }}
              className={`p-6 rounded-2xl bg-[#131415] border border-white/10 hover:border-[#fc8200]/40 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 shadow-lg hover:shadow-[#fc8200]/5 ${
                isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#fc8200] group-hover:bg-[#fc8200]/15 group-hover:border-[#fc8200]/30 transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    {val.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {val.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
                <span>STANDARD 0{index + 1}</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform text-[#fc8200]">
                  north_east
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}