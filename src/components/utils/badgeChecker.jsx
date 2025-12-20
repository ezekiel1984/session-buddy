
import { base44 } from '@/api/base44Client';

// Badge definitions
export const BADGE_DEFINITIONS = {
  first_timer: {
    id: 'first_timer',
    emoji: '✨',
    name: 'First Timer',
    description: 'Logged your first session',
    premium: false
  },
  regular: {
    id: 'regular',
    emoji: '📆',
    name: 'Regular',
    description: '10 sessions deep',
    premium: false
  },
  veteran: {
    id: 'veteran',
    emoji: '🏅',
    name: 'Veteran',
    description: '50 sessions strong',
    premium: false
  },
  chill_master: {
    id: 'chill_master',
    emoji: '👑',
    name: 'Chill Master',
    description: '100 sessions, pure poise',
    premium: false
  },
  zen_master: {
    id: 'zen_master',
    emoji: '🧘',
    name: 'Zen Master',
    description: 'Kept it mellow all week',
    premium: false
  },
  high_flyer: {
    id: 'high_flyer',
    emoji: '🚀',
    name: 'High Flyer',
    description: 'Broke orbit at Buzz 9+',
    premium: false
  },
  method_mixer: {
    id: 'method_mixer',
    emoji: '🧪',
    name: 'Method Mixer',
    description: 'Tried three different methods this week',
    premium: false
  },
  vapor_voyager: {
    id: 'vapor_voyager',
    emoji: '💨',
    name: 'Vapor Voyager',
    description: '5 vape sessions',
    premium: false
  },
  smokin_aces: {
    id: 'smokin_aces',
    emoji: '🔥',
    name: "Smokin' Aces",
    description: '5 smoke sessions',
    premium: false
  },
  edible_explorer: {
    id: 'edible_explorer',
    emoji: '🍪',
    name: 'Edible Explorer',
    description: '3 edibles — brave, but chilled',
    premium: false
  },
  night_owl: {
    id: 'night_owl',
    emoji: '🌙',
    name: 'Night Owl',
    description: '5 late-night sessions',
    premium: false
  },
  early_bird: {
    id: 'early_bird',
    emoji: '🌞',
    name: 'Early Bird',
    description: '3 morning sessions',
    premium: false
  },
  hype_squad: {
    id: 'hype_squad',
    emoji: '📤',
    name: 'Hype Squad',
    description: 'Shared the vibe',
    premium: false
  },
  // NEW: Week streak badges
  week_warrior: {
    id: 'week_warrior',
    emoji: '⚡',
    name: 'Week Warrior',
    description: 'Tracked 7 days in a row',
    premium: false
  },
  consistency_king: {
    id: 'consistency_king',
    emoji: '👑',
    name: 'Consistency King',
    description: '30 day tracking streak',
    premium: false
  },
  
  // NEW: THC milestones
  gram_club: {
    id: 'gram_club',
    emoji: '💚',
    name: '1000mg Club',
    description: 'Tracked 1000mg total THC',
    premium: false
  },
  heavy_hitter: {
    id: 'heavy_hitter',
    emoji: '💥',
    name: 'Heavy Hitter',
    description: 'Tracked 5000mg total THC',
    premium: false
  },
  
  // NEW: Time-based
  daytime_warrior: {
    id: 'daytime_warrior',
    emoji: '☀️',
    name: 'Daytime Warrior',
    description: '5 sessions between 9am-5pm',
    premium: false
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    emoji: '🎉',
    name: 'Weekend Warrior',
    description: '10 weekend sessions',
    premium: false
  },
  
  // NEW: Mindful consumption
  mindful_tracker: {
    id: 'mindful_tracker',
    emoji: '🧠',
    name: 'Mindful Tracker',
    description: 'Tagged mood on 20 sessions',
    premium: false
  },
  strain_master: {
    id: 'strain_master',
    emoji: '🌿',
    name: 'Strain Master',
    description: 'Tried 10 different strains',
    premium: false
  },
  
  // NEW: Dab specific
  dab_dabbler: {
    id: 'dab_dabbler',
    emoji: '💎',
    name: 'Dab Dabbler',
    description: '5 dab sessions',
    premium: false
  },
  
  tone_collector: {
    id: 'tone_collector',
    emoji: '🎛',
    name: 'Tone Collector',
    description: 'Sampled every tone',
    premium: true
  },
  data_guru: {
    id: 'data_guru',
    emoji: '🧮',
    name: 'Data Guru',
    description: 'Dove into the numbers',
    premium: true
  }
};

