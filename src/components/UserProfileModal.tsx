import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  SecurityAuditLog 
} from '../types';
import { 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Copy, 
  Check, 
  RefreshCw, 
  Clock, 
  Building2, 
  User, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRotateApiKey: () => Promise<string>;
  onSwitchUserPrompt: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onRotateApiKey,
  onSwitchUserPrompt,
  onLogout
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'audit'>('profile');

  useEffect(() => {
    if (isOpen) {
      api.getAuditLogs().then(logs => setAuditLogs(logs)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(user.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      await onRotateApiKey();
      const updatedLogs = await api.getAuditLogs().catch(() => []);
      setAuditLogs(updatedLogs);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        id="user-profile-modal"
        className="w-full max-w-xl bg-[#0d0d10] border border-[#1f1f23] rounded-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3.5">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover border border-[#27272a] shadow-sm" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#e0e0e0]">{user.name}</h3>
                <span className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${
                  user.role === 'admin' 
                    ? 'bg-red-950/70 text-red-300 border-red-500/30' 
                    : user.role === 'lead' 
                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                    : user.role === 'analyst'
                    ? 'bg-purple-950/70 text-purple-300 border-purple-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93] font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            id="close-user-profile-modal-btn"
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-[#e0e0e0] hover:bg-[#141418] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#1f1f23] pb-2 text-xs">
          <button
            id="user-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            Profile & Credentials
          </button>
          <button
            id="user-tab-permissions"
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'permissions' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            RBAC Matrix
          </button>
          <button
            id="user-tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            Security Audit Trail
          </button>
        </div>

        {/* Tab 1: Profile & Credentials */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#141418] border border-[#1f1f23] rounded-lg p-2.5">
                <span className="text-[10px] text-[#8e8e93] block font-medium">Department</span>
                <span className="text-xs text-[#e0e0e0] font-medium block mt-0.5">{user.department}</span>
              </div>

              <div className="bg-[#141418] border border-[#1f1f23] rounded-lg p-2.5">
                <span className="text-[10px] text-[#8e8e93] block font-medium">2FA Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-mono font-medium">
                    {user.mfaEnabled ? 'Verified (Active)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Token Quota Meter */}
            <div className="bg-[#141418] border border-[#1f1f23] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8e8e93] font-medium">Monthly Token Quota</span>
                <span className="font-mono text-[#e0e0e0]">
                  {user.usedTokens.toLocaleString()} / {user.tokenCountQuota.toLocaleString()} tokens
                </span>
              </div>
              <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((user.usedTokens / user.tokenCountQuota) * 100))}%` }} 
                />
              </div>
            </div>

            {/* API Key Box */}
            <div className="bg-[#0a0a0c] border border-[#1f1f23] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#8e8e93] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Bearer API Security Token
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="copy-api-key-btn"
                    onClick={handleCopyKey}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#141418] hover:bg-[#1f1f25] border border-[#1f1f23] text-[#8e8e93] hover:text-[#e0e0e0] transition cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    id="rotate-api-key-btn"
                    onClick={handleRotate}
                    disabled={isRotating}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#141418] hover:bg-[#1f1f25] border border-[#1f1f23] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    title="Generate new API token"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
              <code className="text-xs font-mono text-[#e0e0e0] block p-2 rounded bg-[#141418] border border-[#1f1f23] break-all select-all">
                {user.apiKey}
              </code>
            </div>
          </div>
        )}

        {/* Tab 2: Permissions Matrix */}
        {activeTab === 'permissions' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-mono text-[#8e8e93] uppercase tracking-wider block">
              Granular Role-Based Access Control (RBAC):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#1f1f23]">
                <span className="text-xs text-[#e0e0e0]">Tool Execution Engine</span>
                {user.permissions.canExecuteTools ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Blocked</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#1f1f23]">
                <span className="text-xs text-[#e0e0e0]">Human Approval Overrides</span>
                {user.permissions.canApproveHighRisk ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Granted
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Denied</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#1f1f23]">
                <span className="text-xs text-[#e0e0e0]">RAG Knowledge Base Ingestion</span>
                {user.permissions.canEditKnowledgeBase ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Read Only</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#1f1f23]">
                <span className="text-xs text-[#e0e0e0]">Episodic Memory Modifications</span>
                {user.permissions.canManageMemory ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Restricted</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security Audit Log */}
        {activeTab === 'audit' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-mono text-[#8e8e93] uppercase tracking-wider block">
              Recent Security Audit Events ({auditLogs.length}):
            </span>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-2 rounded bg-[#141418] border border-[#1f1f23] flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-indigo-300 text-[10px]">{log.action}</span>
                      <span className="text-[9px] font-mono text-[#71717a]">• {log.ipAddress}</span>
                    </div>
                    <p className="text-[11px] text-[#e0e0e0] leading-snug">{log.details}</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#71717a] shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-[#1f1f23] flex items-center justify-between">
          <button
            id="switch-profile-btn"
            onClick={() => {
              onClose();
              onSwitchUserPrompt();
            }}
            className="px-3 py-1.5 rounded-md bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            Switch Account / Role
          </button>

          <div className="flex items-center gap-2">
            <button
              id="logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-md bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-xs font-medium text-red-300 hover:text-red-200 transition cursor-pointer"
            >
              Sign Out
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-[#18181c] hover:bg-[#222228] text-xs font-medium text-[#e0e0e0] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
