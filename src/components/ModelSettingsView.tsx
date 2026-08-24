import React, { useState } from 'react';
import { VisionModelConfig, UserProfile, UserRole } from '../types';
import { 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Database,
  Users,
  Save,
  Lock,
  Mail,
  User,
  Building2,
  Check
} from 'lucide-react';

interface Props {
  config: VisionModelConfig;
  onUpdateConfig: (config: VisionModelConfig) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onUpdateUser?: (user: UserProfile) => void;
}

export const ModelSettingsView: React.FC<Props> = ({
  config,
  onUpdateConfig,
  currentUser,
  allUsers,
  onSwitchUser,
  onUpdateUser
}) => {
  const [localConfig, setLocalConfig] = useState<VisionModelConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile & Email state
  const [fabEmail, setFabEmail] = useState(currentUser.email);
  const [fabName, setFabName] = useState(currentUser.name);
  const [fabDept, setFabDept] = useState(currentUser.department);
  const [fabOrg, setFabOrg] = useState(currentUser.organization || 'Silicon Foundry Fab-09');
  const [profileSaved, setProfileSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const canModify = Boolean(currentUser?.permissions?.canModifyModelConfig) && currentUser?.role !== 'viewer' && currentUser?.role !== 'inspector';

  const handleSave = () => {
    if (!canModify) return;
    onUpdateConfig(localConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabEmail || !fabEmail.includes('@') || !fabEmail.includes('.')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);

    const updated: UserProfile = {
      ...currentUser,
      name: fabName.trim() || currentUser.name,
      email: fabEmail.trim().toLowerCase(),
      department: fabDept.trim() || currentUser.department,
      organization: fabOrg.trim() || currentUser.organization
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Vision Model Configuration & System Governance</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI Control
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Configure Computer Vision AI Model Parameters, Simulation / Production Endpoint Switching, and RBAC Profiles
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* RBAC Notice if View-Only */}
      {!canModify && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-amber-300 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>View-Only Settings (Role: {currentUser.role.toUpperCase()}): </strong> 
              Vision AI hyperparameter tuning is restricted to Quality Engineers and System Administrators.
            </span>
          </div>
          <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
            Read-Only
          </span>
        </div>
      )}

      {/* Main Grid: Left Vision Model Config, Right User Roles & Access Management */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Vision Model Parameters (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3 font-mono text-xs">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2.5">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Computer Vision Pipeline Parameters</span>
              </span>
              <span className="text-[10px] text-indigo-400">{localConfig.activeModelName}</span>
            </div>

            {/* Simulation Mode Toggle Card */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              localConfig.isSimulationMode
                ? 'bg-[#14141e] border-amber-500/40'
                : 'bg-[#14141e] border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs">Simulation / Demo Inspection Mode</span>
                  <p className="text-[11px] text-[#8e8e98] font-sans">
                    Use high-fidelity semiconductor simulation datasets without requiring active production fab connection.
                  </p>
                </div>

                <label className={`relative inline-flex items-center ${canModify ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                  <input
                    type="checkbox"
                    disabled={!canModify}
                    checked={localConfig.isSimulationMode}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, isSimulationMode: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#22222e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {localConfig.isSimulationMode ? (
                <div className="text-[10px] text-amber-300 flex items-center gap-1 font-semibold pt-1 border-t border-white/5">
                  <span>● Active Mode: Demonstration & Portfolio Simulation</span>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-300 flex items-center gap-1 font-semibold pt-1 border-t border-white/5">
                  <span>● Active Mode: Live Production Optical/SEM Endpoint</span>
                </div>
              )}
            </div>

            {/* Live Model Endpoint URL Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                Vision Inference Server Endpoint URL (YOLOv8 / Roboflow / TorchServe)
              </label>
              <div className="flex items-center gap-2 bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-white">
                <Globe className="w-4 h-4 text-[#71717a] shrink-0" />
                <input
                  type="text"
                  disabled={!canModify}
                  value={localConfig.endpointUrl || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, endpointUrl: e.target.value }))}
                  placeholder="https://vision-api.internal.fab9-semi.com/v1/inspect"
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-[#52525b] w-full font-mono disabled:opacity-50"
                />
              </div>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8e8e98]">Defect Confidence Threshold:</span>
                <strong className="text-emerald-400 font-bold">
                  {Math.round(localConfig.confidenceThreshold * 100)}%
                </strong>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.99"
                step="0.01"
                disabled={!canModify}
                value={localConfig.confidenceThreshold}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-[#1f1f2a] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* SEMI Standard Profile */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                SEMI Standard Specification Profile
              </label>
              <select
                disabled={!canModify}
                value={localConfig.semiStandardProfile}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, semiStandardProfile: e.target.value as 'SEMI_E10_STRICT' | 'SEMI_E30_STANDARD' | 'CUSTOM' }))}
                className="w-full bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="SEMI_E10_STRICT">SEMI E10 Strict (Automotive & Aerospace Grade)</option>
                <option value="SEMI_E30_STANDARD">SEMI E30 Standard (Commercial SoC Yield)</option>
                <option value="CUSTOM">Custom Fab Protocol Specification</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-[#1f1f26] flex items-center justify-between">
              <span className="text-[10px] text-[#71717a]">
                Configuration synchronized with Fab-09 Inference Node
              </span>

              <button
                disabled={!canModify}
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {canModify ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{canModify ? 'Save Parameters' : 'View-Only (Admin Required)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Fab Corporate Email & Operator Directory (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-4 font-mono text-xs">
          {/* Corporate Fab Email & Administrator Profile Editor */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2.5">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Fab Corporate Email & Identity</span>
              </span>
              {profileSaved && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Updated
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#8e8e98] uppercase font-bold flex items-center justify-between">
                  <span>Corporate Fab Email Address</span>
                  <span className="text-[9px] text-indigo-400">Notifications & Alerts</span>
                </label>
                <div className="flex items-center gap-2 bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-white">
                  <Mail className="w-4 h-4 text-[#71717a] shrink-0" />
                  <input
                    type="email"
                    required
                    value={fabEmail}
                    onChange={(e) => setFabEmail(e.target.value)}
                    placeholder="corporate.email@fab9.internal"
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-[#52525b] w-full font-mono"
                  />
                </div>
                {emailError && (
                  <p className="text-[10px] text-red-400">{emailError}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8e8e98] uppercase font-bold">
                  Administrator Display Name
                </label>
                <div className="flex items-center gap-2 bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-white">
                  <User className="w-4 h-4 text-[#71717a] shrink-0" />
                  <input
                    type="text"
                    required
                    value={fabName}
                    onChange={(e) => setFabName(e.target.value)}
                    placeholder="Arpit Sharma"
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-[#52525b] w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8e8e98] uppercase font-bold">
                    Department
                  </label>
                  <input
                    type="text"
                    value={fabDept}
                    onChange={(e) => setFabDept(e.target.value)}
                    placeholder="Enterprise Metrology"
                    className="w-full bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#52525b] font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#8e8e98] uppercase font-bold">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={fabOrg}
                    onChange={(e) => setFabOrg(e.target.value)}
                    placeholder="Silicon Foundry Fab-09"
                    className="w-full bg-[#12121a] border border-[#22222e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#52525b] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-[#71717a]">
                  Synchronizes profile across all active sessions
                </span>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Fab Email</span>
                </button>
              </div>
            </form>
          </div>

          {/* Operator Roles & RBAC Matrix */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2.5">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Active Fab Operator & RBAC</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">24h Tokens</span>
            </div>

            <div className="space-y-2">
              {allUsers.map((user) => {
                const isActive = user.id === currentUser.id;

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border transition space-y-1.5 ${
                      isActive
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                        : 'bg-[#121218] border-[#22222e] text-[#a1a1aa]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-xs font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">{user.name}</span>
                          <span className="text-[10px] text-indigo-300 uppercase font-semibold">{user.role.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          Active Session
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchUser(user)}
                          className="text-[10px] px-2.5 py-1 rounded bg-[#1c1c28] hover:bg-indigo-600 hover:text-white border border-[#2e2e3e] text-[#d4d4d8] transition cursor-pointer"
                        >
                          Switch Persona
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-[#8e8e98] flex items-center justify-between pt-0.5 font-sans">
                      <span>{user.department}</span>
                      <span className="font-mono text-[10px] text-indigo-300">{user.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
