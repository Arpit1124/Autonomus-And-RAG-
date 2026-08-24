import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  LogIn, 
  LogOut, 
  UserCheck, 
  Database, 
  Moon, 
  BrainCircuit, 
  Wrench, 
  Trash2, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Sparkles, 
  Clock, 
  Check, 
  Zap,
  Radio,
  FileCode2,
  Calendar
} from 'lucide-react';
import { SystemActivityEvent, ActivityEventType, ActivitySeverity, UserProfile, GeneratedFile } from '../types';
import { api } from '../services/api';

interface Props {
  events: SystemActivityEvent[];
  onRefresh: () => void;
  onClearLogs: () => void;
  onSeedLogs: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenFile?: (file: GeneratedFile) => void;
  currentUser?: UserProfile | null;
}

export const ActivityLogView: React.FC<Props> = ({
  events,
  onRefresh,
  onClearLogs,
  onSeedLogs,
  onNavigateTab,
  onOpenFile,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-refresh interval for live monitoring
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveActive, onRefresh]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = events.length;
    const taskEvents = events.filter(e => e.type.startsWith('task_')).length;
    const fileEvents = events.filter(e => e.type === 'file_generated').length;
    const approvalEvents = events.filter(e => e.type.startsWith('approval_')).length;
    const authEvents = events.filter(e => e.type.startsWith('user_')).length;
    const knowledgeEvents = events.filter(e => e.type.startsWith('knowledge_')).length;
    return { total, taskEvents, fileEvents, approvalEvents, authEvents, knowledgeEvents };
  }, [events]);

  // Unique users in logs for filtering
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    events.forEach(e => {
      if (e.userId && e.userName) {
        users.set(e.userId, e.userName);
      }
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  // Filtering
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = event.title.toLowerCase().includes(query);
        const matchDesc = event.description.toLowerCase().includes(query);
        const matchUser = event.userName?.toLowerCase().includes(query) || false;
        const matchMeta = JSON.stringify(event.metadata || {}).toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchUser && !matchMeta) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'tasks' && !event.type.startsWith('task_')) return false;
        if (selectedCategory === 'files' && event.type !== 'file_generated') return false;
        if (selectedCategory === 'auth' && !event.type.startsWith('user_')) return false;
        if (selectedCategory === 'approvals' && !event.type.startsWith('approval_')) return false;
        if (selectedCategory === 'knowledge' && !event.type.startsWith('knowledge_')) return false;
        if (selectedCategory === 'sync' && event.type !== 'nightly_sync') return false;
        if (selectedCategory === 'memory' && event.type !== 'memory_updated') return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && event.severity !== selectedSeverity) {
        return false;
      }

      // User filter
      if (selectedUser !== 'all' && event.userId !== selectedUser) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedSeverity, selectedUser]);

  // Export logs to JSON / CSV
  const handleExportJSON = () => {
    setIsExporting(true);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agentos_activity_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => setIsExporting(false), 500);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    const headers = ['Timestamp', 'Type', 'Severity', 'Title', 'Description', 'User', 'TaskID', 'FileID'];
    const rows = filteredEvents.map(e => [
      `"${e.timestamp}"`,
      `"${e.type}"`,
      `"${e.severity}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.userName || ''}"`,
      `"${e.metadata?.taskId || ''}"`,
      `"${e.metadata?.fileId || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `agentos_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => setIsExporting(false), 500);
  };

  const copyEventPayload = (event: SystemActivityEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format relative time
  const formatRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const time = new Date(isoString).getTime();
      const diffSec = Math.floor((now - time) / 1000);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      return `${diffDays}d ago`;
    } catch {
      return isoString;
    }
  };

  // Helper for type styling
  const getEventBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'task_completed':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Task Finished' };
      case 'task_started':
        return { icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', label: 'Task Started' };
      case 'task_failed':
        return { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', label: 'Task Failed' };
      case 'file_generated':
        return { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', label: 'File Generated' };
      case 'approval_required':
        return { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Approval Required' };
      case 'approval_resolved':
        return { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Approval Handled' };
      case 'user_login':
        return { icon: LogIn, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: 'User Login' };
      case 'user_logout':
        return { icon: LogOut, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/30', label: 'User Logout' };
      case 'user_switched':
        return { icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'Profile Switch' };
      case 'knowledge_ingested':
        return { icon: Database, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30', label: 'RAG Ingest' };
      case 'knowledge_deleted':
        return { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', label: 'Doc Purged' };
      case 'nightly_sync':
        return { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', label: '23:00 Batch Sync' };
      case 'memory_updated':
        return { icon: BrainCircuit, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30', label: 'Memory Rule' };
      case 'tool_executed':
        return { icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Tool Trace' };
      default:
        return { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/30', label: 'System Event' };
    }
  };

  return (
    <div id="activity-log-view" className="flex-1 flex flex-col h-full bg-[#0a0a0c] overflow-y-auto text-zinc-100 p-6">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        
        {/* Header Title & Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f1f25] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  System Activity Log
                  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-[#18181e] border border-[#2b2b36] text-zinc-400">
                    Chronological Audit Trail
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real-time recording and observability stream for agent workflows, file creations, user sessions, and security gates.
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live streaming status beacon */}
            <button
              id="toggle-live-stream-btn"
              onClick={() => setIsLiveActive(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isLiveActive 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
              }`}
              title={isLiveActive ? "Live monitoring active (polling every 4s)" : "Live polling paused"}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{isLiveActive ? 'Live Stream On' : 'Stream Paused'}</span>
            </button>

            {/* Refresh */}
            <button
              id="manual-refresh-logs-btn"
              onClick={onRefresh}
              className="p-2 rounded-lg bg-[#18181e] border border-[#2b2b36] text-zinc-400 hover:text-zinc-200 hover:bg-[#22222a] transition-colors"
              title="Refresh logs now"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export Dropdown */}
            <div className="flex items-center gap-1 bg-[#18181e] border border-[#2b2b36] rounded-lg p-0.5">
              <button
                id="export-json-btn"
                onClick={handleExportJSON}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-[#262630] rounded transition-colors"
                title="Download JSON telemetry"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>JSON</span>
              </button>
              <span className="text-zinc-700">|</span>
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-[#262630] rounded transition-colors"
                title="Download CSV spreadsheet"
              >
                <span>CSV</span>
              </button>
            </div>

            {/* Seed / Reset Demo Events */}
            <button
              id="seed-events-btn"
              onClick={onSeedLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181e] hover:bg-[#22222a] border border-[#2b2b36] text-zinc-300 text-xs font-medium rounded-lg transition-colors"
              title="Load standard historical telemetry events"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Seed Events</span>
            </button>

            {/* Clear Logs */}
            <button
              id="clear-logs-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the activity log history?')) {
                  onClearLogs();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Recorded</span>
            <span className="text-xl font-bold text-zinc-100 mt-1">{stats.total}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">All system events</span>
          </div>

          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Task Runs</span>
            <span className="text-xl font-bold text-emerald-400 mt-1">{stats.taskEvents}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">Agent orchestrations</span>
          </div>

          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Artifacts</span>
            <span className="text-xl font-bold text-cyan-400 mt-1">{stats.fileEvents}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">Files generated</span>
          </div>

          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Approvals</span>
            <span className="text-xl font-bold text-amber-400 mt-1">{stats.approvalEvents}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">Human gates</span>
          </div>

          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">Auth & SSO</span>
            <span className="text-xl font-bold text-purple-400 mt-1">{stats.authEvents}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">Sessions logged</span>
          </div>

          <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">Knowledge</span>
            <span className="text-xl font-bold text-teal-400 mt-1">{stats.knowledgeEvents}</span>
            <span className="text-[10px] text-zinc-500 mt-auto">RAG vector ops</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="activity-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, description, tool name, user or metadata..."
                className="w-full bg-[#18181f] border border-[#2b2b36] rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Severity Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 shrink-0">Severity:</span>
              <select
                id="activity-severity-select"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#18181f] border border-[#2b2b36] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Severities</option>
                <option value="success">Success</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* User Dropdown */}
            {uniqueUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 shrink-0">User:</span>
                <select
                  id="activity-user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-[#18181f] border border-[#2b2b36] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Categories', count: events.length },
              { id: 'tasks', label: 'Task Runs', count: stats.taskEvents },
              { id: 'files', label: 'File Artifacts', count: stats.fileEvents },
              { id: 'approvals', label: 'Human Approvals', count: stats.approvalEvents },
              { id: 'auth', label: 'User & Auth', count: stats.authEvents },
              { id: 'knowledge', label: 'Knowledge (RAG)', count: stats.knowledgeEvents },
              { id: 'sync', label: '23:00 Batch Sync' },
              { id: 'memory', label: 'Memory & Rules' }
            ].map(cat => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-[#18181e] text-zinc-400 border-[#2b2b36] hover:bg-[#202028] hover:text-zinc-200'
                }`}
              >
                {cat.label}
                {cat.count !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-zinc-400">
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events List / Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-zinc-400">
              Showing <strong className="text-zinc-200">{filteredEvents.length}</strong> of {events.length} events
            </span>
            {filteredEvents.length > 0 && (
              <span className="text-xs text-zinc-500">
                Latest: {new Date(filteredEvents[0]?.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-[#121216] border border-[#1f1f26] rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">No matching activity events found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Try adjusting your search query, switching categories, or triggering new agent workflows to record live events.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSeverity('all');
                    setSelectedUser('all');
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={onSeedLogs}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition-colors"
                >
                  Seed Demo Events
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredEvents.map((event) => {
                const badge = getEventBadge(event.type);
                const BadgeIcon = badge.icon;
                const isExpanded = expandedEventId === event.id;

                return (
                  <div
                    key={event.id}
                    id={`activity-event-${event.id}`}
                    className="bg-[#121216] hover:bg-[#15151a] border border-[#1f1f26] hover:border-[#2b2b36] rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Event Type Icon Badge */}
                      <div className={`p-2 rounded-lg border ${badge.bg} ${badge.color} shrink-0 mt-0.5`}>
                        <BadgeIcon className="w-4 h-4" />
                      </div>

                      {/* Main Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.bg} ${badge.color}`}>
                              {badge.label}
                            </span>

                            {event.userName && (
                              <span className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                                {event.userAvatar ? (
                                  <img src={event.userAvatar} alt={event.userName} className="w-3.5 h-3.5 rounded-full object-cover" />
                                ) : (
                                  <UserCheck className="w-3 h-3 text-indigo-400" />
                                )}
                                {event.userName}
                              </span>
                            )}

                            <span className="text-[11px] text-zinc-500">
                              {event.id}
                            </span>
                          </div>

                          {/* Timestamps */}
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="font-medium text-zinc-300">{formatRelativeTime(event.timestamp)}</span>
                            <span className="text-[11px] text-zinc-500 hidden sm:inline">
                              ({new Date(event.timestamp).toLocaleTimeString()})
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                          {event.title}
                        </h4>
                        <p className="text-xs text-zinc-300/90 mt-1 leading-relaxed">
                          {event.description}
                        </p>

                        {/* Metadata Tag Cloud */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {event.metadata.taskId && (
                              <button
                                onClick={() => onNavigateTab('tasks')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] hover:bg-indigo-500/20 transition-colors"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Task: {event.metadata.taskId}</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                              </button>
                            )}

                            {event.metadata.fileId && (
                              <button
                                onClick={() => {
                                  if (onOpenFile) {
                                    onOpenFile({
                                      id: event.metadata!.fileId!,
                                      title: event.metadata!.fileName || 'Generated File',
                                      description: 'Generated from activity event',
                                      format: (event.metadata!.fileFormat as any) || 'markdown',
                                      content: '# Preview\nGenerated artifact from activity stream.',
                                      createdAt: event.timestamp
                                    });
                                  } else {
                                    onNavigateTab('files');
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] hover:bg-cyan-500/20 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                <span>File: {event.metadata.fileName || event.metadata.fileId}</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                              </button>
                            )}

                            {event.metadata.durationMs && (
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px] border border-zinc-700">
                                ⏱️ {event.metadata.durationMs}ms
                              </span>
                            )}

                            {event.metadata.tokensUsed && (
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px] border border-zinc-700">
                                🪙 {event.metadata.tokensUsed.toLocaleString()} tokens
                              </span>
                            )}

                            {event.metadata.chunksCount && (
                              <span className="px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 text-[11px] border border-teal-800/40">
                                🧩 {event.metadata.chunksCount} chunks
                              </span>
                            )}

                            {event.metadata.toolName && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[11px] border border-amber-800/40">
                                🛠️ {event.metadata.toolName}
                              </span>
                            )}

                            {event.metadata.actionType && (
                              <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 text-[11px] border border-rose-800/40">
                                🛡️ {event.metadata.actionType}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Collapsible Details & JSON Inspector */}
                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-xs">
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                            className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
                          >
                            <Code className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{isExpanded ? 'Hide Raw Audit JSON' : 'Inspect Audit Payload'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => copyEventPayload(event)}
                            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                          >
                            {copiedId === event.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <span>Copy JSON</span>
                            )}
                          </button>
                        </div>

                        {/* Expanded Payload Area */}
                        {isExpanded && (
                          <div className="mt-3 bg-[#0d0d10] border border-[#202028] rounded-lg p-3 overflow-x-auto text-[11px] font-mono text-zinc-300">
                            <pre>{JSON.stringify(event, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
