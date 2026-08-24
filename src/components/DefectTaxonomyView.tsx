import React, { useState } from 'react';
import { 
  DefectCategory, 
  DefectSeverity, 
  DefectItem, 
  WaferInspectionRecord 
} from '../types';
import { DEFECT_TAXONOMY_CATALOG, DefectTaxonomyDefinition } from '../data/waferData';
import { 
  Layers, 
  Search, 
  Filter, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Crosshair, 
  ExternalLink, 
  BookOpen, 
  Sparkles,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface Props {
  inspections: WaferInspectionRecord[];
  onSelectWaferInspection: (inspection: WaferInspectionRecord) => void;
  onNavigateTab: (tab: any) => void;
}

export const DefectTaxonomyView: React.FC<Props> = ({
  inspections,
  onSelectWaferInspection,
  onNavigateTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DefectCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<DefectSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTaxon, setSelectedTaxon] = useState<DefectTaxonomyDefinition | null>(DEFECT_TAXONOMY_CATALOG[0]);

  // Aggregate all detected defects from all inspection records
  const allDetectedDefects: Array<{ defect: DefectItem; inspection: WaferInspectionRecord }> = [];
  inspections.forEach(insp => {
    insp.defects.forEach(def => {
      allDetectedDefects.push({ defect: def, inspection: insp });
    });
  });

  const filteredDefects = allDetectedDefects.filter(({ defect, inspection }) => {
    const matchesCat = selectedCategory === 'all' || defect.category === selectedCategory;
    const matchesSev = severityFilter === 'all' || defect.severity === severityFilter;
    const matchesSearch = !searchQuery || 
      defect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defect.waferId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defect.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.machineId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSev && matchesSearch;
  });

  const getSeverityBadge = (severity: DefectSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'low':
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Semiconductor Defect Taxonomy & Classification Library</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI Standard Dictionary
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Standardized Morphological Taxonomies, Root Causes, Metrology Methods & Live Detected Incidents
          </p>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#8e8e98]">
          <span className="bg-[#121218] border border-[#22222c] px-2.5 py-1 rounded-lg">
            Catalog: <strong className="text-white">{DEFECT_TAXONOMY_CATALOG.length} Classes</strong>
          </span>
          <span className="bg-[#121218] border border-[#22222c] px-2.5 py-1 rounded-lg">
            Active Defect Events: <strong className="text-indigo-400">{allDetectedDefects.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Content Grid: Left Taxonomy Catalog & Detail, Right Live Detected Defect Events */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Taxonomy Catalog (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>SEMI Classification Taxonomy</span>
              </span>
              <span className="text-[10px] text-[#71717a]">Select category</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {DEFECT_TAXONOMY_CATALOG.map((item) => {
                const isSelected = selectedTaxon?.category === item.category;
                const count = allDetectedDefects.filter(d => d.defect.category === item.category).length;

                return (
                  <button
                    key={item.category}
                    id={`taxon-${item.category}`}
                    onClick={() => {
                      setSelectedTaxon(item);
                      setSelectedCategory(item.category);
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                        : 'bg-[#121218] hover:bg-[#181822] border-[#22222c] text-[#8e8e98]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">{item.displayName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-indigo-300 font-mono">
                        {item.semiCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] mt-1 text-[#71717a]">
                      <span className="uppercase">{item.defaultSeverity}</span>
                      <span>{count} live hits</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Taxonomy Detail Card */}
          {selectedTaxon && (
            <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3 flex-1 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2.5">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">
                    {selectedTaxon.semiCode}
                  </span>
                  <h3 className="text-sm font-bold text-white font-mono mt-0.5">
                    {selectedTaxon.displayName}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getSeverityBadge(selectedTaxon.defaultSeverity)}`}>
                  {selectedTaxon.defaultSeverity} Severity
                </span>
              </div>

              <p className="text-xs text-[#d1d1db] leading-relaxed">
                {selectedTaxon.description}
              </p>

              <div className="space-y-2 text-xs border-t border-[#1f1f26] pt-2.5 font-mono">
                <div>
                  <span className="text-[10px] text-[#8e8e98] uppercase block mb-1">Typical Root Causes:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTaxon.typicalCauses.map((cause, cIdx) => (
                      <span key={cIdx} className="px-2 py-0.5 rounded bg-[#141420] text-[#e0e0e8] border border-[#242436] text-[10px]">
                        {cause}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8e8e98] uppercase block mb-1">Recommended Metrology Methods:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTaxon.inspectionMethods.map((met, mIdx) => (
                      <span key={mIdx} className="px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 text-[10px]">
                        {met}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Filterable Live Defect Instances (7 cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white">
              <Search className="w-3.5 h-3.5 text-[#8e8e98]" />
              <input
                type="text"
                placeholder="Search defects by name, wafer ID, or machine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-[#71717a] w-full font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="bg-[#14141c] border border-[#242430] rounded-lg px-2 py-1.5 text-white text-xs font-mono cursor-pointer"
              >
                <option value="all">All Categories</option>
                {DEFECT_TAXONOMY_CATALOG.map(c => (
                  <option key={c.category} value={c.category}>{c.displayName}</option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-[#14141c] border border-[#242430] rounded-lg px-2 py-1.5 text-white text-xs font-mono cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          </div>

          {/* Live Defects Table / Cards */}
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 flex-1 flex flex-col space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                <span>Detected Defect Incidents ({filteredDefects.length})</span>
              </span>
              <span className="text-[10px] text-[#71717a]">Click defect to load in Visual Inspector</span>
            </div>

            {filteredDefects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8e8e98]">
                <Filter className="w-6 h-6 text-[#52525b] mb-2" />
                <span>No defect events match the selected filters.</span>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {filteredDefects.map(({ defect, inspection }) => (
                  <div
                    key={`${inspection.id}-${defect.id}`}
                    onClick={() => {
                      onSelectWaferInspection(inspection);
                      onNavigateTab('inspection');
                    }}
                    className="p-3 rounded-xl bg-[#121218] hover:bg-[#181824] border border-[#22222e] hover:border-indigo-500/50 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getSeverityBadge(defect.severity)}`}>
                          {defect.id} • {defect.severity}
                        </span>
                        <span className="font-bold text-white text-xs group-hover:text-indigo-300 transition">
                          {defect.name}
                        </span>
                      </div>

                      <span className="text-emerald-400 font-bold text-xs">
                        {(defect.confidence * 100).toFixed(1)}% AI Conf.
                      </span>
                    </div>

                    <p className="text-[11px] text-[#a1a1aa] font-sans leading-relaxed">
                      {defect.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#71717a] border-t border-white/5 pt-2">
                      <div className="flex items-center gap-2">
                        <span>Wafer: <strong className="text-white">{defect.waferId}</strong></span>
                        <span>•</span>
                        <span>Machine: <strong className="text-white">{inspection.machineId}</strong></span>
                        <span>•</span>
                        <span>Die: <strong className="text-white">[{defect.dieCoordinate?.x}, {defect.dieCoordinate?.y}]</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect in Stage</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
