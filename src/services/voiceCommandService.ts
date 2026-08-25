// Cleanroom Voice Command Service for Semiconductor Operations
import { NavTab } from '../components/Sidebar';
import { CustomVoiceTrigger } from '../types';

export interface VoiceCommandMatch {
  action: string;
  category: 'navigation' | 'inspection' | 'rca' | 'hitl' | 'copilot' | 'maintenance' | 'audio' | 'general' | 'reports' | 'governance';
  description: string;
  feedbackText: string;
  payload?: any;
}

export const DEFAULT_CUSTOM_VOICE_TRIGGERS: CustomVoiceTrigger[] = [
  {
    id: 'vt-01',
    triggerPhrase: 'Run standard etch inspection',
    description: 'Executes automated optical & SEM inspection filtered to dry plasma etch gate parameters',
    actionType: 'RUN_INSPECTION',
    actionPayload: { recipe: 'POLY-GATE-ETCH-V4', processStage: 'Dry Plasma Etch', autoScan: true },
    confirmationSpeech: 'Executing standard dry plasma poly gate etch inspection sequence.',
    category: 'inspection',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 14,
    lastTriggered: '2026-08-24T05:40:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'vt-02',
    triggerPhrase: 'Flag wafer for SEM review',
    description: 'Marks active wafer as quarantined and triggers high-resolution SEM metrology task',
    actionType: 'RUN_DEEP_RCA',
    actionPayload: { triggerSemReview: true, targetStation: 'Station-02 High-NA SEM' },
    confirmationSpeech: 'Wafer flagged for automated SEM review and causal investigation.',
    category: 'inspection',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 8,
    lastTriggered: '2026-08-23T14:15:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'vt-03',
    triggerPhrase: 'Calibrate chamber vacuum',
    description: 'Dispatches automated vacuum pressure calibration routine to Tool M-03 Chamber B',
    actionType: 'CALIBRATE_CHAMBER',
    actionPayload: { machineId: 'M-03', chamber: 'CH-B', taskType: 'CALIBRATION', title: 'Chamber B Vacuum & Pressure Re-zero' },
    confirmationSpeech: 'Initiating chamber vacuum and pressure transducer calibration sequence.',
    category: 'maintenance',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 5,
    lastTriggered: '2026-08-22T09:20:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'vt-04',
    triggerPhrase: 'Trigger lot quarantine',
    description: 'Locks current wafer lot from advancing to photolithography and generates P0 CAPA',
    actionType: 'QUARANTINE_LOT',
    actionPayload: { lotId: 'LOT-9921-X', reason: 'Critical edge crack defect cluster' },
    confirmationSpeech: 'Emergency quarantine protocol active. Lot locked and P0 corrective action order logged.',
    category: 'governance',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 3,
    lastTriggered: '2026-08-20T11:05:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'vt-05',
    triggerPhrase: 'Generate executive summary report',
    description: 'Compiles inspection findings into executive yield format and opens report certification',
    actionType: 'EXPORT_EXECUTIVE_REPORT',
    actionPayload: { template: 'executive_summary' },
    confirmationSpeech: 'Compiling Executive Summary Quality Certification report.',
    category: 'reports',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 19,
    lastTriggered: '2026-08-24T05:12:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'vt-06',
    triggerPhrase: 'Open predictive maintenance',
    description: 'Switches to the Chamber Failure Forecasting & Predictive Maintenance module',
    actionType: 'NAVIGATE_TAB',
    actionPayload: { tab: 'predictive' },
    confirmationSpeech: 'Navigating to Predictive Maintenance and Chamber Telemetry Forecasting.',
    category: 'maintenance',
    isEnabled: true,
    isSystemDefault: true,
    usageCount: 12,
    lastTriggered: '2026-08-24T06:00:00Z',
    createdAt: '2026-08-01T00:00:00Z'
  }
];

export interface MachineMaintenancePayload {
  machineId: string;
  taskType: 'CALIBRATION' | 'RESET' | 'PURGE' | 'SELF_TEST' | 'SET_STATUS';
  chamber?: string;
  title: string;
  statusTarget?: 'nominal' | 'warning' | 'anomaly' | 'maintenance';
}

