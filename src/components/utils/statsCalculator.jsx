import { calculateBuzzScore } from './buzzCalculator';
import { getMethodLabel } from './methodLabels';
import { logger } from '@/components/utils/logger';

// Helper to normalize methods for grouping
const normalizeMethodForStats = (method) => {
  if (method === 'vape_dry' || method === 'vape_cart') return 'vape';
  if (method === 'smoke' || method === 'joint' || method === 'cone' || method === 'blunt') return 'smoke';
  if (method === 'oil_sublingual' || method === 'oil_ingested' || method === 'capsule') return 'oil';
  return method;
};

// Calculate insights for the Insights page
export const calculateInsights = (sessions, days = 7) => {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Filter sessions within the time range
    const filteredSessions = sessions.filter(s => {
      try {
        const sessionDate = new Date(s.startedAt);
        return !isNaN(sessionDate.getTime()) && sessionDate >= startDate;
      } catch {
        return false;
      }
    });

    if (filteredSessions.length === 0) {
      return null;
    }

    // Total sessions
    const totalSessions = filteredSessions.length;

    // Average sessions per week
    const avgSessionsPerWeek = (totalSessions / days) * 7;

    // Total THC consumed
    const totalThcMg = filteredSessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);

    // Average THC per session
    const avgThcPerSession = totalThcMg / totalSessions;

    // Find most active day
    const dayCount = {};
    filteredSessions.forEach(s => {
      try {
        // Use browser default locale for better l10n (undefined uses system default)
        // Fallback to 'en-US' if locale detection completely fails for some reason
        const locale = navigator.language || 'en-US'; 
        const day = new Date(s.startedAt).toLocaleDateString(locale, { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      } catch {
        // Skip invalid dates
      }
    });

    const mostActiveDay = Object.keys(dayCount).length > 0
      ? Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';
    const mostActiveDayCount = dayCount[mostActiveDay] || 0;

    // Favorite method
    const methodCounts = {};
    filteredSessions.forEach(s => {
      const normalized = normalizeMethodForStats(s.method);
      methodCounts[normalized] = (methodCounts[normalized] || 0) + 1;
    });

    let favoriteMethod = null;
    if (Object.keys(methodCounts).length > 0) {
      const [methodKey, count] = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];
      const methodDisplayMap = {
        'vape': 'Vape',
        'smoke': 'Smoke',
        'oil': 'Oil',
        'edible': 'Edible',
        'dab': 'Dab'
      };
      favoriteMethod = {
        name: methodDisplayMap[methodKey] || getMethodLabel(methodKey, true),
        count: count,
        percentage: Math.round((count / totalSessions) * 100)
      };
    }

    // Favorite strain
    const strainCounts = {};
    filteredSessions.forEach(s => {
      if (s.strain) {
        strainCounts[s.strain] = (strainCounts[s.strain] || 0) + 1;
      }
    });

    let favoriteStrain = null;
    if (Object.keys(strainCounts).length > 0) {
      const [strainName, count] = Object.entries(strainCounts).sort((a, b) => b[1] - a[1])[0];
      favoriteStrain = {
        name: strainName,
        count: count
      };
    }

    return {
      totalSessions,
      avgSessionsPerWeek: Math.round(avgSessionsPerWeek * 10) / 10,
      totalThcMg: Math.round(totalThcMg),
      avgThcPerSession: Math.round(avgThcPerSession),
      mostActiveDay,
      mostActiveDayCount,
      favoriteMethod,
      favoriteStrain
    };
  } catch (error) {
    logger.error('[calculateInsights] Error:', error);
    return null;
  }
};

// Count unique sessions (intake windows) from doses
const countUniqueSessions = (doseList) => {
  if (!doseList || doseList.length === 0) return 0;
  
  const rootSessions = new Set();
  
  doseList.forEach(dose => {
    // Check if stackedWith is null, undefined, or empty string
    const hasNoParent = !dose.stackedWith || dose.stackedWith === '' || dose.stackedWith === null;
    
    if (hasNoParent) {
      // This dose is a root session (not stacked with anything)
      rootSessions.add(dose.id);
    } else {
      // This dose is stacked with another, count the parent
      rootSessions.add(dose.stackedWith);
    }
  });
  
  logger.debug('[countUniqueSessions] Processed', doseList.length, 'doses, found', rootSessions.size, 'unique sessions');
  logger.debug('[countUniqueSessions] Root session IDs:', Array.from(rootSessions));
  
  return rootSessions.size;
};

