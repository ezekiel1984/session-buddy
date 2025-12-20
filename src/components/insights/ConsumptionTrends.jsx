import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react';

export default function ConsumptionTrends({ sessions }) {
  // Calculate daily consumption for last 30 days
  const dailyConsumptionData = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const last30DaysMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      last30DaysMap.set(dateKey, {
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalMg: 0,
        sessionCount: 0
      });
    }
    
    sessions.forEach(session => {
      try {
        const sessionDate = new Date(session.startedAt);
        if (isNaN(sessionDate.getTime())) return;
        
        sessionDate.setHours(0, 0, 0, 0);
        const sessionDateKey = sessionDate.toISOString().split('T')[0];
        
        const dayData = last30DaysMap.get(sessionDateKey);
        if (dayData) {
          dayData.totalMg += parseFloat(session.dosageMg) || 0;
          dayData.sessionCount += 1;
        }
      } catch (error) {
        console.error('Error processing session for daily consumption:', error);
      }
    });
    
    return Array.from(last30DaysMap.values());
  }, [sessions]);

  // Calculate weekly comparisons
  const weeklyComparison = React.useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeek = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo);
    const lastWeek = sessions.filter(s => {
      const date = new Date(s.startedAt);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    const thisWeekTotal = thisWeek.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
    const lastWeekTotal = lastWeek.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
    
    const thisWeekAvg = thisWeek.length > 0 ? thisWeekTotal / thisWeek.length : 0;
    const lastWeekAvg = lastWeek.length > 0 ? lastWeekTotal / lastWeek.length : 0;
    
    const totalChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;
    const avgChange = lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;
    
    return {
      thisWeekTotal: Math.round(thisWeekTotal),
      lastWeekTotal: Math.round(lastWeekTotal),
      thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
      lastWeekAvg: Math.round(lastWeekAvg * 10) / 10,
      thisWeekCount: thisWeek.length,
      lastWeekCount: lastWeek.length,
      totalChange: Math.round(totalChange),
      avgChange: Math.round(avgChange)
    };
  }, [sessions]);

  // Get last 7 and 30 day data
  const last7Days = dailyConsumptionData.slice(-7);
  const last30Days = dailyConsumptionData;

  // Calculate average mg per session over time (weekly buckets for past 8 weeks)
  const weeklyAvgData = React.useMemo(() => {
    const now = new Date();
    const weeks = [];
    
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startedAt);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      const totalMg = weekSessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
      const avgMg = weekSessions.length > 0 ? totalMg / weekSessions.length : 0;
      
      weeks.push({
        label: i === 0 ? 'This week' : `${i}w ago`,
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgMg: Math.round(avgMg * 10) / 10,
        count: weekSessions.length
      });
    }
    
    return weeks;
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Weekly Comparison & Insights */}
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#25A55F]" />
          Consumption Insights
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0A0A0B] rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">This Week</p>
            <p className="text-white font-bold text-2xl">{weeklyComparison.thisWeekTotal}<span className="text-sm text-gray-500">mg</span></p>
            <p className="text-gray-500 text-xs">{weeklyComparison.thisWeekCount} sessions</p>
          </div>
          <div className="bg-[#0A0A0B] rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Last Week</p>
            <p className="text-white font-bold text-2xl">{weeklyComparison.lastWeekTotal}<span className="text-sm text-gray-500">mg</span></p>
            <p className="text-gray-500 text-xs">{weeklyComparison.lastWeekCount} sessions</p>
          </div>
        </div>

        {/* Context-aware insights */}
        {weeklyComparison.lastWeekTotal > 0 && (
          <div className={`p-4 rounded-lg border ${
            weeklyComparison.totalChange > 20 
              ? 'bg-yellow-900/20 border-yellow-700/30'
              : weeklyComparison.totalChange < -10
              ? 'bg-green-900/20 border-green-700/30'
              : 'bg-blue-900/20 border-blue-700/30'
          }`}>
            <div className="flex items-start gap-2">
              {weeklyComparison.totalChange > 20 ? (
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              ) : weeklyComparison.totalChange < -10 ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm leading-relaxed">
                {weeklyComparison.totalChange > 20 ? (
                  <p className="text-yellow-200">
                    <strong>Consumption up {weeklyComparison.totalChange}% from last week.</strong> Your body might be building tolerance. Consider taking a 2-3 day break to reset your system, or reduce frequency to maintain effectiveness and save on costs.
                  </p>
                ) : weeklyComparison.totalChange < -10 ? (
                  <p className="text-green-200">
                    <strong>Great job!</strong> Your consumption is down {Math.abs(weeklyComparison.totalChange)}% from last week. Keep up the mindful approach - you're maintaining control and effectiveness.
                  </p>
                ) : (
                  <p className="text-blue-200">
                    <strong>Stable consumption.</strong> Your weekly totals are consistent. If you're getting the effects you want, you're in a good place. Keep monitoring to avoid gradual increases.
                  </p>
                )}
                
                {weeklyComparison.avgChange > 25 && (
                  <p className="text-yellow-200 mt-2">
                    <strong>Note:</strong> Your average dose per session has increased by {weeklyComparison.avgChange}%. Consider whether you're getting diminishing returns - sometimes less is more with cannabis.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily THC Consumption - Last 7 Days */}
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <h3 className="text-white font-semibold mb-4">Daily THC Intake (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { weekday: 'short' });
                }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'mg THC', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141416',
                  border: '1px solid #2a2a2c',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`${Math.round(value)}mg`, 'Total THC']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <Bar dataKey="totalMg" fill="#25A55F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Total THC consumed each day over the past week
        </p>
      </div>

      {/* Daily Session Count - Last 7 Days */}
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <h3 className="text-white font-semibold mb-4">Daily Sessions (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { weekday: 'short' });
                }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141416',
                  border: '1px solid #2a2a2c',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`${value}`, 'Sessions']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <Bar dataKey="sessionCount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Number of doses logged each day
        </p>
      </div>

      {/* Monthly Overview */}
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <h3 className="text-white font-semibold mb-4">Monthly Consumption (Last 30 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last30Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#999', fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'mg THC', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141416',
                  border: '1px solid #2a2a2c',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`${Math.round(value)}mg`, 'Total THC']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="totalMg"
                stroke="#25A55F"
                strokeWidth={2}
                dot={{ fill: '#25A55F', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Daily THC consumption trend over the past month
        </p>
      </div>

      {/* Average mg per session over time */}
      <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
        <h3 className="text-white font-semibold mb-4">Average Dose per Session (Weekly)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyAvgData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
              <XAxis
                dataKey="label"
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'mg/session', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141416',
                  border: '1px solid #2a2a2c',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name, props) => [
                  `${value}mg average (${props.payload.count} sessions)`,
                  'Avg Dose'
                ]}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="avgMg"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          How your average dose size has changed over the past 8 weeks
        </p>
      </div>

      {/* Summary Metric */}
      <div className="bg-gradient-to-br from-[#25A55F]/10 to-[#25A55F]/5 border border-[#25A55F]/20 rounded-2xl p-6">
        <div className="text-center">
          <p className="text-gray-300 text-sm mb-2">Overall Average Dose</p>
          <p className="text-4xl font-bold text-[#25A55F] mb-1">
            {sessions.length > 0
              ? (sessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0) / sessions.length).toFixed(1)
              : '0.0'}
            <span className="text-lg text-gray-400 ml-1">mg</span>
          </p>
          <p className="text-xs text-gray-400">per session across {sessions.length} total doses</p>
        </div>
      </div>
    </div>
  );
}