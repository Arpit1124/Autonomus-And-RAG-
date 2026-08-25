import React, { useState, useMemo } from 'react';
import { PRODUCTION_ANALYTICS_30_DAYS, ProductionDailyMetric } from '../data/waferData';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Calendar, 
  Filter, 
  Sliders, 
  Layers, 
  Cpu, 
  Sparkles,
  Zap,
  Info,
  RefreshCw
} from 'lucide-react';
import { MachineHealthRecord, HistoricalInspectionCase } from '../types';

interface Props {
  machines?: MachineHealthRecord[];
  historicalCases?: HistoricalInspectionCase[];
  onTriggerCopilot: (prompt: string) => void;
}

export const ProductionAnalyticsView: React.FC<Props> = ({ 
  machines = [], 
  historicalCases = [], 
  onTriggerCopilot 
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [selectedMachine, setSelectedMachine] = useState<string>('ALL');
  const [selectedLot, setSelectedLot] = useState<string>('ALL');
  const [chartViewMode, setChartViewMode] = useState<'yield_line' | 'defect_breakdown' | 'machine_drift'>('yield_line');

  // Filter machines options
  const machineOptions = [
    { id: 'ALL', name: 'All Machines (Fleet Aggregate)' },
    { id: 'M-03', name: 'M-03: Applied Centura Etcher (Chamber Drift)' },
    { id: 'M-01', name: 'M-01: ASML Twinscan High-NA EUV Scanner' },
    { id: 'M-02', name: 'M-02: Ebara F-REX300 CMP Polisher' },
    { id: 'M-04', name: 'M-04: TEL Trias Clean Track System' },
    { id: 'M-05', name: 'M-05: Lam Vector PECVD Deposition' },
    { id: 'M-06', name: 'M-06: KLA-Tencor Metrology & SEM' }
  ];

  // Filter lots options
  const lotOptions = [
    { id: 'ALL', name: 'All Production Lots' },
    { id: 'LOT-9921-X', name: 'LOT-9921-X (Gate Etch Anomaly - M-03)' },
    { id: 'LOT-9804-A', name: 'LOT-9804-A (High-Yield Golden Lot)' },
    { id: 'LOT-9780-F', name: 'LOT-9780-F (CMP Slurry Micro-Scratches)' },
    { id: 'LOT-9650-D', name: 'LOT-9650-D (EUV Reticle Flare)' },
    { id: 'LOT-9510-E', name: 'LOT-9510-E (PECVD Dielectric Oxide)' }
  ];

  const sliceCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
  const rawDataSlice = PRODUCTION_ANALYTICS_30_DAYS.slice(30 - sliceCount);

  // Compute modulated daily data based on Machine & Lot filters
  const filteredData = useMemo(() => {
    return rawDataSlice.map((d, index) => {
      let yieldMultiplier = 1.0;
      let qualityMultiplier = 1.0;
      let customDefectRate = d.m03DefectRate;

      // Filter modulation by Machine
      if (selectedMachine === 'M-03') {
        // M-03 exhibits severe yield dip between Aug 12 and Aug 18
        const dayNum = parseInt(d.date.split('-')[2] || '1', 10);
        if (dayNum >= 12 && dayNum <= 18) {
          yieldMultiplier = 0.88;
          qualityMultiplier = 0.85;
          customDefectRate = +(d.m03DefectRate * 1.8).toFixed(1);
        } else {
          yieldMultiplier = 0.94;
          qualityMultiplier = 0.93;
        }
      } else if (selectedMachine === 'M-02') {
        // Ebara CMP is high performing (96%+)
        yieldMultiplier = 1.04;
        qualityMultiplier = 1.03;
        customDefectRate = +(d.m03DefectRate * 0.2).toFixed(1);
      } else if (selectedMachine === 'M-01') {
        // ASML EUV Scanner has slight drift
        yieldMultiplier = 0.98;
        qualityMultiplier = 0.97;
        customDefectRate = +(d.m03DefectRate * 0.4).toFixed(1);
      } else if (selectedMachine === 'M-04') {
        yieldMultiplier = 1.02;
        qualityMultiplier = 1.02;
        customDefectRate = 0.3;
      } else if (selectedMachine === 'M-05') {
        yieldMultiplier = 0.99;
        qualityMultiplier = 0.98;
        customDefectRate = 0.8;
      } else if (selectedMachine === 'M-06') {
        yieldMultiplier = 1.01;
        qualityMultiplier = 1.01;
        customDefectRate = 0.4;
      }

      // Filter modulation by Lot
      if (selectedLot === 'LOT-9921-X') {
        yieldMultiplier *= 0.92;
        qualityMultiplier *= 0.90;
      } else if (selectedLot === 'LOT-9804-A') {
        yieldMultiplier *= 1.05;
        qualityMultiplier *= 1.04;
      } else if (selectedLot === 'LOT-9780-F') {
        yieldMultiplier *= 0.95;
        qualityMultiplier *= 0.94;
      } else if (selectedLot === 'LOT-9650-D') {
        yieldMultiplier *= 0.96;
      }

      const passRatePct = Math.min(99.4, Math.max(76.5, +(d.passRatePct * yieldMultiplier).toFixed(1)));
      const avgQualityScore = Math.min(99.0, Math.max(74.0, +(d.avgQualityScore * qualityMultiplier).toFixed(1)));
      const totalInspected = selectedMachine === 'ALL' ? d.totalInspected : Math.round(d.totalInspected / 6);
      const passedCount = Math.round((totalInspected * passRatePct) / 100);
      const failedCount = totalInspected - passedCount;

      return {
        ...d,
        totalInspected,
        passedCount,
        failedCount,
        passRatePct,
        avgQualityScore,
        targetYield: 92.0,
        m03DefectRate: customDefectRate
      };
    });
  }, [rawDataSlice, selectedMachine, selectedLot]);

  // Compute aggregate stats for the active filter
  const totalInspected = filteredData.reduce((acc, curr) => acc + curr.totalInspected, 0);
  const totalPassed = filteredData.reduce((acc, curr) => acc + curr.passedCount, 0);
  const totalFailed = filteredData.reduce((acc, curr) => acc + curr.failedCount, 0);
  const avgYield = +(totalPassed / Math.max(1, totalInspected) * 100).toFixed(1);
  const avgQuality = +(filteredData.reduce((acc, curr) => acc + curr.avgQualityScore, 0) / Math.max(1, filteredData.length)).toFixed(1);
  const minYield = Math.min(...filteredData.map(d => d.passRatePct));
  const maxYield = Math.max(...filteredData.map(d => d.passRatePct));

  // Category data for the right breakdown
  const categoryData = [
    { name: 'Particles & Flakes', count: filteredData.reduce((a, c) => a + c.particles, 0), color: '#f97316' },
    { name: 'Scratches & Gouges', count: filteredData.reduce((a, c) => a + c.scratches, 0), color: '#eab308' },
    { name: 'Cracks & Fractures', count: filteredData.reduce((a, c) => a + c.cracks, 0), color: '#ef4444' },
    { name: 'Pattern Anomalies', count: filteredData.reduce((a, c) => a + c.patternAnomalies, 0), color: '#a855f7' },
    { name: 'Chemical Stains', count: filteredData.reduce((a, c) => a + c.stains, 0), color: '#06b6d4' }
  ];

  const handleExportCSV = () => {
    const headers = 'Date,MachineFilter,LotFilter,TotalInspected,Passed,Failed,YieldPct,AvgQualityScore,TargetYieldPct\n';
    const rows = filteredData.map(d => 
      `${d.date},${selectedMachine},${selectedLot},${d.totalInspected},${d.passedCount},${d.failedCount},${d.passRatePct},${d.avgQualityScore},${d.targetYield}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WaferGuard_Yield_Analytics_${selectedMachine}_${selectedLot}_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSelectedMachine('ALL');
    setSelectedLot('ALL');
    setTimeRange('30d');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Production Yield Trends & Machine Anomaly Analytics</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI E10 Compliance
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Historical 30-Day Wafer Yield Tracking, Dynamic Machine & Lot Filtering, and Defect Pareto Analysis
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <div className="flex items-center bg-[#14141c] border border-[#242430] rounded-lg p-0.5">
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
                id={`time-range-btn-${r}`}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  timeRange === r ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            id="export-analytics-csv-btn"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#222232] text-white text-xs font-mono font-medium border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Machine & Lot Filter Bar */}
      <div className="bg-[#0c0c12] border border-[#1f1f2a] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Yield Trend:</span>
          </div>

          {/* Machine Filter Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[220px]">
            <span className="text-[10px] text-[#71717a]">MACHINE:</span>
            <select
              id="filter-machine-select"
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="bg-[#141420] border border-[#28283e] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer flex-1"
            >
              {machineOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lot Filter Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <span className="text-[10px] text-[#71717a]">LOT / BATCH:</span>
            <select
              id="filter-lot-select"
              value={selectedLot}
              onChange={(e) => setSelectedLot(e.target.value)}
              className="bg-[#141420] border border-[#28283e] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer flex-1"
            >
              {lotOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedMachine !== 'ALL' || selectedLot !== 'ALL') && (
            <button
              id="reset-filters-btn"
              onClick={handleResetFilters}
              className="px-2 py-1 bg-[#1a1a28] hover:bg-[#24243a] text-zinc-400 hover:text-white rounded-lg transition flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#141420] p-1 rounded-lg border border-[#242436]">
          <button
            id="view-yield-line-btn"
            onClick={() => setChartViewMode('yield_line')}
            className={`px-2.5 py-1 rounded transition text-xs cursor-pointer ${
              chartViewMode === 'yield_line' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
            }`}
          >
            Wafer Yield Line
          </button>
          <button
            id="view-defect-bar-btn"
            onClick={() => setChartViewMode('defect_breakdown')}
            className={`px-2.5 py-1 rounded transition text-xs cursor-pointer ${
              chartViewMode === 'defect_breakdown' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
            }`}
          >
            Defect Stack
          </button>
          <button
            id="view-drift-line-btn"
            onClick={() => setChartViewMode('machine_drift')}
            className={`px-2.5 py-1 rounded transition text-xs cursor-pointer ${
              chartViewMode === 'machine_drift' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
            }`}
          >
            Tool Anomaly Drift
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">FILTERED INSPECTIONS</span>
          <div className="text-lg font-bold text-white">{totalInspected}</div>
          <span className="text-[9px] text-emerald-400">100% Optical Coverage</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">AVERAGE YIELD</span>
          <div className={`text-lg font-bold ${avgYield >= 92 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgYield}%
          </div>
          <span className="text-[9px] text-zinc-400">SEMI SLA: ≥92.0%</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">PASSED WAFERS</span>
          <div className="text-lg font-bold text-white">{totalPassed}</div>
          <span className="text-[9px] text-emerald-400">{((totalPassed / Math.max(1, totalInspected)) * 100).toFixed(1)}% pass</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">FAILED WAFERS</span>
          <div className="text-lg font-bold text-red-400">{totalFailed}</div>
          <span className="text-[9px] text-red-400">{((totalFailed / Math.max(1, totalInspected)) * 100).toFixed(1)}% fail</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">AVG QUALITY SCORE</span>
          <div className="text-lg font-bold text-indigo-300">{avgQuality}/100</div>
          <span className="text-[9px] text-zinc-400">AI Confidence Weighted</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">YIELD VOLATILITY</span>
          <div className="text-lg font-bold text-amber-400">{minYield}% – {maxYield}%</div>
          <span className="text-[9px] text-amber-400">Min to Peak Day</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Recharts Line Graph for Wafer Yield Trends (8 cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f26] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Wafer Yield Trend Over 30 Days</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#181828] text-indigo-300 border border-indigo-500/30">
                  {selectedMachine === 'ALL' ? 'Fleet Wide' : selectedMachine} • {selectedLot === 'ALL' ? 'All Lots' : selectedLot}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>Wafer Yield (%)</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Quality Score</span>
                </div>
                <div className="flex items-center gap-1 text-red-400">
                  <span className="w-3 h-0.5 border-b border-red-500 border-dashed inline-block" />
                  <span>92% SEMI Target</span>
                </div>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="h-72 sm:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'yield_line' ? (
                  <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineYieldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={10} 
                      domain={[70, 100]} 
                      unit="%" 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0c0c14', 
                        borderColor: '#28283c', 
                        borderRadius: '10px', 
                        fontSize: '11px', 
                        color: '#fff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.8)' 
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'Wafer Yield (%)') return [`${val}%`, 'Wafer Yield'];
                        if (name === 'Quality Score') return [`${val}/100`, 'Avg Quality Score'];
                        return [val, name];
                      }}
                      labelFormatter={(label) => `Date: ${label} (${selectedMachine} / ${selectedLot})`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                    {/* SEMI E10 92.0% Target SLA Reference Line */}
                    <ReferenceLine 
                      y={92.0} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ value: 'SEMI Target (92.0%)', fill: '#ef4444', fontSize: 10, position: 'right' }} 
                    />

                    {/* Wafer Yield Trend Line */}
                    <Line 
                      type="monotone" 
                      dataKey="passRatePct" 
                      name="Wafer Yield (%)" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                    />

                    {/* Avg Quality Score Line */}
                    <Line 
                      type="monotone" 
                      dataKey="avgQualityScore" 
                      name="Quality Score" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                ) : chartViewMode === 'defect_breakdown' ? (
                  <BarChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0c0c14', borderColor: '#28283c', borderRadius: '10px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="particles" name="Particles & Flakes" fill="#f97316" stackId="a" />
                    <Bar dataKey="scratches" name="Scratches & Gouges" fill="#eab308" stackId="a" />
                    <Bar dataKey="cracks" name="Cracks & Fractures" fill="#ef4444" stackId="a" />
                    <Bar dataKey="patternAnomalies" name="Pattern Anomalies" fill="#a855f7" stackId="a" />
                  </BarChart>
                ) : (
                  <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[0, 10]} unit="%" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0c0c14', borderColor: '#28283c', borderRadius: '10px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="m03DefectRate" name="Machine M-03 Thermal Drift Rate (%)" stroke="#ef4444" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="failRatePct" name="Overall Fleet Fail Rate (%)" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Explanatory insight footer */}
            <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-2 border-t border-[#1f1f26]">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Showing 30-day yield telemetry indexed by SEMI E10 run standards.</span>
              </span>
              <button
                onClick={() => onTriggerCopilot(`Perform deep mathematical correlation on 30-day yield data for Machine ${selectedMachine} and Lot ${selectedLot}. Explain root causes of any yield excursions below 92.0%.`)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Ask Copilot to Analyze Trend</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Defect Category Breakdown (4 cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-3 font-mono text-xs">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold">Defect Pareto Classification</span>
              <span className="text-[10px] text-[#71717a]">30D Distribution</span>
            </div>

            {/* Category Bars */}
            <div className="space-y-2.5">
              {categoryData.map((cat, idx) => {
                const totalAll = categoryData.reduce((a, b) => a + b.count, 0);
                const pct = +((cat.count / Math.max(1, totalAll)) * 100).toFixed(1);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-medium">{cat.name}</span>
                      <span className="text-[#8e8e98]">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Correlation Insight Note */}
            <div className="p-3 rounded-lg bg-[#14141e] border border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Correlated Anomaly Finding</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] font-sans leading-relaxed">
                {selectedMachine === 'M-03' 
                  ? 'Machine M-03 exhibits an excursion drop to 79.4% yield due to thermal instability and helium backpressure loss in Chamber B.'
                  : selectedMachine === 'M-02'
                  ? 'Ebara CMP Polisher maintains an exemplary 96.8% pass rate with zero macro crack propagation detected.'
                  : 'Cracks and Particles represent 68% of scrap events, primarily clustered around wafer notch and peripheral exclusion rings.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
