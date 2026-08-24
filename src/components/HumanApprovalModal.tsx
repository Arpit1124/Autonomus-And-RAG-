import React, { useState, useMemo } from 'react';
import { SensitiveApprovalRequest } from '../types';
import { 
  ShieldAlert, 
  Send, 
  X, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Trash2, 
  Wrench,
  Sparkles,
  Sliders,
  Mail,
  FileCode,
  Globe
} from 'lucide-react';

interface Props {
  request: SensitiveApprovalRequest | null;
  batchRequests?: SensitiveApprovalRequest[];
  onApprove: (taskId: string, modifiedInput?: Record<string, any>) => void;
  onReject: (taskId: string) => void;
  onBatchApprove?: (taskIds: string[]) => void;
  onBatchReject?: (taskIds: string[]) => void;
  onClose?: () => void;
}

export const HumanApprovalModal: React.FC<Props> = ({ 
  request, 
  batchRequests = [], 
  onApprove, 
  onReject,
  onBatchApprove,
  onBatchReject,
  onClose
}) => {
  // Combine single request with any additional batch items
  const allRequests = useMemo(() => {
    const list: SensitiveApprovalRequest[] = [];
    if (request) list.push(request);
    batchRequests.forEach(br => {
      if (!list.some(item => item.id === br.id || item.taskId === br.taskId)) {
        list.push(br);
      }
    });
    return list;
  }, [request, batchRequests]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(() => {
    return new Set(allRequests.map(r => r.taskId));
  });

  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(() => {
    return request ? request.id : allRequests[0]?.id || null;
  });

  const [isEditingSingle, setIsEditingSingle] = useState(false);
  const [editedTo, setEditedTo] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  if (allRequests.length === 0) return null;

  const isMultiBatch = allRequests.length > 1;

  const toggleSelect = (taskId: string) => {
    const next = new Set(selectedTaskIds);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setSelectedTaskIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === allRequests.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allRequests.map(r => r.taskId)));
    }
  };

  const handleStartEdit = (req: SensitiveApprovalRequest) => {
    setEditedTo(req.toolInput.to || req.targetDetails.To || '');
    setEditedSubject(req.toolInput.subject || req.targetDetails.Subject || '');
    setEditedBody(req.toolInput.body || req.targetDetails.Preview || '');
    setIsEditingSingle(true);
    setExpandedRequestId(req.id);
  };

  const handleConfirmSingleWithEdit = (req: SensitiveApprovalRequest) => {
    onApprove(req.taskId, {
      ...req.toolInput,
      to: editedTo,
      subject: editedSubject,
      body: editedBody
    });
    setIsEditingSingle(false);
  };

  const handleBatchApproveClick = () => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    if (onBatchApprove) {
      onBatchApprove(ids);
    } else {
      // Fallback: approve sequentially
      ids.forEach(id => onApprove(id));
    }
    if (onClose) onClose();
  };

  const handleBatchRejectClick = () => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    if (onBatchReject) {
      onBatchReject(ids);
    } else {
      // Fallback: reject sequentially
      ids.forEach(id => onReject(id));
    }
    if (onClose) onClose();
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'modify_settings':
        return <Sliders className="w-4 h-4 text-orange-400" />;
      case 'execute_code':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'external_api':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      default:
        return <Wrench className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        id="human-approval-modal"
        className="bg-[#0d0d12] border border-amber-500/40 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-amber-950/30 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Banner Header */}
        <div className="bg-[#14141c] border-b border-amber-500/30 px-4 py-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Human-in-the-Loop Security Gate
                </span>
                {isMultiBatch && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                    BATCH REVIEW ({allRequests.length} Pending)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[#e0e0e0]">
                {isMultiBatch 
                  ? `Batch Approval: ${allRequests.length} Sensitive Actions Awaiting Confirmation`
                  : allRequests[0].title
                }
              </h3>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-[#71717a] hover:text-white p-1 rounded-lg hover:bg-[#1f1f26] transition cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 space-y-3.5 bg-[#0a0a0e] overflow-y-auto flex-1">
          {/* Top Notice */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2.5 text-xs text-amber-300/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px]">
              <p className="font-semibold text-amber-300">
                Autonomous execution is suspended pending explicit user authorization.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed">
                Select actions below to approve, edit parameters, or reject them in a single batch operation.
              </p>
            </div>
          </div>

          {/* Batch Selector Header if multi-item */}
          {isMultiBatch && (
            <div className="flex items-center justify-between bg-[#111116] border border-[#1f1f26] rounded-lg px-3 py-2 text-xs font-mono">
              <button
                id="modal-toggle-select-all-btn"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                {selectedTaskIds.size === allRequests.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4 text-[#71717a]" />
                )}
                <span>
                  {selectedTaskIds.size === allRequests.length ? 'Deselect All' : `Select All (${allRequests.length})`}
                </span>
              </button>

              <span className="text-[11px] text-[#8e8e93]">
                <strong className="text-white">{selectedTaskIds.size}</strong> of {allRequests.length} selected for batch action
              </span>
            </div>
          )}

          {/* Request Items List / Accordions */}
          <div className="space-y-2.5">
            {allRequests.map((req, idx) => {
              const isSelected = selectedTaskIds.has(req.taskId);
              const isExpanded = expandedRequestId === req.id || (!isMultiBatch && idx === 0);

              return (
                <div
                  key={req.id}
                  id={`approval-item-${req.id}`}
                  className={`border rounded-xl transition-all duration-150 overflow-hidden ${
                    isSelected 
                      ? 'border-amber-500/50 bg-[#121218] shadow-md shadow-amber-950/10' 
                      : 'border-[#1f1f26] bg-[#0d0d10] opacity-80'
                  }`}
                >
                  {/* Item Header */}
                  <div className="p-3 flex items-center justify-between gap-3 border-b border-[#1a1a22]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isMultiBatch && (
                        <button
                          type="button"
                          onClick={() => toggleSelect(req.taskId)}
                          className="text-amber-400 hover:text-amber-300 transition cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-[#71717a]" />
                          )}
                        </button>
                      )}

                      <div className="p-1.5 rounded-lg bg-[#181820] border border-[#27272e] shrink-0">
                        {getActionIcon(req.actionType)}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {req.title}
                          </h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#181820] text-[#a1a1aa] border border-[#27272e]">
                            {req.toolName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#71717a] truncate">{req.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                        className="p-1 text-[#8e8e93] hover:text-white rounded hover:bg-[#1f1f26] transition cursor-pointer text-[10px] font-mono flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Parameters & Payload */}
                  {isExpanded && (
                    <div className="p-3.5 bg-[#0a0a0d] space-y-3 border-t border-[#1a1a22] text-xs">
                      {/* Suggested Action preview */}
                      <div className="bg-[#121218] p-2 rounded-lg border border-[#23232c] flex items-center gap-2 text-[11px] text-[#e0e0e0]">
                        <span className="text-amber-400 font-mono font-bold shrink-0">Proposed Action:</span>
                        <span className="truncate">{req.suggestedAction}</span>
                      </div>

                      {!isEditingSingle ? (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono text-[#8e8e93] font-semibold uppercase tracking-wider">
                            Parameters & Target Details:
                          </div>
                          <div className="bg-[#0e0e12] border border-[#1f1f26] rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
                            {Object.entries(req.targetDetails).map(([key, val]) => (
                              <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                <span className="text-[#71717a] w-28 shrink-0">{key}:</span>
                                <span className="text-[#d4d4d8] font-sans font-medium break-all">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Edit Form for Mail or Input Payload */
                        <div className="bg-[#101016] border border-indigo-500/40 rounded-lg p-3 space-y-2.5">
                          <div className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" /> Modify Dispatch Parameters
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-[#8e8e93] mb-1">To (Recipient)</label>
                            <input
                              type="text"
                              value={editedTo}
                              onChange={(e) => setEditedTo(e.target.value)}
                              className="w-full bg-[#14141c] border border-[#27272e] rounded-md px-2.5 py-1 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-[#8e8e93] mb-1">Subject</label>
                            <input
                              type="text"
                              value={editedSubject}
                              onChange={(e) => setEditedSubject(e.target.value)}
                              className="w-full bg-[#14141c] border border-[#27272e] rounded-md px-2.5 py-1 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-[#8e8e93] mb-1">Email Body</label>
                            <textarea
                              rows={3}
                              value={editedBody}
                              onChange={(e) => setEditedBody(e.target.value)}
                              className="w-full bg-[#14141c] border border-[#27272e] rounded-md p-2 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingSingle(false)}
                              className="px-2.5 py-1 text-xs text-[#8e8e93] hover:text-[#e0e0e0] cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmSingleWithEdit(req)}
                              className="px-3 py-1 rounded bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Save & Approve Single
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Individual Actions Bar within item */}
                      {!isEditingSingle && req.actionType === 'send_email' && (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#181820]">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(req)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#14141c] hover:bg-[#1a1a22] text-[#8e8e93] hover:text-[#e0e0e0] text-xs font-medium border border-[#27272e] transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-400" />
                            <span>Edit Payload</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Controls (Batch Actions & Single Actions) */}
        <div className="px-4 py-3 bg-[#0d0d12] border-t border-[#1f1f26] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8e8e93] w-full sm:w-auto justify-between sm:justify-start">
            <span>
              Selected: <strong className="text-amber-400">{selectedTaskIds.size}</strong> of {allRequests.length}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#71717a] hover:text-white text-xs underline sm:hidden cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Batch Reject Button */}
            <button
              id="batch-reject-modal-btn"
              onClick={handleBatchRejectClick}
              disabled={selectedTaskIds.size === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14141c] hover:bg-rose-950/60 text-[#a1a1aa] hover:text-rose-300 border border-[#27272e] hover:border-rose-500/50 text-xs font-medium transition cursor-pointer disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {selectedTaskIds.size > 1 ? `Reject Selected (${selectedTaskIds.size})` : 'Reject Action'}
              </span>
            </button>

            {/* Batch Approve Button */}
            <button
              id="batch-approve-modal-btn"
              onClick={handleBatchApproveClick}
              disabled={selectedTaskIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-950/40 transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {selectedTaskIds.size > 1 ? `Approve Selected (${selectedTaskIds.size})` : 'Approve & Execute'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
