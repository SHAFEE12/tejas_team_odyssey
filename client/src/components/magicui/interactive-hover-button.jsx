import React from "react";
import { cn } from "../../lib/utils";

function ArrowRight({ className = "w-4 h-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export const InteractiveHoverButton = React.forwardRef(
  ({ children, text, className = "", type = "button", ...props }, ref) => {
    const content = children || text || "Get Started";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-orange-500/30 bg-zinc-950 text-white py-3 px-6 text-center text-sm font-semibold transition-all duration-300 hover:border-orange-400 shadow-lg shadow-orange-500/15 hover:shadow-orange-500/35 active:scale-95",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#ff7a00] transition-all duration-300 group-hover:scale-[100.8]" />
          <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 font-semibold text-white">
            {content}
          </span>
        </div>
        <div className="text-black absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 font-bold">
          <span>{content}</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </div>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export default InteractiveHoverButton;
