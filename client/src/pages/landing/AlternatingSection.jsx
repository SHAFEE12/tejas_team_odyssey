import { useState, useRef, useEffect } from 'react';

export default function AlternatingSection({ onRegister }) {
  const [activeTab, setActiveTab] = useState('resume');
  const vantaRef = useRef(null);

  // Initialize Vanta.js DOTS interactive 3D constellation in Diagnostics section
  useEffect(() => {
    let effect = null;

    const initVanta = () => {
      if (window.VANTA && window.VANTA.DOTS && vantaRef.current && !effect) {
        effect = window.VANTA.DOTS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x070709,
          color: 0xff8820,
          color2: 0xff8820,
          size: 3.0,
          spacing: 35.0,
          showLines: false

        });
      }
    };

    if (window.VANTA && window.VANTA.DOTS) {
      initVanta();
    } else {
      const interval = setInterval(() => {
        if (window.VANTA && window.VANTA.DOTS) {
          initVanta();
          clearInterval(interval);
        }
      }, 50);

      return () => {
        clearInterval(interval);
        if (effect) effect.destroy();
      };
    }

    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  const tools = {
    resume: {
      title: 'Resume Analyzer & ATS Diagnostics',
      eyebrow: '● diagnostic | ATS-COMPLIANCE-ENGINE',
      desc: 'Evaluate resume formatting, keyword density, and action verbs against target enterprise job descriptions before applying.',
      bullets: [
        'Deterministic parsing score calibrated to top applicant tracking algorithms',
        'Specific phrasing recommendations that replace passive bullet points with quantified outcomes',
        'Technical competency hierarchy and skill categorization audits'
      ],
      ctaText: 'Analyze Your Resume Free',
      role: 'student'
    },
    interview: {
      title: 'Adaptive Mock Interview Practice',
      eyebrow: '● preparation | ROLE-SPECIFIC-INTERVIEWS',
      desc: 'Simulate realistic behavioral and technical interview scenarios calibrated to your academic year and target company stack.',
      bullets: [
        'Adaptive questioning that adjusts depth based on your previous answers',
        'Instant rubric feedback evaluating technical accuracy, communication clarity, and structure',
        'Targeted study sprints for identified conceptual deficits'
      ],
      ctaText: 'Practice Mock Interview',
      role: 'student'
    },
    dsa: {
      title: 'DSA & Algorithmic Problem Solving Tracker',
      eyebrow: '● engineering | PATTERN-BASED-ROADMAP',
      desc: 'Master foundational data structures and algorithms through structured pattern mastery rather than blind problem drilling.',
      bullets: [
        'Curated problem progression categorized by algorithmic pattern (Two Pointers, Slotted Window, Dynamic Programming)',
        'Complexity analysis checkpoints and space-time verification',
        'Cohort leaderboard and peer challenge sprints'
      ],
      ctaText: 'Explore Algorithm Sprints',
      role: 'student'
    }
  };

  const current = tools[activeTab];

  return (
    <section id="diagnostics" className="relative py-24 bg-[#070709] border-b border-white/10 text-white overflow-hidden">
      {/* Vanta DOTS 3D Interactive Constellation Background */}
      <div
        ref={vantaRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none [mask-image:radial-gradient(ellipse_85%_75%_at_50%_50%,black_45%,transparent_90%)] [-webkit-mask-image:radial-gradient(ellipse_85%_75%_at_50%_50%,black_45%,transparent_90%)]"
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          
          <h2 className="font-silicone text-4xl leading-[0.9] tracking-tight">
            Evaluate ATS readiness and practice adaptive interviews.
          </h2>
        
          {/* Filter Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'resume', label: 'Resume Analyzer' },
              { id: 'interview', label: 'Mock Interview' },
              { id: 'dsa', label: 'DSA Tracker' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-[88px] text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#ff7a00] text-black font-semibold shadow-lg shadow-orange-500/20'
                    : 'bg-[#121418] text-zinc-300 hover:bg-[#1a1e24] hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Panel Card */}
        <div className="max-w-4xl mx-auto rounded-[12px] bg-[#0d0f12]/90 backdrop-blur-md border border-white/10 p-8 sm:p-12 shadow-2xl">
          <div className="space-y-6">
            <span className="font-mono-eyebrow text-xs text-orange-400 font-semibold block">
              {current.eyebrow}
            </span>

            <h3 className="font-serif-heading text-2xl sm:text-3xl text-white font-normal leading-tight">
              {current.title}
            </h3>

            <p className="text-base text-zinc-400 leading-relaxed">
              {current.desc}
            </p>

            <ul className="space-y-3 pt-2">
              {current.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-zinc-300">
                  <span className="font-bold text-[#ff7a00] text-lg leading-none shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onRegister(current.role)}
                className="px-6 py-3 rounded-[48px] text-sm font-semibold text-black bg-[#ff7a00] hover:bg-[#ff9124] transition-all duration-200 cursor-pointer active:scale-95 shadow-lg shadow-orange-500/20"
              >
                {current.ctaText}
              </button>

              <span className="font-mono-eyebrow text-xs text-zinc-500">
                *Simulated product demonstration using illustrative data
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}