// Normalize method names for badge checking
const normalizeMethodForBadges = (method) => {
  // Map all vape types to 'vape'
  if (method === 'vape_dry' || method === 'vape_cart' || method === 'vape') {
    return 'vape';
  }
  // Map all smoke types to 'smoke'
  if (method === 'joint' || method === 'cone' || method === 'blunt' || method === 'smoke') {
    return 'smoke';
  }
  // Map oil types
  if (method === 'oil_sublingual' || method === 'oil_ingested' || method === 'oil') {
    return 'edible'; // Treat oils like edibles for badge purposes
  }
  if (method === 'capsule') {
    return 'edible';
  }
  return method;
};

// Check which badges a user has earned
export const checkBadges = async (userId) => {
  try {
    // Get user's sessions
    const sessions = await base44.entities.Session.filter(
      { uid: userId },
      '-created_date',
      200
    );

    // Get already earned badges
    const earnedBadges = await base44.entities.Badge.filter({ uid: userId });
    const earnedBadgeIds = earnedBadges.map(b => b.badgeId);

    const newBadges = [];

    // First Timer - 1 session
    if (sessions.length >= 1 && !earnedBadgeIds.includes('first_timer')) {
      newBadges.push('first_timer');
    }

    // Regular - 10 sessions
    if (sessions.length >= 10 && !earnedBadgeIds.includes('regular')) {
      newBadges.push('regular');
    }

    // Veteran - 50 sessions
    if (sessions.length >= 50 && !earnedBadgeIds.includes('veteran')) {
      newBadges.push('veteran');
    }

    // Chill Master - 100 sessions
    if (sessions.length >= 100 && !earnedBadgeIds.includes('chill_master')) {
      newBadges.push('chill_master');
    }

    // High Flyer - buzz 9+
    if (!earnedBadgeIds.includes('high_flyer')) {
      const hasHighBuzz = sessions.some(s => s.buzzScore >= 9);
      if (hasHighBuzz) {
        newBadges.push('high_flyer');
      }
    }

    // Method-specific badges
    if (!earnedBadgeIds.includes('vapor_voyager')) {
      const vapeSessions = sessions.filter(s => {
        const normalized = normalizeMethodForBadges(s.method);
        return normalized === 'vape';
      }).length;
      if (vapeSessions >= 5) {
        newBadges.push('vapor_voyager');
      }
    }

    if (!earnedBadgeIds.includes('smokin_aces')) {
      const smokeSessions = sessions.filter(s => {
        const normalized = normalizeMethodForBadges(s.method);
        return normalized === 'smoke';
      }).length;
      if (smokeSessions >= 5) {
        newBadges.push('smokin_aces');
      }
    }

    if (!earnedBadgeIds.includes('edible_explorer')) {
      const edibleSessions = sessions.filter(s => {
        const normalized = normalizeMethodForBadges(s.method);
        return normalized === 'edible';
      }).length;
      if (edibleSessions >= 3) {
        newBadges.push('edible_explorer');
      }
    }

    // Time-based badges
    if (!earnedBadgeIds.includes('night_owl')) {
      const nightSessions = sessions.filter(s => {
        const hour = new Date(s.startedAt).getHours();
        return hour >= 22 || hour < 6;
      }).length;
      if (nightSessions >= 5) {
        newBadges.push('night_owl');
      }
    }

    if (!earnedBadgeIds.includes('early_bird')) {
      const morningSessions = sessions.filter(s => {
        const hour = new Date(s.startedAt).getHours();
        return hour >= 6 && hour < 9;
      }).length;
      if (morningSessions >= 3) {
        newBadges.push('early_bird');
      }
    }

    // Zen Master - avg buzz under 6 for 7 consecutive days with at least 1 session per day
    if (!earnedBadgeIds.includes('zen_master')) {
      const hasZenWeek = checkZenWeek(sessions);
      if (hasZenWeek) {
        newBadges.push('zen_master');
      }
    }

    // Method Mixer - 3 different methods in 7 days
    if (!earnedBadgeIds.includes('method_mixer')) {
      const hasMixedMethods = checkMethodMixer(sessions);
      if (hasMixedMethods) {
        newBadges.push('method_mixer');
      }
    }

    // NEW: Week Warrior - 7 day streak
    if (!earnedBadgeIds.includes('week_warrior')) {
      const hasWeekStreak = checkConsecutiveDays(sessions, 7);
      if (hasWeekStreak) {
        newBadges.push('week_warrior');
      }
    }

    // NEW: Consistency King - 30 day streak
    if (!earnedBadgeIds.includes('consistency_king')) {
      const hasMonthStreak = checkConsecutiveDays(sessions, 30);
      if (hasMonthStreak) {
        newBadges.push('consistency_king');
      }
    }

    // NEW: THC milestones
    const totalTHC = sessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
    
    if (!earnedBadgeIds.includes('gram_club') && totalTHC >= 1000) {
      newBadges.push('gram_club');
    }
    
    if (!earnedBadgeIds.includes('heavy_hitter') && totalTHC >= 5000) {
      newBadges.push('heavy_hitter');
    }

    // NEW: Daytime Warrior
    if (!earnedBadgeIds.includes('daytime_warrior')) {
      const daytimeSessions = sessions.filter(s => {
        const hour = new Date(s.startedAt).getHours();
        return hour >= 9 && hour < 17; // 9am to before 5pm (17:00)
      }).length;
      if (daytimeSessions >= 5) {
        newBadges.push('daytime_warrior');
      }
    }

    // NEW: Weekend Warrior
    if (!earnedBadgeIds.includes('weekend_warrior')) {
      const weekendSessions = sessions.filter(s => {
        const day = new Date(s.startedAt).getDay();
        return day === 0 || day === 6; // Sunday (0) or Saturday (6)
      }).length;
      if (weekendSessions >= 10) {
        newBadges.push('weekend_warrior');
      }
    }

    // NEW: Mindful Tracker
    if (!earnedBadgeIds.includes('mindful_tracker')) {
      const moodTaggedSessions = sessions.filter(s => s.mood).length; // Check if mood property exists and is not null/undefined
      if (moodTaggedSessions >= 20) {
        newBadges.push('mindful_tracker');
      }
    }

    // NEW: Strain Master
    if (!earnedBadgeIds.includes('strain_master')) {
      const uniqueStrains = new Set(sessions.filter(s => s.strain).map(s => s.strain.toLowerCase())).size;
      if (uniqueStrains >= 10) {
        newBadges.push('strain_master');
      }
    }

    // NEW: Dab Dabbler
    if (!earnedBadgeIds.includes('dab_dabbler')) {
      const dabSessions = sessions.filter(s => s.method === 'dab').length;
      if (dabSessions >= 5) {
        newBadges.push('dab_dabbler');
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};

// Helper: Check for Zen Master (7 consecutive days, avg buzz < 6, at least 1 session/day)
const checkZenWeek = (sessions) => {
  if (sessions.length < 7) return false;

  // Group sessions by date
  const sessionsByDate = {};
  sessions.forEach(s => {
    // Using UTC date components to avoid local timezone issues for streak calculation
    const dateObj = new Date(s.startedAt);
    const year = dateObj.getUTCFullYear();
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    if (!sessionsByDate[date]) {
      sessionsByDate[date] = [];
    }
    sessionsByDate[date].push(s);
  });

  const dates = Object.keys(sessionsByDate).sort();
  
  for (let i = 0; i <= dates.length - 7; i++) {
    let consecutive = true;
    let totalBuzz = 0;
    let sessionCount = 0;
    let currentStreakDates = []; // Store dates for the current potential 7-day window

    for (let j = 0; j < 7; j++) {
      const currentDate = new Date(dates[i]); // Start from the sorted date
      currentDate.setUTCDate(currentDate.getUTCDate() + j); // Add j days using UTC date
      const year = currentDate.getUTCFullYear();
      const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getUTCDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      currentStreakDates.push(dateStr);

      if (!sessionsByDate[dateStr] || sessionsByDate[dateStr].length === 0) {
        consecutive = false;
        break;
      }

      sessionsByDate[dateStr].forEach(s => {
        totalBuzz += s.buzzScore;
        sessionCount++;
      });
    }

    // After checking 7 days, verify if they were actually consecutive and meet criteria
    if (consecutive && sessionCount >= 7) {
      // Check for strict consecutiveness in the dates themselves
      let isStrictlyConsecutive = true;
      for (let k = 1; k < currentStreakDates.length; k++) {
        const prev = new Date(currentStreakDates[k - 1]);
        const curr = new Date(currentStreakDates[k]);
        prev.setUTCHours(0, 0, 0, 0);
        curr.setUTCHours(0, 0, 0, 0);
        const diffTime = curr.getTime() - prev.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays !== 1) {
          isStrictlyConsecutive = false;
          break;
        }
      }

      if (isStrictlyConsecutive) {
        const avgBuzz = totalBuzz / sessionCount;
        if (avgBuzz < 6) {
          return true;
        }
      }
    }
  }

  return false;
};

// Helper: Check for Method Mixer (3 different methods in 7 days)
const checkMethodMixer = (sessions) => {
  if (sessions.length < 3) return false;

  // Sort sessions by date to efficiently check windows
  sessions.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  // Check each 7-day window
  for (let i = 0; i < sessions.length; i++) {
    const startDate = new Date(sessions[i].startedAt);
    const sevenDaysLater = new Date(startDate);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7); // Max end date for the window

    const sessionsInWindow = sessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= startDate && sessionDate < sevenDaysLater; // Exclude the 7th day exactly 7 days later
    });

    // Use normalized methods for counting distinct types
    const methods = new Set(sessionsInWindow.map(s => normalizeMethodForBadges(s.method)));
    if (methods.size >= 3) {
      return true;
    }
  }

  return false;
};

