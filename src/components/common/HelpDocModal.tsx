import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  HelpCircle, 
  Keyboard, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  FileText, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDocModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<'quickstart' | 'standards' | 'shortcuts' | 'architecture'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs animate-in fade-in">
      <div className="bg-[#0b0b12] border border-[#222234] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f2e] bg-[#10101a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-sm">Industrial Platform Help & Documentation</h2>
              <p className="text-[10px] text-[#71717a] font-sans">
                Cleanroom operational procedures, SEMI standard references, and keyboard navigation shortcuts
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[#8e8e98] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout: Sidebar + Main */}
        <div className="flex-1 flex overflow-hidden">
          {/* Topic Navigation */}
          <div className="w-56 bg-[#0d0d16] border-r border-[#1a1a28] p-3 space-y-1">
            <button
              onClick={() => setSelectedTopic('quickstart')}
              className={`w-full p-2 rounded-xl text-left font-bold transition flex items-center justify-between ${
                selectedTopic === 'quickstart'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#8e8e98] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>1. Quickstart Workflow</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedTopic('standards')}
              className={`w-full p-2 rounded-xl text-left font-bold transition flex items-center justify-between ${
                selectedTopic === 'standards'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#8e8e98] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>2. SEMI & ISO Standards</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedTopic('shortcuts')}
              className={`w-full p-2 rounded-xl text-left font-bold transition flex items-center justify-between ${
                selectedTopic === 'shortcuts'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#8e8e98] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>3. Keyboard Shortcuts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedTopic('architecture')}
              className={`w-full p-2 rounded-xl text-left font-bold transition flex items-center justify-between ${
                selectedTopic === 'architecture'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#8e8e98] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>4. AI Governance & Safety</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs text-[#d1d1db]">
            {selectedTopic === 'quickstart' && (
              <div className="space-y-3">
                <h3 className="font-mono font-bold text-white text-sm">Industrial Quality Inspection Operational Flow</h3>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-indigo-400 font-bold">Step 1: Visual Defect Detection</div>
                    <p className="text-[#a1a1aa] font-sans">
                      Select active wafer or upload high-resolution SEM/Optical imagery. The sub-micron computer vision pipeline identifies bounding coordinates, defect classes, and computes SEMI E10 quality scores.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-cyan-400 font-bold">Step 2: Root Cause Synthesis (RCA)</div>
                    <p className="text-[#a1a1aa] font-sans">
                      Correlate detected visual anomalies with high-frequency chamber sensor deviations (pressure, RF bias, chuck temperature) and generate structured 5-Whys and Ishikawa 6M diagrams.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-amber-400 font-bold">Step 3: Human-in-the-Loop Sign-off</div>
                    <p className="text-[#a1a1aa] font-sans">
                      Quality Engineers review AI-suggested corrective actions (e.g. chamber purge, tool recalibration, lot quarantine) and digitally sign with irreversible SHA-256 audit logging.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'standards' && (
              <div className="space-y-3 font-mono text-xs">
                <h3 className="font-bold text-white text-sm">Supported Metrology & Compliance Frameworks</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-emerald-400 font-bold">SEMI E10</div>
                    <p className="text-[11px] text-[#a1a1aa] font-sans">
                      Equipment Reliability, Availability, and Maintainability (RAM) tracking standard for semiconductor manufacturing tools.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-indigo-400 font-bold">SEMI M10</div>
                    <p className="text-[11px] text-[#a1a1aa] font-sans">
                      Standard Classification of Surface Defects on Silicon Wafers, covering physical, chemical, crystal, and lithographic anomalies.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-purple-400 font-bold">ISO 9001:2015</div>
                    <p className="text-[11px] text-[#a1a1aa] font-sans">
                      Quality Management System requirements, root-cause investigation rigor, and tamper-evident change control auditability.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-1">
                    <div className="text-cyan-400 font-bold">IATF 16949</div>
                    <p className="text-[11px] text-[#a1a1aa] font-sans">
                      Automotive semiconductor zero-defect quality standard with strict statistical process control (SPC) and excursion alerts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTopic === 'shortcuts' && (
              <div className="space-y-3 font-mono text-xs">
                <h3 className="font-bold text-white text-sm">Industrial Control Room Key Bindings</h3>
                <div className="space-y-2">
                  {[
                    { key: '⌘ + K', desc: 'Launch Instant Global Search across wafers, tools, and SOPs' },
                    { key: 'Space', desc: 'Start / Pause Automated AI Visual Inspection Scan' },
                    { key: '1 - 9', desc: 'Quick switch between primary industrial modules' },
                    { key: 'V', desc: 'Activate Cleanroom Hands-Free Voice Command HUD' },
                    { key: 'ESC', desc: 'Dismiss active modal / Close overlay windows' }
                  ].map((sc, sIdx) => (
                    <div key={sIdx} className="p-2.5 rounded-xl bg-[#12121e] border border-[#202032] flex items-center justify-between">
                      <span className="font-sans text-[#e0e0e8]">{sc.desc}</span>
                      <kbd className="px-2 py-1 rounded bg-[#181826] border border-[#2c2c40] text-indigo-300 font-bold text-[10px]">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTopic === 'architecture' && (
              <div className="space-y-3 font-mono text-xs">
                <h3 className="font-bold text-white text-sm">AI Safety, Calibration & Deterministic Governance</h3>
                <p className="text-[#a1a1aa] font-sans leading-relaxed">
                  WaferGuard implements strict Human-in-the-Loop (HITL) governance: no critical corrective action (e.g. chamber halt, automated recipe tuning) executes without cryptographic sign-off from an authorized Quality Engineer or Production Manager.
                </p>
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 font-sans text-xs">
                  All AI inference confidence scores, spatial bounding boxes, and RAG document citations are verified and logged in compliance with SEMI E10 and ISO 9001 standards.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f1f2e] bg-[#0e0e16] text-[10px] text-[#71717a] flex items-center justify-between">
          <span>Fab-09 Cleanroom Operator Handbook v4.8</span>
          <span>Silicon Foundry Metrology Division</span>
        </div>
      </div>
    </div>
  );
};
