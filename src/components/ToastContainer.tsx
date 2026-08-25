import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShieldAlert, 
  ExternalLink, 
  X, 
  Volume2, 
  VolumeX, 
  FileText,
  Clock,
  Sparkles,
  Siren,
  Flame,
  Wrench,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ToastNotification, SensitiveApprovalRequest } from '../types';

interface Props {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onOpenApproval?: (req: SensitiveApprovalRequest) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenFile?: (fileId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

// Audio synthesizer for industrial and cleanroom alarms
function playNotificationChime(type: ToastNotification['type']) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === 'critical') {
      // Urgent high-priority double pulse alarm (Emergency cleanroom alert)
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.exponentialRampToValueAtTime(440, now + offset + 0.12);
        
        gain.gain.setValueAtTime(0.09, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
    } else if (type === 'approval') {
      // Attention chime (two-tone rising alert)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(440, now); // A4
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      
      osc2.frequency.setValueAtTime(554.37, now); // C#5
      osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.15);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (type === 'success') {
      // Pleasant completion chime (major third chord)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'error') {
      // Soft low error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // AudioContext blocked or not allowed, ignore gracefully
  }
}

// Single Auto-Dismissing Toast Component with Progress Countdown
interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onOpenApproval?: (req: SensitiveApprovalRequest) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenFile?: (fileId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  onDismiss,
  onOpenApproval,
  onOpenTask,
  onOpenFile,
  onNavigateTab
}) => {
  // Default auto-dismiss duration: 7000ms for critical, 6000ms for others
  const defaultDuration = toast.type === 'critical' ? 7000 : (toast.autoDismissMs || toast.durationMs || 6000);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(defaultDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / defaultDuration) * 100));

  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // update every 50ms
    const timer = setInterval(() => {
      setTimeLeftMs(prev => {
        if (prev <= interval) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, onDismiss, defaultDuration, isPaused]);

  const isCritical = toast.type === 'critical' || toast.title.toLowerCase().includes('chamber drift') || toast.title.toLowerCase().includes('m-03');
  const isApproval = toast.type === 'approval';
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  // Styling
  let borderStyle = 'border-indigo-500/40 shadow-indigo-950/40';
  let bgStyle = 'bg-[#141418]/95';
  let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />;
  let badgeText = 'System Notification';
  let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  let progressColor = 'bg-indigo-500';

  if (isCritical) {
    borderStyle = 'border-red-500 shadow-red-950/80 ring-2 ring-red-500/40 animate-pulse';
    bgStyle = 'bg-[#1a0b0e]/95';
    icon = <Siren className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />;
    badgeText = 'CRITICAL OPERATOR ALERT';
    badgeColor = 'bg-red-950 text-red-300 border-red-500 font-bold';
    progressColor = 'bg-gradient-to-r from-red-500 to-amber-500';
  } else if (isApproval) {
    borderStyle = 'border-amber-500/60 shadow-amber-950/50 ring-1 ring-amber-500/30';
    bgStyle = 'bg-[#18140e]/95';
    icon = <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />;
    badgeText = 'Approval Required';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    progressColor = 'bg-amber-500';
  } else if (isSuccess) {
    borderStyle = 'border-emerald-500/40 shadow-emerald-950/30';
    bgStyle = 'bg-[#0f1713]/95';
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
    badgeText = 'Completed';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    progressColor = 'bg-emerald-500';
  } else if (isError) {
    borderStyle = 'border-rose-500/50 shadow-rose-950/40';
    bgStyle = 'bg-[#170f12]/95';
    icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
    badgeText = 'Execution Error';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    progressColor = 'bg-rose-500';
  } else if (isWarning) {
    borderStyle = 'border-amber-500/40 shadow-amber-950/30';
    bgStyle = 'bg-[#181510]/95';
    icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
    badgeText = 'Warning';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    progressColor = 'bg-amber-500';
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      id={`toast-item-${toast.id}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`w-full ${bgStyle} backdrop-blur-xl border ${borderStyle} rounded-xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-2 relative overflow-hidden group`}
    >
      {/* Auto-Dismiss Countdown Progress Bar (Top) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 overflow-hidden">
        <div 
          className={`h-full ${progressColor} transition-all duration-75`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {badgeText}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 ml-auto font-mono">
                <Clock className="w-3 h-3" />
                {Math.ceil(timeLeftMs / 1000)}s
              </span>
            </div>

            <h4 className="text-sm font-semibold text-zinc-100 leading-snug break-words flex items-center gap-1.5">
              <span>{toast.title}</span>
              {isCritical && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-900/80 text-red-200 border border-red-500/50 uppercase">
                  Urgent Attention
                </span>
              )}
            </h4>
            <p className="text-xs text-zinc-300/90 mt-1 leading-relaxed break-words font-sans">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          id={`dismiss-toast-${toast.id}`}
          onClick={() => onDismiss(toast.id)}
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-md hover:bg-white/10 shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 mt-1">
        <span className="text-[10px] text-zinc-500 font-mono">
          {isPaused ? 'Paused on hover' : 'Auto-dismissing'}
        </span>

        <div className="flex items-center gap-2">
          {/* Critical M-03 Action Jump */}
          {(isCritical || toast.title.toLowerCase().includes('m-03')) && onNavigateTab && (
            <button
              id={`toast-investigate-m03-${toast.id}`}
              onClick={() => {
                onNavigateTab('machines');
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono rounded-lg transition-colors shadow-md shadow-red-950/50 flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Inspect Tool M-03</span>
            </button>
          )}

          {isApproval && toast.approvalRequest && onOpenApproval && (
            <button
              id={`toast-review-approval-${toast.id}`}
              onClick={() => {
                onOpenApproval(toast.approvalRequest!);
                onDismiss(toast.id);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs rounded-lg transition-all shadow-md shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Review & Approve
            </button>
          )}

          {toast.targetTab && onNavigateTab && !isCritical && (
            <button
              id={`toast-target-tab-${toast.id}`}
              onClick={() => {
                onNavigateTab(toast.targetTab);
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {toast.actionLabel && toast.onAction && (
            <button
              id={`toast-custom-action-${toast.id}`}
              onClick={() => {
                toast.onAction!();
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {toast.actionLabel}
            </button>
          )}

          <button
            onClick={() => onDismiss(toast.id)}
            className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer font-mono"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<Props> = ({
  toasts,
  onDismiss,
  onClearAll,
  onOpenApproval,
  onOpenTask,
  onOpenFile,
  onNavigateTab
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('agentos_sound_notifications') !== 'false';
  });

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('agentos_sound_notifications', String(next));
      return next;
    });
  };

  // Play chime on new toast arrival
  useEffect(() => {
    if (toasts.length > 0 && soundEnabled) {
      const newest = toasts[0];
      playNotificationChime(newest.type);
    }
  }, [toasts[0]?.id]);

  if (toasts.length === 0) return null;

  return (
    <div 
      id="toast-notification-region"
      aria-live="assertive"
      className="fixed top-5 right-5 z-[9999] flex flex-col items-end gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {/* Header controls when multiple notifications exist */}
      {toasts.length > 1 && (
        <div className="flex items-center justify-between w-full bg-[#16161a]/95 backdrop-blur-md border border-[#2b2b32] px-3.5 py-2 rounded-xl text-xs text-zinc-400 pointer-events-auto shadow-2xl mb-1 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-zinc-200">{toasts.length} Cleanroom Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="toggle-sound-btn"
              onClick={toggleSound}
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded hover:bg-[#26262c] cursor-pointer"
              title={soundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            </button>
            <button
              id="clear-all-toasts-btn"
              onClick={onClearAll}
              className="text-zinc-400 hover:text-zinc-100 hover:underline transition-colors text-[11px] cursor-pointer"
            >
              Dismiss All
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onOpenApproval={onOpenApproval}
            onOpenTask={onOpenTask}
            onOpenFile={onOpenFile}
            onNavigateTab={onNavigateTab}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
