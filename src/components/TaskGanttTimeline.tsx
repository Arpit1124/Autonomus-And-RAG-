import React, { useState } from 'react';
import { AgentTask, SubTask, ToolCallTrace } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  Zap, 
  AlertCircle, 
  Layers, 
  Wrench, 
  ArrowRight, 
  GitCommit, 
  Sparkles,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

interface Props {
  task: AgentTask;
  onSelectSubTask?: (subTask: SubTask, trace?: ToolCallTrace) => void;
}

interface GanttBarData {
  subTask: SubTask;
  index: number;
  trace?: ToolCallTrace;
  startOffsetMs: number;
  durationMs: number;
  endOffsetMs: number;
  dependencyIndex: number | null;
  status: 'completed' | 'running' | 'waiting_approval' | 'pending' | 'failed';
  category: string;
}

export const TaskGanttTimeline: React.FC<Props> = ({ task, onSelectSubTask }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  const totalDuration = Math.max(task.executionDurationMs || 1200, 1000);
  const subTasks = task.subTasks || [];

  // Calculate Gantt item offsets and durations
  let accumulatedTime = 0;
  const ganttItems: GanttBarData[] = subTasks.map((st, idx) => {
    const trace = task.traces?.find(t => t.id === st.traceId || t.toolName === st.toolName);
    const traceDuration = trace?.durationMs || Math.round(totalDuration / Math.max(subTasks.length, 1));
    const startOffsetMs = accumulatedTime;
    const durationMs = Math.max(traceDuration, 150);
    accumulatedTime += durationMs;

    return {
      subTask: st,
      index: idx,
      trace,
      startOffsetMs,
      durationMs,
      endOffsetMs: startOffsetMs + durationMs,
      dependencyIndex: idx > 0 ? idx - 1 : null,
      status: (st.status === 'completed' || st.status === 'running' || st.status === 'pending' || st.status === 'failed')
        ? st.status
        : 'pending',
      category: trace?.category || 'productivity'
    };
  });

  const timelineMax = Math.max(accumulatedTime, totalDuration, 1000);

  // Time grid markers (5 columns)
  const timeMarkers = [
    0,
    Math.round(timelineMax * 0.25),
    Math.round(timelineMax * 0.5),
    Math.round(timelineMax * 0.75),
    timelineMax
  ];

  const getCategoryColor = (cat: string, status: string) => {
    if (status === 'running') return 'from-indigo-500 to-purple-500 animate-pulse';
    if (status === 'waiting_approval') return 'from-amber-500 to-orange-500';
    if (status === 'failed') return 'from-red-600 to-red-500';

    switch (cat) {
      case 'knowledge':
        return 'from-blue-600 to-indigo-600';
      case 'data':
        return 'from-cyan-600 to-teal-600';
      case 'web':
        return 'from-emerald-600 to-teal-600';
      case 'communication':
        return 'from-purple-600 to-pink-600';
      case 'developer':
        return 'from-amber-600 to-orange-600';
      default:
        return 'from-indigo-600 to-blue-600';
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'knowledge':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/30';
      case 'data':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30';
      case 'web':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
      case 'communication':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/30';
      case 'developer':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div 
      id="task-gantt-container"
      className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3.5 shadow-sm"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f23] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
                Autonomous Task Gantt Timeline
              </h3>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
                {subTasks.length} Steps
              </span>
            </div>
            <p className="text-[10px] text-[#8e8e93]">
              Execution window, subtask durations, stage dependencies & critical path
            </p>
          </div>
        </div>

        {/* Legend / Toggles */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button
            onClick={() => setShowCriticalPath(!showCriticalPath)}
            className={`px-2 py-1 rounded border transition cursor-pointer flex items-center gap-1 ${
              showCriticalPath
                ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                : 'bg-[#141418] text-[#71717a] border-[#1f1f23]'
            }`}
          >
            <GitCommit className="w-3 h-3" />
            <span>{showCriticalPath ? 'Critical Path (Active)' : 'Show Dependencies'}</span>
          </button>
          
          <div className="hidden md:flex items-center gap-1 bg-[#141418] border border-[#1f1f23] px-2 py-1 rounded text-[#8e8e93]">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Total: {timelineMax}ms</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Stage Canvas */}
      <div className="space-y-2">
        {/* Time Axis Ruler */}
        <div className="grid grid-cols-12 gap-2 text-[9px] font-mono text-[#71717a] pb-1 border-b border-[#18181c]">
          <div className="col-span-4 sm:col-span-3 uppercase tracking-wider pl-1">
            Subtask / Stage
          </div>
          <div className="col-span-8 sm:col-span-9 relative flex justify-between pr-1">
            {timeMarkers.map((time, idx) => (
              <span key={idx} className="flex flex-col items-center">
                <span>{time}ms</span>
                <span className="w-px h-1.5 bg-[#27272a] mt-0.5" />
              </span>
            ))}
          </div>
        </div>

        {/* Gantt Task Rows */}
        <div className="space-y-2 relative">
          {/* Vertical grid lines */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
            <div className="col-span-4 sm:col-span-3" />
            <div className="col-span-8 sm:col-span-9 grid grid-cols-4 divide-x divide-[#27272a] h-full" />
          </div>

          {ganttItems.map((item, idx) => {
            const startPct = Math.max(0, Math.min(95, (item.startOffsetMs / timelineMax) * 100));
            const widthPct = Math.max(4, Math.min(100 - startPct, (item.durationMs / timelineMax) * 100));
            const isHovered = hoveredIndex === idx;
            const isSelected = selectedSubTaskId === item.subTask.id;

            return (
              <div
                key={item.subTask.id || idx}
                id={`gantt-row-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  setSelectedSubTaskId(item.subTask.id);
                  if (onSelectSubTask) onSelectSubTask(item.subTask, item.trace);
                }}
                className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : isHovered
                    ? 'bg-[#141418] border-[#27272a]'
                    : 'bg-[#101014] border-transparent'
                }`}
              >
                {/* Left Label */}
                <div className="col-span-4 sm:col-span-3 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#18181c] border border-[#27272a] text-indigo-400 font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-[#e0e0e0] font-medium truncate">
                      {item.subTask.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 pl-5">
                    <span className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded border ${getCategoryBadgeColor(item.category)}`}>
                      {item.trace?.toolName || item.subTask.toolName || item.category}
                    </span>
                    {item.dependencyIndex !== null && showCriticalPath && (
                      <span className="text-[8px] font-mono text-[#71717a] flex items-center gap-0.5">
                        <ArrowRight className="w-2.5 h-2.5 text-amber-400/70" />
                        <span>#{item.dependencyIndex + 1}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Timeline Bar */}
                <div className="col-span-8 sm:col-span-9 relative h-7 bg-[#141418] rounded-md border border-[#1f1f23] overflow-hidden flex items-center px-1">
                  {/* Subtle Grid ticks */}
                  <div className="absolute inset-0 grid grid-cols-4 divide-x divide-[#1f1f23] pointer-events-none opacity-40" />

                  {/* The Gantt Bar */}
                  <div
                    className={`absolute top-1 bottom-1 rounded shadow-sm bg-gradient-to-r ${getCategoryColor(
                      item.category,
                      item.status
                    )} flex items-center justify-between px-2 text-white transition-all duration-200 group`}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      minWidth: '48px'
                    }}
                  >
                    <span className="text-[9px] font-mono font-bold truncate drop-shadow-sm flex items-center gap-1">
                      {item.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                      {item.status === 'running' && <Zap className="w-2.5 h-2.5 shrink-0 animate-bounce" />}
                      <span className="hidden sm:inline">{item.durationMs}ms</span>
                    </span>

                    <span className="text-[8px] font-mono uppercase opacity-90 truncate ml-1">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Step Inspector Card */}
      {selectedSubTaskId && (
        <div className="p-3 rounded-lg bg-[#141418] border border-[#1f1f23] space-y-2 animate-in fade-in duration-150">
          {(() => {
            const selectedItem = ganttItems.find(g => g.subTask.id === selectedSubTaskId);
            if (!selectedItem) return null;
            return (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold text-xs">
                      Step #{selectedItem.index + 1}: {selectedItem.subTask.title}
                    </span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(selectedItem.category)}`}>
                      {selectedItem.trace?.toolName || selectedItem.subTask.toolName || 'autonomous_step'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8e8e93]">
                    Window: {selectedItem.startOffsetMs}ms – {selectedItem.endOffsetMs}ms ({selectedItem.durationMs}ms)
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8e93] leading-relaxed">
                  {selectedItem.subTask.description}
                </p>

                {selectedItem.trace && (
                  <div className="pt-1.5 border-t border-[#1f1f23] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-[#71717a] block text-[9px]">TOOL INPUT:</span>
                      <pre className="p-1.5 rounded bg-[#0a0a0c] text-[#d4d4d8] border border-[#1f1f23] overflow-x-auto text-[9px] max-h-20">
                        {JSON.stringify(selectedItem.trace.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[#71717a] block text-[9px]">RESULT ARTIFACT:</span>
                      <pre className="p-1.5 rounded bg-[#0a0a0c] text-emerald-300 border border-[#1f1f23] overflow-x-auto text-[9px] max-h-20">
                        {JSON.stringify(selectedItem.trace.output || { status: 'success' }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1f1f23] text-xs font-mono">
        <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
          <span className="text-[#71717a] block text-[9px]">TOTAL EXECUTION SPAN</span>
          <span className="font-semibold text-emerald-300 text-[11px]">{timelineMax}ms</span>
        </div>
        <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
          <span className="text-[#71717a] block text-[9px]">SUBTASK STEPS</span>
          <span className="font-semibold text-indigo-300 text-[11px]">{subTasks.length} stages</span>
        </div>
        <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
          <span className="text-[#71717a] block text-[9px]">CRITICAL PATH</span>
          <span className="font-semibold text-amber-300 text-[11px]">Sequential Plan</span>
        </div>
        <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
          <span className="text-[#71717a] block text-[9px]">PARALLELISM RATIO</span>
          <span className="font-semibold text-purple-300 text-[11px]">1.0x Synchronized</span>
        </div>
      </div>
    </div>
  );
};
