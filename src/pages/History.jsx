import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, Loader2, Clock, RefreshCw, Brain, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import AgeGate from '@/components/AgeGate';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getMethodDisplay } from '@/components/utils/methodLabels';
import { calculateBuzzScore } from '@/components/utils/buzzCalculator';
import { formatDistanceToNow } from 'date-fns';
import OnboardingTooltip from '@/components/OnboardingTooltip';
import PullToRefresh from '@/components/PullToRefresh';

import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState(false); // This dialog now refers to deleting a single 'dose'
  const [selectedSession, setSelectedSession] = useState(null); // This will hold a single 'dose' object
  const [deleting, setDeleting] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [expandedDates, setExpandedDates] = useState(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: currentUser, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (!base44 || !base44.auth || !base44.auth.me) {
        console.error('base44 SDK not properly initialized');
        toast.error('App not properly initialized. Please refresh the page.');
        throw new Error('SDK not initialized');
      }
      return await base44.auth.me();
    },
    onSuccess: (data) => {
      setUser(data);
      if (!data?.ageConfirmed) {
        setShowAgeGate(true);
      } else {
        try {
          if (typeof trackEvent === 'function' && AnalyticsEvents?.VIEW_HISTORY) {
            trackEvent(AnalyticsEvents.VIEW_HISTORY);
          }
        } catch (trackError) {
          console.error('Error tracking event:', trackError);
        }
      }
    },
    onError: (error) => {
      console.error('Error fetching current user in History:', error);
      toast.error('Failed to load user. Please try refreshing or logging in again.');
      if (base44.auth.redirectToLogin) {
        base44.auth.redirectToLogin(window.location.href);
      } else {
        navigate('/');
      }
    },
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 5,
  });

  const { data: sessions = [], isLoading: areSessionsLoading, isFetching: areSessionsRefetching, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        return [];
      }

      const userSessions = await base44.entities.Session.filter(
        { uid: currentUser.id },
        '-created_date',
        200
      );

      // Clear any stale optimistic session — the real session is fetched from the database
      try {
        sessionStorage.removeItem('latestSession');
      } catch {}

      return userSessions;
    },
    enabled: !!currentUser?.id && currentUser?.ageConfirmed && !showAgeGate,
    onError: (error) => {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load history. Please try again.');
    },
    initialData: [],
  });

  // Filter individual doses by time
  const filteredSessions = React.useMemo(() => { // Renamed from filteredDoses to filteredSessions as per outline
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return sessions.filter(dose => {
      const doseDate = new Date(dose.startedAt);
      if (timeFilter === 'all') return true;
      if (timeFilter === 'today') return doseDate >= today;
      if (timeFilter === 'week') return doseDate >= sevenDaysAgo;
      if (timeFilter === 'month') return doseDate >= thirtyDaysAgo;
      return true;
    });
  }, [sessions, timeFilter]);

  // Group sessions by date (Sydney timezone)
  const groupedByDate = React.useMemo(() => {
    const groups = {};

    filteredSessions.forEach(dose => {
      // Convert to Sydney timezone for grouping
      const doseDate = new Date(dose.startedAt);
      const sydneyDateString = doseDate.toLocaleDateString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      if (!groups[sydneyDateString]) {
        groups[sydneyDateString] = [];
      }
      groups[sydneyDateString].push(dose);
    });

    // Sort each group by time (most recent first)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    });

    // Return array of {date, doses} sorted by date (most recent first)
    return Object.entries(groups)
      .map(([date, doses]) => ({ date, doses }))
      .sort((a, b) => {
        // Parse date strings in dd/mm/yyyy format
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        // Create Date objects for comparison (month is 0-indexed)
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredSessions]);

  // Auto-expand today's doses
  useEffect(() => {
    if (groupedByDate.length > 0) {
      const todayGroup = groupedByDate[0];
      setExpandedDates(new Set([todayGroup.date]));
    }
  }, [groupedByDate]);

  const toggleDateExpansion = (date) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const getRelativeTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const handleDelete = async (sessionId) => { // sessionId here refers to a single dose ID
    if (!window.confirm('Are you sure you want to delete this dose? This cannot be undone.')) {
      return;
    }

    setDeleting(true);

    const queryKey = ['sessions', currentUser?.id];
    const previousSessions = queryClient.getQueryData(queryKey); // previousSessions are individual doses

    try {
      // Optimistically update the UI to remove the dose
      if (previousSessions) {
        queryClient.setQueryData(
          queryKey,
          previousSessions.filter(s => s.id !== sessionId)
        );
      }

      await base44.entities.Session.delete(sessionId);

      toast.success('Dose deleted');

      // Invalidate query cache to ensure stats are refreshed and data is consistent
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['insights-sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] });

    } catch (error) {
      console.error('[History] Error deleting dose:', error);
      toast.error('Failed to delete dose');

      // If deletion fails, revert the optimistic update
      if (previousSessions) {
        queryClient.setQueryData(queryKey, previousSessions);
      }
      // Refetch sessions to ensure we're in sync with the server
      refetchSessions();
    } finally {
      setDeleting(false);
    }
  };

  const handleClearHistory = async () => {
    setDeleting(true);
    try {
      // This deletes all individual doses from the backend
      const deletionPromises = sessions.map(dose => base44.entities.Session.delete(dose.id));
      await Promise.all(deletionPromises);

      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['insights-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });

      toast.success('All history cleared successfully!');
      setShowDeleteAllDialog(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteSession = async () => { // This now refers to deleting a single 'dose'
    if (!selectedSession) return;

    setDeleting(true);

    const queryKey = ['sessions', currentUser?.id];
    const previousSessions = queryClient.getQueryData(queryKey);

    try {
      // Optimistically remove the dose from the UI immediately
      if (previousSessions) {
        queryClient.setQueryData(
          queryKey,
          previousSessions.filter(s => s.id !== selectedSession.id)
        );
      }

      // Close dialog and clear selection immediately
      setSelectedSession(null);
      setShowDeleteSessionDialog(false);

      await base44.entities.Session.delete(selectedSession.id);

      toast.success('Dose deleted successfully!');

      // Invalidate queries to refresh stats
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['insights-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    } catch (error) {
      console.error('Error deleting dose:', error);
      toast.error('Failed to delete dose. Please try again.');

      // Revert optimistic update on failure
      if (previousSessions) {
        queryClient.setQueryData(queryKey, previousSessions);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleAgeConfirmed = async () => {
    setShowAgeGate(false);
    await refetchUser();
    await refetchSessions();
  };

  const handlePrefillFromHistory = (dose) => { // Renamed session to dose for clarity
    try {
      // Store prefill data in sessionStorage so LogDose can read it
      sessionStorage.setItem('dosePrefill', JSON.stringify({
        method: dose.method,
        strain: dose.strain,
        dosageMg: dose.dosageMg,
        rawInput: dose.rawInput || {},
        // Always set time to "now" for template
        timeOption: 'now'
      }));

      // Signal LogDose (even if cached/hidden by KeepAlive) to read the prefill
      window.dispatchEvent(new CustomEvent('dosePrefillReady'));
      navigate(createPageUrl('LogDose'));
    } catch (error) {
      console.error('Error preparing prefill dose:', error);
      toast.error('Failed to prepare dose');
    }
  };

  const handleAIInsights = () => {
    if (!currentUser?.isPremium) {
      navigate(createPageUrl('Premium'));
    } else {
      navigate(createPageUrl('Insights'));
    }
  };

  const handlePTRRefresh = async () => {
    await Promise.all([refetchSessions(), refetchUser()]);
  };

  const isOverallLoading = isUserLoading || areSessionsLoading;

  const LoadingScreen = () => (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-[#25A55F] mb-4" />
      <p>Loading history...</p>
    </div>
  );

  if (isOverallLoading) {
    return <LoadingScreen />;
  }

  if (showAgeGate) {
    return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  }

  if (isUserError && !isUserLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-white">
        <p className="text-lg mb-4">Error loading user data.</p>
        <Button onClick={() => navigate('/')} className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white rounded-xl">
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <PullToRefresh onRefresh={handlePTRRefresh}>
      <OnboardingTooltip
        pageName="History"
        title="📅 Dose History"
        description="View all your logged doses organized by date. Use the 'Hit Again' button to quickly log the same dose, and track patterns over time to stay mindful of your consumption."
      />
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Dose History</h1> {/* Changed title */}
            <div className="flex gap-2">
              {currentUser?.ageConfirmed && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAIInsights}
                  className="border-gray-800 bg-[#141416] text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-10 w-10"
                  aria-label="AI Insights"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchSessions()}
                disabled={areSessionsRefetching}
                className="border-gray-800 bg-[#141416] text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl h-10 w-10"
              >
                <RefreshCw className={`w-4 h-4 ${areSessionsRefetching ? 'animate-spin' : ''}`} />
              </Button>

              {sessions.length > 0 && ( // sessions.length is total individual doses
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={deleting}
                  className="border-red-900/50 bg-[#141416] text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl h-10 w-10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-gray-400 mb-4">
            {filteredSessions.length === 0 ? 'No doses for this filter' : // Uses filteredSessions
              filteredSessions.length === 1 ? '1 dose found' :
                `${filteredSessions.length} doses found`}
          </p>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' }
            ].map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={timeFilter === value ? 'default' : 'outline'}
                onClick={() => setTimeFilter(value)}
                className={timeFilter === value ?
                  'bg-[#25A55F] hover:bg-[#1e8a4c] text-white rounded-lg px-3 py-1.5 whitespace-nowrap' :
                  'border-gray-800 bg-[#141416] text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-1.5 whitespace-nowrap'
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {filteredSessions.length === 0 ? ( // Uses filteredSessions
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#141416] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-600" /> {/* New icon */}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No doses yet</h3> {/* New text */}
            <p className="text-gray-400 mb-6">Start tracking your consumption</p>
            <Button
              onClick={() => navigate(createPageUrl('LogDose'))} // Changed to LogDose
              className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white rounded-xl"
            >
              Log First Dose {/* New text */}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {groupedByDate.map(({ date, doses }) => {
                const isExpanded = expandedDates.has(date);
                const totalDoses = doses.length;
                const totalMg = doses.reduce((sum, d) => sum + (parseFloat(d.dosageMg) || 0), 0);

                // Format date for display in Sydney timezone
                const [day, month, year] = date.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day); // Month is 0-indexed for Date constructor
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const isToday = dateObj.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }) === today.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
                const isYesterday = dateObj.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }) === yesterday.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });

                const dateLabel = isToday ? 'Today' :
                  isYesterday ? 'Yesterday' :
                    dateObj.toLocaleDateString('en-AU', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'Australia/Sydney'
                    });

                return (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#141416] border border-gray-800 rounded-xl overflow-hidden"
                  >
                    {/* Date header - clickable to expand/collapse */}
                    <button
                      onClick={() => toggleDateExpansion(date)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#25A55F]" />
                        <div className="text-left">
                          <h3 className="text-white font-semibold">{dateLabel}</h3>
                          <p className="text-xs text-gray-500">
                            {totalDoses} dose{totalDoses !== 1 ? 's' : ''} · {Math.round(totalMg)}mg total
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Collapsible dose list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-800"
                        >
                          <div className="p-3 space-y-3">
                            {doses.map((dose) => {
                              const dosageMg = typeof dose.dosageMg === 'number' ? dose.dosageMg : parseFloat(dose.dosageMg) || 0;
                              // const buzzScore = calculateBuzzScore({ activeTHC: dosageMg, tolerance: dose.tolerance || 'medium' });

                              // Format time in Sydney timezone
                              const doseTime = new Date(dose.startedAt).toLocaleTimeString('en-AU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Australia/Sydney'
                              });

                              const relativeTime = getRelativeTime(dose.startedAt);

                              return (
                                <div
                                  key={dose.id}
                                  className="bg-[#0A0A0B] border border-gray-800 rounded-lg p-4 hover:border-[#25A55F]/30 transition-all"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <span className="text-white font-medium capitalize">{dose.strain || 'Unknown Strain'}</span>
                                      <div className="flex gap-2 text-xs text-gray-400 mt-1">
                                        <span>{doseTime}</span>
                                        {relativeTime && (
                                          <>
                                            <span>•</span>
                                            <span>{relativeTime}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-[#25A55F] font-semibold text-lg">{dosageMg}mg</span>
                                  </div>

                                  <div className="flex gap-2 text-xs text-gray-400 mb-3">
                                    <span>{getMethodDisplay(dose.method, false)}</span>
                                    {dose.mood && (
                                      <>
                                        <span>•</span>
                                        <span>😌 {dose.mood}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                                    <Button
                                      onClick={() => handlePrefillFromHistory(dose)}
                                      variant="outline"
                                      className="flex-1 border-gray-700 bg-[#141416] text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm"
                                    >
                                      <Plus className="w-3 h-3 mr-2" />
                                      Hit Again 🔥
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedSession(dose);
                                        setShowDeleteSessionDialog(true);
                                      }}
                                      disabled={deleting}
                                      className="border-red-900/50 bg-[#141416] text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg h-9 w-9"
                                      aria-label={`Delete dose from ${new Date(dose.startedAt).toLocaleString()}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      </PullToRefresh>
      

      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="bg-[#141416] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Clear All History?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete all {sessions.length} doses from your history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearHistory}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSessionDialog} onOpenChange={setShowDeleteSessionDialog}>
        <DialogContent className="bg-[#141416] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete This Dose?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete this dose record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteSessionDialog(false);
                setSelectedSession(null);
              }}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}