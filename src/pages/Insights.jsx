import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Calendar, Flame, Clock, Zap, Share2, FlaskConical, Crown, Trophy } from 'lucide-react';
import { calculateUserStats } from '@/components/utils/statsCalculator';
import BottomNav from '@/components/BottomNav';
import BloodTHCGraph from '@/components/BloodTHCGraph';
import LoadingScreen from '@/components/LoadingScreen';
import AgeGate from '@/components/AgeGate';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ShareStatsModal from '@/components/ShareStatsModal';
import { getMethodDisplay } from '../components/utils/methodLabels';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';
import ConsumptionTrends from '@/components/insights/ConsumptionTrends';
import OnboardingTooltip from '@/components/OnboardingTooltip';
import PullToRefresh from '@/components/PullToRefresh';

export default function Insights() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const queryClient = useQueryClient();
  const handlePTRRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['insights-sessions', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] })
    ]);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        console.log('[Insights] User loaded:', {
          id: currentUser.id,
          isPremium: currentUser.isPremium,
          email: currentUser.email
        });

        setUser(currentUser);

        if (!currentUser.ageConfirmed) {
          setShowAgeGate(true);
          setAuthLoading(false);
          return;
        }

        // Removed the premium check here to allow non-premium users to view the Insights page,
        // but with premium-only features gated within the component itself.
        // if (!currentUser.isPremium) {
        //   navigate(createPageUrl('Premium'));
        //   return;
        // }

        setAuthLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        await base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['insights-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        console.log('[Insights] Fetching sessions for user:', user.id);

        const allSessions = await base44.entities.Session.filter(
          { uid: user.id },
          '-created_date',
          500
        );

        console.log('[Insights] Fetched', allSessions.length, 'sessions');

        const validSessions = allSessions.filter(session => {
          try {
            const sessionDate = new Date(session.startedAt);
            return !isNaN(sessionDate.getTime());
          } catch (err) {
            console.error('Error filtering session:', err, session);
            return false;
          }
        });

        console.log('[Insights] Filtered to', validSessions.length, 'valid sessions');
        return validSessions;
      } catch (error) {
        console.error('[Insights] Error fetching sessions:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !authLoading,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2_000 * 2 ** attemptIndex, 30_000),
    staleTime: 30_000,
    cacheTime: 300_000,
    onError: (error) => {
      console.error('[Insights] Query error:', error);
      toast.error('Failed to load sessions. Please check your connection.');
    }
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await base44.entities.Badge.filter({ uid: user.id });
      } catch (error) {
        console.error('[Insights] Error fetching badges:', error);
        return [];
      }
    },
    enabled: !!user?.id && !authLoading,
    retry: 2,
    staleTime: 60_000
    });

    const queryClient = useQueryClient();
    const handlePTRRefresh = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['insights-sessions', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] })
      ]);
    };

    const stats = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return null;

    try {
      const calculatedStats = calculateUserStats(sessions);

      let timeSinceLastDose = null;
      if (sessions.length > 0) {
        const sortedSessions = [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        const mostRecent = sortedSessions[0];

        const now = new Date();
        const timeDiff = now - new Date(mostRecent.startedAt);

        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          timeSinceLastDose = `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
          timeSinceLastDose = `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
          timeSinceLastDose = `${minutes}m`;
        } else {
          timeSinceLastDose = `Just now`;
        }
      }

      return {
        ...calculatedStats,
        timeSinceLastDose: timeSinceLastDose,
      };

    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  }, [sessions]);

  const overviewStats = React.useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        sessions7d: 0,
        sessions30d: 0,
        totalThc7d: 0,
        totalThc30d: 0,
        avgPeakBuzz: 0,
        longestSession: "0h 0m",
        mostCommonMethod: "None",
        mostUsedStrain: "None",
        totalSessions: 0,
        timeSinceLastDose: null
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sessions7dFiltered = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo);

    const totalThc7d = sessions7dFiltered.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);

    const avgPeakBuzz = sessions7dFiltered.length > 0
      ? sessions7dFiltered.reduce((sum, s) => sum + (s.buzzScore || 0), 0) / sessions7dFiltered.length
      : 0;

    let longestDuration = 0;
    sessions.forEach(s => {
      try {
        const start = new Date(s.startedAt);
        const end = new Date(s.soberAt);
        const duration = (end - start) / (1000 * 60);
        if (duration > longestDuration) {
          longestDuration = duration;
        }
      } catch (err) {
        // Skip invalid dates
      }
    });
    const hours = Math.floor(longestDuration / 60);
    const minutes = Math.round(longestDuration % 60);
    const longestSession = `${hours}h ${minutes}m`;

    const methodCounts = {};
    sessions7dFiltered.forEach(s => {
      methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
    });
    const mostCommonMethod = Object.keys(methodCounts).length > 0
      ? Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "None";

    const strainCounts = {};
    sessions7dFiltered.forEach(s => {
      if (s.strain) {
        strainCounts[s.strain] = (strainCounts[s.strain] || 0) + 1;
      }
    });
    const mostUsedStrain = Object.keys(strainCounts).length > 0
      ? Object.entries(strainCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "None";

    let timeSinceLastDose = null;
    if (sessions.length > 0) {
      const sortedSessions = [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      const mostRecent = sortedSessions[0];

      const timeDiff = now - new Date(mostRecent.startedAt);
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      const hoursDiff = Math.floor(minutesDiff / 60);
      const daysDiff = Math.floor(hoursDiff / 24);

      if (daysDiff > 0) {
        timeSinceLastDose = `${daysDiff}d ${hoursDiff % 24}h`;
      } else if (hoursDiff > 0) {
        timeSinceLastDose = `${hoursDiff}h ${minutesDiff % 60}m`;
      } else if (minutesDiff > 0) {
        timeSinceLastDose = `${minutesDiff}m`;
      } else {
        timeSinceLastDose = `Just now`;
      }
    }

    return {
      sessions7d: sessions7dFiltered.length,
      totalThc7d: Math.round(totalThc7d),
      avgPeakBuzz: Math.round(avgPeakBuzz * 10) / 10,
      longestSession,
      mostCommonMethod,
      mostUsedStrain,
      totalSessions: sessions.length,
      timeSinceLastDose
    };
  }, [sessions]);


  const buzzTrendData = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const last7DaysMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      last7DaysMap.set(dateKey, {
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalBuzz: 0,
        sessionCount: 0
      });
    }

    sessions.forEach(session => {
      try {
        const sessionDate = new Date(session.startedAt);
        if (isNaN(sessionDate.getTime())) return;

        sessionDate.setHours(0, 0, 0, 0);
        const sessionDateKey = sessionDate.toISOString().split('T')[0];

        const dayData = last7DaysMap.get(sessionDateKey);
        if (dayData) {
          dayData.totalBuzz += session.buzzScore || 0;
          dayData.sessionCount += 1;
        }
      } catch (error) {
        console.error('Error processing session date for daily trends:', error);
      }
    });

    return Array.from(last7DaysMap.values()).map(day => ({
      date: day.date.toISOString(),
      day: day.dayName,
      fullDate: day.fullDate,
      avgBuzz: day.sessionCount > 0 ? parseFloat((day.totalBuzz / day.sessionCount).toFixed(1)) : 0,
      sessionCount: day.sessionCount
    }));
  }, [sessions]);

  const handleAgeConfirmed = () => {
    setShowAgeGate(false);
    window.location.reload();
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };


  if (authLoading || sessionsLoading) {
    return <LoadingScreen />;
  }

  if (showAgeGate) {
    return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  }

  if (sessionsError) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="bg-[#141416] border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Insights</h3>
            <p className="text-gray-400 mb-2">Check your internet connection</p>
            <p className="text-gray-500 text-sm mb-6">
              {sessionsError?.message || 'Network error occurred'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#25A55F] hover:bg-[#1e8a4c]"
            >
              Try Again
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Show preview/info page for non-premium users
  if (user && !user.isPremium) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <PullToRefresh onRefresh={handlePTRRefresh}>
        <OnboardingTooltip
          pageName="Insights"
          title="📊 Insights"
          description="Get detailed analytics on your consumption patterns including trends, method breakdowns, and personalized recommendations. See the preview below for what's available!"
        />

        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Premium Feature</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Insights</h1>
          <p className="text-gray-400 mb-8">Understand your consumption patterns</p>

          {/* Anonymized Teaser Chart */}
          <div className="bg-[#141416] border border-[#25A55F]/20 rounded-2xl p-6 mb-6 soft-shadow">
            <h3 className="text-white font-semibold mb-4">📈 Sample Weekly Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { day: 'Mon', buzz: 0 },
                  { day: 'Tue', buzz: 5.2 },
                  { day: 'Wed', buzz: 0 },
                  { day: 'Thu', buzz: 4.8 },
                  { day: 'Fri', buzz: 6.5 },
                  { day: 'Sat', buzz: 7.1 },
                  { day: 'Sun', buzz: 5.5 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
                  <XAxis dataKey="day" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141416',
                      border: '1px solid #2a2a2c',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value}`, 'Avg Buzz']}
                  />
                  <Line
                    type="monotone"
                    dataKey="buzz"
                    stroke="#25A55F"
                    strokeWidth={3}
                    dot={{ fill: '#25A55F', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-xs text-blue-200 text-center">
                <strong>Sample data.</strong> Upgrade to see YOUR actual weekly trends, consumption patterns, and personalized recommendations.
              </p>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="space-y-6">
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">What are Insights?</h3>
                  <p className="text-gray-400 text-sm">Data-driven consumption analytics</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Insights gives you a comprehensive view of your consumption patterns, trends, and habits.
                Understand what works best for you and make informed decisions about your usage.
              </p>
            </div>

            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
              <h3 className="text-white font-semibold mb-4">Key Features:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Blood THC Concentration Graph</p>
                    <p className="text-gray-400 text-sm">Visualize active cannabinoid levels over time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Daily Buzz Trends</p>
                    <p className="text-gray-400 text-sm">Track your buzz intensity patterns over 7 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Method Breakdown</p>
                    <p className="text-gray-400 text-sm">See which consumption methods you prefer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Top Strains Analysis</p>
                    <p className="text-gray-400 text-sm">Discover your favorite strains and their effects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Shareable Stats Cards</p>
                    <p className="text-gray-400 text-sm">Create beautiful graphics to share your journey</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Preview Image/Illustration */}
            <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-8 text-center soft-shadow">
              <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 mb-6">
                Turn your data into actionable insights for better consumption habits
              </p>
            </div>

            {/* Upgrade CTA */}
            <Button
              onClick={() => navigate(createPageUrl('Premium'))}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-14 text-lg font-semibold rounded-xl"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
        </PullToRefresh>
        <BottomNav />
        </div>
        );
        }

        return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <PullToRefresh onRefresh={handlePTRRefresh}>
      <OnboardingTooltip
        pageName="Insights_Premium"
        title="📊 Your Insights"
        description="Analyze your consumption trends, see weekly comparisons, and get personalized recommendations. Use these insights to maintain healthy patterns and avoid tolerance buildup."
      />

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Premium Insights</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insights</h1>
              <p className="text-gray-400">Understand your consumption patterns</p>
            </div>

            {sessions.length > 0 && stats && (
              <Button
                onClick={handleShareClick}
                variant="outline"
                className="border-gray-800 bg-[#141416] text-gray-300 hover:text-white hover:bg-gray-800 hover:border-[#25A55F]/30 transition-all"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No Data Yet</h3>
            <p className="text-gray-400 mb-6">Start logging sessions to see your insights</p>
            <Button
              onClick={() => navigate(createPageUrl('LogDose'))}
              className="bg-[#25A55F] hover:bg-[#1e8a4c]"
            >
              Log First Dose
            </Button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-6 soft-shadow"
            >
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#25A55F]" />
                Your Stats Overview
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  icon={FlaskConical}
                  label="Total THC (7d)"
                  value={`${overviewStats.totalThc7d}mg`}
                  color="text-purple-400"
                  bgColor="bg-purple-500/10"
                />
                <StatTile
                  icon={TrendingUp}
                  label="Avg Buzz (7d)"
                  value={`${overviewStats.avgPeakBuzz}/10`}
                  color="text-[#25A55F]"
                  bgColor="bg-[#25A55F]/10"
                />
                <StatTile
                  icon={Clock}
                  label="Longest Session"
                  value={overviewStats.longestSession}
                  color="text-blue-400"
                  bgColor="bg-blue-500/10"
                />
                <StatTile
                  icon={Zap}
                  label="Time Since Last"
                  value={overviewStats.timeSinceLastDose || "N/A"}
                  color="text-orange-400"
                  bgColor="bg-orange-500/10"
                />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Most Used Method</p>
                  <p className="text-white font-medium capitalize">{getMethodDisplay(overviewStats.mostCommonMethod, false)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Favorite Strain</p>
                  <p className="text-white font-medium">{overviewStats.mostUsedStrain}</p>
                </div>
              </div>
            </motion.div>

            {/* NEW: Consumption Trends Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ConsumptionTrends sessions={sessions} />
            </motion.div>

            <BloodTHCGraph sessions={sessions} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#25A55F]" />
                Daily Buzz Trends (Last 7 Days)
              </h3>

              {buzzTrendData.every(d => d.sessionCount === 0) ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Not enough data yet</p>
                  <p className="text-sm mt-2">Log more sessions to see trends</p>
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buzzTrendData}>
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
                          domain={[0, 10]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141416',
                            border: '1px solid #2a2a2c',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value) => [`${value}`, 'Buzz Score']}
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
                          dataKey="avgBuzz"
                          stroke="#25A55F"
                          strokeWidth={3}
                          dot={{
                            fill: '#25A55F',
                            stroke: '#0A0A0B',
                            strokeWidth: 2,
                            r: 5
                          }}
                          activeDot={{
                            r: 7,
                            fill: '#25A55F',
                            stroke: '#0A0A0B',
                            strokeWidth: 2
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    {buzzTrendData.slice(-3).map((day, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[#25A55F] font-semibold mt-1">
                          {day.avgBuzz}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-[#0A0A0B] border border-gray-800 rounded-xl">
                    <p className="text-xs text-gray-400">
                      <span className="font-semibold text-gray-300">Scientific Note:</span> Values represent average peak buzz scores per day. Days with no sessions show 0. Calculations based on THC dosage, method, tolerance, and body weight.
                    </p>
                  </div>
                </>
              )}
            </motion.div>

            {stats.methodBreakdown && stats.methodBreakdown.length > 0 && (
              <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#25A55F]" />
                  Method Breakdown
                </h3>
                <div className="space-y-3">
                  {stats.methodBreakdown.map((method, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-white font-medium w-24">{getMethodDisplay(method.method, false)}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-[#25A55F] h-full rounded-full transition-all duration-300"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm w-16 text-right">
                        {method.count} ({method.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Badges
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(createPageUrl('Badges'))}
                    className="text-[#25A55F] hover:bg-[#25A55F]/10"
                  >
                    View All
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {badges.slice(0, 8).map((badge) => {
                    const badgeDef = BADGE_DEFINITIONS[badge.badgeId];
                    if (!badgeDef) return null;

                    return (
                      <div key={badge.id} className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mb-2">
                          <span className="text-2xl">{badgeDef.emoji}</span>
                        </div>
                        <span className="text-xs text-gray-400 text-center line-clamp-2">
                          {badgeDef.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {badges.length > 8 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => navigate(createPageUrl('Badges'))}
                      className="text-sm text-gray-400 hover:text-[#25A55F] transition-colors"
                    >
                      +{badges.length - 8} more badges
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#25A55F]" />
                Your Stats at a Glance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <p className="text-gray-400 text-xs">Time Since Last</p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    {stats.timeSinceLastDose || 'N/A'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">since last dose</p>
                </div>

                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#25A55F]" />
                    <p className="text-gray-400 text-xs">Avg Buzz Score</p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    {stats.avgBuzzPeak?.toFixed(1) || '0.0'}<span className="text-sm text-gray-500">/10</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">across all sessions</p>
                </div>

                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <p className="text-gray-400 text-xs">Most Common</p>
                  </div>
                  <p className="text-white font-bold text-lg capitalize">
                    {getMethodDisplay(stats.mostCommonMethod, false) || 'N/A'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {stats.mostCommonMethod ?
                      `${stats.methodBreakdown.find(m => m.method === stats.mostCommonMethod)?.percentage || 0}% of sessions`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <p className="text-gray-400 text-xs">Total Sessions</p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    {sessions.length}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">all time</p>
                </div>

                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    <p className="text-gray-400 text-xs">Avg Dosage</p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    {sessions.length > 0 ?
                      (sessions.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0) / sessions.length).toFixed(1)
                      : '0.0'}
                    <span className="text-sm text-gray-500">mg</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">THC per session</p>
                </div>

                <div className="bg-[#0A0A0B] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <p className="text-gray-400 text-xs">Avg Time to Sober</p>
                  </div>
                  <p className="text-white font-bold text-xl">
                    {stats.avgSoberTime || 'N/A'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">typical duration</p>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="bg-[#141416] border border-yellow-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Unable to Calculate Insights</h3>
            <p className="text-gray-400">There was an error processing your data</p>
          </div>
        )}
      </div>

      </PullToRefresh>
      <BottomNav />

      {stats && sessions.length > 0 && (
        <ShareStatsModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          stats={stats}
          sessions={sessions}
          badges={badges}
        />
      )}
    </div>
  );
}

const StatTile = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-[#0A0A0B] rounded-xl p-4 text-center">
    <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-white mb-1">
      {value}
    </div>
    <div className="text-gray-500 text-xs leading-tight">
      {label}
    </div>
  </div>
);