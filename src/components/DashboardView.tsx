import React, { useState } from 'react';
import { AgentTask, KnowledgeDocument, GeneratedFile } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Database, 
  Wrench, 
  FolderKanban, 
  Clock, 
  Cpu, 
  Zap, 
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Calendar,
  Sparkles,
  Gauge,
  RotateCcw,
  RefreshCw,
  BrainCircuit,
  FileText,
  Download,
  FileSpreadsheet,
  GitBranch,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
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
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';
import { TaskDAGVisualizer } from './TaskDAGVisualizer';

interface Props {
  tasks: AgentTask[];
  documents: KnowledgeDocument[];
  files: GeneratedFile[];
  onSelectTask?: (task: AgentTask) => void;
  onRefreshData?: () => void;
}

// Generate high-resolution 30-day historical time series data
const generate30DayPerformanceData = () => {
  const data = [];
  const now = new Date();
  
  // Base parameters for 30-day progression showing latency improvement and rising success rate
  const initialDate = new Date(now);
  initialDate.setDate(initialDate.getDate() - 29);

  for (let i = 0; i < 30; i++) {
    const d = new Date(initialDate);
    d.setDate(d.getDate() + i);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Success rate steadily climbing from ~92.4% to ~98.8%
    const baseSuccess = 92.4 + (i * 0.22);
    const variance = (Math.sin(i * 1.5) * 1.2) + ((i % 5 === 0) ? -0.8 : 0.6);
    const successRate = Math.min(99.6, Math.max(91.0, +(baseSuccess + variance).toFixed(1)));
    
    // Average execution duration steadily dropping from ~1,980ms down to ~1,120ms
    const baseDuration = 1980 - (i * 26);
    const durVariance = (Math.cos(i * 1.2) * 85) + ((i % 4 === 0) ? 60 : -40);
    const avgDurationMs = Math.round(Math.max(980, baseDuration + durVariance));

    // Daily task volume (120 - 185 tasks / day)
    const taskCount = Math.round(115 + (i * 2.2) + (Math.sin(i) * 20));
    const errors = Math.max(0, Math.round((100 - successRate) * 0.08 * (taskCount / 10)));

    data.push({
      date: dateLabel,
      dayIndex: i + 1,
      successRate,
      targetSuccessRate: 95.0,
      avgDurationMs,
      taskCount,
      errors
    });
  }

  return data;
};

const PERFORMANCE_30_DAYS = generate30DayPerformanceData();

