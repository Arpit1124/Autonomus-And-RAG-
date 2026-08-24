import React, { useState } from 'react';
import { MachineHealthRecord, ChamberTelemetry } from '../types';
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Thermometer, 
  Gauge, 
  Zap, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  Sliders
} from 'lucide-react';

interface Props {
  machines: MachineHealthRecord[];
  onNavigateTab: (tab: any) => void;
  onTriggerCopilot: (prompt: string) => void;
}

export const MachineHealthView: React.FC<Props> = ({
  machines,
  onNavigateTab,
  onTriggerCopilot
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || 'M-03');
  const activeMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  const getStatusBadge = (status: MachineHealthRecord['status']) => {
    switch (status) {
      case 'anomaly':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'warning':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'maintenance':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'nominal':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Semiconductor Tool Health & Chamber Correlation</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Fab-09 Fleet Telemetry
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Real-Time Sensor Parameter Monitoring, Chamber Drift Tracking & Defect Rate Anomaly Correlation
          </p>
        </div>

        {/* Global Anomaly Banner */}
        <div className="flex items-center gap-2">
          {machines.some(m => m.anomalyDetected) && (
            <div className="bg-red-950/50 border border-red-500/50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-red-300 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="font-bold">CRITICAL TOOL DRIFT DETECTED: Machine M-03</span>
            </div>
          )}
        </div>
      </div>

      {/* Machine Fleet Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
        {machines.map((mach) => {
          const isSelected = selectedMachineId === mach.id;
          const isAnomaly = mach.status === 'anomaly';
          const isWarning = mach.status === 'warning';

          return (
            <button
              key={mach.id}
              id={`machine-card-${mach.id}`}
              onClick={() => setSelectedMachineId(mach.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-400'
                  : 'bg-[#0c0c10] hover:bg-[#14141c] border-[#1f1f26] text-[#8e8e98]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{mach.id}</span>
                <span className={`w-2 h-2 rounded-full ${
                  isAnomaly ? 'bg-red-400 animate-ping' : isWarning ? 'bg-orange-400' : 'bg-emerald-400'
                }`} />
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#d1d1db] truncate">{mach.name.split(' ')[0]} {mach.name.split(' ')[1]}</div>
                <div className="text-[9px] text-[#71717a] truncate">{mach.stationType}</div>
              </div>

              <div className="flex items-center justify-between text-[10px] border-t border-white/5 pt-1.5">
                <span className="text-[#71717a]">Health:</span>
                <strong className={`font-mono ${mach.healthScore < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {mach.healthScore}%
                </strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Machine Detailed Telemetry & Chamber Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Machine Summary & Telemetry Gauges (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                    {activeMachine.id}
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono">{activeMachine.name}</h3>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono mt-0.5 block">{activeMachine.location}</span>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getStatusBadge(activeMachine.status)}`}>
                {activeMachine.status}
              </span>
            </div>

            {/* Anomaly Notification */}
            {activeMachine.anomalyAlert && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold font-mono text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Tool Alert Notice</span>
                </div>
                <p className="text-[11px] font-sans leading-relaxed">{activeMachine.anomalyAlert}</p>
              </div>
            )}

            {/* Defect Rate Delta KPI */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="bg-[#12121a] p-2.5 rounded-lg border border-[#22222e]">
                <div className="text-[9px] text-[#71717a]">BASELINE RATE</div>
                <div className="text-white font-bold text-sm">{activeMachine.baselineDefectRate}%</div>
              </div>
              <div className="bg-[#12121a] p-2.5 rounded-lg border border-[#22222e]">
                <div className="text-[9px] text-[#71717a]">CURRENT RATE</div>
                <div className={`font-bold text-sm ${activeMachine.defectRateDeltaPct > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {activeMachine.currentDefectRate}%
                </div>
              </div>
              <div className="bg-[#12121a] p-2.5 rounded-lg border border-[#22222e]">
                <div className="text-[9px] text-[#71717a]">DRIFT DELTA</div>
                <div className={`font-bold text-sm ${activeMachine.defectRateDeltaPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {activeMachine.defectRateDeltaPct > 0 ? `+${activeMachine.defectRateDeltaPct}%` : `${activeMachine.defectRateDeltaPct}%`}
                </div>
              </div>
            </div>

            {/* Maintenance & Calibration Schedule */}
            <div className="space-y-2 border-t border-[#1f1f26] pt-3 text-xs font-mono text-[#8e8e98]">
              <div className="flex justify-between">
                <span>Last Calibration:</span>
                <span className="text-white">{activeMachine.lastCalibration}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Scheduled PM:</span>
                <span className={activeMachine.nextScheduledMaintenance.includes('OVERDUE') ? 'text-red-400 font-bold' : 'text-white'}>
                  {activeMachine.nextScheduledMaintenance}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Correlated Batches:</span>
                <span className="text-indigo-300 font-semibold">{activeMachine.recentBatches.join(', ')}</span>
              </div>
            </div>

            {/* Copilot Deep Tool Diagnostic Button */}
            <div className="pt-2">
              <button
                onClick={() => onTriggerCopilot(`Run a complete diagnostic on machine ${activeMachine.id} (${activeMachine.name}). Check Chamber B telemetry drift and correlate with recent defective wafer batches.`)}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Machine Copilot Diagnostic</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Chamber-by-Chamber Telemetry (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chamber Modules & Sensor Telemetry ({activeMachine.chambers.length} Active)</span>
              </span>
              <span className="text-[10px] text-[#71717a]">Live Sensor Feed</span>
            </div>

            <div className="space-y-3">
              {activeMachine.chambers.map((chamber) => {
                const isAnomaly = chamber.status === 'anomaly';
                const isWarning = chamber.status === 'warning';

                return (
                  <div
                    key={chamber.id}
                    className={`p-3.5 rounded-xl border space-y-3 ${
                      isAnomaly
                        ? 'bg-red-950/40 border-red-500/60 shadow-lg'
                        : isWarning
                        ? 'bg-orange-950/30 border-orange-500/50'
                        : 'bg-[#121218] border-[#22222e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{chamber.name}</span>
                        <span className="text-[10px] text-[#8e8e98]">({chamber.id})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isAnomaly ? 'bg-red-950 text-red-300 border border-red-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {chamber.status}
                      </span>
                    </div>

                    {/* Sensor Metric Gauges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      {/* Temperature */}
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-[#71717a] flex items-center justify-center gap-1">
                          <Thermometer className="w-2.5 h-2.5" />
                          <span>TEMP (°C)</span>
                        </div>
                        <div className={`font-bold text-xs mt-0.5 ${chamber.temperatureC > chamber.targetTempC + 10 ? 'text-red-400' : 'text-white'}`}>
                          {chamber.temperatureC}°C
                        </div>
                        <div className="text-[8px] text-[#52525b]">Target: {chamber.targetTempC}°C</div>
                      </div>

                      {/* Pressure */}
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-[#71717a] flex items-center justify-center gap-1">
                          <Gauge className="w-2.5 h-2.5" />
                          <span>PRESSURE</span>
                        </div>
                        <div className={`font-bold text-xs mt-0.5 ${chamber.pressureMtorr > chamber.targetPressureMtorr * 1.5 ? 'text-red-400' : 'text-white'}`}>
                          {chamber.pressureMtorr} mTorr
                        </div>
                        <div className="text-[8px] text-[#52525b]">Target: {chamber.targetPressureMtorr}</div>
                      </div>

                      {/* RF Power */}
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-[#71717a] flex items-center justify-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span>RF POWER</span>
                        </div>
                        <div className="text-white font-bold text-xs mt-0.5">
                          {chamber.rfPowerW} W
                        </div>
                        <div className="text-[8px] text-[#52525b]">Forward Power</div>
                      </div>

                      {/* Gas Flow */}
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-[#71717a] flex items-center justify-center gap-1">
                          <Activity className="w-2.5 h-2.5" />
                          <span>GAS / HELIUM</span>
                        </div>
                        <div className={`font-bold text-xs mt-0.5 ${chamber.gasFlowSccm < 8 && chamber.id === 'CH-B' ? 'text-red-400' : 'text-white'}`}>
                          {chamber.gasFlowSccm} sccm
                        </div>
                        <div className="text-[8px] text-[#52525b]">MFC Backside</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Maintenance Log History Table */}
            <div className="border-t border-[#1f1f26] pt-3 space-y-2">
              <div className="flex items-center justify-between text-[#8e8e98] text-[11px]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recent Maintenance Log Events</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {activeMachine.maintenanceLogs.map((log, lIdx) => (
                  <div key={lIdx} className="p-2 rounded-lg bg-[#14141e] border border-[#232332] flex items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-indigo-300 font-bold mr-2">{log.date}</span>
                      <span className="text-white font-medium mr-2">[{log.type}]</span>
                      <span className="text-[#a1a1aa] font-sans">{log.description}</span>
                    </div>
                    <span className="text-[10px] text-[#71717a] shrink-0 font-mono">Tech: {log.technician}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
