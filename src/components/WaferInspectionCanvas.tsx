import React, { useState, useRef, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Grid, 
  Eye, 
  EyeOff, 
  Crosshair, 
  Sliders, 
  Flame,
  AlertTriangle,
  Radio,
  Tag,
  ShieldAlert,
  Info
} from 'lucide-react';
import { DefectItem, DefectSeverity } from '../types';

interface Props {
  waferId: string;
  diameterMm: number;
  defects: DefectItem[];
  selectedDefectId?: string;
  onSelectDefect?: (defect: DefectItem) => void;
  isInspecting?: boolean;
  initialViewMode?: 'annotated' | 'original' | 'split';
}

export const WaferInspectionCanvas: React.FC<Props> = ({
  waferId,
  diameterMm,
  defects,
  selectedDefectId,
  onSelectDefect,
  isInspecting = false,
  initialViewMode = 'annotated'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Layer Toggles
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [heatmapIntensity, setHeatmapIntensity] = useState<'standard' | 'high' | 'ultra'>('high');
  const [highlightFailureRegions, setHighlightFailureRegions] = useState<boolean>(true);
  
  // View Modes: 'annotated', 'original', 'split'
  const [viewMode, setViewMode] = useState<'annotated' | 'original' | 'split'>(initialViewMode);
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage for split slider

  const [hoveredDefect, setHoveredDefect] = useState<DefectItem | null>(null);
  const [cursorPos, setCursorPos] = useState<{ dieX: number; dieY: number; radiusMm: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 6));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.8));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left - centerX - panOffset.x;
      const mouseY = e.clientY - rect.top - centerY - panOffset.y;

      const normX = mouseX / (180 * zoomLevel);
      const normY = mouseY / (180 * zoomLevel);
      const distanceNorm = Math.sqrt(normX * normX + normY * normY);

      const dieX = Math.min(30, Math.max(0, Math.round((normX + 1) * 15)));
      const dieY = Math.min(30, Math.max(0, Math.round((normY + 1) * 15)));
      const radiusMm = Math.round(distanceNorm * (diameterMm / 2));

      setCursorPos({ dieX, dieY, radiusMm });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getSeverityColors = (severity: DefectSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.18)',
          text: 'text-red-400',
          badge: 'bg-red-950/90 text-red-300 border-red-500/50'
        };
      case 'high':
        return {
          stroke: '#f97316',
          fill: 'rgba(249, 115, 22, 0.18)',
          text: 'text-orange-400',
          badge: 'bg-orange-950/90 text-orange-300 border-orange-500/50'
        };
      case 'medium':
        return {
          stroke: '#eab308',
          fill: 'rgba(234, 179, 8, 0.15)',
          text: 'text-amber-400',
          badge: 'bg-amber-950/90 text-amber-300 border-amber-500/50'
        };
      case 'low':
      default:
        return {
          stroke: '#06b6d4',
          fill: 'rgba(6, 182, 212, 0.15)',
          text: 'text-cyan-400',
          badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
        };
    }
  };

  // Convert normalized percent coordinates (0-100) into SVG 400x400 wafer space
  const mappedDefects = useMemo(() => {
    return defects.map(d => {
      // Map percentage location to SVG coordinates inside the wafer
      const cx = (d.location.x / 100) * 320 + 40;
      const cy = (d.location.y / 100) * 320 + 40;
      
      // Calculate distance from center (200, 200)
      const distFromCenter = Math.sqrt((cx - 200) ** 2 + (cy - 200) ** 2);
      const isEdgeRegion = distFromCenter >= 140;
      const isNotchRegion = cy >= 280 && Math.abs(cx - 200) <= 60;
      const isCenterCore = distFromCenter < 90;

      // Base radius for heat distribution
      let heatRadius = 38;
      if (d.severity === 'critical') heatRadius = 55;
      else if (d.severity === 'high') heatRadius = 44;
      else if (d.severity === 'medium') heatRadius = 34;

      if (heatmapIntensity === 'ultra') heatRadius *= 1.35;
      else if (heatmapIntensity === 'standard') heatRadius *= 0.8;

      return {
        ...d,
        svgCx: cx,
        svgCy: cy,
        distFromCenter,
        isEdgeRegion,
        isNotchRegion,
        isCenterCore,
        heatRadius
      };
    });
  }, [defects, heatmapIntensity]);

  // Spatial cluster zones calculation
  const highDensityClusters = useMemo(() => {
    if (mappedDefects.length === 0) return [];
    
    // Check if there are edge clusters or notch clusters
    const edgeDefects = mappedDefects.filter(d => d.isEdgeRegion);
    const centerDefects = mappedDefects.filter(d => d.isCenterCore);
    const notchDefects = mappedDefects.filter(d => d.isNotchRegion);

    const clusters = [];
    if (edgeDefects.length >= 1) {
      const avgX = edgeDefects.reduce((acc, d) => acc + d.svgCx, 0) / edgeDefects.length;
      const avgY = edgeDefects.reduce((acc, d) => acc + d.svgCy, 0) / edgeDefects.length;
      clusters.push({
        id: 'cluster-edge-radial',
        name: 'Zone A: Edge Radial Excursion Zone',
        description: 'High shear thermal stress & chamber clamp ring particle deposition',
        cx: avgX,
        cy: avgY,
        rx: 52,
        ry: 42,
        severity: 'critical' as DefectSeverity,
        count: edgeDefects.length,
        riskScore: '94% P0 Quarantine Risk'
      });
    }

    if (centerDefects.length >= 1) {
      const avgX = centerDefects.reduce((acc, d) => acc + d.svgCx, 0) / centerDefects.length;
      const avgY = centerDefects.reduce((acc, d) => acc + d.svgCy, 0) / centerDefects.length;
      clusters.push({
        id: 'cluster-center-particles',
        name: 'Zone B: Core Die Contamination Zone',
        description: 'Suspended aerosol flakes from showerhead gas injector',
        cx: avgX,
        cy: avgY,
        rx: 44,
        ry: 38,
        severity: 'high' as DefectSeverity,
        count: centerDefects.length,
        riskScore: '78% Yield Risk'
      });
    }

    return clusters;
  }, [mappedDefects]);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#08080b] border border-[#1f1f23] rounded-xl overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-10 bg-[#0d0d12] border-b border-[#1f1f23] px-3 flex items-center justify-between z-10 shrink-0 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 font-mono">
          <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
            <span>WAFER STAGE:</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#181820] text-white font-semibold border border-[#272730]">
            {waferId}
          </span>
          <span className="text-[10px] text-[#71717a] hidden sm:inline">
            Ø {diameterMm}mm (SEMI M1 Spec)
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#14141a] border border-[#23232c] rounded-lg p-0.5 font-mono text-[11px]">
          <button
            id="canvas-view-annotated-btn"
            onClick={() => setViewMode('annotated')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              viewMode === 'annotated' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            Annotated AI
          </button>
          <button
            id="canvas-view-original-btn"
            onClick={() => setViewMode('original')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              viewMode === 'original' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            Raw Surface
          </button>
          <button
            id="canvas-view-split-btn"
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              viewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-[#8e8e93] hover:text-[#e0e0e0]'
            }`}
          >
            Split Compare
          </button>
        </div>

        {/* Layer Toggles & Heatmap Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <div className="flex items-center gap-1 bg-[#14141a] border border-[#23232c] rounded-lg px-1.5 py-0.5">
            {/* Spatial Heatmap Toggle */}
            <button
              id="canvas-toggle-heatmap-btn"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1 text-[10px] font-bold ${
                showHeatmap ? 'text-amber-300 bg-amber-950/70 border border-amber-500/40' : 'text-[#71717a]'
              }`}
              title="Toggle Spatial Defect Distribution Heatmap"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Heatmap</span>
            </button>

            {/* High Density Failure Region Contour Toggle */}
            <button
              id="canvas-toggle-failure-regions-btn"
              onClick={() => setHighlightFailureRegions(!highlightFailureRegions)}
              className={`p-1 rounded cursor-pointer transition ${
                highlightFailureRegions ? 'text-red-400 bg-red-950/60' : 'text-[#71717a]'
              }`}
              title="Highlight High-Density Failure Regions & Clusters"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>

            {/* Annotations & Grid Toggles */}
            <button
              id="canvas-toggle-annotations-btn"
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`p-1 rounded cursor-pointer transition ${showAnnotations ? 'text-indigo-400 bg-indigo-950/60' : 'text-[#71717a]'}`}
              title="Toggle Defect Bounding Boxes"
            >
              {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              id="canvas-toggle-labels-btn"
              onClick={() => setShowLabels(!showLabels)}
              className={`p-1 rounded cursor-pointer transition ${showLabels ? 'text-indigo-400 bg-indigo-950/60' : 'text-[#71717a]'}`}
              title="Toggle Defect Badges & Confidence"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
            <button
              id="canvas-toggle-grid-btn"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1 rounded cursor-pointer transition ${showGrid ? 'text-indigo-400 bg-indigo-950/60' : 'text-[#71717a]'}`}
              title="Toggle Die Reticle Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-[#14141a] border border-[#23232c] rounded-lg p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1 text-[#8e8e93] hover:text-white transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 text-[#8e8e93] hover:text-white transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 text-[#8e8e93] hover:text-white transition cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Sub-Bar when Heatmap is Enabled */}
      {showHeatmap && (
        <div className="bg-[#0b0b14] border-b border-[#1b1b28] px-3 py-1 flex items-center justify-between text-[10px] font-mono text-zinc-400 z-10">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>SPATIAL DENSITY HEATMAP:</span>
            </span>
            <span className="text-zinc-300">
              {mappedDefects.length} Coordinate Hotspots Active
            </span>
            <span className="text-[#52525b]">•</span>
            <div className="flex items-center gap-1">
              <span>Intensity:</span>
              {(['standard', 'high', 'ultra'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setHeatmapIntensity(mode)}
                  className={`px-1.5 py-0.2 rounded transition capitalize cursor-pointer ${
                    heatmapIntensity === mode ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span>Density Scale:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-cyan-500/60 inline-block" />
              <span className="text-[9px]">Low</span>
              <span className="w-2.5 h-2 rounded bg-amber-500/70 inline-block" />
              <span className="text-[9px]">Moderate</span>
              <span className="w-2.5 h-2 rounded bg-red-500 inline-block" />
              <span className="text-[9px] text-red-300 font-bold">P0 Excursion</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Viewport Area */}
      <div 
        ref={containerRef}
        className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-${isDragging ? 'grabbing' : 'grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Inspection Laser Scan Sweep Effect */}
        {isInspecting && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-scanline" />
            <div className="absolute top-3 left-3 bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 shadow-lg">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
              <span>E-BEAM & OPTICAL DEFECT MAPPING IN PROGRESS...</span>
            </div>
          </div>
        )}

        {/* Wafer Stage Container Scaled and Panned */}
        <div 
          className="relative transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            width: '400px',
            height: '400px'
          }}
        >
          {/* Main SVG Circular Wafer Canvas */}
          <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
            <defs>
              {/* Silicon Mirror Metallic Sheen */}
              <linearGradient id="siliconSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a1c24" />
                <stop offset="35%" stopColor="#0f1117" />
                <stop offset="65%" stopColor="#1e2230" />
                <stop offset="100%" stopColor="#0d0e14" />
              </linearGradient>

              {/* Micro-Die Pattern Definition */}
              <pattern id="microDieGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="15" height="15" fill="#13141b" stroke="#1f202b" strokeWidth="0.8" />
                {/* Circuit Trace Micro-texture */}
                <path d="M 3 3 L 12 3 M 3 7 L 8 7 M 7 12 L 12 12" stroke="#252736" strokeWidth="0.5" fill="none" />
                <rect x="10" y="5" width="2" height="2" fill="#2d3145" />
              </pattern>

              {/* Dynamic Defect Radial Heat Gradients */}
              {mappedDefects.map((d) => (
                <radialGradient key={`heat-grad-${d.id}`} id={`defectHeatGrad-${d.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="20%" stopColor={d.severity === 'critical' ? '#ef4444' : '#f97316'} stopOpacity="0.7" />
                  <stop offset="50%" stopColor={d.severity === 'critical' ? '#f97316' : '#eab308'} stopOpacity="0.45" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              ))}

              {/* High-Density Cluster Area Gradient */}
              <radialGradient id="clusterPulseGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>

              {/* Circular Wafer Clip Path with SEMI Orientation Notch at bottom (200, 390) */}
              <clipPath id="waferClip">
                <circle cx="200" cy="200" r="185" />
              </clipPath>
            </defs>

            {/* Wafer Outer Bevel Ring */}
            <circle cx="200" cy="200" r="188" fill="#0b0c10" stroke="#33384a" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="185" fill="url(#siliconSheen)" stroke="#434960" strokeWidth="1.5" />

            {/* Wafer Active Die Pattern Area */}
            <g clipPath="url(#waferClip)">
              {/* Die Matrix Background */}
              <rect x="0" y="0" width="400" height="400" fill="url(#microDieGrid)" />

              {/* Central Mirror Reflection Shimmer */}
              <ellipse cx="160" cy="140" rx="140" ry="85" fill="#ffffff" opacity="0.03" transform="rotate(-25 160 140)" />

              {/* Spatial Defect Distribution Heatmap Layer */}
              {showHeatmap && (
                <g id="spatial-defect-heatmap-layer" opacity={0.88}>
                  {mappedDefects.map((d) => (
                    <circle
                      key={`heat-spot-${d.id}`}
                      cx={d.svgCx}
                      cy={d.svgCy}
                      r={d.heatRadius}
                      fill={`url(#defectHeatGrad-${d.id})`}
                      className="mix-blend-screen"
                    />
                  ))}
                </g>
              )}

              {/* High-Density Failure Regions Highlights & Contours */}
              {showHeatmap && highlightFailureRegions && highDensityClusters.map((cluster) => (
                <g key={cluster.id} id={`failure-region-${cluster.id}`}>
                  {/* Glowing Cluster Base */}
                  <ellipse
                    cx={cluster.cx}
                    cy={cluster.cy}
                    rx={cluster.rx}
                    ry={cluster.ry}
                    fill="url(#clusterPulseGrad)"
                    className="mix-blend-screen"
                  />
                  {/* Dashed High-Density Perimeter Contour */}
                  <ellipse
                    cx={cluster.cx}
                    cy={cluster.cy}
                    rx={cluster.rx}
                    ry={cluster.ry}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                  {/* Cluster Centroid Marker */}
                  <circle
                    cx={cluster.cx}
                    cy={cluster.cy}
                    r="3"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </g>
              ))}

              {/* Reticle Grid Lines if Enabled */}
              {showGrid && (
                <g stroke="#3a3e54" strokeWidth="0.5" opacity="0.6">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <React.Fragment key={i}>
                      <line x1={i * 16} y1="0" x2={i * 16} y2="400" />
                      <line x1="0" y1={i * 16} x2="400" y2={i * 16} />
                    </React.Fragment>
                  ))}
                </g>
              )}

              {/* SEMI 3mm Outer Edge Exclusion Zone Boundary */}
              <circle 
                cx="200" 
                cy="200" 
                r="173" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
                opacity="0.6" 
              />

              {/* Orientation Flat / Notch at 6 o'clock */}
              <path d="M 194 384 L 200 380 L 206 384 Z" fill="#08080c" stroke="#6366f1" strokeWidth="1" />
            </g>

            {/* High-Density Zone Labels on SVG */}
            {showHeatmap && highlightFailureRegions && highDensityClusters.map((cluster) => (
              <g key={`label-${cluster.id}`} transform={`translate(${Math.min(310, Math.max(70, cluster.cx))}, ${Math.max(25, cluster.cy - cluster.ry - 8)})`}>
                <rect
                  x="-65"
                  y="-11"
                  width="130"
                  height="16"
                  rx="3"
                  fill="#1a0b0e"
                  stroke="#ef4444"
                  strokeWidth="0.8"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="0"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#fca5a5"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  HIGH DENSITY: {cluster.name.split(':')[0]}
                </text>
              </g>
            ))}

            {/* Wafer Coordinate Axis Markers */}
            <g fontSize="8" fontFamily="monospace" fill="#52566b">
              <text x="200" y="14" textAnchor="middle">12:00 (N)</text>
              <text x="388" y="203" textAnchor="start">03:00 (E)</text>
              <text x="200" y="396" textAnchor="middle">06:00 (Notch)</text>
              <text x="12" y="203" textAnchor="end">09:00 (W)</text>
            </g>
          </svg>

          {/* Defect Bounding Boxes & Annotations Overlay */}
          {showAnnotations && viewMode !== 'original' && (
            <div className="absolute inset-0 pointer-events-none">
              {defects.map((defect) => {
                const colors = getSeverityColors(defect.severity);
                const isSelected = selectedDefectId === defect.id;
                const isHovered = hoveredDefect?.id === defect.id;

                // Split comparison clip mask if in split mode
                const shouldRender = viewMode !== 'split' || (defect.location.x <= splitPosition);

                if (!shouldRender) return null;

                return (
                  <div
                    key={defect.id}
                    id={`defect-bounding-box-${defect.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDefect?.(defect);
                    }}
                    onMouseEnter={() => setHoveredDefect(defect)}
                    onMouseLeave={() => setHoveredDefect(null)}
                    className="absolute pointer-events-auto cursor-pointer transition-all duration-150 group"
                    style={{
                      left: `${defect.location.x}%`,
                      top: `${defect.location.y}%`,
                      width: `${defect.location.width}%`,
                      height: `${defect.location.height}%`,
                      border: `2px ${defect.severity === 'critical' ? 'dashed' : 'solid'} ${colors.stroke}`,
                      backgroundColor: isSelected || isHovered ? colors.fill.replace('0.18', '0.35') : colors.fill,
                      boxShadow: isSelected 
                        ? `0 0 16px ${colors.stroke}, inset 0 0 10px ${colors.stroke}` 
                        : isHovered 
                        ? `0 0 10px ${colors.stroke}` 
                        : 'none',
                      borderRadius: '3px'
                    }}
                  >
                    {/* Defect Tag Badge with ID & Confidence */}
                    {showLabels && (
                      <div 
                        className={`absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md transition-transform ${
                          colors.badge
                        } ${isSelected ? 'scale-105 ring-1 ring-white/60' : 'group-hover:scale-105'}`}
                      >
                        <span>{defect.id}</span>
                        <span>•</span>
                        <span>{Math.round(defect.confidence * 100)}%</span>
                      </div>
                    )}

                    {/* Corner Crosshairs */}
                    <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-white rounded-full shadow" />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full shadow" />
                    <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full shadow" />
                    <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white rounded-full shadow" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Split Mode Divider Slider */}
          {viewMode === 'split' && (
            <div 
              className="absolute inset-y-0 z-20 pointer-events-none"
              style={{ left: `${splitPosition}%` }}
            >
              <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0d0d12] border-2 border-cyan-400 flex items-center justify-center text-[8px] font-mono text-cyan-300 font-bold shadow-lg pointer-events-auto cursor-ew-resize">
                ⇄
              </div>
            </div>
          )}
        </div>

        {/* Hovered Defect Info Card Tooltip */}
        {hoveredDefect && (
          <div className="absolute bottom-4 left-4 z-20 bg-[#0c0c12]/95 border border-indigo-500/40 rounded-lg p-2.5 max-w-xs shadow-2xl backdrop-blur-md font-mono text-xs animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-[#1f1f28] pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${getSeverityColors(hoveredDefect.severity).badge}`}>
                  {hoveredDefect.severity}
                </span>
                <span className="font-bold text-white text-xs">{hoveredDefect.id}</span>
              </div>
              <span className="text-emerald-400 font-bold text-xs">
                {(hoveredDefect.confidence * 100).toFixed(1)}% AI Conf.
              </span>
            </div>

            <p className="font-sans font-medium text-white text-xs mb-1">
              {hoveredDefect.name}
            </p>
            <p className="text-[10px] text-[#a1a1aa] font-sans leading-relaxed mb-2">
              {hoveredDefect.description}
            </p>

            <div className="grid grid-cols-2 gap-1 text-[9px] text-[#71717a] border-t border-[#1a1a24] pt-1.5">
              <div>Die X/Y: <strong className="text-white">[{hoveredDefect.dieCoordinate?.x || 14}, {hoveredDefect.dieCoordinate?.y || 19}]</strong></div>
              <div>Est. Area: <strong className="text-white">{hoveredDefect.estimatedSizeUm} µm²</strong></div>
            </div>
          </div>
        )}

        {/* Live Coordinate Status Bar */}
        <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-3 bg-[#0c0c12]/90 border border-[#1f1f28] rounded-md px-2.5 py-1 text-[10px] font-mono text-[#8e8e98] backdrop-blur-sm">
          {cursorPos && (
            <>
              <span>Die: <strong className="text-indigo-300">X:{cursorPos.dieX} Y:{cursorPos.dieY}</strong></span>
              <span>•</span>
              <span>Radius: <strong className="text-cyan-300">{cursorPos.radiusMm}mm</strong></span>
              <span>•</span>
            </>
          )}
          <span>Defects: <strong className="text-white">{defects.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">SEMI 300mm Mode</span>
        </div>
      </div>
    </div>
  );
};
