/**
 * ModernResumePreview.jsx — Multi-Template Industry ATS & Modern Resume Preview
 *
 * Implements 4 verified industry resume templates:
 * 1. 'modern-ats'  — Single-Column ATS Standard (Recommended, Verified Gold Standard)
 * 2. 'minimal-ats' — Minimalist ATS Standard (FAANG / Stanford clean text)
 * 3. 'executive'   — Executive Clean (14px left accent bar, Career Timeline with connected nodes)
 * 4. 'compact-dev' — Compact Engineering (SFMono monospace typography, tech badges, 2-col experience/education)
 *
 * Fully supports dynamic accent color palettes, responsive side-by-side split layouts, and vector print/PDF exports.
 */

import React from 'react';
import { categorizeSkills } from '../../utils/resumeUpgradeEngine';

// Compute harmonious accent, tint, and dark variants for any palette color
function getPaletteColors(hex = '#2f4858') {
  const map = {
    '#2f4858': { accent: '#2f4858', tint: '#E2E9ED', dark: '#1B2C36' },
    '#0070f3': { accent: '#0070f3', tint: '#E6F0FF', dark: '#004DB3' },
    '#FC8200': { accent: '#E8622C', tint: '#FBE7DC', dark: '#9A3E12' },
    '#E8622C': { accent: '#E8622C', tint: '#FBE7DC', dark: '#9A3E12' },
    '#10b981': { accent: '#059669', tint: '#D1FAE5', dark: '#065F46' },
    '#6366f1': { accent: '#4F46E5', tint: '#EEF2FF', dark: '#3730A3' },
    '#334155': { accent: '#334155', tint: '#E2E8F0', dark: '#1E293B' },
    '#f43f5e': { accent: '#E11D48', tint: '#FFE4E6', dark: '#9F1239' },
  };

  if (map[hex]) return map[hex];

  return {
    accent: hex,
    tint: `${hex}22`,
    dark: hex,
  };
}

/* ══════════════════════════════════════════════════════════════════
   1. TEMPLATE: EXECUTIVE CLEAN (Left Accent Bar + Career Timeline)
   ══════════════════════════════════════════════════════════════════ */
