import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function ResumeExperience({ onRegister }) {
  const [activeTab, setActiveTab] = useState('experience');
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const auditSections = {
    experience: {
      title: 'Work & Project Experience',
      status: 'Actionable Refinements Available',
      badgeClass: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      currentSnippet: 'Responsible for writing backend APIs in Node.js and handling databases for our university project.',
      recommendedSnippet: 'Architected 12 authenticated REST endpoints using Node.js & Express, reducing average database query latency through indexing.',
      highlights: [
        { label: 'Impact Quantification', text: 'Replace generic responsibilities with tangible deliverables and measured outcomes.' },
        { label: 'Action Verb Optimization', text: 'Replace "Responsible for" with high-impact engineering verbs like "Architected" or "Deployed".' },
        { label: 'ATS Keyword Synergy', text: 'Include explicit framework descriptors (e.g., Express middleware, MongoDB indexing).' }
      ]
    },
    skills: {
      title: 'Technical Skills & Frameworks',
      status: 'ATS Optimized Structure',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      currentSnippet: 'Skills: Java, C++, Python, HTML, CSS, JavaScript, React, Node, Git, SQL, Docker, AWS',
      recommendedSnippet: 'Categorized hierarchy: Languages (TypeScript, Python, Go) • Systems & Cloud (Docker, Kubernetes, AWS) • Databases (PostgreSQL, Redis)',
      highlights: [
        { label: 'Categorical Grouping', text: 'Structure flat keyword dumps into categorized tiers for ATS parser accuracy.' },
        { label: 'Domain Specificity', text: 'Group complementary libraries near their foundational languages.' },
        { label: 'Recruiter Scan Velocity', text: 'Allows technical screeners to confirm core competencies in under 5 seconds.' }
      ]
    },
    summary: {
      title: 'Professional Headline & Overview',
      status: 'Clarity Enhanced',
      badgeClass: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
      currentSnippet: 'Hardworking computer science student seeking any good software engineering entry-level position.',
      recommendedSnippet: 'Computer Science Undergraduate with demonstrated distributed systems coursework, hands-on microservices development, and proven open-source contributions.',
      highlights: [
        { label: 'Role Alignment', text: 'Target specific engineering subfields rather than general job seeking.' },
        { label: 'Academic Rigor', text: 'Highlight key coursework proficiencies and collaborative code repository achievements.' },
        { label: 'Value Proposition', text: 'Emphasize what you bring to the engineering team from day one.' }
      ]
    }
  };

  const current = auditSections[activeTab];

  return (
    <section
      id="resume"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-14 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            ATS Diagnostic Inspection
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Transform resumes into{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              interview invitations.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Eliminate rejection from automated applicant tracking systems. Inspect formatting, optimize keyword placement, and refine achievement statements.
          </p>

          {/* Interactive Inspection Tabs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'experience', label: 'Experience & Projects' },
              { id: 'skills', label: 'Technical Categorization' },
              { id: 'summary', label: 'Headline & Summary' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#18181d] text-[#fc8200] border-[#fc8200]/40 shadow-lg shadow-[#fc8200]/10'
                    : 'bg-[#131415] text-zinc-400 border-white/5 hover:text-white hover:border-white/15'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Workspace Card */}
        <div
          className={`max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#131415] shadow-2xl p-6 sm:p-8 transition-all duration-700 delay-150 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fc8200] text-lg">
                  description
                </span>
                <h3 className="text-lg font-bold text-white">
                  Audit Vector: {current.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Comparative analysis of phrasing, structural clarity, and parser readability.
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium border self-start sm:self-auto ${current.badgeClass}`}>
              {current.status}
            </span>
          </div>

          {/* Before vs Recommended Comparison */}
          <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Before (Unoptimized) */}
            <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-red-900/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-red-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">remove_circle_outline</span>
                  <span>Unoptimized Draft</span>
                </span>
                <span className="text-[10px] uppercase text-zinc-500">Low Parser Signal</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                {current.currentSnippet}
              </p>
            </div>

            {/* Recommended (Optimized) */}
            <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>ATS Prescriptive Phrasing</span>
                </span>
                <span className="text-[10px] uppercase text-emerald-500">Enhanced Impact</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed bg-black/30 p-3 rounded-lg border border-emerald-500/20">
                {current.recommendedSnippet}
              </p>
            </div>
          </div>

          {/* Diagnostic Optimization Pillars */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Audit Findings & Recommendations
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.highlights.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fc8200]" />
                    <span>{h.label}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-normal">
                    {h.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              Run complete multi-page document parsing with custom role requisition targeting.
            </div>

            <button
              type="button"
              onClick={() => onRegister && onRegister('student')}
              className="shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc8200] to-[#ff4d00] hover:from-[#ff9326] hover:to-[#ff5e1a] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-md"
            >
              <span>Scan Your Resume</span>
              <span className="material-symbols-outlined text-sm">upload_file</span>
            </button>
          </div>

          {/* Truthful Demo Notice */}
          <div className="mt-4 text-center text-[10px] font-mono text-zinc-500">
            *Interactive product demonstration using simulated data
          </div>
        </div>

      </div>
    </section>
  );
}