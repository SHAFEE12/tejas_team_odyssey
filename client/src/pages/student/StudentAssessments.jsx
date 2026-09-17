/**
 * StudentAssessments.jsx — Skill Assessment & Questionnaire Center
 *
 * Implements SIH 26044 Requirements:
 * - Skill assessment & questionnaire testing (Technical, Aptitude, Soft Skill, Domain)
 * - Real-time MCQ execution with timer and grading
 * - Automated skill profiling & evidence logging
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAssessments,
  getMyAssessmentAttempts,
  submitAssessmentAttempt,
} from '../../api/sih.api';

export default function StudentAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'history'
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultAttempt, setResultAttempt] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assData, attData] = await Promise.all([
        getAssessments(),
        getMyAssessmentAttempts(),
      ]);

      setAssessments(assData || []);
      setAttempts(attData || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setCurrentAnswers({});
    setResultAttempt(null);
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const handleSubmitAttempt = async () => {
    if (!selectedAssessment) return;
    try {
      setSubmitting(true);
      const answersPayload = Object.entries(currentAnswers).map(([qIdx, optIdx]) => ({
        questionIndex: Number(qIdx),
        selectedOption: Number(optIdx),
      }));

      const resData = await submitAssessmentAttempt(selectedAssessment._id, answersPayload);
      setResultAttempt(resData);
      fetchData(); // Refresh history
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Skill Assessments &amp; Testing
            </h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SIH 26044
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Take structured aptitude, technical, and domain assessments authored by academic faculty.
            Passing scores directly strengthen your verified skill profile and internship eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setSelectedAssessment(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'catalog' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📋 Assessment Catalog ({filteredAssessments.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedAssessment(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            📜 Attempt History ({attempts.length})
          </button>
        </div>
      </div>

      {/* ── Active Quiz Runner Modal ── */}
      {selectedAssessment && (
        <div className="bg-zinc-900/95 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-400">
                {selectedAssessment.type} · {selectedAssessment.category}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedAssessment.title}</h2>
              <p className="text-xs text-zinc-400 mt-1">{selectedAssessment.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                ⏱ {selectedAssessment.duration} Mins
              </span>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                Exit Assessment
              </button>
            </div>
          </div>

          {/* Result view if submitted */}
          {resultAttempt ? (
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-blue-500/20 border border-blue-500/30">
                {resultAttempt.passed ? '🎉' : '📈'}
              </div>
              <h3 className="text-2xl font-bold text-white">
                {resultAttempt.passed ? 'Assessment Passed!' : 'Assessment Completed'}
              </h3>
              <p className="text-sm text-zinc-400">
                You scored <strong className="text-white font-bold">{resultAttempt.score}%</strong>{' '}
                ({resultAttempt.totalMarks} / {resultAttempt.maxPossibleMarks} marks).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto pt-3">
                {resultAttempt.skillScores?.map((s, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 text-left">
                    <div className="text-xs font-bold text-zinc-200 truncate">{s.skillName}</div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-zinc-400">{s.correctCount}/{s.totalCount} correct</span>
                      <span className="font-bold text-emerald-400">{s.score}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setActiveTab('history');
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg"
                >
                  View in History &amp; Skills
                </button>
              </div>
            </div>
          ) : (
            /* Questions List */
            <div className="space-y-6">
              {selectedAssessment.questions && selectedAssessment.questions.length > 0 ? (
                selectedAssessment.questions.map((q, qIdx) => (
                  <div key={q._id || qIdx} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-bold text-white leading-relaxed">
                        Q{qIdx + 1}. {q.question}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 shrink-0">
                        {q.marks || 1} mark
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = currentAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`p-3 rounded-lg text-left text-xs font-medium transition-all border flex items-center gap-2.5 ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/40'
                                : 'bg-white/[0.02] border-white/10 text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                                isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-zinc-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400 text-center py-6">No questions authored for this test yet.</p>
              )}

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSubmitAttempt}
                  disabled={submitting || Object.keys(currentAnswers).length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? 'Submitting & Grading...' : 'Submit Answers'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Catalog View ── */}
      {!selectedAssessment && activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'TECHNICAL', 'APTITUDE', 'SOFT_SKILL', 'DOMAIN', 'CAREER_INTEREST'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading assessments...</div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 text-sm">
              No assessments found for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssessments.map((a) => (
                <div
                  key={a._id}
                  className="p-6 bg-zinc-900/80 border border-white/[0.08] hover:border-blue-500/40 rounded-2xl shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-bold">
                        {a.type}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">⏱ {a.duration}m</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{a.description}</p>

                    {a.skills && a.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {a.skills.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">
                      Pass: <strong className="text-white">{a.passingScore}%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartAssessment(a)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                    >
                      Start Assessment →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History View ── */}
      {!selectedAssessment && activeTab === 'history' && (
        <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Your Past Assessments</h3>
            <span className="text-xs text-zinc-400 font-mono">{attempts.length} attempts recorded</span>
          </div>

          {attempts.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">You haven't completed any assessments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-white/[0.03] text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Assessment</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-bold text-white">{att.assessmentId?.title || 'Assessment'}</td>
                      <td className="p-4 text-zinc-400 font-mono">{att.assessmentId?.category || 'Technical'}</td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-white font-mono">{att.score}%</span>
                        <span className="text-[11px] text-zinc-500 ml-1">({att.totalMarks}/{att.maxPossibleMarks})</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            att.passed
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {att.passed ? 'PASSED' : 'COMPLETED'}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 font-mono">
                        {new Date(att.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}