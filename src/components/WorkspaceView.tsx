import React, { useState, useRef, useEffect } from 'react';
import { AutonomousAgentLogo } from './AutonomousAgentLogo';
import { 
  ChatMessage, 
  AgentMode, 
  AgentTask, 
  Citation, 
  GeneratedFile, 
  SensitiveApprovalRequest 
} from '../types';
import { TaskProgressTimeline } from './TaskProgressTimeline';
import { DataChartRenderer } from './DataChartRenderer';
import { VoiceInputButton } from './VoiceInputButton';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  FileCode, 
  BookmarkCheck, 
  ShieldAlert, 
  ArrowRight, 
  Paperclip, 
  CornerDownLeft, 
  Download, 
  Eye, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Mic
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';

interface Props {
  messages: ChatMessage[];
  mode: AgentMode;
  isProcessing: boolean;
  onSendMessage: (prompt: string) => void;
  onOpenCitation: (citation: Citation) => void;
  onOpenFile: (file: GeneratedFile) => void;
  onApproveAction: (taskId: string, modifiedInput?: Record<string, any>) => void;
  onRejectAction: (taskId: string) => void;
}

const KILLER_PROMPTS = [
  {
    title: 'Analyze PDF & Create Presentation',
    prompt: 'Read the Q4 Financial Report PDF and generate a 6-slide executive presentation deck summarizing key metrics and growth targets.',
    icon: Presentation,
    tag: 'RAG + Slides'
  },
  {
    title: 'Analyze Churn CSV & Render Chart',
    prompt: 'Analyze the Customer Churn Survey CSV dataset, compute NPS and risk breakdown, and render a visual bar chart with recommendations.',
    icon: FileSpreadsheet,
    tag: 'Data + Chart'
  },
  {
    title: 'Executive Briefing & Sensitive Email',
    prompt: 'Synthesize the Q4 SaaS strategy into an executive update and prepare an email to stakeholders@enterprise.io (requires confirmation before dispatch).',
    icon: ShieldAlert,
    tag: 'Plan + Approval'
  },
  {
    title: 'Architecture Spec & Code Generator',
    prompt: 'Search the agent architecture specification document and generate a production TypeScript implementation of the Dynamic Tool Router.',
    icon: FileCode,
    tag: 'RAG + Code'
  }
];

