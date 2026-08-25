import React, { useState, useEffect } from 'react';
import { VisionModelConfig, UserProfile, UserRole, CustomVoiceTrigger, VoiceTriggerActionType } from '../types';
import { globalVoiceService } from '../services/voiceCommandService';
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
  Check,
  Mic,
  Volume2,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  VolumeX,
  Edit2,
  HelpCircle,
  Tag,
  Radio,
  FileSpreadsheet
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
  const [activeSubTab, setActiveSubTab] = useState<'model_rbac' | 'voice_triggers' | 'templates_spec'>('model_rbac');
  const [localConfig, setLocalConfig] = useState<VisionModelConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile & Email state
  const [fabEmail, setFabEmail] = useState(currentUser.email);
  const [fabName, setFabName] = useState(currentUser.name);
  const [fabDept, setFabDept] = useState(currentUser.department);
  const [fabOrg, setFabOrg] = useState(currentUser.organization || 'Silicon Foundry Fab-09');
  const [profileSaved, setProfileSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Custom Voice Triggers State
  const [customTriggers, setCustomTriggers] = useState<CustomVoiceTrigger[]>([]);
  const [showAddTriggerModal, setShowAddTriggerModal] = useState(false);
  const [newTriggerPhrase, setNewTriggerPhrase] = useState('');
  const [newTriggerDescription, setNewTriggerDescription] = useState('');
  const [newTriggerActionType, setNewTriggerActionType] = useState<VoiceTriggerActionType>('RUN_INSPECTION');
  const [newTriggerCategory, setNewTriggerCategory] = useState<'inspection' | 'maintenance' | 'rca' | 'governance' | 'reports'>('inspection');
  const [newTriggerSpeech, setNewTriggerSpeech] = useState('');
  const [testedTriggerId, setTestedTriggerId] = useState<string | null>(null);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  // Load custom voice triggers on mount
  useEffect(() => {
    const loaded = globalVoiceService.getCustomTriggers();
    setCustomTriggers(loaded);
  }, []);

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

  const handleAddTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTriggerPhrase.trim()) return;

    let payload: any = {};
    if (newTriggerActionType === 'RUN_INSPECTION') {
      payload = { recipe: 'POLY-GATE-ETCH-V4', processStage: 'Dry Plasma Etch' };
    } else if (newTriggerActionType === 'CALIBRATE_CHAMBER') {
      payload = { machineId: 'M-03', chamber: 'CH-B', taskType: 'CALIBRATION' };
    } else if (newTriggerActionType === 'QUARANTINE_LOT') {
      payload = { lotId: 'LOT-9921-X', reason: 'Critical edge cluster defects' };
    } else if (newTriggerActionType === 'EXPORT_EXECUTIVE_REPORT') {
      payload = { template: 'executive_summary' };
    } else if (newTriggerActionType === 'EXPORT_TECHNICAL_REPORT') {
      payload = { template: 'full_technical' };
    } else if (newTriggerActionType === 'NAVIGATE_TAB') {
      payload = { tab: 'predictive' };
    }

    const created = globalVoiceService.addCustomTrigger({
      triggerPhrase: newTriggerPhrase.trim(),
      description: newTriggerDescription.trim() || `Custom voice trigger for ${newTriggerActionType}`,
      actionType: newTriggerActionType,
      actionPayload: payload,
      confirmationSpeech: newTriggerSpeech.trim() || `Executing sequence: ${newTriggerPhrase.trim()}`,
      category: newTriggerCategory,
      isEnabled: true,
      isSystemDefault: false
    });

    setCustomTriggers(globalVoiceService.getCustomTriggers());
    setShowAddTriggerModal(false);
    setNewTriggerPhrase('');
    setNewTriggerDescription('');
    setNewTriggerSpeech('');
    setVoiceToast(`Voice trigger "${created.triggerPhrase}" configured successfully!`);
    setTimeout(() => setVoiceToast(null), 3500);
  };

  const handleToggleTrigger = (id: string, isEnabled: boolean) => {
    const updated = globalVoiceService.updateCustomTrigger(id, { isEnabled });
    setCustomTriggers(updated);
  };

  const handleDeleteTrigger = (id: string) => {
    const updated = globalVoiceService.deleteCustomTrigger(id);
    setCustomTriggers(updated);
  };

  const handleResetTriggers = () => {
    const defaults = globalVoiceService.resetCustomTriggersToDefault();
    setCustomTriggers(defaults);
    setVoiceToast('Voice trigger phrase library reset to standard cleanroom defaults.');
    setTimeout(() => setVoiceToast(null), 3500);
  };

  const handleTestTrigger = (trigger: CustomVoiceTrigger) => {
    setTestedTriggerId(trigger.id);
    globalVoiceService.speak(trigger.confirmationSpeech || `Executing ${trigger.triggerPhrase}.`);
    globalVoiceService.playActionChime();
    setTimeout(() => setTestedTriggerId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Vision Model Configuration & Cleanroom Governance</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI Control
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Configure Computer Vision AI Model Parameters, Custom Voice Trigger Phrases, and RBAC Profiles
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#1f1f26] pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveSubTab('model_rbac')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'model_rbac'
              ? 'bg-indigo-950 text-white border border-indigo-500/80 shadow'
              : 'bg-[#0f0f16] text-[#8e8e98] hover:text-white border border-[#1f1f26]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vision Model & RBAC Directory</span>
        </button>

        <button
          onClick={() => setActiveSubTab('voice_triggers')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
            activeSubTab === 'voice_triggers'
              ? 'bg-indigo-950 text-white border border-indigo-500/80 shadow'
              : 'bg-[#0f0f16] text-[#8e8e98] hover:text-white border border-[#1f1f26]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span>Custom Voice Triggers</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30">
            {customTriggers.length}
          </span>
        </button>
      </div>

      {/* Voice Trigger Notification Toast */}
      {voiceToast && (
        <div className="p-3 rounded-xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-between text-indigo-200 text-xs font-mono shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{voiceToast}</span>
          </div>
          <button onClick={() => setVoiceToast(null)} className="text-[10px] text-indigo-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* RBAC Notice if View-Only */}
      {!canModify && activeSubTab === 'model_rbac' && (
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

      {/* ======================================================== */}
      {/* SUB-TAB 1: VISION MODEL & RBAC DIRECTORY                  */}
      {/* ======================================================== */}
      {activeSubTab === 'model_rbac' && (
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
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: CUSTOM VOICE TRIGGER PHRASES CONFIGURATION    */}
      {/* ======================================================== */}
      {activeSubTab === 'voice_triggers' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Header Action Bar */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-400" />
                <span>Custom Cleanroom Voice Trigger Phrases</span>
              </h3>
              <p className="text-[11px] text-[#8e8e98] font-sans mt-0.5">
                Define and customize spoken voice phrases to execute complex multi-step inspection sequences, chamber calibrations, and lot quarantine routines hands-free.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetTriggers}
                className="px-3 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1f1f2e] border border-[#262638] text-[#8e8e98] hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Reset trigger phrases to default cleanroom recipes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => setShowAddTriggerModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Trigger</span>
              </button>
            </div>
          </div>

          {/* Trigger List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customTriggers.map((trigger) => {
              const isTested = testedTriggerId === trigger.id;

              return (
                <div
                  key={trigger.id}
                  className={`bg-[#0b0b10] border rounded-xl p-4 flex flex-col justify-between space-y-3 transition ${
                    trigger.isEnabled 
                      ? 'border-[#1f1f26] hover:border-indigo-500/50' 
                      : 'border-[#191920] opacity-50 bg-[#08080c]'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {trigger.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#71717a]">
                          Used: {trigger.usageCount || 0}x
                        </span>
                        <button
                          onClick={() => handleToggleTrigger(trigger.id, !trigger.isEnabled)}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition ${
                            trigger.isEnabled 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'bg-[#181822] border-[#2d2d3d] text-transparent'
                          }`}
                          title={trigger.isEnabled ? 'Disable trigger' : 'Enable trigger'}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Spoken Trigger Phrase */}
                    <div>
                      <div className="text-[10px] text-[#71717a] uppercase font-bold">Spoken Phrase:</div>
                      <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>"{trigger.triggerPhrase}"</span>
                      </div>
                    </div>

                    {/* Sequence Description */}
                    <p className="text-[11px] text-[#8e8e98] font-sans line-clamp-2">
                      {trigger.description}
                    </p>

                    {/* Speech Confirmation Output */}
                    <div className="bg-[#111118] border border-[#1e1e2a] p-2 rounded-lg text-[10px] text-zinc-300 flex items-start gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="italic font-sans">"{trigger.confirmationSpeech}"</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#1a1a24] flex items-center justify-between">
                    <button
                      onClick={() => handleTestTrigger(trigger)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        isTested
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-[#14141e] border-[#222232] text-white hover:bg-indigo-600 hover:border-indigo-500'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isTested ? 'Tested!' : 'Simulate Voice'}</span>
                    </button>

                    {!trigger.isSystemDefault && (
                      <button
                        onClick={() => handleDeleteTrigger(trigger.id)}
                        className="p-1 text-[#71717a] hover:text-red-400 transition cursor-pointer"
                        title="Delete custom trigger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal / Overlay: Add New Custom Voice Trigger */}
          {showAddTriggerModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0e0e14] border border-[#2d2d3f] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#1f1f2b] pb-3">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-sm">Configure New Custom Voice Trigger</h3>
                  </div>
                  <button
                    onClick={() => setShowAddTriggerModal(false)}
                    className="text-[#71717a] hover:text-white text-xs px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddTrigger} className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                      Spoken Trigger Phrase (What you say)
                    </label>
                    <input
                      type="text"
                      required
                      value={newTriggerPhrase}
                      onChange={(e) => setNewTriggerPhrase(e.target.value)}
                      placeholder="e.g. Run standard etch inspection"
                      className="w-full bg-[#14141e] border border-[#262638] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                        Target Cleanroom Action
                      </label>
                      <select
                        value={newTriggerActionType}
                        onChange={(e) => setNewTriggerActionType(e.target.value as VoiceTriggerActionType)}
                        className="w-full bg-[#14141e] border border-[#262638] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="RUN_INSPECTION">Run Wafer Inspection Scan</option>
                        <option value="CALIBRATE_CHAMBER">Calibrate Chamber / Tool</option>
                        <option value="RUN_DEEP_RCA">Run Deep Diagnostic RCA</option>
                        <option value="QUARANTINE_LOT">Quarantine Wafer Lot</option>
                        <option value="EXPORT_EXECUTIVE_REPORT">Export Executive Summary PDF</option>
                        <option value="EXPORT_TECHNICAL_REPORT">Export Full Technical PDF</option>
                        <option value="NAVIGATE_TAB">Navigate Module Tab</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                        Category Classification
                      </label>
                      <select
                        value={newTriggerCategory}
                        onChange={(e) => setNewTriggerCategory(e.target.value as any)}
                        className="w-full bg-[#14141e] border border-[#262638] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="inspection">Inspection & Vision</option>
                        <option value="maintenance">Tool & Chamber Maintenance</option>
                        <option value="rca">Root-Cause & Diagnostics</option>
                        <option value="governance">Cleanroom Governance / Quarantines</option>
                        <option value="reports">Executive & Technical Reports</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                      Sequence Description / Recipe Details
                    </label>
                    <input
                      type="text"
                      value={newTriggerDescription}
                      onChange={(e) => setNewTriggerDescription(e.target.value)}
                      placeholder="e.g. Executes automated optical inspection for poly gate etch recipe"
                      className="w-full bg-[#14141e] border border-[#262638] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e8e98] uppercase font-bold block">
                      Spoken Audio Confirmation (What AI says back)
                    </label>
                    <input
                      type="text"
                      value={newTriggerSpeech}
                      onChange={(e) => setNewTriggerSpeech(e.target.value)}
                      placeholder="e.g. Running standard poly gate etch inspection sequence."
                      className="w-full bg-[#14141e] border border-[#262638] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#1f1f2b] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTriggerModal(false)}
                      className="px-3 py-1.5 rounded-xl text-[#8e8e98] hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Voice Trigger</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

