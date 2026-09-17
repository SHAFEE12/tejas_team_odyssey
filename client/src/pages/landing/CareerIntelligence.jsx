import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from './motion/gsapSetup';

export default function CareerIntelligence({ onRegister }) {
  const sectionRef = useRef(null);
  const [selectedTrack, setSelectedTrack] = useState('distributed');

  const tracks = {
    distributed: {
      title: 'Distributed Systems Engineer',
      marketDemand: 'High Enterprise Requisition',
      readiness: '84%',
      targetLevel: 'L4 / Senior Associate',
      competencies: [
        { name: 'Consensus & Raft Protocols', current: 75, target: 90, status: 'In Sprint' },
        { name: 'gRPC & Service Mesh', current: 85, target: 85, status: 'Mastered' },
        { name: 'High-Throughput Kafka Pipelines', current: 60, target: 85, status: 'Target Delta' },
        { name: 'Distributed Caching (Redis/Memcached)', current: 90, target: 80, status: 'Exceeds' }
      ],
      sprintFocus: 'Sprint 04: Implement Leader Election in Go & Benchmark Network Partitions',
      facultyEndorsement: 'Dr. V. Ramanathan (Dept. of Distributed Systems)'
    },
    cloud: {
      title: 'Cloud Infrastructure Architect',
      marketDemand: 'Surging Cross-Industry',
      readiness: '78%',
      targetLevel: 'Cloud Operations Specialist',
      competencies: [
        { name: 'Terraform & Infrastructure as Code', current: 70, target: 85, status: 'In Sprint' },
        { name: 'Kubernetes Cluster Hardening', current: 80, target: 90, status: 'Target Delta' },
        { name: 'Zero-Trust IAM & Security Posture', current: 65, target: 80, status: 'In Sprint' },
        { name: 'Multi-Region High Availability', current: 85, target: 85, status: 'Mastered' }
      ],
      sprintFocus: 'Sprint 03: Automated Canary Deployments via ArgoCD and Prometheus Telemetry',
      facultyEndorsement: 'Prof. S. Mehra (Cloud & Systems Lab)'
    },
    fullstack: {
      title: 'Full-Stack Systems Engineer',
      marketDemand: 'Core Engineering Requisition',
      readiness: '89%',
      targetLevel: 'Product Infrastructure Lead',
      competencies: [
        { name: 'Event-Driven Architecture', current: 85, target: 85, status: 'Mastered' },
        { name: 'TypeScript & React Internals', current: 95, target: 90, status: 'Exceeds' },
        { name: 'Database Query Optimization', current: 70, target: 85, status: 'Target Delta' },
        { name: 'Web Performance & Core Vitals', current: 90, target: 90, status: 'Mastered' }
      ],
      sprintFocus: 'Sprint 05: Build Real-Time Collaborative Canvas with Conflict-Free Replicated Data Types',
      facultyEndorsement: 'Dr. K. Narayan (Software Engineering Group)'
    }
  };

  const currentData = tracks[selectedTrack];

  // ScrollTrigger Animation Choreography
  useGSAP(() => {
    if (prefersReducedMotion()) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        end: 'bottom 20%',
        toggleActions: 'play none none none'
      }
    });

    // 1. Header reveal
    tl.from('.ci-header', {
      opacity: 0,
      y: 28,
      duration: 0.7
    })
    // 2. Input vector convergence nodes
    .from('.ci-input-node', {
      opacity: 0,
      x: -24,
      stagger: 0.1,
      duration: 0.6
    }, '-=0.3')
    // 3. Central synthesis core
    .from('.ci-synthesis-core', {
      opacity: 0,
      scale: 0.94,
      duration: 0.7
    }, '-=0.4')
    // 4. Competency delta bars
    .from('.ci-bar-fill', {
      width: '0%',
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out'
    }, '-=0.3');

  }, { scope: sectionRef });

  // return (
    // <section
    //   id="intelligence"
    //   ref={sectionRef}
    //   className="py-24 bg-[#070709] border-t border-white/10 relative overflow-hidden text-white"
    // >
    //   <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
    //     {/* Section Header */}
    //     <div className="ci-header text-center max-w-[760px] mx-auto space-y-4 mb-16">
    //       <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[1000px] bg-orange-500/10 border border-orange-500/30 text-xs font-mono-eyebrow text-orange-400">
    //         <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-pulse" />
    //         <span>THE CONVERGENCE ENGINE</span>
    //       </div>

    //       <h2 className="font-serif-heading text-3xl sm:text-4xl lg:text-[44px] text-white font-normal leading-[1.2]">
    //         From scattered signals to a{' '}
    //         <span className="italic text-[#ff7a00]">
    //           clear career trajectory.
    //         </span>
    //       </h2>

    //       <p className="text-base text-zinc-400 leading-relaxed">
    //         Traditional career navigation relies on disjointed advice and guesswork. Career Odyssey synthesizes coursework, faculty mentorship, verified skills, and enterprise standards into a deterministic development path.
    //       </p>
    //     </div>

    //     {/* Interactive Track Switcher */}
    //     <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
    //       {Object.keys(tracks).map((trackKey) => (
    //         <button
    //           key={trackKey}
    //           type="button"
    //           onClick={() => setSelectedTrack(trackKey)}
    //           className={`px-5 py-2 rounded-[48px] text-xs font-medium transition-all duration-200 cursor-pointer ${
    //             selectedTrack === trackKey
    //               ? 'bg-[#ff7a00] text-black font-semibold shadow-lg shadow-orange-500/20'
    //               : 'bg-[#121418] text-zinc-300 hover:bg-[#1a1e24] hover:text-white border border-white/10'
    //           }`}
    //         >
    //           {tracks[trackKey].title}
    //         </button>
    //       ))}
    //     </div>

    //     {/* The Convergence Grid */}
    //     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
    //       {/* Left Column: 4 Converging Input Vectors */}
    //       <div className="lg:col-span-5 space-y-3.5">
    //         <div className="text-xs font-mono-eyebrow text-orange-400 mb-1 flex items-center gap-2">
    //           <span className="w-2 h-2 rounded-full bg-[#ff7a00]" />
    //           <span>CONVERGING INPUT VECTORS</span>
    //         </div>

    //         <div className="ci-input-node p-4 rounded-[12px] bg-[#0d0f12] border border-white/10 hover:border-orange-500/30 transition-colors">
    //           <div className="flex items-center justify-between mb-1">
    //             <span className="font-medium text-xs text-zinc-200">1. Academic Coursework & Lab Work</span>
    //             <span className="text-[10px] font-mono-eyebrow text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
    //               VERIFIED SYLLABUS
    //             </span>
    //           </div>
    //           <p className="text-[11px] text-zinc-400 leading-relaxed">
    //             Semester credits mapped to enterprise skill taxonomy with direct professor evaluations.
    //           </p>
    //         </div>

    //         <div className="ci-input-node p-4 rounded-[12px] bg-[#0d0f12] border border-white/10 hover:border-orange-500/30 transition-colors">
    //           <div className="flex items-center justify-between mb-1">
    //             <span className="font-medium text-xs text-zinc-200">2. Problem Solving & Code Repositories</span>
    //             <span className="text-[10px] font-mono-eyebrow text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
    //               PROOF-OF-WORK
    //             </span>
    //           </div>
    //           <p className="text-[11px] text-zinc-400 leading-relaxed">
    //             Diagnostic audits of project depth, code quality, edge-case testing, and API design.
    //           </p>
    //         </div>

    //         <div className="ci-input-node p-4 rounded-[12px] bg-[#0d0f12] border border-white/10 hover:border-orange-500/30 transition-colors">
    //           <div className="flex items-center justify-between mb-1">
    //             <span className="font-medium text-xs text-zinc-200">3. Faculty Mentorship Telemetry</span>
    //             <span className="text-[10px] font-mono-eyebrow text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
    //               CONTINUOUS REVIEW
    //             </span>
    //           </div>
    //           <p className="text-[11px] text-zinc-400 leading-relaxed">
    //             Departmental advisor verification on capstone architecture and engineering discipline.
    //           </p>
    //         </div>

    //         <div className="ci-input-node p-4 rounded-[12px] bg-[#0d0f12] border border-white/10 hover:border-orange-500/30 transition-colors">
    //           <div className="flex items-center justify-between mb-1">
    //             <span className="font-medium text-xs text-zinc-200">4. Enterprise Hiring Signals</span>
    //             <span className="text-[10px] font-mono-eyebrow text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
    //               LIVE REQUISITIONS
    //             </span>
    //           </div>
    //           <p className="text-[11px] text-zinc-400 leading-relaxed">
    //             Direct hiring specifications from tech teams replacing generic keyword filters.
    //           </p>
    //         </div>

    //         <div className="pt-2 text-[10px] font-mono-eyebrow text-zinc-500">
    //           * Interactive demonstration using simulated cohort telemetry.
    //         </div>
    //       </div>

    //       {/* Right Column: Synthesis Core & Trajectory Diagnostic */}
    //       <div className="ci-synthesis-core lg:col-span-7 bg-[#0d0f12] rounded-[12px] p-6 sm:p-8 border border-white/10 shadow-xl">
            
    //         {/* Top Bar with Role & Match Readiness */}
    //         <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
    //           <div>
    //             <span className="font-mono-eyebrow text-[10px] text-orange-400 block mb-1">
    //               ● ACTIVE SYNTHESIS
    //             </span>
    //             <h3 className="font-serif-heading text-xl sm:text-2xl text-white">
    //               {currentData.title}
    //             </h3>
    //           </div>

    //           <div className="text-right">
    //             <span className="font-mono-eyebrow text-[10px] text-zinc-400 block mb-1">
    //               ESTIMATED READINESS
    //             </span>
    //             <span className="font-serif-heading text-3xl text-[#ff7a00] font-normal">
    //               {currentData.readiness}
    //             </span>
    //           </div>
    //         </div>

    //         {/* Competency Delta Breakdown */}
    //         <div className="py-6 space-y-4">
    //           <div className="flex items-center justify-between text-xs font-mono-eyebrow text-zinc-400">
    //             <span>KEY COMPETENCY BREAKDOWN</span>
    //             <span>STATUS</span>
    //           </div>

    //           {currentData.competencies.map((comp, idx) => (
    //             <div key={idx} className="bg-[#121418] p-3.5 rounded-[8px] border border-white/10 space-y-2">
    //               <div className="flex items-center justify-between text-xs">
    //                 <span className="font-medium text-zinc-200">{comp.name}</span>
    //                 <span className="font-mono-eyebrow text-[10px] text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded font-semibold">
    //                   {comp.status}
    //                 </span>
    //               </div>

    //               {/* Dual Bar (Current vs Target) */}
    //               <div className="space-y-1">
    //                 <div className="flex justify-between text-[10px] font-mono-eyebrow text-zinc-400">
    //                   <span>Assessed: {comp.current}%</span>
    //                   <span>Target: {comp.target}%</span>
    //                 </div>
    //                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
    //                   <div
    //                     className="ci-bar-fill h-full bg-[#ff7a00] rounded-full"
    //                     style={{ width: `${comp.current}%` }}
    //                   />
    //                 </div>
    //               </div>
    //             </div>
    //           ))}
    //         </div>

    //         {/* Recommended Sprint Focus Box */}
    //         <div className="p-4 rounded-[8px] bg-gradient-to-r from-orange-950/30 to-amber-950/20 border border-orange-500/30 space-y-2">
    //           <div className="flex items-center gap-2">
    //             <span className="text-[#ff7a00] font-bold">⚡</span>
    //             <span className="font-mono-eyebrow text-xs font-semibold text-orange-400">
    //               RECOMMENDED ACTION SPRINT
    //             </span>
    //           </div>
    //           <p className="text-xs text-zinc-300 leading-relaxed">
    //             {currentData.sprintFocus}
    //           </p>
    //           <div className="pt-1 text-[11px] font-mono-eyebrow text-zinc-400 flex items-center gap-1.5">
    //             <span>Endorsed by:</span>
    //             <span className="font-medium text-orange-300">{currentData.facultyEndorsement}</span>
    //           </div>
    //         </div>

    //         {/* Direct Action Link into Existing Platform */}
    //         <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
    //           <div className="text-xs text-zinc-400">
    //             Ready to map your own verified career trajectory?
    //           </div>

    //           <button
    //             type="button"
    //             onClick={() => onRegister('student')}
    //             className="px-6 py-2.5 rounded-[48px] text-xs font-semibold text-black bg-[#ff7a00] hover:bg-[#ff9124] transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
    //           >
    //             Create Student Account →
    //           </button>
    //         </div>

    //       </div>

    //     </div>

    //   </div>
    // </section>
  // );
}