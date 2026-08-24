import React from 'react';
import logoImg from '../../assets/images/waferguard_logo_1787149035014.jpg';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  badge?: string;
}

export const WaferLogo: React.FC<Props> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
  badge = 'Fab-09'
}) => {
  const sizeMap = {
    xs: { img: 'w-6 h-6', title: 'text-xs', sub: 'text-[9px]' },
    sm: { img: 'w-8 h-8', title: 'text-sm', sub: 'text-[10px]' },
    md: { img: 'w-10 h-10', title: 'text-base', sub: 'text-[11px]' },
    lg: { img: 'w-14 h-14', title: 'text-lg', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', title: 'text-2xl', sub: 'text-sm' }
  };

  const { img, title, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 font-mono ${className}`}>
      <div className="relative shrink-0">
        <img
          src={logoImg}
          alt="WaferGuard AI Official Logo"
          referrerPolicy="no-referrer"
          className={`${img} rounded-xl object-cover border border-indigo-500/30 shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-500/20`}
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#08080c] animate-pulse" />
      </div>

      {showText && (
        <div className="overflow-hidden select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold text-white tracking-wider ${title}`}>
              WAFERGUARD AI
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                {badge}
              </span>
            )}
          </div>
          {showSubtitle && (
            <p className={`text-[#8e8e98] tracking-wide mt-1 font-sans ${sub}`}>
              Autonomous Metrology & Cleanroom RCA
            </p>
          )}
        </div>
      )}
    </div>
  );
};
