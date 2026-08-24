import React from 'react';
import { 
  Activity, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Database, 
  Zap, 
  Radio, 
  ShieldCheck, 
  Clock, 
  Server, 
  Layers,
  Thermometer
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const healthNodes = [
    {
      name: 'Sub-Micron Neural Vision Engine (GPU-01/02)',
      status: 'nominal',
      latency: '12.4 ms',
      load: '34%',
      uptime: '99.98%',
      details: 'TensorRT Tensor Core acceleration on SEM/Optical streams'
    },
    {
      name: 'SECS/GEM Chamber Telemetry Ingress Bus',
      status: 'nominal',
      latency: '3.1 ms',
      load: '18%',
      uptime: '100.0%',
      details: 'Subscribed to Fab-09 Lines 1-6 high-frequency sensors'
    },
    {
      name: 'Industrial Vector RAG Index (Qdrant Engine)',
      status: 'nominal',
      latency: '8.7 ms',
      load: '22%',
      uptime: '99.95%',
      details: '14,820 SEMI & Fab SOP document embeddings active'
    },
    {
      name: 'Tamper-Evident SHA-256 Audit Ledger',
      status: 'nominal',
      latency: '1.2 ms',
      load: '8%',
      uptime: '100.0%',
      details: 'Cryptographic sign-offs & irreversible ISO 9001 logging'
    },
    {
      name: 'Etch Chamber M-03 Thermal Sensor Gateway',
      status: 'warning',
      latency: '45.2 ms',
      load: '88%',
      uptime: '98.40%',
      details: 'Drift anomaly detected (+14.2°C chuck perimeter variance)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs animate-in fade-in">
      <div className="bg-[#0b0b12] border border-[#222234] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f2e] bg-[#10101a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-white text-sm">Fab-09 Infrastructure & Sensor Health</h2>
              <p className="text-[10px] text-[#71717a] font-sans">
                Real-time monitoring of AI inference nodes, SECS/GEM message brokers, and cleanroom telemetry
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

        {/* Global Cluster Summary */}
        <div className="p-4 bg-[#0d0d16] border-b border-[#1a1a28] grid grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-[#141420] border border-white/5">
            <div className="text-[10px] text-[#71717a] uppercase font-bold">Overall Status</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">OPERATIONAL</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#141420] border border-white/5">
            <div className="text-[10px] text-[#71717a] uppercase font-bold">Avg AI Latency</div>
            <div className="text-white font-bold text-sm mt-0.5">14.2 ms</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#141420] border border-white/5">
            <div className="text-[10px] text-[#71717a] uppercase font-bold">Cleanroom Class</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">ISO 3 / Class 1</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#141420] border border-white/5">
            <div className="text-[10px] text-[#71717a] uppercase font-bold">Active Fleet</div>
            <div className="text-indigo-300 font-bold text-sm mt-0.5">6 Chambers</div>
          </div>
        </div>

        {/* Subsystem Health Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-[10px] font-bold uppercase text-[#71717a] tracking-wider mb-1">
            Core Distributed Infrastructure
          </div>

          {healthNodes.map((node, idx) => {
            const isWarn = node.status === 'warning';
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition ${
                  isWarn 
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                    : 'bg-[#12121e] border-[#202032] text-[#e0e0e8]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isWarn ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span className="font-bold text-white text-xs">{node.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    isWarn 
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {node.status}
                  </span>
                </div>

                <p className="text-[11px] text-[#8e8e98] font-sans mb-2">
                  {node.details}
                </p>

                <div className="grid grid-cols-3 gap-2 text-[10px] border-t border-white/5 pt-1.5 text-[#71717a]">
                  <div>Latency: <strong className="text-white">{node.latency}</strong></div>
                  <div>Load: <strong className="text-white">{node.load}</strong></div>
                  <div>Uptime: <strong className="text-emerald-400">{node.uptime}</strong></div>
                </div>
              </div>
            );
          })}

          {/* Cleanroom Ambient Telemetry */}
          <div className="p-3 rounded-xl bg-[#12121e] border border-[#202032] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cleanroom Environmental Sensor Array</span>
              </span>
              <span className="text-emerald-400 text-[10px]">Nominal (±0.05°C)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="bg-black/30 p-2 rounded-lg">
                <div className="text-[9px] text-[#71717a]">TEMPERATURE</div>
                <div className="text-white font-bold">21.05 °C</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg">
                <div className="text-[9px] text-[#71717a]">RELATIVE HUMIDITY</div>
                <div className="text-white font-bold">42.1 % RH</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg">
                <div className="text-[9px] text-[#71717a]">AIRBORNE PARTICLES</div>
                <div className="text-emerald-400 font-bold">&lt; 0.1 / ft³</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f1f2e] bg-[#0e0e16] text-[10px] text-[#71717a] flex items-center justify-between">
          <span>Continuous Heartbeat: 1,000 Hz</span>
          <span>SEMI E10 Compliance Verified</span>
        </div>
      </div>
    </div>
  );
};
