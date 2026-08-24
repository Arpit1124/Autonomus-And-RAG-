import React, { useState } from 'react';
import { UserProfile, WaferInspectionRecord, MachineHealthRecord } from '../types';
import { 
  Microscope, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  RotateCcw, 
  ChevronDown, 
  Layers, 
  Sliders,
  Radio,
  Download,
  Clock,
  LogOut,
  RefreshCw,
  Zap,
  Search,
  Bell,
  Activity,
  HelpCircle
} from 'lucide-react';

interface Props {
  currentInspection: WaferInspectionRecord;
  allInspections: WaferInspectionRecord[];
  onSelectInspection: (inspection: WaferInspectionRecord) => void;
  isSimulationMode: boolean;
  machines: MachineHealthRecord[];
  currentUser: UserProfile;
  onNavigateTab: (tab: any) => void;
  onTriggerCopilot: (prompt: string) => void;
  remainingSeconds?: number;
  onExtendSession?: () => Promise<void>;
  onLogout?: () => void;
  onSimulateRemainingSeconds?: (sec: number) => void;
  onOpenSecuritySettings?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenSystemHealth?: () => void;
  onOpenHelpDocs?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<Props> = ({
  currentInspection,
  allInspections,
  onSelectInspection,
  isSimulationMode,
  machines,
  currentUser,
  onNavigateTab,
  onTriggerCopilot,
  remainingSeconds = 86400,
  onExtendSession,
  onLogout,
  onSimulateRemainingSeconds,
  onOpenSecuritySettings,
  onOpenGlobalSearch,
  onOpenNotifications,
  onOpenSystemHealth,
  onOpenHelpDocs,
  unreadNotificationsCount = 2
}) => {
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const hasAnomaly = machines.some(m => m.anomalyDetected);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  const formattedCountdown = hours > 0 
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarningState = remainingSeconds <= 300; // <= 5 minutes

  return (
    <header 
      id="app-header"
      className="h-14 border-b border-[#1a1a24] bg-[#09090d]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-20 shrink-0 select-none gap-3 text-white font-mono text-xs"
    >
      {/* Left: Wafer Batch / Lot Breadcrumb Selector */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 bg-[#121218] border border-[#22222e] rounded-xl px-3 py-1.5 text-xs">
          <Microscope className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-[#71717a] hidden sm:inline">Active Wafer:</span>
          <select
            value={currentInspection?.id || ''}
            onChange={(e) => {
              const selected = allInspections.find(i => i.id === e.target.value);
              if (selected) onSelectInspection(selected);
            }}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
          >
            {allInspections.map(insp => (
              <option key={insp.id} value={insp.id} className="bg-[#0e0e14] text-white">
                {insp.waferId} ({insp.lotId}) — {insp.decision.decision}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Quick Trigger */}
        {onOpenGlobalSearch && (
          <button
            id="global-search-btn"
            onClick={onOpenGlobalSearch}
            className="hidden lg:flex items-center gap-2 bg-[#12121c] hover:bg-[#181826] border border-[#222232] hover:border-indigo-500/50 px-2.5 py-1.5 rounded-xl text-[#8e8e98] hover:text-white transition cursor-pointer text-[11px]"
            title="Global Search across Wafers, Tools, SOPs (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>Search Metrology Index...</span>
            <kbd className="px-1.5 py-0.2 rounded bg-[#181826] border border-[#2c2c40] text-[9px] text-[#71717a]">⌘K</kbd>
          </button>
        )}

        {/* Machine Alert / Status Badge */}
        {hasAnomaly ? (
          <button
            onClick={() => onNavigateTab('machines')}
            className="hidden md:flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 px-2.5 py-1 rounded-lg text-red-300 text-[11px] font-bold cursor-pointer animate-pulse transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>M-03 CHAMBER DRIFT</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fleet Nominal</span>
          </div>
        )}
      </div>

      {/* Right: Global Utilities, Session Countdown Timer, Test Simulation & User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* System Health Monitor Trigger */}
        {onOpenSystemHealth && (
          <button
            id="header-system-health-btn"
            onClick={onOpenSystemHealth}
            className="p-1.5 rounded-lg bg-[#14141e] hover:bg-emerald-950/40 hover:text-emerald-300 border border-[#242432] text-[#8e8e98] transition cursor-pointer flex items-center gap-1.5"
            title="Fab-09 Distributed Infrastructure & Sensor Health"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Activity className="w-4 h-4 text-emerald-400" />
          </button>
        )}

        {/* Industrial Notification Center Trigger */}
        {onOpenNotifications && (
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-[#14141e] hover:bg-indigo-950/60 hover:text-indigo-300 border border-[#242432] text-[#8e8e98] transition cursor-pointer"
            title="Industrial Notification Feed"
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Help & Documentation Modal Trigger */}
        {onOpenHelpDocs && (
          <button
            id="header-help-docs-btn"
            onClick={onOpenHelpDocs}
            className="p-1.5 rounded-lg bg-[#14141e] hover:bg-[#1e1e2c] text-[#8e8e98] hover:text-white border border-[#242432] transition cursor-pointer"
            title="Cleanroom Handbook & SEMI Standards Guide"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* 24-Hour Live Token Timer with Dropdown Menu for Testing Expiry */}
        <div className="relative">
          <button
            id="session-timer-btn"
            onClick={() => setShowSessionMenu(!showSessionMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
              isWarningState
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse font-bold'
                : 'bg-[#12121a] border-[#222232] hover:border-indigo-500/50 text-[#e0e0e8]'
            }`}
            title="Click to view 24-Hour Session Status & Expiry Testing tools"
          >
            <Clock className={`w-3.5 h-3.5 ${isWarningState ? 'text-amber-400' : 'text-indigo-400'}`} />
            <span className="text-xs font-mono">{formattedCountdown}</span>
            <ChevronDown className="w-3 h-3 text-[#71717a]" />
          </button>

          {showSessionMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0e0e16] border border-[#222234] rounded-xl shadow-2xl p-3 space-y-2.5 z-50 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>24-Hour Session Protocol</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  SEMI Traceable
                </span>
              </div>

              <p className="text-[11px] text-[#8e8e98] font-sans">
                Issued for <strong className="text-white">{currentUser.name}</strong>. Automatically warns 5 minutes prior to 24h expiration.
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#71717a] font-bold uppercase">
                  Test Expiry Scenarios:
                </div>

                <button
                  onClick={() => {
                    onSimulateRemainingSeconds?.(290); // 4m 50s
                    setShowSessionMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#141420] hover:bg-amber-950/40 hover:text-amber-300 border border-[#222232] transition flex items-center justify-between text-[11px]"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trigger 5m Warning Modal</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">4m 50s</span>
                </button>

                <button
                  onClick={() => {
                    onSimulateRemainingSeconds?.(2); // 2 seconds
                    setShowSessionMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#141420] hover:bg-red-950/40 hover:text-red-300 border border-[#222232] transition flex items-center justify-between text-[11px]"
                >
                  <span className="flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Fast-Forward Auto-Logout</span>
                  </span>
                  <span className="text-[10px] text-red-400 font-bold">0s</span>
                </button>

                <button
                  onClick={async () => {
                    await onExtendSession?.();
                    setShowSessionMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 transition flex items-center justify-between text-[11px] font-bold"
                >
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reset / Extend (+24h)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">86400s</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Copilot */}
        <button
          id="header-copilot-btn"
          onClick={() => onNavigateTab('copilot')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/40 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* User Profile Button */}
        <button
          onClick={() => onNavigateTab('settings')}
          className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-[#121218] hover:bg-[#181822] border border-[#22222e] transition cursor-pointer"
          title="Vision Model & System Settings"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-xs font-bold text-white hidden md:inline">
            {currentUser.name.split(' ')[0]}
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 uppercase hidden lg:inline">
            {currentUser.role.replace('_', ' ')}
          </span>
        </button>

        {/* Security & Active Sessions Manager Button */}
        {onOpenSecuritySettings && (
          <button
            id="header-security-settings-btn"
            onClick={onOpenSecuritySettings}
            className="p-1.5 rounded-lg bg-[#14141e] hover:bg-indigo-950/60 hover:text-indigo-300 border border-[#242432] text-[#8e8e98] transition cursor-pointer"
            title="Security Governance, Password & Active Devices"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* Explicit Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-[#14141e] hover:bg-red-950/60 hover:text-red-300 border border-[#242432] text-[#8e8e98] transition cursor-pointer"
            title="Sign Out of Fab-09 Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