export const WorkspaceView: React.FC<Props> = ({
  messages,
  mode,
  isProcessing,
  onSendMessage,
  onOpenCitation,
  onOpenFile,
  onApproveAction,
  onRejectAction
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isProcessing) return;
    const promptToSend = inputPrompt.trim();
    setInputPrompt('');
    onSendMessage(promptToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputPrompt(prompt);
    textareaRef.current?.focus();
  };

  const handleVoiceTranscript = (transcriptText: string, autoSubmit: boolean = false) => {
    setInputPrompt(prev => {
      const cleanPrev = prev.trim();
      const updated = cleanPrev ? `${cleanPrev} ${transcriptText}` : transcriptText;
      return updated;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c]">
      {/* Scrollable Conversation Workspace */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4">
        {messages.length === 0 ? (
          /* Killer Feature "Do It For Me" Hero Onboarding */
          <div className="max-w-3xl mx-auto my-auto py-6 text-center space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              {/* Custom Logo Badge */}
              <div className="flex items-center justify-center gap-3">
                <div className="relative drop-shadow-xl hover:scale-105 transition-transform">
                  <AutonomousAgentLogo size={56} />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-cyan-300 text-xs font-mono font-semibold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>BUILD AUTONOMOUS AI AGENTS LOCALLY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f4f4f5] tracking-tight">
                What do you want me to execute?
              </h1>
              <p className="text-[#a1a1aa] text-xs max-w-lg mx-auto leading-relaxed">
                Autonomous AI engine capable of private document RAG retrieval, multi-step DAG planning, local sandbox execution, presentation authoring, CSV data analysis, and human approval safety gates.
              </p>
            </div>

            {/* Quick Action Killer Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
              {KILLER_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    id={`killer-prompt-btn-${idx}`}
                    onClick={() => handlePromptClick(item.prompt)}
                    className="group bg-[#0d0d10] hover:bg-[#141418] border border-[#1f1f23] hover:border-indigo-500/40 rounded-xl p-3.5 text-left transition-all shadow-sm flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-indigo-950/70 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#18181c] text-[#8e8e93] border border-[#27272a]">
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#e0e0e0] group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#8e8e93] line-clamp-2 mt-0.5 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium pt-0.5">
                      <span>Execute Workflow</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Chat & Multi-step Execution Stream */
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'agent' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2.5 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-xl rounded-tr-none px-3.5 py-2.5 shadow-sm' 
                    : 'bg-[#0d0d10] border border-[#1f1f23] rounded-xl rounded-tl-none p-4 text-[#e0e0e0] shadow-sm w-full'
                }`}>
                  {/* User message header */}
                  {msg.role === 'user' ? (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    /* Agent message body */
                    <div className="space-y-3">
                      {/* Subtasks Progress Timeline */}
                      {msg.subTasks && msg.subTasks.length > 0 && (
                        <TaskProgressTimeline 
                          subTasks={msg.subTasks} 
                          traces={msg.traces}
                        />
                      )}

                      {/* Sensitive Approval Warning Card if Waiting */}
                      {msg.approvalRequest && msg.approvalRequest.status === 'pending' && (
                        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                            <span>Action Paused: Human Approval Required</span>
                          </div>
                          <p className="text-xs text-[#e0e0e0]">
                            {msg.approvalRequest.description}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              id="msg-reject-approval-btn"
                              onClick={() => onRejectAction(msg.approvalRequest!.taskId)}
                              className="px-2.5 py-1 rounded bg-[#1f1f25] hover:bg-[#27272a] text-xs text-[#8e8e93] hover:text-[#e0e0e0] transition border border-[#27272a]"
                            >
                              Cancel
                            </button>
                            <button
                              id="msg-confirm-approval-btn"
                              onClick={() => onApproveAction(msg.approvalRequest!.taskId)}
                              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow"
                            >
                              Confirm & Send
                            </button>
                          </div>
                        </div>
                      )}

                      {/* RAG Citations Strip */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="bg-[#121215] border border-[#1f1f23] rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-semibold uppercase mb-1.5">
                            <BookmarkCheck className="w-3 h-3" />
                            <span>Retrieved Knowledge Citations ({msg.citations.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cite) => (
                              <button
                                key={cite.id}
                                id={`citation-chip-${cite.id}`}
                                onClick={() => onOpenCitation(cite)}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#18181c] hover:bg-[#222228] border border-[#27272a] hover:border-emerald-500/50 text-[11px] text-[#e0e0e0] transition group"
                              >
                                <span className="font-mono text-emerald-400 font-bold text-[10px]">[{cite.id}]</span>
                                <span className="truncate max-w-[140px] font-medium">{cite.documentTitle}</span>
                                <span className="text-[9px] text-[#71717a] font-mono">({Math.round(cite.score * 100)}%)</span>
                                <Eye className="w-2.5 h-2.5 text-[#71717a] group-hover:text-emerald-400 transition" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Visual Chart if Present */}
                      {msg.chartData && (
                        <DataChartRenderer config={msg.chartData} />
                      )}

                      {/* Generated Files & Artifacts */}
                      {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono text-indigo-300 font-semibold uppercase tracking-wider block">
                            Generated Artifacts:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.generatedFiles.map((file) => (
                              <div
                                key={file.id}
                                id={`generated-file-card-${file.id}`}
                                className="flex items-center justify-between p-2 rounded-lg bg-[#121215] border border-[#1f1f23] hover:border-indigo-500/40 transition group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-1.5 rounded bg-indigo-950/70 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                                    {file.format === 'pptx' && <Presentation className="w-3.5 h-3.5" />}
                                    {file.format === 'csv' && <FileSpreadsheet className="w-3.5 h-3.5" />}
                                    {file.format === 'code' && <FileCode className="w-3.5 h-3.5" />}
                                    {(file.format === 'markdown' || file.format === 'pdf' || file.format === 'docx' || file.format === 'txt') && (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-semibold text-[#e0e0e0] truncate">{file.title}</h5>
                                    <span className="text-[9px] font-mono uppercase text-[#71717a]">{file.format}</span>
                                  </div>
                                </div>

                                <button
                                  id={`preview-file-btn-${file.id}`}
                                  onClick={() => onOpenFile(file)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium border border-indigo-500/30 transition shrink-0 ml-1.5"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Preview</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Main Markdown Text Response */}
                      <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#d4d4d8] pt-1 prose-headings:text-[#f4f4f5] prose-headings:font-semibold prose-strong:text-[#f4f4f5] prose-code:text-indigo-300 prose-code:bg-[#141418] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#1f1f23]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a20] border border-[#27272a] flex items-center justify-center text-[#a1a1aa] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2.5 bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-3 max-w-md animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#e0e0e0] block">Orchestrating Autonomous Workflow...</span>
                  <span className="text-[10px] font-mono text-[#71717a]">Analyzing intent • Selecting tools • Evaluating RAG</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-3 sm:p-4 border-t border-[#1f1f23] bg-[#0d0d10]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative bg-[#141418] border border-[#1f1f23] focus-within:border-indigo-500/60 rounded-xl p-2.5 shadow-lg transition-all">
            <textarea
              id="agent-prompt-textarea"
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the autonomous agent in ${mode.toUpperCase()} mode (e.g. "Read PDF and create 8 slides", "Analyze CSV", "Draft email")...`}
              className="w-full bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#52525b] focus:outline-none resize-none px-1.5 py-1 leading-relaxed font-sans"
              disabled={isProcessing}
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-[#1f1f23] mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0d0d10] text-[#8e8e93] border border-[#27272a] uppercase">
                  {mode} mode
                </span>
                <span className="text-[10px] text-[#52525b] hidden sm:inline">
                  Press <strong>Enter ↵</strong> to execute, <strong>Shift+Enter</strong> for newline
                </span>
              </div>

              <div className="flex items-center gap-2">
                <VoiceInputButton 
                  onTranscript={handleVoiceTranscript}
                  disabled={isProcessing}
                />

                <button
                  id="send-prompt-btn"
                  type="submit"
                  disabled={!inputPrompt.trim() || isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
