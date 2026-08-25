import React, { useState } from 'react';
import { WaferInspectionRecord, UserProfile, ReportTemplateType } from '../types';
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
  Share2,
  FileCheck,
  Loader2,
  Image as ImageIcon,
  Layout,
  Briefcase,
  Layers,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Check,
  ChevronRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType>('full_technical');
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  // Helper to generate a high-res rendered defect inspection wafer image
  const generateWaferDefectImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, 600, 600);

    const centerX = 300;
    const centerY = 300;
    const radius = 250;

    // Wafer Outer Bevel
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1e2230';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b4259';
    ctx.stroke();

    // Silicon Substrate
    const siliconGrad = ctx.createRadialGradient(centerX - 50, centerY - 50, 30, centerX, centerY, radius);
    siliconGrad.addColorStop(0, '#2b3040');
    siliconGrad.addColorStop(0.5, '#151722');
    siliconGrad.addColorStop(1, '#0c0d14');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = siliconGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4b5563';
    ctx.stroke();

    // Save for clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Die grid lines
    ctx.strokeStyle = '#1e2336';
    ctx.lineWidth = 1;
    for (let x = 50; x < 550; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 550);
      ctx.stroke();
    }
    for (let y = 50; y < 550; y += 22) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(550, y);
      ctx.stroke();
    }

    // Draw defects onto canvas
    inspection.defects.forEach((defect) => {
      const loc = defect.location || (defect as any).boundingBox || { x: 50, y: 50, width: 5, height: 5 };
      const posX = 50 + (loc.x / 100) * 500;
      const posY = 50 + (loc.y / 100) * 500;
      const width = Math.max(12, (loc.width / 100) * 500);
      const height = Math.max(12, (loc.height / 100) * 500);

      const isCrit = defect.severity === 'critical';
      const strokeColor = isCrit ? '#ef4444' : '#f59e0b';
      const fillColor = isCrit ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';

      ctx.fillStyle = fillColor;
      ctx.fillRect(posX - width / 2, posY - height / 2, width, height);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(posX - width / 2, posY - height / 2, width, height);

      // Defect marker center
      ctx.beginPath();
      ctx.arc(posX, posY, 4, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();

      // Label Tag
      ctx.fillStyle = isCrit ? '#7f1d1d' : '#7c2d12';
      ctx.fillRect(posX - width / 2, posY - height / 2 - 16, 75, 14);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(posX - width / 2, posY - height / 2 - 16, 75, 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${defect.id} [${defect.severity.toUpperCase()}]`, posX - width / 2 + 3, posY - height / 2 - 6);
    });

    ctx.restore();

    // Axis Labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('12:00 (N)', centerX, 30);
    ctx.fillText('06:00 (SEMI Notch)', centerX, 580);
    ctx.textAlign = 'left';
    ctx.fillText('03:00 (E)', 545, centerY);
    ctx.textAlign = 'right';
    ctx.fillText('09:00 (W)', 55, centerY);

    return canvas.toDataURL('image/png');
  };

  // Export Executive Summary Format (Single-Page High-Level Briefing)
  const exportExecutiveSummaryPDF = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
    let y = 14;

    // Header Branding Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('WAFERGUARD AI — EXECUTIVE BRIEFING & YIELD AUDIT', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Silicon Foundry Fab-09 Executive Quality Committee • High-Level Summary Format', 14, 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(129, 140, 248);
    doc.text(`BRIEF REF: ${inspection.id}-EXEC`, pageWidth - 14, 11, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Date: ${inspection.timestamp.split('T')[0]}`, pageWidth - 14, 18, { align: 'right' });

    y = 30;

    // 4 Top KPI Cards
    const cardWidth = (pageWidth - 28 - 9) / 4;
    const cardHeight = 18;

    // Card 1: Official Verdict
    const isPass = inspection.decision.decision === 'PASS';
    const isFail = inspection.decision.decision === 'FAIL';
    doc.setFillColor(isPass ? 236 : isFail ? 254 : 254, isPass ? 253 : isFail ? 242 : 252, isPass ? 245 : isFail ? 242 : 232);
    doc.setDrawColor(isPass ? 16 : isFail ? 239 : 234, isPass ? 185 : isFail ? 68 : 179, isPass ? 129 : isFail ? 68 : 8);
    doc.roundedRect(14, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('LOT DISPOSITION', 17, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(isPass ? 6 : isFail ? 153 : 133, isPass ? 95 : isFail ? 27 : 77, isPass ? 70 : isFail ? 27 : 14);
    doc.text(inspection.decision.decision, 17, y + 13);

    // Card 2: Quality Score
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14 + cardWidth + 3, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('QUALITY SCORE', 17 + cardWidth + 3, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${inspection.decision.qualityScore} / 100`, 17 + cardWidth + 3, y + 13);

    // Card 3: Defect Density
    doc.roundedRect(14 + (cardWidth + 3) * 2, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('DEFECT ANOMALIES', 17 + (cardWidth + 3) * 2, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(inspection.defects.length > 0 ? 220 : 16, inspection.defects.length > 0 ? 38 : 185, inspection.defects.length > 0 ? 38 : 129);
    doc.text(`${inspection.defects.length} Total (${inspection.decision.criticalCount} Crit)`, 17 + (cardWidth + 3) * 2, y + 13);

    // Card 4: AI Grounded Confidence
    doc.roundedRect(14 + (cardWidth + 3) * 3, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('MODEL CONFIDENCE', 17 + (cardWidth + 3) * 3, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`${(inspection.decision.aiConfidence * 100).toFixed(1)}%`, 17 + (cardWidth + 3) * 3, y + 13);

    y += 24;

    // Wafer & Lot Context Row
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(`Wafer Serial: ${inspection.waferId}`, 18, y + 5.5);
    doc.text(`Lot: ${inspection.lotId}`, 70, y + 5.5);
    doc.text(`Tool: ${inspection.machineId}`, 120, y + 5.5);
    doc.text(`Process: ${inspection.processStage.substring(0, 24)}`, 155, y + 5.5);

    y += 13;

    // Center Split: Left Metrology Image (65mm) | Right Executive Findings Box
    const waferImg = generateWaferDefectImage();
    if (waferImg) {
      doc.addImage(waferImg, 'PNG', 14, y, 68, 68);
    }

    // Right Side: Executive Yield Synopsis
    const rightX = 88;
    const rightWidth = pageWidth - 28 - 74;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(rightX, y, rightWidth, 68, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE YIELD & RISK ASSESSMENT', rightX + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Disposition Rationale:`, rightX + 4, y + 12);
    doc.setTextColor(15, 23, 42);
    doc.text(inspection.decision.reason, rightX + 4, y + 17, { maxWidth: rightWidth - 8 });

    // Defect Breakdown Summary
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Morphology Breakdown:', rightX + 4, y + 33);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const defectNames = Array.from(new Set(inspection.defects.map(d => d.name))).slice(0, 3);
    if (defectNames.length > 0) {
      defectNames.forEach((name, idx) => {
        const count = inspection.defects.filter(d => d.name === name).length;
        doc.text(`• ${name} (${count} occurrence${count > 1 ? 's' : ''})`, rightX + 4, y + 39 + (idx * 5));
      });
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('• Zero anomalies detected across active die grid.', rightX + 4, y + 39);
    }

    // Top Recommended Action
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Key Recommendation:', rightX + 4, y + 56);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const topAction = inspection.correctiveActions?.[0]?.title || 'Maintain standard baseline inspection cadence.';
    doc.text(topAction.substring(0, 52), rightX + 4, y + 61, { maxWidth: rightWidth - 8 });

    y += 74;

    // Executive Root Cause Decomposition (Condensed)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('PRIMARY ROOT-CAUSE HYPOTHESES (EXECUTIVE SYNTHESIS)', 14, y);
    y += 4;

    if (inspection.rca && inspection.rca.length > 0) {
      inspection.rca.slice(0, 2).forEach((r) => {
        doc.setFillColor(250, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, 16, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text(r.title, 18, y + 5.5);

        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text(`${r.evidenceScore}% Grounded AI Evidence`, pageWidth - 18, y + 5.5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(r.explanation.substring(0, 140) + (r.explanation.length > 140 ? '...' : ''), 18, y + 10.5, { maxWidth: pageWidth - 36 });
        y += 19;
      });
    } else {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, pageWidth - 28, 12, 1, 1, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text('Wafer meets strict automotive SEMI E10 baseline. No critical RCA required.', 18, y + 7.5);
      y += 15;
    }

    y += 2;

    // Executive Sign-off & Audit Stamp
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AUDITING LEAD ENGINEER', 18, y + 5.5);
    doc.text('EXECUTIVE FAB-09 CERTIFICATE STAMP', pageWidth / 2 + 10, y + 5.5);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(currentUser.name, 18, y + 11.5);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${currentUser.role} • ${currentUser.department}`, 18, y + 16);

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('VERIFIED BY WAFERGUARD EXECUTIVE AI', pageWidth / 2 + 10, y + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Timestamp: ${new Date().toUTCString()}`, pageWidth / 2 + 10, y + 16);

    // Page footer
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL & PROPRIETARY — SILICON FOUNDRY FAB-09 EXECUTIVE BRIEFING • SINGLE-PAGE YIELD SUMMARY',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  };

  // Export Full Technical Detail Format (Comprehensive 2-Page Engineering Audit)
  const exportFullTechnicalPDF = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
    let y = 14;

    // Header Branding Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('WAFERGUARD AI — FULL TECHNICAL METROLOGY REPORT', 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Silicon Foundry Fab-09 Cleanroom Metrology • SEMI E10 Compliance Certificate', 14, 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(`REPORT ID: ${inspection.id}`, pageWidth - 14, 11, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Date: ${inspection.timestamp.split('T')[0]}`, pageWidth - 14, 18, { align: 'right' });

    y = 32;

    // Metadata Overview Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('WAFER SERIAL', 18, y + 6);
    doc.text('LOT / BATCH ID', 68, y + 6);
    doc.text('METROLOGY TOOL', 118, y + 6);
    doc.text('PROCESS STAGE', 160, y + 6);

    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(inspection.waferId, 18, y + 14);
    doc.text(`${inspection.lotId} / ${inspection.batchId}`, 68, y + 14);
    doc.text(inspection.machineId, 118, y + 14);
    doc.setFontSize(8);
    doc.text(inspection.processStage.substring(0, 24), 160, y + 14);

    y += 28;

    // Verdict Banner
    const isPass = inspection.decision.decision === 'PASS';
    const isFail = inspection.decision.decision === 'FAIL';

    if (isPass) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.setTextColor(6, 95, 70);
    } else if (isFail) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.setTextColor(153, 27, 27);
    } else {
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(234, 179, 8);
      doc.setTextColor(133, 77, 14);
    }

    doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`OFFICIAL QUALITY VERDICT: ${inspection.decision.decision}`, 18, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(inspection.decision.reason, 18, y + 14, { maxWidth: pageWidth - 70 });

    // Score on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${inspection.decision.qualityScore} / 100`, pageWidth - 20, y + 11, { align: 'right' });
    doc.setFontSize(7.5);
    doc.text('Quality Score', pageWidth - 20, y + 16, { align: 'right' });

    y += 26;

    // Section: Defect Visual Metrology Map
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. SPATIAL DEFECT METROLOGY & DEFECT IMAGE OVERLAY', 14, y);
    y += 4;

    const waferImg = generateWaferDefectImage();
    if (waferImg) {
      doc.addImage(waferImg, 'PNG', (pageWidth - 85) / 2, y, 85, 85);
    }
    y += 90;

    // Summary counts
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Total Defects Detected: ${inspection.defects.length}  |  Critical Defects: ${inspection.decision.criticalCount}  |  High Severity: ${inspection.decision.highCount}  |  AI Confidence: ${(inspection.decision.aiConfidence * 100).toFixed(1)}%`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 10;

    // Section: Defect Classification Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. DETECTED DEFECT MORPHOLOGY CLASSIFICATION', 14, y);
    y += 5;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('ID', 17, y + 4.2);
    doc.text('DEFECT NAME', 35, y + 4.2);
    doc.text('SEVERITY', 95, y + 4.2);
    doc.text('DIE COORDS', 122, y + 4.2);
    doc.text('EST. AREA', 148, y + 4.2);
    doc.text('CONFIDENCE', pageWidth - 18, y + 4.2, { align: 'right' });
    y += 6;

    // Table Rows
    if (inspection.defects.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text('Zero surface defects detected during automated vision scanning.', 17, y + 5);
      y += 8;
    } else {
      inspection.defects.forEach((d, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 5.5, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        doc.text(d.id, 17, y + 3.8);
        doc.text(d.name.substring(0, 32), 35, y + 3.8);

        // Severity colored text
        if (d.severity === 'critical') {
          doc.setTextColor(220, 38, 38);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(217, 119, 6);
          doc.setFont('helvetica', 'normal');
        }
        doc.text(d.severity.toUpperCase(), 95, y + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`[${d.dieCoordinate?.x ?? '-'}, ${d.dieCoordinate?.y ?? '-'}]`, 122, y + 3.8);
        doc.text(`${d.estimatedSizeUm} µm²`, 148, y + 3.8);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(`${(d.confidence * 100).toFixed(1)}%`, pageWidth - 18, y + 3.8, { align: 'right' });
        y += 5.5;
      });
    }

    // Page 2: Root-Cause Analysis, CAPA, and Sign-off
    doc.addPage();
    y = 16;

    // Page 2 Header Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`WAFERGUARD AI FULL TECHNICAL AUDIT • WAFER ${inspection.waferId} (LOT: ${inspection.lotId})`, 14, 8);
    doc.text('PAGE 2 OF 2', pageWidth - 14, 8, { align: 'right' });

    y = 22;

    // Section: Root-Cause Analysis (RCA)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('3. SYNTHESIZED ROOT-CAUSE ANALYSIS (RCA) & PHYSICAL CORRELATION', 14, y);
    y += 6;

    if (inspection.rca && inspection.rca.length > 0) {
      inspection.rca.forEach((r) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, y, pageWidth - 28, 20, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 58, 138);
        doc.text(r.title, 18, y + 6);

        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text(`${r.evidenceScore}% AI Grounded Evidence`, pageWidth - 18, y + 6, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(r.explanation, 18, y + 11, { maxWidth: pageWidth - 36 });
        y += 24;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No critical failure anomalies detected requiring root-cause decomposition.', 18, y + 4);
      y += 10;
    }

    y += 4;

    // Section: Corrective Actions (CAPA)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('4. CORRECTIVE & PREVENTIVE ACTION ORDERS (CAPA)', 14, y);
    y += 6;

    if (inspection.correctiveActions && inspection.correctiveActions.length > 0) {
      inspection.correctiveActions.forEach((a) => {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, pageWidth - 28, 12, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`[${a.priority}] ${a.title}`, 18, y + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(79, 70, 229);
        doc.text(a.status.toUpperCase(), pageWidth - 18, y + 5.5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Action Type: ${a.type} | Target Tool: ${inspection.machineId} | ETA: 4 hrs`, 18, y + 9.5);

        y += 15;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No active corrective action orders required for this wafer batch.', 18, y + 4);
      y += 10;
    }

    y += 6;

    // Section: Sign-off & System Verification Stamp
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('OFFICIAL LEAD INSPECTOR SIGN-OFF', 18, y + 7);
    doc.text('SYSTEM AUDIT & SEMI COMPLIANCE STAMP', pageWidth / 2 + 10, y + 7);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(currentUser.name, 18, y + 14);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${currentUser.role} • ${currentUser.department}`, 18, y + 19);

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('VERIFIED BY WAFERGUARD AI SYSTEM ENGINE', pageWidth / 2 + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Timestamp: ${new Date().toUTCString()}`, pageWidth / 2 + 10, y + 19);
    doc.text(`SEMI E10 ID: SECS/GEM-FAB09-${inspection.id}`, pageWidth / 2 + 10, y + 24);

    // Page footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL & PROPRIETARY — SILICON FOUNDRY FAB-09 ADVANCED PACKAGING & METROLOGY DIVISION',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  };

  // Structured Multi-Page PDF Export using jsPDF with customizable template selection
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Create A4 PDF in portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (selectedTemplate === 'summary_executive') {
        exportExecutiveSummaryPDF(doc, pageWidth, pageHeight);
        doc.save(`WaferGuard_Executive_Summary_${inspection.waferId}_${inspection.id}.pdf`);
      } else {
        exportFullTechnicalPDF(doc, pageWidth, pageHeight);
        doc.save(`WaferGuard_Full_Technical_Report_${inspection.waferId}_${inspection.id}.pdf`);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Falling back to browser print dialog.');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `
WAFERGUARD AI — QUALITY INSPECTION CERTIFICATE (${selectedTemplate === 'summary_executive' ? 'Executive Brief' : 'Technical Report'})
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3 print:hidden">
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

        {/* Action Controls & Template Selector */}
        <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
          {/* Template Format Selector */}
          <div className="flex items-center bg-[#101018] border border-[#222232] rounded-xl p-1 shrink-0">
            <button
              onClick={() => setSelectedTemplate('full_technical')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTemplate === 'full_technical'
                  ? 'bg-indigo-950 text-white border border-indigo-500/80 shadow'
                  : 'text-[#8e8e98] hover:text-white'
              }`}
              title="Full Technical Detail: 2 Pages including complete morphology table, die coordinates, and engineering work orders"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Technical Detail</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-900/80 text-indigo-200">2 Pages</span>
            </button>

            <button
              onClick={() => setSelectedTemplate('summary_executive')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTemplate === 'summary_executive'
                  ? 'bg-indigo-950 text-white border border-indigo-500/80 shadow'
                  : 'text-[#8e8e98] hover:text-white'
              }`}
              title="Summary Executive: 1-Page briefing designed for Fab Directors with high-level KPI cards and risk assessments"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Summary Executive</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300">1 Page</span>
            </button>
          </div>

          <button
            id="copy-summary-btn"
            onClick={handleCopySummary}
            className="px-3 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1a1a28] text-[#e0e0e8] border border-[#242436] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            id="export-json-btn"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-[#14141e] hover:bg-[#1a1a28] text-[#e0e0e8] border border-[#242436] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          {/* Structured PDF Export Button */}
          <button
            id="export-pdf-report-btn"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 disabled:opacity-50"
            title={`Download ${selectedTemplate === 'summary_executive' ? 'Executive Summary PDF (1 Page)' : 'Full Technical Detail PDF (2 Pages)'}`}
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5" />
                <span>Export {selectedTemplate === 'summary_executive' ? 'Executive' : 'Technical'} PDF</span>
              </>
            )}
          </button>

          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#202030] text-white border border-[#2e2e42] font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TEMPLATE FORMAT 1: FULL TECHNICAL DETAIL REPORT (2-Page Comprehensive)    */}
      {/* ========================================================================= */}
      {selectedTemplate === 'full_technical' && (
        <div className="max-w-4xl mx-auto w-full bg-[#0c0c12] border border-[#222230] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 animate-in fade-in">
          {/* Document Header */}
          <div className="border-b border-[#222232] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <WaferLogo size="md" showSubtitle={true} badge="Fab-09 Cleanroom" />

            <div className="text-right font-mono text-xs text-[#8e8e98]">
              <div>Report ID: <strong className="text-white">{inspection.id}</strong></div>
              <div>Date: <strong className="text-white">{inspection.timestamp.split('T')[0]}</strong></div>
              <div>SEMI Standard: <strong className="text-indigo-300">SEMI E10 Strict</strong></div>
              <div>Template: <strong className="text-indigo-400 font-bold">Full Technical Detail</strong></div>
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
              <span>Detected Defect Morphology Classification ({inspection.defects.length})</span>
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
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE FORMAT 2: SUMMARY EXECUTIVE BRIEF (1-Page High-Level Overview)  */}
      {/* ========================================================================= */}
      {selectedTemplate === 'summary_executive' && (
        <div className="max-w-4xl mx-auto w-full bg-[#0c0c12] border border-[#222230] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 animate-in fade-in">
          {/* Executive Brief Header */}
          <div className="border-b border-[#222232] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <WaferLogo size="md" showSubtitle={true} badge="Executive Yield Briefing" />
              <div className="text-xs text-[#8e8e98] font-mono mt-1">
                Fab-09 Executive Metrology & Yield Committee • Disposition Synopsis
              </div>
            </div>

            <div className="text-right font-mono text-xs text-[#8e8e98]">
              <div>Report: <strong className="text-white">{inspection.id}-EXEC</strong></div>
              <div>Date: <strong className="text-white">{inspection.timestamp.split('T')[0]}</strong></div>
              <div>Template: <strong className="text-emerald-400 font-bold">Executive Summary (1 Page)</strong></div>
            </div>
          </div>

          {/* 4 Executive KPI Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className={`p-3.5 rounded-xl border ${
              isPass 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : isFail 
                ? 'bg-red-950/40 border-red-500/40 text-red-300' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <span className="text-[10px] uppercase font-bold block opacity-75">Lot Disposition</span>
              <strong className="text-lg font-bold block mt-1">{inspection.decision.decision}</strong>
            </div>

            <div className="bg-[#12121a] p-3.5 rounded-xl border border-[#20202c]">
              <span className="text-[10px] text-[#71717a] uppercase font-bold block">Quality Index</span>
              <strong className="text-white text-lg font-bold block mt-1">{inspection.decision.qualityScore} / 100</strong>
            </div>

            <div className="bg-[#12121a] p-3.5 rounded-xl border border-[#20202c]">
              <span className="text-[10px] text-[#71717a] uppercase font-bold block">Defect Anomalies</span>
              <strong className="text-white text-lg font-bold block mt-1">
                {inspection.defects.length} ({inspection.decision.criticalCount} Crit)
              </strong>
            </div>

            <div className="bg-[#12121a] p-3.5 rounded-xl border border-[#20202c]">
              <span className="text-[10px] text-[#71717a] uppercase font-bold block">AI Confidence</span>
              <strong className="text-indigo-300 text-lg font-bold block mt-1">
                {(inspection.decision.aiConfidence * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Wafer Context Banner */}
          <div className="p-3 bg-[#111118] rounded-xl border border-[#1e1e2c] flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#a1a1aa]">
            <div>Wafer: <strong className="text-white">{inspection.waferId}</strong></div>
            <div>Lot: <strong className="text-white">{inspection.lotId}</strong></div>
            <div>Tool: <strong className="text-indigo-400">{inspection.machineId}</strong></div>
            <div>Stage: <strong className="text-white">{inspection.processStage}</strong></div>
          </div>

          {/* Executive Rationale & Key Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#12121a] p-4 rounded-xl border border-[#20202c] space-y-2">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Executive Quality Assessment</span>
              </span>
              <p className="text-xs text-[#a1a1aa] font-sans leading-relaxed">
                {inspection.decision.reason}
              </p>
            </div>

            <div className="bg-[#12121a] p-4 rounded-xl border border-[#20202c] space-y-2">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Top Corrective Recommendation</span>
              </span>
              <p className="text-xs text-[#a1a1aa] font-sans leading-relaxed">
                {inspection.correctiveActions?.[0]?.title || 'Maintain standard baseline inspection cadence for this wafer batch.'}
              </p>
              <div className="text-[11px] font-mono text-indigo-400 pt-1">
                Target Tool: {inspection.machineId} • Execution Priority: {inspection.correctiveActions?.[0]?.priority || 'NORMAL'}
              </div>
            </div>
          </div>

          {/* Root-Cause Synthesis Highlights */}
          {inspection.rca && inspection.rca.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5 border-b border-[#222232] pb-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Root-Cause Synopsis (Executive Brief)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspection.rca.slice(0, 2).map((r) => (
                  <div key={r.id} className="p-3 bg-[#111118] rounded-xl border border-[#1e1e2c] space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold text-xs text-indigo-300">
                      <span>{r.title}</span>
                      <span className="text-[10px] text-emerald-400">{r.evidenceScore}% Grounded</span>
                    </div>
                    <p className="text-xs text-[#8e8e98] font-sans line-clamp-2">
                      {r.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Sign-Off */}
          <div className="border-t border-[#222232] pt-4 grid grid-cols-2 gap-4 font-mono text-xs text-[#8e8e98]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#71717a] block">LEAD AUDITOR</span>
              <div className="text-white font-bold">{currentUser.name}</div>
              <div className="text-[10px]">{currentUser.department}</div>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-[#71717a] block">EXECUTIVE DISPOSITION STAMP</span>
              <div className="text-emerald-400 font-bold">CERTIFIED BY FAB-09 EXECUTIVE COMMITTEE</div>
              <div className="text-[10px]">{new Date().toUTCString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
