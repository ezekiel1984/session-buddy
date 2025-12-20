import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Sparkles, Trash2, Pencil, Check, X } from 'lucide-react';
import { trackEvent, AnalyticsEvents } from '@/components/utils/analytics';
import MessageBubble from '@/components/MessageBubble';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import { logger } from '@/components/utils/logger';

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
        logger.debug('[AIChatView] Current user:', currentUser?.id, 'isPremium:', currentUser?.isPremium);
        setUser(currentUser);
        
        if (!currentUser.isPremium) {
          logger.debug('[AIChatView] User not premium, redirecting');
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
      if (!chatId) {
        logger.debug('[AIChatView] No chatId provided');
        return null;
      }
      
      logger.debug('[AIChatView] Querying for chat:', chatId);
      logger.debug('[AIChatView] User ID:', user?.id);
      
      try {
        const chats = await base44.entities.Chat.filter({ id: chatId });
        logger.debug('[AIChatView] Query returned:', chats.length, 'chats');
        
        if (chats.length > 0) {
          logger.debug('[AIChatView] Found chat:', JSON.stringify(chats[0], null, 2));
        } else {
          logger.debug('[AIChatView] No chat found with id:', chatId);
        }
        
        return chats[0] || null;
      } catch (error) {
        logger.error('[AIChatView] Error querying chat:', error);
        logger.debug('[AIChatView] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    enabled: !!chatId && !authLoading && !chatFromState,
    initialData: chatFromState || undefined,
    retry: 3,
    retryDelay: 1000
  });

  const activeChat = chat || chatFromState;

  // Update editedTitle when chat changes
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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, currentChatId, userVisibleMessage }) => {
      await base44.entities.Message.create({
        chatId: currentChatId,
        sender: 'user',
        text: userVisibleMessage || message
      });

      const response = await base44.functions.invoke('sendAICompanionMessage', {
        chatId: currentChatId,
        userMessage: message,
        toneMode: activeChat?.toneMode || 'zen'
      });

      await base44.entities.Message.create({
        chatId: currentChatId,
        sender: 'ai',
        text: response.data.reply
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      trackEvent(AnalyticsEvents.AI_AGENT_MSG);
    },
    onError: (error) => {
      logger.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isTyping && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [isTyping]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      // autoFocus attribute handles initial focus, this is for selecting text
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const detectStatsKeywords = (message) => {
    const lowerMessage = message.toLowerCase();
    const statsKeywords = [
      'stats', 'statistics', 'stat', 'data', 'numbers', 'usage', 'consumption',
      'how much', 'how many', 'patterns', 'pattern', 'trends', 'trend', 
      'history', 'historical', 'tracking', 'track', 'go over', 'show me',
      'tell me', 'give me', 'breakdown', 'break down', 'summary', 'summarize',
      'rundown', 'run down', 'overview', 'analyze', 'analysis', 'insights', 
      'insight', 'review', 'last week', 'last month', 'this week', 'this month',
      'last 7 days', 'last 30 days', 'past week', 'past month', 'recent',
      'lately', 'total', 'average', 'how often', 'frequency', 'habit', 'habits',
      'use', 'using', 'used', 'sessions', 'session count', 'thc intake',
      'method breakdown', 'strain breakdown', 'consumption patterns'
    ];
    
    return statsKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const detectToleranceKeywords = (message) => {
    const lowerMessage = message.toLowerCase();
    const toleranceKeywords = [
      'tolerance', 'tolerance level', 'my tolerance', "what's my tolerance",
      'whats my tolerance', 'tolerance setting', 'current tolerance'
    ];
    
    return toleranceKeywords.some(keyword => lowerMessage.includes(keyword));
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
      const isStatsQuery = detectStatsKeywords(messageToSend);
      const isToleranceQuery = detectToleranceKeywords(messageToSend);
      
      let enrichedMessage = messageToSend;
      
      if (isStatsQuery) {
        try {
          const [statsResponse, userResponse] = await Promise.all([
            base44.functions.invoke('getUserStats'),
            base44.functions.invoke('getCurrentUser')
          ]);
          
          const stats = statsResponse.data;
          const currentUser = userResponse.data;
          
          enrichedMessage = `${messageToSend}\n\n[SYSTEM DATA - Use this to answer the user's query:\nUser: ${currentUser.firstName || currentUser.full_name}\nSessions: ${stats.sessions7d} this week, ${stats.sessions30d} this month\nTHC: ${stats.totalThc7d}mg this week, ${stats.totalThc30d}mg this month\nAverage buzz: ${stats.avgPeakBuzz}/10\nTop method: ${stats.mostCommonMethod}\nFavorite strain: ${stats.mostUsedStrain}\nLongest session: ${stats.longestSession}\nTotal sessions all-time: ${stats.totalSessions}]`;
        } catch (error) {
          logger.error('[AIChatView] Error fetching stats:', error);
        }
      }
      
      if (isToleranceQuery && !isStatsQuery) {
        try {
          const userResponse = await base44.functions.invoke('getCurrentUser');
          const currentUser = userResponse.data;
          
          enrichedMessage = `${messageToSend}\n\n[SYSTEM DATA - The user's tolerance level is: ${currentUser.tolerance}]`;
        } catch (error) {
          logger.error('[AIChatView] Error fetching user data:', error);
        }
      }
      
      await sendMessageMutation.mutateAsync({
        message: enrichedMessage,
        currentChatId: chatId,
        userVisibleMessage: messageToSend
      });
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
    if (!window.confirm('Delete this chat? This action cannot be undone.')) {
      return;
    }

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

  if (!activeChat && !chatLoading && !chatError) { // Added chatError to condition
    logger.debug('[AIChatView] Rendering "not found" state');
    logger.debug('[AIChatView] chatId:', chatId);
    logger.debug('[AIChatView] chatFromState:', chatFromState);
    logger.debug('[AIChatView] chat from query:', chat);
    logger.debug('[AIChatView] chatError:', chatError);
    
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('AICompanion'))}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditedTitle(activeChat?.title || 'New Chat');
                    setEditingTitle(false);
                  }}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
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
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
            <Button
              onClick={() => navigate(createPageUrl('Settings'))}
              variant="outline"
              className="border-[#25A55F] bg-[#25A55F]/10 text-[#25A55F] hover:bg-[#25A55F] hover:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI
            </Button>
          </div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto pt-20 pb-24 px-6"
        style={{ scrollBehavior: 'smooth' }}
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

      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-gray-800">
        <div className="max-w-lg mx-auto px-6 py-4">
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
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}