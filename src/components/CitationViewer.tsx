import React from 'react';
import { Citation } from '../types';
import { X, FileText, Check, Copy, ExternalLink, BookmarkCheck } from 'lucide-react';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationViewer: React.FC<Props> = ({ citation, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div 
        id="citation-viewer-drawer" 
        className="w-full max-w-lg bg-[#0d0d10] border-l border-[#1f1f23] h-full p-4 sm:p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-150"
      >
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/20">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-medium block">
                RAG Citation Evidence
              </span>
              <h3 className="text-sm font-semibold text-[#e0e0e0] line-clamp-1">
                {citation.documentTitle}
              </h3>
            </div>
          </div>
          <button 
            id="close-citation-btn"
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-[#e0e0e0] hover:bg-[#141418] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#141418] border border-[#1f1f23] rounded-lg p-2.5">
              <span className="text-[10px] text-[#8e8e93] block font-medium">Relevance Score</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round(citation.score * 100))}%` }} 
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.round(citation.score * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-[#141418] border border-[#1f1f23] rounded-lg p-2.5">
              <span className="text-[10px] text-[#8e8e93] block font-medium">Location</span>
              <span className="text-xs font-mono text-[#d4d4d8] block mt-1 truncate">
                {citation.pageNumber ? `Page ${citation.pageNumber}` : 'Document Body'} {citation.section ? `• ${citation.section}` : ''}
              </span>
            </div>
          </div>

          <div className="bg-[#0a0a0c] border border-[#1f1f23] rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#8e8e93] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Raw Retrieved Chunk
              </span>
              <button
                id="copy-citation-snippet-btn"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-[#8e8e93] hover:text-[#e0e0e0] px-2 py-0.5 rounded bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-[#d4d4d8] leading-relaxed font-sans whitespace-pre-wrap">
              "{citation.snippet}"
            </p>
          </div>

          <div className="bg-[#141418] border border-indigo-500/20 rounded-lg p-3 text-xs text-[#a1a1aa] leading-relaxed">
            <span className="font-semibold text-indigo-400 block mb-0.5">RAG Verification Note</span>
            This citation chunk was dynamically retrieved by the Agent Knowledge Router and injected into the prompt context to ground the response.
          </div>
        </div>

        <div className="pt-3 border-t border-[#1f1f23] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[#e0e0e0] bg-[#141418] hover:bg-[#1a1a20] border border-[#1f1f23] rounded-md transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
