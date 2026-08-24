import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Terminal, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Radio,
  Activity,
  ChevronUp,
  ChevronDown,
  Layers,
  ShieldCheck,
  Cpu,
  BrainCircuit,
  Wrench,
  RotateCcw,
  Gauge,
  Flame,
  Volume1
} from 'lucide-react';
import { 
  globalVoiceService, 
  VoiceCommandMatch, 
  VOICE_COMMANDS_HELP, 
  MachineMaintenancePayload 
} from '../../services/voiceCommandService';
import { NavTab } from '../Sidebar';

interface Props {
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
  onTriggerInspection?: () => void;
  onBatchApprovePending?: () => void;
  onToggleBoundingBoxes?: () => void;
  onToggleHeatmap?: () => void;
  onNextWafer?: () => void;
  onPrevWafer?: () => void;
  onSendCopilotQuery?: (query: string) => void;
  onReadSummary?: () => void;
  onTriggerDeepDiagnostic?: () => void;
  onTriggerMaintenanceAction?: (payload: MachineMaintenancePayload) => void;
  isInspecting?: boolean;
  isDeepInvestigating?: boolean;
}

export const VoiceCommandHUD: React.FC<Props> = ({
  activeTab,
  onNavigateTab,
  onTriggerInspection,
  onBatchApprovePending,
  onToggleBoundingBoxes,
  onToggleHeatmap,
  onNextWafer,
  onPrevWafer,
  onSendCopilotQuery,
  onReadSummary,
  onTriggerDeepDiagnostic,
  onTriggerMaintenanceAction,
  isInspecting,
  isDeepInvestigating
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recentMatch, setRecentMatch] = useState<VoiceCommandMatch | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualText, setManualText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visualLevels, setVisualLevels] = useState<number[]>([15, 25, 40, 60, 45, 20, 30, 50, 20]);
  const [chimePlayedFlash, setChimePlayedFlash] = useState(false);

  // Audio animation loop when listening
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setVisualLevels(Array.from({ length: 9 }, () => Math.floor(Math.random() * 80) + 15));
      }, 100);
    } else {
      setVisualLevels([15, 20, 25, 20, 15, 20, 25, 20, 15]);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Initialize service callbacks
  useEffect(() => {
    globalVoiceService.setCallbacks({
      onTranscript: (text, isFinal) => {
        setTranscript(text);
      },
      onCommandMatched: (match) => {
        setRecentMatch(match);
        setChimePlayedFlash(true);
        setTimeout(() => setChimePlayedFlash(false), 800);
        executeCommandAction(match);
        setTimeout(() => {
          setRecentMatch(null);
        }, 4500);
      },
      onListeningState: (listening) => {
        setIsListening(listening);
      },
      onError: (err) => {
        setErrorMessage(err);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    });

    setIsMuted(globalVoiceService.getIsMuted());

    // Keyboard shortcut 'v' or 'V' to toggle listening when not typing in an input
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'v' || e.key === 'V') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        globalVoiceService.toggleListening();
        setIsExpanded(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, onTriggerDeepDiagnostic, onTriggerMaintenanceAction]);

  const executeCommandAction = (match: VoiceCommandMatch) => {
    switch (match.action) {
      case 'NAVIGATE':
        if (match.payload?.tab) {
          onNavigateTab(match.payload.tab);
        }
        break;
      case 'DEEP_DIAGNOSTIC':
        if (onTriggerDeepDiagnostic) {
          onTriggerDeepDiagnostic();
        } else {
          onNavigateTab('rca');
        }
        break;
      case 'MAINTENANCE_ACTION':
        if (onTriggerMaintenanceAction && match.payload) {
          onTriggerMaintenanceAction(match.payload);
        }
        break;
      case 'RUN_INSPECTION':
        if (onTriggerInspection) onTriggerInspection();
        break;
      case 'TOGGLE_BOUNDING_BOXES':
        if (onToggleBoundingBoxes) onToggleBoundingBoxes();
        break;
      case 'TOGGLE_HEATMAP':
        if (onToggleHeatmap) onToggleHeatmap();
        break;
      case 'NEXT_WAFER':
        if (onNextWafer) onNextWafer();
        break;
      case 'PREV_WAFER':
        if (onPrevWafer) onPrevWafer();
        break;
      case 'BATCH_APPROVE_PENDING':
        if (onBatchApprovePending) onBatchApprovePending();
        break;
      case 'COPILOT_QUERY':
        if (onSendCopilotQuery && match.payload?.query) {
          onNavigateTab('copilot');
          onSendCopilotQuery(match.payload.query);
        }
        break;
      case 'SPEAK_SUMMARY':
        if (onReadSummary) onReadSummary();
        break;
      case 'MUTE_AUDIO':
        setIsMuted(true);
        break;
      case 'UNMUTE_AUDIO':
        setIsMuted(false);
        break;
      default:
        break;
    }
  };

  const handleManualCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText);
    const match = globalVoiceService.processVoiceCommand(manualText);
    if (!match) {
      setErrorMessage(`No matching cleanroom command found for: "${manualText}". Try saying "run deep diagnostic" or "calibrate chamber B".`);
      setTimeout(() => setErrorMessage(null), 4000);
    }
    setManualText('');
  };

  const handleToggleMic = () => {
    globalVoiceService.toggleListening();
    if (!isListening) {
      setIsExpanded(true);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    globalVoiceService.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const testAuditoryChime = () => {
    globalVoiceService.playSuccessChime();
    setChimePlayedFlash(true);
    setTimeout(() => setChimePlayedFlash(false), 500);
  };

  const quickVoicePrompts = [
    { label: 'Deep Diagnostic', cmd: 'run deep diagnostic', icon: BrainCircuit, color: 'text-indigo-300 bg-indigo-950/60 border-indigo-500/40' },
    { label: 'Calibrate Chamber B', cmd: 'trigger chamber b calibration', icon: Wrench, color: 'text-amber-300 bg-amber-950/60 border-amber-500/40' },
    { label: 'Reset Tool M-03', cmd: 'reset tool m-03', icon: RotateCcw, color: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40' },
    { label: 'Purge Gas Line', cmd: 'purge gas line on tool m-01', icon: Flame, color: 'text-orange-300 bg-orange-950/60 border-orange-500/40' },
    { label: 'Run Vision Scan', cmd: 'run inspection', icon: Activity, color: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40' },
    { label: 'Batch Approve', cmd: 'batch approve pending', icon: ShieldCheck, color: 'text-purple-300 bg-purple-950/60 border-purple-500/40' },
    { label: 'Toggle Heatmap', cmd: 'toggle heatmap', icon: Layers, color: 'text-blue-300 bg-blue-950/60 border-blue-500/40' }
  ];

  return (
    <>
      {/* Floating Cleanroom Voice Controller Pill (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 font-mono text-xs select-none">
        <div className={`transition-all duration-300 rounded-2xl border shadow-2xl overflow-hidden ${
          isListening 
            ? 'bg-[#0a0a14]/95 border-indigo-500/80 shadow-indigo-500/20' 
            : 'bg-[#0a0a12]/90 border-[#222234] backdrop-blur-md'
        } ${isExpanded ? 'w-80 sm:w-96' : 'w-auto'}`}>
          
          {/* Collapsed / Main Bar */}
          <div className="p-2.5 flex items-center gap-2.5 justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="voice-mic-toggle-btn"
                onClick={handleToggleMic}
                title={isListening ? "Stop Hands-Free Cleanroom Listening" : "Start Hands-Free Cleanroom Voice Command (Hotkey: V)"}
                className={`relative p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-[11px] tracking-wide">Cleanroom Voice HUD</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isListening ? 'bg-red-950 text-red-300 border border-red-500/40 animate-pulse' : 'bg-[#181824] text-[#8e8e98]'
                  }`}>
                    {isListening ? 'LIVE' : 'STANDBY (V)'}
                  </span>
                </div>
                
                {/* Acoustic Equalizer Bars */}
                <div className="flex items-center gap-0.5 mt-1 h-3">
                  {visualLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        isListening ? (lvl > 50 ? 'bg-indigo-400' : 'bg-indigo-500') : 'bg-zinc-700'
                      }`}
                      style={{ height: `${Math.max(4, lvl * 0.14)}px` }}
                    />
                  ))}
                  <span className="text-[9px] text-[#71717a] ml-1.5">
                    {isListening ? 'Listening...' : 'Press V'}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls on Right */}
            <div className="flex items-center gap-1">
              {/* Auditory Chime Flash Indicator / Test */}
              <button
                type="button"
                id="voice-chime-test-btn"
                onClick={testAuditoryChime}
                title="Auditory Chime Feedback Active (Click to preview tone)"
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  chimePlayedFlash 
                    ? 'bg-emerald-500/40 text-emerald-300 border-emerald-400 scale-110 shadow-md shadow-emerald-500/40' 
                    : 'bg-[#141420] hover:bg-[#1f1f30] text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Volume1 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="voice-mute-toggle-btn"
                onClick={handleToggleMute}
                title={isMuted ? "Unmute Voice Readouts" : "Mute Voice Readouts"}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isMuted 
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                    : 'bg-[#141420] hover:bg-[#1f1f30] text-indigo-300 border-indigo-500/30'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                id="voice-help-btn"
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                title="SEMI Cleanroom Voice Command Protocol"
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isHelpOpen 
                    ? 'bg-indigo-600 text-white border-indigo-400' 
                    : 'bg-[#141420] hover:bg-[#1f1f30] text-[#a1a1aa] border-white/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="voice-expand-toggle-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-[#141420] hover:bg-[#1f1f30] text-[#a1a1aa] border border-white/10 transition cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expanded Drawer */}
          {isExpanded && (
            <div className="p-3 border-t border-[#1f1f30] bg-[#0c0c16]/95 space-y-2.5">
              {/* Live Transcript / Feedback Banner */}
              <div className="bg-[#121222] border border-[#23233c] rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-[#71717a]">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                    <span>ACOUSTIC TRANSCRIPT (EN-US):</span>
                  </span>
                  <span className="font-mono text-emerald-400 text-[9px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Auditory Chime: On</span>
                  </span>
                </div>
                
                <div className="min-h-[28px] text-[11px] text-white font-sans italic bg-black/40 px-2 py-1.5 rounded-lg border border-white/5 flex items-center">
                  {transcript ? (
                    <span>"{transcript}"</span>
                  ) : (
                    <span className="text-[#52525b] not-italic">Say a voice command (e.g. "Run Deep Diagnostic" or "Calibrate Chamber B")...</span>
                  )}
                </div>

                {/* Match Confirmation with Chime Signal */}
                {recentMatch && (
                  <div className="bg-indigo-950/80 border border-indigo-500/60 p-2 rounded-lg text-[10px] text-indigo-200 flex items-start gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Executed: {recentMatch.action}</span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1 rounded font-mono">♪ Chime Confirmed</span>
                      </div>
                      <div className="text-[10px] text-indigo-300">{recentMatch.description}</div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="bg-red-950/70 border border-red-500/50 p-2 rounded-lg text-[10px] text-red-200">
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Quick Voice Chips */}
              <div>
                <div className="text-[9px] text-[#71717a] font-bold mb-1.5 flex items-center justify-between">
                  <span>QUICK CLEANROOM PROMPTS:</span>
                  <span className="text-[8px] text-[#52525b]">Click or speak</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {quickVoicePrompts.map((p, idx) => {
                    const IconComp = p.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTranscript(p.cmd);
                          globalVoiceService.processVoiceCommand(p.cmd);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 font-mono hover:scale-102 ${p.color}`}
                      >
                        <IconComp className="w-3 h-3 shrink-0" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual Voice Command Input Console */}
              <form onSubmit={handleManualCommandSubmit} className="flex items-center gap-1.5 pt-1 border-t border-[#1f1f30]">
                <div className="relative flex-1">
                  <Terminal className="w-3 h-3 text-[#71717a] absolute left-2 top-2.5" />
                  <input
                    type="text"
                    id="manual-voice-command-input"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Type or simulate voice command..."
                    className="w-full bg-[#141424] border border-[#26263e] rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white placeholder-[#52525b] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  id="submit-voice-command-btn"
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>Exec</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Protocol Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e0e18] border border-[#282840] rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto font-sans shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232338] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <span>SEMI Cleanroom Voice Command Protocol</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                      Hands-Free Active
                    </span>
                  </h3>
                  <p className="text-xs text-[#8e8e98]">ISO Class 3/4 Hands-Free Speech Control & Synthesized Feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg bg-[#181828] hover:bg-[#24243c] text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {VOICE_COMMANDS_HELP.map((sec, idx) => (
                <div key={idx} className="bg-[#131322] border border-[#202036] rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 font-mono flex items-center justify-between">
                    <span>{sec.category}</span>
                  </div>
                  <div className="space-y-1.5">
                    {sec.commands.map((cmd, cIdx) => (
                      <div key={cIdx} className="bg-[#0b0b14] p-2 rounded-lg border border-white/5 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-mono text-white font-semibold">{cmd.trigger}</span>
                        <span className="text-[#8e8e98] text-[10px]">{cmd.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#232338] pt-3 flex items-center justify-between text-xs font-mono text-[#71717a]">
              <span>Global Hotkey: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">V</kbd> to toggle mic</span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