// NEW: Check for consecutive day streaks
const checkConsecutiveDays = (sessions, targetDays) => {
  if (sessions.length === 0) return false;

  // Group sessions by date, normalizing to YYYY-MM-DD UTC to avoid timezone issues
  const sessionDates = new Set();
  sessions.forEach(s => {
    const dateObj = new Date(s.startedAt);
    const year = dateObj.getUTCFullYear();
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    sessionDates.add(`${year}-${month}-${day}`);
  });

  const sortedDates = Array.from(sessionDates).sort();
  
  if (sortedDates.length < targetDays) return false;

  let longestStreak = 0;
  let currentStreak = 0;

  if (sortedDates.length > 0) {
    currentStreak = 1; // At least one date, so a streak of 1 exists
    longestStreak = 1;
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    
    // Normalize to start of day for comparison in UTC
    prevDate.setUTCHours(0, 0, 0, 0);
    currDate.setUTCHours(0, 0, 0, 0);
    
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // Difference in days

    if (diffDays === 1) { // Exactly one day apart
      currentStreak++;
    } else {
      currentStreak = 1; // Reset streak if not consecutive
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak >= targetDays;
};

// Award a badge to a user
export const awardBadge = async (userId, badgeId) => {
  try {
    // Check if badge already exists
    const existing = await base44.entities.Badge.filter({
      uid: userId,
      badgeId: badgeId
    });

    if (existing && existing.length > 0) {
      return null; // Already has this badge
    }

    // Create badge
    const badge = await base44.entities.Badge.create({
      uid: userId,
      badgeId: badgeId,
      earnedAt: new Date().toISOString(),
      seen: false
    });

    return badge;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
};

// Mark badge as seen
export const markBadgeSeen = async (badgeId) => {
  try {
    await base44.entities.Badge.update(badgeId, { seen: true });
  } catch (error) {
    console.error('Error marking badge as seen:', error);
  }
};
