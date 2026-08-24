import React, { useState } from 'react';
import { 
  WaferInspectionRecord, 
  RootCauseItem, 
  MachineHealthRecord, 
  HistoricalInspectionCase,
  SensorParameterDeviation,
  CorrectiveAction
} from '../types';
import { 
  BrainCircuit, 
  Activity, 
  Thermometer, 
  Gauge, 
  FileText, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  Cpu, 
  Zap, 
  GitBranch, 
  Sparkles, 
  ArrowRight, 
  Layers,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface Props {
  inspection: WaferInspectionRecord;
  machines: MachineHealthRecord[];
  historicalCases: HistoricalInspectionCase[];
  onNavigateTab: (tab: any) => void;
  onTriggerCopilot: (prompt: string) => void;
  onRequestApproval: (action: CorrectiveAction) => void;
}

export const RootCauseAnalysisView: React.FC<Props> = ({
  inspection,
  machines,
  historicalCases,
  onNavigateTab,
  onTriggerCopilot,
  onRequestApproval
}) => {
  const [selectedRcaIndex, setSelectedRcaIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'evidence' | 'ishikawa' | 'five_whys' | 'telemetry' | 'history'>('evidence');
  const [expandedSensors, setExpandedSensors] = useState<boolean>(true);

  const rcaList = inspection.rca || [];
  const activeRca: RootCauseItem | undefined = rcaList[selectedRcaIndex] || rcaList[0];
  const targetMachine = machines.find(m => m.id === inspection.machineId) || machines[0];

  const matchedHistorical = historicalCases.filter(h => 
    activeRca?.relatedHistoricalCases.includes(h.id) || h.machineId === inspection.machineId
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <span>Autonomous AI Root-Cause Analysis (RCA) Engine</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              ISO 9001 / SEMI E10
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Multi-Variable Telemetry Correlation, Ishikawa Decomposition, 5-Whys Synthesis & Historical Case Matching
          </p>
        </div>

        {/* Wafer Context Tag */}
        <div className="flex items-center gap-2 bg-[#121218] border border-[#23232c] px-3 py-1.5 rounded-lg font-mono text-xs">
          <span className="text-[#8e8e98]">Subject:</span>
          <span className="text-white font-bold">{inspection.waferId}</span>
          <span className="text-[#8e8e98]">({inspection.machineId} / {inspection.lotId})</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: RCA Hypotheses & Evidence Scores (4 cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2 text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Identified Root Causes</span>
              </span>
              <span className="text-[10px] text-[#71717a]">{rcaList.length} Synthesized</span>
            </div>

            <div className="space-y-2">
              {rcaList.map((rca, idx) => {
                const isSelected = selectedRcaIndex === idx;
                const scoreColor = rca.evidenceScore >= 80 ? 'text-indigo-400' : 'text-amber-400';

                return (
                  <div
                    key={rca.id}
                    id={`rca-item-${rca.id}`}
                    onClick={() => setSelectedRcaIndex(idx)}
                    className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-lg'
                        : 'bg-[#121218] hover:bg-[#181822] border-[#22222c] text-[#a1a1aa]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold font-mono text-white leading-snug">
                        {rca.title}
                      </span>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-mono font-bold ${scoreColor}`}>
                          {rca.evidenceScore}%
                        </div>
                        <div className="text-[8px] text-[#71717a] uppercase font-mono">Evidence</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#a1a1aa] font-sans line-clamp-2 leading-relaxed">
                      {rca.explanation}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-indigo-300 border border-indigo-500/20 uppercase">
                        {rca.category.replace('_', ' ')}
                      </span>
                      <span className="text-[#71717a]">
                        Ishikawa: <strong className="text-white">{rca.ishikawaCategory}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine & Chamber Telemetry Summary Widget */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Correlated Tool ({targetMachine.id})</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 text-[9px] font-bold">
                +{targetMachine.defectRateDeltaPct}% DRIFT
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#8e8e98]">
                <span>Tool Name:</span>
                <span className="text-white truncate max-w-[180px]">{targetMachine.name}</span>
              </div>
              <div className="flex justify-between text-[#8e8e98]">
                <span>Health Index:</span>
                <span className={`font-bold ${targetMachine.healthScore < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {targetMachine.healthScore}/100
                </span>
              </div>
              <div className="flex justify-between text-[#8e8e98]">
                <span>Correlated Defects:</span>
                <span className="text-white">{targetMachine.correlatedDefectsCount} incidents</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('machines')}
              className="w-full py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202e] text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Machine Fleet Telemetry</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Detailed RCA Breakdown, 5-Whys, Ishikawa, Sensor Telemetry (8 cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          {activeRca ? (
            <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-4">
              {/* Active RCA Header */}
              <div className="border-b border-[#1f1f26] pb-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
                      {activeRca.id}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                      {activeRca.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 bg-[#14141e] border border-indigo-500/40 px-2.5 py-1 rounded-lg font-mono text-xs text-white">
                    <span className="text-[#a1a1aa] text-[10px]">AI Evidence Score:</span>
                    <strong className="text-indigo-400 text-sm">{activeRca.evidenceScore}%</strong>
                  </div>
                </div>

                <p className="text-xs text-[#d1d1db] font-sans leading-relaxed">
                  {activeRca.explanation}
                </p>
              </div>

              {/* RCA Sub-navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-[#1f1f26] pb-1 overflow-x-auto text-xs font-mono">
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'evidence'
                      ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500 font-bold'
                      : 'text-[#8e8e98] hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry & Sensors</span>
                </button>
                <button
                  onClick={() => setActiveTab('five_whys')}
                  className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'five_whys'
                      ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500 font-bold'
                      : 'text-[#8e8e98] hover:text-white'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>5-Whys Analysis</span>
                </button>
                <button
                  onClick={() => setActiveTab('ishikawa')}
                  className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'ishikawa'
                      ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500 font-bold'
                      : 'text-[#8e8e98] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ishikawa (Fishbone)</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500 font-bold'
                      : 'text-[#8e8e98] hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Case Matching ({matchedHistorical.length})</span>
                </button>
              </div>

              {/* Tab 1: Sensor Parameter Telemetry Deviations */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <div className="bg-[#0e0e14] border border-[#22222d] rounded-xl p-3.5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-white font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-indigo-400" />
                        <span>Chamber Sensor Telemetry Parameter Deviations</span>
                      </span>
                      <span className="text-[10px] text-red-400 font-semibold">
                        {activeRca.sensorCorrelations.filter(s => s.isCritical).length} Critical Out-of-Spec
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#232330] text-[10px] text-[#71717a] uppercase">
                            <th className="py-2 px-2">Parameter</th>
                            <th className="py-2 px-2">Normal Spec</th>
                            <th className="py-2 px-2">Observed Value</th>
                            <th className="py-2 px-2 text-right">Deviation</th>
                            <th className="py-2 px-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c1c28] text-xs">
                          {activeRca.sensorCorrelations.map((sensor, sIdx) => {
                            const isCrit = sensor.isCritical;
                            return (
                              <tr key={sIdx} className="hover:bg-[#141420] transition">
                                <td className="py-2.5 px-2 font-medium text-white">{sensor.parameter}</td>
                                <td className="py-2.5 px-2 text-[#8e8e98]">{sensor.normalRange}</td>
                                <td className={`py-2.5 px-2 font-bold ${isCrit ? 'text-red-400' : 'text-white'}`}>
                                  {sensor.observedValue}
                                </td>
                                <td className={`py-2.5 px-2 text-right font-bold ${sensor.deviationPct > 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                                  {sensor.deviationPct > 0 ? `+${sensor.deviationPct}%` : `${sensor.deviationPct}%`}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    isCrit ? 'bg-red-950 text-red-300 border border-red-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  }`}>
                                    {isCrit ? 'CRITICAL' : 'NOMINAL'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Supporting SOP Citations from RAG Knowledge */}
                  <div className="bg-[#0e0e14] border border-[#22222d] rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Grounded Knowledge Base & SOP Evidence</span>
                    </div>

                    <div className="space-y-2">
                      {activeRca.relevantDocuments.map((doc, dIdx) => (
                        <div key={dIdx} className="p-2.5 rounded-lg bg-[#141420] border border-[#262638] space-y-1">
                          <div className="flex items-center justify-between text-indigo-300 font-bold text-xs">
                            <span>{doc.docTitle}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">{(doc.score * 100).toFixed(0)}% Match</span>
                          </div>
                          <div className="text-[10px] text-[#71717a] font-sans font-semibold">{doc.section}</div>
                          <p className="text-[11px] text-[#a1a1aa] font-sans italic">
                            "{doc.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 5-Whys Analysis Tree */}
              {activeTab === 'five_whys' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      <span>Recursive 5-Whys Diagnostic Chain</span>
                    </span>
                    <span className="text-[10px] text-indigo-400">Automated Causal Synthesis</span>
                  </div>

                  <div className="space-y-2 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#232334]">
                    {activeRca.fiveWhys.map((why, wIdx) => (
                      <div key={wIdx} className="relative pl-9">
                        <div className="absolute left-2 top-2.5 w-4 h-4 rounded-full bg-indigo-950 border border-indigo-500 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                          {wIdx + 1}
                        </div>
                        <div className="p-3 rounded-lg bg-[#12121c] border border-[#222232] font-sans text-xs text-[#e0e0e8]">
                          {typeof why === 'string' ? (
                            why
                          ) : (
                            <div className="space-y-1">
                              <div className="text-amber-300/90 font-mono text-[11px]">Q: {why.question}</div>
                              <div className="text-[#f0f0f5]">A: {why.answer}</div>
                              {why.evidence && (
                                <div className="text-[10px] text-zinc-400 font-mono">Evidence: {why.evidence}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Ishikawa (Fishbone) Diagram Decomposition */}
              {activeTab === 'ishikawa' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Ishikawa 6M Cause-and-Effect Decomposition</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { cat: 'Machine', factor: 'Chamber B thermal controller & helium MFC-04 valve orifice clog', active: activeRca.ishikawaCategory === 'Machine' },
                      { cat: 'Method', factor: 'Over-extended RF hours between in-situ NF3 dry chamber cleans', active: activeRca.ishikawaCategory === 'Method' },
                      { cat: 'Material', factor: 'Fluorocarbon dielectric polymer flaking from upper liner', active: activeRca.ishikawaCategory === 'Material' },
                      { cat: 'Measurement', factor: 'Thermocouple reading drift on electrostatic chuck perimeter', active: activeRca.ishikawaCategory === 'Measurement' },
                      { cat: 'Environment', factor: 'Cleanroom humidity and ambient temperature stable within ±0.2°C', active: activeRca.ishikawaCategory === 'Environment' },
                      { cat: 'Manpower', factor: 'Preventive maintenance schedule delay flagged by shift supervisor', active: activeRca.ishikawaCategory === 'Manpower' }
                    ].map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className={`p-3 rounded-xl border space-y-1.5 ${
                          item.active
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg'
                            : 'bg-[#12121a] border-[#22222e] text-[#8e8e98]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs uppercase font-mono">{item.cat}</span>
                          {item.active && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-white text-[9px] font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-sans text-[#a1a1aa] leading-relaxed">
                          {item.factor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Historical Case Matching */}
              {activeTab === 'history' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>Correlated Historical Defect Incidents</span>
                  </div>

                  <div className="space-y-2">
                    {matchedHistorical.map((h) => (
                      <div key={h.id} className="p-3 rounded-xl bg-[#12121c] border border-[#222232] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-black/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                              {h.id}
                            </span>
                            <span className="text-white font-bold font-mono">{h.waferId}</span>
                          </div>
                          <span className="text-emerald-400 font-bold text-xs">{h.similarityPct}% Pattern Similarity</span>
                        </div>

                        <p className="text-xs text-[#a1a1aa] font-sans">
                          <strong>Past Root Cause:</strong> {h.rootCauseSummary}
                        </p>
                        <p className="text-xs text-indigo-300 font-sans">
                          <strong>Past Corrective Action:</strong> {h.correctiveActionSummary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Investigation & Corrective Action Actions */}
              <div className="border-t border-[#1f1f26] pt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[#8e8e98] text-[10px] uppercase font-bold">Recommended Immediate Action:</span>
                  <div className="text-white font-semibold text-xs">
                    Quarantine Lot #{inspection.lotId} & Perform MFC-04 Valve Flush
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('approvals')}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Human-in-the-Loop Approvals</span>
                  </button>

                  <button
                    onClick={() => onTriggerCopilot(`Generate a detailed 8D root-cause investigation report for wafer ${inspection.waferId} focusing on ${activeRca.title}`)}
                    className="px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#222232] text-indigo-300 font-medium border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Generate 8D Report via Copilot</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0c0c10] border border-[#1f1f26] rounded-xl text-center font-mono text-xs text-[#8e8e98]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-white font-bold text-sm">No Root-Cause Analysis Required</span>
              <p className="text-[11px] text-[#71717a] mt-1">This wafer has 0 defects and passed all SEMI E10 quality criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
