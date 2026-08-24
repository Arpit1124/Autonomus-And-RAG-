import React, { useState } from 'react';
import { KnowledgeDocument, DocumentChunk, Citation } from '../types';
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Trash2, 
  Eye, 
  Plus, 
  CheckCircle2, 
  BookmarkCheck, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  documents: KnowledgeDocument[];
  onRefreshDocs: () => void;
  onOpenCitation: (citation: Citation) => void;
  onAskAgentAboutDoc?: (docTitle: string, query: string) => void;
}

export const KnowledgeBaseView: React.FC<Props> = ({ 
  documents, 
  onRefreshDocs, 
  onOpenCitation,
  onAskAgentAboutDoc 
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citation[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal state
  const [newTitle, setNewTitle] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newContent, setNewContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleSearchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchKnowledge(searchQuery, 5);
      setSearchResults(res.citations);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !newFilename.trim()) return;
    setIsUploading(true);
    try {
      await api.uploadDocument({
        title: newTitle || newFilename,
        filename: newFilename,
        fileType: newFileType,
        rawContent: newContent,
        tags: ['uploaded', newFileType]
      });
      setShowUploadModal(false);
      setNewTitle('');
      setNewFilename('');
      setNewContent('');
      onRefreshDocs();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      await api.deleteDocument(id);
      onRefreshDocs();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#0a0a0c]">
      {/* Left Column: Documents List */}
      <div className="w-full lg:w-88 border-r border-[#1f1f23] flex flex-col h-full bg-[#0d0d10]">
        <div className="p-3 border-b border-[#1f1f23] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#e0e0e0] uppercase tracking-wider font-mono">
              Knowledge Base
            </h2>
            <p className="text-[10px] text-[#71717a]">Indexed private documents</p>
          </div>

          <button
            id="add-document-btn"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Doc</span>
          </button>
        </div>

        {/* Semantic Search Test Bar */}
        <div className="p-2.5 border-b border-[#1f1f23] bg-[#0d0d10]">
          <form onSubmit={handleSearchTest} className="relative">
            <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Test semantic retrieval..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141418] border border-[#1f1f23] rounded-md pl-7 pr-14 py-1 text-xs text-[#e0e0e0] placeholder:text-[#52525b] focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-1 top-0.5 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[9px] font-mono transition cursor-pointer"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Results Drawer if any */}
        {searchResults && (
          <div className="p-2.5 border-b border-[#1f1f23] bg-indigo-950/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300 font-semibold">
              <span>Retrieval Hits ({searchResults.length})</span>
              <button 
                onClick={() => setSearchResults(null)}
                className="text-[#8e8e93] hover:text-[#e0e0e0] text-[9px] cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {searchResults.map((cite) => (
                <button
                  key={cite.id}
                  onClick={() => onOpenCitation(cite)}
                  className="w-full text-left p-1.5 rounded bg-[#141418] border border-[#1f1f23] hover:border-indigo-500/40 text-xs transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#e0e0e0] truncate text-[11px]">{cite.documentTitle}</span>
                    <span className="font-mono text-[9px] text-emerald-400">{Math.round(cite.score * 100)}%</span>
                  </div>
                  <p className="text-[10px] text-[#8e8e93] line-clamp-1 mt-0.5">{cite.snippet}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {documents.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                id={`doc-card-${doc.id}`}
                onClick={() => setSelectedDocId(doc.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                    : 'bg-[#121215] hover:bg-[#18181d] border-[#1f1f23]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded bg-indigo-950/70 text-indigo-400 shrink-0">
                      {doc.fileType === 'csv' && <FileSpreadsheet className="w-3.5 h-3.5" />}
                      {doc.fileType === 'code' && <FileCode className="w-3.5 h-3.5" />}
                      {(doc.fileType === 'pdf' || doc.fileType === 'docx' || doc.fileType === 'markdown' || doc.fileType === 'txt') && (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#e0e0e0] truncate">{doc.title}</h4>
                      <span className="text-[9px] font-mono text-[#71717a] uppercase">{doc.filename}</span>
                    </div>
                  </div>

                  <button
                    id={`delete-doc-btn-${doc.id}`}
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="p-1 text-[#71717a] hover:text-red-400 hover:bg-[#18181c] rounded transition cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-[#71717a] mt-2 pt-1.5 border-t border-[#1f1f23]">
                  <span>{doc.chunksCount} chunks</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Indexed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Chunk Inspector & Document Overview */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0a0a0c]">
        {selectedDoc ? (
          <div className="max-w-3xl space-y-4">
            {/* Document Header Card */}
            <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#18181c] text-indigo-300 border border-[#27272a]">
                  {selectedDoc.fileType.toUpperCase()} Document
                </span>
                <span className="text-[10px] font-mono text-[#71717a]">
                  Uploaded {new Date(selectedDoc.uploadedAt).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-sm font-bold text-[#e0e0e0]">{selectedDoc.title}</h2>
              {selectedDoc.summary && (
                <p className="text-xs text-[#a1a1aa] leading-relaxed bg-[#141418] border border-[#1f1f23] p-2.5 rounded-lg">
                  <strong className="text-[#e0e0e0]">Executive Summary:</strong> {selectedDoc.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex flex-wrap gap-1">
                  {selectedDoc.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#141418] text-[#8e8e93] border border-[#1f1f23]">
                      #{tag}
                    </span>
                  ))}
                </div>

                {onAskAgentAboutDoc && (
                  <button
                    id="doc-ask-agent-btn"
                    onClick={() => onAskAgentAboutDoc(selectedDoc.title, `Analyze and summarize the key findings from "${selectedDoc.title}"`)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-medium transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Run Task with this Document</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chunk Inspector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8e8e93] font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Extracted Semantic Vector Chunks ({selectedDoc.chunks?.length || 0})
                </h3>
              </div>

              <div className="space-y-2">
                {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                  selectedDoc.chunks.map((chunk, idx) => (
                    <div 
                      key={chunk.id}
                      id={`chunk-card-${chunk.id}`}
                      className="bg-[#0d0d10] border border-[#1f1f23] rounded-lg p-3 space-y-1.5 hover:border-[#27272a] transition"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a] border-b border-[#1f1f23] pb-1.5">
                        <span className="text-indigo-300 font-semibold">Chunk #{idx + 1} ({chunk.id})</span>
                        <span>{chunk.section || 'General'} {chunk.page ? `• Page ${chunk.page}` : ''}</span>
                      </div>
                      <p className="text-xs text-[#d4d4d8] leading-relaxed font-sans whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-[#52525b] text-xs font-mono">
                    No chunks available for this document.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-[#52525b] text-xs font-mono">
            Select a document to inspect semantic chunks.
          </div>
        )}
      </div>

      {/* Add Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-3.5">
            <h3 className="text-sm font-bold text-[#e0e0e0]">Add Document to Knowledge Base</h3>
            <form onSubmit={handleUploadSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Product Roadmap & Strategy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Filename</label>
                  <input
                    type="text"
                    placeholder="roadmap.pdf"
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Type</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="w-full bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500"
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
                <label className="block text-[11px] font-mono text-[#8e8e93] mb-1">Raw Text / Content</label>
                <textarea
                  rows={5}
                  placeholder="Paste the document text, notes, dataset rows, or markdown here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#141418] border border-[#1f1f23] rounded-md p-2.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded-md bg-[#141418] hover:bg-[#1a1a20] text-xs text-[#8e8e93] hover:text-[#e0e0e0] transition border border-[#1f1f23] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs text-white font-medium shadow-sm transition cursor-pointer"
                >
                  {isUploading ? 'Indexing...' : 'Ingest & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