// Calculate comprehensive user statistics from doses
export const calculateUserStats = (doses) => {
  if (!doses || doses.length === 0) {
    return null;
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter doses by time period
    const doses7d = doses.filter(d => new Date(d.startedAt) >= sevenDaysAgo);
    const doses30d = doses.filter(d => new Date(d.startedAt) >= thirtyDaysAgo);
    const previousWeekDoses = doses.filter(d => {
      const date = new Date(d.startedAt);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });

    // Count doses (individual consumption events)
    const totalDoses7d = doses7d.length;
    const totalDoses30d = doses30d.length;

    // Count unique sessions (intake windows)
    const totalSessions7d = countUniqueSessions(doses7d);
    const totalSessions30d = countUniqueSessions(doses30d);

    logger.debug('[statsCalculator] Doses 7d:', totalDoses7d, 'Sessions 7d:', totalSessions7d);
    logger.debug('[statsCalculator] Doses 30d:', totalDoses30d, 'Sessions 30d:', totalSessions30d);

    // Calculate total THC
    const totalThc7d = doses7d.reduce((sum, d) => sum + (parseFloat(d.dosageMg) || 0), 0);
    const totalThc30d = doses30d.reduce((sum, d) => sum + (parseFloat(d.dosageMg) || 0), 0);

    const calculateDosePeakBuzz = (dose) => {
      const dosageMg = parseFloat(dose.dosageMg) || 0;
      const tolerance = dose.tolerance || 'medium';
      return calculateBuzzScore({ activeTHC: dosageMg, tolerance });
    };
    
    const avgPeakBuzz7d = doses7d.length > 0
      ? doses7d.reduce((sum, d) => sum + calculateDosePeakBuzz(d), 0) / doses7d.length
      : 0;
    
    const avgPeakBuzzPrevWeek = previousWeekDoses.length > 0
      ? previousWeekDoses.reduce((sum, d) => sum + calculateDosePeakBuzz(d), 0) / previousWeekDoses.length
      : 0;

    // Calculate buzz change percentage
    const buzzChangeWeekly = avgPeakBuzzPrevWeek > 0 
      ? ((avgPeakBuzz7d - avgPeakBuzzPrevWeek) / avgPeakBuzzPrevWeek) * 100 
      : 0;

    const methodDisplayMap = {
      'vape': 'Vape',
      'smoke': 'Smoke',
      'oil': 'Oil',
      'edible': 'Edible',
      'dab': 'Dab'
    };

    // Find most common method
    const methodCounts = {};
    doses30d.forEach(d => {
      const normalizedMethod = normalizeMethodForStats(d.method);
      methodCounts[normalizedMethod] = (methodCounts[normalizedMethod] || 0) + 1;
    });
    
    const mostCommonMethodRaw = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    let mostCommonMethod = 'N/A';
    if (mostCommonMethodRaw !== 'N/A') {
      mostCommonMethod = methodDisplayMap[mostCommonMethodRaw] || getMethodLabel(mostCommonMethodRaw, true);
    }
    
    const methodPercentage = doses30d.length > 0 
      ? Math.round((methodCounts[mostCommonMethodRaw] / doses30d.length) * 100) 
      : 0;

    // Find most used strain
    const strainCounts = {};
    doses30d.forEach(d => {
      if (d.strain) {
        strainCounts[d.strain] = (strainCounts[d.strain] || 0) + 1;
      }
    });
    const mostUsedStrain = Object.entries(strainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate longest session duration
    let longestDuration = 0;
    doses30d.forEach(d => {
      try {
        const start = new Date(d.startedAt);
        const end = new Date(d.soberAt);
        const duration = (end - start) / (1000 * 60); // minutes
        if (duration > longestDuration) {
          longestDuration = duration;
        }
      } catch {
        // Skip invalid dates
      }
    });
    const longestSessionDuration = formatDuration(longestDuration);

    // Calculate average sober time
    const avgSoberTimeMinutes = doses30d.length > 0
      ? doses30d.reduce((sum, d) => {
          try {
            const start = new Date(d.startedAt);
            const end = new Date(d.soberAt);
            return sum + ((end - start) / (1000 * 60));
          } catch {
            return sum;
          }
        }, 0) / doses30d.length
      : 0;
    const avgSoberTime = formatDuration(avgSoberTimeMinutes);

    // Average maximum peak buzz
    const avgBuzzPeak = doses30d.length > 0
      ? doses30d.reduce((sum, d) => sum + calculateDosePeakBuzz(d), 0) / doses30d.length
      : 0;

    // Calculate method breakdown
    const methodBreakdown = Object.entries(methodCounts).map(([normalizedMethod, count]) => ({
      method: methodDisplayMap[normalizedMethod] || getMethodLabel(normalizedMethod, true),
      count,
      percentage: doses30d.length > 0 ? Math.round((count / doses30d.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Calculate streaks
    const consecutiveDays = calculateConsecutiveDays(doses);

    return {
      // NEW: Separate doses and sessions counts
      doses7d: totalDoses7d,
      doses30d: totalDoses30d,
      sessions7d: totalSessions7d,
      sessions30d: totalSessions30d,
      
      avgPeakBuzz: Math.round(avgPeakBuzz7d * 10) / 10,
      mostCommonMethod,
      methodPercentage,
      totalThc7d: Math.round(totalThc7d),
      totalThc30d: Math.round(totalThc30d),
      buzzChangeWeekly: Math.round(buzzChangeWeekly),
      longestSessionDuration,
      mostUsedStrain,
      avgSoberTime,
      avgBuzzPeak: Math.round(avgBuzzPeak * 10) / 10,
      methodBreakdown,
      consecutiveDays
    };
  } catch (error) {
    logger.error('[calculateUserStats] Error:', error);
    return null;
  }
};

// Format duration from minutes to readable string
const formatDuration = (minutes) => {
  if (minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

// Calculate consecutive days with doses
const calculateConsecutiveDays = (doses) => {
  if (!doses || doses.length === 0) return 0;

  try {
    // Get unique dose dates (normalized to start of day)
    const doseDates = doses.map(d => {
      const date = new Date(d.startedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });
    
    // Remove duplicates and sort (most recent first)
    const uniqueDates = [...new Set(doseDates)]
      .sort((a, b) => b - a)
      .map(timestamp => new Date(timestamp));

    if (uniqueDates.length === 0) return 0;

    // Get today and yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const mostRecentDate = uniqueDates[0];
    
    // Streak is broken if last dose was 2+ days ago
    if (mostRecentDate.getTime() < yesterday.getTime()) {
      return 0;
    }

    // Count consecutive days
    let streak = 0;
    let checkDate = new Date(mostRecentDate);
    checkDate.setHours(0, 0, 0, 0);

    for (const doseDate of uniqueDates) {
      if (doseDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    logger.error('[calculateConsecutiveDays] Error:', error);
    return 0;
  }
};

// Check badge eligibility
export const checkBadges = (doses, stats) => {
  const badges = [];

  if (!doses || doses.length === 0) return badges;

  try {
    // First Timer
    if (doses.length >= 1) {
      badges.push({
        id: 'first_timer',
        name: 'First Timer',
        description: 'Logged your first dose',
        icon: 'Sparkles',
        unlocked: true
      });
    }

    // Weekend Warrior
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentDoses = doses.filter(d => new Date(d.startedAt) >= thirtyDaysAgo);
    
    const weekendDoses = recentDoses.filter(d => {
      const day = new Date(d.startedAt).getDay();
      return day === 0 || day === 6;
    });
    
    const weekdayDoses = recentDoses.filter(d => {
      const day = new Date(d.startedAt).getDay();
      return day >= 1 && day <= 5;
    });

    if (weekendDoses.length > 0 && weekdayDoses.length > 0) {
      const calculateDosePeakBuzz = (dose) => {
        const dosageMg = parseFloat(dose.dosageMg) || 0;
        const tolerance = dose.tolerance || 'medium';
        return calculateBuzzScore({ activeTHC: dosageMg, tolerance });
      };

      const weekendAvg = weekendDoses.reduce((sum, d) => sum + calculateDosePeakBuzz(d), 0) / weekendDoses.length;
      const weekdayAvg = weekdayDoses.reduce((sum, d) => sum + calculateDosePeakBuzz(d), 0) / weekdayDoses.length;
      
      if (weekendAvg > weekdayAvg) {
        badges.push({
          id: 'weekend_warrior',
          name: 'Weekend Warrior',
          description: 'Highest average buzz on weekends',
          icon: 'TrendingUp',
          unlocked: true
        });
      }
    }

    // Consistent User
    if (stats?.consecutiveDays >= 7) {
      badges.push({
        id: 'consistent_user',
        name: 'Daily User',
        description: 'Logged doses 7 days in a row',
        icon: 'Trophy',
        unlocked: true
      });
    }

    // Zen Master
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);

    const lastWeekDoses = doses.filter(d => {
      const doseDate = new Date(d.startedAt);
      doseDate.setHours(0,0,0,0);
      return doseDate >= sevenDaysAgo;
    });
    
    const calculateDosePeakBuzz = (dose) => {
      const dosageMg = parseFloat(dose.dosageMg) || 0;
      const tolerance = dose.tolerance || 'medium';
      return calculateBuzzScore({ activeTHC: dosageMg, tolerance });
    };

    const allModerate = lastWeekDoses.every(d => calculateDosePeakBuzz(d) <= 6.0);
    
    if (lastWeekDoses.length > 0 && allModerate) {
      badges.push({
        id: 'zen_master',
        name: 'Zen Master',
        description: 'Kept it mellow all week',
        icon: 'Sparkles',
        unlocked: true
      });
    }

    return badges;
  } catch (error) {
    logger.error('[checkBadges] Error:', error);
    return [];
  }
};