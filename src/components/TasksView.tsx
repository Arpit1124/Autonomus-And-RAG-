import React, { useState, useMemo } from 'react';
import { AgentTask, SubTask, ToolCallTrace, SensitiveApprovalRequest } from '../types';
import { TaskGanttTimeline } from './TaskGanttTimeline';
import { 
  CheckCircle2, 
  CircleDot, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  Layers, 
  Search, 
  Filter, 
  BarChart2, 
  ListTree,
  ShieldAlert,
  Send,
  X,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Play,
  CheckCheck,
  Ban
} from 'lucide-react';

interface Props {
  tasks: AgentTask[];
  onSelectTask?: (task: AgentTask) => void;
  onApproveAction?: (taskId: string, modifiedInput?: Record<string, any>) => void;
  onRejectAction?: (taskId: string) => void;
  onBatchApproveActions?: (taskIds: string[]) => Promise<void> | void;
  onBatchRejectActions?: (taskIds: string[]) => Promise<void> | void;
  onOpenApproval?: (req: SensitiveApprovalRequest, batchList?: SensitiveApprovalRequest[]) => void;
  onBulkDeleteTasks?: (taskIds: string[]) => Promise<void> | void;
  onBulkUpdateTaskStatus?: (taskIds: string[], status: AgentTask['status']) => Promise<void> | void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
  onUpdateTaskStatus?: (taskId: string, status: AgentTask['status']) => Promise<void> | void;
  onRefreshTasks?: () => void;
}

