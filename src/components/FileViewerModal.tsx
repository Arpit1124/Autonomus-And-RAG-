import React, { useState } from 'react';
import { GeneratedFile } from '../types';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Presentation, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  file: GeneratedFile | null;
  onClose: () => void;
}

export const FileViewerModal: React.FC<Props> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  if (!file) return null;

  let slides: Array<{ slideNumber: number; title: string; bullets: string[]; notes?: string }> = [];
  if (file.format === 'pptx') {
    try {
      const parsed = JSON.parse(file.content);
      slides = parsed.slides || [];
    } catch (e) {
      slides = file.metadata?.slides || [];
    }
  }

  let tableColumns: string[] = file.metadata?.columns || [];
  let tableRows: any[] = file.metadata?.rows || [];
  if (file.format === 'csv' && (!tableRows || tableRows.length === 0)) {
    const lines = file.content.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      tableColumns = lines[0].split(',').map(c => c.replace(/^"|"$/g, ''));
      tableRows = lines.slice(1).map(l => {
        const vals = l.split(',').map(c => c.replace(/^"|"$/g, ''));
        const obj: Record<string, any> = {};
        tableColumns.forEach((col, idx) => {
          obj[col] = vals[idx] || '';
        });
        return obj;
      });
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { 
      type: file.format === 'csv' ? 'text/csv;charset=utf-8;' 
        : file.format === 'pptx' ? 'application/json' 
        : file.format === 'code' ? 'text/plain' 
        : 'text/markdown' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title.toLowerCase().replace(/\s+/g, '_')}.${file.format === 'pptx' ? 'json' : file.format === 'markdown' ? 'md' : file.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        id="file-viewer-modal" 
        className="bg-[#0d0d10] border border-[#1f1f23] rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f23] bg-[#0a0a0c]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-500/20 shrink-0">
              {file.format === 'pptx' && <Presentation className="w-4 h-4" />}
              {file.format === 'csv' && <FileSpreadsheet className="w-4 h-4" />}
              {file.format === 'xlsx' && <FileSpreadsheet className="w-4 h-4" />}
              {file.format === 'code' && <FileCode className="w-4 h-4" />}
              {(file.format === 'markdown' || file.format === 'pdf' || file.format === 'docx' || file.format === 'txt') && (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#e0e0e0] truncate">{file.title}</h3>
                <span className="text-[9px] font-mono uppercase bg-[#18181c] text-[#8e8e93] px-1.5 py-0.2 rounded border border-[#27272a]">
                  {file.format.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#71717a] truncate mt-0.5">{file.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="copy-file-content-btn"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141418] hover:bg-[#1a1a20] text-[#e0e0e0] text-xs font-medium border border-[#1f1f23] transition cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="download-file-btn"
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
              title="Download file"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>

            {(file.format === 'markdown' || file.format === 'pdf' || file.format === 'docx') && (
              <button
                id="print-file-btn"
                onClick={handlePrint}
                className="p-1.5 rounded bg-[#141418] hover:bg-[#1a1a20] text-[#8e8e93] hover:text-[#e0e0e0] border border-[#1f1f23] transition cursor-pointer"
                title="Print document"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="close-file-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded bg-[#141418] hover:bg-[#1a1a20] text-[#71717a] hover:text-[#e0e0e0] border border-[#1f1f23] transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#0a0a0c]">
          {file.format === 'pptx' && slides.length > 0 ? (
            /* Interactive Presentation Viewer */
            <div className="flex flex-col h-full gap-3">
              <div className="flex-1 bg-[#0d0d10] border border-[#1f1f23] rounded-xl p-6 flex flex-col justify-between shadow-sm relative min-h-[320px]">
                <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono">
                  <span>SLIDE {currentSlideIndex + 1} OF {slides.length}</span>
                  <span className="text-indigo-400 font-medium">Enterprise Presentation Deck</span>
                </div>

                <div className="my-auto py-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#e0e0e0] tracking-tight mb-4">
                    {slides[currentSlideIndex]?.title}
                  </h2>
                  <ul className="space-y-2.5">
                    {slides[currentSlideIndex]?.bullets?.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[#d4d4d8] text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {slides[currentSlideIndex]?.notes && (
                  <div className="mt-3 pt-2.5 border-t border-[#1f1f23] text-xs text-[#8e8e93] italic">
                    <strong className="text-[#e0e0e0] not-italic">Presenter Notes:</strong> {slides[currentSlideIndex]?.notes}
                  </div>
                )}
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between bg-[#0d0d10] border border-[#1f1f23] rounded-lg p-2.5">
                <button
                  id="prev-slide-btn"
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141418] hover:bg-[#1a1a20] disabled:opacity-40 text-xs text-[#e0e0e0] font-medium transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <div className="flex gap-1 overflow-x-auto max-w-md py-0.5">
                  {slides.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-6 h-6 rounded text-xs font-mono font-medium transition flex items-center justify-center cursor-pointer ${
                        currentSlideIndex === idx
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-[#141418] text-[#8e8e93] hover:text-[#e0e0e0] border border-[#1f1f23]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  id="next-slide-btn"
                  onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141418] hover:bg-[#1a1a20] disabled:opacity-40 text-xs text-[#e0e0e0] font-medium transition cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : file.format === 'csv' || file.format === 'xlsx' ? (
            /* Interactive Data Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1 text-xs text-[#e0e0e0] placeholder:text-[#52525b] focus:outline-none focus:border-indigo-500 w-56"
                />
                <span className="text-[11px] text-[#71717a] font-mono">
                  {tableRows.length} records • {tableColumns.length} columns
                </span>
              </div>

              <div className="overflow-x-auto border border-[#1f1f23] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0d0d10] border-b border-[#1f1f23] text-[#8e8e93] font-mono">
                      {tableColumns.map((col, idx) => (
                        <th key={idx} className="p-2.5 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f23] font-sans">
                    {tableRows
                      .filter(row => 
                        !searchFilter || 
                        Object.values(row).some(v => String(v).toLowerCase().includes(searchFilter.toLowerCase()))
                      )
                      .map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-[#141418] transition">
                          {tableColumns.map((col, colIdx) => (
                            <td key={colIdx} className="p-2.5 text-[#d4d4d8] whitespace-nowrap">
                              {row[col] !== undefined ? String(row[col]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : file.format === 'code' ? (
            /* Code Syntax Viewer */
            <div className="bg-[#0d0d10] border border-[#1f1f23] rounded-lg p-3.5 overflow-x-auto font-mono text-xs text-emerald-400 leading-relaxed">
              <pre>{file.content}</pre>
            </div>
          ) : (
            /* Markdown / Document / Report Viewer */
            <div className="prose prose-invert max-w-none text-xs leading-relaxed prose-headings:text-[#e0e0e0] prose-p:text-[#d4d4d8] prose-li:text-[#d4d4d8] prose-strong:text-[#e0e0e0] prose-code:text-indigo-300 prose-code:bg-[#141418] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#1f1f23]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {file.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