export const VOICE_COMMANDS_HELP = [
  {
    category: 'Navigation',
    commands: [
      { trigger: '"Go to / Open [module]"', desc: 'e.g. "Open Inspection", "Go to Root Cause Analysis", "Show Fleet Telemetry", "Open Knowledge Base", "Open Corrective Actions", "Open Copilot", "View Audit Trail", "Open Settings"' },
      { trigger: '"Previous / Next tab"', desc: 'Navigate between consecutive industrial workstation tabs' }
    ]
  },
  {
    category: 'AI Root-Cause & Deep Diagnostics',
    commands: [
      { trigger: '"Run Deep Diagnostic" / "Investigate Root Cause"', desc: 'Opens RCA engine and initiates an AI multi-source causal correlation scan on current wafer defects' },
      { trigger: '"Ask copilot [question]"', desc: 'e.g. "Ask copilot what caused the scratch on machine 3"' },
      { trigger: '"Diagnose chamber B"', desc: 'Prompts copilot with M-03 Chamber B thermal drift RCA query' }
    ]
  },
  {
    category: 'Cleanroom Machine Maintenance Tasks',
    commands: [
      { trigger: '"Trigger Chamber B Calibration"', desc: 'Calibrates thermal and pressure drift on Tool M-03 Chamber B to SEMI baseline' },
      { trigger: '"Reset Tool M-03" / "Reboot Machine M-03"', desc: 'Clears soft-fault flags and resets tool communication controllers' },
      { trigger: '"Purge Gas Line on Tool M-01"', desc: 'Initiates high-purity inert purge cycle through mass flow controllers' },
      { trigger: '"Run Diagnostic Self-Test on Tool M-03"', desc: 'Executes comprehensive actuator, plasma RF, and sensor loop self-test' }
    ]
  },
  {
    category: 'Wafer Inspection & Vision',
    commands: [
      { trigger: '"Run inspection" / "Scan wafer"', desc: 'Triggers active YOLOv8 computer vision detection on current wafer' },
      { trigger: '"Toggle bounding boxes" / "Toggle heatmap"', desc: 'Toggles defect overlay and heat map visualizers on the wafer map' },
      { trigger: '"Next wafer" / "Previous wafer"', desc: 'Cycles through wafer lot items (W-4820, W-4821, etc.)' },
      { trigger: '"Read inspection summary"', desc: 'Speaks defect count, yield score, and official SEMI verdict aloud' }
    ]
  },
  {
    category: 'Cleanroom HITL & Approvals',
    commands: [
      { trigger: '"Batch approve pending"', desc: 'Authorizes all pending corrective actions with cleanroom voice signature' },
      { trigger: '"Batch reject"', desc: 'Rejects currently selected corrective actions' }
    ]
  },
  {
    category: 'Audio & Workstation Settings',
    commands: [
      { trigger: '"Mute voice" / "Unmute voice"', desc: 'Toggles audio speech synthesis readouts' },
      { trigger: '"Stop listening" / "Start listening"', desc: 'Toggles continuous microphone capture state' }
    ]
  }
];

