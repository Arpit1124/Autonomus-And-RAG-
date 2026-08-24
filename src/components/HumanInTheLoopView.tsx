import React, { useState, useMemo } from 'react';
import { CorrectiveAction, UserProfile } from '../types';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lock, 
  RefreshCw, 
  UserCheck, 
  CheckSquare,
  Square,
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  RotateCcw,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileJson,
  LayoutList,
  Table as TableIcon
} from 'lucide-react';

interface Props {
  actions: CorrectiveAction[];
  currentUser: UserProfile;
  onApproveAction: (actionId: string, notes?: string) => void;
  onRejectAction: (actionId: string, notes?: string) => void;
  onBatchApprove?: (actionIds: string[], notes?: string) => void | Promise<void>;
  onBatchReject?: (actionIds: string[], notes?: string) => void | Promise<void>;
  onRequestReinspection: (waferId: string) => void;
}

type SortColumn = 'priority' | 'createdAt' | 'status' | 'title' | 'targetEntity' | 'assignedRole';
type SortDirection = 'asc' | 'desc';
type DatePreset = 'all' | 'today' | 'last24h' | 'last7d' | 'last30d' | 'custom';
type ViewMode = 'split' | 'table';

export const HumanInTheLoopView: React.FC<Props> = ({
  actions,
  currentUser,
  onApproveAction,
  onRejectAction,
  onBatchApprove,
  onBatchReject,
  onRequestReinspection
}) => {
  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selection & Decision
  const [selectedActionId, setSelectedActionId] = useState<string | null>(actions[0]?.id || null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');
  const [selectedActionList, setSelectedActionList] = useState<Set<string>>(new Set());
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  const canApprove = Boolean(currentUser?.permissions?.canApproveCorrectiveActions) && currentUser?.role !== 'viewer' && currentUser?.role !== 'inspector';

  // Dynamic unique roles & assignees from actions
  const uniqueRoles = useMemo(() => {
    const roleSet = new Set<string>();
    actions.forEach(a => {
      if (a.assignedRole) roleSet.add(a.assignedRole);
      if (a.approvedBy) roleSet.add(a.approvedBy);
    });
    return Array.from(roleSet).sort();
  }, [actions]);

  // Priority Rank for Sorting
  const priorityRank: Record<string, number> = {
    P0: 1,
    P1: 2,
    P2: 3
  };

  // Status Rank for Sorting
  const statusRank: Record<string, number> = {
    pending: 1,
    in_progress: 2,
    approved: 3,
    rejected: 4,
    completed: 5
  };

  // Handle Sort Column Toggle
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'createdAt' ? 'desc' : 'asc');
    }
  };

  // Filtered and Sorted Corrective Actions
  const filteredAndSortedActions = useMemo(() => {
    const now = new Date().getTime();

    const filtered = actions.filter(act => {
      // Status filter
      if (selectedStatus !== 'all' && act.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && act.priority !== selectedPriority) {
        return false;
      }

      // Assigned Role or Approver filter
      if (selectedRole !== 'all' && act.assignedRole !== selectedRole && act.approvedBy !== selectedRole) {
        return false;
      }

      // Multi-field search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title?.toLowerCase().includes(q);
        const matchesDesc = act.description?.toLowerCase().includes(q);
        const matchesTarget = act.targetEntity?.toLowerCase().includes(q);
        const matchesWafer = act.waferId?.toLowerCase().includes(q);
        const matchesRca = act.supportingRcaTitle?.toLowerCase().includes(q);
        const matchesRole = act.assignedRole?.toLowerCase().includes(q);
        const matchesApprover = act.approvedBy?.toLowerCase().includes(q);
        const matchesId = act.id?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesDesc && !matchesTarget && !matchesWafer && !matchesRca && !matchesRole && !matchesApprover && !matchesId) {
          return false;
        }
      }

      // Date Filtering
      const actTime = new Date(act.createdAt).getTime();
      if (isNaN(actTime)) return true;

      if (datePreset === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (actTime < todayStart.getTime()) return false;
      } else if (datePreset === 'last24h') {
        const cutoff24h = now - 24 * 60 * 60 * 1000;
        if (actTime < cutoff24h) return false;
      } else if (datePreset === 'last7d') {
        const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
        if (actTime < cutoff7d) return false;
      } else if (datePreset === 'last30d') {
        const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
        if (actTime < cutoff30d) return false;
      } else if (datePreset === 'custom') {
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          if (actTime < startMs) return false;
        }
        if (endDate) {
          const endMs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          if (actTime > endMs) return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'priority': {
          const rankA = priorityRank[a.priority] || 99;
          const rankB = priorityRank[b.priority] || 99;
          comparison = rankA - rankB;
          break;
        }
        case 'createdAt': {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          comparison = timeA - timeB;
          break;
        }
        case 'status': {
          const rankA = statusRank[a.status] || 99;
          const rankB = statusRank[b.status] || 99;
          comparison = rankA - rankB;
          break;
        }
        case 'title': {
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        }
        case 'targetEntity': {
          comparison = (a.targetEntity || '').localeCompare(b.targetEntity || '');
          break;
        }
        case 'assignedRole': {
          comparison = (a.assignedRole || '').localeCompare(b.assignedRole || '');
          break;
        }
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [actions, selectedStatus, selectedPriority, selectedRole, searchQuery, datePreset, startDate, endDate, sortColumn, sortDirection]);

  // Ensure active action is valid
  const activeAction = filteredAndSortedActions.find(a => a.id === selectedActionId) || filteredAndSortedActions[0] || actions[0];

  // Batch Selection Handlers
  const toggleSelectAction = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedActionList(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedActionList.size === filteredAndSortedActions.length) {
      setSelectedActionList(new Set());
    } else {
      setSelectedActionList(new Set(filteredAndSortedActions.map(a => a.id)));
    }
  };

  const handleSelectPendingOnly = () => {
    const pendingIds = filteredAndSortedActions.filter(a => a.status === 'pending').map(a => a.id);
    setSelectedActionList(new Set(pendingIds));
  };

  const handleSelectCriticalOnly = () => {
    const criticalIds = filteredAndSortedActions.filter(a => a.priority === 'P0').map(a => a.id);
    setSelectedActionList(new Set(criticalIds));
  };

  const handleClearSelection = () => {
    setSelectedActionList(new Set());
  };

  const handleBatchApprove = async () => {
    if (!canApprove || selectedActionList.size === 0) return;
    setIsProcessingBatch(true);
    const actionIds = Array.from(selectedActionList);
    const notesText = batchNotes.trim() || `Batch Authorization signed-off by ${currentUser.name} (${currentUser.role})`;

    try {
      if (onBatchApprove) {
        await onBatchApprove(actionIds, notesText);
      } else {
        actionIds.forEach(id => onApproveAction(id, notesText));
      }
      setBatchSuccessMsg(`Successfully batch approved ${actionIds.length} corrective actions. Individual compliance audit entries generated.`);
      setSelectedActionList(new Set());
      setBatchNotes('');
      setTimeout(() => setBatchSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Batch Approval Failed: ${err?.message}`);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchReject = async () => {
    if (!canApprove || selectedActionList.size === 0) return;
    setIsProcessingBatch(true);
    const actionIds = Array.from(selectedActionList);
    const notesText = batchNotes.trim() || `Batch Rejection issued by ${currentUser.name} (${currentUser.role})`;

    try {
      if (onBatchReject) {
        await onBatchReject(actionIds, notesText);
      } else {
        actionIds.forEach(id => onRejectAction(id, notesText));
      }
      setBatchSuccessMsg(`Successfully batch rejected ${actionIds.length} corrective actions. Audit log recorded.`);
      setSelectedActionList(new Set());
      setBatchNotes('');
      setTimeout(() => setBatchSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Batch Rejection Failed: ${err?.message}`);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedRole('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedStatus !== 'all' || 
    selectedPriority !== 'all' || 
    selectedRole !== 'all' || 
    datePreset !== 'all' || 
    startDate !== '' || 
    endDate !== '';

  const getPriorityBadge = (priority: CorrectiveAction['priority']) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'P1':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'P2':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    }
  };

  const getStatusBadge = (status: CorrectiveAction['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'rejected':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'in_progress':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
      case 'completed':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50';
      case 'pending':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    }
  };

  // Export Filtered Actions to CSV
  const handleExportCSV = () => {
    const headers = ['Action ID', 'Priority', 'Status', 'Title', 'Target Entity', 'Assigned Role', 'Wafer ID', 'Created At', 'Approved By', 'Description'];
    const rows = filteredAndSortedActions.map(a => [
      `"${a.id}"`,
      `"${a.priority}"`,
      `"${a.status}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.targetEntity.replace(/"/g, '""')}"`,
      `"${a.assignedRole}"`,
      `"${a.waferId}"`,
      `"${a.createdAt}"`,
      `"${a.approvedBy || ''}"`,
      `"${a.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Corrective_Actions_Compliance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Filtered Actions to JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredAndSortedActions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Corrective_Actions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render column sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-[#52525b] opacity-0 group-hover:opacity-100 transition" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 font-bold" />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Human-in-the-Loop Governance & Corrective Action Center</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Zero-Trust AI Gatekeeper
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Review, Approve, Modify or Reject AI-synthesized quarantine orders, chamber lockouts, and engineering recipes
          </p>
        </div>

        {/* Action Controls & Total Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#121218] border border-[#23232c] rounded-lg p-0.5 font-mono text-xs">
            <button
              id="hitl-view-split-btn"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
              }`}
              title="Split Queue & Review Panel"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              id="hitl-view-table-btn"
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e98] hover:text-white'
              }`}
              title="Full Sortable Table Matrix"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <div className="text-xs font-mono text-[#8e8e98] bg-[#121218] border border-[#23232c] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-indigo-300 font-bold">{filteredAndSortedActions.length}</span>
            <span>of {actions.length} actions</span>
          </div>

          <button
            id="hitl-export-csv-btn"
            onClick={handleExportCSV}
            title="Export filtered corrective actions to CSV"
            className="px-2.5 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1e1e2c] border border-[#2d2d3d] text-xs font-mono text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            id="hitl-export-json-btn"
            onClick={handleExportJSON}
            title="Export filtered corrective actions to JSON"
            className="px-2.5 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1e1e2c] border border-[#2d2d3d] text-xs font-mono text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          {/* User Role Badge */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#8e8e98] bg-[#121218] border border-[#23232c] px-3 py-1.5 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong className="text-white">{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})</span>
          </div>
        </div>
      </div>

      {/* Role-Based Access Banner if User Lacks Approval Authority */}
      {!canApprove && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-amber-300 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>View-Only Mode (Role: {currentUser.role.toUpperCase()}): </strong> 
              Sign-off & approval actions are restricted to Quality Engineers, Production Managers, and Administrators.
            </span>
          </div>
          <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/30 uppercase font-bold">
            SEMI E10 RBAC
          </span>
        </div>
      )}

      {/* Search & Advanced Filters Bar */}
      <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Multi-field Search Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white focus-within:border-indigo-500 transition">
            <Search className="w-3.5 h-3.5 text-[#8e8e98] shrink-0" />
            <input
              id="hitl-search-input"
              type="text"
              placeholder="Filter actions by title, wafer ID, target tool, RCA, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-[#71717a] w-full font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[#71717a] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action Status Filter */}
          <select
            id="hitl-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Action Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved & Executed</option>
            <option value="rejected">Rejected / Overruled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            id="hitl-priority-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="P0">P0 - Critical Quarantine</option>
            <option value="P1">P1 - High Investigation</option>
            <option value="P2">P2 - Preventive Tune</option>
          </select>

          {/* Assigned Engineer / Role Filter */}
          <select
            id="hitl-role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Assignees & Roles</option>
            <optgroup label="Assigned Engineering Disciplines">
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </optgroup>
          </select>

          {/* Sort By Dropdown (Especially useful in Split mode) */}
          <select
            id="hitl-sort-select"
            value={`${sortColumn}-${sortDirection}`}
            onChange={(e) => {
              const [col, dir] = e.target.value.split('-') as [SortColumn, SortDirection];
              setSortColumn(col);
              setSortDirection(dir);
            }}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="priority-asc">Sort: Priority (P0 → P2)</option>
            <option value="priority-desc">Sort: Priority (P2 → P0)</option>
            <option value="createdAt-desc">Sort: Newest First</option>
            <option value="createdAt-asc">Sort: Oldest First</option>
            <option value="status-asc">Sort: Status (Pending First)</option>
            <option value="title-asc">Sort: Title (A → Z)</option>
            <option value="targetEntity-asc">Sort: Target Tool (A → Z)</option>
          </select>

          {/* Toggle Advanced / Date Filters */}
          <button
            id="hitl-toggle-advanced-filters"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
              showAdvancedFilters || datePreset !== 'all'
                ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                : 'bg-[#14141c] border-[#242430] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Date & Presets</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              id="hitl-reset-filters-btn"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Expandable Advanced Date Range Filters */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-[#1f1f26] flex flex-wrap items-center gap-3 bg-[#111116] p-2.5 rounded-lg">
            <div className="flex items-center gap-1.5 text-[#8e8e98]">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Date Range:</span>
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'today', 'last24h', 'last7d', 'last30d', 'custom'] as DatePreset[]).map(preset => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                    datePreset === preset
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-[#181822] text-[#a1a1aa] hover:text-white hover:bg-[#20202e]'
                  }`}
                >
                  {preset === 'all' && 'All Time'}
                  {preset === 'today' && 'Today'}
                  {preset === 'last24h' && 'Last 24h'}
                  {preset === 'last7d' && 'Last 7 Days'}
                  {preset === 'last30d' && 'Last 30 Days'}
                  {preset === 'custom' && 'Custom Range'}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap pl-2 border-l border-[#242432]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a]">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#181824] border border-[#2d2d3e] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a]">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#181824] border border-[#2d2d3e] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Chips / Pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-[#71717a] uppercase font-bold">Active Filters:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Search: "{searchQuery}"
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Status: {selectedStatus}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedStatus('all')} />
              </span>
            )}

            {selectedPriority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Priority: {selectedPriority}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedPriority('all')} />
              </span>
            )}

            {selectedRole !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Assignee: {selectedRole}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedRole('all')} />
              </span>
            )}

            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Date: {datePreset === 'custom' ? `${startDate || 'Start'} → ${endDate || 'End'}` : datePreset}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => { setDatePreset('all'); setStartDate(''); setEndDate(''); }} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {batchSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between font-mono text-xs text-emerald-300 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{batchSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setBatchSuccessMsg(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Batch Operations Bar (Docked when items selected) */}
      {selectedActionList.size > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-[#121220] to-[#0c0c14] border border-indigo-500/50 rounded-xl font-mono text-xs shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                {selectedActionList.size}
              </span>
              <span>Corrective Action{selectedActionList.size > 1 ? 's' : ''} Selected</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <button
                onClick={handleSelectPendingOnly}
                className="px-2 py-1 rounded bg-[#1c1c2c] hover:bg-indigo-900/60 border border-[#303046] text-[#c4c4d0] hover:text-white transition cursor-pointer"
              >
                Select Pending Only
              </button>
              <button
                onClick={handleSelectCriticalOnly}
                className="px-2 py-1 rounded bg-[#1c1c2c] hover:bg-red-900/60 border border-[#303046] text-[#c4c4d0] hover:text-white transition cursor-pointer"
              >
                Select P0 Critical
              </button>
              <button
                onClick={handleClearSelection}
                className="px-2 py-1 rounded bg-[#1c1c2c] hover:bg-[#28283c] border border-[#303046] text-[#8e8e98] hover:text-white transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Batch authorization notes (optional)..."
              className="bg-[#0e0e16] border border-[#2a2a3e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#626270] focus:outline-none focus:border-indigo-500 font-mono w-full sm:w-64"
            />

            <div className="flex items-center gap-2">
              <button
                disabled={!canApprove || isProcessingBatch}
                onClick={handleBatchApprove}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Batch Approve ({selectedActionList.size})</span>
              </button>

              <button
                disabled={!canApprove || isProcessingBatch}
                onClick={handleBatchReject}
                className="px-3 py-1.5 rounded-lg bg-red-900/70 hover:bg-red-800 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Batch Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Items Found Fallback */}
      {filteredAndSortedActions.length === 0 ? (
        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-full bg-[#14141e] border border-[#242432] flex items-center justify-center text-[#71717a]">
            <Filter className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">No Corrective Actions Match Filter Criteria</div>
          <p className="text-xs text-[#8e8e98] max-w-md">
            No pending or executed corrective action orders match your current filters. Try changing your status, assigned engineer, or clearing filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'split' ? (
        /* Split Mode: Left Action Queue, Right Review & Approval Decision Panel */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
          {/* Left Column: Action Queue (5 cols) */}
          <div className="xl:col-span-5 flex flex-col space-y-3">
            <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3.5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    title="Select / Deselect all visible actions"
                    className="text-[#8e8e98] hover:text-white transition cursor-pointer"
                  >
                    {selectedActionList.size === filteredAndSortedActions.length && filteredAndSortedActions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-[#52525b]" />
                    )}
                  </button>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Action Queue ({filteredAndSortedActions.length})</span>
                  </span>
                </div>

                {canApprove && selectedActionList.size > 0 && (
                  <button
                    onClick={handleBatchApprove}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Batch Approve ({selectedActionList.size})</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {filteredAndSortedActions.map((act) => {
                  const isSelected = activeAction?.id === act.id;
                  const isChecked = selectedActionList.has(act.id);

                  return (
                    <div
                      key={act.id}
                      id={`action-card-${act.id}`}
                      onClick={() => setSelectedActionId(act.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30'
                          : 'bg-[#121218] hover:bg-[#181822] border-[#22222e] text-[#a1a1aa]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleSelectAction(act.id, e)}
                            className="text-[#71717a] hover:text-white shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-[#52525b]" />
                            )}
                          </button>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border shrink-0 ${getPriorityBadge(act.priority)}`}>
                            {act.priority}
                          </span>
                          <span className="font-bold text-white text-xs leading-snug">
                            {act.title}
                          </span>
                        </div>

                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 border ${getStatusBadge(act.status)}`}>
                          {act.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#a1a1aa] font-sans line-clamp-2 leading-relaxed pl-6">
                        {act.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[#71717a] border-t border-white/5 pt-1.5 pl-6">
                        <span>Target: <strong className="text-white">{act.targetEntity}</strong></span>
                        <span>Assignee: <strong className="text-indigo-300">{act.assignedRole}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Review & Execute Decision (7 cols) */}
          <div className="xl:col-span-7 flex flex-col space-y-3 font-sans text-xs">
            {activeAction && (
              <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${getPriorityBadge(activeAction.priority)}`}>
                        {activeAction.priority} ACTION ORDER
                      </span>
                      <h2 className="text-sm font-bold text-white font-mono">{activeAction.title}</h2>
                    </div>
                    <span className="text-[10px] text-[#71717a] font-mono mt-0.5 block">
                      Action ID: {activeAction.id} • Target: {activeAction.targetEntity} • Created: {activeAction.createdAt}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-indigo-300 bg-[#14141e] border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                    Requires {activeAction.assignedRole} Sign-Off
                  </span>
                </div>

                {/* Description & Impact */}
                <div className="bg-[#12121a] border border-[#22222e] rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8e8e98] block">
                    Action Scope & Operating Mandate
                  </span>
                  <p className="text-xs text-[#e0e0e8] leading-relaxed">
                    {activeAction.description}
                  </p>
                  {activeAction.supportingRcaTitle && (
                    <div className="text-[10px] font-mono text-indigo-300 border-t border-white/5 pt-1.5">
                      Supporting RCA: <strong>{activeAction.supportingRcaTitle}</strong>
                    </div>
                  )}
                </div>

                {/* Status Display if already approved/rejected */}
                {activeAction.status !== 'pending' && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 font-mono ${
                    activeAction.status === 'approved'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : activeAction.status === 'rejected'
                      ? 'bg-red-950/50 border-red-500/40 text-red-300'
                      : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Action was <strong>{activeAction.status.toUpperCase()}</strong> by {activeAction.approvedBy || 'Assigned Engineer'} at {activeAction.approvedAt || activeAction.createdAt}.
                    </span>
                  </div>
                )}

                {/* Engineer Notes Input */}
                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-[#8e8e98] text-[10px] uppercase font-bold block">
                    Engineer Decision Rationale / Audit Notes:
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canApprove}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder={
                      canApprove 
                        ? "Enter audit rationale, chamber lockout confirmation, or reinspection directives..."
                        : "Approval notes disabled (View-Only role)"
                    }
                    className="w-full bg-[#12121a] border border-[#22222e] rounded-xl p-3 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>

                {/* Action Decision Buttons */}
                <div className="border-t border-[#1f1f26] pt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <button
                    onClick={() => onRequestReinspection(activeAction.waferId)}
                    className="px-3 py-2 rounded-lg bg-[#181824] hover:bg-[#222232] text-[#d1d1db] border border-[#262638] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Request Optical Re-Scan</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={!canApprove}
                      onClick={() => {
                        if (!canApprove) return;
                        onRejectAction(activeAction.id, decisionNotes);
                        setDecisionNotes('');
                      }}
                      title={!canApprove ? "Role lacks approval permissions" : undefined}
                      className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Action</span>
                    </button>

                    <button
                      disabled={!canApprove}
                      onClick={() => {
                        if (!canApprove) return;
                        onApproveAction(activeAction.id, decisionNotes);
                        setDecisionNotes('');
                      }}
                      title={!canApprove ? "Role lacks approval permissions" : undefined}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {canApprove ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Approve & Execute Order</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Table Matrix Mode with Interactive Column Sorting */
        <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 flex-1 flex flex-col space-y-2 font-mono text-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0c0c10] z-10">
                <tr className="border-b border-[#232330] text-[10px] text-[#71717a] uppercase select-none">
                  {/* Select All */}
                  <th className="py-2.5 px-3 w-8">
                    <button
                      onClick={toggleSelectAll}
                      className="text-[#8e8e98] hover:text-white transition cursor-pointer"
                    >
                      {selectedActionList.size === filteredAndSortedActions.length && filteredAndSortedActions.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-[#52525b]" />
                      )}
                    </button>
                  </th>

                  {/* Priority Column */}
                  <th 
                    id="th-hitl-priority"
                    onClick={() => handleSort('priority')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {renderSortIndicator('priority')}
                    </div>
                  </th>

                  {/* Title & Scope Column */}
                  <th 
                    id="th-hitl-title"
                    onClick={() => handleSort('title')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action Title & Scope</span>
                      {renderSortIndicator('title')}
                    </div>
                  </th>

                  {/* Target Tool Column */}
                  <th 
                    id="th-hitl-target"
                    onClick={() => handleSort('targetEntity')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Target Equipment</span>
                      {renderSortIndicator('targetEntity')}
                    </div>
                  </th>

                  {/* Assigned Engineer / Role Column */}
                  <th 
                    id="th-hitl-role"
                    onClick={() => handleSort('assignedRole')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Assigned Engineer / Role</span>
                      {renderSortIndicator('assignedRole')}
                    </div>
                  </th>

                  {/* Created At Column */}
                  <th 
                    id="th-hitl-date"
                    onClick={() => handleSort('createdAt')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Created Date</span>
                      {renderSortIndicator('createdAt')}
                    </div>
                  </th>

                  {/* Status Column */}
                  <th 
                    id="th-hitl-status"
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>

                  {/* Direct Actions */}
                  <th className="py-2.5 px-3 text-right">
                    <span>Quick Decisions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181824] text-xs">
                {filteredAndSortedActions.map((act) => {
                  const isChecked = selectedActionList.has(act.id);

                  return (
                    <tr 
                      key={act.id} 
                      className="hover:bg-[#141420] transition group cursor-pointer"
                      onClick={() => {
                        setSelectedActionId(act.id);
                        setViewMode('split');
                      }}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleSelectAction(act.id, e)}
                          className="text-[#71717a] hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#52525b]" />
                          )}
                        </button>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getPriorityBadge(act.priority)}`}>
                          {act.priority}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="font-bold text-white leading-snug">{act.title}</div>
                        <div className="text-[10px] text-[#8e8e98] font-sans line-clamp-1 mt-0.5">
                          {act.description}
                        </div>
                      </td>

                      {/* Target Equipment */}
                      <td className="py-3 px-3 text-cyan-300 font-mono whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-[#161622] border border-[#252536] text-[10px]">
                          {act.targetEntity}
                        </span>
                      </td>

                      {/* Assigned Role */}
                      <td className="py-3 px-3 text-indigo-300 font-medium whitespace-nowrap">
                        <div>{act.assignedRole}</div>
                        {act.approvedBy && (
                          <div className="text-[9px] text-[#71717a]">By: {act.approvedBy}</div>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3 text-[#71717a] whitespace-nowrap font-mono">
                        <div className="text-white">{act.createdAt.substring(0, 10)}</div>
                        <div className="text-[10px] text-[#71717a]">{act.createdAt.substring(11, 16)} UTC</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadge(act.status)}`}>
                          {act.status}
                        </span>
                      </td>

                      {/* Direct Quick Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {act.status === 'pending' && canApprove ? (
                            <>
                              <button
                                onClick={() => onApproveAction(act.id, `Approved by ${currentUser.name}`)}
                                title="Approve & Execute Order"
                                className="p-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onRejectAction(act.id, `Rejected by ${currentUser.name}`)}
                                title="Reject Action Order"
                                className="p-1 rounded bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-500/40 transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedActionId(act.id);
                                setViewMode('split');
                              }}
                              className="px-2 py-1 rounded bg-[#181824] hover:bg-[#202030] text-[#a1a1aa] hover:text-white border border-[#2d2d3e] text-[10px] transition cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
