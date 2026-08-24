import React, { useState } from 'react';
import { MemoryItem } from '../types';
import { 
  BrainCircuit, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  ShieldCheck, 
  Bookmark, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  memories: MemoryItem[];
  onRefreshMemories: () => void;
}

export const MemoryView: React.FC<Props> = ({ memories, onRefreshMemories }) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'preference' | 'workflow' | 'guideline' | 'fact'>('preference');

  const filteredMemories = memories.filter(m => activeTypeFilter === 'all' || m.type === activeTypeFilter);

  const handleToggleMemory = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateMemory(id, { enabled: !currentStatus });
      onRefreshMemories();
    } catch (err) {
      console.error('Failed to toggle memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory item?')) return;
    try {
      await api.deleteMemory(id);
      onRefreshMemories();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      await api.addMemory({
        key: newKey,
        value: newValue,
        type: newType,
        source: 'user_defined',
        enabled: true
      });
      setShowAddModal(false);
      setNewKey('');
      setNewValue('');
      onRefreshMemories();
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c] p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#e0e0e0] uppercase tracking-wider font-mono flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            Agent Context & Instructions
          </h2>
          <p className="text-[11px] text-[#71717a] mt-0.5">
            Manage user preferences, persistent workflow rules, and compliance guidelines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 bg-[#141418] border border-[#1f1f23] p-0.5 rounded-md text-[10px] font-mono">
            {['all', 'preference', 'workflow', 'guideline', 'fact'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${
                  activeTypeFilter === type
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            id="add-memory-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              id={`memory-card-${mem.id}`}
              className={`bg-[#0d0d10] border rounded-xl p-3.5 space-y-2.5 transition ${
                mem.enabled ? 'border-[#1f1f23]' : 'border-[#1f1f23]/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                    mem.type === 'guideline' ? 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                    : mem.type === 'workflow' ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                    : mem.type === 'fact' ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                    : 'bg-purple-950/70 text-purple-300 border-purple-500/30'
                  }`}>
                    {mem.type}
                  </span>
                  <span className="text-[10px] font-mono text-[#71717a]">
                    {mem.source === 'auto_extracted' ? 'Auto Extracted' : 'User Defined'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleMemory(mem.id, mem.enabled)}
                    className="text-[#8e8e93] hover:text-indigo-400 transition cursor-pointer"
                    title={mem.enabled ? 'Disable memory' : 'Enable memory'}
                  >
                    {mem.enabled ? (
                      <ToggleRight className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[#52525b]" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-0.5 text-[#71717a] hover:text-red-400 transition cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#e0e0e0]">{mem.key}</h4>
                <p className="text-xs text-[#d4d4d8] mt-1 leading-relaxed bg-[#141418] p-2.5 rounded-lg border border-[#1f1f23]">
                  {mem.value}
                </p>
              </div>

              <div className="text-[9px] font-mono text-[#71717a] pt-0.5">
                Added {new Date(mem.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-3.5">
            <h3 className="text-sm font-bold text-[#e0e0e0]">Add Memory Rule</h3>
            <form onSubmit={handleAddSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Memory Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                >
                  <option value="preference">User Preference</option>
                  <option value="workflow">Standard Workflow</option>
                  <option value="guideline">Security / Action Guideline</option>
                  <option value="fact">Persistent Fact</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Key / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Presentation Format Standard"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Instruction Value</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Always include an Agenda slide and concluding action steps..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md p-2.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md bg-[#141418] hover:bg-[#1a1a20] text-xs text-[#8e8e93] hover:text-[#e0e0e0] transition border border-[#1f1f23] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium shadow-sm transition cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
