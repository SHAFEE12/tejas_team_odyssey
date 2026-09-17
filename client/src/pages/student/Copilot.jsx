/**
 * Copilot.jsx
 *
 * Career Copilot page (/student/copilot).
 * A contextual career decision assistant that understands the student's authentic stored data.
 *
 * SAFETY PRINCIPLES:
 * - Direct navigation via Action Allowlist.
 * - Mutation actions require explicit confirmation ([Confirm] / [Cancel]).
 * - Real API execution on confirmed mutations; never arbitrary server script execution.
 * Upgraded to Executive Obsidian / Dark SaaS palette with Career Odyssey accents.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryCopilot, getCopilotContext, getCopilotStatus } from '../../api/copilot.api';
import { getSkillProfile, updateSkillProfile } from '../../api/skillProfile.api';
import { createReminder } from '../../api/reminders.api';
import { ROUTES } from '../../utils/constants';

/* ── Inline SVG Icons ────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const ICONS = {
  sparkles: (
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  bot: (
    <>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8.01" y2="16" />
      <line x1="16" y1="16" x2="16.01" y2="16" />
    </>
  ),
};

const QUICK_PROMPTS = [
  'What should I do today?',
  'Why is my Career Health low?',
  'Which skill should I learn first?',
  'Which applications need attention?',
  'Prepare me for my interview',
  'How can I improve my resume?',
  'What project should I build next?',
  'What are my biggest career gaps?',
  'Am I ready to apply for this job?',
];

export default function Copilot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [copilotStatus, setCopilotStatus] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const chatBottomRef = useRef(null);

  // Load initial career context and diagnostic status
  useEffect(() => {
    let isMounted = true;
    getCopilotContext()
      .then((res) => {
        if (isMounted && res.success) {
          setContext(res.data);
        }
      })
      .catch(() => {
        // Silent fallback for context prefetch
      });

    getCopilotStatus()
      .then((res) => {
        if (isMounted && res.success) {
          setCopilotStatus(res.data);
        }
      })
      .catch(() => {
        // Silent fallback for status prefetch
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, pendingAction]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const response = await queryCopilot({ message: queryText });
      if (response.success && response.data) {
        const copilotMessage = {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          data: response.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, copilotMessage]);
      } else {
        throw new Error('No data received from Copilot');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-err-${Date.now()}`,
          sender: 'copilot',
          isError: true,
          text: 'Unable to analyze your career data right now. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === 'NAVIGATION') {
      const route = action.payload?.route || getRouteForAction(action.actionType);
      if (route) navigate(route);
    } else if (action.type === 'MUTATION') {
      setPendingAction(action);
    }
  };

  const getRouteForAction = (actionType) => {
    switch (actionType) {
      case 'OPEN_PROFILE': return ROUTES.STUDENT_PROFILE;
      case 'OPEN_CAREER_GOAL': return ROUTES.STUDENT_CAREER_GOAL;
      case 'OPEN_SKILLS': return ROUTES.STUDENT_SKILLS;
      case 'OPEN_SKILL_GAP': return ROUTES.STUDENT_SKILL_GAP;
      case 'OPEN_DSA': return ROUTES.STUDENT_DSA;
      case 'OPEN_GITHUB': return ROUTES.STUDENT_GITHUB;
      case 'OPEN_RESUME': return ROUTES.STUDENT_RESUME;
      case 'OPEN_PROJECTS': return ROUTES.STUDENT_PROJECTS;
      case 'OPEN_ROADMAP': return ROUTES.STUDENT_ROADMAP;
      case 'OPEN_OPPORTUNITIES': return ROUTES.STUDENT_OPPORTUNITIES;
      case 'OPEN_APPLICATIONS': return ROUTES.STUDENT_APPLICATIONS;
      case 'OPEN_ANALYTICS': return ROUTES.STUDENT_ANALYTICS;
      case 'OPEN_REMINDERS':
      case 'OPEN_DAILY_PLAN': return ROUTES.STUDENT_REMINDERS;
      default: return null;
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      if (pendingAction.actionType === 'ADD_SKILL') {
        const { skillName, level } = pendingAction.payload;
        const profileRes = await getSkillProfile();
        const currentSkills = profileRes.profile?.skills || [];
        
        // Prevent duplicate entry
        const exists = currentSkills.some(
          (s) => s.name.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          const updatedSkills = [
            ...currentSkills,
            { name: skillName, level: level || 'beginner', yearsOfExperience: 0 },
          ];
          await updateSkillProfile({ skills: updatedSkills });
          setActionSuccess(`Successfully added ${skillName} to your Skills inventory!`);
        } else {
          setActionSuccess(`${skillName} is already present in your skills profile.`);
        }
      } else if (pendingAction.actionType === 'CREATE_REMINDER') {
        const payload = pendingAction.payload;
        await createReminder({
          title: payload.title,
          description: payload.description || '',
          priority: payload.priority || 'HIGH',
          type: payload.type || 'CUSTOM',
          dueAt: payload.dueAt || new Date().toISOString(),
        });
        setActionSuccess(`Reminder "${payload.title}" created successfully!`);
      }
      setPendingAction(null);
    } catch (err) {
      setActionError(err.message || 'Failed to complete requested action.');
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-zinc-100">
      
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f121d] via-[#0d101a] to-[#0b0d13] border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full animate-pulse ${copilotStatus?.llmEnabled ? 'bg-purple-400' : 'bg-orange-500'}`} />
              <span className={`text-[11px] font-mono tracking-wider uppercase font-semibold ${copilotStatus?.llmEnabled ? 'text-purple-300' : 'text-orange-400'}`}>
                Career Copilot
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {copilotStatus?.llmEnabled ? 'LLM Enhanced' : 'Smart Career Mode'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Copilot</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Your personalized career decision assistant powered directly by your real platform milestones, skill gaps, application statuses, and daily execution velocity.
            </p>
          </div>

          {context && (
            <div className="flex items-center gap-4 bg-black/40 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-md self-start lg:self-auto shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Target Role</span>
                <span className="text-sm font-bold text-white font-mono">
                  {context.careerGoal?.targetRole || 'Not set'}
                </span>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Health Score</span>
                <span className={`text-sm font-bold font-mono ${
                  (context.analytics?.careerHealthScore ?? 0) >= 70
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {context.analytics?.careerHealthScore !== null
                    ? `${context.analytics.careerHealthScore}/100`
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Icon d={ICONS.sparkles} size={13} className="text-orange-400" />
            <span>Suggested Inquiries:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-orange-500/15 hover:text-orange-300 hover:border-orange-500/30 border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Global Action Notifications ───────────────────────────── */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Icon d={ICONS.checkCircle} size={16} />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer p-1"
          >
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between shadow-lg shadow-rose-500/10 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Icon d={ICONS.alertTriangle} size={16} />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200 cursor-pointer p-1"
          >
            <Icon d={ICONS.close} size={15} />
          </button>
        </div>
      )}

      {/* ── Action Confirmation Box ───────────────────────────────── */}
      {pendingAction && (
        <div className="rounded-2xl bg-[#0d101a] border border-orange-500/40 p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
            <Icon d={ICONS.alertTriangle} size={16} />
            <span>Action Confirmation Required</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {pendingAction.confirmationPrompt || `Confirm execution of: ${pendingAction.label}?`}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Confirm Action
            </button>
            <button
              onClick={handleCancelAction}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Container ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d101a]/90 border border-white/[0.08] min-h-[480px] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* Messages Feed */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[620px]">
          {messages.length === 0 ? (
            <div className="text-center my-auto py-16 px-4 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
                <Icon d={ICONS.bot} size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white tracking-tight">Ask Your Career Copilot</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Copilot synthesizes your real metrics, active applications, skill gaps, and daily roadmap tasks to answer "What should I do next?" with high-precision guidance.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2">
                  <span>{msg.sender === 'user' ? 'You' : 'Career Copilot'} • {msg.timestamp}</span>
                  {msg.sender !== 'user' && !msg.isError && (
                    msg.data?.mode === 'llm_enhanced' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        LLM Enhanced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Smart Career Mode
                      </span>
                    )
                  )}
                </div>

                {msg.sender === 'user' ? (
                  <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-xl text-sm leading-relaxed shadow-md shadow-orange-500/15">
                    {msg.text}
                  </div>
                ) : msg.isError ? (
                  <div className="bg-rose-500/10 text-rose-300 border border-rose-500/25 px-4 py-3 rounded-2xl rounded-tl-sm max-w-2xl text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-[#111422]/90 border border-white/[0.08] p-5 rounded-2xl rounded-tl-sm max-w-3xl space-y-4 shadow-lg backdrop-blur-md">
                    {/* Mode Notice for Copilot Responses */}
                    {msg.data?.mode === 'llm_enhanced' ? (
                      <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 pb-1 border-b border-white/[0.04]">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>AI-generated response based on your Career Odyssey data.</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 pb-1 border-b border-white/[0.04]">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span>Smart Career Mode is using Career Odyssey verified career data.</span>
                      </div>
                    )}

                    {/* Answer text */}
                    <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                      {msg.data.answer}
                    </div>

                    {/* Evidence Chips */}
                    {msg.data.evidence?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.data.evidence.map((ev, i) => (
                          <div
                            key={i}
                            className="bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5"
                          >
                            <span className="text-zinc-400">{ev.label}:</span>
                            <span className={`font-bold ${
                              ev.status === 'GOOD'
                                ? 'text-emerald-400'
                                : ev.status === 'WARN'
                                ? 'text-amber-400'
                                : 'text-zinc-200'
                            }`}>
                              {ev.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations Cards */}
                    {msg.data.recommendations?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400">
                          Key Recommendations
                        </span>
                        <div className="space-y-2">
                          {msg.data.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white">{rec.title}</span>
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                    rec.priority === 'URGENT'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                      : rec.priority === 'HIGH'
                                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">{rec.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Action Buttons */}
                    {msg.data.suggestedActions?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                        {msg.data.suggestedActions.map((act) => (
                          <button
                            key={act.id}
                            onClick={() => handleActionClick(act)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                              act.type === 'MUTATION'
                                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20 hover:from-orange-500 hover:to-amber-500'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1]'
                            }`}
                          >
                            <span>{act.label}</span>
                            {act.type === 'NAVIGATION' ? (
                              <Icon d={ICONS.arrowRight} size={12} />
                            ) : (
                              <Icon d={ICONS.plus} size={12} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 text-orange-400 text-xs font-mono py-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0a0c13] border-t border-white/[0.08]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about your career goals, gaps, applications, or next steps..."
              maxLength={1000}
              disabled={loading}
              className="flex-1 bg-[#131722] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              <span>Ask Copilot</span>
              <Icon d={ICONS.send} size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}