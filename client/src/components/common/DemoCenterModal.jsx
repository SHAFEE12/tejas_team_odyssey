/**
 * DemoCenterModal.jsx — SIH 26044 Demo Center
 *
 * Unobtrusive on-demand modal for hackathon evaluation and role switching:
 * - Available via User Profile / Header menu / Settings or Ctrl+Shift+D
 * - 1-Click Role Switcher: Student, Academia, Industry, Admin
 * - 10-Step Judge Demo Guide
 * - Deterministic Demo Data Reset with confirmation dialog
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, ROUTES } from '../../utils/constants';
import { getToken, setToken, setUser, getUser } from '../../utils/storage';

export default function DemoCenterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser());
  const [isSwitching, setIsSwitching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, [isOpen]);

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRoleSwitch = async (roleKey, targetRoute) => {
    try {
      setIsSwitching(true);
      const res = await fetch(`${API_URL}/api/demo/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        setToken(data.data.token);
        setUser(data.data.user);
        setCurrentUser(data.data.user);
        showNotification(`Switched to ${data.data.metadata?.name} (${roleKey.toUpperCase()})`);
        window.dispatchEvent(new Event('storage'));
        if (onClose) onClose();
        navigate(targetRoute);
      } else {
        showNotification(data.message || 'Role switch failed', 'error');
      }
    } catch (err) {
      console.error('Demo role switch error:', err);
      showNotification('Network error switching demo account', 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      const res = await fetch(`${API_URL}/api/demo/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Demo data reset successfully to deterministic state!');
        setShowResetConfirm(false);
        setTimeout(() => {
          if (onClose) onClose();
          window.location.reload();
        }, 1000);
      } else {
        showNotification(data.message || 'Reset failed', 'error');
      }
    } catch (err) {
      console.error('Demo reset error:', err);
      showNotification('Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const activeRole = currentUser?.role?.toLowerCase() || '';

  const roles = [
    {
      key: 'student',
      label: 'Student',
      persona: 'Aarav Sharma',
      desc: 'Health Informatics (8th Sem, CGPA 8.75)',
      route: '/student/dashboard',
      badge: 'High Fit Candidate',
      accent: 'border-orange-500/30 hover:border-orange-500/60 bg-orange-500/5',
      activeBorder: 'border-orange-500 bg-orange-500/10 text-orange-400',
    },
    {
      key: 'academia',
      label: 'Academia',
      persona: 'Dr. V. K. Sharma',
      desc: 'Dean & Faculty Skill Evaluator',
      route: '/academia/overview',
      badge: 'Faculty Authority',
      accent: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5',
      activeBorder: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
    },
    {
      key: 'industry',
      label: 'Industry',
      persona: 'Ayush HealthTech Recruiter',
      desc: 'Talent Lead & Interview Evaluator',
      route: '/industry/dashboard',
      badge: 'Recruiter Partner',
      accent: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5',
      activeBorder: 'border-purple-500 bg-purple-500/10 text-purple-400',
    },
    {
      key: 'admin',
      label: 'Admin',
      persona: 'Prof. K. R. Mehra',
      desc: 'AIIA Campus Institutional Lead',
      route: '/institution/dashboard',
      badge: 'Campus Admin',
      accent: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
      activeBorder: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    },
  ];

  const guideSteps = [
    { num: '1', title: 'Student', desc: 'Login as Aarav Sharma, define target career goal, and review career readiness baseline.' },
    { num: '2', title: 'Assessment', desc: 'Take EHR & Clinical Standards technical assessment with secure option-masking and auto-grading.' },
    { num: '3', title: 'Skill Profile', desc: 'View multi-source evidence scoring establishing Level 0–5 proficiency badges.' },
    { num: '4', title: 'Faculty Verification', desc: 'Switch to Academia (Dr. Sharma) to audit student artifacts and issue official sign-off.' },
    { num: '5', title: 'Skill Gap', desc: 'Inspect missing competencies benchmarked against national clinical industry standards.' },
    { num: '6', title: 'Internship Match', desc: 'View 9-factor explainable match breakdown (86% EXCELLENT MATCH) for Ayush HealthTech.' },
    { num: '7', title: 'Application', desc: 'Submit 1-click centralized internship application (tracked in INTERVIEW stage).' },
    { num: '8', title: 'Industry Evaluation', desc: 'Switch to Industry to review candidates and submit structured evaluation rubric with HIRE recommendation.' },
    { num: '9', title: 'Academia Analytics', desc: 'Inspect institutional talent supply vs employer demand parity and placement cycles.' },
    { num: '10', title: 'Feedback Loop', desc: 'Recruiter evaluation weaknesses automatically populate student skill gap recommendations and dynamic roadmap.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border flex items-center gap-2 ${
          toast.type === 'error'
            ? 'bg-red-950/90 text-red-200 border-red-500/40'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-[#0e111a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141926]/50">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/25">
              SIH 26044
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Demo Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active Persona Banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Active Session</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {currentUser?.name || 'Authenticated User'}{' '}
                <span className="text-xs font-medium text-orange-400 capitalize">({currentUser?.role || 'Guest'})</span>
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </div>

          {/* Role Switching Grid */}
          <div>
            <p className="text-xs font-bold text-zinc-300 mb-2.5 uppercase tracking-wider">Switch Canonical Role</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roles.map((r) => {
                const isActive = activeRole === r.key || (r.key === 'admin' && activeRole.includes('admin'));
                return (
                  <button
                    key={r.key}
                    disabled={isSwitching}
                    onClick={() => handleRoleSwitch(r.key, r.route)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isActive ? r.activeBorder : r.accent
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                        {r.label}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium">{r.badge}</span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{r.persona}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 10-Step Demo Flow Toggle */}
          <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Judge Demo Flow (10-Step Guide)
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{showGuide ? 'Hide ▲' : 'Open Demo Flow ▼'}</span>
            </button>

            {showGuide && (
              <div className="p-4 border-t border-white/[0.08] space-y-2 bg-[#0a0c13]/60">
                {guideSteps.map((s) => (
                  <div key={s.num} className="flex items-start gap-2.5 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/10 text-orange-400 font-bold text-[10px] shrink-0 border border-orange-500/20">
                      {s.num}
                    </span>
                    <div>
                      <strong className="text-zinc-200">{s.title}:</strong>{' '}
                      <span className="text-zinc-400 text-[11px]">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Demo Data Section */}
          <div className="pt-2 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-zinc-200">Reset Demo Data</p>
              <p className="text-[11px] text-zinc-500">Restore known baseline state for students, faculty, and partner postings.</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            >
              Reset Demo Data
            </button>
          </div>
        </div>

        {/* Confirmation Modal for Reset */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#121624] border border-red-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-lg font-bold border border-red-500/20">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset SIH demo data?</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  This resets only designated demo records. Real user data is not affected.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Reset Demo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}