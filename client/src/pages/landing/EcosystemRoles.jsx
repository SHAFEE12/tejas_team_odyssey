export default function EcosystemRoles({ onRegister }) {
  const roles = [
    {
      id: 'student',
      title: 'Students & Seekers',
      eyebrow: '● LEARN & ADVANCE',
      desc: 'Discover suitable career trajectories, pinpoint competency differentials against active requisitions, and pass technical interviews.',
      highlights: ['Career Trajectory Compass', 'Diagnostic Skill Gap Analysis', 'ATS Resume Diagnostics', 'Adaptive Mock Interviews'],
      btnText: 'Join as Student',
      btnClass: 'bg-[#ff7a00] hover:bg-[#ff9124] text-black font-semibold shadow-lg shadow-orange-500/20'
    },
    {
      id: 'academician',
      title: 'Academicians & Mentors',
      eyebrow: '● GUIDE & ENDORSE',
      desc: 'Bridge classroom syllabi with current industry demand vectors. Monitor cohort learning sprints and mentor capstone execution.',
      highlights: ['Curriculum-to-Market Mapping', 'Cohort Telemetry Dashboard', 'Capstone Code Audits', 'Verified Skill Endorsements'],
      btnText: 'Join as Academician',
      btnClass: 'bg-[#1a1e24] hover:bg-[#252a32] text-white border border-white/10 hover:border-orange-500/40'
    },
    {
      id: 'institution',
      title: 'Institutions & Colleges',
      eyebrow: '● GOVERN & MEASURE',
      desc: 'Departmental command center providing cohort employability indices, recruiter engagement tracking, and accredited outcome reporting.',
      highlights: ['Department Readiness Analytics', 'Placement Governance Portal', 'Corporate Partnership CRM', 'NIRF/NAAC Outcome Telemetry'],
      btnText: 'Join as Institute',
      btnClass: 'bg-[#1a1e24] hover:bg-[#252a32] text-white border border-white/10 hover:border-orange-500/40'
    },
    {
      id: 'industry',
      title: 'Industry & Recruiters',
      eyebrow: '● SOURCE & HIRE',
      desc: 'Publish requisitions directly into university pipelines. Discover pre-vetted candidates with verified competency credentials.',
      highlights: ['Competency Requisition Mapping', 'Pre-Vetted Talent Pipeline', 'Accelerated Screening Cycles', 'Campus Drive Scheduling'],
      btnText: 'Join as Industry',
      btnClass: 'bg-[#ff7a00] hover:bg-[#ff9124] text-black font-semibold shadow-lg shadow-orange-500/20'
    }
  ];

  return (
    <section id="ecosystem" className="py-24 bg-[#070709] border-b border-white/10 text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          
          <h2 className="font-serif-heading text-3xl sm:text-4xl text-white font-normal leading-tight">
            Designed for every partner in the journey.
          </h2>
         
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((r) => (
            <div
              key={r.id}
              className="rounded-[12px] p-8 sm:p-10 flex flex-col justify-between border border-white/10 bg-[#0d0f12] hover:border-orange-500/30 transition-all shadow-xl"
            >
              <div className="space-y-4">
                <span className="font-mono-eyebrow text-xs text-orange-400 font-semibold block">
                  {r.eyebrow}
                </span>

                <h3 className="font-serif-heading text-2xl sm:text-3xl text-white font-normal leading-tight">
                  {r.title}
                </h3>

                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {r.desc}
                </p>

                <ul className="space-y-2 pt-2">
                  {r.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300">
                      <span className="font-bold text-[#ff7a00] text-base shrink-0 leading-none">
                        ✓
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onRegister(r.id)}
                  className={`px-6 py-2.5 rounded-[48px] text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${r.btnClass}`}
                >
                  {r.btnText}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}