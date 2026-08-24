import React, { useEffect, useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { ToastNotification, SensitiveApprovalRequest, GeneratedFile } from '../types';

interface Props {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onOpenApproval?: (req: SensitiveApprovalRequest) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenFile?: (fileId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

// Audio synthesizer for enterprise sound cues
function playNotificationChime(type: ToastNotification['type']) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === 'approval') {
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
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {/* Header controls when multiple notifications exist */}
      {toasts.length > 1 && (
        <div className="flex items-center justify-between w-full bg-[#16161a]/90 backdrop-blur-md border border-[#2b2b32] px-3 py-1.5 rounded-lg text-xs text-zinc-400 pointer-events-auto shadow-lg mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="font-medium text-zinc-300">{toasts.length} Active Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="toggle-sound-btn"
              onClick={toggleSound}
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded hover:bg-[#26262c]"
              title={soundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            </button>
            <button
              id="clear-all-toasts-btn"
              onClick={onClearAll}
              className="text-zinc-400 hover:text-zinc-100 hover:underline transition-colors text-[11px]"
            >
              Dismiss All
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isApproval = toast.type === 'approval';
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          // Color & Icon styling
          let borderStyle = 'border-indigo-500/40 shadow-indigo-950/40';
          let bgStyle = 'bg-[#141418]/95';
          let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />;
          let badgeText = 'System Notification';
          let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

          if (isApproval) {
            borderStyle = 'border-amber-500/60 shadow-amber-950/50 ring-1 ring-amber-500/30';
            bgStyle = 'bg-[#18140e]/95';
            icon = <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />;
            badgeText = 'Approval Required';
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          } else if (isSuccess) {
            borderStyle = 'border-emerald-500/40 shadow-emerald-950/30';
            bgStyle = 'bg-[#0f1713]/95';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
            badgeText = 'Completed';
            badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          } else if (isError) {
            borderStyle = 'border-rose-500/50 shadow-rose-950/40';
            bgStyle = 'bg-[#170f12]/95';
            icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
            badgeText = 'Execution Error';
            badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          } else if (isWarning) {
            borderStyle = 'border-amber-500/40 shadow-amber-950/30';
            bgStyle = 'bg-[#181510]/95';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
            badgeText = 'Attention';
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              id={`toast-item-${toast.id}`}
              className={`w-full ${bgStyle} backdrop-blur-xl border ${borderStyle} rounded-xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-2.5 relative overflow-hidden group`}
            >
              {/* Subtle top indicator bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  isApproval ? 'bg-amber-400' : isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-indigo-400'
                }`} 
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100 leading-snug break-words">
                      {toast.title}
                    </h4>
                    <p className="text-xs text-zinc-300/90 mt-1 leading-relaxed break-words">
                      {toast.message}
                    </p>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  id={`dismiss-toast-${toast.id}`}
                  onClick={() => onDismiss(toast.id)}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-white/10 shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              {(isApproval || toast.actionLabel || toast.taskId || toast.fileId || toast.targetTab) && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60 mt-1">
                  {isApproval && toast.approvalRequest && onOpenApproval && (
                    <button
                      id={`toast-review-approval-${toast.id}`}
                      onClick={() => {
                        onOpenApproval(toast.approvalRequest!);
                        onDismiss(toast.id);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs rounded-lg transition-all shadow-md shadow-amber-950/40 flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Review & Approve Now
                    </button>
                  )}

                  {toast.taskId && onOpenTask && (
                    <button
                      id={`toast-view-task-${toast.id}`}
                      onClick={() => {
                        onOpenTask(toast.taskId!);
                        onDismiss(toast.id);
                      }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors border border-zinc-700 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View in Tasks
                    </button>
                  )}

                  {toast.fileId && onOpenFile && (
                    <button
                      id={`toast-inspect-file-${toast.id}`}
                      onClick={() => {
                        onOpenFile(toast.fileId!);
                        onDismiss(toast.id);
                      }}
                      className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-medium rounded-lg transition-colors border border-cyan-800/60 flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3" />
                      Open File
                    </button>
                  )}

                  {toast.actionLabel && toast.onAction && (
                    <button
                      id={`toast-custom-action-${toast.id}`}
                      onClick={() => {
                        toast.onAction!();
                        onDismiss(toast.id);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      {toast.actionLabel}
                    </button>
                  )}

                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
