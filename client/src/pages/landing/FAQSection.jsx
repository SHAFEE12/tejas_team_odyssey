import { useState } from 'react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does Career Odyssey differentiate from generic job portals?',
      a: 'Generic job boards are static listing bulletins where student resumes enter applicant tracking black holes. Career Odyssey is a synchronized multi-stakeholder ecosystem uniting Students, Academicians, Institutions, and Industry. It connects classroom syllabi with evolving employer competencies, provides diagnostic gap analysis, and enables faculty-endorsed project proof-of-work.'
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
    <section id="faq" className="py-24 bg-[#070709] border-b border-white/10 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16">
          
          <h2 className="font-serif-heading text-3xl sm:text-4xl text-white font-normal leading-tight">
            Frequently asked questions.
          </h2>
         
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-[12px] border border-white/10 bg-[#0d0f12] overflow-hidden shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="font-serif-heading text-lg sm:text-xl font-normal text-white">
                    {faq.q}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#ff7a00] text-sm shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm text-zinc-300 leading-relaxed border-t border-white/10 bg-[#121418]">
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