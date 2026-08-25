import React, { useState, useMemo } from 'react';
import { 
  PredictiveChamberForecast, 
  PreventiveActionRecommendation, 
  UserProfile 
} from '../types';
import { PREDICTIVE_CHAMBER_FORECASTS } from '../data/predictiveMaintenanceData';
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Gauge, 
  Wrench, 
  Zap, 
  Thermometer, 
  Wind, 
  ShieldAlert, 
  Calendar, 
  Play, 
  Sparkles, 
  ArrowUpRight, 
  Layers, 
  BarChart3, 
  ChevronRight, 
  Info,
  Check,
  Flame,
  FileCheck2,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend
} from 'recharts';

interface Props {
  currentUser?: UserProfile;
  onNavigateTab: (tab: any) => void;
  onTriggerCopilot?: (query: string) => void;
}

export const PredictiveMaintenanceView: React.FC<Props> = ({
  currentUser,
  onNavigateTab,
  onTriggerCopilot
}) => {
  const [forecasts, setForecasts] = useState<PredictiveChamberForecast[]>(PREDICTIVE_CHAMBER_FORECASTS);
  const [selectedChamberId, setSelectedChamberId] = useState<string>('CH-B');
  const [activeTelemetrySensor, setActiveTelemetrySensor] = useState<'rfPower' | 'pressure' | 'temperature' | 'vibration' | 'gasFlow'>('rfPower');
  const [forecastHorizonHours, setForecastHorizonHours] = useState<number>(48);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Active selected chamber
  const activeChamber = useMemo(() => {
    return forecasts.find(f => f.chamberId === selectedChamberId) || forecasts[0];
  }, [forecasts, selectedChamberId]);

  // Overall Fab Predictive Risk Score
  const averageHealth = useMemo(() => {
    const total = forecasts.reduce((acc, curr) => acc + curr.healthScore, 0);
    return Math.round(total / forecasts.length);
  }, [forecasts]);

  const criticalChambersCount = useMemo(() => {
    return forecasts.filter(f => f.riskLevel === 'CRITICAL_IMMINENT' || f.riskLevel === 'HIGH_PRECURSOR').length;
  }, [forecasts]);

  const totalCostSavingsAtRisk = useMemo(() => {
    return forecasts.reduce((acc, curr) => {
      const chamberSum = curr.recommendedActions.reduce((a, b) => a + b.estimatedCostSavingsUsd, 0);
      return acc + chamberSum;
    }, 0);
  }, [forecasts]);

  // Filtered telemetry data according to horizon
  const chartData = useMemo(() => {
    const raw = activeChamber.telemetryTrends[activeTelemetrySensor];
    return raw.filter(pt => pt.timeHour <= forecastHorizonHours);
  }, [activeChamber, activeTelemetrySensor, forecastHorizonHours]);

  const getRiskBadge = (level: PredictiveChamberForecast['riskLevel']) => {
    switch (level) {
      case 'CRITICAL_IMMINENT':
        return {
          label: 'CRITICAL FAILURE IMMINENT',
          style: 'bg-red-950/80 text-red-300 border-red-500/60 animate-pulse',
          dot: 'bg-red-400 animate-ping'
        };
      case 'HIGH_PRECURSOR':
        return {
          label: 'HIGH PRECURSOR DRIFT',
          style: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
          dot: 'bg-orange-400'
        };
      case 'MODERATE_DRIFT':
        return {
          label: 'MODERATE WEAR TREND',
          style: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400'
        };
      case 'HEALTHY_NOMINAL':
      default:
        return {
          label: 'NOMINAL HEALTH',
          style: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400'
        };
    }
  };

  const handleExecuteAction = (action: PreventiveActionRecommendation) => {
    setExecutingActionId(action.id);
    setTimeout(() => {
      setExecutingActionId(null);
      setCompletedActionIds(prev => [...prev, action.id]);
      setActionSuccessToast(`Work order dispatched: ${action.title}. Cleanroom technician & automated recipe scheduled.`);
      setTimeout(() => setActionSuccessToast(null), 4000);

      // Boost chamber health slightly after executing preventive action
      setForecasts(prev => prev.map(f => {
        if (f.chamberId === action.chamberId) {
          return {
            ...f,
            healthScore: Math.min(95, f.healthScore + 28),
            remainingUsefulLifeHours: f.remainingUsefulLifeHours + 48,
            failureProbability24h: Math.max(2.5, f.failureProbability24h * 0.2),
            riskLevel: 'HEALTHY_NOMINAL'
          };
        }
        return f;
      }));
    }, 1200);
  };

  // Sensor unit mapping
  const sensorConfigs = {
    rfPower: { label: 'RF Power / Reflected Match', icon: Zap, unit: 'Watts', stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
    pressure: { label: 'Chamber Vacuum Pressure', icon: Gauge, unit: 'mTorr', stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)' },
    temperature: { label: 'Pyrometer / Liner Temp', icon: Thermometer, unit: '°C', stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)' },
    vibration: { label: 'Turbopump Vibration FFT', icon: Activity, unit: 'g RMS', stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' },
    gasFlow: { label: 'Mass Flow Process Gas', icon: Wind, unit: 'sccm', stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#07070a] p-3 sm:p-5 space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1f1f26] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400 animate-pulse" />
              <span>Predictive Maintenance & Chamber Failure Forecasting</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
              Weibull + LSTM RUL
            </span>
          </div>
          <p className="text-xs text-[#8e8e98] mt-0.5">
            Real-time multi-sensor telemetry forecasting, remaining useful life (RUL) modeling, and early anomaly precursor detection
          </p>
        </div>

        {/* Global Summary KPI Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="bg-[#0f0f16] border border-[#262633] px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[#8e8e98] text-[11px]">Fab Fleet Health:</span>
            <span className={`font-bold ${averageHealth < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {averageHealth}%
            </span>
          </div>

          <div className="bg-red-950/40 border border-red-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="font-bold">{criticalChambersCount} At-Risk Chambers</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 text-emerald-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">${(totalCostSavingsAtRisk / 1000).toFixed(0)}k Scrap Protected</span>
          </div>
        </div>
      </div>

      {/* Action Success Notification Toast */}
      {actionSuccessToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-emerald-200 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessToast}</span>
          </div>
          <button 
            onClick={() => setActionSuccessToast(null)}
            className="text-[10px] text-emerald-400 hover:text-white px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chamber Fleet Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 font-mono text-xs">
        {forecasts.map((chamber) => {
          const isSelected = selectedChamberId === chamber.chamberId;
          const badge = getRiskBadge(chamber.riskLevel);
          const isCritical = chamber.riskLevel === 'CRITICAL_IMMINENT';

          return (
            <button
              key={chamber.chamberId}
              id={`forecast-chamber-${chamber.chamberId}`}
              onClick={() => setSelectedChamberId(chamber.chamberId)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-400'
                  : 'bg-[#0c0c10] hover:bg-[#14141c] border-[#1f1f26] text-[#8e8e98]'
              }`}
            >
              {isCritical && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-lg animate-ping" />
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-white">{chamber.machineId}</span>
                  <span className="text-[10px] text-indigo-300 ml-1.5">{chamber.chamberId}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              </div>

              <div className="truncate text-[11px] text-zinc-300 font-sans">
                {chamber.chamberName.split('(')[0]}
              </div>

              {/* RUL & Health Score */}
              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-[#71717a]">RUL: </span>
                  <strong className={chamber.remainingUsefulLifeHours < 24 ? 'text-red-400' : 'text-emerald-400'}>
                    {chamber.remainingUsefulLifeHours.toFixed(1)}h
                  </strong>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#71717a]">Health:</span>
                  <strong className={chamber.healthScore < 60 ? 'text-red-400' : 'text-emerald-400'}>
                    {chamber.healthScore}%
                  </strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Selected Chamber Predictive Deep-Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Chamber Profile & Degradation Drivers (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Chamber Health Card */}
          <div className="bg-[#0b0b10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  {activeChamber.machineId} • {activeChamber.stationType}
                </div>
                <h2 className="text-sm font-bold text-white mt-0.5">{activeChamber.chamberName}</h2>
                <div className="text-[11px] text-[#71717a] mt-0.5">{activeChamber.machineName}</div>
                <div className="text-[10px] text-[#8e8e98]">{activeChamber.location}</div>
              </div>
            </div>

            {/* Risk Badge */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${getRiskBadge(activeChamber.riskLevel).style}`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold">{getRiskBadge(activeChamber.riskLevel).label}</div>
                <div className="text-[10px] opacity-80 mt-0.5 leading-snug">{activeChamber.primaryFailureMode}</div>
              </div>
            </div>

            {/* Metric Grid: RUL, 24h Risk, Weibull */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#121218] border border-[#22222f] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#71717a] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Remaining Useful Life</span>
                </div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {activeChamber.remainingUsefulLifeHours.toFixed(1)} <span className="text-xs text-[#8e8e98]">Hours</span>
                </div>
                <div className="text-[9px] text-[#8e8e98] mt-0.5">Until critical threshold trip</div>
              </div>

              <div className="bg-[#121218] border border-[#22222f] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#71717a] flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-400" />
                  <span>24-Hour Failure Risk</span>
                </div>
                <div className={`text-lg font-bold mt-0.5 ${activeChamber.failureProbability24h > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {activeChamber.failureProbability24h.toFixed(1)}%
                </div>
                <div className="text-[9px] text-[#8e8e98] mt-0.5">72h Risk: {activeChamber.failureProbability72h.toFixed(1)}%</div>
              </div>

              <div className="bg-[#121218] border border-[#22222f] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#71717a]">Weibull Wearout (β)</div>
                <div className="text-sm font-bold text-indigo-300 mt-0.5">
                  β = {activeChamber.weibullBeta.toFixed(2)}
                </div>
                <div className="text-[9px] text-[#8e8e98] mt-0.5">
                  {activeChamber.weibullBeta > 1 ? 'Wear-out phase aging' : 'Random failure mode'}
                </div>
              </div>

              <div className="bg-[#121218] border border-[#22222f] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#71717a]">Chamber MTBF</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activeChamber.mtbfHours} <span className="text-xs text-[#8e8e98]">hrs</span>
                </div>
                <div className="text-[9px] text-[#8e8e98] mt-0.5">Char. Life (η): {activeChamber.weibullEta}h</div>
              </div>
            </div>
          </div>

          {/* Degradation Factors Breakdown Matrix */}
          <div className="bg-[#0b0b10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Root Degradation Contributors
              </span>
              <span className="text-[10px] text-[#8e8e98]">Pareto Impact</span>
            </div>

            <div className="space-y-3">
              {activeChamber.degradationFactors.map((factor) => {
                const isAnomaly = factor.status === 'anomaly';
                const isWarning = factor.status === 'warning';

                return (
                  <div key={factor.sensorId} className="space-y-1 bg-[#111118] p-2.5 rounded-lg border border-[#1e1e2b]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-200 truncate pr-2" title={factor.parameter}>
                        {factor.parameter}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isAnomaly ? 'bg-red-950 text-red-300 border border-red-500/40' :
                        isWarning ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        +{factor.driftPercentage.toFixed(1)}% Drift
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8e8e98]">
                      <span>Observed: <strong className="text-white">{factor.currentValue} {factor.unit}</strong></span>
                      <span>Nominal: {factor.nominalValue} {factor.unit}</span>
                    </div>

                    {/* Progress Bar of Failure Contribution */}
                    <div className="space-y-0.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-[#71717a]">
                        <span>Failure Contribution</span>
                        <span>{factor.contributionToFailure}%</span>
                      </div>
                      <div className="w-full bg-[#1e1e28] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isAnomaly ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${factor.contributionToFailure}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Time-Series Forecast & Actionable Work Orders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Sensor Forecast Chart Box */}
          <div className="bg-[#0b0b10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f1f26] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Chamber Sensor Telemetry & AI Forecast Curve
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    ±2σ Confidence Interval
                  </span>
                </div>
                <div className="text-[11px] text-[#8e8e98] mt-0.5 font-sans">
                  Historical telemetry (-24h to T-0) transitioned into autoregressive LSTM time-series forecast (+48h)
                </div>
              </div>

              {/* Forecast Horizon Selector */}
              <div className="flex items-center gap-1.5 bg-[#121218] p-1 rounded-lg border border-[#22222f]">
                <span className="text-[10px] text-[#71717a] px-1">Horizon:</span>
                {[12, 24, 48].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => setForecastHorizonHours(hrs)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      forecastHorizonHours === hrs
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-[#8e8e98] hover:text-white'
                    }`}
                  >
                    +{hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Sensor Switcher Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(sensorConfigs) as Array<keyof typeof sensorConfigs>).map((key) => {
                const cfg = sensorConfigs[key];
                const Icon = cfg.icon;
                const isActive = activeTelemetrySensor === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTelemetrySensor(key)}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer text-xs ${
                      isActive
                        ? 'bg-indigo-950 border-indigo-500/80 text-white font-bold'
                        : 'bg-[#111118] border-[#1e1e2b] text-[#8e8e98] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.stroke }} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Recharts Forecast Visualization */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sensorConfigs[activeTelemetrySensor].stroke} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={sensorConfigs[activeTelemetrySensor].stroke} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1c28" vertical={false} />
                  
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickLine={false}
                    domain={['auto', 'auto']}
                    unit={` ${sensorConfigs[activeTelemetrySensor].unit.split(' ')[0]}`}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c0d14', 
                      borderColor: '#2d3148',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff',
                      fontFamily: 'monospace'
                    }} 
                  />

                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} 
                  />

                  {/* Warning & Critical Reference Threshold Lines */}
                  {chartData[0]?.warningThreshold && (
                    <ReferenceLine 
                      y={chartData[0].warningThreshold} 
                      label={{ value: 'Warning Limit', fill: '#f59e0b', fontSize: 9, position: 'top' }} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                    />
                  )}
                  {chartData[0]?.criticalThreshold && (
                    <ReferenceLine 
                      y={chartData[0].criticalThreshold} 
                      label={{ value: 'Critical Trip Threshold', fill: '#ef4444', fontSize: 9, position: 'top' }} 
                      stroke="#ef4444" 
                      strokeDasharray="3 3" 
                    />
                  )}

                  {/* Now T-0 Divider */}
                  <ReferenceLine 
                    x="Now (T-0)" 
                    stroke="#6366f1" 
                    strokeWidth={1.5}
                    label={{ value: 'Live T-0', fill: '#818cf8', fontSize: 10, position: 'insideTopLeft' }} 
                  />

                  {/* Confidence Interval Upper/Lower Area (Projected future) */}
                  <Area
                    type="monotone"
                    dataKey="upperConfidence"
                    stroke="transparent"
                    fill="url(#confidenceBand)"
                    name="+2σ Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerConfidence"
                    stroke="transparent"
                    fill="transparent"
                    name="-2σ Lower Bound"
                  />

                  {/* Historical Observed & Projected Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="observedValue"
                    name={`Observed (${sensorConfigs[activeTelemetrySensor].unit})`}
                    stroke={sensorConfigs[activeTelemetrySensor].stroke}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: sensorConfigs[activeTelemetrySensor].stroke }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] text-[#71717a] pt-2 border-t border-[#1c1c28]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  <span>Solid Line: Sensor Telemetry & Expected Trajectory</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500/40 rounded-full" />
                  <span>Shaded Cone: 95% Confidence Forecast Dispersion</span>
                </div>
              </div>
              <div>
                <span>Sensor ID: <strong className="text-white">{activeChamber.degradationFactors[0]?.sensorId || 'SEN-03'}</strong></span>
              </div>
            </div>
          </div>

          {/* Actionable Preventive Maintenance Orders Box */}
          <div className="bg-[#0b0b10] border border-[#1f1f26] rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                AI-Prescribed Preventive Work Orders & Mitigation
              </span>
              <span className="text-[10px] text-indigo-400">
                Guaranteed MTBF Recovery
              </span>
            </div>

            <div className="space-y-2.5">
              {activeChamber.recommendedActions.map((action) => {
                const isExecuted = completedActionIds.includes(action.id);
                const isExecuting = executingActionId === action.id;

                return (
                  <div 
                    key={action.id}
                    className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                      isExecuted 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                        : 'bg-[#111118] border-[#1e1e2b] text-white hover:border-[#2d2d3f]'
                    }`}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          action.priority === 'P0' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                          action.priority === 'P1' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                        }`}>
                          {action.priority} Priority
                        </span>
                        <h4 className="font-bold text-xs text-white">{action.title}</h4>
                      </div>

                      <p className="text-[11px] text-[#8e8e98] font-sans">
                        {action.recommendedAction}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#71717a] pt-1">
                        <span className="text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Execute within: {action.deadlineHours}h
                        </span>
                        <span>Est. Downtime: {action.estimatedDowntimeMinutes} min</span>
                        <span className="text-emerald-400 font-bold">
                          Protects: ${action.estimatedCostSavingsUsd.toLocaleString()}
                        </span>
                        <span className="text-[#8e8e98]">Ref: {action.procedureRef}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isExecuted ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Dispatched</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleExecuteAction(action)}
                          disabled={isExecuting}
                          className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow ${
                            action.isAutomatedCleanRoutine
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
                          } disabled:opacity-50`}
                        >
                          {isExecuting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching...</span>
                            </>
                          ) : action.isAutomatedCleanRoutine ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Execute Auto-Clean</span>
                            </>
                          ) : (
                            <>
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Create Work Order</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Failure Correlation Reference */}
          {activeChamber.historicalFailureCorrelations.length > 0 && (
            <div className="bg-[#0b0b10] border border-[#1f1f26] rounded-xl p-3.5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-[#8e8e98]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Historical Incident Precursor Fingerprint Matches
                </span>
                <span className="text-[10px] text-amber-400">Vector Knowledge Correlated</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeChamber.historicalFailureCorrelations.map((hist, idx) => (
                  <div key={idx} className="bg-[#121218] border border-[#1f1f2b] p-2.5 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-indigo-400 font-bold">{hist.waferLot} ({hist.date})</span>
                      <span className="text-emerald-400 font-bold">{hist.similarityScore}% Match</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">{hist.rootCause}</p>
                    <div className="text-[10px] text-[#71717a]">Historical Unplanned Downtime: {hist.downtimeHours} hours</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
