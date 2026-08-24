import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  Check, 
  ExternalLink,
  Cpu,
  Microscope,
  ShieldAlert
} from 'lucide-react';
import { MachineHealthRecord, WaferInspectionRecord } from '../../types';

export interface IndustrialNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: 'tool_drift' | 'defect_spike' | 'approval_required' | 'rag_sync' | 'security';
  read: boolean;
  linkTab?: string;
  metadata?: Record<string, any>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: IndustrialNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateTab: (tab: any) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigateTab
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'major' | 'info'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filterSeverity === 'all') return true;
    return n.severity === filterSeverity;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getSeverityStyle = (sev: IndustrialNotification['severity']) => {
    switch (sev) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bg: 'bg-red-950/40 border-red-500/40'
        };
      case 'major':
        return {
          icon: AlertTriangle,
          color: 'text-orange-400',
          bg: 'bg-orange-950/40 border-orange-500/40'
        };
      case 'minor':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-950/40 border-amber-500/40'
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: 'text-indigo-400',
          bg: 'bg-indigo-950/40 border-indigo-500/40'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end font-mono text-xs animate-in fade-in">
      <div className="bg-[#0b0b12] border-l border-[#222234] w-full max-w-md h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f2e] bg-[#10101a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-white text-sm">Industrial Notification Feed</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold text-[10px]">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[#8e8e98] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2 border-b border-[#1a1a28] bg-[#0d0d16] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            {(['all', 'critical', 'major', 'info'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded uppercase font-bold transition ${
                  filterSeverity === sev
                    ? 'bg-indigo-600 text-white'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
                title="Mark all as read"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClearAll}
              className="text-[#71717a] hover:text-red-400 transition"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#71717a]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
              <span className="font-bold text-white">All Alerts Acknowledged</span>
              <p className="text-[11px] text-[#71717a] mt-1 font-sans">
                Chamber sensors and automated CV pipelines running within nominal parameters.
              </p>
            </div>
          ) : (
            filtered.map(notif => {
              const style = getSeverityStyle(notif.severity);
              const Icon = style.icon;

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border transition ${style.bg} ${
                    notif.read ? 'opacity-70' : 'opacity-100 ring-1 ring-white/10 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 shrink-0 ${style.color}`} />
                      <span className="font-bold text-white text-xs">{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-[#71717a] whitespace-nowrap">{notif.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-[#d1d1db] font-sans leading-relaxed mb-2">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-[#a1a1aa] uppercase font-bold">
                      {notif.category.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          Mark Read
                        </button>
                      )}
                      {notif.linkTab && (
                        <button
                          onClick={() => {
                            onNavigateTab(notif.linkTab);
                            onClose();
                          }}
                          className="text-white hover:text-indigo-300 font-bold flex items-center gap-1"
                        >
                          <span>Open Tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f1f2e] bg-[#0e0e16] text-[10px] text-[#71717a] flex items-center justify-between">
          <span>Fab-09 Real-time Event Stream</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
      </div>
    </div>
  );
};
