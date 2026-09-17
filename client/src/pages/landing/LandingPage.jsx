import Navbar from './Navbar';
import AIAnnouncementBanner from './AIAnnouncementBanner';
import Hero from './Hero';
import StatBannerStrip from './StatBannerStrip';
import CareerIntelligence from './CareerIntelligence';
import TwoColumnFeatures from './TwoColumnFeatures';
import AlternatingSection from './AlternatingSection';
import EcosystemRoles from './EcosystemRoles';
import FAQSection from './FAQSection';
import CTA from './CTA';
import FooterSection from './FooterSection';

export default function LandingPage({ onLogin, onRegister }) {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-orange-500/30 selection:text-orange-200">
      {/* 1. Fixed Header Navigation */}
      <Navbar onLogin={onLogin} onRegister={onRegister} />

      <main>
        {/* 2. Top AI Announcement Pill Banner (Page 15) */}
        <AIAnnouncementBanner onExplore={() => scrollToSection('diagnostics')} />

        {/* 3. Section Hero with Editorial Serif Headline & Dual CTA (Page 14 & 15) */}
        <Hero
          onLogin={onLogin}
          onRegister={onRegister}
          onExplore={() => scrollToSection('intelligence')}
        />

        {/* 4. Full-Width Stat Banner Strip (Page 10 & 15) */}
        <StatBannerStrip />

        {/* 5. Benchmark ScrollTrigger Product Section: Career Intelligence & Synthesis */}
        <CareerIntelligence onRegister={onRegister} />

        {/* 6. Two-Column Feature Showcase Cards on Mint #e4f0f1 (Page 10 & 15) */}
        <TwoColumnFeatures onRegister={onRegister} />

        {/* 6. Alternating Section in Blush Sand #f2e8e2 with Filter Pills (Page 13 & 14) */}
        <AlternatingSection onRegister={onRegister} />

        {/* 7. Four-Stakeholder Unified Ecosystem (Students, Mentors, Colleges, Industry) */}
        <EcosystemRoles onRegister={onRegister} />

        {/* 8. Frequently Asked Questions Accordion */}
        <FAQSection />

        {/* 9. Final Call to Action */}
        <CTA onLogin={onLogin} onRegister={onRegister} />
      </main>

      {/* 10. Minimal Footer */}
      <FooterSection
        onLogin={onLogin}
        onRegister={onRegister}
        onNavigate={scrollToSection}
      />
    </div>
  );
}
