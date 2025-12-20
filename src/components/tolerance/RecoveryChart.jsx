import React from 'react';

export default function RecoveryChart({ forecast, milestones }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No forecast data available
      </div>
    );
  }

  // Filter out any invalid data points
  const validForecast = forecast.filter(d => 
    d && typeof d.day === 'number' && typeof d.TI === 'number' && 
    !isNaN(d.TI) && isFinite(d.TI)
  );

  if (validForecast.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Unable to generate forecast
      </div>
    );
  }

  // FIXED: Use the actual starting TI value, not a filtered/clamped version
  const startingTI = Math.round(validForecast[0]?.TI || 0);
  
  console.log('[RecoveryChart] Starting TI:', startingTI);
  console.log('[RecoveryChart] Forecast data:', validForecast.slice(0, 3)); // Log first 3 points
  
  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 100; // percentage
  const paddingLeft = 12; // for Y-axis labels

  // FIXED: Dynamic Y-axis based on actual starting TI
  let yAxisMarkers;
  let maxY;
  
  if (startingTI <= 30) {
    // Low TI: use granular scale
    maxY = 30;
    yAxisMarkers = [
      { ti: 30, label: '30' },
      { ti: 25, label: '25' },
      { ti: 20, label: '20' },
      { ti: 15, label: '15' },
      { ti: 10, label: '10' },
      { ti: 5, label: '5' },
      { ti: 0, label: '0' }
    ];
  } else if (startingTI <= 50) {
    // Medium TI: balanced scale
    maxY = 50;
    yAxisMarkers = [
      { ti: 50, label: '50' },
      { ti: 40, label: '40' },
      { ti: 30, label: '30' },
      { ti: 20, label: '20' },
      { ti: 10, label: '10' },
      { ti: 0, label: '0' }
    ];
  } else {
    // High TI: full range scale with buffer
    maxY = 100;
    yAxisMarkers = [
      { ti: 100, label: '100' },
      { ti: 80, label: '80' },
      { ti: 60, label: '60' },
      { ti: 40, label: '40' },
      { ti: 20, label: '20' },
      { ti: 0, label: '0' }
    ];
  }

  const minY = 0;

  // Helper to convert TI value to Y coordinate (inverted because SVG y=0 is top)
  const tiToY = (ti) => {
    const clampedTI = Math.max(minY, Math.min(maxY, ti));
    return chartHeight - ((clampedTI / maxY) * chartHeight);
  };

  // Helper to convert day to X coordinate
  const maxDay = Math.max(...validForecast.map(d => d.day));
  const dayToX = (day) => (day / maxDay) * chartWidth;

  // Generate smooth path for the decay curve
  const pathData = validForecast.map((point, idx) => {
    const x = dayToX(point.day);
    const y = tiToY(point.TI);
    return idx === 0 ? `M ${x},${y}` : `L ${x},${y}`;
  }).join(' ');

  // X-axis labels
  const xAxisLabels = [
    { day: 0, label: 'Today' },
    { day: Math.round(maxDay / 2), label: `${Math.round(maxDay / 2)}d` },
    { day: maxDay, label: `${maxDay}d` }
  ];

  // Calculate positions as percentages for HTML elements
  const startPoint = {
    xPercent: (validForecast[0].day / maxDay) * 100,
    yPercent: (tiToY(validForecast[0].TI) / chartHeight) * 100
  };
  
  const endPoint = {
    xPercent: (validForecast[validForecast.length - 1].day / maxDay) * 100,
    yPercent: (tiToY(validForecast[validForecast.length - 1].TI) / chartHeight) * 100
  };

  console.log('[RecoveryChart] Start point:', { 
    TI: validForecast[0].TI, 
    yCoord: tiToY(validForecast[0].TI),
    yPercent: startPoint.yPercent 
  });

  return (
    <div className="space-y-4">
      {/* Chart Container */}
      <div className="relative bg-[#0A0A0B] rounded-xl p-4 border border-gray-800" style={{ height: chartHeight + 40 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
          {yAxisMarkers.map(marker => (
            <div key={marker.ti} className="text-right pr-2">
              {marker.label}
            </div>
          ))}
        </div>

        {/* Chart Area Container */}
        <div className="relative" style={{ height: chartHeight, marginLeft: paddingLeft }}>
          {/* SVG Chart */}
          <svg 
            className="w-full h-full" 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal reference lines */}
            {yAxisMarkers.map(marker => (
              <line
                key={`line-${marker.ti}`}
                x1="0"
                y1={tiToY(marker.ti)}
                x2={chartWidth}
                y2={tiToY(marker.ti)}
                stroke="#2a2a2c"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Gradient fill under the curve */}
            <defs>
              <linearGradient id="toleranceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#25A55F" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#25A55F" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Fill area under curve */}
            <path
              d={`${pathData} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
              fill="url(#toleranceGradient)"
            />

            {/* Main decay curve line */}
            <path
              d={pathData}
              fill="none"
              stroke="#25A55F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* HTML-based dots positioned absolutely - these will be perfectly round */}
          <div
            className="absolute w-2 h-2 rounded-full bg-[#25A55F] ring-2 ring-[#0A0A0B]"
            style={{
              left: `${startPoint.xPercent}%`,
              top: `${startPoint.yPercent}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-[#25A55F] ring-1 ring-[#0A0A0B]"
            style={{
              left: `${endPoint.xPercent}%`,
              top: `${endPoint.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              opacity: 0.8
            }}
          />
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2" style={{ marginLeft: paddingLeft }}>
          {xAxisLabels.map(label => (
            <span key={label.day}>{label.label}</span>
          ))}
        </div>
      </div>

      {/* Recovery Milestones */}
      {milestones && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Recovery Milestones</h4>
          <div className="space-y-2">
            {milestones.toModerate > 0 && milestones.toModerate < 999 && (
              <div className="flex justify-between items-center bg-[#0A0A0B] rounded-lg p-3 border border-gray-800">
                <span className="text-gray-300 text-sm">Moderate (TI &lt;25)</span>
                <span className="text-[#25A55F] font-semibold">~{milestones.toModerate} days</span>
              </div>
            )}
            
            {milestones.toBaseline > 0 && milestones.toBaseline < 999 && (
              <div className="flex justify-between items-center bg-[#0A0A0B] rounded-lg p-3 border border-gray-800">
                <span className="text-gray-300 text-sm">Near baseline (TI &lt;10)</span>
                <span className="text-[#25A55F] font-semibold">~{milestones.toBaseline} days</span>
              </div>
            )}
            
            {milestones.toFullReset > 0 && milestones.toFullReset < 999 && (
              <div className="flex justify-between items-center bg-[#0A0A0B] rounded-lg p-3 border border-gray-800">
                <span className="text-gray-300 text-sm">Full reset (TI &lt;5)</span>
                <span className="text-[#25A55F] font-semibold">~{milestones.toFullReset} days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}