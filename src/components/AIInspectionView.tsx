import React, { useState } from 'react';
import { 
  WaferInspectionRecord, 
  DefectItem, 
  QualityDecisionResult, 
  VisionModelConfig,
  DefectCategory,
  DefectSeverity
} from '../types';
import { WaferInspectionCanvas } from './WaferInspectionCanvas';
import { 
  Scan, 
  Upload, 
  Camera, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  BrainCircuit, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  Info,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  currentInspection: WaferInspectionRecord;
  onUpdateInspection: (inspection: WaferInspectionRecord) => void;
  onNavigateTab: (tab: any) => void;
  onOpenReportModal: (inspection: WaferInspectionRecord) => void;
  onTriggerCopilotWithInspection: (prompt: string) => void;
  modelConfig: VisionModelConfig;
  onUpdateModelConfig: (config: VisionModelConfig) => void;
  allSampleInspections: WaferInspectionRecord[];
}

export const AIInspectionView: React.FC<Props> = ({
  currentInspection,
  onUpdateInspection,
  onNavigateTab,
  onOpenReportModal,
  onTriggerCopilotWithInspection,
  modelConfig,
  onUpdateModelConfig,
  allSampleInspections
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(null);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [selectedPresetWaferId, setSelectedPresetWaferId] = useState<string>(currentInspection.waferId);

  // Form Inputs
  const [inputWaferId, setInputWaferId] = useState(currentInspection.waferId);
  const [inputLotId, setInputLotId] = useState(currentInspection.lotId);
  const [inputBatchId, setInputBatchId] = useState(currentInspection.batchId);
  const [inputMachineId, setInputMachineId] = useState(currentInspection.machineId);
  const [inputInspectionType, setInputInspectionType] = useState(currentInspection.inspectionType);
  const [isDragOver, setIsDragOver] = useState(false);

  const PIPELINE_STEPS = [
    { title: 'Image Preprocessing', desc: 'Normalized 16-bit rasterization & contrast normalization' },
    { title: 'CV Defect Detection', desc: 'Sub-micron neural feature extraction & bounding box localization' },
    { title: 'Defect Classification', desc: 'SEMI taxonomy categorization & severity grading' },
    { title: 'Quality Scoring', desc: 'SEMI E10 rule calculation & Pass/Fail determination' },
    { title: 'Agent Synthesis', desc: 'RAG knowledge grounding & Root-Cause correlation' }
  ];

  const handleStartInspection = async () => {
    setIsScanning(true);
    setSelectedDefect(null);

    // Simulate multi-stage visual inspection pipeline steps
    for (let step = 0; step < PIPELINE_STEPS.length; step++) {
      setActivePipelineStep(step);
      await new Promise(r => setTimeout(r, 450));
    }

    setIsScanning(false);

    if (currentInspection.decision.decision === 'PASS') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSelectPreset = (preset: WaferInspectionRecord) => {
    setSelectedPresetWaferId(preset.waferId);
    setInputWaferId(preset.waferId);
    setInputLotId(preset.lotId);
    setInputBatchId(preset.batchId);
    setInputMachineId(preset.machineId);
    setInputInspectionType(preset.inspectionType);
    setSelectedDefect(null);
    onUpdateInspection(preset);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const customWafer: WaferInspectionRecord = {
        ...currentInspection,
        waferId: `W-${Math.floor(1000 + Math.random() * 9000)}-CUSTOM`,
        timestamp: new Date().toISOString()
      };
      handleSelectPreset(customWafer);
    }
  };

  const getDecisionBadge = (decision: QualityDecisionResult) => {
    switch (decision.decision) {
      case 'PASS':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          icon: CheckCircle2,
          color: 'text-emerald-400',
          label: 'QUALITY RESULT: PASS'
        };
      case 'FAIL':
        return {
          bg: 'bg-red-950/80 border-red-500/50 text-red-300',
          icon: AlertCircle,
          color: 'text-red-400',
          label: 'QUALITY RESULT: FAIL'
        };
      case 'REVIEW_REQUIRED':
      default:
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          icon: AlertTriangle,
          color: 'text-amber-400',
          label: 'QUALITY RESULT: REVIEW REQUIRED'
        };
    }
  };

  const decisionBadge = getDecisionBadge(currentInspection.decision);
  const DecisionIcon = decisionBadge.icon;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4">
      {/* Header & Demo Mode Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-400" />
              <span>AI Visual Inspection & Defect Detection Engine</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI E10
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5 font-sans">
            High-NA Optical & Automated SEM Defect Detection, Sub-micron Bounding Annotation & Quality Decision Engine
          </p>
        </div>

        {/* Demo Mode Notice Badge */}
        <div className="flex items-center gap-2">
          {modelConfig.isSimulationMode ? (
            <div className="bg-[#14141d] border border-amber-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <div className="text-amber-300 font-bold text-[11px]">Demo Data — Simulation Mode</div>
                <div className="text-[9px] text-[#71717a]">Synthetic test models • Not connected to live production chamber</div>
              </div>
            </div>
          ) : (
            <div className="bg-[#14141d] border border-emerald-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <div className="text-emerald-300 font-bold text-[11px]">Live Model Endpoint Active</div>
                <div className="text-[9px] text-[#71717a] truncate max-w-xs">{modelConfig.endpointUrl}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Inspection Grid: Left Controls & Stage, Right Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Wafer Stage & Interactive Canvas (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3">
          {/* Preset Wafer Selector Strip */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#8e8e98]">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspection Preset Wafers:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {allSampleInspections.map((preset) => {
                const isSelected = selectedPresetWaferId === preset.waferId;
                const isFail = preset.decision.decision === 'FAIL';
                const isReview = preset.decision.decision === 'REVIEW_REQUIRED';

                return (
                  <button
                    key={preset.id}
                    id={`preset-wafer-${preset.waferId}`}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm'
                        : 'bg-[#14141c] hover:bg-[#1a1a24] text-[#8e8e98] border-[#242430]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isFail ? 'bg-red-400' : isReview ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <span>{preset.waferId}</span>
                    <span className="text-[9px] opacity-70 font-sans">({preset.decision.decision})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wafer Visualizer Canvas */}
          <div className="flex-1 min-h-[440px] w-full">
            <WaferInspectionCanvas
              waferId={currentInspection.waferId}
              diameterMm={currentInspection.waferDiameterMm}
              defects={currentInspection.defects}
              selectedDefectId={selectedDefect?.id}
              onSelectDefect={setSelectedDefect}
              isInspecting={isScanning}
            />
          </div>

          {/* End-to-End AI Inspection Pipeline Step Progress Bar */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8e8e98] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Autonomous Inspection Pipeline Stages</span>
              </span>
              <span className="text-indigo-400 text-[11px]">
                {isScanning ? `Step ${activePipelineStep + 1}/${PIPELINE_STEPS.length}: ${PIPELINE_STEPS[activePipelineStep].title}` : 'Pipeline Ready'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
              {PIPELINE_STEPS.map((step, idx) => {
                const isCurrent = isScanning && activePipelineStep === idx;
                const isPast = !isScanning || activePipelineStep > idx;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/70 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400 animate-pulse'
                        : isPast
                        ? 'bg-[#121218] border-[#22222c] text-[#8e8e98]'
                        : 'bg-[#0a0a0d] border-[#181820] text-[#52525b]'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold mb-0.5 truncate">
                      <span>{idx + 1}.</span>
                      <span className="truncate">{step.title}</span>
                    </div>
                    <p className="text-[9px] font-sans opacity-75 truncate">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Inspection Parameters, Defect Taxonomy & Decision Panel (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-3">
          {/* Quality Decision Engine Card */}
          <div className={`border rounded-xl p-4 space-y-3 shadow-xl ${decisionBadge.bg}`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <DecisionIcon className={`w-5 h-5 ${decisionBadge.color}`} />
                <span className="font-mono font-bold text-sm text-white tracking-wide">
                  {decisionBadge.label}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg font-mono text-xs text-white border border-white/10">
                <span className="text-[#a1a1aa] text-[10px]">Score:</span>
                <strong className={`text-base ${decisionBadge.color}`}>
                  {currentInspection.decision.qualityScore}/100
                </strong>
              </div>
            </div>

            <p className="text-xs text-[#e0e0e8] font-sans leading-relaxed">
              {currentInspection.decision.reason}
            </p>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <div className="text-[#a1a1aa] text-[9px]">TOTAL DEFECTS</div>
                <div className="text-white font-bold text-sm">{currentInspection.decision.defectCount}</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <div className="text-red-400 text-[9px]">CRITICAL</div>
                <div className="text-red-400 font-bold text-sm">{currentInspection.decision.criticalCount}</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <div className="text-orange-400 text-[9px]">HIGH</div>
                <div className="text-orange-400 font-bold text-sm">{currentInspection.decision.highCount}</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <div className="text-emerald-400 text-[9px]">AI CONF.</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {(currentInspection.decision.aiConfidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
              <button
                id="view-rca-btn"
                onClick={() => onNavigateTab('rca')}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Deep Root-Cause (RCA)</span>
              </button>

              <button
                id="generate-inspection-report-btn"
                onClick={() => onOpenReportModal(currentInspection)}
                className="px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#222232] text-white text-xs font-mono font-medium border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Report</span>
              </button>

              <button
                id="ask-copilot-inspection-btn"
                onClick={() => onTriggerCopilotWithInspection(`Analyze wafer inspection ${currentInspection.waferId} on machine ${currentInspection.machineId}. Explain why it received a ${currentInspection.decision.decision} verdict and check similar historical cases.`)}
                className="px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#222232] text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
                title="Ask Quality Copilot regarding this inspection"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copilot Analysis</span>
              </button>
            </div>
          </div>

          {/* Wafer & Lot Metadata Input Form */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Inspection Station Metadata</span>
              </span>
              <span className="text-[10px] text-[#71717a]">Fab-09 Line 4</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-[#8e8e98] block mb-1">WAFER ID</label>
                <input
                  type="text"
                  value={inputWaferId}
                  onChange={(e) => setInputWaferId(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272734] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8e8e98] block mb-1">LOT / BATCH ID</label>
                <input
                  type="text"
                  value={`${inputLotId} / ${inputBatchId}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('/');
                    setInputLotId(parts[0]?.trim() || inputLotId);
                    setInputBatchId(parts[1]?.trim() || inputBatchId);
                  }}
                  className="w-full bg-[#14141c] border border-[#272734] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-[#8e8e98] block mb-1">MACHINE / CHAMBER</label>
                <select
                  value={inputMachineId}
                  onChange={(e) => setInputMachineId(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272734] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                >
                  <option value="M-01">M-01: ASML EUV Litho Scanner</option>
                  <option value="M-02">M-02: Ebara CMP Polisher</option>
                  <option value="M-03">M-03: Applied Centura Etcher</option>
                  <option value="M-04">M-04: TEL Trias Clean Track</option>
                  <option value="M-05">M-05: Lam Vector PECVD</option>
                  <option value="M-06">M-06: KLA-Tencor Metrology</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#8e8e98] block mb-1">INSPECTION TYPE</label>
                <select
                  value={inputInspectionType}
                  onChange={(e) => setInputInspectionType(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272734] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
                >
                  <option value="Brightfield Optical & Automated SEM Review">Brightfield & SEM Review</option>
                  <option value="Darkfield Defect Scan & Overlay Metrology">Darkfield Laser Scan</option>
                  <option value="Total Surface Laser Scatterometry">Total Scatterometry</option>
                  <option value="Die-to-Database E-beam Metrology">Die-to-DB E-beam</option>
                </select>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2">
              <button
                id="start-ai-inspection-btn"
                onClick={handleStartInspection}
                disabled={isScanning}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Vision Defect Detection Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Start Automated AI Visual Inspection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Detected Defects Taxonomy Table */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 flex-1 flex flex-col space-y-2.5 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">Detected Defect Taxonomy</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px]">
                  {currentInspection.defects.length} Found
                </span>
              </div>
              <span className="text-[10px] text-[#71717a]">Click row to focus canvas</span>
            </div>

            {currentInspection.defects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="font-bold">Zero Surface Defects Detected</span>
                <span className="text-[10px] text-[#71717a]">Wafer complies with standard SEMI threshold</span>
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1 font-mono text-xs">
                {currentInspection.defects.map((d) => {
                  const isSelected = selectedDefect?.id === d.id;
                  const isCritical = d.severity === 'critical';
                  const isHigh = d.severity === 'high';

                  return (
                    <div
                      key={d.id}
                      id={`defect-row-${d.id}`}
                      onClick={() => setSelectedDefect(d)}
                      className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-md'
                          : 'bg-[#121218] hover:bg-[#181822] border-[#22222c] text-[#a1a1aa]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          isCritical
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : isHigh
                            ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}>
                          {d.id}
                        </span>
                        <div className="min-w-0">
                          <div className="text-white text-xs font-semibold truncate">{d.name}</div>
                          <div className="text-[9px] text-[#71717a] truncate font-sans">
                            Die: [{d.dieCoordinate?.x}, {d.dieCoordinate?.y}] • Area: {d.estimatedSizeUm} µm²
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-emerald-400 font-bold text-xs">
                          {(d.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-[#71717a] uppercase">{d.category.replace('_', ' ')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
