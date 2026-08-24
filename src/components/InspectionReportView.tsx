import React, { useState } from 'react';
import { WaferInspectionRecord, UserProfile } from '../types';
import { WaferLogo } from './common/WaferLogo';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  BrainCircuit, 
  ShieldAlert, 
  Cpu, 
  Sparkles,
  Share2
} from 'lucide-react';

interface Props {
  inspection: WaferInspectionRecord;
  currentUser: UserProfile;
  onNavigateTab: (tab: any) => void;
}

export const InspectionReportView: React.FC<Props> = ({
  inspection,
  currentUser,
  onNavigateTab
}) => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(inspection, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WaferGuard_Report_${inspection.waferId}_${inspection.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summary = `
WAFERGUARD AI — QUALITY INSPECTION CERTIFICATE
===============================================
Report ID: ${inspection.id}
Wafer ID: ${inspection.waferId} (Lot: ${inspection.lotId} / Batch: ${inspection.batchId})
Tool: ${inspection.machineId} | Process: ${inspection.processStage}
Quality Verdict: ${inspection.decision.decision} (Score: ${inspection.decision.qualityScore}/100)
Total Defects: ${inspection.defects.length} (Critical: ${inspection.decision.criticalCount}, High: ${inspection.decision.highCount})
AI Confidence: ${(inspection.decision.aiConfidence * 100).toFixed(1)}%

Decision Reason:
${inspection.decision.reason}

Root Causes Identified:
${inspection.rca?.map(r => `- ${r.title} (${r.evidenceScore}% evidence)`).join('\n') || 'None'}

Corrective Actions:
${inspection.correctiveActions?.map(a => `- [${a.priority}] ${a.title} (${a.status})`).join('\n') || 'None'}

Sign-Off: ${currentUser.name} (${currentUser.role})
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPass = inspection.decision.decision === 'PASS';
  const isFail = inspection.decision.decision === 'FAIL';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-6 space-y-4 font-sans">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Semiconductor Quality Inspection Certificate & Audit Report</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              SEMI Compliance
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Formal Quality Certificate with Defect Classification, Root-Cause Evidence, and Human Sign-Off
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1a1a28] text-[#e0e0e8] border border-[#242436] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1a1a28] text-[#e0e0e8] border border-[#242436] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="max-w-4xl mx-auto w-full bg-[#0c0c12] border border-[#222230] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-[#222232] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <WaferLogo size="md" showSubtitle={true} badge="Fab-09 Cleanroom" />

          <div className="text-right font-mono text-xs text-[#8e8e98]">
            <div>Report ID: <strong className="text-white">{inspection.id}</strong></div>
            <div>Date: <strong className="text-white">{inspection.timestamp.split('T')[0]}</strong></div>
            <div>SEMI Standard: <strong className="text-indigo-300">SEMI E10 Strict</strong></div>
          </div>
        </div>

        {/* Wafer Metadata Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#12121a] p-4 rounded-xl border border-[#20202c] font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#71717a] block">WAFER SERIAL</span>
            <strong className="text-white text-sm">{inspection.waferId}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#71717a] block">LOT / BATCH</span>
            <strong className="text-white text-sm">{inspection.lotId} / {inspection.batchId}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#71717a] block">TOOL ID</span>
            <strong className="text-indigo-300 text-sm">{inspection.machineId}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#71717a] block">PROCESS STAGE</span>
            <strong className="text-white text-xs truncate block">{inspection.processStage}</strong>
          </div>
        </div>

        {/* Quality Verdict & Score Banner */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isPass
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            : isFail
            ? 'bg-red-950/60 border-red-500/50 text-red-300'
            : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono font-bold text-base">
              {isPass ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
              <span>OFFICIAL VERDICT: {inspection.decision.decision}</span>
            </div>
            <p className="text-xs font-sans text-[#e0e0e8]">
              {inspection.decision.reason}
            </p>
          </div>

          <div className="text-right font-mono shrink-0 bg-black/40 px-3 py-2 rounded-lg border border-white/10">
            <div className="text-[10px] text-[#a1a1aa]">Quality Score:</div>
            <div className="text-lg font-bold text-white">{inspection.decision.qualityScore} / 100</div>
          </div>
        </div>

        {/* Defect Breakdown Table */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-white font-bold border-b border-[#222232] pb-2">
            <span>Detected Defect Morpohology Classification ({inspection.defects.length})</span>
            <span className="text-[10px] text-[#71717a]">Sub-Micron Optical & SEM Metrology</span>
          </div>

          {inspection.defects.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#12121a] text-center text-emerald-400">
              Zero defects detected on wafer surface.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222230] text-[10px] text-[#71717a] uppercase">
                  <th className="py-2 px-2">Defect ID</th>
                  <th className="py-2 px-2">Defect Name</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2">Die Coordinates</th>
                  <th className="py-2 px-2">Est. Area</th>
                  <th className="py-2 px-2 text-right">AI Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181824] text-xs">
                {inspection.defects.map(d => (
                  <tr key={d.id} className="hover:bg-[#141420]">
                    <td className="py-2 px-2 font-bold text-indigo-300">{d.id}</td>
                    <td className="py-2 px-2 text-white font-medium">{d.name}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        d.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-[#8e8e98]">[{d.dieCoordinate?.x}, {d.dieCoordinate?.y}]</td>
                    <td className="py-2 px-2 text-[#8e8e98]">{d.estimatedSizeUm} µm²</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-400">
                      {(d.confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Root Cause Analysis Summary */}
        {inspection.rca && inspection.rca.length > 0 && (
          <div className="space-y-2 font-mono text-xs">
            <div className="text-white font-bold border-b border-[#222232] pb-2 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Synthesized Root-Cause Analysis (RCA)</span>
            </div>

            <div className="space-y-2 font-sans text-xs">
              {inspection.rca.map(r => (
                <div key={r.id} className="p-3 rounded-xl bg-[#12121a] border border-[#20202c] space-y-1">
                  <div className="flex items-center justify-between font-mono font-bold text-indigo-300">
                    <span>{r.title}</span>
                    <span className="text-[10px] text-emerald-400">{r.evidenceScore}% AI Evidence</span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">{r.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corrective Action Checklist */}
        {inspection.correctiveActions && inspection.correctiveActions.length > 0 && (
          <div className="space-y-2 font-mono text-xs">
            <div className="text-white font-bold border-b border-[#222232] pb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Corrective & Preventive Action Orders (CAPA)</span>
            </div>

            <div className="space-y-1.5">
              {inspection.correctiveActions.map(a => (
                <div key={a.id} className="p-2.5 rounded-lg bg-[#12121a] border border-[#20202c] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white mr-2">[{a.priority}]</span>
                    <span className="text-[#d1d1db]">{a.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-indigo-300">{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Sign-Off Block */}
        <div className="border-t border-[#222232] pt-4 grid grid-cols-2 gap-4 font-mono text-xs text-[#8e8e98]">
          <div className="space-y-1">
            <span className="text-[10px] text-[#71717a] block">INSPECTOR SIGN-OFF</span>
            <div className="text-white font-bold">{currentUser.name}</div>
            <div className="text-[10px]">{currentUser.department}</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] text-[#71717a] block">SYSTEM STAMP</span>
            <div className="text-emerald-400 font-bold">VERIFIED BY WAFERGUARD AI</div>
            <div className="text-[10px]">{new Date().toUTCString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
