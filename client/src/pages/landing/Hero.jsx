import { useRef, useState, useEffect } from 'react';
import {
  gsap,
  useGSAP,
  prefersReducedMotion
} from './motion/gsapSetup';
import InteractiveHoverButton from '../../components/magicui/interactive-hover-button';

const TRAJECTORIES = [
  {
    title: 'Distributed Systems',
    sprint: 'SPRINT 3',
    alignment: 88,
    badge: 'VERIFIED',
    capstone: 'CAPSTONE VECTOR SYNCED'
  },
  {
    title: 'Cloud Architecture',
    sprint: 'SPRINT 4',
    alignment: 94,
    badge: 'VERIFIED',
    capstone: 'KUBERNETES MESH ACTIVE'
  },
  {
    title: 'Deep Learning Pipelines',
    sprint: 'SPRINT 2',
    alignment: 91,
    badge: 'CALIBRATED',
    capstone: 'TENSOR PIPELINE LINKED'
  },
  {
    title: 'Algorithmic Mastery',
    sprint: 'SPRINT 5',
    alignment: 97,
    badge: 'OPTIMIZED',
    capstone: 'GRAPH HEURISTICS VALID'
  }
];

const ATS_AUDITS = [
  {
    targetRole: 'Staff Backend Engineer',
    actionVerbs: 'OPTIMIZED',
    requisitionFit: 'CALIBRATED',
    density: 92
  },
  {
    targetRole: 'Cloud Infrastructure Lead',
    actionVerbs: 'EXEMPLARY',
    requisitionFit: 'CALIBRATED',
    density: 96
  },
  {
    targetRole: 'Full Stack Architect',
    actionVerbs: 'OPTIMIZED',
    requisitionFit: 'VERIFIED',
    density: 90
  },
  {
    targetRole: 'AI & Systems Engineer',
    actionVerbs: 'OPTIMIZED',
    requisitionFit: 'CALIBRATED',
    density: 95
  }
];

function useTypewriter(
  words,
  typingSpeed = 65,
  deletingSpeed = 30,
  pauseDuration = 2600
) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[index] || '';

    if (
      !isDeleting &&
      subIndex === currentWord.length
    ) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);

      return () => clearTimeout(timeout);
    }

    if (
      isDeleting &&
      subIndex === 0
    ) {
      setIsDeleting(false);

      setIndex(
        (prev) => (prev + 1) % words.length
      );

      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex(
        (prev) =>
          prev +
          (isDeleting ? -1 : 1)
      );
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [
    subIndex,
    isDeleting,
    index,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration
  ]);

  return {
    text: words[index]
      ? words[index].slice(0, subIndex)
      : '',
    currentIndex: index,
    isDeleting
  };
}

function useAnimatedNumber(
  targetValue,
  duration = 600
) {
  const [displayValue, setDisplayValue] =
    useState(targetValue);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      const elapsed =
        timestamp - startTimestamp;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const ease =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(
          startValue +
            (targetValue - startValue) *
              ease
        )
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(step);
      }
    };

    animationFrame =
      requestAnimationFrame(step);

    return () =>
      cancelAnimationFrame(
        animationFrame
      );
  }, [targetValue, duration]);

  return displayValue;
}

