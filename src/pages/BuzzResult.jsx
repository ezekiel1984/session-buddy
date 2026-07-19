import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Sparkles, TrendingUp, TrendingDown, Zap, Smile, Info, AlertTriangle } from 'lucide-react';
import {
  calculateCumulativeBuzz,
  getBuzzCategory,
  calculateCumulativeActiveTHC,
  calculateTimeUntilSober,
  calculatePeakTime,
  generateBuzzTimeline,
  calculateActiveTHC,
  PERCEPTUAL_SOBER_THRESHOLD
} from '@/components/utils/buzzCalculator';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import { logger } from '@/components/utils/logger';
import { motion } from 'framer-motion';
import AgeGate from '@/components/AgeGate';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import { getMethodDisplay } from '@/components/utils/methodLabels';
import StrainEffectRating from '@/components/StrainEffectRating';
import BadgeCelebration from '@/components/BadgeCelebration';
import { checkBadges, awardBadge } from '@/components/utils/badgeChecker';
import OnboardingTooltip from '@/components/OnboardingTooltip';
import PullToRefresh from '@/components/PullToRefresh';

export default function BuzzResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cumulativeBuzz, setCumulativeBuzz] = useState(0);
  const [activeTHC, setActiveTHC] = useState(0);
  const [timeUntilSober, setTimeUntilSober] = useState(null); // This is a Date object
  const [peakTime, setPeakTime] = useState(null);
  const [buzzTimeline, setBuzzTimeline] = useState([]);
  const [user, setUser] = useState(null);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [mainSession, setMainSession] = useState(null); // The specific session to tag mood for
  const [selectedMood, setSelectedMood] = useState(null);
  const [showEffectRating, setShowEffectRating] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Add effect to show rating after mood is tagged or after a delay
  useEffect(() => {
    // Only show effect rating if user is premium
    if (mainSession && !showEffectRating && user?.isPremium) {
      // Show effect rating 5 seconds after page loads
      const timer = setTimeout(() => {
        setShowEffectRating(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [mainSession, showEffectRating, user]); // Added showEffectRating and user to dependencies

  const loadSessions = useCallback(async (skipDelay = false) => {
      try {
        logger.debug('[BuzzResult] Starting to load sessions');

        const currentUser = await base44.auth.me();
        logger.debug('[BuzzResult] Current user:', currentUser?.id);

        if (!currentUser) {
          logger.error('[BuzzResult] No user returned');
          await base44.auth.redirectToLogin(window.location.href);
          return;
        }

        if (!currentUser.ageConfirmed) {
          setUser(currentUser);
          setShowAgeGate(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        trackEvent(AnalyticsEvents.VIEW_BUZZ_RESULT);

        logger.debug('[BuzzResult] Fetching sessions for user:', currentUser.id);

        let recentSessions = [];

        try {
          logger.debug('[BuzzResult] Trying .list() method...');
          const listResults = await base44.entities.Session.list('-created_date', 200);
          logger.debug('[BuzzResult] .list() returned', listResults.length, 'sessions');
          recentSessions = listResults.filter(s => s.uid === currentUser.id);
          logger.debug('[BuzzResult] After filtering by uid:', recentSessions.length, 'sessions');
        } catch (listError) {
          logger.error('[BuzzResult] .list() failed:', listError);
        }

        if (recentSessions.length === 0) {
          try {
            logger.debug('[BuzzResult] Trying .filter() method...');
            const filterResults = await base44.entities.Session.filter(
              { uid: currentUser.id },
              '-created_date',
              200
            );
            logger.debug('[BuzzResult] .filter() returned', filterResults.length, 'sessions');
            recentSessions = filterResults;
          } catch (filterError) {
            logger.error('[BuzzResult] .filter() failed:', filterError);
          }
        }

        if (recentSessions.length === 0) {
          logger.debug('[BuzzResult] No sessions found after all attempts.');
          // Only clear sessions on the very first load — keep existing data on reloads
          // so a transient fetch failure/empty result doesn't wipe the user's buzz info
          if (!hasLoadedOnce.current) {
            setSessions([]);
          }
          setLoading(false);
          return;
        }

        hasLoadedOnce.current = true;

        // Ensure sessions are sorted by startedAt descending to guarantee [0] is the latest by time
        recentSessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

        // Check for new badges
        logger.debug('[BuzzResult] Checking for new badges...');
        try {
          const earnedBadgeIds = await checkBadges(currentUser.id);
          
          if (earnedBadgeIds.length > 0) {
            logger.debug('[BuzzResult] Found new badges:', earnedBadgeIds);
            
            // Award each badge
            const awardedBadges = [];
            for (const badgeId of earnedBadgeIds) {
              const badge = await awardBadge(currentUser.id, badgeId);
              if (badge) {
                awardedBadges.push(badgeId);
              }
            }
            
            if (awardedBadges.length > 0) {
              setNewBadges(awardedBadges);
              // Show celebration after a delay
              setTimeout(() => {
                setShowBadgeCelebration(true);
              }, 2000);
            }
          }
        } catch (badgeError) {
          logger.error('[BuzzResult] Error checking badges:', badgeError);
          // Don't fail the page load if badge check fails
        }

        // Use the most recent session
        const mostRecentDose = recentSessions[0];
        logger.debug('[BuzzResult] Most recent dose:', mostRecentDose.id, 'at', mostRecentDose.startedAt);

        // Robustly find the true root and all related sessions (handling potential chains)
        let current = mostRecentDose;
        const visitedIds = new Set([current.id]);
        
        // Traverse up to find the ultimate root
        while (current.stackedWith) {
          const parent = recentSessions.find(s => s.id == current.stackedWith);
          if (parent && !visitedIds.has(parent.id)) {
            current = parent;
            visitedIds.add(current.id);
          } else {
            // Parent not found or cycle detected, stop here
            break;
          }
        }
        
        const trueRootId = current.id;
        logger.debug('[BuzzResult] True root ID:', trueRootId);

        // Collect all related sessions (BFS/Iterative approach to handle arbitrary depth)
        const groupIds = new Set([trueRootId]);
        let addedNew = true;

        while (addedNew) {
          addedNew = false;
          // Find any session that points to a session currently in our group
          const children = recentSessions.filter(s => 
            s.stackedWith && groupIds.has(s.stackedWith) && !groupIds.has(s.id)
          );
          
          if (children.length > 0) {
            children.forEach(c => groupIds.add(c.id));
            addedNew = true;
          }
        }

        const sessionDoses = recentSessions.filter(s => groupIds.has(s.id));

        logger.debug('[BuzzResult] Found', sessionDoses.length, 'doses in current session group');

        const sortedDoses = sessionDoses.sort((a, b) =>
          new Date(a.startedAt) - new Date(b.startedAt)
        );

        // CRITICAL FIX: Filter active sessions based on current active THC, not stored soberAt
        const now = new Date();
        const allActiveSessions = recentSessions.filter(s => {
          try {
            const activeTHCForSession = calculateActiveTHC({
              method: s.method,
              dosageMg: s.dosageMg,
              startedAt: s.startedAt
            });
            const isActive = activeTHCForSession > PERCEPTUAL_SOBER_THRESHOLD;
            if (isActive) {
              logger.debug('[BuzzResult] Session', s.id, 'is still active (current active THC:', activeTHCForSession.toFixed(2), 'mg)');
            }
            return isActive;
          } catch (error) {
            logger.error('[BuzzResult] Error checking session', s.id, 'active status:', error);
            return false;
          }
        });

        logger.debug('[BuzzResult] Found', allActiveSessions.length, 'total active doses for calculations');

        // Set BOTH the current session window (for display) and all active sessions (for calculations)
        setSessions(sortedDoses); // Current session window for display

        // Store all active sessions for buzz calculations
        // We'll keep the name __allRecentSessions for compatibility with the buzz calculation useEffect
        window.__allRecentSessions = allActiveSessions;

        setLoading(false);

      } catch (error) {
        logger.error('[BuzzResult] Error loading sessions:', error);
        logger.error('[BuzzResult] Error stack:', error?.stack);

        const errorMessage = error?.message || String(error);
        const isAuthError = errorMessage.toLowerCase().includes('logged in') ||
                          errorMessage.toLowerCase().includes('unauthorized');

        if (isAuthError) {
          try {
            await base44.auth.redirectToLogin(window.location.href);
          } catch (redirectError) {
            logger.error('[BuzzResult] Failed to redirect to login:', redirectError);
            setLoading(false);
          }
        } else {
          toast.error('Failed to load buzz data. Please try refreshing.');
          setLoading(false);
        }
      }
  });

  // Load/reload sessions when navigating to Buzz tab (KeepAlive keeps us mounted)
  useEffect(() => {
    if (location.pathname === '/BuzzResult') {
      loadSessions(true);
    }
  }, [location.pathname, loadSessions]);

  const handleRefresh = async () => {
    await loadSessions(true);
  };

  // Effect to set the main session and its mood for tagging
  useEffect(() => {
    if (sessions.length > 0) {
      // The last session in the array is the most recent one in the current window
      // This is the one we'll allow mood tagging for.
      const latestSessionForMoodTagging = sessions[sessions.length - 1];
      setMainSession(latestSessionForMoodTagging);
      setSelectedMood(latestSessionForMoodTagging.mood || null);
    } else {
      setMainSession(null);
      setSelectedMood(null);
    }
  }, [sessions]);

  useEffect(() => {
    if (sessions.length === 0) return;

    const updateBuzz = () => {
      try {
        // CRITICAL FIX: Use all recent sessions (now meaning 'active' sessions) for accurate calculations
        const allActiveSessionsForCalc = window.__allRecentSessions || sessions;
        logger.debug('[BuzzResult] Using', allActiveSessionsForCalc.length, 'sessions for buzz calculations');

        const totalActiveTHC = calculateCumulativeActiveTHC(allActiveSessionsForCalc);
        const buzz = calculateCumulativeBuzz(allActiveSessionsForCalc);

        logger.debug('[BuzzResult] Total active THC:', totalActiveTHC.toFixed(2), 'mg');
        logger.debug('[BuzzResult] Calculated buzz score:', buzz.toFixed(1));

        // CRITICAL FIX: For very recent sessions, ensure we show at least a small buzz
        // Check if any session was logged in the last 2 minutes
        const now = new Date();
        const hasVeryRecentSession = sessions.some(s => { // Keep using `sessions` (the current session group) for this check
          const sessionTime = new Date(s.startedAt);
          const minutesAgo = (now - sessionTime) / (1000 * 60);
          return minutesAgo < 2;
        });

        if (hasVeryRecentSession && totalActiveTHC > 0 && buzz < 0.5) {
          logger.debug('[BuzzResult] Very recent session detected, ensuring minimum buzz display');
          setCumulativeBuzz(1.0); // Show at least 1.0 for brand new sessions
          setActiveTHC(totalActiveTHC);
        } else if (totalActiveTHC < 0.5) {
          setCumulativeBuzz(0);
          setActiveTHC(0);
        } else {
          setCumulativeBuzz(buzz);
          setActiveTHC(totalActiveTHC);
        }

        const soberTime = calculateTimeUntilSober(allActiveSessionsForCalc);
        setTimeUntilSober(soberTime);

        const peak = calculatePeakTime(allActiveSessionsForCalc);
        setPeakTime(peak);

        // CRITICAL FIX: Use all recent sessions for timeline generation
        const timeline = generateBuzzTimeline(allActiveSessionsForCalc);
        setBuzzTimeline(timeline);
      } catch (error) {
        logger.error('[BuzzResult] Error calculating buzz:', error);
        setCumulativeBuzz(0);
        setActiveTHC(0);
      }
    };

    updateBuzz();
    const interval = setInterval(updateBuzz, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sessions]);

  const handleAgeConfirmed = () => {
    setShowAgeGate(false);
    window.location.reload();
  };

  const buzzLevel = getBuzzCategory(cumulativeBuzz); // Defined here for use in the AI Insight useEffect

  useEffect(() => {
    const generateInsight = async () => {
      if (!user?.isPremium) return;
      if (sessions.length === 0 || aiInsight || loadingInsight || activeTHC < 0.5) return;

      setLoadingInsight(true);
      try {
        const now = new Date();

        const validSessions = sessions.filter(s => !isNaN(new Date(s.startedAt).getTime()));
        if (validSessions.length === 0) {
          setLoadingInsight(false);
          return;
        }

        const mostRecentSession = validSessions.reduce((newest, s) => {
          const sTime = new Date(s.startedAt);
          const newestTime = new Date(newest.startedAt);
          return sTime > newestTime ? s : newest;
        });

        const minutesSinceMostRecent = Math.round((now - new Date(mostRecentSession.startedAt)) / 60000);

        // Get user's recent session history for context
        const allUserSessions = await base44.entities.Session.filter(
          { uid: user.id },
          '-created_date',
          50
        );

        const last7Days = allUserSessions.filter(s => {
          const sessionDate = new Date(s.startedAt);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= sevenDaysAgo;
        });

        const avgDailyDoses = last7Days.length / 7;
        const totalWeeklyTHC = last7Days.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
        const avgSessionSize = last7Days.length > 0 ? totalWeeklyTHC / last7Days.length : 0;

        // Enhanced prompt with much more context
        const prompt = `You are Session Buddy's AI companion providing personalized insights. Be warm, supportive, and insightful.

USER CONTEXT:
- Name: ${user.firstName || 'friend'}
- Tolerance Level: ${user.tolerance || 'medium'}
- Weight: ${user.weightKg ? `${user.weightKg}kg` : 'not set'}
- Usage Profile: ${user.usageProfile || 'frequent'}

CURRENT SESSION:
- Current Buzz Score: ${cumulativeBuzz.toFixed(1)}/10 (${buzzLevel.label})
- Active THC in Blood: ${activeTHC.toFixed(1)}mg
- Method: ${mostRecentSession.method}
- Strain: ${mostRecentSession.strain}
- Time Since Dose: ${minutesSinceMostRecent} minutes ago
- Mood Tagged: ${mostRecentSession.mood || 'none yet'}

RECENT PATTERN (Last 7 Days):
- Average doses per day: ${avgDailyDoses.toFixed(1)}
- Total weekly THC intake: ${totalWeeklyTHC.toFixed(0)}mg
- Average session size: ${avgSessionSize.toFixed(1)}mg

YOUR TASK:
Provide a thoughtful, personalized insight (60-80 words) that:
1. Acknowledges their current buzz level and how they might be feeling
2. Relates their current session to their recent consumption patterns
3. Offers a gentle observation about their tolerance, frequency, or dosing
4. Encourages mindful consumption without being preachy
5. If appropriate, mention their mood tag or suggest mood tracking

Tone: ${user.preferredTone || 'zen'} - Be authentic to this tone while remaining supportive.

NO medical advice. NO dosing recommendations. Focus on awareness and mindfulness.`;

        logger.debug('[BuzzResult] Generating enhanced insight...');

        // Set a timeout for the LLM call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('LLM timeout')), 15000); // 15 second timeout
        });

        const llmPromise = base44.integrations.Core.InvokeLLM({
          prompt: prompt
          // response_json_schema is removed as response is expected to be a direct string
        });

        const response = await Promise.race([llmPromise, timeoutPromise]);

        if (response && typeof response === 'string' && response.trim()) {
          setAiInsight(response.trim());
          logger.debug('[BuzzResult] Enhanced insight generated successfully');
        } else {
          logger.debug('[BuzzResult] Invalid response format or empty, skipping insight');
          setAiInsight(null);
        }
      } catch (error) {
        logger.debug('[BuzzResult] Insight generation skipped:', error.message);
        // Silently fail - don't show error to user
        setAiInsight(null);
      } finally {
        setLoadingInsight(false);
      }
    };

    // Add delay before generating to avoid race conditions
    const timer = setTimeout(() => {
      if (sessions.length > 0 && user?.isPremium && cumulativeBuzz !== undefined && !aiInsight && !loadingInsight) {
        generateInsight();
      }
    }, 1000); // Wait 1 second after page loads

    return () => clearTimeout(timer);
  }, [sessions, user, cumulativeBuzz, activeTHC, aiInsight, loadingInsight, buzzLevel]);

  const handleMoodSelect = async (mood) => {
    if (!mainSession?.id) {
      logger.error('[BuzzResult] No mainSession or mainSession.id found when trying to tag mood:', mainSession);
      toast.error('No active session to tag mood for.');
      return;
    }

    if (!user?.id) {
      logger.error('[BuzzResult] No user.id found when trying to tag mood for session:', mainSession.id, user);
      toast.error('User not authenticated. Please refresh the page.');
      return;
    }

    logger.debug('[BuzzResult] Attempting to save mood:', {
      sessionId: mainSession.id,
      mood: mood,
      userId: user.id,
      userEmail: user.email // Include email for better logging context if available
    });

    const previousMood = selectedMood;
    setSelectedMood(mood);

    try {
      const updateResult = await base44.entities.Session.update(mainSession.id, { mood });
      logger.debug('[BuzzResult] Mood save successful:', updateResult);
      toast.success('Mood tagged!');
      // Update the mainSession object in state as well
      setMainSession(prev => prev ? { ...prev, mood: mood } : null);
    } catch (error) {
      logger.error('[BuzzResult] Error updating mood for session:', {
        error: error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        sessionId: mainSession.id,
        attemptedMood: mood,
        userId: user.id
      });
      toast.error('Failed to save mood');
      setSelectedMood(previousMood); // Revert on error
    }
  };

  const moodOptions = [
    { value: 'relaxed', emoji: '😌', label: 'Relaxed' },
    { value: 'creative', emoji: '🎨', label: 'Creative' },
    { value: 'focused', emoji: '🎯', label: 'Focused' },
    { value: 'social', emoji: '🗣️', label: 'Social' },
    { value: 'sleepy', emoji: '😴', label: 'Sleepy' },
    { value: 'energized', emoji: '⚡', label: 'Energized' },
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'calm', emoji: '🧘', label: 'Calm' }
  ];

  // FIXED: Define getPeakStatus function BEFORE using it
  const getPeakStatus = () => {
    if (!peakTime) return null;

    if (isNaN(peakTime.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = peakTime.getTime() - now.getTime();

    // EXPANDED WINDOW: If peak is more than 5 minutes in the future, show "rising"
    if (diffMs > 5 * 60 * 1000) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return { status: 'rising', text: `Peak in ~${minutes}m`, icon: TrendingUp, color: 'text-green-400' };
    }
    // EXPANDED WINDOW: If peak is within +/- 5 minutes, show "at peak"
    else if (diffMs > -5 * 60 * 1000) {
      return { status: 'peak', text: 'At peak now', icon: Zap, color: 'text-yellow-400' };
    }
    // Otherwise, past peak
    else {
      return { status: 'declining', text: 'Past peak', icon: TrendingDown, color: 'text-orange-400' };
    }
  };

  const getTimeUntilSoberText = () => {
    // FIXED: Check if sober first, before checking timeUntilSober
    // Changed to < 2.0 because "Barely Noticeable" (< 2.0) effectively means feeling sober
    if (cumulativeBuzz < 2.0) {
      return 'Feeling sober';
    }

    if (!timeUntilSober) return 'Calculating...';

    if (isNaN(timeUntilSober.getTime())) {
      return 'N/A';
    }

    const now = new Date();
    const diffMs = timeUntilSober.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Feeling sober';
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `~${hours}h ${minutes}m until feeling sober`;
    }
    return `~${minutes}m until feeling sober`;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (showAgeGate) {
    return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  }

  // buzzLevel is already defined above the useEffect that uses it
  const isSober = cumulativeBuzz < 0.5;
  const sessionLabel = !isSober ?
    (sessions.length > 1 ? 'Active Session' : 'Active Dose') :
    (sessions.length > 1 ? 'Past Session' : 'Past Dose');
  const peakStatus = getPeakStatus(); // This call is now correctly after the function definition.

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 12rem)' }}>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#141416] rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No active doses</h3>
              <p className="text-gray-400 mb-6">Start tracking your consumption</p>
              <Button
                onClick={() => navigate(createPageUrl('LogDose'))}
                className="bg-[#25A55F] hover:bg-[#1e8a4c]"
              >
                Log a Dose
              </Button>
            </div>
          </div>
        </div>
        
      </div>
    );
  }

  const maxTimelineBuzz = Math.max(...buzzTimeline.map(d => d.buzzScore), 10);

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
    <PullToRefresh onRefresh={handleRefresh}>
      <OnboardingTooltip
        pageName="BuzzResult"
        title="🔥 Your Buzz Level"
        description="See your current buzz score calculated from active THC in your system. Peak times show when effects are strongest. Never drive while elevated, and avoid mixing with alcohol or other substances."
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-3xl p-10 mb-8 text-center relative overflow-hidden soft-shadow-lg"
        >
          <div className={`absolute inset-0 ${buzzLevel.bg} opacity-5`} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-6">
              <Flame className="w-4 h-4 text-[#25A55F]" />
              <span className="text-sm font-medium text-[#25A55F]">
                {sessionLabel}
              </span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-8xl font-bold mb-4"
            >
              <span className={buzzLevel.color}>
                {isSober ? '0.0' : cumulativeBuzz.toFixed(1)}
              </span>
            </motion.h1>

            <p className={`text-2xl font-semibold ${buzzLevel.color} mb-3`}>
              {isSober ? 'Sober' : buzzLevel.label}
            </p>

            {sessions.length > 1 && !isSober && (
              <p className="text-gray-400 text-sm mb-8">
                Combined from {sessions.length} doses in this session
              </p>
            )}

            {peakStatus && !isSober && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/50 border border-gray-800 mb-6`}>
                <peakStatus.icon className={`w-4 h-4 ${peakStatus.color}`} />
                <span className={`text-sm ${peakStatus.color}`}>{peakStatus.text}</span>
              </div>
            )}

            <div className="flex justify-center gap-2 mb-8">
              {[...Array(Math.min(10, Math.ceil(cumulativeBuzz)))].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + (i * 0.05) }}
                  className="h-2 w-8 rounded-full bg-[#25A55F] shadow-[0_0_8px_rgba(37,165,95,0.4)]"
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-400 text-lg">
              <Clock className="w-5 h-5" />
              <span>{getTimeUntilSoberText()}</span>
            </div>

            {/* Educational Disclaimer */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-start gap-2 text-left bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  <strong>Educational Estimate:</strong> This buzz score is calculated based on dose size, potency, consumption method, and your tolerance level using current pharmacokinetic research. Effects vary by individual. Always consume mindfully and responsibly. Not medical advice.
                </p>
              </div>
            </div>

            {/* Safety Reminder */}
            {!isSober && (
              <div className="mt-4">
                <div className="flex items-start gap-2 text-left bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-200 leading-relaxed">
                    <p className="mb-2"><strong>Safety Reminder:</strong> Do not drive, operate machinery, or engage in risky activities while under the influence. Never mix cannabis with alcohol or other drugs.</p>
                    <Link 
                      to={createPageUrl('SafetyInfo')}
                      className="text-yellow-400 hover:text-yellow-300 underline"
                    >
                      View safety guidelines →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {user?.isPremium && !isSober && activeTHC > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Premium Insight</span>
                </div>
                <div className="mt-3">
                  <p className="text-gray-400 text-sm">Active Blood THC</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1">
                    {activeTHC.toFixed(1)} <span className="text-lg text-gray-500">mg</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {user?.isPremium && !isSober && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2 text-[#25A55F] text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Insight</span>
                </div>
                {loadingInsight ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#25A55F] border-t-transparent" />
                    <span>Generating insight...</span>
                  </div>
                ) : aiInsight ? (
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "{aiInsight}"
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>

        {/* Add Mood Selector after main buzz card */}
        {!isSober && mainSession && (
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Smile className="w-5 h-5 text-[#25A55F]" />
              <h3 className="text-white font-semibold">How are you feeling?</h3>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedMood === mood.value
                      ? 'bg-[#25A55F]/20 border-2 border-[#25A55F]'
                      : 'bg-[#0A0A0B] border-2 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-gray-400">{mood.label}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Mood tagged! This helps us provide better insights.
              </p>
            )}
          </div>
        )}

        {/* Add Strain Effect Rating Component - Premium Only */}
        {!isSober && mainSession && showEffectRating && user?.isPremium && (
          <StrainEffectRating
            strainName={mainSession.strain}
            userId={user?.id}
            sessionId={mainSession.id}
            onComplete={() => setShowEffectRating(false)}
          />
        )}

        {!isSober && buzzTimeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-8 soft-shadow"
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#25A55F]" />
              Buzz Timeline (Last 6 Hours)
            </h3>
            <div className="relative h-40 pl-8">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {[0, 2.5, 5, 7.5, 10].map((value, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={100 - (value / maxTimelineBuzz) * 100}
                    x2="100"
                    y2={100 - (value / maxTimelineBuzz) * 100}
                    stroke="#2a2a2c"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {buzzTimeline.length > 1 && (
                  <path
                    d={`
                      M 0,100
                      ${buzzTimeline.map((d, i) => {
                        const x = (i / (buzzTimeline.length - 1)) * 100;
                        const y = 100 - (d.buzzScore / maxTimelineBuzz) * 100;
                        return `L ${x},${y}`;
                      }).join(' ')}
                      L 100,100
                      Z
                    `}
                    fill="url(#buzzGradient)"
                    opacity="0.3"
                  />
                )}

                {buzzTimeline.length > 0 && (
                  <polyline
                    points={buzzTimeline.map((d, i) => {
                      const x = (i / (buzzTimeline.length - 1)) * 100;
                      const y = 100 - (d.buzzScore / maxTimelineBuzz) * 100;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#25A55F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                <line
                  x1="100"
                  y1="0"
                  x2="100"
                  y2="100"
                  stroke="#25A55F"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />

                <defs>
                  <linearGradient id="buzzGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#25A55F" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#25A55F" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-6">
                <span>10</span>
                <span>5</span>
                <span>0</span>
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>6h ago</span>
                <span>3h ago</span>
                <span>Now</span>
              </div>
            </div>
          </motion.div>
        )}

        {sessions.length > 1 ? (
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-4">Doses in This Session:</h3>
            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-[#141416] border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium capitalize">{session.strain}</span>
                    <span className="text-[#25A55F] font-semibold">
                      {session.dosageMg}mg
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                    <span>{getMethodDisplay(session.method, false)}</span>
                    <span>•</span>
                    <span>
                      {
                        !isNaN(new Date(session.startedAt).getTime())
                          ? new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'N/A'
                      }
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : sessions.length === 1 ? (
          <div className="space-y-4">
            <DetailCard label="Method" value={getMethodDisplay(sessions[0].method, false)} />
            <DetailCard label="Dosage" value={`${sessions[0].dosageMg}mg THC`} />
            <DetailCard label="Strain" value={sessions[0].strain} />
            <DetailCard label="Tolerance" value={sessions[0].tolerance} />
          </div>
        ) : null}
      </div>
    </PullToRefresh>

      

      {/* Badge Celebration */}
      {showBadgeCelebration && newBadges.length > 0 && (
        <BadgeCelebration
          badgeIds={newBadges}
          onClose={() => {
            setShowBadgeCelebration(false);
            setNewBadges([]);
          }}
        />
      )}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#141416] border border-gray-800 rounded-xl p-5 soft-shadow"
    >
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-white font-semibold text-lg capitalize">{value}</p>
    </motion.div>
  );
}