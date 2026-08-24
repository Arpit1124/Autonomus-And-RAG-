import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ChartDataConfig } from '../types';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface Props {
  config: ChartDataConfig;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const DataChartRenderer: React.FC<Props> = ({ config }) => {
  const { type, title, description, xAxisKey, dataKeys, data } = config;

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div id={`chart-card-${title.toLowerCase().replace(/\s+/g, '-')}`} className="bg-[#0d0d10] border border-[#1f1f23] rounded-lg p-3.5 shadow-sm my-3">
      <div className="flex items-center justify-between mb-3 border-b border-[#1f1f23] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141418] text-indigo-400 border border-[#1f1f23]">
            {type === 'bar' && <BarChart3 className="w-3.5 h-3.5" />}
            {type === 'line' && <LineChartIcon className="w-3.5 h-3.5" />}
            {type === 'area' && <LineChartIcon className="w-3.5 h-3.5" />}
            {type === 'pie' && <PieChartIcon className="w-3.5 h-3.5" />}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#e0e0e0]">{title}</h4>
            {description && <p className="text-[11px] text-[#71717a] mt-0.5">{description}</p>}
          </div>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-mono text-[#8e8e93] bg-[#141418] px-2 py-0.5 rounded border border-[#1f1f23]">
          {type} chart
        </span>
      </div>

      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" opacity={0.8} />
              <XAxis dataKey={xAxisKey} stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d0d10', borderColor: '#1f1f23', borderRadius: '6px', color: '#e0e0e0', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8e8e93', paddingTop: '8px' }} />
              {dataKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" opacity={0.8} />
              <XAxis dataKey={xAxisKey} stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d0d10', borderColor: '#1f1f23', borderRadius: '6px', color: '#e0e0e0', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8e8e93', paddingTop: '8px' }} />
              {dataKeys.map((key, idx) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: COLORS[idx % COLORS.length] }} 
                />
              ))}
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" opacity={0.8} />
              <XAxis dataKey={xAxisKey} stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d0d10', borderColor: '#1f1f23', borderRadius: '6px', color: '#e0e0e0', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8e8e93', paddingTop: '8px' }} />
              {dataKeys.map((key, idx) => (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fill={COLORS[idx % COLORS.length]} 
                  fillOpacity={0.2} 
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d0d10', borderColor: '#1f1f23', borderRadius: '6px', color: '#e0e0e0', fontSize: '11px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8e8e93' }} />
              <Pie
                data={data}
                dataKey={dataKeys[0] || 'value'}
                nameKey={xAxisKey || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
