import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  remainingSeconds: number;
  onExtendSession: () => Promise<void>;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

export const SessionExpiryModal: React.FC<Props> = ({
  isOpen,
  remainingSeconds,
  onExtendSession,
  onLogout,
  userName = 'Operator',
  userRole = 'Quality Engineer'
}) => {
  const [isExtending, setIsExtending] = useState(false);
  const [extendSuccess, setExtendSuccess] = useState(false);

  if (!isOpen) return null;

  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.floor(Math.max(0, remainingSeconds) % 60);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate percentage of 5 minutes (300 seconds)
  const percentRemaining = Math.min(100, Math.max(0, (remainingSeconds / 300) * 100));

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
      setExtendSuccess(true);
      setTimeout(() => setExtendSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to extend session:', err);
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#0e0e14] border border-amber-500/50 rounded-2xl w-full max-w-md shadow-2xl shadow-amber-950/40 overflow-hidden text-white font-mono text-xs">
        {/* Header Alert Ribbon */}
        <div className="bg-gradient-to-r from-amber-950/80 via-orange-950/80 to-amber-950/80 border-b border-amber-500/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
                24-Hour Session Expiring
              </h2>
              <p className="text-[10px] text-amber-400/80">
                Security & Fab-09 Compliance Protocol
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Circular / Bar Countdown Display */}
          <div className="p-4 rounded-xl bg-[#14141e] border border-[#242436] space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-400 tracking-wider">
              <Clock className="w-6 h-6 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
              <span>{formattedTime}</span>
            </div>
            
            <p className="text-[11px] text-[#a1a1aa] font-sans">
              Your 24-hour metrology session for <strong className="text-white">{userName}</strong> ({userRole}) will automatically expire soon.
            </p>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#1e1e2c] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${percentRemaining}%` }}
              />
            </div>
            <div className="text-[9px] text-[#71717a] flex justify-between">
              <span>00:00 Auto-Logout</span>
              <span>5:00 Warning Window</span>
            </div>
          </div>

          {/* Warning notes */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[#d4d4d8] text-[11px] font-sans">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              To maintain semiconductor audit traceability (SEMI E10 & ISO 9001), active cleanroom sessions expire every 24 hours. You can extend your session now to continue without interruption.
            </p>
          </div>

          {extendSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Session Successfully Extended for 24 Hours!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onLogout}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#181824] hover:bg-[#222234] border border-[#2a2a3e] text-[#a1a1aa] hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Save & Sign Out</span>
            </button>

            <button
              onClick={handleExtend}
              disabled={isExtending}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isExtending ? 'animate-spin' : ''}`} />
              <span>{isExtending ? 'Extending...' : 'Extend (+24 Hours)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
