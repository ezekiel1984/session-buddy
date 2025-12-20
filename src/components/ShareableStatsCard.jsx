
import React from 'react';
import { Flame, TrendingUp, Layers, Droplets, Calendar, Trophy, Smile } from 'lucide-react';
// The original import for calculateActiveTHC is removed as the logic is now inlined.

// Helper function to count unique sessions (intake windows)
const countUniqueSessions = (doseList) => {
  if (!doseList || doseList.length === 0) return 0;
  
  const rootSessions = new Set();
  
  doseList.forEach(dose => {
    if (!dose.stackedWith || dose.stackedWith === '') {
      rootSessions.add(dose.id);
    } else {
      rootSessions.add(dose.stackedWith);
    }
  });
  
  return rootSessions.size;
};

// Calculate peak blood THC concentration (mg/L) over a time period
// Uses the EXACT same logic as BloodTHCGraph to ensure matching peak values
const calculatePeakBloodTHC = (sessions) => {
  if (!sessions || sessions.length === 0) return 0;
  
  try {
    const now = new Date();
    // Filter out invalid session start times to ensure `Math.min` works correctly
    const sessionTimes = sessions.map(s => new Date(s.startedAt).getTime()).filter(t => !isNaN(t));
    
    if (sessionTimes.length === 0) return 0;
    
    const startTime = Math.min(...sessionTimes);
    const endTime = now.getTime();
    
    // Sample every 15 minutes (same as BloodTHCGraph)
    const dataPoints = [];
    const intervalMinutes = 15;
    const stepMs = intervalMinutes * 60 * 1000;
    
    // Iterate from the earliest session start time up to the current time ('now')
    for (let time = new Date(startTime); time.getTime() <= endTime; time = new Date(time.getTime() + stepMs)) {
      let totalTHC = 0;
      
      // Calculate cumulative THC from all active sessions at this point in time
      sessions.forEach(session => {
        const sessionStart = new Date(session.startedAt);
        // Assuming 'soberAt' exists on the session object to define the end of its effect
        const sessionEnd = new Date(session.soberAt); 
        
        if (isNaN(sessionStart.getTime()) || isNaN(sessionEnd.getTime())) return;

        // Only include if session was active at this specific 'time' point
        if (time.getTime() >= sessionStart.getTime() && time.getTime() <= sessionEnd.getTime()) {
          const dosage = parseFloat(session.dosageMg) || 0;
          if (dosage === 0) return; // Skip if no dosage
          
          // Use EXACT same calculation as BloodTHCGraph
          const timeElapsedMinutes = (time.getTime() - sessionStart.getTime()) / (1000 * 60);
          const halfLife = session.method === 'edible' ? 240 : 150; // Half-life in minutes
          const peakDelay = session.method === 'edible' ? 90 : 10; // Peak delay in minutes
          
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
      
      dataPoints.push(totalTHC);
    }
    
    // Return the maximum value found. Use 0 as a default if dataPoints is empty (e.g., no active sessions)
    return Math.max(...dataPoints, 0);
  } catch (error) {
    console.error('[ShareableStatsCard] Error calculating peak blood THC:', error);
    return 0;
  }
};

export default function ShareableStatsCard({ stats, sessions, badges, isAnonymous, timePeriod = 'week', vibeTagline }) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let periodStart;
  let periodLabel;
  
  if (timePeriod === 'today') {
    periodStart = startOfToday;
    periodLabel = 'Today';
  } else if (timePeriod === 'week') {
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    periodLabel = 'This Week';
  } else if (timePeriod === 'month') {
    periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    periodLabel = 'This Month';
  }
  
  const periodSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= periodStart;
  });

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= startOfToday;
  });

  const totalThcPeriod = periodSessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
  const doseCountPeriod = periodSessions.length;
  const sessionCountPeriod = countUniqueSessions(periodSessions);
  
  const avgBuzzPeriod = doseCountPeriod > 0
    ? periodSessions.reduce((sum, s) => sum + (s.buzzScore || 0), 0) / doseCountPeriod
    : 0;

  const peakBloodTHC = calculatePeakBloodTHC(periodSessions);

  const moodCounts = {};
  periodSessions.forEach(s => {
    if (s.mood) {
      moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
    }
  });
  
  const topMood = Object.keys(moodCounts).length > 0
    ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  let heroStat = null;
  if (timePeriod === 'today') {
    const maxBuzzToday = Math.max(...todaySessions.map(s => s.buzzScore || 0), 0);
    // The condition for setting heroStat.type 'buzz' or 'thc' might need review based on design requirements.
    // For now, retaining the original logic which was maxBuzzToday vs peakBloodTHC / 10
    if (maxBuzzToday >= peakBloodTHC / 10) { 
      heroStat = { type: 'buzz', value: maxBuzzToday };
    } else {
      heroStat = { type: 'thc', value: peakBloodTHC };
    }
  } else if (timePeriod === 'week') {
    heroStat = { type: 'totalThc', value: totalThcPeriod };
  } else if (timePeriod === 'month') {
    heroStat = { type: 'avgBuzz', value: avgBuzzPeriod };
  }

  return (
    <div 
      id="shareable-stats-card"
      className="w-[1080px] h-[1920px] bg-gradient-to-br from-[#0A0A0B] to-[#141416] text-white p-16 flex flex-col relative overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
            alt="Session Buddy"
            className="w-20 h-20"
          />
          <div>
            <h1 className="text-3xl font-bold">Session Buddy</h1>
            <p className="text-gray-400 text-lg">Stats Overview</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xl">{periodLabel}</p>
        </div>
      </div>

      {vibeTagline && (
        <div className="relative z-10 text-center mb-8">
          <p className="text-[#25A55F] text-xl italic">{vibeTagline}</p>
        </div>
      )}

      <div className="relative z-10 text-center mb-12 bg-[#141416]/50 backdrop-blur-sm border-2 border-[#25A55F]/30 rounded-3xl p-10">
        <p className="text-gray-400 text-xl mb-6">Total THC {periodLabel}</p>
        <p 
          className={`text-[#25A55F] font-bold mb-6 ${heroStat?.type === 'totalThc' ? 'text-9xl' : 'text-8xl'}`} 
          style={{
            textShadow: heroStat?.type === 'totalThc' ? '0 0 30px rgba(37, 165, 95, 0.6)' : undefined,
            transform: 'translateY(-8px)'
          }}
        >
          {Math.round(totalThcPeriod)}<span className="text-4xl">mg</span>
        </p>
        <p className="text-gray-500 text-lg">{doseCountPeriod} doses • {sessionCountPeriod} sessions</p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-6 mb-12 flex-1">
        <StatTile 
          icon={<Flame className="w-12 h-12 text-orange-400" />}
          label={`Doses ${timePeriod === 'today' ? 'Today' : `(${timePeriod === 'week' ? '7d' : '30d'})`}`}
          value={doseCountPeriod.toString()}
          color="orange"
        />
        <StatTile 
          icon={<Droplets className="w-12 h-12 text-purple-400" />}
          label="Peak Blood THC"
          value={`${peakBloodTHC.toFixed(1)}mg/L`}
          color="purple"
          isHero={heroStat?.type === 'thc'}
        />

        <StatTile 
          icon={<Layers className="w-12 h-12 text-blue-400" />}
          label={`Sessions ${timePeriod === 'today' ? 'Today' : `(${timePeriod === 'week' ? '7d' : '30d'})`}`}
          value={sessionCountPeriod.toString()}
          subtext="intake windows"
          color="blue"
        />
        <StatTile 
          icon={<TrendingUp className="w-12 h-12 text-green-400" />}
          label="Avg Buzz"
          value={`${avgBuzzPeriod.toFixed(1)}/10`}
          color="green"
          isHero={heroStat?.type === 'avgBuzz' || heroStat?.type === 'buzz'}
        />

        <StatTile 
          icon={<Smile className="w-12 h-12 text-cyan-400" />}
          label="Top Mood"
          value={topMood ? topMood.charAt(0).toUpperCase() + topMood.slice(1) : '-'}
          subtext={topMood ? "based on your logs" : "no mood tags yet"}
          color="cyan"
          isText
        />
        <StatTile 
          icon={<Calendar className="w-12 h-12 text-red-400" />}
          label="Day Streak"
          value={`${stats.consecutiveDays} days`}
          color="red"
        />

        <StatTile 
          icon={<Trophy className="w-12 h-12 text-amber-400" />}
          label="Badges Earned"
          value={badges?.length?.toString() || '0'}
          color="amber"
        />
        <StatTile 
          icon={<Flame className="w-12 h-12 text-pink-400" />}
          label="Most Used"
          value={stats.mostCommonMethod || 'N/A'}
          color="pink"
          isText
        />
      </div>

      <div className="relative z-10 text-center pt-6 border-t-2 border-gray-800">
        <p className="text-gray-400 text-lg mb-2">Track your vibe. Stay mindful. Enjoy the ride.</p>
        <p className="text-[#25A55F] text-xl font-bold">session-buddy.app</p>
        <p className="text-gray-500 text-base mt-3">Shared via Session Buddy Premium</p>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, color, isText, isHero, subtext }) {
  const colorClasses = {
    orange: 'bg-orange-500/10 border-orange-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    red: 'bg-red-500/10 border-red-500/30',
    amber: 'bg-amber-500/10 border-amber-500/30',
    pink: 'bg-pink-500/10 border-pink-500/30',
    cyan: 'bg-cyan-500/10 border-cyan-500/30'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-2xl p-8 flex flex-col items-center justify-center text-center ${isHero ? 'ring-2 ring-[#25A55F]/50' : ''}`}>
      <div className="mb-4">{icon}</div>
      <p className="text-gray-400 text-xl mb-3">{label}</p>
      <p 
        className={`text-white font-bold ${isText ? 'text-3xl capitalize' : isHero ? 'text-6xl' : 'text-5xl'}`}
        style={isHero ? { textShadow: '0 0 20px rgba(37, 165, 95, 0.5)' } : {}}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-gray-500 text-sm mt-2">{subtext}</p>
      )}
    </div>
  );
}
