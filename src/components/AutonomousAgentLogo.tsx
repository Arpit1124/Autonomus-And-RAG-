import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const AutonomousAgentLogo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg 
      className={`shrink-0 ${className}`} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Rounded Glow Container */}
      <rect width="100" height="100" rx="22" fill="#121324" />
      <rect x="1" y="1" width="98" height="98" rx="21" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Terminal Window on Left */}
      <g transform="translate(10, 24)">
        {/* Terminal frame */}
        <rect width="44" height="34" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
        {/* Window controls header bar */}
        <line x1="2" y1="8" x2="42" y2="8" stroke="#334155" strokeWidth="1" />
        <circle cx="6" cy="4.5" r="1.5" fill="#ef4444" />
        <circle cx="10.5" cy="4.5" r="1.5" fill="#eab308" />
        <circle cx="15" cy="4.5" r="1.5" fill="#22c55e" />
        {/* Command prompt `>_` */}
        <path d="M7 16 L14 20.5 L7 25" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="17" y1="25" x2="25" y2="25" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Cyan & Dark Gears in Center */}
      {/* Big Cyan Gear */}
      <g transform="translate(30, 48)">
        <circle cx="12" cy="12" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="#121324" />
        {/* Teeth */}
        <rect x="10.5" y="1" width="3" height="3.5" rx="0.8" fill="#38bdf8" />
        <rect x="10.5" y="19.5" width="3" height="3.5" rx="0.8" fill="#38bdf8" />
        <rect x="1" y="10.5" width="3.5" height="3" rx="0.8" fill="#38bdf8" />
        <rect x="19.5" y="10.5" width="3.5" height="3" rx="0.8" fill="#38bdf8" />
        <rect x="3.8" y="3.8" width="3" height="3" rx="0.8" fill="#38bdf8" transform="rotate(45 5.3 5.3)" />
        <rect x="16.8" y="16.8" width="3" height="3" rx="0.8" fill="#38bdf8" transform="rotate(45 18.3 18.3)" />
        <rect x="3.8" y="16.8" width="3" height="3" rx="0.8" fill="#38bdf8" transform="rotate(-45 5.3 18.3)" />
        <rect x="16.8" y="3.8" width="3" height="3" rx="0.8" fill="#38bdf8" transform="rotate(-45 18.3 5.3)" />
      </g>

      {/* Small Secondary Gear */}
      <g transform="translate(48, 64)">
        <circle cx="8" cy="8" r="4.5" fill="#0369a1" stroke="#22d3ee" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.2" fill="#121324" />
        <rect x="7" y="1" width="2" height="2" rx="0.5" fill="#22d3ee" />
        <rect x="7" y="13" width="2" height="2" rx="0.5" fill="#22d3ee" />
        <rect x="1" y="7" width="2" height="2" rx="0.5" fill="#22d3ee" />
        <rect x="13" y="7" width="2" height="2" rx="0.5" fill="#22d3ee" />
      </g>

      {/* Robot Mascot on Right */}
      <g transform="translate(56, 26)">
        {/* Antenna */}
        <line x1="18" y1="0" x2="18" y2="7" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="18" cy="0" r="2.8" fill="#38bdf8" />

        {/* Ear Pods */}
        <rect x="-3" y="11" width="5" height="10" rx="2.5" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />
        <rect x="34" y="11" width="5" height="10" rx="2.5" fill="#3b82f6" stroke="#2563eb" strokeWidth="1" />

        {/* Robot Head Frame */}
        <rect x="0" y="5" width="36" height="24" rx="12" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />

        {/* Screen/Face visor */}
        <rect x="4" y="9" width="28" height="16" rx="8" fill="#1e1b4b" />

        {/* Eyes (Glowing Cyan/Blue) */}
        <circle cx="11" cy="16" r="2.5" fill="#38bdf8" />
        <circle cx="25" cy="16" r="2.5" fill="#38bdf8" />

        {/* Smile curve */}
        <path d="M14.5 20.5 Q18 23 21.5 20.5" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Robot Body */}
        <ellipse cx="18" cy="38" rx="14" ry="11" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        {/* Belly Screen Badge */}
        <ellipse cx="18" cy="38" rx="8" ry="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="18" cy="38" r="2" fill="#3b82f6" />
      </g>
    </svg>
  );
};
