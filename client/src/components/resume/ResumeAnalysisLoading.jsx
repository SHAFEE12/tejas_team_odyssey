import { useState, useEffect } from 'react';
import CareerOdysseyLogoSurge from '../CareerOdysseyLogoSurge';

const ANALYSIS_STAGES = [
  'Reading your resume',
  'Understanding your experience',
  'Identifying your skills',
  'Analyzing your career profile',
];

export default function ResumeAnalysisLoading() {
  const [analysisStage, setAnalysisStage] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 520
  );

  // Responsive resize tracking
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Step-by-step stage progress indicator (clamped to final stage)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysisStage((current) =>
        Math.min(current + 1, ANALYSIS_STAGES.length - 1)
      );
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const isMobile = viewportWidth < 600;

  // Responsive surge dimensions with generous vertical and horizontal headroom
  const surgeWidth = isMobile
    ? Math.max(280, Math.min(540, viewportWidth - 48))
    : 540;
  const surgeHeight = isMobile
    ? Math.max(160, Math.min(280, (viewportWidth - 48) * 0.52))
    : 300;
  const surgeDensity = isMobile ? 800 : 1100;
  const surgeDotSize = isMobile ? 1.5 : 1.6;
  const surgeSpeed = isMobile ? 1 : 0.75;
  const surgeStrength = isMobile ? 1 : 0.75;

  return (
    <div
      role="status"
      aria-busy="true"
      className="relative flex flex-col items-center justify-center py-12 md:py-16 px-4 sm:px-8 text-center rounded-3xl border border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-500 animate-in fade-in"
    >
      {/* Subtle atmospheric glow behind the particle logo matching brand colors */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[600px] h-[320px] bg-gradient-to-tr from-[#FC8200]/14 via-amber-500/8 to-transparent rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Career Odyssey Particle Surge Canvas */}
      <div className="relative z-10 flex items-center justify-center">
        <CareerOdysseyLogoSurge
          width={surgeWidth}
          height={surgeHeight}
          density={surgeDensity}
          dotSize={surgeDotSize}
          speed={surgeSpeed}
          surge={surgeStrength}
          pointer={false}
          logoSrc="/careeerOdyssey-logo.png"
        />
      </div>

      {/* Status Announcements (Accessible Live Region) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="relative z-10 mt-6 sm:mt-8 space-y-2 flex flex-col items-center max-w-md mx-auto"
      >
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white/95">
          Analyzing your resume...
        </h2>

        <p
          key={analysisStage}
          className="text-xs sm:text-sm font-medium text-[#FC8200] tracking-wide animate-pulse"
        >
          {ANALYSIS_STAGES[analysisStage]}
        </p>
      </div>
    </div>
  );
}
