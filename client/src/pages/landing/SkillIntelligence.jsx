import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function SkillIntelligence({ onRegister }) {
  const [selectedRole, setSelectedRole] = useState('cloud');
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const roleProfiles = {
    cloud: {
      roleTitle: 'Cloud Systems Architect',
      alignmentState: 'Strong Core Alignment',
      summary: 'Strong distributed fundamentals with targeted gaps in cloud networking & orchestrators.',
      skills: [
        { name: 'Distributed Systems Design', status: 'Demonstrated Mastery', level: 'high', note: 'Solid theoretical foundation from university coursework' },
        { name: 'Container Orchestration (Kubernetes)', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Complete production cluster deployment sprint' },
        { name: 'CI/CD & GitOps Automation', status: 'Developing Proficiency', level: 'mid', note: 'Demonstrated in personal projects, needs enterprise pipeline exposure' },
        { name: 'Infrastructure as Code (Terraform)', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Provision multi-region VPC capstone' },
        { name: 'Database Partitioning & ACID', status: 'Demonstrated Mastery', level: 'high', note: 'Verified via database management laboratory' }
      ],
      suggestedMilestone: 'Sprint 03: Multi-tier Microservices with Terraform & Helm'
    },
    fullstack: {
      roleTitle: 'Full-Stack Software Engineer',
      alignmentState: 'Substantial Readiness',
      summary: 'Broad frontend and API foundation, ready to deepen asynchronous architecture.',
      skills: [
        { name: 'Modern React & State Architecture', status: 'Demonstrated Mastery', level: 'high', note: 'Demonstrated component modularity and lifecycle handling' },
        { name: 'RESTful & GraphQL API Design', status: 'Demonstrated Mastery', level: 'high', note: 'Demonstrated authenticated route design and caching' },
        { name: 'Asynchronous Event Streaming (Kafka/RabbitMQ)', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Build pub/sub real-time event pipeline' },
        { name: 'Relational & Document Modeling', status: 'Developing Proficiency', level: 'mid', note: 'Solid CRUD fundamentals, index optimization needed' },
        { name: 'Automated E2E Testing', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Implement Cypress or Playwright test suites' }
      ],
      suggestedMilestone: 'Sprint 02: Event-Driven Microservices with Message Queues'
    },
    aiml: {
      roleTitle: 'AI / Machine Learning Engineer',
      alignmentState: 'Promising Theoretical Fit',
      summary: 'Strong mathematical foundation, requires applied model serving & pipeline orchestration.',
      skills: [
        { name: 'Linear Algebra & Probability Theory', status: 'Demonstrated Mastery', level: 'high', note: 'Strong academic grade profile in advanced mathematics' },
        { name: 'Deep Learning Architectures (PyTorch)', status: 'Developing Proficiency', level: 'mid', note: 'Experience with standard CNN/Transformer fine-tuning' },
        { name: 'Model Serving & Inference Optimization', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Deploy low-latency ONNX runtime microservice' },
        { name: 'Feature Store & Data Pipeline Tooling', status: 'Skill Gap Identified', level: 'gap', note: 'Recommended: Build automated dataset ingestion pipeline' },
        { name: 'Evaluation Benchmarking & Guardrails', status: 'Developing Proficiency', level: 'mid', note: 'Basic cross-validation, needs production monitoring drills' }
      ],
      suggestedMilestone: 'Sprint 04: Production ML Serving Pipeline with Docker & Triton'
    }
  };

  const current = roleProfiles[selectedRole];

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#070709] relative"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-14 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Diagnostic Capability Engine
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            Pinpoint skill gaps with{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              precision diagnostics.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Stop guessing what employers expect. Career Odyssey compares your academic profile with market requisitions to surface actionable learning priorities.
          </p>

          {/* Interactive Role Selector */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'cloud', label: 'Cloud Systems Architect' },
              { id: 'fullstack', label: 'Full-Stack Engineer' },
              { id: 'aiml', label: 'AI/ML Engineer' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedRole === r.id
                    ? 'bg-[#18181d] text-[#fc8200] border-[#fc8200]/40 shadow-lg shadow-[#fc8200]/10'
                    : 'bg-[#131415] text-zinc-400 border-white/5 hover:text-white hover:border-white/15'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Dashboard Card */}
        <div
          className={`max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#131415] shadow-2xl p-6 sm:p-8 transition-all duration-700 delay-150 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fc8200]" />
                <h3 className="text-lg font-bold text-white">
                  Target Trajectory: {current.roleTitle}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{current.summary}</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {current.alignmentState}
              </span>
            </div>
          </div>

          {/* Differential Skills Breakdown */}
          <div className="py-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Competency Vector</span>
              <span>Qualitative Status</span>
            </div>

            <div className="space-y-3">
              {current.skills.map((skill, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{skill.name}</span>
                    </div>
                    <div className="text-xs text-zinc-400">{skill.note}</div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {skill.level === 'high' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>{skill.status}</span>
                      </span>
                    )}
                    {skill.level === 'mid' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <span className="material-symbols-outlined text-xs">trending_up</span>
                        <span>{skill.status}</span>
                      </span>
                    )}
                    {skill.level === 'gap' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#fc8200]/15 text-[#fc8200] border border-[#fc8200]/30 animate-pulse">
                        <span className="material-symbols-outlined text-xs">priority_high</span>
                        <span>{skill.status}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptive Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#fc8200]/10 via-[#fc8200]/5 to-transparent border border-[#fc8200]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fc8200]/20 flex items-center justify-center text-[#fc8200] shrink-0">
                <span className="material-symbols-outlined text-xl">conversion_path</span>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-[#fc8200] font-semibold">
                  Prescribed Learning Action
                </div>
                <div className="text-xs sm:text-sm font-medium text-white">
                  {current.suggestedMilestone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRegister && onRegister('student')}
              className="shrink-0 px-4 py-2 rounded-lg bg-[#fc8200] hover:bg-[#ff9326] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-md"
            >
              <span>Build Sprint Roadmap</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
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