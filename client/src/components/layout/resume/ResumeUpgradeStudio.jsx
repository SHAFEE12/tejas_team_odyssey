/**
 * ResumeUpgradeStudio.jsx — Interactive Resume Studio & Layout Customizer
 *
 * Provides:
 * 1. Industry Layout Switcher (Modern 2-Col Enhancv, Minimal ATS FAANG, Executive, Compact Dev)
 * 2. Accent Color Palette Selector
 * 3. Smart Bullet Point Optimizer (transforms weak statements into metric-backed impact statements)
 * 4. Multi-Format Downloads (Vector PDF via window.print(), ATS Plain Text .txt, Markdown .md, Original File)
 */

import React, { useState } from 'react';
import { downloadOriginalResume } from '../../api/resume.api';

// Power action verbs and metrics for bullet upgrades
const ACTION_VERB_PATTERNS = [
  { weak: /worked on|helped with|collaborated on/i, strong: 'Spearheaded cross-functional delivery of', metric: 'reducing turnaround time by 22%' },
  { weak: /built|created|made/i, strong: 'Architected and deployed production-grade', metric: 'scaling to 10k+ requests with 99.9% uptime' },
  { weak: /improved|updated/i, strong: 'Engineered performance optimizations for', metric: 'reducing page load latency by 38%' },
  { weak: /practiced|used/i, strong: 'Implemented industry-standard best practices in', metric: 'enforcing 100% CI/CD code coverage' },
  { weak: /responsible for/i, strong: 'Orchestrated end-to-end execution of', metric: 'accelerating feature delivery cycles by 30%' },
];

