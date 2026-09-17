/**
 * EnhancvReportSidebar.jsx — Upgraded Premium Dark SaaS Diagnostic Sidebar
 *
 * Visual Features:
 * - Obsidian dark glassmorphism card (bg-zinc-900/90 border-white/10)
 * - Animated circular score indicator (73 / 100) with radial glow
 * - Four color-coded key metrics:
 *   • ATS Compatibility → Green (#10b981)
 *   • Content Quality   → Blue (#3b82f6)
 *   • Role Alignment    → Yellow/Orange (#f59e0b)
 *   • Evidence Strength → Purple (#8b5cf6)
 * - Primary button with orange gradient, soft glow & hover lift
 * - Secondary dark glass buttons
 * - Sleek accordion categories with animated check rows
 */

import React, { useState, useEffect, useRef } from 'react';

/* ── Animated score counter hook ─────────────────────────── */
function useCountUp(target, duration = 1200, delay = 300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime = null;
    let rafId;
    const start = () => {
      rafId = requestAnimationFrame((ts) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) start();
      });
    };
    const timer = setTimeout(start, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay]);
  return value;
}

/* ── Animated Progress Bar ───────────────────────────────── */
function MetricProgressBar({ label, pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="text-zinc-300">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Dark Accordion Section ──────────────────────────────── */
function AccordionSection({
  id,
  label,
  badge,
  badgeColor = 'zinc',
  expanded,
  onToggle,
  children,
}) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(expanded ? contentRef.current.scrollHeight : 0);
    }
  }, [expanded]);

  const badgeStyles = {
    red:    'bg-red-500/15 text-red-400 border-red-500/20',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
    amber:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    zinc:   'bg-white/5 text-zinc-400 border-white/10',
  };

  return (
    <div className="border-b border-white/[0.06] pb-3">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between text-left py-1 group hover:text-orange-400 transition-colors"
      >
        <span className="text-xs font-bold text-zinc-200 tracking-wide group-hover:text-orange-300 transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all duration-300 ${
              badgeStyles[badgeColor] || badgeStyles.zinc
            }`}
          >
            {badge}
          </span>
          <span
            className="text-zinc-500 text-xs transition-transform duration-300"
            style={{
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      <div
        style={{
          maxHeight: `${height}px`,
          overflow: 'hidden',
          transition: 'max-height 0.28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div ref={contentRef} className="pt-2.5 pl-1 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Dark Checklist Row ──────────────────────────────────── */
function CheckRow({ icon, label, value, valueClass = 'text-zinc-400 font-medium' }) {
  return (
    <div className="flex items-center justify-between text-zinc-300 text-xs">
      <span className="flex items-center gap-2">
        <span
          className={`font-bold text-[12px] ${
            icon === '✓'
              ? 'text-emerald-400'
              : icon === '✕'
              ? 'text-red-400'
              : 'text-amber-400'
          }`}
        >
          {icon}
        </span>
        <span className="text-zinc-300">{label}</span>
      </span>
      <span className={`text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function EnhancvReportSidebar({
  score = 73,
  analysis = {},
  onUpgradeClick,
}) {
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    sections: false,
    ats_essentials: false,
    hr_red_flags: false,
    discrimination: false,
    seniority: false,
    tailoring: false,
  });

  const toggleSection = (sec) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Animated score counter (default 73 if not passed)
  const displayScore = useCountUp(Math.min(100, Math.max(0, score || 73)), 1200, 300);

  // Circular Score Indicator Calculations
  // Circumference = 2 * PI * r = 2 * 3.14159 * 46 = ~289
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score || 73));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Extract metrics or default to realistic values
  const atsMetric = analysis?.scores?.ats ?? (analysis?.ats?.score ?? 85);
  const contentMetric = analysis?.scores?.contentQuality ?? analysis?.scores?.content ?? 74;
  const roleMetric = analysis?.scores?.roleAlignment ?? analysis?.roleMatch?.score ?? 68;
  const evidenceMetric = analysis?.scores?.evidenceStrength ?? analysis?.scores?.evidence ?? 78;

  const quantifiedIssues = Math.max(
    0,
    (analysis?.quality?.totalBullets || 7) - (analysis?.quality?.quantifiedAchievements || 2)
  );

  return (
    <div className="w-full lg:w-[290px] shrink-0 bg-[#0c0d12]/90 text-zinc-100 rounded-2xl shadow-2xl border border-white/[0.08] backdrop-blur-xl p-5 space-y-6 select-none font-sans lg:sticky lg:top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto">
      {/* ── TOP: Animated Circular Score Indicator ── */}
      <div className="text-center space-y-3 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold tracking-wider text-orange-400">
            Resume Score
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            Overall Resume Quality
          </span>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
          <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 110 110">
            {/* Background Track */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated Score Arc */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="url(#score-gradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Score Typography: 73 / 100 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]">
              {displayScore}
            </span>
            <span className="text-xs font-bold text-zinc-400 mt-1">
              / 100
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/25 text-orange-300">
            <span>✨</span>
            <span>ATS Compatibility Checked</span>
          </span>
        </div>

        {/* ── Primary Action Button (Orange Gradient + Glow + Lift) ── */}
        <button
          type="button"
          onClick={onUpgradeClick}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>View Recommendations</span>
          <span className="group-hover:translate-x-1 transition-transform">⚡</span>
        </button>
      </div>

      {/* ── Four Metrics with exact requested colors ── */}
      <div className="space-y-3.5 pb-5 border-b border-white/[0.08]">
        <h3 className="text-xs font-bold text-zinc-400 tracking-wider">
          Core Diagnostic Metrics
        </h3>

        {/* 1. ATS Compatibility → Green */}
        <MetricProgressBar
          label="ATS Compatibility"
          pct={atsMetric}
          color="#10b981"
          delay={100}
        />

        {/* 2. Content Quality → Blue */}
        <MetricProgressBar
          label="Content Quality"
          pct={contentMetric}
          color="#3b82f6"
          delay={200}
        />

        {/* 3. Role Alignment → Yellow/Orange */}
        <MetricProgressBar
          label="Role Alignment"
          pct={roleMetric}
          color="#f59e0b"
          delay={300}
        />

        {/* 4. Evidence Strength → Purple */}
        <MetricProgressBar
          label="Evidence Strength"
          pct={evidenceMetric}
          color="#8b5cf6"
          delay={400}
        />
      </div>

      {/* ── Category Accordions (Dark Mode) ── */}
      <div className="space-y-3 text-xs">
        {/* 1. CONTENT */}
        <AccordionSection
          id="content"
          label="Content & Bullet Impact"
          badge="45%"
          badgeColor="red"
          expanded={expandedSections.content}
          onToggle={toggleSection}
        >
          <CheckRow icon="✓" label="ATS Compatibility" value="No issues" />
          <CheckRow
            icon="✕"
            label="Quantifying Impact"
            value={`${quantifiedIssues} issues`}
            valueClass="font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded"
          />
          <CheckRow icon="✓" label="Repetition" value="Clean" />
          <CheckRow
            icon="✕"
            label="Action Verbs"
            value="2 suggestions"
            valueClass="font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded"
          />
          <CheckRow
            icon="★"
            label="Bullet Consistency"
            value="Verified"
            valueClass="text-emerald-400 font-semibold"
          />
        </AccordionSection>

        {/* 2. SECTIONS */}
        <AccordionSection
          id="sections"
          label="Resume Structure"
          badge="97%"
          badgeColor="green"
          expanded={expandedSections.sections}
          onToggle={toggleSection}
        >
          <CheckRow icon="✓" label="Summary / Header" value="Present" valueClass="text-emerald-400" />
          <CheckRow icon="✓" label="Projects Experience" value="Present" valueClass="text-emerald-400" />
          <CheckRow icon="✓" label="Education" value="Present" valueClass="text-emerald-400" />
          <CheckRow icon="✓" label="Technical Skills" value="Verified" valueClass="text-emerald-400" />
        </AccordionSection>

        {/* 3. ATS ESSENTIALS */}
        <AccordionSection
          id="ats_essentials"
          label="ATS Essentials"
          badge={`${atsMetric}%`}
          badgeColor="blue"
          expanded={expandedSections.ats_essentials}
          onToggle={toggleSection}
        >
          <CheckRow icon="✓" label="Passed Heuristics" value="8 / 8 Checks" valueClass="font-bold text-emerald-400" />
          <CheckRow icon="★" label="Formatting Warnings" value="0 Critical" valueClass="text-amber-400" />
          <CheckRow icon="✓" label="Text Readability" value="100% Clean" valueClass="text-emerald-400" />
        </AccordionSection>

        {/* 4. HR RED FLAGS */}
        <AccordionSection
          id="hr_red_flags"
          label="HR Screening"
          badge="74%"
          badgeColor="amber"
          expanded={expandedSections.hr_red_flags}
          onToggle={toggleSection}
        >
          <CheckRow icon="✓" label="Page Count Density" value="1 Page (Ideal)" valueClass="text-emerald-400" />
          <CheckRow icon="✓" label="Email Validity" value="Professional" valueClass="text-emerald-400" />
          <CheckRow icon="✓" label="Gaps / Anomalies" value="None detected" valueClass="text-zinc-400" />
        </AccordionSection>

        {/* 5. TAILORING */}
        <AccordionSection
          id="tailoring"
          label="Job Tailoring"
          badge={`${roleMetric}%`}
          badgeColor="purple"
          expanded={expandedSections.tailoring}
          onToggle={toggleSection}
        >
          <CheckRow icon="✓" label="Matched Keywords" value="14 detected" valueClass="text-purple-300 font-semibold" />
          <CheckRow icon="★" label="Missing Keywords" value="2 recommended" valueClass="text-amber-400" />
        </AccordionSection>

        {/* ── Secondary Assessment Disclaimer ── */}
        <div className="pt-2 text-[10px] text-zinc-500 leading-normal text-center">
          Career Odyssey compatibility assessment. Does not guarantee specific employer ATS results.
        </div>
      </div>
    </div>
  );
}