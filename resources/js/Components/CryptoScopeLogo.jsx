import React from 'react';

export default function CryptoScopeLogo({ className = 'w-7 h-7', showText = false, textClassName = '' }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center rounded-lg bg-[#09090b] border border-zinc-700 shadow-inner group overflow-hidden ${className}`}>
        {/* Subtle white ambient glow on hover */}
        <div className="absolute inset-0 bg-white/[0.03] group-hover:bg-white/[0.08] transition-colors pointer-events-none" />
        
        {/* Custom Scope Reticle SVG in Pure White & Zinc */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 text-white"
        >
          {/* Outer Ring */}
          <circle cx="20" cy="20" r="14" stroke="#52525b" strokeWidth="1.25" />
          
          {/* Middle Radar Target Ring */}
          <circle
            cx="20"
            cy="20"
            r="9.5"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          
          {/* Inner Precision Ring */}
          <circle cx="20" cy="20" r="5" stroke="#ffffff" strokeWidth="1.5" />
          
          {/* Scope Crosshairs */}
          <line x1="20" y1="3" x2="20" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="32" x2="20" y2="37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="20" x2="8" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="20" x2="37" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          
          {/* Center Target Dot */}
          <circle cx="20" cy="20" r="2.25" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <span className={`font-semibold tracking-tight text-white ${textClassName || 'text-sm'}`}>
          CryptoScope
        </span>
      )}
    </div>
  );
}