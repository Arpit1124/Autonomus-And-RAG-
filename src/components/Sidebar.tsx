import React from 'react';
import { 
  Eye,
  BrainCircuit, 
  Layers, 
  Cpu, 
  History, 
  BookOpen, 
  Sparkles, 
  ShieldAlert, 
  BarChart2, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  UserCheck, 
  AlertTriangle,
  Microscope,
  Lock,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types';
import { WaferLogo } from './common/WaferLogo';

export type NavTab = 
  | 'inspection'
  | 'rca'
  | 'taxonomy'
  | 'machines'
  | 'history'
  | 'knowledge'
  | 'copilot'
  | 'hitl'
  | 'analytics'
  | 'reports'
  | 'audit'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingActionsCount?: number;
  anomalyDetected?: boolean;
  currentUser?: UserProfile | null;
  remainingSeconds?: number;
}

export const Sidebar: React.FC<Props> = ({ 
  activeTab, 
  onSelectTab,
  pendingActionsCount = 2,
  anomalyDetected = true,
  currentUser,
  remainingSeconds
}) => {
  const role = currentUser?.role || 'quality_engineer';
  const isInspector = role === 'inspector';
  const isViewer = role === 'viewer';
  const isManager = role === 'production_manager';
  const isAdmin = role === 'admin';

  // Navigation Items with RBAC constraints
  const primaryNavItems = [
    {
      id: 'inspection' as NavTab,
      label: 'AI Visual Inspection',
      icon: Microscope,
      badge: 'Live CV',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      allowed: true
    },
    {
      id: 'rca' as NavTab,
      label: 'Root Cause Analysis',
      icon: BrainCircuit,
      badge: '5-Whys + 6M',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      allowed: true
    },
    {
      id: 'taxonomy' as NavTab,
      label: 'Defect Taxonomy',
      icon: Layers,
      badge: 'SEMI M10',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      allowed: true
    },
    {
      id: 'machines' as NavTab,
      label: 'Tool Fleet & Change Mgmt',
      icon: Cpu,
      badge: anomalyDetected ? 'M-03 Drift' : '6 Nominal',
      badgeColor: anomalyDetected 
        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      allowed: true
    },
    {
      id: 'history' as NavTab,
      label: 'Historical Case Intelligence',
      icon: History,
      badge: 'Pattern 94%',
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      allowed: true
    },
    {
      id: 'knowledge' as NavTab,
      label: 'Industrial RAG Knowledge',
      icon: BookOpen,
      badge: isViewer ? 'Read-Only' : 'Vector DB',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      allowed: true
    },
    {
      id: 'copilot' as NavTab,
      label: 'Autonomous AI Copilot',
      icon: Sparkles,
      badge: 'Agentic DAG',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
      allowed: true
    },
    {
      id: 'hitl' as NavTab,
      label: 'Human-in-the-Loop Review',
      icon: ShieldAlert,
      badge: (isInspector || isViewer)
        ? 'View-Only'
        : pendingActionsCount > 0 
        ? `${pendingActionsCount} Pending` 
        : 'Verified',
      badgeColor: (isInspector || isViewer)
        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        : pendingActionsCount > 0 
        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      allowed: true,
      restrictedActionNote: (isInspector || isViewer) ? 'Sign-off permissions restricted to Quality Engineers & Managers' : undefined
    },
    {
      id: 'analytics' as NavTab,
      label: 'Yield & Pareto Analytics',
      icon: BarChart2,
      badge: '30-Day SPC',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      allowed: true
    },
    {
      id: 'reports' as NavTab,
      label: 'Inspection & Certification',
      icon: FileText,
      badge: 'Digital Seal',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      allowed: true
    },
    {
      id: 'audit' as NavTab,
      label: 'Compliance & Audit Mgmt',
      icon: ShieldCheck,
      badge: (isInspector || isViewer) ? 'Restricted' : 'ISO 9001',
      badgeColor: (isInspector || isViewer) ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
      // Audit logs restricted for Inspector and Viewer roles
      allowed: !isInspector && !isViewer,
      locked: isInspector || isViewer,
      lockReason: 'Requires Engineer, Manager, or Admin role'
    },
    {
      id: 'settings' as NavTab,
      label: 'Vision & AI Governance',
      icon: Sliders,
      badge: isViewer ? 'Locked' : (isInspector || isManager) ? 'View-Only' : 'Model Drift',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      allowed: !isViewer,
      locked: isViewer,
      lockReason: 'Requires active Fab-09 Engineering Role'
    }
  ];

  // Format remaining session time
  const formatSessionTime = (totalSec?: number) => {
    if (totalSec === undefined) return '24h Token';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    if (hrs > 0) return `${hrs}h ${mins}m remaining`;
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <aside className="w-64 bg-[#08080c] border-r border-[#1a1a24] flex flex-col h-screen shrink-0 text-white font-mono text-xs select-none">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-[#1a1a24] flex items-center">
        <WaferLogo size="sm" showSubtitle={true} badge="Fab-09" />
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#71717a] tracking-wider flex items-center justify-between">
          <span>Industrial Modules</span>
          <span className="text-[9px] text-indigo-400 font-bold lowercase">rbac active</span>
        </div>

        {primaryNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.locked) {
            return (
              <div
                key={item.id}
                title={`Access Restricted: ${item.lockReason}`}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#52525b] bg-[#0b0b10] border border-[#161620] cursor-not-allowed opacity-60"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Lock className="w-4 h-4 text-red-400/60 shrink-0" />
                  <span className="truncate text-xs line-through">{item.label}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-red-950/60 text-red-400 border border-red-500/30">
                  Locked
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left group ${
                isActive
                  ? 'bg-indigo-950/80 border border-indigo-500/60 text-white shadow-md'
                  : 'text-[#8e8e98] hover:text-white hover:bg-[#12121c] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-indigo-400' : 'text-[#71717a] group-hover:text-white'}`} />
                <span className="truncate text-xs font-medium">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 24-Hour Session Timer Ribbon in Sidebar */}
      {remainingSeconds !== undefined && (
        <div className="px-3 py-2 border-t border-[#1a1a24] bg-[#0a0a10]">
          <div className="flex items-center justify-between text-[10px] text-[#8e8e98]">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${remainingSeconds < 300 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
              <span className="text-white font-bold">24h Session</span>
            </div>
            <span className={`font-bold ${remainingSeconds < 300 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {formatSessionTime(remainingSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1a1a24] bg-[#0c0c12] flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
            {currentUser?.name.charAt(0) || 'E'}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'Dr. Arpit Sharma'}</div>
            <div className="text-[9px] text-indigo-400 truncate uppercase">{currentUser?.role.replace('_', ' ') || 'Lead Quality Eng.'}</div>
          </div>
        </div>

        {!isViewer && (
          <button 
            onClick={() => onSelectTab('settings')}
            className="text-[#71717a] hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
            title="System Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
