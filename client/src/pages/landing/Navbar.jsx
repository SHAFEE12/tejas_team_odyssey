import { useState, useEffect } from 'react';

const LOGO_SRC = '/logo.png';

export default function Navbar({ onLogin, onRegister }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = [
    { id: 'overview', label: 'Overview' },
   
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'ecosystem', label: 'Ecosystem' },
    { id: 'faq', label: 'FAQ' }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#070709]/90 backdrop-blur-md border-b border-white/10 py-3.5 shadow-lg shadow-black/40'
          : 'bg-[#070709]/70 backdrop-blur-sm py-5 border-b border-white/5'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <img
            src={LOGO_SRC}
            alt="Career Odyssey"
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base  font-silicone tracking-tight text-white ">
                Career Odyssey
              </span>
            </div>
            <span className="text-[11px] font-mono-eyebrow text-[#ff8a00] tracking-wider font-medium">
              BY ODYSSEYLAB
            </span>
          </div>
        </div>

        {/* Center Pill Nav Links */}
        <nav
          className="hidden md:flex items-center gap-1 px-3 py-1 rounded-[1000px] bg-[#121418] border border-white/10 text-xs font-medium text-zinc-300 shadow-inner"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="px-3.5 py-1.5 rounded-[88px] text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Auth CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-1.5 rounded-[48px] text-xs font-medium text-zinc-300 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => onRegister('student')}
            className="px-4 py-1.5 rounded-[48px] text-xs font-medium text-white bg-[#ff7a00] hover:bg-[#e66e00] transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-orange-500/20"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[88px] text-zinc-300 hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-[#0a0b0e] border-b border-white/10 space-y-3 mt-2">
          <div className="flex flex-col space-y-1.5 text-sm">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-left py-2 px-3 rounded-[88px] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              className="w-full py-2.5 text-center text-xs font-medium text-zinc-300 border border-white/10 rounded-[48px] hover:bg-white/5"
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onRegister('student');
              }}
              className="w-full py-2.5 text-center text-xs font-medium text-white bg-[#ff7a00] hover:bg-[#e66e00] rounded-[48px] shadow-md shadow-orange-500/20"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}