export default function ResumeUpgradeStudio({
  layout,
  setLayout,
  accentColor,
  setAccentColor,
  candidateData,
  projectsData,
  onApplyUpgradedBullet,
  originalFileName,
}) {
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('design'); // 'design' | 'bullet_booster' | 'export'

  // Available Layouts
  const layouts = [
    {
      id: 'modern-ats',
      name: 'Single-Column ATS Standard',
      tag: 'Verified Gold Standard',
      desc: 'Linear single-column reading flow, categorized skills, and verified ATS compatibility.',
      badge: 'Recommended',
    },
    {
      id: 'minimal-ats',
      name: 'Minimalist ATS Standard',
      tag: 'FAANG / Stanford',
      desc: 'Single column, linear reading flow, clean parser compatibility.',
      badge: 'Clean Text',
    },
    {
      id: 'executive',
      name: 'Executive Clean',
      tag: 'Modern Timeline',
      desc: 'Bold left accent bar with chronological career milestone indicators.',
      badge: 'Leadership',
    },
    {
      id: 'compact-dev',
      name: 'Compact Engineering',
      tag: 'Dense Tech Grid',
      desc: 'Optimized for experienced software developers with multi-stack badges.',
      badge: 'Dev Stack',
    },
  ];

  // Palette Choices
  const colors = [
    { name: 'Slate Teal', value: '#2f4858' },
    { name: 'Tech Blue', value: '#0070f3' },
    { name: 'Odyssey Orange', value: '#FC8200' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Slate', value: '#334155' },
    { name: 'Rose', value: '#f43f5e' },
  ];

  // Handle PDF Print
  const handlePrintPDF = () => {
    window.print();
  };

  // Generate and download ATS Plain Text
  const handleDownloadPlainText = () => {
    const name = candidateData?.name || 'Candidate';
    const email = candidateData?.email || '';
    const phone = candidateData?.phone || '';
    const loc = candidateData?.location || '';

    let content = `${name.toUpperCase()}\n`;
    content += `Contact: ${email} | ${phone} | ${loc}\n`;
    content += `${'='.repeat(60)}\n\n`;

    if (projectsData && projectsData.length > 0) {
      content += `PROJECTS & EXPERIENCE\n`;
      content += `${'-'.repeat(40)}\n`;
      projectsData.forEach((p) => {
        content += `${p.name} [${p.technologies?.join(', ') || 'Tech'}]\n`;
        p.bullets?.forEach((b) => {
          content += `  * ${b}\n`;
        });
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}_Resume_ATS.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate and download Markdown
  const handleDownloadMarkdown = () => {
    const name = candidateData?.name || 'Candidate';
    const email = candidateData?.email || '';
    const phone = candidateData?.phone || '';
    const loc = candidateData?.location || '';

    let content = `# ${name}\n\n`;
    content += `**Contact:** [${email}](mailto:${email}) | ${phone} | ${loc}\n\n`;
    content += `---\n\n`;

    if (projectsData && projectsData.length > 0) {
      content += `## Projects & Experience\n\n`;
      projectsData.forEach((p) => {
        content += `### ${p.name}\n`;
        if (p.technologies?.length) {
          content += `*Tech Stack: ${p.technologies.join(', ')}*\n\n`;
        }
        p.bullets?.forEach((b) => {
          content += `- ${b}\n`;
        });
        content += `\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}_Resume.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Original Download
  const handleDownloadOriginal = async () => {
    setDownloadingOriginal(true);
    try {
      const blob = await downloadOriginalResume();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName || 'Original_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Unable to download original file. Please re-upload or try again.');
    } finally {
      setDownloadingOriginal(false);
    }
  };

  // Generate suggestions for weak bullets
  const generateBulletSuggestion = (bullet) => {
    let upgraded = bullet;
    let matched = false;

    for (const pattern of ACTION_VERB_PATTERNS) {
      if (pattern.weak.test(bullet)) {
        upgraded = bullet.replace(pattern.weak, pattern.strong) + `, ${pattern.metric}.`;
        matched = true;
        break;
      }
    }

    if (!matched) {
      upgraded = `Engineered ${bullet.replace(/^[•\s\-]*/, '')}, improving performance and efficiency by 25%.`;
    }

    return upgraded;
  };

  // Collect all bullets from projects
  const allBullets = (projectsData || []).flatMap((p, pIdx) =>
    (p.bullets || []).map((b, bIdx) => ({
      projName: p.name,
      projIndex: pIdx,
      bulletIndex: bIdx,
      text: b,
      isQuantified: /\d+%|\d+k|\d+\+|\$\d+|\b\d+\b/i.test(b),
    }))
  );

  return (
    <div className="rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card-bg)] p-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0070f3] animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Resume Modernization Studio
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0070f3]/20 text-[#60a5fa] border border-[#0070f3]/30">
              Resume Studio
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Transform parsed data into modern clean layouts, optimize bullet points, and export in multiple formats.
          </p>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] shrink-0">
          <button
            onClick={() => setActiveTab('design')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'design'
                ? 'bg-[#0070f3] text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎨 Layout & Accent
          </button>
          <button
            onClick={() => setActiveTab('bullet_booster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'bullet_booster'
                ? 'bg-[#0070f3] text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚡ Bullet Booster
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300">
              {allBullets.filter((b) => !b.isQuantified).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-[#0070f3] text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📥 Download / Export
          </button>
        </div>
      </div>

      {/* ── TAB 1: Layout & Accent Customizer ── */}
      {activeTab === 'design' && (
        <div className="space-y-6">
          {/* Layout Selector Grid */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">
              Select Modern Industry Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {layouts.map((l) => {
                const isSelected = layout === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between h-full min-h-[175px] ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white leading-tight">{l.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono shrink-0 ml-2">
                          {l.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4 flex-1">{l.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
                      <span className="text-blue-400 font-semibold">{l.tag}</span>
                      {isSelected ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Active
                        </span>
                      ) : (
                        <span className="text-zinc-400">Click to apply</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Chooser */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
              Accent Color Palette
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAccentColor(c.value)}
                  aria-label={`Select ${c.name} accent color`}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    accentColor === c.value
                      ? 'border-white/80 text-white bg-white/15 ring-2 ring-white/25 shadow-sm'
                      : 'border-white/[0.08] text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/30 shadow-sm shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: c.value }}
                    aria-hidden="true"
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Bullet Point Optimizer ── */}
      {activeTab === 'bullet_booster' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed flex items-start gap-2.5">
            <span className="text-base">💡</span>
            <div>
              <span className="font-bold block text-blue-200 mb-0.5">
                Content & Evidence Impact Booster
              </span>
              Strong engineering resumes emphasize numbers, scale, and action verbs. Below are suggestions
              to elevate weak or non-quantified bullets into impactful STAR-format statements.
            </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {allBullets.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-4 text-center">
                No project bullets detected to optimize.
              </p>
            ) : (
              allBullets.map((b, idx) => {
                const suggestion = generateBulletSuggestion(b.text);
                const isCopied = copiedIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      b.isQuantified
                        ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                        : 'border-amber-500/20 bg-amber-500/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-300 tracking-wide">
                        {b.projName} · Bullet #{b.bulletIndex + 1}
                      </span>
                      {b.isQuantified ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Quantified Metric Present
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠ Needs Measurable Impact
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-zinc-500 block mb-0.5">
                          Current:
                        </span>
                        <p className="text-zinc-300 italic pl-2 border-l-2 border-zinc-700">
                          "{b.text}"
                        </p>
                      </div>

                      {!b.isQuantified && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-emerald-400 block mb-0.5">
                            Suggested Improvement:
                          </span>
                          <p className="text-emerald-300 font-medium pl-2 border-l-2 border-emerald-500/60 bg-emerald-500/5 py-1 rounded-r">
                            "{suggestion}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/[0.04]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(b.isQuantified ? b.text : suggestion);
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        {isCopied ? '✓ Copied!' : 'Copy'}
                      </button>

                      {!b.isQuantified && onApplyUpgradedBullet && (
                        <button
                          onClick={() => onApplyUpgradedBullet(b.projIndex, b.bulletIndex, suggestion)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                        >
                          Apply Upgrade to Resume
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Multi-Format Download / Export ── */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Choose Export Format
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Vector PDF Export */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-sm mb-2">
                  PDF
                </div>
                <h4 className="text-xs font-bold text-white">High-Res Vector PDF</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Clean vector layout formatted for A4 print. Zero compression blur.
                </p>
              </div>
              <button
                onClick={handlePrintPDF}
                className="w-full py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 transition-all"
              >
                Print / Save PDF
              </button>
            </div>

            {/* ATS Plain Text */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                  TXT
                </div>
                <h4 className="text-xs font-bold text-white">Plain Text Format</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Standard text format structured for clean reading across application portal text boxes.
                </p>
              </div>
              <button
                onClick={handleDownloadPlainText}
                className="w-full py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all"
              >
                Download .TXT
              </button>
            </div>

            {/* Markdown */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                  MD
                </div>
                <h4 className="text-xs font-bold text-white">Tech Markdown</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Standard GitHub-flavored Markdown for technical job applications.
                </p>
              </div>
              <button
                onClick={handleDownloadMarkdown}
                className="w-full py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                Download .MD
              </button>
            </div>

            {/* Original Uploaded Document */}
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-sm mb-2">
                  DOC
                </div>
                <h4 className="text-xs font-bold text-white">Original Document</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Download the original file you previously uploaded to the platform.
                </p>
              </div>
              <button
                onClick={handleDownloadOriginal}
                disabled={downloadingOriginal}
                className="w-full py-2 rounded-lg text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                {downloadingOriginal ? 'Downloading...' : 'Get Original File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}