export const TasksView: React.FC<Props> = ({ 
  tasks, 
  onSelectTask,
  onApproveAction,
  onRejectAction,
  onBatchApproveActions,
  onBatchRejectActions,
  onOpenApproval,
  onBulkDeleteTasks,
  onBulkUpdateTaskStatus,
  onDeleteTask,
  onUpdateTaskStatus,
  onRefreshTasks
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'both' | 'gantt' | 'graph'>('both');
  
  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkStatusMenuOpen, setBulkStatusMenuOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Search input filtering: matches prompt, description, status, mode, or ID
  const filteredTasks = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return tasks.filter(t => {
      // Check status match
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      // 1. Check title/prompt
      if (t.prompt && t.prompt.toLowerCase().includes(query)) return true;

      // 2. Check task ID or mode
      if (t.id.toLowerCase().includes(query) || t.mode.toLowerCase().includes(query)) return true;

      // 3. Check status name
      if (t.status.toLowerCase().includes(query)) return true;

      // 4. Check subtasks title & description
      if (t.subTasks && t.subTasks.some(st => 
        (st.title && st.title.toLowerCase().includes(query)) ||
        (st.description && st.description.toLowerCase().includes(query)) ||
        (st.toolName && st.toolName.toLowerCase().includes(query))
      )) return true;

      // 5. Check traces or plan outlines
      if (t.planOutline && t.planOutline.some(step => step.toLowerCase().includes(query))) return true;
      if (t.finalResponse && t.finalResponse.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [tasks, searchFilter, statusFilter]);

  const activeTask = tasks.find(t => t.id === selectedTaskId) || filteredTasks[0] || tasks[0];

  // Counts for status filters
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      running: tasks.filter(t => t.status === 'running').length,
      waiting_approval: tasks.filter(t => t.status === 'waiting_approval').length,
      failed: tasks.filter(t => t.status === 'failed').length
    };
  }, [tasks]);

  // Selected tasks that are waiting for human approval
  const selectedWaitingApprovalTasks = useMemo(() => {
    return tasks.filter(t => selectedTaskIds.has(t.id) && t.status === 'waiting_approval');
  }, [tasks, selectedTaskIds]);

  // Selection helpers
  const isAllFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedTaskIds.has(t.id));
  const isSomeFilteredSelected = filteredTasks.some(t => selectedTaskIds.has(t.id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedTaskIds(new Set());
    } else {
      const newSet = new Set(selectedTaskIds);
      filteredTasks.forEach(t => newSet.add(t.id));
      setSelectedTaskIds(newSet);
    }
  };

  const toggleSelectTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const selectAllPendingApproval = () => {
    const pendingIds = tasks.filter(t => t.status === 'waiting_approval').map(t => t.id);
    setSelectedTaskIds(new Set(pendingIds));
    setStatusFilter('waiting_approval');
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  // Bulk Operations: Status
  const handleBulkStatusChange = async (newStatus: AgentTask['status']) => {
    if (selectedTaskIds.size === 0) return;
    setIsBulkActionLoading(true);
    setBulkStatusMenuOpen(false);
    try {
      const ids = Array.from(selectedTaskIds);
      if (onBulkUpdateTaskStatus) {
        await onBulkUpdateTaskStatus(ids, newStatus);
      }
      setActionSuccessMsg(`Updated status to "${newStatus}" for ${ids.length} tasks.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      console.error('Bulk update status failed:', err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Bulk Operations: Delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBulkActionLoading(true);
    setShowDeleteConfirm(false);
    try {
      const ids = Array.from(selectedTaskIds);
      if (onBulkDeleteTasks) {
        await onBulkDeleteTasks(ids);
      }
      setSelectedTaskIds(new Set());
      setActionSuccessMsg(`Deleted ${ids.length} tasks successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Bulk Operations: Batch Approve
  const handleBatchApprovePending = async () => {
    const ids = selectedWaitingApprovalTasks.map(t => t.id);
    if (ids.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      if (onBatchApproveActions) {
        await onBatchApproveActions(ids);
      } else if (onApproveAction) {
        for (const id of ids) {
          onApproveAction(id);
        }
      }
      setActionSuccessMsg(`Approved and dispatched ${ids.length} pending actions.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      console.error('Batch approve failed:', err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Bulk Operations: Batch Reject
  const handleBatchRejectPending = async () => {
    const ids = selectedWaitingApprovalTasks.map(t => t.id);
    if (ids.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      if (onBatchRejectActions) {
        await onBatchRejectActions(ids);
      } else if (onRejectAction) {
        for (const id of ids) {
          onRejectAction(id);
        }
      }
      setActionSuccessMsg(`Rejected ${ids.length} pending actions.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      console.error('Batch reject failed:', err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Open Batch Review Modal
  const handleOpenBatchApprovalModal = () => {
    const pendingWithReq = selectedWaitingApprovalTasks.filter(t => t.pendingApproval);
    if (pendingWithReq.length > 0 && onOpenApproval) {
      const allRequests = pendingWithReq.map(t => t.pendingApproval!);
      onOpenApproval(allRequests[0], allRequests);
    }
  };

  const handleDeleteSingle = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      if (onDeleteTask) {
        await onDeleteTask(taskId);
      }
      const newSet = new Set(selectedTaskIds);
      newSet.delete(taskId);
      setSelectedTaskIds(newSet);
      if (selectedTaskId === taskId) {
        const remaining = tasks.filter(t => t.id !== taskId);
        setSelectedTaskId(remaining[0]?.id || null);
      }
      if (onRefreshTasks) onRefreshTasks();
    }
  };

  const handleSingleStatusChange = async (taskId: string, newStatus: AgentTask['status']) => {
    if (onUpdateTaskStatus) {
      await onUpdateTaskStatus(taskId, newStatus);
      if (onRefreshTasks) onRefreshTasks();
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0a0a0c] relative">
      
      {/* Task List Column */}
      <div className="w-full lg:w-96 border-r border-[#1f1f23] flex flex-col h-full bg-[#0d0d10] shrink-0">
        
        {/* Header with Search & Filter */}
        <div className="p-3 border-b border-[#1f1f23] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#e0e0e0] uppercase tracking-wider font-mono">
                Execution Tasks
              </h2>
              <span className="text-[10px] font-mono bg-[#141418] text-indigo-300 px-1.5 py-0.2 rounded border border-[#1f1f23]">
                {filteredTasks.length} / {tasks.length}
              </span>
            </div>

            {/* Quick Multi-Select All Action */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                id="tasks-select-all-btn"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#141418] hover:bg-[#1f1f26] border border-[#27272a] text-[10px] text-[#a1a1aa] hover:text-white transition cursor-pointer"
                title={isAllFilteredSelected ? 'Deselect all' : 'Select all filtered tasks'}
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                ) : isSomeFilteredSelected ? (
                  <MinusSquare className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#71717a]" />
                )}
                <span>{selectedTaskIds.size > 0 ? `${selectedTaskIds.size} selected` : 'Select All'}</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-2" />
            <input
              id="tasks-search-input"
              type="text"
              placeholder="Search title, description, mode, ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#141418] border border-[#1f1f23] rounded-md pl-7 pr-7 py-1 text-xs text-[#e0e0e0] placeholder:text-[#52525b] focus:outline-none focus:border-indigo-500 font-mono"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-2 text-[#71717a] hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs with Count Badges */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px] font-mono scrollbar-none">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'running', label: 'Running', count: counts.running },
              { id: 'waiting_approval', label: 'Approval', count: counts.waiting_approval, highlight: counts.waiting_approval > 0 },
              { id: 'failed', label: 'Failed', count: counts.failed }
            ].map((st) => (
              <button
                key={st.id}
                id={`filter-tab-${st.id}`}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : st.highlight
                    ? 'bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-amber-500/40'
                    : 'bg-[#141418] text-[#8e8e93] hover:text-[#e0e0e0] border border-[#1f1f23]'
                }`}
              >
                <span>{st.label}</span>
                <span className={`text-[9px] px-1 py-0.1 rounded ${
                  statusFilter === st.id ? 'bg-indigo-800 text-white' : 'bg-[#1e1e24] text-[#a1a1aa]'
                }`}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Pending Approval Action Bar if any exists */}
          {counts.waiting_approval > 0 && statusFilter !== 'waiting_approval' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-1.5 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1 text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{counts.waiting_approval} pending human approval</span>
              </div>
              <button
                onClick={selectAllPendingApproval}
                className="text-amber-400 hover:text-amber-200 underline font-semibold cursor-pointer"
              >
                Select & Review All
              </button>
            </div>
          )}

          {/* Action notification banner */}
          {actionSuccessMsg && (
            <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono flex items-center justify-between">
              <span>{actionSuccessMsg}</span>
              <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Task Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-[#52525b] text-xs font-mono space-y-2">
              <p>No matching tasks found.</p>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="text-indigo-400 hover:underline text-[11px]"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isSelected = activeTask?.id === t.id;
              const isChecked = selectedTaskIds.has(t.id);
              const isWaitingApproval = t.status === 'waiting_approval';

              return (
                <div
                  key={t.id}
                  id={`task-item-${t.id}`}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    if (onSelectTask) onSelectTask(t);
                  }}
                  className={`group relative w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                      : isChecked
                      ? 'bg-[#151520] border-indigo-500/30'
                      : isWaitingApproval
                      ? 'bg-[#14120e] border-amber-500/40 hover:bg-[#1a1710]'
                      : 'bg-[#121215] hover:bg-[#18181d] border-[#1f1f23]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox for Bulk Actions */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectTask(e, t.id)}
                        className="text-[#71717a] hover:text-indigo-400 p-0.5 rounded transition cursor-pointer"
                        title={isChecked ? 'Deselect task' : 'Select task for bulk action'}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#52525b] group-hover:text-[#a1a1aa]" />
                        )}
                      </button>

                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded uppercase bg-[#18181c] text-[#8e8e93] border border-[#27272a]">
                        {t.mode}
                      </span>
                    </div>

                    <span className={`text-[9px] font-mono uppercase font-semibold shrink-0 ${
                      t.status === 'completed' ? 'text-emerald-400' 
                      : t.status === 'running' ? 'text-indigo-400 animate-pulse'
                      : t.status === 'waiting_approval' ? 'text-amber-400 flex items-center gap-1'
                      : t.status === 'failed' ? 'text-red-400'
                      : 'text-[#8e8e93]'
                    }`}>
                      {t.status === 'waiting_approval' && <ShieldAlert className="w-3 h-3 inline" />}
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-xs font-medium text-[#e0e0e0] line-clamp-2 leading-relaxed pl-5.5">
                    {t.prompt}
                  </h4>

                  {/* Subtask snippet or preview */}
                  {t.subTasks && t.subTasks.length > 0 && (
                    <p className="text-[11px] text-[#71717a] line-clamp-1 mt-1 pl-5.5">
                      Subtask 1: {t.subTasks[0].title}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#71717a] font-mono mt-1.5 pt-1.5 border-t border-[#1f1f23] pl-5.5">
                    <span>{t.subTasks?.length || 0} subtasks</span>
                    <span>{t.executionDurationMs || 0}ms</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating / Sticky Bulk Action Toolbar when >= 1 task selected */}
        {selectedTaskIds.size > 0 && (
          <div 
            id="bulk-actions-toolbar"
            className="p-2.5 bg-[#121218] border-t border-indigo-500/40 shadow-xl flex flex-col gap-2 z-20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white">
                  {selectedTaskIds.size} Task{selectedTaskIds.size > 1 ? 's' : ''} Selected
                </span>
              </div>
              
              <button
                onClick={clearSelection}
                className="text-[10px] font-mono text-[#8e8e93] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Clear</span>
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* BATCH APPROVAL / REJECTION BAR IF WAITING APPROVAL TASKS SELECTED */}
            {selectedWaitingApprovalTasks.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    {selectedWaitingApprovalTasks.length} Pending Approval
                  </span>
                  <button
                    onClick={handleOpenBatchApprovalModal}
                    className="text-amber-400 hover:text-amber-200 underline font-semibold cursor-pointer"
                  >
                    Review in Modal
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  <button
                    id="batch-approve-tasks-btn"
                    onClick={handleBatchApprovePending}
                    disabled={isBulkActionLoading}
                    className="py-1 px-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Approve ({selectedWaitingApprovalTasks.length})</span>
                  </button>
                  <button
                    id="batch-reject-tasks-btn"
                    onClick={handleBatchRejectPending}
                    disabled={isBulkActionLoading}
                    className="py-1 px-2 rounded-md bg-[#181820] hover:bg-rose-950/50 text-rose-300 border border-rose-500/40 font-medium text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reject ({selectedWaitingApprovalTasks.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* General Batch Status and Delete Operations */}
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {/* Batch Status Update Menu Toggle */}
              <div className="relative">
                <button
                  id="bulk-status-toggle-btn"
                  onClick={() => setBulkStatusMenuOpen(!bulkStatusMenuOpen)}
                  disabled={isBulkActionLoading}
                  className="w-full py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                  <span>Update Status</span>
                  <ChevronUp className={`w-3 h-3 transition-transform ${bulkStatusMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Status Dropdown Popover */}
                {bulkStatusMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#14141c] border border-indigo-500/40 rounded-xl p-1.5 shadow-2xl z-30 space-y-1">
                    <div className="text-[9px] text-[#71717a] font-mono px-2 py-0.5">SET STATUS TO:</div>
                    {[
                      { id: 'completed', label: 'Completed', color: 'text-emerald-400 hover:bg-emerald-950/40' },
                      { id: 'running', label: 'Running', color: 'text-indigo-400 hover:bg-indigo-950/40' },
                      { id: 'waiting_approval', label: 'Waiting Approval', color: 'text-amber-400 hover:bg-amber-950/40' },
                      { id: 'failed', label: 'Failed', color: 'text-red-400 hover:bg-red-950/40' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleBulkStatusChange(s.id as any)}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-mono transition cursor-pointer flex items-center gap-1.5 ${s.color}`}
                      >
                        <Check className="w-3 h-3 opacity-70" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Deletion Button */}
              <button
                id="bulk-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isBulkActionLoading}
                className="py-1.5 px-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Delete ({selectedTaskIds.size})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Inspector */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0a0a0c]">
        {activeTask ? (
          <div className="max-w-3xl space-y-4">
            
            {/* Header info card */}
            <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    Task Execution Trace: {activeTask.id}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#141418] text-[#8e8e93] border border-[#27272a] uppercase">
                    {activeTask.mode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#71717a]">
                    {new Date(activeTask.createdAt).toLocaleTimeString()}
                  </span>

                  {/* Single Task Delete */}
                  <button
                    onClick={() => handleDeleteSingle(activeTask.id)}
                    className="p-1 rounded text-[#71717a] hover:text-red-400 hover:bg-[#18181c] transition cursor-pointer"
                    title="Delete this task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-sm font-semibold text-[#e0e0e0]">
                "{activeTask.prompt}"
              </h2>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1a1a20]">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#71717a] text-[11px]">Quick Status:</span>
                  <select
                    value={activeTask.status}
                    onChange={(e) => handleSingleStatusChange(activeTask.id, e.target.value as any)}
                    className="bg-[#141418] border border-[#27272a] text-white text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="completed">Completed</option>
                    <option value="running">Running</option>
                    <option value="waiting_approval">Waiting Approval</option>
                    <option value="failed">Failed</option>
                    <option value="planning">Planning</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8e8e93]">
                  <span>Tokens: <strong className="text-white">{activeTask.tokensUsed || 0}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-emerald-400">{activeTask.executionDurationMs}ms</strong></span>
                </div>
              </div>

              {/* Metric stats breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
                  <span className="text-[#71717a] block text-[9px]">STATUS</span>
                  <span className="font-semibold text-[#e0e0e0] uppercase text-[11px]">{activeTask.status}</span>
                </div>
                <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
                  <span className="text-[#71717a] block text-[9px]">SUBTASKS</span>
                  <span className="font-semibold text-indigo-300 text-[11px]">{activeTask.subTasks?.length || 0} planned</span>
                </div>
                <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
                  <span className="text-[#71717a] block text-[9px]">TOOL TRACES</span>
                  <span className="font-semibold text-purple-300 text-[11px]">{activeTask.traces?.length || 0} executed</span>
                </div>
                <div className="bg-[#141418] border border-[#1f1f23] rounded-md p-2">
                  <span className="text-[#71717a] block text-[9px]">DURATION</span>
                  <span className="font-semibold text-emerald-300 text-[11px]">{activeTask.executionDurationMs}ms</span>
                </div>
              </div>

              {/* Pending Human-in-the-Loop Interceptor Alert */}
              {activeTask.pendingApproval && (
                <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Action Paused: {activeTask.pendingApproval.title}</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/30 uppercase font-bold">
                      Awaiting Approval
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90">
                    {activeTask.pendingApproval.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn-task-approve"
                      onClick={() => onApproveAction && onApproveAction(activeTask.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Approve & Dispatch</span>
                    </button>
                    {onOpenApproval && (
                      <button
                        id="btn-task-review"
                        onClick={() => onOpenApproval(activeTask.pendingApproval!)}
                        className="px-2.5 py-1 rounded-md bg-[#18181c] hover:bg-[#222228] text-amber-300 font-medium text-xs border border-amber-500/30 transition cursor-pointer"
                      >
                        Review / Edit Payload
                      </button>
                    )}
                    {onRejectAction && (
                      <button
                        id="btn-task-reject"
                        onClick={() => onRejectAction(activeTask.id)}
                        className="px-2.5 py-1 rounded-md bg-[#18181c] hover:bg-red-950/40 text-[#8e8e93] hover:text-red-300 text-xs border border-[#27272a] transition cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-tasks & Execution DAG Plan Breakdown */}
            {activeTask.subTasks && activeTask.subTasks.length > 0 && (
              <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2">
                  <div className="flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
                      Sub-Task Execution Plan
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#71717a]">
                    {activeTask.subTasks.filter(s => s.status === 'completed').length} of {activeTask.subTasks.length} resolved
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTask.subTasks.map((st, i) => (
                    <div 
                      key={st.id || i}
                      className="bg-[#141418] border border-[#1f1f23] rounded-lg p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#71717a]">#{i + 1}</span>
                          <h4 className="text-xs font-semibold text-[#e0e0e0]">{st.title}</h4>
                        </div>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                          st.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          st.status === 'running' ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/30 animate-pulse' :
                          st.status === 'failed' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                          'bg-[#1a1a20] text-[#8e8e93]'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                        {st.description}
                      </p>
                      {st.dependencies && st.dependencies.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#71717a] pt-1">
                          <span>Depends on:</span>
                          {st.dependencies.map(dep => (
                            <span key={dep} className="px-1 py-0.2 rounded bg-[#1c1c24] text-indigo-300 border border-[#27272e]">
                              {dep}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gantt Timeline View Integration */}
            <TaskGanttTimeline task={activeTask} />

            {/* Tool Execution Traces */}
            <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#e0e0e0] font-bold">
                    Autonomous Tool Call Traces
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#71717a]">
                  {activeTask.traces?.length || 0} calls
                </span>
              </div>

              {activeTask.traces && activeTask.traces.length > 0 ? (
                <div className="space-y-2">
                  {activeTask.traces.map((trace) => (
                    <div 
                      key={trace.id}
                      className="bg-[#141418] border border-[#1f1f23] rounded-lg p-3 space-y-2 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-300">{trace.toolName}</span>
                          <span className="text-[10px] text-[#71717a]">({trace.durationMs}ms)</span>
                        </div>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded ${
                          trace.status === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                          trace.status === 'failed' ? 'bg-red-950/60 text-red-400 border border-red-500/30' :
                          'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        }`}>
                          {trace.status}
                        </span>
                      </div>

                      {/* Input JSON */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#71717a] uppercase">Arguments / Input:</span>
                        <pre className="text-[11px] bg-[#0a0a0c] p-2 rounded border border-[#1f1f23] text-[#d4d4d8] overflow-x-auto">
                          {JSON.stringify(trace.toolInput, null, 2)}
                        </pre>
                      </div>

                      {/* Output JSON */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#71717a] uppercase">Output Result:</span>
                        <pre className="text-[11px] bg-[#0a0a0c] p-2 rounded border border-[#1f1f23] text-emerald-300/90 overflow-x-auto max-h-40">
                          {typeof trace.toolOutput === 'string' 
                            ? trace.toolOutput 
                            : JSON.stringify(trace.toolOutput, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#71717a] font-mono text-center py-4">
                  No tool invocations recorded for this task.
                </p>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#52525b] text-xs font-mono">
            Select a task from the left to view its execution traces and telemetry.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141c] border border-red-500/40 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-950/60 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Selected Tasks</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Are you sure you want to delete {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''}? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f1f26]">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#242430] text-[#a1a1aa] hover:text-white text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono cursor-pointer shadow"
              >
                Confirm Delete ({selectedTaskIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
