import React from 'react';
import { 
  Keyboard, 
  X, 
  Command, 
  CornerDownLeft, 
  Sparkles, 
  Search,
  MessageSquare,
  FolderKanban,
  Database,
  FileCode,
  BrainCircuit,
  BarChart3,
  Wrench,
  RotateCcw,
  CheckSquare,
  Activity
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Chat & Execution' | 'Tasks & Bulk Operations' | 'General';
  icon?: React.ComponentType<{ className?: string }>;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutItem[] = [
    {
      category: 'Chat & Execution',
      keys: [modKey, 'K'],
      description: 'Focus chat input bar & switch to Workspace view',
      icon: MessageSquare
    },
    {
      category: 'Chat & Execution',
      keys: ['Enter ↵'],
      description: 'Submit prompt and trigger autonomous execution'
    },
    {
      category: 'Chat & Execution',
      keys: ['Shift', 'Enter'],
      description: 'Insert newline in prompt composer'
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'T'],
      description: 'Open Tasks & Execution Trace view',
      icon: FolderKanban
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'W'],
      description: 'Open Workspace & Chat view',
      icon: MessageSquare
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'K'],
      description: 'Open Knowledge Base (RAG)',
      icon: Database
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'F'],
      description: 'Open Generated Files & Artifacts',
      icon: FileCode
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'M'],
      description: 'Open Memory & Compliance Rules',
      icon: BrainCircuit
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'D'],
      description: 'Open Dashboard Analytics',
      icon: BarChart3
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'L'],
      description: 'Open Tool Registry',
      icon: Wrench
    },
    {
      category: 'Navigation',
      keys: [modKey, 'Shift', 'A'],
      description: 'Open System Activity Log & Audit Trail',
      icon: Activity
    },
    {
      category: 'Tasks & Bulk Operations',
      keys: [modKey, 'A'],
      description: 'Select all filtered tasks (when in Tasks view)',
      icon: CheckSquare
    },
    {
      category: 'General',
      keys: [modKey, 'Shift', 'N'],
      description: 'Start New Task / Reset conversation',
      icon: RotateCcw
    },
    {
      category: 'General',
      keys: [modKey, '/'],
      description: 'Open this Keyboard Shortcuts cheat sheet',
      icon: Keyboard
    },
    {
      category: 'General',
      keys: ['Esc'],
      description: 'Close active modal / deselect items'
    }
  ];

  const categories = ['Chat & Execution', 'Navigation', 'Tasks & Bulk Operations', 'General'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="keyboard-shortcuts-modal"
        className="bg-[#0e0e12] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f23] flex items-center justify-between bg-[#121216]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>Workspace Keyboard Shortcuts</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#18181c] text-[#a1a1aa] border border-[#2a2a32]">
                  {modKey} Shortcuts
                </span>
              </h2>
              <p className="text-[11px] text-[#71717a]">
                Quick navigation and autonomous execution controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1c1c22] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs font-mono">
          {categories.map((cat) => {
            const items = shortcuts.filter(s => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider border-b border-[#1c1c22] pb-1">
                  {cat}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#141418] border border-[#1f1f23] flex items-center justify-between gap-3 hover:border-[#2a2a32] transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.icon && (
                          <item.icon className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                        )}
                        <span className="text-[#d4d4d8] text-[11px] leading-tight truncate">
                          {item.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-1.5 py-0.5 rounded bg-[#1f1f26] border border-[#33333e] text-[#f4f4f5] text-[10px] font-bold shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f1f23] bg-[#121216] flex items-center justify-between text-[11px] text-[#71717a] font-mono">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[#1c1c22] border border-[#2a2a32] text-white">Ctrl+K</kbd> anywhere to focus prompt</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
