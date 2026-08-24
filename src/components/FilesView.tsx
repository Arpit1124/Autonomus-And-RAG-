import React, { useState } from 'react';
import { GeneratedFile } from '../types';
import { 
  FolderKanban, 
  Presentation, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  Clock, 
  Sparkles 
} from 'lucide-react';

interface Props {
  files: GeneratedFile[];
  onOpenFile: (file: GeneratedFile) => void;
}

export const FilesView: React.FC<Props> = ({ files, onOpenFile }) => {
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter(f => {
    const matchesSearch = !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = formatFilter === 'all' || f.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  const handleDownload = (file: GeneratedFile, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c] p-4 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#e0e0e0] uppercase tracking-wider font-mono flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            Generated Artifacts
          </h2>
          <p className="text-[11px] text-[#71717a] mt-0.5">
            Documents, slide decks, spreadsheets and code produced by the autonomous agent
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#141418] border border-[#1f1f23] rounded-md px-2.5 py-1 text-xs text-[#e0e0e0] placeholder:text-[#52525b] focus:outline-none focus:border-indigo-500 w-40"
          />

          <div className="flex gap-0.5 bg-[#141418] border border-[#1f1f23] p-0.5 rounded-md text-[10px] font-mono">
            {['all', 'pptx', 'csv', 'markdown', 'code'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-2 py-0.5 rounded uppercase transition cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[#8e8e93] hover:text-[#e0e0e0]'
                }`}
              >
                {fmt === 'pptx' ? 'Slides' : fmt === 'csv' ? 'Sheets' : fmt === 'markdown' ? 'Reports' : fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#141418] border border-[#1f1f23] flex items-center justify-center text-[#52525b] mx-auto">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-[#8e8e93]">No generated files yet</h3>
            <p className="text-[11px] text-[#52525b] max-w-xs mx-auto">
              Ask the agent to create a presentation, analyze a spreadsheet, or write code to generate files here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                id={`file-card-${file.id}`}
                onClick={() => onOpenFile(file)}
                className="group bg-[#0d0d10] hover:bg-[#121216] border border-[#1f1f23] hover:border-indigo-500/50 rounded-xl p-3.5 cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-indigo-950/70 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      {file.format === 'pptx' && <Presentation className="w-4 h-4" />}
                      {file.format === 'csv' && <FileSpreadsheet className="w-4 h-4" />}
                      {file.format === 'code' && <FileCode className="w-4 h-4" />}
                      {(file.format === 'markdown' || file.format === 'pdf' || file.format === 'docx' || file.format === 'txt') && (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-[#18181c] text-[#8e8e93] px-1.5 py-0.5 rounded border border-[#27272a]">
                      {file.format}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#e0e0e0] group-hover:text-indigo-300 transition line-clamp-1">
                      {file.title}
                    </h3>
                    <p className="text-[11px] text-[#8e8e93] line-clamp-2 mt-0.5 leading-relaxed">
                      {file.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f1f23] flex items-center justify-between text-xs text-[#71717a]">
                  <span className="font-mono text-[10px]">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownload(file, e)}
                      className="p-1 rounded bg-[#141418] hover:bg-[#1f1f25] text-[#8e8e93] hover:text-[#e0e0e0] transition border border-[#1f1f23] cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onOpenFile(file)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium border border-indigo-500/30 transition cursor-pointer"
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
