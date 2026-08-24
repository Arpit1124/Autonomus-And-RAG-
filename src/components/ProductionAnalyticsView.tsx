import React, { useState } from 'react';
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
  PieChart, 
  Pie, 
  Cell 
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
  Sparkles 
} from 'lucide-react';

interface Props {
  onTriggerCopilot: (prompt: string) => void;
}

export const ProductionAnalyticsView: React.FC<Props> = ({ onTriggerCopilot }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'yield' | 'defects' | 'machine_drift'>('yield');

  const sliceCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
  const chartData = PRODUCTION_ANALYTICS_30_DAYS.slice(30 - sliceCount);

  // Compute aggregate stats
  const totalInspected = chartData.reduce((acc, curr) => acc + curr.totalInspected, 0);
  const totalPassed = chartData.reduce((acc, curr) => acc + curr.passedCount, 0);
  const totalFailed = chartData.reduce((acc, curr) => acc + curr.failedCount, 0);
  const totalReview = chartData.reduce((acc, curr) => acc + curr.reviewCount, 0);
  const avgYield = +(totalPassed / totalInspected * 100).toFixed(1);
  const totalCritical = chartData.reduce((acc, curr) => acc + curr.criticalDefects, 0);

  // Defect Category Breakdown Data for Pie / Bar
  const categoryData = [
    { name: 'Particles & Flakes', count: chartData.reduce((a, c) => a + c.particles, 0), color: '#f97316' },
    { name: 'Scratches & Gouges', count: chartData.reduce((a, c) => a + c.scratches, 0), color: '#eab308' },
    { name: 'Cracks & Fractures', count: chartData.reduce((a, c) => a + c.cracks, 0), color: '#ef4444' },
    { name: 'Pattern Anomalies', count: chartData.reduce((a, c) => a + c.patternAnomalies, 0), color: '#a855f7' },
    { name: 'Chemical Stains', count: chartData.reduce((a, c) => a + c.stains, 0), color: '#06b6d4' }
  ];

  const handleExportCSV = () => {
    const headers = 'Date,TotalInspected,Passed,Failed,Review,PassRatePct,CriticalDefects,M03DefectRate\n';
    const rows = chartData.map(d => 
      `${d.date},${d.totalInspected},${d.passedCount},${d.failedCount},${d.reviewCount},${d.passRatePct},${d.criticalDefects},${d.m03DefectRate}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WaferGuard_Production_Yield_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Production Yield & Anomaly Analytics</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Fab-09 Operations
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Semiconductor Quality Trends, Defect Category Pareto Breakdown, Yield Rates & Anomaly Detection
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center bg-[#14141c] border border-[#242430] rounded-lg p-0.5">
            {(['7d', '14d', '30d'] as const).map((r) => (
              <button
                key={r}
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
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#222232] text-white text-xs font-mono font-medium border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">TOTAL INSPECTIONS</span>
          <div className="text-lg font-bold text-white">{totalInspected}</div>
          <span className="text-[9px] text-emerald-400">100% Scan Coverage</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">AVERAGE YIELD</span>
          <div className="text-lg font-bold text-emerald-400">{avgYield}%</div>
          <span className="text-[9px] text-emerald-400">Target: ≥92.0%</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">PASSED WAFERS</span>
          <div className="text-lg font-bold text-white">{totalPassed}</div>
          <span className="text-[9px] text-emerald-400">{((totalPassed / totalInspected) * 100).toFixed(1)}% of total</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">FAILED WAFERS</span>
          <div className="text-lg font-bold text-red-400">{totalFailed}</div>
          <span className="text-[9px] text-red-400">{((totalFailed / totalInspected) * 100).toFixed(1)}% fail rate</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">REVIEW REQUIRED</span>
          <div className="text-lg font-bold text-amber-400">{totalReview}</div>
          <span className="text-[9px] text-amber-400">Pending review</span>
        </div>

        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-[#71717a] uppercase">CRITICAL DEFECTS</span>
          <div className="text-lg font-bold text-red-400">{totalCritical}</div>
          <span className="text-[9px] text-red-400">Requires P0 quarantine</span>
        </div>
      </div>

      {/* Main Charts Grid: Left 30-Day Trend, Right Pareto Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Yield & Defect Trend Over Time (8 cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f26] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Yield & Defect Trends Over Time</span>
                <span className="text-[10px] text-[#71717a]">({timeRange.toUpperCase()} View)</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setSelectedMetric('yield')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedMetric === 'yield' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98]'
                  }`}
                >
                  Yield (%)
                </button>
                <button
                  onClick={() => setSelectedMetric('defects')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedMetric === 'defects' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98]'
                  }`}
                >
                  Defect Count
                </button>
                <button
                  onClick={() => setSelectedMetric('machine_drift')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedMetric === 'machine_drift' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98]'
                  }`}
                >
                  M-03 Anomaly Drift
                </button>
              </div>
            </div>

            {/* Recharts Area / Line Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === 'yield' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[80, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d0d14', borderColor: '#272736', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="passRatePct" name="Pass Rate (%)" stroke="#6366f1" fillOpacity={1} fill="url(#yieldGrad)" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgQualityScore" name="Avg Quality Score" stroke="#10b981" strokeWidth={2} dot={false} />
                  </AreaChart>
                ) : selectedMetric === 'defects' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d0d14', borderColor: '#272736', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="particles" name="Particles" fill="#f97316" stackId="a" />
                    <Bar dataKey="scratches" name="Scratches" fill="#eab308" stackId="a" />
                    <Bar dataKey="cracks" name="Cracks" fill="#ef4444" stackId="a" />
                    <Bar dataKey="patternAnomalies" name="Pattern Anomalies" fill="#a855f7" stackId="a" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2b" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[0, 8]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d0d14', borderColor: '#272736', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="m03DefectRate" name="Machine M-03 Defect Rate (%)" stroke="#ef4444" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="failRatePct" name="Overall Fleet Fail Rate (%)" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Pareto Breakdown by Category (4 cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-3 font-mono text-xs">
          <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="text-white font-bold">Defect Category Breakdown</span>
              <span className="text-[10px] text-[#71717a]">Pareto Dist.</span>
            </div>

            {/* Category Bars */}
            <div className="space-y-2.5">
              {categoryData.map((cat, idx) => {
                const totalAll = categoryData.reduce((a, b) => a + b.count, 0);
                const pct = +((cat.count / totalAll) * 100).toFixed(1);

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

            {/* AI Insights Note */}
            <div className="p-3 rounded-lg bg-[#14141e] border border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Autonomous Trend Finding</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] font-sans leading-relaxed">
                Particles and Cracks account for 68% of recent scrap losses, directly correlating with Machine M-03 thermal drift in Chamber B.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
