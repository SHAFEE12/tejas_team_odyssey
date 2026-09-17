import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const faqs = [
    {
      q: 'How does Career Odyssey differentiate from generic job portals?',
      a: 'Generic job portals act as passive bulletin boards where resumes enter automated applicant tracking black holes. Career Odyssey is a synchronized multi-stakeholder ecosystem uniting Students, Academicians, Institutions, and Industry. It connects classroom syllabi with evolving employer competencies, provides diagnostic gap analysis, and enables faculty-endorsed project proof-of-work.'
    },
    {
      q: 'How does the Resume Analyzer evaluate ATS compatibility?',
      a: 'The analyzer evaluates formatting hierarchy, keyword density matching target enterprise requisitions, action verb strength, and quantified outcome statements, providing prescriptive line-by-line recommendations.'
    },
    {
      q: 'How does the Mock Interview simulator adapt to different roles?',
      a: 'The simulator dynamically configures technical, architectural, and behavioral scenarios calibrated to the candidate’s target role, experience level, and verified academic coursework.'
    },
    {
      q: 'Can universities and colleges track cohort placement readiness?',
      a: 'Yes. Higher education institutions and department heads have dedicated institutional dashboard telemetry. Placement directors can view aggregate cohort readiness, identify curriculum gaps, and track student capstone progress in real time.'
    },
    {
      q: 'How do employers and recruiters access verified candidates?',
      a: 'Recruiters define target role competency rubrics. Career Odyssey highlights candidates who have demonstrated mastery through verified capstones, course evaluations, and faculty mentorship endorsements.'
    }
  ];

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-28 border-t border-white/[0.06] bg-[#070709] relative"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Framer */}
        <div
          className={`text-center space-y-4 mb-16 transition-all duration-700 ${
            isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#fc8200] tracking-widest font-semibold">
            Common Inquiries
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Frequently asked{' '}
            <span className="serif-title italic font-normal text-[#fc8200]">
              questions.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Everything you need to know about the Career Odyssey ecosystem and guidance tools.
          </p>
        </div>

        {/* Accordion List matching Framer with Plus/Minus */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-[#131415] border-[#fc8200]/40 shadow-lg shadow-[#fc8200]/5'
                    : 'bg-[#0e0f10] border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[#fc8200] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-45' : 'rotate-0'
                    }`}
                  >
                    add
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-white/5 text-xs sm:text-sm text-zinc-400 leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}