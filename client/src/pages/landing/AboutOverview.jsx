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
