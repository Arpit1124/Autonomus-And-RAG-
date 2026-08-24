import React, { useState, useMemo } from 'react';
import { AgentTask, SubTask, SubTaskStatus } from '../types';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertCircle, 
  Play, 
  RotateCcw, 
  Layers, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Wrench, 
  Database, 
  FileText, 
  BarChart3, 
  Send, 
  Code, 
  Search, 
  Sparkles, 
  Sliders, 
  ChevronRight, 
  ArrowRight,
  Info,
  Check,
  Eye
} from 'lucide-react';

interface Props {
  tasks: AgentTask[];
  onSelectTask?: (task: AgentTask) => void;
  className?: string;
}

interface DAGNode {
  id: string;
  subTask: SubTask;
  index: number;
  dependencies: string[];
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DAGEdge {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  status: 'completed' | 'active' | 'pending' | 'failed';
}

export const TaskDAGVisualizer: React.FC<Props> = ({ tasks, onSelectTask, className = '' }) => {
  // Filter for tasks that have subtasks or plan
  const multiStepTasks = useMemo(() => {
    return tasks.filter(t => t.subTasks && t.subTasks.length > 0);
  }, [tasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    const running = multiStepTasks.find(t => t.status === 'running' || t.status === 'waiting_approval');
    return running ? running.id : (multiStepTasks[0]?.id || tasks[0]?.id || '');
  });

  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);

