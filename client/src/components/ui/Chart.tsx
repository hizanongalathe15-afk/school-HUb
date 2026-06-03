import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';

interface ChartDataItem {
  [key: string]: string | number;
}

interface ChartSeries {
  key: string;
  color?: string;
  name?: string;
  strokeDasharray?: string;
}

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartDataItem[];
  xAxisKey?: string;
  yAxisKey?: string;
  lines?: ChartSeries[];
  bars?: ChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  colors?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  stacked?: boolean;
  tooltipFormatter?: (value: number, name: string) => string | [string, string];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (value: number, name: string) => string | [string, string] }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry, idx) => {
        const formatted = formatter ? formatter(entry.value as number, entry.name || '') : `${entry.value}`;
        const displayValue = Array.isArray(formatted) ? formatted[0] : formatted;
        const displayName = Array.isArray(formatted) ? formatted[1] : entry.name;
        
        return (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{displayName}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function Chart({
  type,
  data,
  xAxisKey,
  yAxisKey,
  lines = [],
  bars = [],
  title,
  subtitle,
  height = 300,
  width = '100%',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  className,
  loading = false,
  emptyMessage = 'No data available',
  colors = DEFAULT_COLORS,
  xAxisLabel,
  yAxisLabel,
  stacked = false,
  tooltipFormatter,
}: ChartProps) {
  const categoryKey = xAxisKey ?? 'name';
  const valueKey = yAxisKey ?? lines[0]?.key ?? bars[0]?.key ?? 'value';

  if (loading) {
    return (
      <div className={clsx('flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg', className)} style={{ height }}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg', className)} style={{ height }}>
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const commonProps = {
    data,
    isAnimationActive: animate,
  };

  const barChartProps = {
    ...commonProps,
    stackOffset: stacked ? ('expand' as any) : undefined,
  };

  const areaChartProps = {
    ...commonProps,
    stackOffset: stacked ? ('expand' as any) : undefined,
  };

  const renderChart = () => {

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />}
            <XAxis 
              dataKey={categoryKey} 
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            {showTooltip && <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />}
            {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
            {lines.map((line, i) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name || line.key}
                stroke={line.color || colors[i % colors.length]}
                strokeDasharray={line.strokeDasharray}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...barChartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />}
            <XAxis dataKey={categoryKey} tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            {showTooltip && <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />}
            {showLegend && <Legend />}
            {bars.map((bar, i) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name || bar.key}
                fill={bar.color || colors[i % colors.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={categoryKey}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              label={{ fill: '#374151', fontSize: 12 }}
              labelLine={{ stroke: '#9ca3af' }}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />}
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...areaChartProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />}
            <XAxis dataKey={categoryKey} tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            {showTooltip && <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />}
            {showLegend && <Legend />}
            {lines.map((line, i) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name || line.key}
                stroke={line.color || colors[i % colors.length]}
                fill={line.color || colors[i % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      default:
        return <></>;
    }
  };

  return (
    <div className={clsx('chart-container w-full', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}