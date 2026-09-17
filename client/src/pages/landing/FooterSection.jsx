export default function FooterSection({ onLogin, onRegister, onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    
    <footer className="w-full overflow-hidden bg-[#212121] border-t border-white/10 text-zinc-400">

      {/* =====================================================
          FOOTER CONTENT
      ===================================================== */}
<div
  className="
    w-full
    max-w-2xl
    mx-auto
    px-5
    sm:px-8
    md:px-10
    mt-8
    sm:mt-10
    md:mt-12
    mb-8
    sm:mb-12
    text-center
    font-silicone
  
    text-base
    sm:text-lg
    md:text-xl
    lg:text-2xl
    leading-[1.2]
  "
>
  <span
    className="
  
      text-3lg
      sm:text-6xl
      md:text-xl
      lg:text-3xl
    "
  >
    Career Odyssey
  </span>{" "}
  connects the dots between students, institutes & industry.
</div>

     


      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 pt-16 sm:pt-20">

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 lg:gap-x-16 gap-y-12 pb-14 sm:pb-16 border-b border-white/10">

          {/* ================= BRAND ================= */}

          <div className="space-y-5">

            <div
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <img
                src="/logo.png"
                alt="Career Odyssey Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />

            
            </div>

            <p className="text-sm leading-6 text-zinc-400 max-w-[320px]">
              The unified career navigation ecosystem connecting
              students, academicians, institutions, and enterprise
              industry.
            </p>


          </div>


          {/* ================= PLATFORM ================= */}

          <div className="space-y-5">

            <span className="block text-sm text-orange-400 font-semibold font-mono-eyebrow">
              ● PLATFORM
            </span>

            <ul className="space-y-3 text-sm">

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate && onNavigate("overview")
                  }
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Overview
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate && onNavigate("capabilities")
                  }
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Core Capabilities
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate && onNavigate("diagnostics")
                  }
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  ATS & Interview Diagnostics
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate && onNavigate("faq")
                  }
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Frequently Asked Questions
                </button>
              </li>

            </ul>

          </div>


          {/* ================= PORTALS ================= */}

          <div className="space-y-5">

            <span className="block text-sm text-orange-400 font-semibold font-mono-eyebrow">
              ● PORTALS
            </span>

            <ul className="space-y-3 text-sm">

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onRegister && onRegister("student")
                  }
                  className="text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer text-left"
                >
                  Student Portal
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onRegister && onRegister("academician")
                  }
                  className="text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer text-left"
                >
                  Academician Portal
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onRegister && onRegister("institution")
                  }
                  className="text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer text-left"
                >
                  Institution Hub
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onRegister && onRegister("industry")
                  }
                  className="text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer text-left"
                >
                  Industry Partner Portal
                </button>
              </li>

            </ul>

          </div>


          {/* ================= ACCESS ================= */}

          <div className="space-y-5">

            <span className="block text-sm text-orange-400 font-semibold font-mono-eyebrow">
              ● ACCESS
            </span>

            <ul className="space-y-3 text-sm">

              <li>
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Log In to Account
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() =>
                    onRegister && onRegister("student")
                  }
                  className="text-orange-400 hover:text-orange-300 font-medium transition-colors cursor-pointer text-left"
                >
                  Create Account →
                </button>
              </li>

            </ul>

          </div>

        </div>


        {/* =====================================================
            CAREER ODYSSEY
        ===================================================== */}
        <div className="w-full pt-16 sm:pt-20 md:pt-24 overflow-hidden      ">

          <div className="w-full flex justify-center overflow-hidden       ">

            <h2
              className="
                w-full
                text-center
                whitespace-nowrap
                text-[#5d5d5d]
            font-silicone
                leading-[1.2]
                tracking-[-0.075em]
                select-none
               
              
              "
              style={{
                /*
                  9.5vw gives enough room for the COMPLETE
                  CareerOdyssey word on desktop.
                */
                fontSize: "clamp(48px, 9.5vw, 180px)",
              }}
            >
              Career Odyssey
            </h2>

          </div>

        </div>


        {/* =====================================================
            BOTTOM BAR
        ===================================================== */}

        <div className="mt-14 sm:mt-16 pt-7 sm:pt-8 pb-8 sm:pb-9 border-t border-white/10">

          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-5 text-[10px] sm:text-xs text-zinc-500 font-mono-eyebrow">

            {/* COPYRIGHT */}

            <div className="text-center md:text-left">
              &copy; {currentYear} OdysseyLab • Career Odyssey.
              All rights reserved.
            </div>


            {/* LEGAL */}

            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">

              <button
                type="button"
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>

              <span className="text-zinc-700">
                •
              </span>

              <button
                type="button"
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>

              <span className="text-zinc-700">
                •
              </span>

              <button
                type="button"
                className="hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Academic Integrity
              </button>

            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}