export default function Hero({
  onLogin,
  onRegister,
  onExplore
}) {
  const heroRef = useRef(null);

  const trajectoryTitles =
    TRAJECTORIES.map(
      (t) => t.title
    );

  const leftTypewriter =
    useTypewriter(
      trajectoryTitles,
      65,
      30,
      2600
    );

  const currentTrajectory =
    TRAJECTORIES[
      leftTypewriter.currentIndex
    ] || TRAJECTORIES[0];

  const animatedAlignment =
    useAnimatedNumber(
      currentTrajectory.alignment,
      500
    );

  const atsRoles =
    ATS_AUDITS.map(
      (a) => a.targetRole
    );

  const rightTypewriter =
    useTypewriter(
      atsRoles,
      55,
      25,
      3000
    );

  const currentAts =
    ATS_AUDITS[
      rightTypewriter.currentIndex
    ] || ATS_AUDITS[0];

  const animatedDensity =
    useAnimatedNumber(
      currentAts.density,
      500
    );

  /*
   * Hero entrance animation
   *
   * IMPORTANT:
   * Only animate elements that are actually
   * rendered in this component.
   *
   * The previous version attempted to animate:
   *   .hero-flank-right
   *   .hero-annotation-item
   *
   * but those elements are currently commented out.
   */
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        return;
      }

      const root = heroRef.current;

      if (!root) {
        return;
      }

      const bgMedia =
        root.querySelector(
          '.hero-bg-media'
        );

      const headline =
        root.querySelector(
          '.hero-headline'
        );

      const subtext =
        root.querySelector(
          '.hero-subtext'
        );

      const ctaGroup =
        root.querySelector(
          '.hero-cta-group'
        );

      const flankLeft =
        root.querySelector(
          '.hero-flank-left'
        );

      const animatedElements = [
        bgMedia,
        headline,
        subtext,
        ctaGroup,
        flankLeft
      ].filter(Boolean);

      if (
        animatedElements.length === 0
      ) {
        return;
      }

      gsap.set(
        animatedElements,
        {
          opacity: 0
        }
      );

      if (bgMedia) {
        gsap.set(
          bgMedia,
          {
            scale: 1.05
          }
        );
      }

      if (headline) {
        gsap.set(
          headline,
          {
            y: 32
          }
        );
      }

      if (subtext) {
        gsap.set(
          subtext,
          {
            y: 24
          }
        );
      }

      if (ctaGroup) {
        gsap.set(
          ctaGroup,
          {
            y: 20
          }
        );
      }

      if (flankLeft) {
        gsap.set(
          flankLeft,
          {
            x: -36,
            scale: 0.96
          }
        );
      }

      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      });

      if (bgMedia) {
        tl.to(bgMedia, {
          opacity: 0.85,
          scale: 1,
          duration: 1.4,
          ease: 'power2.inOut'
        });
      }

      if (headline) {
        tl.to(
          headline,
          {
            opacity: 1,
            y: 0,
            duration: 0.9
          },
          '-=0.8'
        );
      }

      if (subtext) {
        tl.to(
          subtext,
          {
            opacity: 1,
            y: 0,
            duration: 0.7
          },
          '-=0.5'
        );
      }

      if (ctaGroup) {
        tl.to(
          ctaGroup,
          {
            opacity: 1,
            y: 0,
            duration: 0.6
          },
          '-=0.4'
        );
      }

      if (flankLeft) {
        tl.to(
          flankLeft,
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.8
          },
          '-=0.4'
        );
      }

      return () => {
        tl.kill();
      };
    },
    {
      scope: heroRef
    }
  );

  return (
    <section
      id="overview"
      ref={heroRef}
      className="relative pt-6 pb-20 overflow-hidden bg-transparent text-white"
    >
      {/* Background video */}
      <div className="hero-bg-media absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_35%,transparent_80%)] [-webkit-mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_35%,transparent_80%)]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover mix-blend-screen filter grayscale contrast-200 brightness-150 pointer-events-none opacity-80"
        >
          <source
            src="/framer/hero-orb.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">

          {/* Left side */}
          <div className="hero-flank-left hidden lg:block lg:col-span-3">
            {/*
              Original trajectory card intentionally
              remains disabled.
            */}
          </div>

          {/* Main hero content */}
          <div className="lg:col-span-6 text-center space-y-6 pt-4">

            <h1 className="hero-headline font-serif-heading text-4xl sm:text-5xl lg:text-[56px] text-white font-normal leading-[1.18] tracking-normal">
              Every great career starts with{' '}
              <span className="italic text-[#ff7a00]">
                the right guidance.
              </span>
            </h1>

            <p className="hero-subtext text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-[620px] mx-auto">
              Career Odyssey synchronizes
              student coursework, academic
              mentorship, and enterprise
              hiring standards into a single
              deterministic trajectory.
            </p>

            <div className="hero-cta-group pt-2 flex flex-wrap items-center justify-center gap-4">

              <InteractiveHoverButton
                onClick={() =>
                  onRegister?.('student')
                }
                className="px-6 py-3"
              >
                Get Started
              </InteractiveHoverButton>

              <button
                type="button"
                onClick={() =>
                  onExplore?.()
                }
                className="px-6 py-3 rounded-[48px] text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                Explore Platform Hub
              </button>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}