import React, { useState } from 'react';
import { SubTask, ToolCallTrace } from '../types';
import { 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  AlertCircle, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Database, 
  Search, 
  FileText, 
  Mail, 
  Calendar 
} from 'lucide-react';

interface Props {
  subTasks: SubTask[];
  traces?: ToolCallTrace[];
  status?: string;
}

export const TaskProgressTimeline: React.FC<Props> = ({ subTasks, traces = [], status }) => {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  if (!subTasks || subTasks.length === 0) return null;

  const getToolIcon = (toolName?: string) => {
    if (!toolName) return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
    if (toolName.includes('search') || toolName.includes('compare')) return <Search className="w-3.5 h-3.5 text-blue-400" />;
    if (toolName.includes('document') || toolName.includes('presentation') || toolName.includes('spreadsheet')) return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    if (toolName.includes('code') || toolName.includes('data')) return <Code className="w-3.5 h-3.5 text-purple-400" />;
    if (toolName.includes('email')) return <Mail className="w-3.5 h-3.5 text-amber-400" />;
    if (toolName.includes('calendar')) return <Calendar className="w-3.5 h-3.5 text-cyan-400" />;
    return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div id="task-progress-timeline" className="bg-[#0d0d10] border border-[#1f1f23] rounded-lg p-3 my-2 text-xs">
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-mono text-[#e0e0e0] font-semibold uppercase tracking-wider text-[10px]">
            Agent Execution Plan ({subTasks.filter(s => s.status === 'completed').length}/{subTasks.length} Done)
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#71717a]">
          Status: <strong className="text-[#e0e0e0] capitalize">{status || 'In Progress'}</strong>
        </span>
      </div>

      <div className="space-y-1.5">
        {subTasks.map((st, idx) => {
          const associatedTrace = traces.find(t => t.id === st.traceId || t.toolName === st.toolName);
          const isExpanded = expandedTraceId === st.id;

          return (
            <div key={st.id || idx} className="rounded-md bg-[#141418] border border-[#1f1f23] p-2.5 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {st.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : st.status === 'running' ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    ) : st.status === 'failed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <CircleDot className="w-3.5 h-3.5 text-[#52525b]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[#e0e0e0] text-xs">{st.title}</span>
                      {st.toolName && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] bg-[#0d0d10] text-indigo-300 px-1.5 py-0.2 rounded border border-[#27272a]">
                          {getToolIcon(st.toolName)}
                          {st.toolName}
                        </span>
                      )}
                    </div>
                    {st.description && (
                      <p className="text-[#8e8e93] text-[11px] mt-0.5 leading-normal">{st.description}</p>
                    )}
                    {st.resultSummary && (
                      <p className="text-emerald-400/90 font-mono text-[10px] mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {st.resultSummary}
                      </p>
                    )}
                  </div>
                </div>

                {associatedTrace && (
                  <button
                    onClick={() => setExpandedTraceId(isExpanded ? null : st.id)}
                    className="p-1 text-[#71717a] hover:text-[#e0e0e0] hover:bg-[#1a1a20] rounded transition shrink-0 cursor-pointer"
                    title="Toggle tool input/output logs"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Collapsible Tool Call Log */}
              {isExpanded && associatedTrace && (
                <div className="mt-2.5 pt-2.5 border-t border-[#1f1f23] text-[10px] font-mono space-y-1.5 bg-[#0a0a0c] rounded p-2.5">
                  <div className="text-indigo-300 font-semibold flex items-center justify-between">
                    <span>Tool Trace Log: {associatedTrace.toolName}</span>
                    {associatedTrace.durationMs && (
                      <span className="text-[#71717a] font-normal">{associatedTrace.durationMs}ms</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#71717a] block mb-0.5">Input Parameters:</span>
                    <pre className="p-1.5 rounded bg-[#141418] text-[#d4d4d8] overflow-x-auto text-[9px] border border-[#1f1f23]">
                      {JSON.stringify(associatedTrace.input, null, 2)}
                    </pre>
                  </div>

                  {associatedTrace.output && (
                    <div>
                      <span className="text-[#71717a] block mb-0.5">Execution Output:</span>
                      <pre className="p-1.5 rounded bg-[#141418] text-emerald-300 overflow-x-auto text-[9px] border border-[#1f1f23]">
                        {JSON.stringify(associatedTrace.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {associatedTrace.error && (
                    <div className="text-red-400">
                      <span>Error: {associatedTrace.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
