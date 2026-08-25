import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Send, 
  MessageSquare, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Edit3, 
  X, 
  Wifi, 
  WifiOff, 
  Zap,
  Terminal,
  Monitor,
  Tablet,
  Glasses
} from 'lucide-react';
import { 
  ActiveOperator, 
  OperatorLockInfo, 
  OperatorStatus, 
  UserProfile, 
  WaferInspectionRecord 
} from '../types';
import { 
  operatorPresenceService, 
  PresenceState 
} from '../services/operatorPresenceService';

interface Props {
  currentInspection: WaferInspectionRecord;
  currentUser: UserProfile;
  onShowToast?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export const ActiveOperatorsIndicator: React.FC<Props> = ({
  currentInspection,
  currentUser,
  onShowToast
}) => {
  const [presenceState, setPresenceState] = useState<PresenceState>(() => operatorPresenceService.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [customActionText, setCustomActionText] = useState('');
  const [pingTarget, setPingTarget] = useState<string | null>(null);
  const [pingMessage, setPingMessage] = useState('');
  const [isHandoverLoading, setIsHandoverLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync with service
  useEffect(() => {
    const unsubscribe = operatorPresenceService.subscribe((newState) => {
      setPresenceState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Update room when wafer changes
  useEffect(() => {
    if (currentInspection?.id) {
      operatorPresenceService.joinWaferRoom(currentInspection.id, currentUser);
    }
  }, [currentInspection?.id, currentUser]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const { operators, lockInfo, connectionState, latencyMs, currentUserStatus, recentPings } = presenceState;

  // Find who is currently modifying
  const modifyingOperator = operators.find(op => op.status === 'MODIFYING');
  const isAnotherUserModifying = !!modifyingOperator;
  const isCurrentUserModifying = currentUserStatus === 'MODIFYING';

  // Device icon helper
  const renderDeviceIcon = (type?: string) => {
    switch (type) {
      case 'cleanroom_hud':
        return (
          <span title="Cleanroom AR HUD">
            <Glasses className="w-3 h-3 text-indigo-400" />
          </span>
        );
      case 'tablet':
        return (
          <span title="Cleanroom Tablet">
            <Tablet className="w-3 h-3 text-emerald-400" />
          </span>
        );
      case 'terminal':
        return (
          <span title="Station Terminal">
            <Terminal className="w-3 h-3 text-amber-400" />
          </span>
        );
      default:
        return (
          <span title="Engineering Workstation">
            <Monitor className="w-3 h-3 text-cyan-400" />
          </span>
        );
    }
  };

  const handleToggleCurrentUserStatus = (newStatus: OperatorStatus) => {
    operatorPresenceService.setCurrentUserStatus(
      newStatus, 
      customActionText || undefined,
      newStatus === 'MODIFYING' ? 'Defect Annotations & Bounding Boxes' : undefined
    );
    if (newStatus === 'MODIFYING' && isAnotherUserModifying) {
      onShowToast?.(
        `Warning: ${modifyingOperator?.name} is also editing. Lock contention detected.`,
        'warning'
      );
    } else if (newStatus === 'MODIFYING') {
      onShowToast?.('Write lock acquired. Broadcasting your live modifications to all active operators.', 'info');
    } else {
      onShowToast?.('Switched to View-Only mode. Write lock released.', 'info');
    }
  };

  const handleRequestHandover = () => {
    setIsHandoverLoading(true);
    setTimeout(() => {
      operatorPresenceService.requestOrTakeoverLock('Write lock acquired via operator handover');
      setIsHandoverLoading(false);
      onShowToast?.(`Write lock transferred to ${currentUser.name}. Conflicting edits prevented.`, 'success');
    }, 600);
  };

  const handleSendPing = (targetOp: ActiveOperator) => {
    const text = pingMessage.trim() || 'Coordinating on Die #14 defect inspection and SEM review.';
    operatorPresenceService.sendPingToOperator(targetOp.id, text);
    onShowToast?.(`Cleanroom ping sent to ${targetOp.name} at ${targetOp.station}.`, 'info');
    setPingTarget(null);
    setPingMessage('');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* HEADER TRIGGER BADGE */}
      <button
        id="active-operators-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition cursor-pointer select-none ${
          isAnotherUserModifying
            ? 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-500/60 text-amber-200'
            : isCurrentUserModifying
              ? 'bg-indigo-950/50 hover:bg-indigo-900/60 border-indigo-500/60 text-indigo-200'
              : 'bg-[#12121a] hover:bg-[#181824] border-[#222232] text-[#e0e0e8]'
        }`}
        title="Live Cleanroom Peer Presence & Concurrency Lock"
      >
        {/* Connection Pulse Dot */}
        <div className="relative flex items-center justify-center">
          <span 
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' 
                ? isAnotherUserModifying 
                  ? 'bg-amber-400 animate-ping' 
                  : 'bg-emerald-400 animate-pulse'
                : connectionState === 'reconnecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-red-500'
            }`} 
          />
          <span 
            className={`absolute w-2 h-2 rounded-full ${
              connectionState === 'connected' 
                ? isAnotherUserModifying 
                  ? 'bg-amber-400' 
                  : 'bg-emerald-400'
                : 'bg-red-500'
            }`} 
          />
        </div>

        {/* Stacked Avatar Bubbles */}
        <div className="flex items-center -space-x-1.5">
          {operators.slice(0, 3).map((op, idx) => (
            <div
              key={op.id}
              className={`w-5 h-5 rounded-full bg-gradient-to-br ${op.avatarColor} border ${
                op.status === 'MODIFYING' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-[#09090d]'
              } flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}
              title={`${op.name} (${op.status}) - ${op.actionDetail}`}
            >
              {op.name.charAt(0)}
            </div>
          ))}
          {operators.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-[#20202e] border border-[#09090d] flex items-center justify-center text-[8px] font-bold text-[#a0a0b0]">
              +{operators.length - 3}
            </div>
          )}
        </div>

        {/* Status Label */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="hidden sm:inline font-bold">
            {operators.length + 1}
          </span>
          <span className="text-[11px] text-[#8e8e98] hidden lg:inline">
            Active {operators.length + 1 === 1 ? 'Operator' : 'Operators'}
          </span>
        </div>

        {/* Alert Pill if someone is actively modifying */}
        {isAnotherUserModifying && (
          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
            <Edit3 className="w-3 h-3 text-amber-400" />
            <span className="hidden xl:inline">Editing: {modifyingOperator?.name.split(' ')[0]}</span>
          </div>
        )}
      </button>

      {/* DETAILED COLLABORATION POPOVER DRAWER */}
      {isOpen && (
        <div 
          id="active-operators-popover"
          className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-[340px] sm:w-[420px] bg-[#0c0c13] border border-[#222234] rounded-2xl shadow-2xl z-50 overflow-hidden font-mono text-xs text-white divide-y divide-[#1c1c2b] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* 1. Header & Live Connection Status */}
          <div className="p-3.5 bg-[#10101a] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>Cleanroom Live Operators</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    SEMI E10 Shield
                  </span>
                </div>
                <div className="text-[10px] text-[#71717a] flex items-center gap-2 mt-0.5">
                  <span>Room: {currentInspection.waferId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-2.5 h-2.5" />
                    <span>{latencyMs}ms WebSocket</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1c1c28] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Concurrency Conflict Warning or Lock Status Banner */}
          <div className="p-3">
            {isAnotherUserModifying ? (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2 text-amber-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-xs text-amber-300">Concurrent Modification Guard</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-500/40 uppercase">
                    Write Lock Active
                  </span>
                </div>

                <p className="text-[11px] text-[#d4d4dc] leading-relaxed">
                  <strong className="text-white">{modifyingOperator?.name}</strong> ({modifyingOperator?.station}) is actively modifying defect annotations on this record.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-amber-400/90 font-mono">
                    Conflict Shield: Read-Only Mode Recommended
                  </span>
                  <button
                    onClick={handleRequestHandover}
                    disabled={isHandoverLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {isHandoverLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                    <span>Request Handover</span>
                  </button>
                </div>
              </div>
            ) : isCurrentUserModifying ? (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/50 space-y-2 text-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-indigo-300">You Hold the Active Write Lock</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-200 border border-indigo-500/40">
                    Broadcasting Live
                  </span>
                </div>
                <p className="text-[11px] text-[#c4c4d0]">
                  Your bounding box adjustments and notes are being synchronized in real-time to {operators.length} other cleanroom terminals.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleToggleCurrentUserStatus('VIEWING')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181828] hover:bg-[#222236] text-white border border-[#303046] text-[11px] font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-indigo-400" />
                    <span>Release Lock (Return to View-Only)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No active edit conflicts on wafer {currentInspection.waferId}.</span>
                </div>
                <button
                  onClick={() => handleToggleCurrentUserStatus('MODIFYING')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-indigo-400" />
                  <span>Acquire Edit Lock</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Real-Time Active Operators Roster */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#71717a]">
              <span className="font-bold uppercase tracking-wider">
                Active Teammates on this Record ({operators.length + 1})
              </span>
              <span>Cleanroom Sync: ON</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Current User Row */}
              <div className="p-2.5 rounded-xl bg-[#13131e] border border-[#222234] flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 border border-indigo-400 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs truncate">{currentUser.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        YOU
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8e8e98] truncate">
                      {currentUser.role} • Active Local Session
                    </div>
                    <div className="text-[10px] text-indigo-300 flex items-center gap-1 mt-0.5">
                      {currentUserStatus === 'MODIFYING' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>Status: Modifying Record (Lock Held)</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Status: Viewing / Inspecting</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleCurrentUserStatus(currentUserStatus === 'MODIFYING' ? 'VIEWING' : 'MODIFYING')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      currentUserStatus === 'MODIFYING'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-[#1a1a28] hover:bg-[#242436] text-[#c4c4d0] border-[#303046]'
                    }`}
                  >
                    {currentUserStatus === 'MODIFYING' ? <Lock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{currentUserStatus === 'MODIFYING' ? 'Editing' : 'Viewing'}</span>
                  </button>
                </div>
              </div>

              {/* Other Active Operators */}
              {operators.map((op) => {
                const isOpModifying = op.status === 'MODIFYING';
                return (
                  <div 
                    key={op.id}
                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-2.5 ${
                      isOpModifying 
                        ? 'bg-amber-950/20 border-amber-500/40' 
                        : 'bg-[#101018] hover:bg-[#141420] border-[#1e1e2c]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${op.avatarColor} border ${
                        isOpModifying ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/20'
                      } flex items-center justify-center font-bold text-white text-xs shrink-0 shadow`}>
                        {op.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">{op.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#1e1e2c] text-[#a0a0b0] truncate">
                            {op.role}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#71717a] flex items-center gap-1.5 mt-0.5">
                          {renderDeviceIcon(op.deviceType)}
                          <span className="truncate">{op.station} ({op.bay})</span>
                        </div>

                        <div className={`text-[10px] mt-1 flex items-center gap-1.5 ${
                          isOpModifying ? 'text-amber-300 font-bold' : 'text-[#8e8e98]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOpModifying ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                          }`} />
                          <span className="truncate">{op.actionDetail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                        isOpModifying 
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                          : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {op.status}
                      </span>

                      <button
                        onClick={() => setPingTarget(pingTarget === op.id ? null : op.id)}
                        className="px-2 py-0.5 rounded bg-[#181826] hover:bg-indigo-950 hover:text-indigo-300 border border-[#2c2c40] text-[10px] text-[#8e8e98] transition cursor-pointer flex items-center gap-1"
                        title="Send Cleanroom Coordination Message"
                      >
                        <MessageSquare className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Ping</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Ping Form (If active) */}
            {pingTarget && (
              <div className="p-2.5 rounded-xl bg-[#141424] border border-indigo-500/40 space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Send className="w-3 h-3 text-indigo-400" />
                    <span>Send Handshake Message to {operators.find(o => o.id === pingTarget)?.name}</span>
                  </span>
                  <button onClick={() => setPingTarget(null)} className="text-[#71717a] hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pingMessage}
                    onChange={(e) => setPingMessage(e.target.value)}
                    placeholder="e.g. Please release edit lock after Die #14 review..."
                    className="flex-1 bg-[#0a0a10] border border-[#2a2a3e] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#525260] focus:outline-none focus:border-indigo-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = operators.find(o => o.id === pingTarget);
                        if (target) handleSendPing(target);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const target = operators.find(o => o.id === pingTarget);
                      if (target) handleSendPing(target);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Real-Time Simulation & Demo Controls */}
          <div className="p-3 bg-[#0a0a10] space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[#71717a] font-bold uppercase">
              <span>Test WebSocket Events & Concurrency:</span>
              <span className="text-indigo-400">SEMI E10 Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                onClick={() => {
                  operatorPresenceService.simulateOperatorAction('toggle_modifying');
                  onShowToast?.('Simulated peer lock status update via WebSocket event broadcast.', 'info');
                }}
                className="p-1.5 rounded-lg bg-[#141420] hover:bg-[#1e1e30] border border-[#242436] text-[#a0a0b0] hover:text-white transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Simulate Peer Lock</span>
              </button>

              <button
                onClick={() => {
                  operatorPresenceService.simulateOperatorAction('add_operator');
                  onShowToast?.('New operator joined cleanroom inspection stream.', 'info');
                }}
                className="p-1.5 rounded-lg bg-[#141420] hover:bg-[#1e1e30] border border-[#242436] text-[#a0a0b0] hover:text-white transition text-left flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">+1 Cleanroom Peer</span>
              </button>
            </div>
          </div>

          {/* 5. Recent Ping Transmissions */}
          {recentPings.length > 0 && (
            <div className="p-2.5 bg-[#08080d] text-[10px] text-[#8e8e98] space-y-1">
              <div className="font-bold text-[#71717a] uppercase text-[9px]">
                Cleanroom Protocol Log:
              </div>
              <div className="truncate text-indigo-300">
                • {recentPings[0].text}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
