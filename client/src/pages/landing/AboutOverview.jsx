import useScrollReveal from './useScrollReveal';

export default function AboutOverview() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const values = [
    {
      id: 'human',
      title: 'Human Focused',
      description:
        'Every layout, motion, and interaction is shaped around real human behavior, not assumptions, trends, or short term visual hype, but lasting impact.'
    },
    {
      id: 'clarity',
      title: 'Clarity Driven',
      description:
        'We design interfaces that feel instantly understandable, guiding users naturally through each interaction without friction, confusion, or unnecessary complexity.'
    },
    {
      id: 'scale',
      title: 'Built for Scale',
      description:
        'Our systems are designed to grow with products, teams, and evolving business needs while maintaining performance, consistency, and stability over time.'
    },
    {
      id: 'precision',
      title: 'Precision Crafted',
      description:
        'From spacing and typography to interaction timing and responsiveness, every detail is carefully refined to create a polished and reliable product experience.'
    }
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline matching Framer */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-16 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono text-[#fc8200] tracking-wider font-semibold">
            About Career Odyssey
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-tight">
            We turn career goals into{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              actionable steps.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            A synchronized ecosystem connecting student preparation, academic curriculum, and enterprise hiring standards into a single transparent trajectory.
          </p>
        </div>

        {/* High-Resolution Device Showcase matching Framer */}
        <div
          className={`relative max-w-5xl mx-auto mb-20 transition-all duration-1000 delay-150 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#131415]/80 p-3 sm:p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Top Browser Pill Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60 inline-block" />
                <span className="ml-2 text-zinc-400 text-xs">
                  careerodyssey.com // Unified Navigation Canvas
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#fc8200]">
                <span className="w-2 h-2 rounded-full bg-[#fc8200] animate-pulse" />
                <span>ECOSYSTEM SYNCHRONIZED</span>
              </div>
            </div>

            {/* Desktop & Mobile Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Phone Mockup */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  <img
                    src="/framer/mockup-phone.png"
                    alt="Career Odyssey Mobile Companion"
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>

              {/* Dashboard Mockup */}
              <div className="md:col-span-7 flex justify-center">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  <img
                    src="/framer/mockup-dashboard.png"
                    alt="Career Odyssey Dashboard Interface"
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-102"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-[11px] font-mono text-zinc-400">
              *Interactive multi-stakeholder interface preview
            </div>
          </div>
        </div>

        {/* 4 Core Values Grid matching Framer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, index) => (
            <div
              key={val.id}
              style={{ transitionDelay: `${index * 100}ms` }}
              className={`p-6 rounded-2xl bg-[#131415] border border-white/10 hover:border-[#fc8200]/40 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 shadow-lg hover:shadow-[#fc8200]/5 ${
                isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {val.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400 group-hover:text-zinc-400">
                <span>0{index + 1}</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform text-[#fc8200]">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