function ExecutiveTemplate({
  name,
  role,
  email,
  phone,
  location,
  linksList,
  profSummary,
  categorized,
  eduList,
  expList,
  projList,
  achieveList,
  palette,
  isPrintMode,
}) {
  return (
    <div
      className={`resume-printable-area w-full max-w-[780px] mx-auto bg-white text-[#1c1f22] shadow-2xl overflow-hidden transition-all flex text-left ${
        isPrintMode ? 'p-0 shadow-none border-none' : 'border border-[#d9dcdf] rounded-xl'
      }`}
      style={{
        fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: '1050px',
      }}
    >
      {/* Bold 14px Left Accent Bar */}
      <div
        className="w-[14px] shrink-0"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Main Content Area */}
      <div className="p-6 sm:p-[48px_54px_56px] flex-1 min-w-0">
        {/* Candidate Name */}
        <div className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.015em] mb-1 leading-tight text-[#1c1f22]">
          {name}
        </div>

        {/* Candidate Role */}
        <div
          className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.05em] mb-3.5"
          style={{ color: palette.accent }}
        >
          {role}
        </div>

        {/* Contact Info Header Row with 2px bottom border */}
        <div className="text-[12.5px] text-[#565f68] flex flex-wrap items-center gap-x-3.5 gap-y-1 pb-4 border-b-2 border-[#1c1f22]">
          {email && (
            <a href={`mailto:${email}`} className="hover:underline text-[#565f68]">
              {email}
            </a>
          )}
          {phone && <span>{phone}</span>}
          {location && <span>{location}</span>}
          {linksList.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-[#565f68]"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* ── Summary ── */}
        {profSummary && (
          <section className="mt-7">
            <h2 className="text-[13px] tracking-[0.08em] font-extrabold uppercase text-[#1c1f22] mb-3.5 flex items-center gap-2.5">
              <span>Summary</span>
              <span className="flex-1 h-[2px]" style={{ backgroundColor: palette.tint }} />
            </h2>
            <p className="text-[13.5px] leading-[1.65] text-[#1c1f22] m-0 text-justify">
              {profSummary}
            </p>
          </section>
        )}

        {/* ── Skills ── */}
        <section className="mt-7">
          <h2 className="text-[13px] tracking-[0.08em] font-extrabold uppercase text-[#1c1f22] mb-3.5 flex items-center gap-2.5">
            <span>Skills</span>
            <span className="flex-1 h-[2px]" style={{ backgroundColor: palette.tint }} />
          </h2>
          <div className="space-y-1">
            {Object.entries(categorized).map(([cat, items]) => {
              if (!Array.isArray(items) || items.length === 0) return null;
              return (
                <div key={cat} className="text-[13.5px] leading-[1.75]">
                  <span className="font-bold mr-1.5" style={{ color: palette.accent }}>
                    {cat}:
                  </span>
                  <span className="text-[#1c1f22]">{items.join(', ')}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Career Timeline (Experience + Education) ── */}
        <section className="mt-7">
          <h2 className="text-[13px] tracking-[0.08em] font-extrabold uppercase text-[#1c1f22] mb-3.5 flex items-center gap-2.5">
            <span>Career Timeline</span>
            <span className="flex-1 h-[2px]" style={{ backgroundColor: palette.tint }} />
          </h2>

          {/* Timeline Experience Items */}
          {expList.map((job, idx) => (
            <div key={`exp-${idx}`} className="relative pl-[22px] mb-5 last:mb-0">
              {/* Dot */}
              <span
                className="absolute left-0 top-[5px] w-[10px] h-[10px] rounded-full"
                style={{ backgroundColor: palette.accent }}
              />
              {/* Connecting vertical line */}
              {(idx < expList.length - 1 || eduList.length > 0) && (
                <span
                  className="absolute left-[4px] top-[17px] bottom-[-20px] w-[2px]"
                  style={{ backgroundColor: palette.tint }}
                />
              )}
              <div className="flex justify-between items-baseline flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-[14px] font-bold text-[#1c1f22]">
                  {job.jobTitle} — <span className="font-semibold">{job.employer}</span>
                </span>
                {job.dates && (
                  <span
                    className="text-[12px] font-bold whitespace-nowrap"
                    style={{ color: palette.accent }}
                  >
                    {job.dates}
                  </span>
                )}
              </div>
              {job.bullets && job.bullets.length > 0 && (
                <ul className="m-0 pl-4 text-[13.5px] leading-[1.55] list-disc mt-1.5 space-y-1 text-[#1c1f22]">
                  {job.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Timeline Education Items */}
          {eduList.map((edu, idx) => (
            <div key={`edu-${idx}`} className="relative pl-[22px] mb-5 last:mb-0 mt-3">
              <span
                className="absolute left-0 top-[5px] w-[10px] h-[10px] rounded-full"
                style={{ backgroundColor: palette.accent }}
              />
              {idx < eduList.length - 1 && (
                <span
                  className="absolute left-[4px] top-[17px] bottom-[-20px] w-[2px]"
                  style={{ backgroundColor: palette.tint }}
                />
              )}
              <div className="flex justify-between items-baseline flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-[14px] font-bold text-[#1c1f22]">
                  {edu.degree} — <span className="font-normal text-[#565f68]">{edu.institution}</span>
                </span>
                {edu.graduationYear && (
                  <span
                    className="text-[12px] font-bold whitespace-nowrap"
                    style={{ color: palette.accent }}
                  >
                    {edu.graduationYear}
                  </span>
                )}
              </div>
              {edu.cgpa && (
                <div className="text-[12.5px] text-[#565f68] mt-0.5">
                  CGPA: {edu.cgpa}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ── Projects ── */}
        {projList && projList.length > 0 && (
          <section className="mt-7">
            <h2 className="text-[13px] tracking-[0.08em] font-extrabold uppercase text-[#1c1f22] mb-3.5 flex items-center gap-2.5">
              <span>Projects</span>
              <span className="flex-1 h-[2px]" style={{ backgroundColor: palette.tint }} />
            </h2>
            <div className="space-y-4">
              {projList.map((proj, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-baseline flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[14px] font-bold text-[#1c1f22]">
                      {proj.title || proj.name}
                    </span>
                    <span className="text-[12px] text-[#565f68]">
                      {proj.links ||
                        [proj.githubUrl ? 'GitHub' : null, proj.liveUrl ? 'Live Demo' : null]
                          .filter(Boolean)
                          .join(' · ')}
                    </span>
                  </div>
                  {proj.technologies && (
                    <div
                      className="text-[12px] font-semibold mt-0.5 mb-2"
                      style={{ color: palette.accent }}
                    >
                      {Array.isArray(proj.technologies)
                        ? proj.technologies.join(' · ')
                        : proj.technologies}
                    </div>
                  )}
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="m-0 pl-4 text-[13.5px] leading-[1.55] list-disc space-y-1 text-[#1c1f22]">
                      {proj.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Achievements & Leadership ── */}
        {achieveList && achieveList.length > 0 && (
          <section className="mt-7">
            <h2 className="text-[13px] tracking-[0.08em] font-extrabold uppercase text-[#1c1f22] mb-3.5 flex items-center gap-2.5">
              <span>Achievements &amp; Leadership</span>
              <span className="flex-1 h-[2px]" style={{ backgroundColor: palette.tint }} />
            </h2>
            <ul className="m-0 pl-4 text-[13.5px] leading-[1.55] list-disc space-y-1 text-[#1c1f22]">
              {achieveList.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. TEMPLATE: COMPACT ENGINEERING (Monospace + Multi-Stack Badges)
   ══════════════════════════════════════════════════════════════════ */
function CompactDevTemplate({
  name,
  role,
  email,
  phone,
  linksList,
  profSummary,
  categorized,
  eduList,
  expList,
  projList,
  achieveList,
  palette,
  isPrintMode,
}) {
  return (
    <div
      className={`resume-printable-area w-full max-w-[780px] mx-auto bg-white text-[#1a1c1e] shadow-2xl overflow-hidden transition-all text-left ${
        isPrintMode
          ? 'p-0 shadow-none border-none'
          : 'border border-[#d9dcdf] rounded-xl p-6 sm:p-[36px_44px_40px]'
      }`}
      style={{
        fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: '1050px',
        fontSize: '12.5px',
      }}
    >
      {/* Header: Flex with name & mono role on left; contact right-aligned */}
      <div className="flex justify-between items-start gap-4 pb-3.5 border-b-[3px] border-[#1a1c1e]">
        <div>
          <div className="text-[24px] font-extrabold tracking-[-0.01em] text-[#1a1c1e] leading-tight">
            {name}
          </div>
          <div
            className="text-[12px] font-mono mt-0.5"
            style={{ color: palette.accent }}
          >
            {role ? role.toLowerCase() : 'full-stack developer / mern'}
          </div>
        </div>
        <div className="text-right text-[11.5px] text-[#5a626a] leading-[1.6] whitespace-nowrap font-mono">
          {email && <div>{email}</div>}
          {phone && <div>{phone}</div>}
          <div>{linksList.map((l) => l.label).join(' · ')}</div>
        </div>
      </div>

      {/* // summary */}
      {profSummary && (
        <section className="mt-4">
          <h2
            className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
            style={{ color: palette.accent }}
          >
            // summary
          </h2>
          <p className="text-[12.5px] leading-[1.55] text-[#1a1c1e] m-0 text-justify">
            {profSummary}
          </p>
        </section>
      )}

      {/* // stack */}
      <section className="mt-4">
        <h2
          className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
          style={{ color: palette.accent }}
        >
          // stack
        </h2>
        <div className="space-y-2">
          {Object.entries(categorized).map(([cat, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[10.5px] font-bold text-[#5a626a] uppercase tracking-[0.04em] mb-1">
                  {cat}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded"
                      style={{
                        backgroundColor: palette.tint,
                        color: palette.dark,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Grid: // experience and // education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
        {/* // experience */}
        <section>
          <h2
            className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
            style={{ color: palette.accent }}
          >
            // experience
          </h2>
          {expList.map((job, idx) => (
            <div key={idx} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-1 mb-0.5">
                <span className="text-[12.5px] font-bold text-[#1a1c1e]">
                  {job.jobTitle}, <span className="font-semibold text-[#1a1c1e]">{job.employer}</span>
                </span>
                {job.dates && (
                  <span className="font-mono text-[10.5px] text-[#5a626a] whitespace-nowrap">
                    {job.dates}
                  </span>
                )}
              </div>
              {job.bullets && job.bullets.length > 0 && (
                <ul className="m-0 pl-3.5 text-[12px] leading-[1.5] list-disc space-y-0.5 text-[#1a1c1e]">
                  {job.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* // education */}
        <section>
          <h2
            className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
            style={{ color: palette.accent }}
          >
            // education
          </h2>
          {eduList.map((edu, idx) => (
            <div key={idx} className="mb-2">
              <p className="text-[12.5px] font-bold text-[#1a1c1e] m-0">{edu.degree}</p>
              <p className="text-[11px] text-[#5a626a] m-0">{edu.institution}</p>
              <p className="text-[11px] text-[#5a626a] font-mono m-0">
                {edu.graduationYear} {edu.cgpa && `· CGPA ${edu.cgpa}`}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* // projects */}
      {projList && projList.length > 0 && (
        <section className="mt-4">
          <h2
            className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
            style={{ color: palette.accent }}
          >
            // projects
          </h2>
          {projList.map((proj, idx) => (
            <div key={idx} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-1 mb-0.5">
                <span className="text-[12.5px] font-bold text-[#1a1c1e]">
                  {proj.title || proj.name}
                </span>
                <span
                  className="font-mono text-[10.5px]"
                  style={{ color: palette.accent }}
                >
                  {proj.links ||
                    [proj.githubUrl ? 'github' : null, proj.liveUrl ? 'demo' : null]
                      .filter(Boolean)
                      .join(' · ')}
                </span>
              </div>
              {proj.technologies && (
                <div className="font-mono text-[10.5px] text-[#5a626a] mb-1">
                  {Array.isArray(proj.technologies)
                    ? proj.technologies.join(' · ')
                    : proj.technologies}
                </div>
              )}
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="m-0 pl-3.5 text-[12px] leading-[1.5] list-disc space-y-0.5 text-[#1a1c1e]">
                  {proj.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* // achievements */}
      {achieveList && achieveList.length > 0 && (
        <section className="mt-4">
          <h2
            className="font-mono text-[11px] tracking-[0.03em] font-bold lowercase mb-2"
            style={{ color: palette.accent }}
          >
            // achievements
          </h2>
          <ul className="m-0 pl-3.5 text-[12px] leading-[1.5] list-disc space-y-0.5 text-[#1a1c1e]">
            {achieveList.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3. TEMPLATE: MINIMALIST ATS STANDARD (FAANG / Stanford Clean Text)
   ══════════════════════════════════════════════════════════════════ */
function MinimalAtsTemplate({
  name,
  role,
  email,
  phone,
  location,
  linksList,
  profSummary,
  categorized,
  eduList,
  expList,
  projList,
  achieveList,
  palette,
  isPrintMode,
}) {
  return (
    <div
      className={`resume-printable-area w-full max-w-[760px] mx-auto bg-white text-[#1c1f22] shadow-2xl overflow-hidden transition-all text-left ${
        isPrintMode
          ? 'p-0 shadow-none border-none'
          : 'border border-[#d9dcdf] rounded-xl p-[36px_30px_42px] sm:p-[48px_56px_52px]'
      }`}
      style={{
        fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: '1050px',
      }}
    >
      {/* Centered Stanford / FAANG Header */}
      <div className="text-center pb-4 border-b border-[#d9dcdf]">
        <div className="text-[28px] sm:text-[32px] font-bold text-[#1c1f22] tracking-tight">
          {name}
        </div>
        {role && (
          <div
            className="text-[13px] font-semibold tracking-wide uppercase mt-1"
            style={{ color: palette.accent }}
          >
            {role}
          </div>
        )}
        <div className="text-[12.5px] text-[#565f68] mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          {email && (
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          )}
          {email && phone && <span>·</span>}
          {phone && <span>{phone}</span>}
          {location && (
            <>
              <span>·</span>
              <span>{location}</span>
            </>
          )}
          {linksList.map((l, i) => (
            <React.Fragment key={i}>
              <span>·</span>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-[#565f68]"
              >
                {l.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Summary */}
      {profSummary && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            Professional Summary
          </h2>
          <p className="text-[13px] leading-[1.6] text-[#1c1f22] m-0 text-justify">
            {profSummary}
          </p>
        </section>
      )}

      {/* Skills */}
      <section className="mt-5">
        <h2
          className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
          style={{ color: palette.accent }}
        >
          Technical Skills
        </h2>
        <div className="space-y-1">
          {Object.entries(categorized).map(([cat, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            return (
              <div key={cat} className="text-[13px] leading-[1.65]">
                <span className="font-semibold text-[#1c1f22] mr-1.5">{cat}:</span>
                <span className="text-[#333]">{items.join(', ')}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Education */}
      <section className="mt-5">
        <h2
          className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
          style={{ color: palette.accent }}
        >
          Education
        </h2>
        <div className="space-y-2.5">
          {eduList.map((edu, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline text-[13px]">
                <span className="font-semibold text-[#1c1f22]">{edu.degree}</span>
                {edu.graduationYear && (
                  <span className="text-[12px] text-[#565f68]">{edu.graduationYear}</span>
                )}
              </div>
              <div className="flex justify-between items-baseline text-[12px] text-[#565f68]">
                <span>{edu.institution}</span>
                {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      {expList && expList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            Experience
          </h2>
          <div className="space-y-3.5">
            {expList.map((job, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline text-[13px]">
                  <span className="font-semibold text-[#1c1f22]">
                    {job.jobTitle} — <span className="font-medium text-[#444]">{job.employer}</span>
                  </span>
                  {job.dates && <span className="text-[12px] text-[#565f68]">{job.dates}</span>}
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul className="m-0 pl-4 text-[13px] leading-[1.55] list-disc space-y-1 text-[#1c1f22] mt-1">
                    {job.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projList && projList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            Projects
          </h2>
          <div className="space-y-3.5">
            {projList.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline text-[13px]">
                  <span className="font-semibold text-[#1c1f22]">{proj.title || proj.name}</span>
                  <span className="text-[12px] text-[#565f68]">
                    {proj.links ||
                      [proj.githubUrl ? 'GitHub' : null, proj.liveUrl ? 'Live Demo' : null]
                        .filter(Boolean)
                        .join(' · ')}
                  </span>
                </div>
                {proj.technologies && (
                  <div className="text-[12px] text-[#565f68] italic mt-0.5 mb-1">
                    {Array.isArray(proj.technologies)
                      ? proj.technologies.join(' · ')
                      : proj.technologies}
                  </div>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="m-0 pl-4 text-[13px] leading-[1.55] list-disc space-y-1 text-[#1c1f22]">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achieveList && achieveList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.08em] uppercase pb-1 mb-2 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            Achievements &amp; Leadership
          </h2>
          <ul className="m-0 pl-4 text-[13px] leading-[1.55] list-disc space-y-1 text-[#1c1f22]">
            {achieveList.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   4. TEMPLATE: SINGLE-COLUMN ATS STANDARD (Recommended Gold Standard)
   ══════════════════════════════════════════════════════════════════ */
function ModernAtsTemplate({
  name,
  role,
  email,
  phone,
  location,
  linksList,
  profSummary,
  categorized,
  eduList,
  expList,
  projList,
  achieveList,
  palette,
  isPrintMode,
}) {
  return (
    <div
      className={`resume-printable-area w-full max-w-[760px] mx-auto bg-white text-[#1c1f22] rounded-xl shadow-2xl overflow-hidden transition-all text-left ${
        isPrintMode
          ? 'p-0 shadow-none border-none'
          : 'border border-[#d9dcdf] p-[36px_30px_42px] sm:p-[50px_60px_56px]'
      }`}
      style={{
        fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: '1050px',
        color: '#1c1f22',
      }}
    >
      {/* ── Candidate Name ── */}
      <div className="text-[28px] sm:text-[30px] font-bold text-[#1c1f22] tracking-[-0.01em] mb-1 leading-tight">
        {name}
      </div>

      {/* ── Candidate Role (Optional subtitle) ── */}
      {role && (
        <div
          className="text-[13px] font-semibold tracking-wide uppercase mb-2"
          style={{ color: palette.accent }}
        >
          {role}
        </div>
      )}

      {/* ── Contact Header Row ── */}
      <div className="text-[13px] text-[#4a5158] flex flex-wrap items-center gap-x-3 gap-y-1 pb-4 border-b border-[#d9dcdf]">
        {email && (
          <a href={`mailto:${email}`} className="hover:underline text-[#4a5158]">
            {email}
          </a>
        )}
        {email && phone && <span className="text-[#d9dcdf] select-none">·</span>}
        {phone && <span>{phone}</span>}
        {location && (
          <>
            <span className="text-[#d9dcdf] select-none">·</span>
            <span>{location}</span>
          </>
        )}
        {linksList.map((link, idx) => (
          <React.Fragment key={idx}>
            <span className="text-[#d9dcdf] select-none">·</span>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#4a5158] hover:underline"
              style={{ ':hover': { color: palette.accent } }}
            >
              {link.label}
            </a>
          </React.Fragment>
        ))}
      </div>

      {/* ── 1. PROFESSIONAL SUMMARY ── */}
      {profSummary && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-[13.5px] leading-[1.6] text-[#1c1f22] m-0 text-justify">
            {profSummary}
          </p>
        </section>
      )}

      {/* ── 2. SKILLS ── */}
      <section className="mt-5">
        <h2
          className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
          style={{ color: palette.accent }}
        >
          SKILLS
        </h2>
        <div className="space-y-1">
          {Object.entries(categorized).map(([category, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null;
            return (
              <div key={category} className="text-[13.5px] leading-[1.7] text-[#1c1f22]">
                <span className="font-semibold text-[#1c1f22] mr-1.5">{category}:</span>
                <span>{items.join(', ')}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. EDUCATION ── */}
      <section className="mt-5">
        <h2
          className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
          style={{ color: palette.accent }}
        >
          EDUCATION
        </h2>
        <div className="space-y-3">
          {eduList.map((edu, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline text-[13.5px] mb-0.5">
                <span className="font-semibold text-[#1c1f22]">
                  {edu.degree || 'Bachelor of Technology (B.Tech) — Computer Science & Engineering'}
                </span>
                {(edu.cgpa || edu.grade) && (
                  <span className="text-[13px] text-[#4a5158] whitespace-nowrap font-medium">
                    CGPA: {edu.cgpa || edu.grade}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-[#4a5158] m-0">
                {edu.institution || 'Government Engineering College, Aurangabad, Bihar'}
                {edu.graduationYear && ` · ${edu.graduationYear}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. EXPERIENCE ── */}
      {expList && expList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            EXPERIENCE
          </h2>
          <div className="space-y-4">
            {expList.map((job, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-3 gap-y-0.5 mb-1">
                  <span className="text-[14px] font-bold text-[#1c1f22]">
                    {job.jobTitle} —{' '}
                    <span className="text-[#1c1f22] font-semibold">{job.employer}</span>
                  </span>
                  {job.dates && (
                    <span className="text-[12.5px] text-[#4a5158] whitespace-nowrap">
                      {job.dates}
                    </span>
                  )}
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul className="m-0 pl-[18px] text-[13.5px] leading-[1.55] list-disc text-[#1c1f22] space-y-1">
                    {job.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. PROJECTS ── */}
      {projList && projList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            PROJECTS
          </h2>
          <div className="space-y-4">
            {projList.map((proj, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-3 gap-y-0.5 mb-0.5">
                  <span className="text-[14px] font-bold text-[#1c1f22]">
                    {proj.title || proj.name}
                  </span>
                  {(proj.links || proj.liveUrl || proj.githubUrl) && (
                    <span className="text-[12px] text-[#4a5158]">
                      {proj.links ||
                        [proj.githubUrl ? 'GitHub' : null, proj.liveUrl ? 'Live Demo' : null]
                          .filter(Boolean)
                          .join(' · ')}
                    </span>
                  )}
                </div>
                {proj.technologies && (
                  <div className="text-[12px] text-[#4a5158] mt-[3px] mb-2">
                    {Array.isArray(proj.technologies)
                      ? proj.technologies.join(' · ')
                      : proj.technologies}
                  </div>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="m-0 pl-[18px] text-[13.5px] leading-[1.55] list-disc text-[#1c1f22] space-y-1">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. ACHIEVEMENTS & LEADERSHIP ── */}
      {achieveList && achieveList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-[12px] font-bold tracking-[0.06em] uppercase pb-1.5 mb-2.5 border-b border-[#d9dcdf]"
            style={{ color: palette.accent }}
          >
            ACHIEVEMENTS &amp; LEADERSHIP
          </h2>
          <ul className="m-0 pl-[18px] text-[13.5px] leading-[1.55] list-disc text-[#1c1f22] space-y-1">
            {achieveList.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT EXPORT
   ══════════════════════════════════════════════════════════════════ */
export default function ModernResumePreview({
  candidate = {},
  targetRole = 'Software Development',
  education = [],
  projects = [],
  experience = [],
  achievements = [],
  skills = {},
  summary = '',
  layout = 'modern-ats',
  accentColor = '#2f4858',
  isPrintMode = false,
}) {
  const name = candidate.name || 'Sristy';
  const email = candidate.email || 'sristy198269@gmail.com';
  const phone = candidate.phone || '+91 76988 20628';
  const location = candidate.location || '';
  const role = candidate.role || targetRole || 'Software Developer';

  // Standardize links array
  let linksList = [];
  if (Array.isArray(candidate.links)) {
    linksList = candidate.links.map((l) =>
      typeof l === 'string'
        ? { label: l.replace(/^https?:\/\/(www\.)?/, '').split('/')[0], url: l }
        : { label: l.label || l.name || 'Link', url: l.url || '#' }
    );
  } else if (candidate.links && typeof candidate.links === 'object') {
    if (candidate.links.linkedin) linksList.push({ label: 'LinkedIn', url: candidate.links.linkedin });
    if (candidate.links.github) linksList.push({ label: 'GitHub', url: candidate.links.github });
    if (candidate.links.portfolio) linksList.push({ label: 'Portfolio', url: candidate.links.portfolio });
  }

  if (linksList.length === 0) {
    linksList = [
      { label: 'LinkedIn', url: 'https://linkedin.com' },
      { label: 'GitHub', url: 'https://github.com' },
      { label: 'LeetCode', url: 'https://leetcode.com' },
    ];
  }

  // Skills processing and categorization
  const allSkillsList = Array.isArray(skills?.normalized)
    ? skills.normalized
    : Array.isArray(skills?.detected)
    ? skills.detected.map((s) => (typeof s === 'string' ? s : s.name))
    : [];

  const categorized = skills?.categorized || categorizeSkills(allSkillsList);

  // Fallback Education if empty
  const eduList =
    education && education.length > 0
      ? education
      : [
          {
            degree: 'Bachelor of Technology (B.Tech) — Computer Science & Engineering',
            institution: 'Government Engineering College, Aurangabad, Bihar',
            cgpa: '7.83',
            graduationYear: '2022 – 2026',
          },
        ];

  // Fallback Experience if empty
  const expList =
    experience && experience.length > 0
      ? experience
      : [
          {
            jobTitle: 'Software Developer Intern',
            employer: '[Company Name]',
            dates: 'Dec 2025 – Jan 2026',
            bullets: [
              'Developed responsive frontend modules for an enterprise Event Management System using React.js, improving workflow layouts and enhancing user onboarding.',
              'Engineered 12+ reusable UI components, reducing codebase redundancy by 20% and accelerating front-end delivery across the engineering team.',
              'Collaborated with backend engineers to isolate and debug 15+ high-priority state-management errors, ensuring seamless client-server integration.',
            ],
          },
        ];

  // Fallback Projects if empty
  const projList =
    projects && projects.length > 0
      ? projects
      : [
          {
            title: 'Resume Analyzer',
            links: 'GitHub · Live Demo',
            technologies: 'React.js · Express.js · MongoDB · Cohere API · Tailwind CSS',
            bullets: [
              'Built a MERN-based AI resume analyzer integrating the Cohere NLP API to compare PDF resumes against job descriptions and generate compatibility scores from 0–100.',
              'Implemented Firebase Google OAuth login with persistent React Context state and protected dashboard/history workflows.',
              'Designed a PDF-processing pipeline using Multer memory storage and pdf-parse to extract resume text without permanently storing uploaded files.',
              'Built interactive dashboards for AI feedback, score visualization, analysis history, and admin-aware reporting backed by MongoDB.',
            ],
          },
          {
            title: 'ConvoFlow',
            links: 'GitHub · Live Demo',
            technologies: 'React.js · Express.js · MongoDB · Socket.IO · Chakra UI · JWT',
            bullets: [
              'Engineered a full-stack real-time messaging app supporting one-to-one chat, dynamic group creation, and live unread notifications via Socket.IO.',
              'Integrated secure JWT-based authentication, cookie-based session persistence, and instant text-based global user search.',
              'Designed scalable RESTful backend micro-routes following the Model-View-Controller (MVC) pattern.',
              'Configured production deployments on Vercel (frontend) and Render (backend) with CORS and environment-variable configuration.',
            ],
          },
        ];

  // Fallback Achievements
  const achieveList =
    achievements && achievements.length > 0
      ? achievements
      : [
          'Ranked in the top 2.4% globally among 689,000+ participants in TCS CodeVita Season 12 (Certificate).',
          'Solved 300+ Data Structures & Algorithms problems across LeetCode, GeeksforGeeks, and CodeChef.',
          'Winner, Smart India Hackathon (SIH) Internal Rounds — ranked 1st among competing engineering teams.',
          'Google Developer Student Clubs (GDSC) Lead, 2024 — organized technical sessions and coordinated student developers.',
          'Secured 4th place, college-level Innoverse Hackathon, 2024.',
        ];

  const profSummary =
    summary && summary.length > 40
      ? summary
      : `Computer Science graduate with hands-on experience in React.js, Node.js, Express.js, MongoDB, TypeScript, and REST API development. Built and deployed full-stack applications with authentication, real-time communication, and AI integration. Strong foundation in Data Structures & Algorithms, Object-Oriented Programming, DBMS, and Operating Systems.`;

  const palette = getPaletteColors(accentColor);

  const templateProps = {
    name,
    role,
    email,
    phone,
    location,
    linksList,
    profSummary,
    categorized,
    eduList,
    expList,
    projList,
    achieveList,
    palette,
    isPrintMode,
  };

  // Switch between the 4 modern industry templates
  if (layout === 'executive') {
    return <ExecutiveTemplate {...templateProps} />;
  }

  if (layout === 'compact-dev') {
    return <CompactDevTemplate {...templateProps} />;
  }

  if (layout === 'minimal-ats') {
    return <MinimalAtsTemplate {...templateProps} />;
  }

  // Default: Single-Column ATS Standard
  return <ModernAtsTemplate {...templateProps} />;
}
