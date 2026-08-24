import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  Database,
  Layers,
  File
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddKnowledgeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('rag, knowledge');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [chunkingPreview, setChunkingPreview] = useState(true);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: globalThis.File) => {
    setFilename(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['pdf', 'docx', 'csv', 'json', 'txt', 'md', 'ts', 'py', 'sql'].includes(ext)) {
      if (ext === 'md') setFileType('markdown');
      else if (['ts', 'py', 'sql', 'js', 'json'].includes(ext)) setFileType('code');
      else setFileType(ext);
    }
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !filename.trim()) return;
    setIsUploading(true);
    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.uploadDocument({
        title: title.trim() || filename.trim(),
        filename: filename.trim(),
        fileType,
        rawContent: content,
        tags: parsedTags.length > 0 ? parsedTags : ['uploaded', fileType]
      });
      setTitle('');
      setFilename('');
      setContent('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to ingest document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const estimatedChunks = Math.max(1, Math.ceil(content.length / 500));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        id="add-knowledge-rag-modal"
        className="bg-[#0d0d10] border border-indigo-500/40 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl shadow-indigo-950/30 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#121216] border-b border-[#1f1f23] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#e0e0e0] uppercase tracking-wider font-mono">
                Add Knowledge Base (RAG) Document
              </h3>
              <p className="text-[10px] text-[#71717a]">
                Ingest, chunk, and index for semantic agent retrieval
              </p>
            </div>
          </div>

          <button
            id="close-add-knowledge-modal-btn"
            onClick={onClose}
            className="p-1 rounded-md text-[#8e8e93] hover:text-[#e0e0e0] hover:bg-[#1a1a20] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-[#0a0a0c]">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-3.5 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300' 
                : 'border-[#27272a] hover:border-indigo-500/50 bg-[#0d0d10] text-[#71717a]'
            }`}
          >
            <input
              type="file"
              id="file-rag-input"
              className="hidden"
              onChange={handleFileInputChange}
              accept=".txt,.md,.pdf,.docx,.csv,.json,.ts,.js,.py,.sql"
            />
            <label htmlFor="file-rag-input" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-[#141418] border border-[#1f1f23] flex items-center justify-center text-indigo-400">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-medium text-[#e0e0e0]">
                Click or drag & drop a file to auto-populate
              </div>
              <div className="text-[10px] text-[#71717a] font-mono">
                Supports PDF, DOCX, CSV, Markdown, Code, Plain Text
              </div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">
                Document Title
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Sales Strategy & Financial Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-sans"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  placeholder="e.g. q4_report.pdf"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">
                  Document Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-sans"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="docx">Word DOCX</option>
                  <option value="markdown">Markdown</option>
                  <option value="csv">CSV Dataset</option>
                  <option value="code">Code / Script</option>
                  <option value="txt">Plain Text</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-[#8e8e93]">
                  Raw Content / Dataset Rows
                </label>
                {content && (
                  <span className="text-[10px] font-mono text-indigo-400">
                    ~{estimatedChunks} chunks ({content.length} chars)
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                placeholder="Paste the document text, notes, dataset rows, or markdown here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#141418] border border-[#1f1f23] rounded-md p-2.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="finance, saas, q4, report"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1f1f23]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Embeddings generated automatically</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md bg-[#141418] hover:bg-[#1a1a20] text-xs text-[#8e8e93] hover:text-[#e0e0e0] transition border border-[#1f1f23] cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-knowledge-rag-btn"
                disabled={isUploading || !content.trim() || !filename.trim()}
                className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs text-white font-semibold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Chunking & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Ingest & Index</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
