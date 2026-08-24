import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatMessage, 
  ToolCallTrace, 
  SubTask, 
  Citation, 
  WaferInspectionRecord, 
  MachineHealthRecord, 
  HistoricalInspectionCase, 
  KnowledgeDocument 
} from '../types';
import { 
  Sparkles, 
  Send, 
  Cpu, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Layers, 
  Search, 
  FileText, 
  Activity, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  RefreshCw,
  Zap,
  BookOpen
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
  currentInspection: WaferInspectionRecord;
  machines: MachineHealthRecord[];
  historicalCases: HistoricalInspectionCase[];
  documents: KnowledgeDocument[];
  onNavigateTab: (tab: any) => void;
}

export const QualityCopilotView: React.FC<Props> = ({
  messages,
  onSendMessage,
  isProcessing,
  currentInspection,
  machines,
  historicalCases,
  documents,
  onNavigateTab
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedTraceIds, setExpandedTraceIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const toggleTraceExpand = (traceId: string) => {
    setExpandedTraceIds(prev => {
      const next = new Set(prev);
      if (next.has(traceId)) next.delete(traceId);
      else next.add(traceId);
      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const quickPrompts = [
    `Run root-cause analysis on Wafer ${currentInspection.waferId} and inspect Machine ${currentInspection.machineId} Chamber B telemetry.`,
    `Search historical cases matching Edge Crack defects on Machine M-03.`,
    `Query SEMI E10 compliance rules for zero-tolerance critical wafer fractures.`,
    `Analyze 30-day yield trend and recommend corrective actions for Chamber B.`
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07070a] p-3 sm:p-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Industrial Quality Engineer Autonomous Copilot</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Tool Orchestrator
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Multi-Step Autonomous Agent executing CV inspections, RAG queries, RCA synthesis & tool diagnostics
          </p>
        </div>

        {/* Current Active Context */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#8e8e98] bg-[#121218] border border-[#23232c] px-2.5 py-1 rounded-lg">
          <span>Active Wafer: <strong className="text-white">{currentInspection.waferId}</strong></span>
          <span>•</span>
          <span>Tool: <strong className="text-indigo-300">{currentInspection.machineId}</strong></span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
        {messages.map((msg) => {
          const isAgent = msg.role === 'agent';
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717a]">
                <span className={`font-bold ${isAgent ? 'text-indigo-400' : 'text-cyan-400'}`}>
                  {isAgent ? 'Autonomous Quality Copilot' : 'Quality Engineer (You)'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body Box */}
              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-[#0c0c12] border border-[#1f1f2a] text-[#e0e0e8] shadow-xl'
                }`}
              >
                {/* Markdown text rendering */}
                <div className="markdown-body font-sans text-xs prose-invert">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </Markdown>
                </div>

                {/* SubTasks Plan Breakdown */}
                {msg.subTasks && msg.subTasks.length > 0 && (
                  <div className="bg-[#12121c] border border-[#222232] rounded-xl p-3 space-y-2 font-mono text-xs">
                    <div className="text-indigo-300 font-bold text-[11px] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sub-Task Execution Plan</span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.subTasks.map((st) => (
                        <div key={st.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-[#0a0a0f] border border-white/5 text-[11px]">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="font-semibold text-white truncate">{st.title}</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold uppercase shrink-0">
                            {st.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool Execution Traces Panel */}
                {msg.traces && msg.traces.length > 0 && (
                  <div className="bg-[#101018] border border-[#222230] rounded-xl p-3 space-y-2 font-mono text-xs">
                    <div className="text-[#8e8e98] font-bold text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-indigo-300">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Autonomous Tool Invocations ({msg.traces.length})</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.traces.map((trace) => {
                        const isExpanded = expandedTraceIds.has(trace.id);

                        return (
                          <div key={trace.id} className="p-2 rounded-lg bg-[#0a0a0f] border border-[#1f1f2a] space-y-1">
                            <div 
                              onClick={() => toggleTraceExpand(trace.id)}
                              className="flex items-center justify-between cursor-pointer hover:text-white transition"
                            >
                              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                                <Wrench className="w-3 h-3 text-indigo-400" />
                                <span>{trace.toolName}()</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-400 font-bold">
                                  {trace.status} ({trace.durationMs || 120}ms)
                                </span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-[#71717a]" /> : <ChevronDown className="w-3 h-3 text-[#71717a]" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[10px]">
                                <div>
                                  <span className="text-[#71717a] block">Input:</span>
                                  <pre className="bg-[#050508] p-2 rounded text-[#a1a1aa] overflow-x-auto">
                                    {JSON.stringify(trace.input, null, 2)}
                                  </pre>
                                </div>
                                {trace.output && (
                                  <div>
                                    <span className="text-[#71717a] block">Output:</span>
                                    <pre className="bg-[#050508] p-2 rounded text-emerald-300 overflow-x-auto">
                                      {JSON.stringify(trace.output, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grounded Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="bg-[#101018] border border-[#222230] rounded-xl p-3 space-y-2 font-mono text-xs">
                    <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>RAG Knowledge Citations</span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.citations.map((c) => (
                        <div key={c.id} className="p-2 rounded bg-[#0a0a0f] border border-white/5 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-indigo-300 font-semibold">
                            <span>{c.documentTitle}</span>
                            <span className="text-[9px] text-[#71717a]">{c.section}</span>
                          </div>
                          <p className="text-[10px] text-[#a1a1aa] italic font-sans">
                            "{c.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0c0c12] border border-indigo-500/30 max-w-md text-xs font-mono text-indigo-300 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Autonomous agent executing reasoning, tool calls & RAG retrieval...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Strip */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
        {quickPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => onSendMessage(prompt)}
            className="px-2.5 py-1 rounded-lg bg-[#12121a] hover:bg-[#1a1a24] text-[#8e8e98] hover:text-white border border-[#22222e] transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="pt-2 border-t border-[#1f1f26] flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask Quality Copilot (e.g. 'Correlate M-03 Chamber B temperature drift with Lot 9921')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isProcessing}
          className="flex-1 bg-[#0c0c12] border border-[#242434] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-indigo-500 font-mono"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Execute</span>
        </button>
      </form>
    </div>
  );
};
