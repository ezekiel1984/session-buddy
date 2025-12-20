
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// CustomTooltip component is removed as per the outline, replaced by inline Tooltip props.

export default function BloodTHCGraph({ sessions, timeRange = '24h' }) {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const now = new Date();
    const hoursToShow = timeRange === '24h' ? 24 : 168; // 24h or 7 days
    const startTime = new Date(now.getTime() - hoursToShow * 60 * 60 * 1000);
    
    // Generate data points every 15 minutes
    const dataPoints = [];
    const intervalMinutes = 15;
    
    for (let time = new Date(startTime); time <= now; time = new Date(time.getTime() + intervalMinutes * 60 * 1000)) {
      let totalTHC = 0;
      
      // Calculate cumulative THC from all active sessions at this point in time
      sessions.forEach(session => {
        const sessionStart = new Date(session.startedAt);
        const sessionEnd = new Date(session.soberAt);
        
        // Only include if session was active at this time
        if (time >= sessionStart && time <= sessionEnd) {
          const dosage = parseFloat(session.dosageMg) || 0;
          
          // Original calculateActiveTHC was more complex, this is a simplified
          // model for time-dependent concentration.
          // Adjust for the time difference
          const timeElapsedMinutes = (time - sessionStart) / (1000 * 60);
          const halfLife = session.method === 'edible' ? 240 : 150; // Example half-lives in minutes
          const peakDelay = session.method === 'edible' ? 90 : 10; // Example peak delays in minutes
          
          let thcAtThisTime;
          if (timeElapsedMinutes < peakDelay) {
            // Linear ramp-up to peak
            thcAtThisTime = dosage * (timeElapsedMinutes / peakDelay);
          } else {
            // Exponential decay after peak
            const effectiveTime = timeElapsedMinutes - peakDelay;
            thcAtThisTime = dosage * Math.pow(0.5, effectiveTime / halfLife);
          }
          
          totalTHC += thcAtThisTime;
        }
      });
      
      dataPoints.push({
        time: time.toISOString(),
        thc: totalTHC
      });
    }
    
    return dataPoints;
  }, [sessions, timeRange]);

  if (chartData.length === 0) {
    return (
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-8 text-center">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No THC data available for this period</p>
      </div>
    );
  }

  // maxTHC is still needed for the "Peak" display.
  const maxTHC = Math.max(...chartData.map(d => d.thc), 0); // Ensure maxTHC is at least 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#25A55F]/10 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#25A55F]" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Blood THC Concentration</h3>
          <p className="text-gray-400 text-sm">Active cannabinoid levels over time</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#25A55F]" />
          <span className="text-gray-300">THC Level</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-yellow-500/40" />
          <span className="text-gray-400">Threshold (1mg/L)</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#2a2a2c" 
            />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 11 }}
              tickFormatter={(time) => {
                const date = new Date(time);
                if (timeRange === '24h') {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis 
              stroke="#666"
              tick={{ fill: '#999', fontSize: 11 }}
              label={{ 
                value: 'mg/L', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#999', fontSize: 11 }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141416',
                border: '1px solid #2a2a2c',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value !== null && value !== undefined ? value.toFixed(2) : 'N/A'} mg/L`, 'Blood THC']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                });
              }}
            />
            
            {/* Subtle threshold line at 1mg */}
            <ReferenceLine 
              y={1} 
              stroke="#eab308" 
              strokeDasharray="4 4" 
              strokeWidth={1}
              strokeOpacity={0.4}
            />
            
            <Line 
              type="monotone" 
              dataKey="thc" 
              stroke="#25A55F" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs">
        <div className="text-gray-400">
          <span className="font-semibold text-white">Current: </span>
          {chartData.length > 0 ? chartData[chartData.length - 1]?.thc.toFixed(2) : '0.00'} mg/L
        </div>
        <div className="text-gray-400">
          <span className="font-semibold text-white">Peak: </span>
          {maxTHC.toFixed(2)} mg/L
        </div>
      </div>

      <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="font-semibold text-blue-400">Clinical Note:</span> Blood THC levels are estimates based on consumption data and pharmacokinetic modeling. Actual levels vary based on individual metabolism, tolerance, and other factors.
        </p>
      </div>
    </motion.div>
  );
}
