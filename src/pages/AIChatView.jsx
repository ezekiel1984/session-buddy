import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sparkles, Trash2, Pencil, Check, X } from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import MessageBubble from '@/components/MessageBubble';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import { logger } from '@/components/utils/logger';

const TONE_INSTRUCTIONS = {
  zen: 'Tone: Calm, mindful, and reassuring. Focus on balance, breathing, and presence. Use gentle, soothing language. Be a grounding influence.',
  rick: 'Tone: Witty, sarcastic, and scientific (like Rick Sanchez). Don\'t suffer fools, but give good advice. Focus on the raw data and biology.',
  lofi: 'Tone: Chill, aesthetic, low-key. Vibes are immaculate. Short, relaxed sentences. Use soft language.',
  clinical: 'Tone: Objective, precise, data-focused. Use correct terminology (bioavailability, metabolic clearance, half-life). Professional, educational, but not cold.',
  dude: 'Tone: The ultimate chill homie. "The Dude" energy. Very relaxed, conversational, friendly. Supportive and easygoing.'
};

export default function AIChatView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const chatId = searchParams.get('chatId');

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const titleInputRef = useRef(null);

  const chatFromState = location.state?.initialChat;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!currentUser.isPremium) {
          navigate(createPageUrl('Premium'));
          return;
        }

        setAuthLoading(false);
      } catch (error) {
        logger.error('[AIChatView] Error loading user:', error);
        await base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: chat, isLoading: chatLoading, error: chatError } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      try {
        const chats = await base44.entities.Chat.filter({ id: chatId });
        return chats[0] || null;
      } catch (error) {
        logger.error('[AIChatView] Error querying chat:', error);
        throw error;
      }
    },
    enabled: !!chatId && !authLoading && !chatFromState,
    initialData: chatFromState || undefined,
    retry: 3,
    retryDelay: 1000
  });

  const activeChat = chat || chatFromState;

  useEffect(() => {
    if (activeChat?.title) {
      setEditedTitle(activeChat.title);
    }
  }, [activeChat?.title]);

  useEffect(() => {
    if (chatError) {
      logger.error('[AIChatView] Chat query error:', chatError);
    }
  }, [chatError]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const allMessages = await base44.entities.Message.filter(
        { chatId },
        'created_date',
        100
      );
      return allMessages;
    },
    enabled: !!chatId && !authLoading,
    refetchInterval: 3000
  });

  const updateChatTitleMutation = useMutation({
    mutationFn: async (newTitle) => {
      await base44.entities.Chat.update(chatId, { title: newTitle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Chat renamed!');
    },
    onError: (error) => {
      logger.error('Error updating chat title:', error);
      toast.error('Failed to rename chat');
    }
  });

  // Fetch user stats client-side (replaces backend function that requires Builder+)
  const fetchUserStatsClientSide = async () => {
    if (!user?.id) return null;
    try {
      const sessions = await base44.entities.Session.filter(
        { uid: user.id },
        '-created_date',
        500
      );

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const sessions7d = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo);
      const sessions30d = sessions.filter(s => new Date(s.startedAt) >= thirtyDaysAgo);

      const totalThc7d = sessions7d.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
      const totalThc30d = sessions30d.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);

      const avgPeakBuzz = sessions7d.length > 0
        ? sessions7d.reduce((sum, s) => sum + (s.buzzScore || 0), 0) / sessions7d.length
        : 0;

      const methodCounts = {};
      sessions7d.forEach(s => { methodCounts[s.method] = (methodCounts[s.method] || 0) + 1; });
      const mostCommonMethod = Object.keys(methodCounts).length > 0
        ? Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "None";

      const strainCounts = {};
      sessions7d.forEach(s => { if (s.strain) strainCounts[s.strain] = (strainCounts[s.strain] || 0) + 1; });
      const mostUsedStrain = Object.keys(strainCounts).length > 0
        ? Object.entries(strainCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "None";

      return {
        sessions7d: sessions7d.length,
        sessions30d: sessions30d.length,
        totalThc7d: Math.round(totalThc7d),
        totalThc30d: Math.round(totalThc30d),
        avgPeakBuzz: Math.round(avgPeakBuzz * 10) / 10,
        mostCommonMethod,
        mostUsedStrain,
        totalSessions: sessions.length
      };
    } catch (error) {
      logger.error('[AIChatView] Error fetching stats client-side:', error);
      return null;
    }
  };

  // Build AI prompt and call InvokeLLM directly (replaces backend function)
  const generateAIResponse = async (enrichedMessage, conversationHistory) => {
    const toneMode = activeChat?.toneMode || 'zen';
    const toneInstruction = TONE_INSTRUCTIONS[toneMode] || TONE_INSTRUCTIONS.zen;

    let firstName = user?.firstName;
    if (!firstName && user?.full_name) {
      firstName = user.full_name.split(' ')[0];
    }
    if (!firstName) firstName = 'friend';

    // Get active session timing context
    let timingContext = '';
    try {
      const recentSessions = await base44.entities.Session.filter(
        { uid: user.id },
        '-created_date',
        5
      );
      const now = new Date();
      const activeSessions = recentSessions.filter(s => {
        try {
          const soberTime = new Date(s.soberAt);
          return !isNaN(soberTime.getTime()) && soberTime > now;
        } catch { return false; }
      });

      if (activeSessions.length > 0) {
        const mostRecent = activeSessions.reduce((newest, s) => {
          const sTime = new Date(s.startedAt);
          const newestTime = new Date(newest.startedAt);
          return sTime > newestTime ? s : newest;
        });
        const minutesSince = Math.round((now - new Date(mostRecent.startedAt)) / 60000);
        const methodPeakTimes = { vape_dry: 10, vape_cart: 10, smoke: 10, dab: 5, oil_sublingual: 30, oil_ingested: 90, edible: 90 };
        const peakTime = methodPeakTimes[mostRecent.method] || 10;

        if (minutesSince < peakTime - 2) {
          timingContext = `This dose was taken ${minutesSince}m ago — effects are building toward peak (expected at ~${peakTime}m).`;
        } else if (minutesSince < peakTime + 5) {
          timingContext = `This dose was taken ${minutesSince}m ago — at or near peak effects now.`;
        } else {
          const hoursSince = Math.floor(minutesSince / 60);
          timingContext = `The most recent dose was ${hoursSince > 0 ? `${hoursSince}h ` : ''}${minutesSince % 60}m ago — past peak, effects are tapering.`;
        }
      }
    } catch (e) {
      logger.warn('[AIChatView] Could not fetch timing context:', e);
    }

    const systemPrompt = `You are "Session Buddy AI", an intelligent, data-driven, and supportive cannabis coaching companion for ${firstName}.
Your mission is to help the user consume mindfully, track their usage, and stay safe.

CORE PERSONA & ROLE:
- **Supportive Coach:** You are non-judgmental, warm, and conversational. You are here to help, not lecture.
- **Data-Driven:** You love numbers. Use the user's session data (provided below) to explain their buzz, tolerance, and patterns. Give specific, actionable advice based on the data — don't be cagey or evasive.
- **Harm Reduction:** You ALWAYS encourage safe limits, hydration, and breaks. You NEVER encourage reckless use.
- **Educational:** You explain the "science" simply (e.g., bio-availability, decay curves) to empower the user.
- **Direct & Helpful:** Give real, practical advice. Don't hedge excessively. If the user asks about their consumption, give them concrete numbers and recommendations based on their data.

CRITICAL BOUNDARIES:
1. **NOT A Doctor:** You do NOT give medical advice, diagnose, or prescribe.
2. **Legal & Safety:** Do NOT help with illegal acts. DO NOT advise driving or operating machinery while impaired.
3. **Disclaimers:** Remind the user that all "Predictor" and "Buzz" numbers are educational estimates, not medical facts.

TONE SETTING (${toneMode}):
${toneInstruction}

CURRENT STATUS & DATA:
${timingContext ? `[ACTIVE SESSION DATA]: ${timingContext}` : '[STATUS]: No active sessions detected right now.'}

[SYSTEM INSTRUCTIONS]:
- If the user's message contains [SYSTEM DATA], use that strictly to answer their questions about stats/history. Be specific and use the actual numbers.
- Proactively offer help: "Want to plan a session?", "Shall we check your tolerance?", "Need a hydration reminder?"
- Keep responses concise, helpful, and human-like. 2-4 sentences typically.
- Use the user's name (${firstName}) naturally.

RECENT CHAT HISTORY:
${conversationHistory}

USER MESSAGE:
${enrichedMessage}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt
    });

    return typeof response === 'string' ? response : (response?.reply || JSON.stringify(response));
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!userMessage.trim() || isTyping) return;

    const messageToSend = userMessage.trim();
    setUserMessage('');
    setIsTyping(true);

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    try {
      // Save user message
      await base44.entities.Message.create({
        chatId: chatId,
        sender: 'user',
        text: messageToSend
      });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });

      // Enrich with stats if relevant
      let enrichedMessage = messageToSend;
      const lowerMsg = messageToSend.toLowerCase();
      const statsKeywords = ['stats', 'statistics', 'data', 'usage', 'consumption', 'how much', 'how many', 'patterns', 'trends', 'history', 'tracking', 'summary', 'insights', 'last week', 'last month', 'recent', 'total', 'average', 'frequency', 'habits', 'breakdown', 'overview', 'analyze'];
      const wantsStats = statsKeywords.some(kw => lowerMsg.includes(kw));

      if (wantsStats) {
        const stats = await fetchUserStatsClientSide();
        if (stats) {
          enrichedMessage = `${messageToSend}\n\n[SYSTEM DATA — Use these real numbers to answer specifically:\nSessions: ${stats.sessions7d} this week, ${stats.sessions30d} this month\nTHC: ${stats.totalThc7d}mg this week, ${stats.totalThc30d}mg this month\nAverage buzz: ${stats.avgPeakBuzz}/10\nTop method: ${stats.mostCommonMethod}\nFavorite strain: ${stats.mostUsedStrain}\nTotal sessions all-time: ${stats.totalSessions}]`;
        }
      }

      // Build conversation history from current messages
      const conversationHistory = messages
        .slice(-10)
        .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`)
        .join('\n');

      // Generate AI response directly via InvokeLLM
      const aiReply = await generateAIResponse(enrichedMessage, conversationHistory);

      // Save AI message
      await base44.entities.Message.create({
        chatId: chatId,
        sender: 'ai',
        text: aiReply
      });

      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      trackEvent(AnalyticsEvents.AI_AGENT_MSG);
    } catch (error) {
      logger.error('[AIChatView] Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Delete this chat? This action cannot be undone.')) return;

    setDeleting(true);

    try {
      const messagesToDelete = await base44.entities.Message.filter({ chatId });
      for (const message of messagesToDelete) {
        try {
          await base44.entities.Message.delete(message.id);
        } catch (msgError) {
          logger.warn('[AIChatView] Failed to delete message:', message.id, msgError);
        }
      }

      try {
        await base44.entities.Chat.delete(chatId);
      } catch (chatError) {
        if (chatError.message && chatError.message.includes('not found')) {
          logger.debug('[AIChatView] Chat already deleted or not found, continuing...');
        } else {
          throw chatError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Chat deleted successfully');
      navigate(createPageUrl('AICompanion'));
    } catch (error) {
      logger.error('[AIChatView] Error deleting chat:', error);
      toast.error('Failed to delete chat: ' + (error.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  if (authLoading || (chatLoading && !chatFromState)) {
    return <LoadingScreen />;
  }

  if (!activeChat && !chatLoading && !chatError) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-white text-xl mb-2">Chat not found</h2>
          <p className="text-gray-400 mb-2 text-sm">This chat may have been deleted or doesn't exist</p>
          <p className="text-gray-500 mb-6 text-xs font-mono">Chat ID: {chatId}</p>
          <Button onClick={() => navigate(createPageUrl('AICompanion'))}>
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col">
      {/* Chat Header - positioned below the global Layout header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-gray-800 z-40" style={{ top: 'calc(env(safe-area-inset-top) + 3.5rem)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('AICompanion'))}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>

            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateChatTitleMutation.mutate(editedTitle);
                      setEditingTitle(false);
                    }
                    if (e.key === 'Escape') {
                      setEditedTitle(activeChat?.title || 'New Chat');
                      setEditingTitle(false);
                    }
                  }}
                  className="bg-[#141416] border-gray-800 text-white flex-1"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    updateChatTitleMutation.mutate(editedTitle);
                    setEditingTitle(false);
                  }}
                  className="text-[#25A55F] hover:text-[#1e8a4c] hover:bg-[#25A55F]/10"
                >
                  <Check className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex-1 text-left group"
              >
                <h1 className="text-lg font-semibold text-white group-hover:text-[#25A55F] transition-colors">
                  {activeChat?.title || 'New Chat'}
                </h1>
                <p className="text-sm text-gray-400 capitalize">{activeChat?.toneMode} Tone</p>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!editingTitle && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTitle(true)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteChat}
                  disabled={deleting}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6"
        style={{ scrollBehavior: 'smooth', paddingTop: 'calc(env(safe-area-inset-top) + 7.5rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 11rem)' }}
      >
        <div className="max-w-lg mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-[#141416] rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#25A55F]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start chatting</h3>
              <p className="text-gray-400 text-center">Ask me about your sessions, buzz levels, or anything cannabis-related!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input bar - positioned above the global BottomNav */}
      <div className="fixed left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-gray-800 z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
        <div className="max-w-lg mx-auto px-6 py-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 bg-[#141416] border-gray-800 text-white h-12"
            />
            <Button
              type="submit"
              disabled={!userMessage.trim() || isTyping}
              className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white px-4 h-12"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}