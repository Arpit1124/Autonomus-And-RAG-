import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password?: string;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<Props> = ({ password = '', className = '' }) => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (password.length >= 12 && score === 4) score = 4;

  const getScoreColor = () => {
    switch (score) {
      case 1:
        return 'bg-red-500 text-red-400';
      case 2:
        return 'bg-amber-500 text-amber-400';
      case 3:
        return 'bg-blue-500 text-blue-400';
      case 4:
        return 'bg-emerald-500 text-emerald-400';
      default:
        return 'bg-zinc-700 text-zinc-500';
    }
  };

  const getScoreLabel = () => {
    switch (score) {
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong (Production Grade)';
      default:
        return 'Too short';
    }
  };

  if (!password) return null;

  return (
    <div className={`space-y-2 text-xs font-mono ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#8e8e98] uppercase">Password Strength:</span>
        <span className={`text-[11px] font-bold ${getScoreColor().split(' ')[1]}`}>
          {getScoreLabel()}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`rounded-full h-full transition-all duration-300 ${
              score >= step ? getScoreColor().split(' ')[0] : 'bg-[#1e1e2c]'
            }`}
          />
        ))}
      </div>

      {/* Requirement Badges */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-[#71717a]'}`}>
          {hasMinLength ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-zinc-600 shrink-0" />}
          <span>8+ Characters</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-[#71717a]'}`}>
          {hasUpper ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-zinc-600 shrink-0" />}
          <span>Uppercase (A-Z)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-[#71717a]'}`}>
          {hasNumber ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-zinc-600 shrink-0" />}
          <span>Number (0-9)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-[#71717a]'}`}>
          {hasSpecial ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-zinc-600 shrink-0" />}
          <span>Special Symbol (!@#$)</span>
        </div>
      </div>
    </div>
  );
};
