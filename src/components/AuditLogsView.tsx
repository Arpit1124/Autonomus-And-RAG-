import React, { useState, useMemo } from 'react';
import { AuditLogEntry } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Layers, 
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  RotateCcw,
  X,
  FileSpreadsheet,
  FileJson,
  Eye,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface Props {
  logs: AuditLogEntry[];
}

type SortColumn = 'timestamp' | 'severity' | 'actor' | 'action' | 'details' | 'targetEntityId';
type SortDirection = 'asc' | 'desc';
type DatePreset = 'all' | 'today' | 'last24h' | 'last7d' | 'last30d' | 'custom';

export const AuditLogsView: React.FC<Props> = ({ logs }) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selected Log for Modal Inspection
  const [inspectedLog, setInspectedLog] = useState<AuditLogEntry | null>(null);

  // Extract unique actors and roles dynamically
  const uniqueActors = useMemo(() => {
    const actorsSet = new Set<string>();
    logs.forEach(l => {
      if (l.actor) actorsSet.add(l.actor);
    });
    return Array.from(actorsSet).sort();
  }, [logs]);

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'timestamp' || column === 'severity' ? 'desc' : 'asc');
    }
  };

  // Severity Weight Map for sorting
  const severityRank: Record<string, number> = {
    critical: 4,
    warning: 3,
    info: 2,
    success: 1
  };

  // Filtered and Sorted Logs
  const filteredAndSortedLogs = useMemo(() => {
    const now = new Date().getTime();

    const filtered = logs.filter(log => {
      // Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
        return false;
      }

      // Actor filter
      if (selectedActor !== 'all' && log.actor !== selectedActor && log.userRole !== selectedActor) {
        return false;
      }

      // Search query (multi-field)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action?.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q);
        const matchesActor = log.actor?.toLowerCase().includes(q);
        const matchesRole = log.userRole?.toLowerCase().includes(q);
        const matchesTarget = log.targetEntityId?.toLowerCase().includes(q);
        const matchesIp = log.ipAddress?.toLowerCase().includes(q);
        if (!matchesAction && !matchesDetails && !matchesActor && !matchesRole && !matchesTarget && !matchesIp) {
          return false;
        }
      }

      // Date Filtering
      const logTime = new Date(log.timestamp).getTime();
      if (isNaN(logTime)) return true;

      if (datePreset === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (logTime < todayStart.getTime()) return false;
      } else if (datePreset === 'last24h') {
        const cutoff24h = now - 24 * 60 * 60 * 1000;
        if (logTime < cutoff24h) return false;
      } else if (datePreset === 'last7d') {
        const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
        if (logTime < cutoff7d) return false;
      } else if (datePreset === 'last30d') {
        const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
        if (logTime < cutoff30d) return false;
      } else if (datePreset === 'custom') {
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          if (logTime < startMs) return false;
        }
        if (endDate) {
          // Set to end of the day for endDate
          const endMs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          if (logTime > endMs) return false;
        }
      }

      return true;
    });

    // Sort logs
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'timestamp': {
          const timeA = new Date(a.timestamp).getTime() || 0;
          const timeB = new Date(b.timestamp).getTime() || 0;
          comparison = timeA - timeB;
          break;
        }
        case 'severity': {
          const rankA = severityRank[a.severity] || 0;
          const rankB = severityRank[b.severity] || 0;
          comparison = rankA - rankB;
          break;
        }
        case 'actor': {
          comparison = (a.actor || '').localeCompare(b.actor || '');
          break;
        }
        case 'action': {
          comparison = (a.action || '').localeCompare(b.action || '');
          break;
        }
        case 'details': {
          comparison = (a.details || '').localeCompare(b.details || '');
          break;
        }
        case 'targetEntityId': {
          comparison = (a.targetEntityId || '').localeCompare(b.targetEntityId || '');
          break;
        }
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [logs, selectedCategory, selectedSeverity, selectedActor, searchQuery, datePreset, startDate, endDate, sortColumn, sortDirection]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSeverity('all');
    setSelectedActor('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedCategory !== 'all' || 
    selectedSeverity !== 'all' || 
    selectedActor !== 'all' || 
    datePreset !== 'all' || 
    startDate !== '' || 
    endDate !== '';

  const getSeverityBadge = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'warning':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'success':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'info':
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
    }
  };

  // Export Filtered Logs to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Category', 'Actor', 'User Role', 'Action', 'Target Entity', 'IP Address', 'Details'];
    const rows = filteredAndSortedLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.severity}"`,
      `"${l.category}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.userRole}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.targetEntityId || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || 'Internal'}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WaferGuard_Compliance_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Filtered Logs to JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredAndSortedLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WaferGuard_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`;
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
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Semiconductor Security & Quality Compliance Audit Trail</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              ISO 9001 / SEMI E10
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Immutable Audit Trail of Inspection Decisions, Root-Cause Syntheses, Human Sign-Offs & Tool Locks
          </p>
        </div>

        {/* Action Controls & Total Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs font-mono text-[#8e8e98] bg-[#121218] border border-[#23232c] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="text-indigo-300 font-bold">{filteredAndSortedLogs.length}</span>
            <span>of {logs.length} events</span>
          </div>

          <button
            id="audit-export-csv-btn"
            onClick={handleExportCSV}
            title="Export filtered records to CSV"
            className="px-2.5 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1e1e2c] border border-[#2d2d3d] text-xs font-mono text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            id="audit-export-json-btn"
            onClick={handleExportJSON}
            title="Export filtered records to JSON"
            className="px-2.5 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1e1e2c] border border-[#2d2d3d] text-xs font-mono text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Primary Search & Quick Filter Bar */}
      <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-3 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Multi-field Search Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white focus-within:border-indigo-500 transition">
            <Search className="w-3.5 h-3.5 text-[#8e8e98] shrink-0" />
            <input
              id="audit-search-input"
              type="text"
              placeholder="Search by action, details, actor, target entity, role, or IP..."
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

          {/* Category Dropdown */}
          <select
            id="audit-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="inspection">Inspection Events</option>
            <option value="rca">Root-Cause Analysis</option>
            <option value="approval">Human Approvals</option>
            <option value="machine">Machine Fleet</option>
            <option value="knowledge">Knowledge Base</option>
            <option value="auth">Auth & Security</option>
            <option value="system">System Core</option>
          </select>

          {/* Severity Dropdown */}
          <select
            id="audit-severity-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (P0)</option>
            <option value="warning">Warning</option>
            <option value="info">Informational</option>
            <option value="success">Success / Verified</option>
          </select>

          {/* Assigned Engineer / Actor Dropdown */}
          <select
            id="audit-actor-select"
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-[#14141c] border border-[#242430] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Actors & Roles</option>
            <optgroup label="Assigned Engineers & Operators">
              {uniqueActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </optgroup>
            <optgroup label="System Roles">
              <option value="quality_engineer">Quality Engineer</option>
              <option value="production_manager">Production Manager</option>
              <option value="process_engineer">Process Engineer</option>
              <option value="inspector">Inspector</option>
              <option value="admin">Administrator</option>
            </optgroup>
          </select>

          {/* Toggle Advanced / Date Filters */}
          <button
            id="audit-toggle-advanced-filters"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
              showAdvancedFilters || datePreset !== 'all'
                ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                : 'bg-[#14141c] border-[#242430] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Date & Advanced</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              id="audit-reset-filters-btn"
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
              <span>Date Filter:</span>
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

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Category: {selectedCategory}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedCategory('all')} />
              </span>
            )}

            {selectedSeverity !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Severity: {selectedSeverity}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedSeverity('all')} />
              </span>
            )}

            {selectedActor !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181824] border border-indigo-500/40 text-indigo-300 text-[10px]">
                Actor: {selectedActor}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-white" onClick={() => setSelectedActor('all')} />
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

      {/* Audit Log Table with Interactive Sorting Headers */}
      <div className="bg-[#0c0c10] border border-[#1f1f26] rounded-xl p-4 flex-1 flex flex-col space-y-2 font-mono text-xs overflow-hidden">
        {filteredAndSortedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#14141e] border border-[#242432] flex items-center justify-center text-[#71717a]">
              <Filter className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">No Compliance Audit Logs Found</div>
            <p className="text-xs text-[#8e8e98] max-w-md">
              No audit trail events match your current filter parameters or search term. Try adjusting your date range, severity level, or clearing all active filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0c0c10] z-10">
                <tr className="border-b border-[#232330] text-[10px] text-[#71717a] uppercase select-none">
                  {/* Timestamp Column */}
                  <th 
                    id="th-timestamp"
                    onClick={() => handleSort('timestamp')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      {renderSortIndicator('timestamp')}
                    </div>
                  </th>

                  {/* Severity Column */}
                  <th 
                    id="th-severity"
                    onClick={() => handleSort('severity')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Severity</span>
                      {renderSortIndicator('severity')}
                    </div>
                  </th>

                  {/* Actor / Role Column */}
                  <th 
                    id="th-actor"
                    onClick={() => handleSort('actor')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Actor / Role</span>
                      {renderSortIndicator('actor')}
                    </div>
                  </th>

                  {/* Action Column */}
                  <th 
                    id="th-action"
                    onClick={() => handleSort('action')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action Event</span>
                      {renderSortIndicator('action')}
                    </div>
                  </th>

                  {/* Details Column */}
                  <th 
                    id="th-details"
                    onClick={() => handleSort('details')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Audit Description</span>
                      {renderSortIndicator('details')}
                    </div>
                  </th>

                  {/* Target Column */}
                  <th 
                    id="th-target"
                    onClick={() => handleSort('targetEntityId')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition group"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Target Entity</span>
                      {renderSortIndicator('targetEntityId')}
                    </div>
                  </th>

                  {/* Inspect Action */}
                  <th className="py-2.5 px-2 text-center">
                    <span className="sr-only">Inspect</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181824] text-xs">
                {filteredAndSortedLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setInspectedLog(log)}
                    className="hover:bg-[#141420] transition cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 text-[#71717a] whitespace-nowrap font-mono">
                      <div className="text-white">{log.timestamp.replace('T', ' ').substring(0, 10)}</div>
                      <div className="text-[10px] text-[#71717a]">{log.timestamp.substring(11, 19)} UTC</div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>

                    {/* Actor & Role */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{log.actor}</span>
                      </div>
                      <div className="text-[9px] text-[#71717a] uppercase font-mono">
                        {log.userRole?.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-indigo-300 font-semibold max-w-[220px] truncate">
                      {log.action}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-3 text-[#a1a1aa] font-sans text-xs max-w-md line-clamp-2">
                      {log.details}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-3 text-right text-[#94a3b8] font-mono whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#161622] border border-[#252536] text-[10px]">
                        {log.targetEntityId || '—'}
                      </span>
                    </td>

                    {/* Inspect Icon */}
                    <td className="py-3 px-2 text-center text-[#71717a] group-hover:text-indigo-400 transition">
                      <Eye className="w-3.5 h-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e0e14] border border-[#232332] rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl font-mono text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#20202c] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">Audit Event Inspection: {inspectedLog.id}</h3>
              </div>
              <button 
                onClick={() => setInspectedLog(null)}
                className="text-[#71717a] hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#13131c] p-3.5 rounded-xl border border-[#222230]">
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Timestamp (ISO)</span>
                <span className="text-white">{inspectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Severity Level</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getSeverityBadge(inspectedLog.severity)}`}>
                  {inspectedLog.severity}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Actor / Identity</span>
                <span className="text-indigo-300 font-semibold">{inspectedLog.actor}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Role Classification</span>
                <span className="text-[#a1a1aa] uppercase">{inspectedLog.userRole?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Target Entity ID</span>
                <span className="text-cyan-300">{inspectedLog.targetEntityId || 'Global System'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase block font-bold">Network Origin IP</span>
                <span className="text-[#a1a1aa]">{inspectedLog.ipAddress || '10.240.12.88 (Internal VPC)'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-[#71717a] uppercase block font-bold">Action Event:</span>
              <div className="p-2.5 rounded-lg bg-[#14141e] border border-[#242436] text-indigo-300 font-bold">
                {inspectedLog.action}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-[#71717a] uppercase block font-bold">Full Audit Narrative & Evidence Payload:</span>
              <div className="p-3 rounded-lg bg-[#14141e] border border-[#242436] text-[#e0e0e8] font-sans text-xs leading-relaxed">
                {inspectedLog.details}
              </div>
            </div>

            <div className="border-t border-[#20202c] pt-3 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

