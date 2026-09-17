import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './motion/gsapSetup';

export default function ScrollWorld({ onRegister }) {
  const containerRef = useRef(null);
  const pinRef = useRef(null);
  const scene1Ref = useRef(null);
  const scene2Ref = useRef(null);
  const flightPathRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const [activeScene, setActiveScene] = useState(1);
  const [progressVal, setProgressVal] = useState(0);

  useGSAP(
    () => {
      const pinEl = pinRef.current;
      const containerEl = containerRef.current;
      if (!pinEl || !containerEl) return;

      // Master ScrollTrigger Camera Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerEl,
          start: 'top top',
          end: '+=2600',
          pin: pinEl,
          scrub: 1.2, // Smooth physical inertia
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            setProgressVal(Math.round(p * 100));
            if (p < 0.48) {
              setActiveScene(1);
            } else {
              setActiveScene(2);
            }
          }
        }
      });

      // Initial States
      gsap.set(scene1Ref.current, {
        scale: 0.95,
        yPercent: 2,
        rotateX: 18,
        rotateZ: -1,
        opacity: 1,
        filter: 'blur(0px)',
        transformOrigin: '50% 60%'
      });

      gsap.set(scene2Ref.current, {
        scale: 0.65,
        yPercent: -40,
        rotateX: 32,
        rotateZ: 2,
        opacity: 0,
        filter: 'blur(10px)',
        transformOrigin: '50% 40%'
      });

      gsap.set(flightPathRef.current, {
        strokeDashoffset: 1000,
        opacity: 0
      });

      gsap.set(card1Ref.current, { opacity: 1, y: 0 });
      gsap.set(card2Ref.current, { opacity: 0, y: 30, pointerEvents: 'none' });

      // PHASE 1: Scene 1 Close Inspection Dive (0% -> 30%)
      tl.to(
        scene1Ref.current,
        {
          scale: 1.14,
          yPercent: -6,
          rotateX: 8,
          rotateZ: 0,
          duration: 3,
          ease: 'power1.inOut'
        },
        0
      );

      // Dwell in Scene 1 (30% -> 40%)
      tl.to(
        scene1Ref.current,
        {
          scale: 1.18,
          yPercent: -8,
          duration: 1.5,
          ease: 'none'
        },
        3
      );

      // PHASE 2: The Camera Pull-Up & Aerial Flight Transition (40% -> 70%)
      // 1. Camera pulls UP and OUT of Scene 1
      tl.to(
        scene1Ref.current,
        {
          scale: 0.72,
          yPercent: 35,
          rotateX: 30,
          rotateZ: -3,
          opacity: 0,
          filter: 'blur(8px)',
          duration: 3,
          ease: 'power2.in'
        },
        4.5
      );

      // 2. Flight Trajectory Beam traces across the world
      tl.to(
        flightPathRef.current,
        {
          opacity: 1,
          strokeDashoffset: 0,
          duration: 2.5,
          ease: 'power1.inOut'
        },
        4.5
      );
      tl.to(
        flightPathRef.current,
        {
          opacity: 0,
          duration: 1,
          ease: 'power1.out'
        },
        7
      );

      // 3. Card 1 fades out, Card 2 fades in
      tl.to(
        card1Ref.current,
        {
          opacity: 0,
          y: -25,
          duration: 1.5,
          ease: 'power2.in',
          pointerEvents: 'none'
        },
        4.5
      );
      tl.to(
        card2Ref.current,
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: 'power2.out',
          pointerEvents: 'auto'
        },
        6
      );

      // 4. Scene 2 swoops in from the horizon and descends into close inspection
      tl.to(
        scene2Ref.current,
        {
          scale: 1.14,
          yPercent: -6,
          rotateX: 8,
          rotateZ: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 4,
          ease: 'power2.out'
        },
        5.5
      );

      // PHASE 3: Scene 2 Dwell (70% -> 100%)
      tl.to(
        scene2Ref.current,
        {
          scale: 1.18,
          yPercent: -9,
          duration: 2.5,
          ease: 'none'
        },
        9.5
      );
    },
    { scope: containerRef }
  );

  // Smooth jump to scene
  const jumpToScene = (targetScene) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const targetScroll = targetScene === 1 ? 0 : 1600;
    window.scrollTo({
      top: containerTop + targetScroll,
      behavior: 'smooth'
    });
  };

  return (
    <div
      ref={containerRef}
      id="world-journey"
      className="relative bg-[#070709] border-t border-white/10"
      style={{ height: '3600px' }} // Scroll track for the pinned camera timeline
    >
      {/* Pinned Viewport Container */}
      <div
        ref={pinRef}
        className="h-screen w-full sticky top-0 overflow-hidden flex flex-col justify-between"
      >
        {/* Background Atmosphere: Deep Obsidian Dark with Subtle Warm Orange Ambient Radial */}
        <div className="absolute inset-0 bg-radial from-orange-500/5 via-[#0a0b0e] to-[#070709] pointer-events-none -z-10" />

        {/* 1. TOP ROUTE RAIL: Interactive Backbone Indicator */}
        <header className="relative z-30 pt-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] w-full mx-auto">
          <div className="bg-[#121418]/90 backdrop-blur-md rounded-[1000px] p-2 border border-white/10 shadow-lg shadow-black/50 flex items-center justify-between gap-3">
            
            {/* Left Brand Badge */}
            <div className="flex items-center gap-2 pl-3">
              <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
              <span className="text-[11px] font-mono-eyebrow text-[#ff8a00] font-semibold tracking-wider">
                NARRATIVE SPINE // CAMERA FLIGHT
              </span>
            </div>

            {/* Prototype Milestone Stepper */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => jumpToScene(1)}
                className={`px-3 py-1.5 rounded-[1000px] text-xs font-mono-eyebrow flex items-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  activeScene === 1
                    ? 'bg-[#ff7a00] text-white font-semibold shadow-md shadow-orange-500/20'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>01</span>
                <span>FOUNDATION</span>
              </button>

              <span className="text-zinc-600 font-light text-xs">→</span>

              <button
                type="button"
                onClick={() => jumpToScene(2)}
                className={`px-3 py-1.5 rounded-[1000px] text-xs font-mono-eyebrow flex items-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  activeScene === 2
                    ? 'bg-[#ff7a00] text-white font-semibold shadow-md shadow-orange-500/20'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>02</span>
                <span>PRACTICE</span>
              </button>

              <span className="text-zinc-700 font-light text-xs hidden md:inline">→</span>

              <span className="hidden md:inline-flex items-center gap-1 text-zinc-500 text-xs font-mono-eyebrow px-2">
                <span>03 VALIDATION</span>
                <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">NEXT</span>
              </span>

              <span className="text-zinc-700 font-light text-xs hidden md:inline">→</span>

              <span className="hidden md:inline-flex items-center gap-1 text-zinc-500 text-xs font-mono-eyebrow px-2">
                <span>04 INDUSTRY</span>
              </span>
            </div>

            {/* Scrub Progress */}
            <div className="hidden lg:flex items-center gap-2 pr-3 text-xs font-mono-eyebrow text-zinc-300">
              <span className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden inline-block">
                <span
                  className="h-full bg-[#ff7a00] block transition-all duration-150"
                  style={{ width: `${progressVal}%` }}
                />
              </span>
              <span className="text-[11px] font-semibold w-8 text-right text-orange-400">
                {progressVal}%
              </span>
            </div>

          </div>
        </header>

        {/* 2. 3D CAMERA STAGE: Perspective Flight Engine */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '50% 48%'
          }}
        >
          {/* Glowing Flight Trajectory Beam */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1000 700"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              ref={flightPathRef}
              d="M 320 540 C 420 320, 580 260, 680 440"
              stroke="#ff7a00"
              strokeWidth="4"
              strokeDasharray="1000"
              strokeDashoffset="1000"
              strokeLinecap="round"
              className="filter drop-shadow-[0_0_16px_rgba(255,122,0,0.85)]"
            />
          </svg>

          {/* SCENE 1: Academic Commons (Foundation) */}
          <div
            ref={scene1Ref}
            className="absolute flex items-center justify-center w-full max-w-[860px] px-4 aspect-[3/2] will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Ambient Island Ground Shadow */}
            <div className="absolute w-[82%] h-[72%] rounded-full bg-orange-500/15 blur-3xl pointer-events-none -z-10 translate-y-12" />

            <img
              src="/world/academic.jpg"
              alt="Foundation - Academic Commons Diorama"
              className="w-full h-full object-contain rounded-2xl select-none drop-shadow-2xl"
              loading="eager"
            />

            {/* In-Scene Floating Coordinate Marker */}
            <div className="absolute top-[18%] left-[16%] hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[1000px] bg-[#121418]/90 backdrop-blur-sm border border-orange-500/30 text-[10px] font-mono-eyebrow text-orange-300 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]" />
              <span>THE ACADEMIC COMMONS</span>
            </div>
          </div>

          {/* SCENE 2: Proof-of-Work Lab (Practice) */}
          <div
            ref={scene2Ref}
            className="absolute flex items-center justify-center w-full max-w-[860px] px-4 aspect-[3/2] will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Ambient Island Ground Shadow */}
            <div className="absolute w-[82%] h-[72%] rounded-full bg-orange-500/15 blur-3xl pointer-events-none -z-10 translate-y-12" />

            <img
              src="/world/codelab.jpg"
              alt="Practice - Proof of Work Code Lab Diorama"
              className="w-full h-full object-contain rounded-2xl select-none drop-shadow-2xl"
              loading="lazy"
            />

            {/* In-Scene Floating Coordinate Marker */}
            <div className="absolute top-[20%] right-[18%] hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[1000px] bg-[#121418]/90 backdrop-blur-sm border border-orange-500/30 text-[10px] font-mono-eyebrow text-orange-300 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]" />
              <span>PROOF-OF-WORK LAB</span>
            </div>
          </div>
        </div>

        {/* 3. PINNED EDITORIAL NARRATIVE CARDS: Morphing Storyboard */}
        <footer className="relative z-30 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1200px] w-full mx-auto flex flex-col md:flex-row items-end justify-between gap-6 pointer-events-none">
          
          {/* Card Anchor Area */}
          <div className="relative max-w-lg w-full min-h-[220px]">
            
            {/* Card 1: Scene 1 Foundation */}
            <div
              ref={card1Ref}
              className="absolute inset-0 bg-[#121418]/95 backdrop-blur-md rounded-[16px] p-6 sm:p-7 border border-white/10 shadow-2xl space-y-3 pointer-events-auto text-white"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-0.5 rounded-[1000px] font-mono-eyebrow text-xs font-semibold bg-orange-500/15 text-[#ff8a00] border border-orange-500/30">
                  ● STAGE 01 // FOUNDATION
                </span>
                <span className="font-mono-eyebrow text-xs text-zinc-400">
                  SCENE 1 OF 4
                </span>
              </div>

              <h3 className="font-serif-heading text-2xl sm:text-3xl text-white font-normal leading-tight">
                Where foundations take shape.
              </h3>

              <p className="text-sm text-zinc-300 leading-relaxed">
                Classroom syllabi and semester lab coursework mapped directly into enterprise competency standards.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {['Verified Syllabus', 'Course Credits', 'Theory Mastery'].map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-[11px] font-mono-eyebrow text-zinc-300"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2: Scene 2 Practice */}
            <div
              ref={card2Ref}
              className="absolute inset-0 bg-[#121418]/95 backdrop-blur-md rounded-[16px] p-6 sm:p-7 border border-white/10 shadow-2xl space-y-3 pointer-events-auto text-white"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-0.5 rounded-[1000px] font-mono-eyebrow text-xs font-semibold bg-orange-500/15 text-[#ff8a00] border border-orange-500/30">
                  ● STAGE 02 // PRACTICE
                </span>
                <span className="font-mono-eyebrow text-xs text-zinc-400">
                  SCENE 2 OF 4
                </span>
              </div>

              <h3 className="font-serif-heading text-2xl sm:text-3xl text-white font-normal leading-tight">
                Build real systems, not trivial drills.
              </h3>

              <p className="text-sm text-zinc-300 leading-relaxed">
                Automated repository audits evaluate software architecture, edge-case test coverage, and API robustness.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {['Code Repositories', 'Architecture Audits', 'System Design'].map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-[11px] font-mono-eyebrow text-zinc-300"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Right Scroll Navigation Cue */}
          <div className="hidden md:flex flex-col items-end gap-2 text-xs font-mono-eyebrow text-zinc-300 pointer-events-auto">
            <div className="bg-[#121418]/90 backdrop-blur-md px-4 py-2 rounded-[1000px] border border-white/10 shadow-lg flex items-center gap-2">
              <span className="text-sm text-[#ff7a00] animate-bounce">↓</span>
              <span>SCROLL TO FLY ACROSS ISLANDS</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => jumpToScene(1)}
                className="px-3 py-1 rounded-[1000px] bg-white/5 border border-white/10 text-zinc-300 hover:border-orange-500 hover:text-white transition-colors cursor-pointer text-xs"
              >
                ‹ Foundation
              </button>
              <button
                type="button"
                onClick={() => jumpToScene(2)}
                className="px-3 py-1 rounded-[1000px] bg-white/5 border border-white/10 text-zinc-300 hover:border-orange-500 hover:text-white transition-colors cursor-pointer text-xs"
              >
                Practice ›
              </button>
            </div>
          </div>

        </footer>

      </div>
    </div>
  );
}
