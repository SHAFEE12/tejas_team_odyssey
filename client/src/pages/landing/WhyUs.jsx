import useScrollReveal from './useScrollReveal';

export default function WhyUs() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section
      id="why-us"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline matching Framer */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-20 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Why Career Odyssey
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Turning career tools into{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              real outcomes.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Move from disconnected job hunting to an integrated architecture designed for lasting academic and professional success.
          </p>
        </div>

        {/* Bento Grid matching Framer layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
          
          {/* Bento 1: Fast Delivery (Spans 7 cols) */}
          <div
            className={`md:col-span-7 rounded-3xl border border-white/10 bg-[#131415] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[440px] group hover:border-[#fc8200]/30 transition-all duration-500 shadow-xl ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="space-y-3 relative z-10">
              <span className="text-xs font-mono uppercase text-[#fc8200] font-semibold">
                RAPID PROGRESSION
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Fast Delivery
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                Lean processes and focused learning sprints allow students to acquire missing technical competencies and deploy production projects in weeks.
              </p>
            </div>

            <div className="mt-6 flex justify-center relative z-0">
              <div className="relative w-full flex justify-center items-center">
                <div className="absolute inset-0 bg-[#fc8200]/5 blur-2xl rounded-full pointer-events-none" />
                <img
                  src="/framer/bento-orbit.png"
                  alt="Continuous Career Progression Orbit"
                  className="w-full max-h-[220px] object-contain opacity-85 group-hover:opacity-100 transition-opacity relative z-10"
                />
              </div>
            </div>
          </div>

          {/* Bento 2: Optimized Standards (Spans 5 cols) */}
          <div
            className={`md:col-span-5 rounded-3xl border border-white/10 bg-[#131415] p-6 sm:p-8 flex flex-col justify-between min-h-[440px] group hover:border-emerald-500/30 transition-all duration-500 shadow-xl ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">
                SYSTEM STANDARDS
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Optimized Standards
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every tool is calibrated for peak effectiveness across modern industry standards.
              </p>
            </div>

            <div className="py-4 space-y-2.5">
              {[
                { label: 'ATS Compatibility', desc: 'Compliant with enterprise talent systems' },
                { label: 'Role Alignment', desc: 'Calibrated to active hiring rubrics' },
                { label: 'Faculty Telemetry', desc: 'Accredited university milestone metrics' },
                { label: 'Deterministic Sprints', desc: 'Targeted skill gap resolution' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-xs font-medium text-white">{item.label}</span>
                  <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                </div>
              ))}
            </div>

            <div className="text-xs font-mono text-zinc-400">
              *Full compliance across verified competency models
            </div>
          </div>

          {/* Bento 3: Next Gen AI (Spans 6 cols) */}
          <div
            className={`md:col-span-6 rounded-3xl border border-white/10 bg-[#131415] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between group hover:border-[#fc8200]/30 transition-all duration-500 shadow-xl ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="space-y-3 relative z-10">
              <span className="text-xs font-mono uppercase text-[#fc8200] font-semibold">
                INTELLIGENT MENTORSHIP
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Next Gen AI & Competency Vectors
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Using generative intelligence paired with structured curriculum models to deliver contextual interview simulations and resume diagnostics.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <img
                src="/framer/bento-glow1.png"
                alt="AI Competency Intelligence"
                className="w-full max-h-[160px] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Bento 4: Ongoing Support (Spans 6 cols) */}
          <div
            className={`md:col-span-6 rounded-3xl border border-white/10 bg-[#131415] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500 shadow-xl ${
              isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="space-y-3 relative z-10">
              <span className="text-xs font-mono uppercase text-blue-400 font-semibold">
                COLLABORATIVE PLATFORM
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Ongoing Ecosystem Support
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                We stay actively connected after sign-up to guide students, academicians, and institutions through semester capstones and placement drives.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <img
                src="/framer/bento-glow2.png"
                alt="Ongoing Ecosystem Support"
                className="w-full max-h-[160px] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}