  // Active task object
  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || multiStepTasks[0] || tasks[0];
  }, [tasks, selectedTaskId, multiStepTasks]);

  // Subtasks list with synthesized dependencies if not explicitly declared
  const subTasks = useMemo(() => {
    if (!activeTask || !activeTask.subTasks || activeTask.subTasks.length === 0) {
      if (activeTask && activeTask.planOutline && activeTask.planOutline.length > 0) {
        return activeTask.planOutline.map((step, idx) => ({
          id: `st-synth-${idx}`,
          title: step,
          description: `Planned step ${idx + 1} for execution`,
          status: (activeTask.status === 'completed' ? 'completed' : idx === 0 ? 'running' : 'pending') as SubTaskStatus,
          dependencies: idx > 0 ? [`st-synth-${idx - 1}`] : []
        }));
      }
      return [];
    }

    return activeTask.subTasks.map((st, idx, arr) => {
      // If no explicit dependencies, connect to preceding step(s)
      let deps = st.dependencies;
      if (!deps || deps.length === 0) {
        deps = idx > 0 ? [arr[idx - 1].id] : [];
      }
      return {
        ...st,
        dependencies: deps
      };
    });
  }, [activeTask]);

  // Compute Topological Levels and Node Coordinates
  const { nodes, edges, maxDimensions } = useMemo(() => {
    if (subTasks.length === 0) {
      return { nodes: [], edges: [], maxDimensions: { width: 600, height: 300 } };
    }

    const nodeWidth = orientation === 'horizontal' ? 220 : 260;
    const nodeHeight = orientation === 'horizontal' ? 100 : 90;
    const gapX = orientation === 'horizontal' ? 80 : 40;
    const gapY = orientation === 'horizontal' ? 40 : 60;

    // Step 1: Calculate levels for DAG
    const idToNode = new Map<string, { subTask: SubTask; index: number; level: number; dependencies: string[] }>();
    
    subTasks.forEach((st, idx) => {
      idToNode.set(st.id, {
        subTask: st,
        index: idx,
        level: 0,
        dependencies: st.dependencies || []
      });
    });

    // Compute levels iteratively
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 15) {
      changed = false;
      iterations++;
      subTasks.forEach(st => {
        const current = idToNode.get(st.id);
        if (!current) return;
        let maxParentLevel = -1;
        (st.dependencies || []).forEach(parentRef => {
          const parent = idToNode.get(parentRef) || subTasks.find((s, i) => s.id === parentRef || `st-${i}` === parentRef);
          if (parent) {
            const pLevel = idToNode.get(parent.id)?.level ?? 0;
            if (pLevel > maxParentLevel) maxParentLevel = pLevel;
          }
        });
        const newLevel = maxParentLevel + 1;
        if (newLevel !== current.level) {
          current.level = newLevel;
          changed = true;
        }
      });
    }

    // Group nodes by level
    const levelGroups: Array<Array<{ subTask: SubTask; index: number; dependencies: string[]; level: number }>> = [];
    idToNode.forEach(item => {
      const lvl = item.level;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(item);
    });

    const dagNodes: DAGNode[] = [];
    const nodeMap = new Map<string, DAGNode>();

    let totalWidth = 0;
    let totalHeight = 0;

    if (orientation === 'horizontal') {
      const maxRows = Math.max(...levelGroups.map(g => g ? g.length : 0), 1);
      totalHeight = Math.max(260, maxRows * (nodeHeight + gapY) + 40);

      levelGroups.forEach((group, lvl) => {
        if (!group) return;
        const colX = 30 + lvl * (nodeWidth + gapX);
        const groupHeight = group.length * (nodeHeight + gapY) - gapY;
        const startY = (totalHeight - groupHeight) / 2;

        group.forEach((item, rowIdx) => {
          const node: DAGNode = {
            id: item.subTask.id,
            subTask: item.subTask,
            index: item.index,
            dependencies: item.dependencies,
            level: item.level,
            x: colX,
            y: startY + rowIdx * (nodeHeight + gapY),
            width: nodeWidth,
            height: nodeHeight
          };
          dagNodes.push(node);
          nodeMap.set(node.id, node);
        });

        totalWidth = Math.max(totalWidth, colX + nodeWidth + 40);
      });
    } else {
      // Vertical orientation
      const maxCols = Math.max(...levelGroups.map(g => g ? g.length : 0), 1);
      totalWidth = Math.max(340, maxCols * (nodeWidth + gapX) + 40);

      levelGroups.forEach((group, lvl) => {
        if (!group) return;
        const rowY = 30 + lvl * (nodeHeight + gapY);
        const groupWidth = group.length * (nodeWidth + gapX) - gapX;
        const startX = (totalWidth - groupWidth) / 2;

        group.forEach((item, colIdx) => {
          const node: DAGNode = {
            id: item.subTask.id,
            subTask: item.subTask,
            index: item.index,
            dependencies: item.dependencies,
            level: item.level,
            x: startX + colIdx * (nodeWidth + gapX),
            y: rowY,
            width: nodeWidth,
            height: nodeHeight
          };
          dagNodes.push(node);
          nodeMap.set(node.id, node);
        });

        totalHeight = Math.max(totalHeight, rowY + nodeHeight + 40);
      });
    }

    // Step 2: Build Edges
    const dagEdges: DAGEdge[] = [];

    dagNodes.forEach(childNode => {
      (childNode.dependencies || []).forEach(parentRef => {
        const parentNode = nodeMap.get(parentRef) || dagNodes.find(n => n.id === parentRef || n.subTask.id === parentRef);
        if (!parentNode) return;

        let edgeStatus: DAGEdge['status'] = 'pending';
        if (parentNode.subTask.status === 'completed' && childNode.subTask.status === 'completed') {
          edgeStatus = 'completed';
        } else if (parentNode.subTask.status === 'completed' && childNode.subTask.status === 'running') {
          edgeStatus = 'active';
        } else if (parentNode.subTask.status === 'failed' || childNode.subTask.status === 'failed') {
          edgeStatus = 'failed';
        }

        let fromX = 0;
        let fromY = 0;
        let toX = 0;
        let toY = 0;

        if (orientation === 'horizontal') {
          fromX = parentNode.x + parentNode.width;
          fromY = parentNode.y + parentNode.height / 2;
          toX = childNode.x;
          toY = childNode.y + childNode.height / 2;
        } else {
          fromX = parentNode.x + parentNode.width / 2;
          fromY = parentNode.y + parentNode.height;
          toX = childNode.x + childNode.width / 2;
          toY = childNode.y;
        }

        dagEdges.push({
          fromId: parentNode.id,
          toId: childNode.id,
          fromX,
          fromY,
          toX,
          toY,
          status: edgeStatus
        });
      });
    });

    return {
      nodes: dagNodes,
      edges: dagEdges,
      maxDimensions: {
        width: Math.max(totalWidth, 600),
        height: Math.max(totalHeight, 300)
      }
    };
  }, [subTasks, orientation]);

  // Selected node details
  const activeNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0] || null;
  }, [nodes, selectedNodeId]);

  // Stats
  const completedCount = subTasks.filter(st => st.status === 'completed').length;
  const runningCount = subTasks.filter(st => st.status === 'running').length;
  const waitingApprovalCount = activeTask?.status === 'waiting_approval' ? 1 : 0;
  const pendingCount = subTasks.filter(st => st.status === 'pending').length;

  const getToolIcon = (toolName?: string) => {
    if (!toolName) return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    if (toolName.includes('search') || toolName.includes('rag')) return <Search className="w-3.5 h-3.5 text-cyan-400" />;
    if (toolName.includes('code') || toolName.includes('script')) return <Code className="w-3.5 h-3.5 text-emerald-400" />;
    if (toolName.includes('chart') || toolName.includes('data')) return <BarChart3 className="w-3.5 h-3.5 text-purple-400" />;
    if (toolName.includes('doc') || toolName.includes('report')) return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    if (toolName.includes('email') || toolName.includes('message')) return <Send className="w-3.5 h-3.5 text-orange-400" />;
    if (toolName.includes('presentation') || toolName.includes('deck')) return <Layers className="w-3.5 h-3.5 text-pink-400" />;
    return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const getStatusBadge = (status: SubTaskStatus, isWaitingApproval: boolean = false) => {
    if (isWaitingApproval) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
          <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
          AWAITING APPROVAL
        </span>
      );
    }
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            RUNNING
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-[#a1a1aa] px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a]">
            <Clock className="w-2.5 h-2.5 text-[#71717a]" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div 
      id="task-dag-visualizer"
      className={`bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3.5 shadow-sm flex flex-col ${className}`}
    >
      {/* Header & Task Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1f1f23] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold flex items-center gap-2">
              Multi-Step Task Directed Acyclic Graph (DAG)
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              Topology Pipeline
            </span>
          </div>
          <p className="text-[11px] text-[#8e8e93]">
            Interactive dependency execution graph of agent sub-tasks, execution states, and critical paths
          </p>
        </div>

        {/* Task Switcher & Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Task Dropdown */}
          <div className="relative">
            <select
              id="dag-task-selector"
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setSelectedNodeId(null);
                const t = tasks.find(x => x.id === e.target.value);
                if (t && onSelectTask) onSelectTask(t);
              }}
              className="bg-[#141418] border border-[#27272a] hover:border-indigo-500/60 rounded-lg px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 cursor-pointer max-w-xs truncate"
            >
              {tasks.map(t => {
                const subCount = t.subTasks?.length || t.planOutline?.length || 0;
                return (
                  <option key={t.id} value={t.id}>
                    [{t.status.toUpperCase()}] {t.prompt.length > 36 ? t.prompt.slice(0, 36) + '...' : t.prompt} ({subCount} steps)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-[#141418] border border-[#1f1f23] rounded-lg p-0.5 text-[10px]">
            <button
              id="dag-orient-horizontal"
              onClick={() => setOrientation('horizontal')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                orientation === 'horizontal' ? 'bg-indigo-600 text-white font-semibold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
              title="Horizontal Left-to-Right layout"
            >
              Horizontal
            </button>
            <button
              id="dag-orient-vertical"
              onClick={() => setOrientation('vertical')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                orientation === 'vertical' ? 'bg-indigo-600 text-white font-semibold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
              }`}
              title="Vertical Top-to-Bottom layout"
            >
              Vertical
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#141418] border border-[#1f1f23] rounded-lg p-0.5">
            <button
              id="dag-zoom-out"
              onClick={() => setZoomLevel(prev => Math.max(0.7, +(prev - 0.15).toFixed(2)))}
              className="p-1 text-[#8e8e93] hover:text-white hover:bg-[#1f1f26] rounded transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[10px] text-[#71717a] font-mono select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="dag-zoom-in"
              onClick={() => setZoomLevel(prev => Math.min(1.4, +(prev + 0.15).toFixed(2)))}
              className="p-1 text-[#8e8e93] hover:text-white hover:bg-[#1f1f26] rounded transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              id="dag-zoom-reset"
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[9px] text-indigo-400 hover:text-indigo-300 font-mono transition cursor-pointer"
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Task Summary Banner */}
      {activeTask && (
        <div className="bg-[#101014] border border-[#1f1f26] rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Target Workflow:</span>
              <span className="text-white font-medium text-xs truncate max-w-lg">{activeTask.prompt}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#8e8e93]">
              <span>Mode: <strong className="text-indigo-300 uppercase">{activeTask.mode}</strong></span>
              <span>Total Steps: <strong className="text-white">{subTasks.length}</strong></span>
              <span>Duration: <strong className="text-[#e0e0e0]">{activeTask.executionDurationMs || 1200}ms</strong></span>
              <span>Status: {getStatusBadge(activeTask.status as any, activeTask.status === 'waiting_approval')}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-28 bg-[#18181b] h-2 rounded-full overflow-hidden border border-[#27272a]">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${subTasks.length > 0 ? (completedCount / subTasks.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {completedCount}/{subTasks.length} Done
            </span>
          </div>
        </div>
      )}

      {/* Main DAG Graph Canvas Viewport */}
      <div 
        id="dag-canvas-viewport"
        className="relative bg-[#08080a] border border-[#1a1a20] rounded-xl overflow-auto min-h-[300px] max-h-[460px] p-2 flex items-center justify-center select-none"
        style={{
          backgroundImage: 'radial-gradient(#1f1f26 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {nodes.length === 0 ? (
          <div className="py-12 text-center text-[#71717a] font-mono text-xs space-y-2">
            <GitBranch className="w-8 h-8 text-[#3f3f46] mx-auto animate-pulse" />
            <p>No sub-task graph available for this task.</p>
          </div>
        ) : (
          <div 
            className="relative transition-transform duration-150 origin-top-left"
            style={{
              width: maxDimensions.width,
              height: maxDimensions.height,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left'
            }}
          >
            {/* SVG Connecting Edges */}
            <svg 
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ width: maxDimensions.width, height: maxDimensions.height }}
            >
              <defs>
                <marker 
                  id="dag-arrow-completed" 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker 
                  id="dag-arrow-active" 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#6366f1" />
                </marker>
                <marker 
                  id="dag-arrow-pending" 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#3f3f46" />
                </marker>
                <marker 
                  id="dag-arrow-failed" 
                  viewBox="0 0 10 10" 
                  refX="8" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
                </marker>
              </defs>

              {edges.map((edge, idx) => {
                const isSelectedEdge = selectedNodeId === edge.fromId || selectedNodeId === edge.toId;
                
                // Construct smooth bezier curve
                let pathD = '';
                if (orientation === 'horizontal') {
                  const dx = Math.max(30, (edge.toX - edge.fromX) / 2);
                  pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX + dx} ${edge.fromY}, ${edge.toX - dx} ${edge.toY}, ${edge.toX} ${edge.toY}`;
                } else {
                  const dy = Math.max(30, (edge.toY - edge.fromY) / 2);
                  pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${edge.fromY + dy}, ${edge.toX} ${edge.toY - dy}, ${edge.toX} ${edge.toY}`;
                }

                let strokeColor = '#27272a';
                let markerUrl = 'url(#dag-arrow-pending)';
                let strokeWidth = 2;
                let strokeDash = undefined;

                if (edge.status === 'completed') {
                  strokeColor = '#10b981';
                  markerUrl = 'url(#dag-arrow-completed)';
                } else if (edge.status === 'active') {
                  strokeColor = '#6366f1';
                  markerUrl = 'url(#dag-arrow-active)';
                  strokeDash = '6 4';
                } else if (edge.status === 'failed') {
                  strokeColor = '#ef4444';
                  markerUrl = 'url(#dag-arrow-failed)';
                }

                if (isSelectedEdge) {
                  strokeWidth = 3;
                  strokeColor = '#818cf8';
                  markerUrl = 'url(#dag-arrow-active)';
                }

                return (
                  <g key={`edge-${idx}`}>
                    {/* Background glow shadow */}
                    {isSelectedEdge && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={6}
                        opacity={0.3}
                      />
                    )}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={markerUrl}
                      className={edge.status === 'active' ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render DAG Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isWaitingApproval = activeTask?.status === 'waiting_approval' && node.subTask.toolName === 'send_email';

              let borderColor = 'border-[#27272a]';
              let bgColor = 'bg-[#111116]';
              let badgeAccent = 'text-[#71717a]';

              if (node.subTask.status === 'completed') {
                borderColor = isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-emerald-500/40 hover:border-emerald-400';
                bgColor = 'bg-gradient-to-b from-[#111815] to-[#0d1210]';
                badgeAccent = 'text-emerald-400';
              } else if (node.subTask.status === 'running') {
                borderColor = isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/30' : 'border-indigo-500/50 hover:border-indigo-400';
                bgColor = 'bg-gradient-to-b from-[#121324] to-[#0e0f1c]';
                badgeAccent = 'text-indigo-400';
              } else if (isWaitingApproval) {
                borderColor = isSelected ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/50 hover:border-amber-400';
                bgColor = 'bg-gradient-to-b from-[#1c1608] to-[#120f08]';
                badgeAccent = 'text-amber-400';
              } else if (node.subTask.status === 'failed') {
                borderColor = 'border-rose-500/40 hover:border-rose-400';
                bgColor = 'bg-[#180f12]';
                badgeAccent = 'text-rose-400';
              }

              return (
                <div
                  key={node.id}
                  id={`dag-node-${node.id}`}
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height
                  }}
                  className={`border rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 shadow-md select-none group ${borderColor} ${bgColor} ${
                    isSelected ? 'scale-[1.03] z-20' : 'hover:scale-[1.01] z-10'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-5 h-5 rounded-md bg-[#181820] border border-[#27272e] font-mono text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                        {node.index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {getToolIcon(node.subTask.toolName)}
                        <span className="text-[10px] font-mono text-[#a1a1aa] truncate">
                          {node.subTask.toolName ? node.subTask.toolName.replace(/_/g, ' ') : 'Agent Plan'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(node.subTask.status, isWaitingApproval)}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="my-1">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition">
                      {node.subTask.title}
                    </h4>
                    <p className="text-[10px] text-[#71717a] truncate">
                      {node.subTask.description}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#71717a] pt-1 border-t border-[#1f1f26]">
                    <span className="flex items-center gap-1">
                      {node.dependencies.length > 0 ? (
                        <span className="text-indigo-400">Depends on: {node.dependencies.length}</span>
                      ) : (
                        <span className="text-[#52525b]">Root Node</span>
                      )}
                    </span>
                    <span className="text-[#8e8e93]">
                      {node.subTask.status === 'completed' ? 'Done' : node.subTask.status === 'running' ? 'Active...' : 'Queue'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Node Inspector Drawer / Detail Overlay when a node is clicked */}
      {activeNode && (
        <div 
          id="dag-node-inspector"
          className="bg-[#101015] border border-indigo-500/30 rounded-xl p-3.5 space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs">
                #{activeNode.index + 1}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>{activeNode.subTask.title}</span>
                  {getStatusBadge(activeNode.subTask.status, activeTask?.status === 'waiting_approval' && activeNode.subTask.toolName === 'send_email')}
                </h4>
                <p className="text-[10px] text-[#8e8e93]">{activeNode.subTask.description}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[10px] font-mono text-[#71717a] hover:text-white px-2 py-0.5 rounded bg-[#181820] cursor-pointer"
            >
              Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {/* Tool & Execution Info */}
            <div className="bg-[#14141c] p-2.5 rounded-lg border border-[#23232c] space-y-1">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Assigned Tool</span>
              <div className="flex items-center gap-1.5 text-indigo-300 font-mono font-semibold">
                {getToolIcon(activeNode.subTask.toolName)}
                <span>{activeNode.subTask.toolName || 'Autonomous Reasoning'}</span>
              </div>
              <span className="text-[10px] text-[#8e8e93] block">
                Trace ID: <code className="text-[#a1a1aa]">{activeNode.subTask.traceId || 'trace-exec'}</code>
              </span>
            </div>

            {/* Dependencies */}
            <div className="bg-[#14141c] p-2.5 rounded-lg border border-[#23232c] space-y-1">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Inbound Dependencies</span>
              {activeNode.dependencies.length > 0 ? (
                <div className="space-y-1">
                  {activeNode.dependencies.map((dep, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#71717a]">No upstream prerequisite (Entry node)</span>
              )}
            </div>

            {/* Execution Result Summary */}
            <div className="bg-[#14141c] p-2.5 rounded-lg border border-[#23232c] space-y-1">
              <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">Output Result Summary</span>
              <p className="text-[11px] text-[#d4d4d8] leading-tight line-clamp-2">
                {activeNode.subTask.resultSummary || (activeNode.subTask.status === 'completed' ? 'Subtask completed with verified output.' : 'Awaiting upstream pipeline execution.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DAG Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1f1f23] text-[10px] font-mono text-[#71717a]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed Node
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" /> Running Active Node
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Waiting Human Gate
          </span>
          <span className="flex items-center gap-1 text-[#8e8e93]">
            <span className="w-2 h-2 rounded-full bg-[#3f3f46]" /> Pending Step
          </span>
        </div>

        <span className="text-[#52525b]">
          DAG Flow Engine v2.4 • Directed Acyclic Graph
        </span>
      </div>
    </div>
  );
};
