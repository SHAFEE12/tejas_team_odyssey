/**
 * BrandLogo.jsx — Unified Career Odyssey Logo Component
 *
 * Renders the official infinity-compass ribbon logo with custom sizing,
 * optional text label, and role-tailored color palette glow and typography:
 * - Student: Electric Ember & Orange
 * - Academician: Deep Indigo & Royal Sapphire
 * - Institution: Emerald & Mint Executive Intelligence
 * - Industry: Electric Violet & Amethyst Enterprise
 */

import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/logo.png';

const SIZE_MAP = {
  xs: {
    img: 'h-5 w-auto',
    text: 'text-xs',
    container: 'gap-1.5',
  },
  sm: {
    img: 'h-7 w-auto',
    text: 'text-[14px]',
    container: 'gap-2.5',
  },
  md: {
    img: 'h-9 w-auto',
    text: 'text-base sm:text-lg',
    container: 'gap-3',
  },
  lg: {
    img: 'h-12 w-auto',
    text: 'text-xl sm:text-2xl',
    container: 'gap-3.5',
  },
  xl: {
    img: 'h-16 w-auto',
    text: 'text-2xl sm:text-3xl',
    container: 'gap-4',
  },
};

const ROLE_THEMES = {
  student: {
    glow: 'from-[#FF5100]/30 via-[#FF8A00]/25 to-[#FFA726]/15',
    accentText: 'from-[#FF5100] via-[#FF7A00] to-[#FFA726]',
    dropShadow: 'drop-shadow-[0_2px_8px_rgba(255,107,0,0.35)]',
  },
  academician: {
    glow: 'from-indigo-500/35 via-indigo-400/25 to-blue-500/15',
    accentText: 'from-[#FF5100] via-[#FF7A00] to-[#FFA726]',
    dropShadow: 'drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]',
  },
  institution: {
    glow: 'from-emerald-500/35 via-teal-400/25 to-emerald-600/15',
    accentText: 'from-[#FF5100] via-[#FF7A00] to-[#FFA726]',
    dropShadow: 'drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]',
  },
  industry: {
    glow: 'from-purple-500/35 via-fuchsia-400/25 to-purple-600/15',
    accentText: 'from-[#FF5100] via-[#FF7A00] to-[#FFA726]',
    dropShadow: 'drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]',
  },
};

export default function BrandLogo({
  size = 'sm',
  showText = true,
  role = 'student',
  linkTo = null,
  className = '',
  imgClassName = '',
  textClassName = '',
  glow = true,
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const theme = ROLE_THEMES[role] || ROLE_THEMES.student;

  const content = (
    <div
      className={`inline-flex items-center ${sizeConfig.container} group transition-all duration-200 select-none ${className}`}
    >
      {/* Infinity Compass Logo Mark */}
      <div className="relative shrink-0 flex items-center justify-center">
        {glow && (
          <div
            className={`absolute -inset-1 rounded-full bg-gradient-to-r ${theme.glow} blur-sm opacity-70 group-hover:opacity-100 transition-opacity`}
            aria-hidden="true"
          />
        )}
        <img
          src={logoImg}
          alt="Career Odyssey Logo"
          className={`relative object-contain transition-transform duration-200 group-hover:scale-105 filter ${theme.dropShadow} ${sizeConfig.img} ${imgClassName}`}
          loading="eager"
        />
      </div>

      {/* Brand Name Text */}
      {showText && (
        <span
          className={`font-semibold tracking-tight text-white leading-none ${sizeConfig.text} ${textClassName}`}
        >
          Career{' '}
          <span className={`font-extrabold bg-gradient-to-r ${theme.accentText} bg-clip-text text-transparent`}>
            Odyssey
          </span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex focus:outline-none" aria-label="Career Odyssey Home">
        {content}
      </Link>
    );
  }

  return content;
}