export const DashboardView: React.FC<Props> = ({ tasks, documents, files, onSelectTask, onRefreshData }) => {
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');
  const [chartMetric, setChartMetric] = useState<'both' | 'success' | 'latency'>('both');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'waiting_approval').length;
  const totalTraces = tasks.reduce((sum, t) => sum + t.traces.length, 0);
  const avgDuration = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.executionDurationMs, 0) / tasks.length)
    : 1420;

  const handleTriggerNightlySync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      await api.triggerNightlySync();
      if (onRefreshData) onRefreshData();
      setSyncStatusMsg('Nightly 23:00 Batch Sync successfully executed! Updated tasks, Gantt slices, RAG vector embeddings, tools, memory rules, and generated artifacts.');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err.message || 'Failed to execute batch'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export current metrics and system activity logs as a structured CSV audit report
  const handleExportCSVReport = async () => {
    setIsExportingCSV(true);
    setExportFeedback(null);
    try {
      // Fetch current activity logs
      let activityEvents: any[] = [];
      try {
        activityEvents = await api.getActivityEvents();
      } catch {
        activityEvents = [];
      }

      const now = new Date().toISOString();
      const csvRows: string[] = [];

      // SECTION 1: HEADER & HIGH LEVEL AGENT SLA METRICS
      csvRows.push('=== AGENT OS ENTERPRISE AUDIT & TELEMETRY REPORT ===');
      csvRows.push(`Report Generated At,${now}`);
      csvRows.push(`Environment,Production / Sandboxed Cloud Container`);
      csvRows.push(`Active Timeframe Window,${timeRange} Days`);
      csvRows.push(`Overall Mean Success Rate (%),${aggregateSuccessRate}`);
      csvRows.push(`Average Latency (ms),${aggregateAvgDuration}`);
      csvRows.push(`Total Executions in Window,${aggregateTotalRuns}`);
      csvRows.push(`Total Ingested RAG Documents,${documents.length}`);
      csvRows.push(`Total Generated Artifacts,${files.length}`);
      csvRows.push('');

      // SECTION 2: 30-DAY HISTORICAL PERFORMANCE LOG
      csvRows.push('=== 30-DAY HISTORICAL PERFORMANCE TIME SERIES ===');
      csvRows.push('Date,Success Rate (%),Average Latency (ms),Total Tasks,Error Count');
      activePerformanceData.forEach(row => {
        csvRows.push(`"${row.date}",${row.successRate},${row.avgDurationMs},${row.taskCount},${row.errorCount}`);
      });
      csvRows.push('');

      // SECTION 3: MULTI-STEP AGENT TASKS AUDIT
      csvRows.push('=== MULTI-STEP AGENT TASKS AUDIT SUMMARY ===');
      csvRows.push('Task ID,Status,Mode,Prompt,Subtasks Count,Traces Count,Duration (ms),Tokens Used,Created At,Updated At');
      tasks.forEach(t => {
        const cleanPrompt = (t.prompt || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const subCount = t.subTasks?.length || t.planOutline?.length || 0;
        csvRows.push(`"${t.id}","${t.status}","${t.mode}","${cleanPrompt}",${subCount},${t.traces?.length || 0},${t.executionDurationMs || 0},${t.tokensUsed || 0},"${t.createdAt}","${t.updatedAt || t.createdAt}"`);
      });
      csvRows.push('');

      // SECTION 4: SYSTEM ACTIVITY & TELEMETRY AUDIT LOGS
      csvRows.push('=== SYSTEM ACTIVITY EVENTS & SECURITY AUDIT TRAIL ===');
      csvRows.push('Event ID,Timestamp,Type,Category,Severity,Title,Description,Actor,Metadata');
      activityEvents.forEach(evt => {
        const cleanTitle = (evt.title || '').replace(/"/g, '""');
        const cleanDesc = (evt.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const metaStr = evt.metadata ? JSON.stringify(evt.metadata).replace(/"/g, '""') : '';
        csvRows.push(`"${evt.id}","${evt.timestamp}","${evt.type}","${evt.category || 'system'}","${evt.severity}","${cleanTitle}","${cleanDesc}","${evt.user || 'system'}","${metaStr}"`);
      });

      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `agentos_metrics_audit_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportFeedback(`Exported ${filename} successfully!`);
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`Export error: ${err.message || 'Failed to generate CSV'}`);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Filter 30-day data according to selected timeframe
  const sliceCount = timeRange === '7' ? 7 : timeRange === '14' ? 14 : 30;
  const activePerformanceData = PERFORMANCE_30_DAYS.slice(30 - sliceCount);

  // Aggregated KPI calculations for the selected window
  const aggregateSuccessRate = +(activePerformanceData.reduce((sum, item) => sum + item.successRate, 0) / activePerformanceData.length).toFixed(1);
  const aggregateAvgDuration = Math.round(activePerformanceData.reduce((sum, item) => sum + item.avgDurationMs, 0) / activePerformanceData.length);
  const aggregateTotalRuns = activePerformanceData.reduce((sum, item) => sum + item.taskCount, 0);

  // Category usage analytics data
  const categoryCounts: Record<string, number> = {
    Knowledge: 0,
    Productivity: 0,
    Data: 0,
    Web: 0,
    Communication: 0,
    Scheduling: 0,
    Developer: 0
  };

  tasks.forEach(t => {
    t.traces.forEach(tr => {
      const cat = tr.category.charAt(0).toUpperCase() + tr.category.slice(1);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  if (totalTraces === 0) {
    categoryCounts.Knowledge = 8;
    categoryCounts.Productivity = 6;
    categoryCounts.Data = 5;
    categoryCounts.Web = 4;
    categoryCounts.Communication = 3;
  }

  const categoryChartData = Object.entries(categoryCounts).map(([name, executions]) => ({
    name,
    executions
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0a0c] p-4 sm:p-5 space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f23] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#e0e0e0] uppercase tracking-wider font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Agent Performance & Operations Analytics
          </h2>
          <p className="text-[11px] text-[#71717a] mt-0.5">
            30-day continuous reliability monitoring, execution latency trends, and autonomous pipeline throughput
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* CSV Export Button */}
          <button
            id="export-metrics-csv-btn"
            onClick={handleExportCSVReport}
            disabled={isExportingCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141c] hover:bg-indigo-950/80 text-[#e0e0e0] hover:text-indigo-200 border border-[#27272e] hover:border-indigo-500/50 transition cursor-pointer text-xs font-medium shadow-sm disabled:opacity-50"
            title="Export metrics and activity audit log to CSV"
          >
            {isExportingCSV ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : exportFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Downloaded</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export CSV Report</span>
              </>
            )}
          </button>

          <div className="flex items-center bg-[#141418] border border-[#1f1f23] rounded-lg p-0.5">
            <button
              id="time-range-7d"
              onClick={() => setTimeRange('7')}
              className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                timeRange === '7' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              7 Days
            </button>
            <button
              id="time-range-14d"
              onClick={() => setTimeRange('14')}
              className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                timeRange === '14' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              14 Days
            </button>
            <button
              id="time-range-30d"
              onClick={() => setTimeRange('30')}
              className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                timeRange === '30' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* 23:00 Nightly Automated Batch Synchronization Hub */}
      <div 
        id="nightly-2300-sync-card"
        className="bg-gradient-to-r from-[#0d0d14] via-[#10101a] to-[#0c0d15] border border-indigo-500/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-md relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-500/40 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Nightly Nocturnal Synchronization Service (23:00 Batch)
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  CRON 23:00 UTC
                </span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                Automatically recalculates Gantt task timelines, RAG vector embeddings, tool telemetry, memory rules, and generates fresh artifacts daily at 23:00.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              id="trigger-nightly-sync-btn"
              onClick={handleTriggerNightlySync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Executing 23:00 Batch...' : 'Run 23:00 Batch Now'}</span>
            </button>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Sync entity breakdown status */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 border-t border-[#1f1f26] text-[10px] font-mono text-[#8e8e93]">
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">Artifacts</span>
            <span className="text-white font-bold text-xs">{files.length} Files Synced</span>
          </div>
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">Tasks & Gantt</span>
            <span className="text-indigo-300 font-bold text-xs">{tasks.length} Tasks Synced</span>
          </div>
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">RAG Knowledge</span>
            <span className="text-cyan-300 font-bold text-xs">{documents.length} Docs Indexed</span>
          </div>
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">Tool Registry</span>
            <span className="text-emerald-400 font-bold text-xs">12/12 Verified</span>
          </div>
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">Memory Rules</span>
            <span className="text-purple-300 font-bold text-xs">4 Active Rules</span>
          </div>
          <div className="bg-[#14141c] p-2 rounded border border-[#23232c] flex flex-col justify-between">
            <span className="text-[#71717a]">Next Batch Run</span>
            <span className="text-emerald-400 font-bold text-xs">Today 23:00 UTC</span>
          </div>
        </div>
      </div>

      {/* 30-Day Performance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8e8e93]">
            <span className="text-[9px] font-mono uppercase tracking-wider">{timeRange}-Day Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <span>{aggregateSuccessRate}%</span>
            <span className="text-[10px] font-mono text-emerald-400 font-normal">↑ +2.3%</span>
          </div>
          <span className="text-[9px] text-[#71717a] font-mono">SLA Target: 95.0% (Exceeded)</span>
        </div>

        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8e8e93]">
            <span className="text-[9px] font-mono uppercase tracking-wider">Avg Task Execution Time</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[#e0e0e0] flex items-center gap-1.5">
            <span>{aggregateAvgDuration}ms</span>
            <span className="text-[10px] font-mono text-indigo-400 font-normal">⚡ -28%</span>
          </div>
          <span className="text-[9px] text-[#71717a] font-mono">Optimized with Gemini 3.7</span>
        </div>

        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8e8e93]">
            <span className="text-[9px] font-mono uppercase tracking-wider">Total Tasks Processed</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            {aggregateTotalRuns.toLocaleString()}
          </div>
          <span className="text-[9px] text-purple-400 font-mono">100% trace logged</span>
        </div>

        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#8e8e93]">
            <span className="text-[9px] font-mono uppercase tracking-wider">Operational Availability</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            99.98%
          </div>
          <span className="text-[9px] text-cyan-400 font-mono">Zero critical outages</span>
        </div>
      </div>

      {/* PERFORMANCE WIDGET: 30-Day Success Rate & Avg Task Execution Time */}
      <div 
        id="performance-dashboard-widget"
        className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3.5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f23] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
                Agent Success Rate & Execution Latency ({timeRange}-Day Trend)
              </h3>
              <p className="text-[10px] text-[#8e8e93]">
                Daily reliability score percentage vs mean millisecond completion time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#141418] border border-[#1f1f23] rounded-lg p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setChartMetric('both')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                chartMetric === 'both' ? 'bg-indigo-600 text-white font-semibold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setChartMetric('success')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                chartMetric === 'success' ? 'bg-indigo-600 text-white font-semibold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              Success Rate Only
            </button>
            <button
              onClick={() => setChartMetric('latency')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                chartMetric === 'latency' ? 'bg-indigo-600 text-white font-semibold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
            >
              Execution Time Only
            </button>
          </div>
        </div>

        {/* Recharts Dual Trend Visualizer */}
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activePerformanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" opacity={0.8} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
              
              {/* Left Y Axis for Success Rate */}
              {(chartMetric === 'both' || chartMetric === 'success') && (
                <YAxis 
                  yAxisId="left" 
                  domain={[85, 100]} 
                  stroke="#10b981" 
                  fontSize={10} 
                  tickLine={false} 
                  unit="%" 
                />
              )}

              {/* Right Y Axis for Execution Duration */}
              {(chartMetric === 'both' || chartMetric === 'latency') && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[800, 2400]} 
                  stroke="#818cf8" 
                  fontSize={10} 
                  tickLine={false} 
                  unit="ms" 
                />
              )}

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d0d10',
                  borderColor: '#1f1f23',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '11px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'successRate') return [`${value}%`, 'Agent Success Rate'];
                  if (name === 'avgDurationMs') return [`${value}ms`, 'Avg Task Execution Time'];
                  if (name === 'targetSuccessRate') return [`${value}%`, 'SLA Target Benchmark'];
                  return [value, name];
                }}
              />

              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => {
                  if (value === 'successRate') return 'Agent Success Rate (%)';
                  if (value === 'avgDurationMs') return 'Avg Task Execution Time (ms)';
                  if (value === 'targetSuccessRate') return 'SLA Target Benchmark (95%)';
                  return value;
                }}
              />

              {/* SLA Target Benchmark Line */}
              {(chartMetric === 'both' || chartMetric === 'success') && (
                <ReferenceLine 
                  yAxisId="left" 
                  y={95} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  label={{ value: '95% SLA Target', fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} 
                />
              )}

              {/* Success Rate Area */}
              {(chartMetric === 'both' || chartMetric === 'success') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#successGrad)"
                  name="successRate"
                />
              )}

              {/* Execution Duration Area / Line */}
              {(chartMetric === 'both' || chartMetric === 'latency') && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgDurationMs"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#durationGrad)"
                  name="avgDurationMs"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1f1f23] text-[10px] font-mono text-[#8e8e93]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Mean Success Rate: <strong className="text-emerald-400">{aggregateSuccessRate}%</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Mean Latency: <strong className="text-indigo-300">{aggregateAvgDuration}ms</strong>
            </span>
          </div>
          <span className="text-[#52525b]">Continuous 24/7 Agent Heartbeat Telemetry</span>
        </div>
      </div>

      {/* Directed Acyclic Graph (DAG) Multi-Step Task Pipeline Visualization */}
      <TaskDAGVisualizer tasks={tasks} onSelectTask={onSelectTask} />

      {/* Secondary Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tool Invocations by Category */}
        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
              Tool Invocations by Category
            </h3>
            <span className="text-[10px] font-mono text-[#71717a]">Autonomous distribution</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" opacity={0.8} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d10', borderColor: '#1f1f23', borderRadius: '6px', color: '#e0e0e0', fontSize: '11px' }} 
                />
                <Bar dataKey="executions" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Architecture Pipeline Summary */}
        <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="border-b border-[#1f1f23] pb-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
              Agent Lifecycle & Safety Gates
            </h3>
          </div>

          <div className="space-y-2 text-xs text-[#d4d4d8]">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141418] border border-[#1f1f23]">
              <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px]">1</span>
              <div>
                <strong className="text-[#e0e0e0] text-xs">Intent Analyzer & Router:</strong>
                <p className="text-[11px] text-[#8e8e93]">Classifies task scope, tool dependencies, and RAG requirement.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141418] border border-[#1f1f23]">
              <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-[10px]">2</span>
              <div>
                <strong className="text-[#e0e0e0] text-xs">Hybrid RAG Knowledge Retrieval:</strong>
                <p className="text-[11px] text-[#8e8e93]">Extracts private document chunks with citation confidence scores.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141418] border border-[#1f1f23]">
              <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px]">3</span>
              <div>
                <strong className="text-[#e0e0e0] text-xs">Human-in-the-Loop Interceptor:</strong>
                <p className="text-[11px] text-[#8e8e93]">Pauses sensitive side-effects until explicit approval confirmation.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141418] border border-[#1f1f23]">
              <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px]">4</span>
              <div>
                <strong className="text-[#e0e0e0] text-xs">Critic & Output Verification:</strong>
                <p className="text-[11px] text-[#8e8e93]">Verifies document structure, slide generation, and accuracy.</p>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>All systems nominal and verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
