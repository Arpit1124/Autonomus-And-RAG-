import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Microscope, 
  BrainCircuit, 
  Layers, 
  Cpu, 
  History, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { WaferInspectionRecord, MachineHealthRecord, HistoricalInspectionCase, KnowledgeDocument, AuditLogEntry } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inspections: WaferInspectionRecord[];
  machines: MachineHealthRecord[];
  historicalCases: HistoricalInspectionCase[];
  documents: KnowledgeDocument[];
  auditLogs?: AuditLogEntry[];
  onNavigateTab?: (tab: any) => void;
  onSelectInspection: (inspection: WaferInspectionRecord) => void;
  onSelectMachine?: (machine: MachineHealthRecord) => void;
  onSelectCase?: (historicalCase: HistoricalInspectionCase) => void;
  onSelectDocument?: (doc: KnowledgeDocument) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  inspections,
  machines,
  historicalCases,
  documents,
  auditLogs = [],
  onNavigateTab,
  onSelectInspection,
  onSelectMachine,
  onSelectCase,
  onSelectDocument
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'wafers' | 'machines' | 'rca' | 'docs' | 'audit'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        wafers: inspections.slice(0, 3),
        machines: machines.slice(0, 2),
        historical: historicalCases.slice(0, 2),
        documents: documents.slice(0, 2),
        audit: auditLogs.slice(0, 2)
      };
    }

    const q = query.toLowerCase().trim();

    const wafers = inspections.filter(i => 
      i.waferId.toLowerCase().includes(q) ||
      i.lotId.toLowerCase().includes(q) ||
      i.machineId.toLowerCase().includes(q) ||
      i.defects.some(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))
    );

    const machs = machines.filter(m => 
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.stationType.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q)
    );

    const hist = historicalCases.filter(h =>
      h.id.toLowerCase().includes(q) ||
      h.waferId.toLowerCase().includes(q) ||
      h.rootCauseSummary.toLowerCase().includes(q) ||
      h.correctiveActionSummary.toLowerCase().includes(q)
    );

    const docs = documents.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    );

    const logs = auditLogs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q)
    );

    return { wafers, machines: machs, historical: hist, documents: docs, audit: logs };
  }, [query, inspections, machines, historicalCases, documents, auditLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 px-4 font-mono text-xs animate-in fade-in">
      <div className="bg-[#0b0b12] border border-[#222234] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#1f1f2e] flex items-center gap-3 bg-[#10101a]">
          <Search className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search wafers (W-7821), tools (M-03), defect taxonomy, SOP documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-white font-mono text-sm placeholder-[#71717a] focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#181826] border border-[#2c2c40] text-[10px] text-[#71717a] flex items-center gap-1">
            <Command className="w-3 h-3" /> K
          </kbd>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[#8e8e98] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-3 py-2 bg-[#0e0e16] border-b border-[#1a1a26] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'wafers', label: 'Wafers & Lots' },
            { id: 'machines', label: 'Tool Fleet' },
            { id: 'rca', label: 'RCA & Memory' },
            { id: 'docs', label: 'SOP & SEMI Standards' },
            { id: 'audit', label: 'Audit Logs' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-bold'
                  : 'text-[#8e8e98] hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Wafers Section */}
          {(activeCategory === 'all' || activeCategory === 'wafers') && searchResults.wafers.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#71717a] px-2 flex items-center gap-1.5">
                <Microscope className="w-3 h-3 text-indigo-400" />
                <span>Wafers & Inspection Lots ({searchResults.wafers.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.wafers.map(insp => (
                  <div
                    key={insp.id}
                    onClick={() => {
                      onSelectInspection(insp);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#12121e] hover:bg-[#18182a] border border-[#202032] hover:border-indigo-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-300 font-bold">
                        {insp.waferId.slice(-2)}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{insp.waferId}</span>
                          <span className="text-[10px] text-[#71717a]">({insp.lotId})</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            insp.decision.decision === 'PASS' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-950 text-red-300 border border-red-500/30'
                          }`}>
                            {insp.decision.decision}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e8e98] mt-0.5">
                          Tool: {insp.machineId} • {insp.defects.length} Defects ({insp.defects.map(d => d.name).slice(0, 2).join(', ')})
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717a] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Fleet Section */}
          {(activeCategory === 'all' || activeCategory === 'machines') && searchResults.machines.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#71717a] px-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Tool Fleet & Etch Chambers ({searchResults.machines.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.machines.map(mach => (
                  <div
                    key={mach.id}
                    onClick={() => {
                      if (onSelectMachine) onSelectMachine(mach);
                      else if (onNavigateTab) onNavigateTab('machines');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#12121e] hover:bg-[#18182a] border border-[#202032] hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-300 font-bold">
                        {mach.id}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{mach.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            mach.anomalyDetected 
                              ? 'bg-red-950 text-red-300 border border-red-500/30 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {mach.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e8e98] mt-0.5">
                          {mach.stationType} • {mach.location} • Health: {mach.healthScore}%
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717a] group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical RCA Section */}
          {(activeCategory === 'all' || activeCategory === 'rca') && searchResults.historical.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#71717a] px-2 flex items-center gap-1.5">
                <History className="w-3 h-3 text-amber-400" />
                <span>Historical RCA Memory ({searchResults.historical.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.historical.map(hist => (
                  <div
                    key={hist.id}
                    onClick={() => {
                      if (onSelectCase) onSelectCase(hist);
                      else if (onNavigateTab) onNavigateTab('history');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#12121e] hover:bg-[#18182a] border border-[#202032] hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-950 flex items-center justify-center text-amber-300 font-bold">
                        {hist.similarityPct}%
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{hist.id}</span>
                          <span className="text-[10px] text-amber-300 font-bold">{hist.defectCategory}</span>
                        </div>
                        <div className="text-[10px] text-[#8e8e98] mt-0.5 line-clamp-1">
                          {hist.rootCauseSummary}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717a] group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOP Knowledge Documents */}
          {(activeCategory === 'all' || activeCategory === 'docs') && searchResults.documents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#71717a] px-2 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-purple-400" />
                <span>SEMI & Fab SOP Documents ({searchResults.documents.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (onSelectDocument) onSelectDocument(doc);
                      else if (onNavigateTab) onNavigateTab('knowledge');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#12121e] hover:bg-[#18182a] border border-[#202032] hover:border-purple-500/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-950 flex items-center justify-center text-purple-300 font-bold">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{doc.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            {doc.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e8e98] mt-0.5 line-clamp-1">
                          {doc.summary}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717a] group-hover:text-purple-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#1f1f2e] bg-[#0e0e16] text-[10px] text-[#71717a] flex items-center justify-between">
          <span>Navigate with Arrow keys • Press Enter to view item</span>
          <span>Fab-09 Metrology Neural Search v2.4</span>
        </div>
      </div>
    </div>
  );
};
