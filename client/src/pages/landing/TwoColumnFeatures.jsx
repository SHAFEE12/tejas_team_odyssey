export default function TwoColumnFeatures({ onRegister }) {
  return (
    <section id="capabilities" className="py-24 bg-[#070709] border-b border-white/10 text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="font-mono-eyebrow text-xs text-orange-400 font-semibold flex items-center justify-center gap-2">
        
            
          </span>
          <h2 className="font-serif-heading text-3xl sm:text-4xl text-white font-normal leading-tight">
            Two synchronized engines for career readiness.
          </h2>
          <p className="text-base text-zinc-400 font-normal leading-relaxed">
            Whether preparing as an ambitious learner or leading a university department, Career Odyssey brings structure to every milestone.
          </p>
        </div>

        {/* Two-Column Side-by-Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Student Career Compass & Gap Differential */}
          <div className="rounded-[12px] bg-[#0d0f12] p-8 sm:p-10 flex flex-col justify-between border border-white/10 hover:border-orange-500/30 transition-colors">
            
            {/* Top UI Mockup Embed */}
            <div className="bg-[#121418] rounded-[12px] p-5 border border-white/10 mb-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono-eyebrow text-xs text-zinc-400 font-medium">
                  CAREER COMPASS // TRAJECTORY
                </span>
                <span className="px-3 py-1 rounded-[1000px] bg-orange-500/10 text-orange-400 font-mono-eyebrow text-xs font-semibold border border-orange-500/30">
                  HIGH ALIGNMENT
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-200">
                  <span>Target Role: Cloud Infrastructure Specialist</span>
                  <span className="font-semibold text-orange-400">Verified Fit</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff7a00] w-[82%] rounded-full" />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono-eyebrow">
                  <span>Coursework Baseline: Complete</span>
                  <span>Sprint Deficit: Kubernetes</span>
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="space-y-5">
              <span className="font-mono-eyebrow text-xs font-semibold text-orange-400 tracking-wider block">
                ● STUDENT | ADAPTIVE-CAREER-NAVIGATION
              </span>

              <h3 className="font-serif-heading text-3xl sm:text-4xl text-white font-normal leading-tight">
                Pinpoint skill gaps with deterministic precision.
              </h3>

              <ul className="space-y-2 pt-2">
                {[
                  'Automated syllabus and portfolio vector gap comparison',
                  'Targeted learning sprints mapped to active requisitions',
                  'Faculty-endorsed capstone milestone validation'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-zinc-300">
                    <span className="font-bold text-[#ff7a00] text-lg leading-none shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onRegister('student')}
                  className="px-6 py-3 rounded-[48px] text-sm font-semibold text-black bg-[#ff7a00] hover:bg-[#ff9124] transition-all duration-200 cursor-pointer active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  Launch Student Portal
                </button>
              </div>
            </div>

          </div>

          {/* Card 2: Institutional Telemetry & Placement Hub */}
          <div className="rounded-[12px] bg-[#0d0f12] p-8 sm:p-10 flex flex-col justify-between border border-white/10 hover:border-orange-500/30 transition-colors">
            
            {/* Top UI Mockup Embed */}
            <div className="bg-[#121418] rounded-[12px] p-5 border border-white/10 mb-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono-eyebrow text-xs text-zinc-400 font-medium">
                  COHORT READINESS TELEMETRY
                </span>
                <span className="px-3 py-1 rounded-[1000px] bg-orange-500/10 text-orange-400 font-mono-eyebrow text-xs font-semibold border border-orange-500/30">
                  DEPARTMENT ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-200">
                  <span>Computer Science Cohort 2026</span>
                  <span className="font-semibold text-orange-400">128 Students</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff7a00] w-[91%] rounded-full" />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono-eyebrow">
                  <span>Placement Preparedness: Elevated</span>
                  <span>Recruiter Drives: Active</span>
                </div>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="space-y-5">
              <span className="font-mono-eyebrow text-xs font-semibold text-orange-400 tracking-wider block">
                ● INSTITUTION | COHORT-READINESS-HUB
              </span>

              <h3 className="font-serif-heading text-3xl sm:text-4xl text-white font-normal leading-tight">
                Empower departments with real-time cohort analytics.
              </h3>

              <ul className="space-y-2 pt-2">
                {[
                  'Comprehensive department-wide placement readiness tracking',
                  'Accredited NAAC & NIRF employability outcome reporting',
                  'Direct recruiter relationship and talent pipeline fast-tracking'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-zinc-300">
                    <span className="font-bold text-[#ff7a00] text-lg leading-none shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onRegister('institution')}
                  className="px-6 py-3 rounded-[48px] text-sm font-semibold text-white bg-[#1a1e24] hover:bg-[#252a32] border border-white/10 hover:border-orange-500/40 transition-all duration-200 cursor-pointer active:scale-95"
                >
                  Launch Institution Hub
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}