export class VoiceCommandService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;
  private speechSynth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private audioCtx: AudioContext | null = null;
  private onTranscriptCallback?: (transcript: string, isFinal: boolean) => void;
  private onCommandMatchedCallback?: (match: VoiceCommandMatch) => void;
  private onListeningStateCallback?: (isListening: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private customTriggers: CustomVoiceTrigger[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.isSupported = true;
        this.setupRecognitionEvents();
      }

      if ('speechSynthesis' in window) {
        this.speechSynth = window.speechSynthesis;
      }

      this.loadCustomTriggers();
    }
  }

  // Load custom triggers from LocalStorage or fall back to default cleanroom triggers
  public loadCustomTriggers(): CustomVoiceTrigger[] {
    if (typeof window === 'undefined') {
      this.customTriggers = DEFAULT_CUSTOM_VOICE_TRIGGERS;
      return this.customTriggers;
    }
    try {
      const saved = localStorage.getItem('waferguard_custom_voice_triggers');
      if (saved) {
        this.customTriggers = JSON.parse(saved);
      } else {
        this.customTriggers = [...DEFAULT_CUSTOM_VOICE_TRIGGERS];
        this.saveCustomTriggers(this.customTriggers);
      }
    } catch {
      this.customTriggers = [...DEFAULT_CUSTOM_VOICE_TRIGGERS];
    }
    return this.customTriggers;
  }

  public getCustomTriggers(): CustomVoiceTrigger[] {
    if (!this.customTriggers || this.customTriggers.length === 0) {
      this.loadCustomTriggers();
    }
    return this.customTriggers;
  }

  public saveCustomTriggers(triggers: CustomVoiceTrigger[]): void {
    this.customTriggers = triggers;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('waferguard_custom_voice_triggers', JSON.stringify(triggers));
      } catch (e) {
        console.warn('Failed to save custom voice triggers to localStorage:', e);
      }
    }
  }

  public addCustomTrigger(triggerData: Omit<CustomVoiceTrigger, 'id' | 'createdAt' | 'usageCount'>): CustomVoiceTrigger {
    const newTrigger: CustomVoiceTrigger = {
      ...triggerData,
      id: `vt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    const updated = [newTrigger, ...this.getCustomTriggers()];
    this.saveCustomTriggers(updated);
    return newTrigger;
  }

  public updateCustomTrigger(id: string, updates: Partial<CustomVoiceTrigger>): CustomVoiceTrigger[] {
    const current = this.getCustomTriggers();
    const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
    this.saveCustomTriggers(updated);
    return updated;
  }

  public deleteCustomTrigger(id: string): CustomVoiceTrigger[] {
    const current = this.getCustomTriggers();
    const updated = current.filter(t => t.id !== id);
    this.saveCustomTriggers(updated);
    return updated;
  }

  public resetCustomTriggersToDefault(): CustomVoiceTrigger[] {
    this.customTriggers = [...DEFAULT_CUSTOM_VOICE_TRIGGERS];
    this.saveCustomTriggers(this.customTriggers);
    return this.customTriggers;
  }

  // Synthesize crystal-clear cleanroom auditory chimes using Web Audio API
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Play cleanroom confirmation chime when a voice command is successfully parsed & executed.
   * Uses a dual-tone ascending harmonic chime (880Hz -> 1320Hz) with gentle exponential decay.
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // First harmonic bell tone (A5)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      // Second harmonic overtone (E6)
      osc2.frequency.setValueAtTime(1320, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.22);

      // Smooth amplitude envelope
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.06);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('Web Audio chime error:', e);
    }
  }

  /**
   * Play a deeper industrial action confirmation chord for major operations (Calibration, Deep Diagnostic, Batch Approvals).
   */
  public playActionChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C Major industrial chord

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + 0.5);
      });
    } catch (e) {
      console.warn('Web Audio action chime error:', e);
    }
  }

  /**
   * Play subtle blip when cleanroom microphone listening activates or stops.
   */
  public playListeningTone(active: boolean) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (active) {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.08);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Web Audio listening tone error:', e);
    }
  }

  /**
   * Play error tone if an unrecognized command is spoken.
   */
  public playErrorChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn('Web Audio error chime error:', e);
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setCallbacks(callbacks: {
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onCommandMatched?: (match: VoiceCommandMatch) => void;
    onListeningState?: (isListening: boolean) => void;
    onError?: (error: string) => void;
  }) {
    this.onTranscriptCallback = callbacks.onTranscript;
    this.onCommandMatchedCallback = callbacks.onCommandMatched;
    this.onListeningStateCallback = callbacks.onListeningState;
    this.onErrorCallback = callbacks.onError;
  }

  private setupRecognitionEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onListeningStateCallback) this.onListeningStateCallback(true);
      this.playListeningTone(true);
    };

    this.recognition.onend = () => {
      // If was listening, restart to keep cleanroom hands-free mode alive unless explicitly stopped
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {
          this.isListening = false;
          if (this.onListeningStateCallback) this.onListeningStateCallback(false);
          this.playListeningTone(false);
        }
      } else {
        if (this.onListeningStateCallback) this.onListeningStateCallback(false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition event warning:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isListening = false;
        if (this.onListeningStateCallback) this.onListeningStateCallback(false);
        if (this.onErrorCallback) this.onErrorCallback('Microphone access denied. Please allow microphone permission in browser settings.');
      } else if (event.error !== 'no-speech') {
        if (this.onErrorCallback) this.onErrorCallback(`Audio recognition: ${event.error}`);
      }
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const activeText = (finalTranscript || interimTranscript).trim();
      if (activeText && this.onTranscriptCallback) {
        this.onTranscriptCallback(activeText, !!finalTranscript);
      }

      if (finalTranscript) {
        this.processVoiceCommand(finalTranscript);
      }
    };
  }

  public startListening() {
    if (!this.isSupported) {
      if (this.onErrorCallback) this.onErrorCallback('Web Speech API is not supported in this browser. You can use the Voice Command text console below.');
      return;
    }
    try {
      this.isListening = true;
      this.recognition.start();
      if (this.onListeningStateCallback) this.onListeningStateCallback(true);
      this.speak('Voice control active. Hands free cleanroom listening.');
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        console.error(e);
      }
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (this.onListeningStateCallback) this.onListeningStateCallback(false);
    this.playListeningTone(false);
    this.speak('Voice control standby.');
  }

  public toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public speak(text: string) {
    if (this.isMuted || !this.speechSynth) return;
    try {
      this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public processVoiceCommand(input: string): VoiceCommandMatch | null {
    const text = input.trim().toLowerCase();
    let matched: VoiceCommandMatch | null = null;

    // ==========================================
    // 0. CUSTOM USER-DEFINED VOICE TRIGGERS (PRIORITY)
    // ==========================================
    const activeCustomTriggers = this.getCustomTriggers().filter(t => t.isEnabled);
    for (const customTrigger of activeCustomTriggers) {
      const phrase = customTrigger.triggerPhrase.trim().toLowerCase();
      if (text.includes(phrase) || phrase.includes(text) && text.length > 5) {
        // Increment usage count and update timestamp
        customTrigger.usageCount = (customTrigger.usageCount || 0) + 1;
        customTrigger.lastTriggered = new Date().toISOString();
        this.saveCustomTriggers(this.customTriggers);

        matched = {
          action: customTrigger.actionType,
          category: customTrigger.category as any,
          description: `Custom Trigger Executed: "${customTrigger.triggerPhrase}"`,
          feedbackText: customTrigger.confirmationSpeech || `Executing ${customTrigger.triggerPhrase}.`,
          payload: customTrigger.actionPayload || {}
        };
        break;
      }
    }

    // If no custom trigger matched, fall back to built-in cleanroom actions
    if (!matched) {
      // ==========================================
      // 1. DEEP DIAGNOSTIC (AI Multi-Source RCA)
      // ==========================================
      if (
        text.includes('deep diagnostic') ||
        text.includes('run deep diagnostic') ||
        text.includes('deep diagnose') ||
        text.includes('deep root cause') ||
        text.includes('investigate root cause') ||
        text.includes('investigate defect') ||
        text.includes('deep investigate') ||
        text.includes('diagnose wafer defect') ||
        text.includes('root cause investigation') ||
        text.includes('investigate cause')
      ) {
        matched = {
          action: 'DEEP_DIAGNOSTIC',
          category: 'rca',
          description: 'Initiated Deep AI Root-Cause Diagnostic Investigation',
          feedbackText: 'Deep diagnostic initiated. Synthesizing multi-source causal telemetry.',
          payload: { autoRun: true }
        };
      }

    // ==========================================
    // 2. MACHINE MAINTENANCE VOICE ACTIONS
    // ==========================================
    else if (
      text.includes('chamber b calibration') ||
      text.includes('calibrate chamber b') ||
      text.includes('calibrate tool m-03') ||
      text.includes('calibrate tool 3') ||
      text.includes('calibrate machine 3') ||
      text.includes('trigger chamber b')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Chamber B Calibration (Tool M-03)',
        feedbackText: 'Triggering Chamber B thermal and pressure calibration on Tool M-03.',
        payload: {
          machineId: 'M-03',
          chamber: 'CH-B',
          taskType: 'CALIBRATION',
          title: 'Chamber B Thermal & Pressure Calibration',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    } else if (
      text.includes('calibrate chamber a') ||
      text.includes('calibrate tool m-01') ||
      text.includes('calibrate machine 1')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Chamber A Calibration (Tool M-01)',
        feedbackText: 'Triggering Chamber A calibration on Tool M-01.',
        payload: {
          machineId: 'M-01',
          chamber: 'CH-A',
          taskType: 'CALIBRATION',
          title: 'Chamber A Lithography Beam Calibration',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    } else if (
      text.includes('reset tool m-03') ||
      text.includes('reset tool 3') ||
      text.includes('reset machine m-03') ||
      text.includes('reboot tool m-03') ||
      text.includes('reboot machine 3')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Reset Tool M-03',
        feedbackText: 'Resetting Tool M-03 communication bus and clearing fault registers.',
        payload: {
          machineId: 'M-03',
          taskType: 'RESET',
          title: 'Etch Chamber Controller Soft-Reset',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    } else if (
      text.includes('reset tool m-01') ||
      text.includes('reset tool 1') ||
      text.includes('reset machine m-01')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Reset Tool M-01',
        feedbackText: 'Resetting Tool M-01 controller.',
        payload: {
          machineId: 'M-01',
          taskType: 'RESET',
          title: 'Litho Scanner Subsystem Reset',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    } else if (
      text.includes('purge gas line') ||
      text.includes('purge chamber') ||
      text.includes('purge line') ||
      text.includes('purge tool')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Inert Gas Purge Cycle',
        feedbackText: 'Initiating high-purity inert argon purge sequence on mass flow controllers.',
        payload: {
          machineId: 'M-03',
          chamber: 'CH-B',
          taskType: 'PURGE',
          title: 'Inert Gas Purge & Valve Flush Cycle',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    } else if (
      text.includes('diagnostic self-test') ||
      text.includes('self-test tool') ||
      text.includes('self test') ||
      text.includes('run tool self test')
    ) {
      matched = {
        action: 'MAINTENANCE_ACTION',
        category: 'maintenance',
        description: 'Executed Voice Maintenance: Diagnostic Self-Test (Tool M-03)',
        feedbackText: 'Executing comprehensive hardware diagnostic and RF generator self-test.',
        payload: {
          machineId: 'M-03',
          taskType: 'SELF_TEST',
          title: 'Autonomous Multi-Sensor Loop Self-Test',
          statusTarget: 'nominal'
        } as MachineMaintenancePayload
      };
    }

    // ==========================================
    // 3. NAVIGATION COMMANDS
    // ==========================================
    else if (
      text.includes('go to inspection') ||
      text.includes('open inspection') ||
      text.includes('show inspection') ||
      text.includes('view wafer')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Optical & CV Inspection',
        feedbackText: 'Opening Wafer Inspection station.',
        payload: { tab: 'inspection' as NavTab }
      };
    } else if (
      text.includes('go to rca') ||
      text.includes('open rca') ||
      text.includes('root cause') ||
      text.includes('cause analysis')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Root Cause Analysis',
        feedbackText: 'Opening Root Cause Analysis engine.',
        payload: { tab: 'rca' as NavTab }
      };
    } else if (
      text.includes('go to taxonomy') ||
      text.includes('open taxonomy') ||
      text.includes('defect taxonomy') ||
      text.includes('defect library')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Defect Taxonomy',
        feedbackText: 'Opening Defect Taxonomy catalog.',
        payload: { tab: 'taxonomy' as NavTab }
      };
    } else if (
      text.includes('go to machine') ||
      text.includes('go to fleet') ||
      text.includes('open machine') ||
      text.includes('open fleet') ||
      text.includes('tool telemetry') ||
      text.includes('tool fleet')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Tool Fleet Telemetry',
        feedbackText: 'Opening Equipment Fleet & Sensor Telemetry.',
        payload: { tab: 'machines' as NavTab }
      };
    } else if (
      text.includes('go to history') ||
      text.includes('open history') ||
      text.includes('wafer history') ||
      text.includes('lot archive')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Wafer History & Archive',
        feedbackText: 'Opening Wafer Production History.',
        payload: { tab: 'history' as NavTab }
      };
    } else if (
      text.includes('go to knowledge') ||
      text.includes('open knowledge') ||
      text.includes('open sop') ||
      text.includes('knowledge base') ||
      text.includes('rag document')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Cleanroom Knowledge Base',
        feedbackText: 'Opening Cleanroom Knowledge Base & SOPs.',
        payload: { tab: 'knowledge' as NavTab }
      };
    } else if (
      text.includes('go to copilot') ||
      text.includes('open copilot') ||
      text.includes('open agent') ||
      text.includes('ask agent') ||
      text.includes('ai copilot')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Quality Engineer Copilot',
        feedbackText: 'Opening Quality Copilot.',
        payload: { tab: 'copilot' as NavTab }
      };
    } else if (
      text.includes('go to corrective actions') ||
      text.includes('open corrective') ||
      text.includes('open human in the loop') ||
      text.includes('open hitl') ||
      text.includes('action orders') ||
      text.includes('pending approvals')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Corrective Actions (HITL)',
        feedbackText: 'Opening Human in the Loop corrective actions.',
        payload: { tab: 'hitl' as NavTab }
      };
    } else if (
      text.includes('go to analytics') ||
      text.includes('open analytics') ||
      text.includes('open yield') ||
      text.includes('show yield') ||
      text.includes('production analytics')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Production & Yield Analytics',
        feedbackText: 'Opening Production Yield Analytics.',
        payload: { tab: 'analytics' as NavTab }
      };
    } else if (
      text.includes('go to report') ||
      text.includes('open report') ||
      text.includes('inspection certificate') ||
      text.includes('view certificate')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Inspection Certificate',
        feedbackText: 'Opening Quality Inspection Certificate.',
        payload: { tab: 'reports' as NavTab }
      };
    } else if (
      text.includes('go to audit') ||
      text.includes('open audit') ||
      text.includes('compliance trail') ||
      text.includes('audit logs')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to Compliance Audit Logs',
        feedbackText: 'Opening SEMI E10 Compliance Audit Trail.',
        payload: { tab: 'audit' as NavTab }
      };
    } else if (
      text.includes('go to settings') ||
      text.includes('open settings') ||
      text.includes('system preferences')
    ) {
      matched = {
        action: 'NAVIGATE',
        category: 'navigation',
        description: 'Switched to System Settings',
        feedbackText: 'Opening Workstation Settings.',
        payload: { tab: 'settings' as NavTab }
      };
    } 

    // ==========================================
    // 4. INSPECTION & VISION ACTIONS
    // ==========================================
    else if (
      text.includes('run inspection') ||
      text.includes('scan wafer') ||
      text.includes('detect defect') ||
      text.includes('re-scan') ||
      text.includes('rescan') ||
      text.includes('analyze wafer')
    ) {
      matched = {
        action: 'RUN_INSPECTION',
        category: 'inspection',
        description: 'Triggered YOLOv8 Optical Defect Inspection',
        feedbackText: 'Initiating computer vision scan and defect metrology.'
      };
    } else if (
      text.includes('toggle bounding box') ||
      text.includes('toggle box') ||
      text.includes('toggle overlay') ||
      text.includes('hide boxes') ||
      text.includes('show boxes')
    ) {
      matched = {
        action: 'TOGGLE_BOUNDING_BOXES',
        category: 'inspection',
        description: 'Toggled Defect Bounding Boxes Layer',
        feedbackText: 'Toggled defect bounding box overlay.'
      };
    } else if (
      text.includes('toggle heatmap') ||
      text.includes('toggle heat map') ||
      text.includes('show heatmap') ||
      text.includes('hide heatmap')
    ) {
      matched = {
        action: 'TOGGLE_HEATMAP',
        category: 'inspection',
        description: 'Toggled Silicon Density Heatmap',
        feedbackText: 'Toggled thermal defect density heatmap.'
      };
    } else if (
      text.includes('next wafer') ||
      text.includes('cycle wafer') ||
      text.includes('next lot')
    ) {
      matched = {
        action: 'NEXT_WAFER',
        category: 'inspection',
        description: 'Selected next wafer specimen in cassette',
        feedbackText: 'Loading next wafer specimen in queue.'
      };
    } else if (
      text.includes('previous wafer') ||
      text.includes('prior wafer')
    ) {
      matched = {
        action: 'PREV_WAFER',
        category: 'inspection',
        description: 'Selected previous wafer specimen',
        feedbackText: 'Loading previous wafer specimen.'
      };
    } 

    // ==========================================
    // 5. CLEANROOM APPROVAL ORDERS
    // ==========================================
    else if (
      text.includes('batch approve') ||
      text.includes('approve pending') ||
      text.includes('approve all') ||
      text.includes('authorize actions')
    ) {
      matched = {
        action: 'BATCH_APPROVE_PENDING',
        category: 'hitl',
        description: 'Executed Voice Batch Approval for Pending Actions',
        feedbackText: 'Voice authorization confirmed. Batch approving pending corrective actions.'
      };
    } else if (
      text.includes('batch reject') ||
      text.includes('reject actions')
    ) {
      matched = {
        action: 'BATCH_REJECT_PENDING',
        category: 'hitl',
        description: 'Executed Voice Batch Rejection',
        feedbackText: 'Batch rejecting selected corrective action orders.'
      };
    } 

    // ==========================================
    // 6. COPILOT QUERY PROMPTING
    // ==========================================
    else if (
      text.startsWith('ask copilot') ||
      text.startsWith('ask agent') ||
      text.startsWith('copilot') ||
      text.includes('diagnose chamber') ||
      text.includes('diagnose machine')
    ) {
      let query = input
        .replace(/^ask copilot/i, '')
        .replace(/^ask agent/i, '')
        .replace(/^copilot/i, '')
        .trim();

      if (!query) {
        query = 'Provide a full semiconductor root cause diagnostic for current wafer defects and chamber sensor anomalies.';
      }

      matched = {
        action: 'COPILOT_QUERY',
        category: 'copilot',
        description: `Copilot Prompt: "${query}"`,
        feedbackText: `Sending query to Quality Copilot.`,
        payload: { query }
      };
    }

    // ==========================================
    // 7. READ OUT STATS
    // ==========================================
    else if (
      text.includes('read summary') ||
      text.includes('speak status') ||
      text.includes('read report') ||
      text.includes('read defect') ||
      text.includes('wafer status')
    ) {
      matched = {
        action: 'SPEAK_SUMMARY',
        category: 'audio',
        description: 'Spoke Wafer Inspection Summary',
        feedbackText: 'Reading wafer metrology status.'
      };
    }

    // ==========================================
    // 8. AUDIO SYNTHESIS CONTROLS
    // ==========================================
    else if (text.includes('mute voice') || text.includes('mute audio') || text.includes('silence')) {
      this.isMuted = true;
      matched = {
        action: 'MUTE_AUDIO',
        category: 'audio',
        description: 'Voice Synthesis Muted',
        feedbackText: 'Audio feedback muted.'
      };
    } else if (text.includes('unmute voice') || text.includes('unmute audio') || text.includes('enable voice')) {
      this.isMuted = false;
      matched = {
        action: 'UNMUTE_AUDIO',
        category: 'audio',
        description: 'Voice Synthesis Enabled',
        feedbackText: 'Audio feedback active.'
      };
    }
  }

    if (matched) {
      // Play auditory feedback chime when command is successfully parsed
      if (matched.category === 'maintenance' || matched.action === 'DEEP_DIAGNOSTIC' || matched.action === 'BATCH_APPROVE_PENDING') {
        this.playActionChime();
      } else {
        this.playSuccessChime();
      }

      if (this.onCommandMatchedCallback) {
        this.onCommandMatchedCallback(matched);
      }
      this.speak(matched.feedbackText);
    } else {
      this.playErrorChime();
    }

    return matched;
  }
}

export const globalVoiceService = new VoiceCommandService();
