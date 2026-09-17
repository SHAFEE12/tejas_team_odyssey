import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function AIAssistant({ onRegister }) {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const conversationScenarios = [
    {
      prompt: 'What skills are missing for a Cloud Systems role?',
      userQuery: 'What skills should I prioritize to qualify for a Cloud Infrastructure Engineer role?',
      response: 'Based on your diagnostic profile and verified coursework, you have strong foundations in Operating Systems and Relational Databases. The primary competency gaps identified are: (1) Container Orchestration with Kubernetes, and (2) Infrastructure as Code with Terraform. I recommend dedicating your next 4-week sprint to deploying a multi-service Helm chart on an active cloud cluster.'
    },
    {
      prompt: 'How do I optimize my capstone for recruiter ATS?',
      userQuery: 'How should I phrase my university capstone project on my resume to pass ATS scans?',
      response: 'Avoid passive descriptions like "Helped make a backend app." Instead, use quantified STAR bullet points: "Architected event-driven microservices processing asynchronous tasks with RabbitMQ and Redis caching, documented with OpenAPI specs and tested with 85%+ coverage." This highlights system complexity and passes ATS keyword scans for distributed backend roles.'
    },
     {
      prompt: 'Which capstone project will impress hiring managers?',
      userQuery: 'Which capstone project should I build this semester to stand out to enterprise engineering teams?',
      response: 'Rather than another generic e-commerce clone, build a high-concurrency distributed cache or a custom Kubernetes operator with automated reconciliation loops. Enterprise recruiters look for proof that you can think about fault-tolerance, idempotency, and network latency in production environments.'
    }
  ];

   const current = conversationScenarios[activePromptIndex];

  return (
    <section
      id="ai-copilot"
      ref={sectionRef}
      className="py-24 border-t border-white/[0.06] bg-[#050505] relative overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fc8200]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-14 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Conversational Guidance
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
            AI Co-Pilot for{' '}
            <span className="serif-title italic text-transparent bg-clip-text bg-gradient-to-r from-[#fc8200] to-amber-200">
              continuous mentorship.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Ask targeted questions about your career trajectory, resume phrasing, and learning priorities. Get deterministic, context-aware answers.
          </p>

          {/* Quick Prompts */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {conversationScenarios.map((scenario, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActivePromptIndex(index)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  activePromptIndex === index
                    ? 'bg-[#fc8200]/15 text-[#fc8200] border-[#fc8200]/40'
                    : 'bg-[#131415] text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {scenario.prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Terminal Card */}
        <div
          className={`max-w-3xl mx-auto rounded-2xl border border-white/10 bg-[#131415] shadow-2xl overflow-hidden transition-all duration-700 delay-150 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Terminal Title Bar */}
          <div className="px-5 py-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60 inline-block" />
              <span className="ml-2 font-mono text-xs text-zinc-400">
                Career Odyssey AI Mentor
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#fc8200]">
              <span className="w-2 h-2 rounded-full bg-[#fc8200] animate-pulse" />
              <span>SIMULATED DEMO</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-5 min-h-[280px]">
            {/* User Message */}
            <div className="flex items-start justify-end gap-3">
              <div className="bg-[#1e1e24] border border-white/10 p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] text-xs sm:text-sm text-zinc-200">
                {current.userQuery}
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
            </div>

             {/* Assistant Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fc8200] to-orange-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#fc8200]/20">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl rounded-tl-sm max-w-[85%] sm:max-w-[85%] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Odyssey Mentor</span>
                  <span className="text-[10px] font-mono text-zinc-500">Curriculum & Market Model</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {current.response}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Input Bar */}
          <div className="p-4 border-t border-white/10 bg-black/20 flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={`Select another prompt above to preview simulated mentorship...`}
              className="w-full bg-transparent border-none text-xs text-zinc-500 italic focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onRegister && onRegister('student')}
              className="shrink-0 px-4 py-2 rounded-lg bg-[#fc8200] hover:bg-[#ff9326] text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              Sign Up to Chat
            </button>
          </div>

          {/* Truthful Demo Notice */}
          <div className="py-2.5 text-center text-[10px] font-mono text-zinc-500 bg-black/40 border-t border-white/5">
            *Interactive product demonstration using simulated data
          </div>
        </div>

      </div>
    </section>
  );
}