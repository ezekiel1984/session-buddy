import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function THCTimelineChart({
  series,
  doses,
  expandedDoses,
  showBlood,
  bloodThreshold,
  showSaliva,
  salivaThreshold,
  keyMetrics
}) {
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  // Calculate meaningful range to display
  const startTime = parseISO(series[0].timeISO);
  
  // Robust step calculation
  let stepMinutes = 2; // Default
  if (series.length > 1) {
    const nextTime = parseISO(series[1].timeISO);
    const diffMs = nextTime - startTime;
    if (diffMs > 0) {
      stepMinutes = diffMs / 60000;
    }
  }

  // Helper to calculate index for any given ISO time string
  const getIndexForTime = (isoTime) => {
    if (!isoTime) return -1;
    try {
      // Handle both ISO strings (UTC) and local time strings from inputs
      // Note: dose inputs are usually local "YYYY-MM-DDTHH:mm", backend series is UTC "YYYY-MM-DDTHH:mm:ssZ"
      // parseISO handles both correctly (local string -> local Date, Z string -> UTC Date)
      // This assumes the user's browser local time matches the context of the input
      const time = parseISO(isoTime);
      if (isNaN(time.getTime())) return -1;
      
      const diffMinutes = (time - startTime) / 60000;
      return Math.floor(diffMinutes / stepMinutes);
    } catch (e) {
      return -1;
    }
  };

  // Find last point with significant THC (> 0.05 ng/mL)
  let lastSignificantIndex = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].thcMax > 0.05) {
      lastSignificantIndex = i;
      break;
    }
  }

  // Ensure we cover all dose times
  if (doses) {
    doses.forEach(dose => {
      const index = getIndexForTime(dose.timeISO);
      if (index > lastSignificantIndex && index < series.length) {
        lastSignificantIndex = index;
      }
    });
  }

  // Add a nice buffer (e.g. ~10% of the significant duration, or min 2 hours)
  const bufferPoints = Math.max(Math.ceil(lastSignificantIndex * 0.1), Math.ceil(120 / stepMinutes));
  const cutoffIndex = Math.min(series.length - 1, lastSignificantIndex + bufferPoints);

  // Slice series to meaningful range
  const visibleSeries = series.slice(0, cutoffIndex + 1);

  // Transform data for recharts
  const chartData = visibleSeries.map((point, index) => ({
    time: point.timeISO,
    thcMedian: point.thcMedian,
    thcMin: point.thcMin,
    thcMax: point.thcMax,
    buzzScore: point.buzzScore,
    // For display purposes, X-axis needs strictly categorical or numerical values
    // Using index ensures perfect alignment
    displayTime: index
  }));

  // Find max THC for Y-axis scaling (from visible series)
  const maxTHC = Math.max(...visibleSeries.map(s => s.thcMax), 10);
  const yAxisMax = Math.ceil(maxTHC * 1.1); // Add 10% padding

  // Calculate marker indices directly from series data to ensure visual accuracy
  // This avoids issues where backend metrics might point to t=0 (if starting sober)
  const findRecoveryIndex = (threshold) => {
    // 1. Find the peak first
    let peakIndex = 0;
    let maxVal = -1;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].thcMax > maxVal) {
        maxVal = chartData[i].thcMax;
        peakIndex = i;
      }
    }

    // If never exceeds threshold, don't show marker (or handle as needed)
    if (maxVal < threshold) return -1;

    // 2. Scan forward from peak to find drop
    for (let i = peakIndex; i < chartData.length; i++) {
      if (chartData[i].thcMax <= threshold) {
        return i;
      }
    }
    
    // If we reach the end and it's still above, return last index (or -1 if we want to hide)
    // Returning last index shows it's "off the chart" which is informative
    return chartData.length - 1;
  };

  const bloodIndex = showBlood ? findRecoveryIndex(bloodThreshold) : -1;
  const salivaIndex = showSaliva ? findRecoveryIndex(salivaThreshold) : -1;
  // For sober (approx 0.1 or passed metric), we can use a low threshold or the metric if valid
  // Let's use 0.1 as the "Sober" technical threshold for visualization consistency
  const soberIndex = findRecoveryIndex(0.1);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const time = parseISO(data.time);
      
      return (
        <div className="bg-[#141416] border border-gray-800 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-semibold mb-2">
            {format(time, 'MMM d, h:mm a')}
          </p>
          <div className="space-y-1 text-xs">
            <p className="text-purple-400">
              THC: {data.thcMedian.toFixed(1)} ng/mL
            </p>
            <p className="text-gray-400">
              Range: {data.thcMin.toFixed(1)} - {data.thcMax.toFixed(1)}
            </p>
            <p className="text-[#25A55F]">
              Buzz: {data.buzzScore.toFixed(1)}/10
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom X-axis tick formatter
  const formatXAxis = (value) => {
    if (value === 0) return 'Start';
    
    const minutes = Math.round(value * stepMinutes);
    const hours = Math.round(minutes / 60);
    
    // For the last label
    if (value === chartData.length - 1) return `${hours}h`;
    
    // Determine interval based on total duration to avoid crowding
    const totalHours = (chartData.length * stepMinutes) / 60;
    let tickIntervalHours = 6;
    if (totalHours <= 12) tickIntervalHours = 2;
    else if (totalHours <= 24) tickIntervalHours = 4;
    
    const pointsPerInterval = (tickIntervalHours * 60) / stepMinutes;
    
    if (value % Math.round(pointsPerInterval) === 0) {
      return `${hours}h`;
    }
    return '';
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
      >
        <defs>
          <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
        
        <XAxis
          dataKey="displayTime"
          tickFormatter={formatXAxis}
          stroke="#666"
          tick={{ fill: '#999', fontSize: 12 }}
          ticks={[0, Math.floor(chartData.length / 4), Math.floor(chartData.length / 2), Math.floor(chartData.length * 3 / 4), chartData.length - 1]}
          type="number"
          domain={[0, chartData.length - 1]}
        />
        
        <YAxis
          stroke="#666"
          tick={{ fill: '#999', fontSize: 12 }}
          domain={[0, yAxisMax]}
          label={{ value: 'ng/mL', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
        />
        
        <Tooltip content={<CustomTooltip />} />

        {/* Uncertainty band (min to max) */}
        <Area
          type="monotone"
          dataKey="thcMax"
          stroke="none"
          fill="url(#uncertaintyGradient)"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="thcMin"
          stroke="none"
          fill="#0A0A0B"
          fillOpacity={1}
        />

        {/* Main THC line (median) */}
        <Line
          type="monotone"
          dataKey="thcMedian"
          stroke="#a855f7"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#a855f7' }}
        />

        {/* Blood threshold line */}
        {showBlood && (
          <ReferenceLine
            y={bloodThreshold}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Blood: ${bloodThreshold} ng/mL`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 11
            }}
          />
        )}

        {/* Saliva threshold line */}
        {showSaliva && (
          <ReferenceLine
            y={salivaThreshold}
            stroke="#3b82f6"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Saliva: ${salivaThreshold} ng/mL`,
              position: 'right',
              fill: '#3b82f6',
              fontSize: 11
            }}
          />
        )}

        {/* Dose markers — show vertical lines at each dose (including repeats) */}
        {(expandedDoses || []).map((dose, i) => {
          const index = getIndexForTime(dose.expandedTimeISO);
          if (index < 0 || index >= chartData.length) return null;
          return (
            <ReferenceLine
              key={`dose-marker-${i}`}
              x={index}
              stroke="#25A55F"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
            />
          );
        })}

        {/* Blood detection time marker */}
        {showBlood && bloodIndex > 0 && bloodIndex < chartData.length && (
          <ReferenceLine
            key="blood-detection"
            x={bloodIndex}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            label={{
              value: `Blood <${bloodThreshold}`,
              position: 'top',
              fill: '#ef4444',
              fontSize: 9
            }}
          />
        )}

        {/* Saliva detection time marker */}
        {showSaliva && salivaIndex > 0 && salivaIndex < chartData.length && (
          <ReferenceLine
            key="saliva-detection"
            x={salivaIndex}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            label={{
              value: `Saliva <${salivaThreshold}`,
              position: 'top',
              fill: '#3b82f6',
              fontSize: 9
            }}
          />
        )}

        {/* Sober time marker */}
        {soberIndex > 0 && soberIndex < chartData.length && (
          <ReferenceLine
            key="sober-time"
            x={soberIndex}
            stroke="#25A55F"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            label={{
              value: 'Sober',
              position: 'top',
              fill: '#25A55F',
              fontSize: 9
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}