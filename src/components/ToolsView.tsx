import React, { useState } from 'react';
import { ToolDefinition } from '../types';
import { INITIAL_TOOLS } from '../data/initialData';
import { 
  Wrench, 
  Search, 
  FileText, 
  Code, 
  Mail, 
  Calendar, 
  Globe, 
  BarChart2, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  Layers,
  Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

export const ToolsView: React.FC = () => {
  const [tools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition>(INITIAL_TOOLS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const categories = ['all', 'knowledge', 'productivity', 'data', 'web', 'communication', 'scheduling', 'developer'];

  const filteredTools = tools.filter(t => categoryFilter === 'all' || t.category === categoryFilter);

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool);
    setExecutionResult(null);
    // Initialize test params with defaults
    const initialParams: Record<string, any> = {};
    tool.parameters.forEach(p => {
      if (p.defaultValue !== undefined) {
        initialParams[p.name] = p.defaultValue;
      } else if (p.name === 'query') {
        initialParams[p.name] = 'ARR and revenue growth metrics';
      } else if (p.name === 'title') {
        initialParams[p.name] = 'Executive Strategy Briefing';
      } else if (p.name === 'slideCount') {
        initialParams[p.name] = 5;
      } else if (p.name === 'sourceContext') {
        initialParams[p.name] = 'Q4 ARR was $14.2M (+38% YoY). Gross margin reached 79.4%.';
      } else if (p.name === 'format') {
        initialParams[p.name] = 'markdown';
      } else if (p.name === 'sections') {
        initialParams[p.name] = ['Executive Summary', 'Financial Performance', 'Strategic Goals'];
      } else if (p.name === 'recipient') {
        initialParams[p.name] = 'Board of Directors';
      } else if (p.name === 'subject') {
        initialParams[p.name] = 'Q4 Performance Review';
      } else if (p.name === 'purpose') {
        initialParams[p.name] = 'Deliver quarterly update with ARR metrics';
      } else if (p.name === 'code') {
        initialParams[p.name] = 'const arr = [10.3, 14.2]; const growth = ((arr[1] - arr[0]) / arr[0]) * 100; return { growthRate: `${growth.toFixed(1)}%` };';
      } else if (p.name === 'language') {
        initialParams[p.name] = 'TypeScript';
      } else if (p.name === 'specification') {
        initialParams[p.name] = 'Create a retry with exponential backoff utility function';
      } else if (p.name === 'dataset') {
        initialParams[p.name] = 'Month,Revenue\nJan,1.2\nFeb,1.5\nMar,1.9\nApr,2.4';
      } else if (p.name === 'chartType') {
        initialParams[p.name] = 'bar';
      } else if (p.name === 'metricName') {
        initialParams[p.name] = 'Monthly Recurring Revenue';
      } else if (p.name === 'to') {
        initialParams[p.name] = 'executives@enterprise.io';
      } else if (p.name === 'body') {
        initialParams[p.name] = 'Attached is our quarterly briefing.';
      }
    });
    setTestParams(initialParams);
  };

  const handleExecuteTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const res = await api.executeTool(selectedTool.name, testParams);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({ error: err.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0a0a0c]">
      {/* Tool List Column */}
      <div className="w-full lg:w-88 border-r border-[#1f1f23] flex flex-col h-full bg-[#0d0d10]">
        <div className="p-3 border-b border-[#1f1f23] space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#e0e0e0] uppercase tracking-wider font-mono">
              Tool Registry
            </h2>
            <span className="text-[10px] font-mono bg-[#141418] text-indigo-300 px-2 py-0.5 rounded border border-[#1f1f23]">
              {tools.length} Tools
            </span>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-[#141418] text-[#8e8e93] hover:text-[#e0e0e0] border border-[#1f1f23]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tool Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTools.map((tool) => {
            const isSelected = selectedTool.id === tool.id;
            return (
              <button
                key={tool.id}
                id={`tool-item-${tool.id}`}
                onClick={() => handleSelectTool(tool)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                    : 'bg-[#121215] hover:bg-[#18181d] border-[#1f1f23]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-xs text-[#e0e0e0]">{tool.displayName}</span>
                  {tool.isSensitive ? (
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" /> Sensitive
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase text-[#8e8e93] bg-[#18181c] border border-[#27272a] px-1.5 py-0.2 rounded">
                      {tool.category}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>

                <div className="text-[10px] font-mono text-indigo-400 mt-1.5">
                  function: {tool.name}()
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Tester & Parameters Sandbox */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0a0a0c]">
        <div className="max-w-3xl space-y-4">
          {/* Header Card */}
          <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#141418] text-indigo-300 border border-[#1f1f23]">
                  {selectedTool.category}
                </span>
                {selectedTool.isSensitive && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Requires User Confirmation
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#71717a]">
                {selectedTool.parameters.length} parameters
              </span>
            </div>

            <h2 className="text-sm font-bold text-[#e0e0e0]">{selectedTool.displayName}</h2>
            <p className="text-xs text-[#a1a1aa] leading-relaxed font-sans">
              {selectedTool.description}
            </p>
          </div>

          {/* Test Execution Form */}
          <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Live Tool Execution Sandbox
              </h3>
              <span className="text-[10px] font-mono text-[#71717a]">Direct invocation test</span>
            </div>

            <form onSubmit={handleExecuteTool} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTool.parameters.map((param) => (
                  <div key={param.name} className="space-y-1">
                    <label className="block text-[11px] font-mono text-[#e0e0e0] font-medium">
                      {param.name} {param.required && <span className="text-red-400">*</span>}
                    </label>
                    <span className="text-[10px] text-[#71717a] block mb-0.5">{param.description}</span>
                    
                    {param.type === 'array' ? (
                      <textarea
                        rows={2}
                        value={typeof testParams[param.name] === 'object' ? JSON.stringify(testParams[param.name]) : testParams[param.name] || ''}
                        onChange={(e) => {
                          try {
                            setTestParams({ ...testParams, [param.name]: JSON.parse(e.target.value) });
                          } catch {
                            setTestParams({ ...testParams, [param.name]: e.target.value });
                          }
                        }}
                        className="w-full bg-[#141418] border border-[#1f1f23] rounded-md p-2 text-xs text-[#e0e0e0] font-mono focus:outline-none focus:border-indigo-500"
                      />
                    ) : param.name === 'sourceContext' || param.name === 'code' || param.name === 'dataset' ? (
                      <textarea
                        rows={3}
                        value={testParams[param.name] || ''}
                        onChange={(e) => setTestParams({ ...testParams, [param.name]: e.target.value })}
                        className="w-full bg-[#141418] border border-[#1f1f23] rounded-md p-2 text-xs text-[#e0e0e0] font-mono focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={testParams[param.name] ?? ''}
                        onChange={(e) => setTestParams({ ...testParams, [param.name]: param.type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1 text-xs text-[#e0e0e0] font-mono focus:outline-none focus:border-indigo-500"
                        required={param.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="execute-tool-sandbox-btn"
                  type="submit"
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs shadow-sm transition cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{isExecuting ? 'Running Tool...' : 'Run Tool Test'}</span>
                </button>
              </div>
            </form>

            {/* Result Box */}
            {executionResult && (
              <div className="mt-3 pt-3 border-t border-[#1f1f23] space-y-1.5">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  Tool Execution Output:
                </span>
                <pre className="p-3 rounded-lg bg-[#0a0a0c] border border-[#1f1f23] text-[#d4d4d8] text-[11px] font-mono overflow-x-auto leading-relaxed max-h-72">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
