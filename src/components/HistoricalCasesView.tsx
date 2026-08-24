import React, { useState } from 'react';
import { HistoricalInspectionCase, WaferInspectionRecord } from '../types';
import { HISTORICAL_CASES } from '../data/waferData';
import { 
  History, 
  Search, 
  Filter, 
  GitCompare, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  BookOpen, 
  Layers,
  ChevronRight
} from 'lucide-react';

interface Props {
  currentInspection: WaferInspectionRecord;
  onNavigateTab: (tab: any) => void;
  onTriggerCopilot: (prompt: string) => void;
}

export const HistoricalCasesView: React.FC<Props> = ({
  currentInspection,
  onNavigateTab,
  onTriggerCopilot
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<HistoricalInspectionCase>(HISTORICAL_CASES[0]);

  const filteredCases = HISTORICAL_CASES.filter(c => {
    const matchesCat = selectedCategory === 'all' || c.defectCategory === selectedCategory;
    const matchesSearch = !searchQuery || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.waferId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rootCauseSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.machineId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Historical Inspection Cases & Defect Pattern Matching</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Fab-09 Memory Archive
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Compare recurring defect morphologies, past root-cause resolutions, and corrective action efficacy
          </p>
        </div>

        {/* Similar Match with Current Inspection Alert */}
        <div className="flex items-center gap-2 bg-[#121218] border border-indigo-500/40 px-3 py-1.5 rounded-lg font-mono text-xs text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Top Match for {currentInspection.waferId}: <strong>HIST-2025-0812 (94% Match)</strong></span>
        </div>
      </div>

      {/* Main Grid: Left Case List & Search, Right Detailed Case Breakdown & Resolution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Filterable Case Library (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white">
              <Search className="w-3.5 h-3.5 text-[#8e8e98]" />
              <input
                type="text"
                placeholder="Search historical records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-[#71717a] w-full font-mono"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#14141c] border border-[#242430] rounded-lg px-2 py-1.5 text-white text-xs font-mono cursor-pointer"
            >
              <option value="all">All Defect Types</option>
              <option value="crack">Cracks</option>
              <option value="particle_contamination">Particle Clusters</option>
              <option value="scratch">Scratches</option>
              <option value="pattern_anomaly">Pattern Anomalies</option>
              <option value="stain">Stains</option>
            </select>
          </div>

          {/* Historical Case Cards */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 flex-1 flex flex-col space-y-2.5 max-h-[560px] overflow-y-auto pr-1 font-mono text-xs">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  id={`case-card-${c.id}`}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg'
                      : 'bg-[#121218] hover:bg-[#181822] border-[#22222e] text-[#a1a1aa]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{c.id}</span>
                      <span className="text-[10px] text-[#71717a]">({c.date})</span>
                    </div>

                    <span className="text-emerald-400 font-bold text-xs">
                      {c.similarityPct}% Match
                    </span>
                  </div>

                  <p className="text-xs text-[#d1d1db] font-sans line-clamp-2 leading-relaxed">
                    {c.rootCauseSummary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#71717a] border-t border-white/5 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span>Tool: <strong className="text-white">{c.machineId}</strong></span>
                      <span>•</span>
                      <span>Type: <strong className="text-indigo-300 uppercase">{c.defectCategory}</strong></span>
                    </div>

                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      c.decision === 'FAIL' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      {c.decision}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Deep-Dive & Side-by-Side Resolution (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3 font-sans text-xs">
          {selectedCase && (
            <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/40 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                      {selectedCase.id}
                    </span>
                    <h2 className="text-sm font-bold text-white font-mono">
                      Wafer: {selectedCase.waferId} ({selectedCase.lotId})
                    </h2>
                  </div>
                  <span className="text-[10px] text-[#71717a] font-mono mt-0.5 block">
                    Recorded Date: {selectedCase.date} • Process: {selectedCase.processStep} • Tool: {selectedCase.machineId}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-[#14141e] border border-emerald-500/40 px-2.5 py-1 rounded-lg font-mono text-xs text-white">
                  <span className="text-[#a1a1aa] text-[10px]">Morphology Match:</span>
                  <strong className="text-emerald-400 text-sm">{selectedCase.similarityPct}%</strong>
                </div>
              </div>

              {/* Historical Root Cause Analysis */}
              <div className="bg-[#12121a] border border-[#22222e] rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 block">
                  1. Historical Root-Cause Finding
                </span>
                <p className="text-xs text-[#e0e0e8] leading-relaxed">
                  {selectedCase.rootCauseSummary}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCase.keyFactors.map((factor, fIdx) => (
                    <span key={fIdx} className="px-2 py-0.5 rounded bg-[#181824] text-indigo-200 border border-[#2a2a3c] text-[10px] font-mono">
                      #{factor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Historical Corrective Action */}
              <div className="bg-[#12121a] border border-[#22222e] rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-300 block">
                  2. Corrective & Preventive Action Applied
                </span>
                <p className="text-xs text-[#e0e0e8] leading-relaxed">
                  {selectedCase.correctiveActionSummary}
                </p>
              </div>

              {/* Resolution & Long-Term Outcome */}
              <div className="bg-[#12121a] border border-[#22222e] rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-300 block">
                  3. Long-Term Verification Outcome
                </span>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-[#e0e0e8] leading-relaxed">
                    {selectedCase.finalResolution}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-[#1f1f26] pt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <span className="text-[#71717a] text-[10px]">
                  Applicable to current wafer {currentInspection.waferId} on {currentInspection.machineId}
                </span>

                <button
                  onClick={() => onTriggerCopilot(`Compare current wafer inspection ${currentInspection.waferId} with historical case ${selectedCase.id}. Did the previous corrective action resolve the problem long-term?`)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compare in Copilot</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
