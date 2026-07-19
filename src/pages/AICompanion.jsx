import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, Sparkles, Crown } from 'lucide-react'; // Added Crown import
import { toast } from 'sonner';
import AIChatList from '../components/AIChatList';
import { trackEvent, AnalyticsEvents } from '../components/utils/analytics';
import OnboardingTooltip from '@/components/OnboardingTooltip';

export default function AICompanion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false); // Added showAgeGate state
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    loadUserAndChats();
  }, []);

  // Reload chats when navigating back to this page
  useEffect(() => {
    if (!loading && user) {
      console.log('[AICompanion] Page focused/navigated to, reloading chats');
      loadUserAndChats();
    }
  }, [location.key]); // location.key changes on navigation

  const loadUserAndChats = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      if (!currentUser) {
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      setUser(currentUser);

      // Fetch all chats for this user
      const userChats = await base44.entities.Chat.filter(
        { uid: currentUser.id },
        '-created_date',
        100
      );

      console.log('[AICompanion] Loaded chats:', userChats.length);
      setChats(userChats);
      setLoading(false);

    } catch (error) {
      console.error('[AICompanion] Error loading:', error);
      toast.error('Failed to load chats');
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    console.log('[AICompanion] handleCreateChat called');
    
    if (!user) {
      console.error('[AICompanion] No user found');
      toast.error('Please log in to create a chat');
      return;
    }

    if (!user?.isPremium) {
      console.log('[AICompanion] User not premium, redirecting');
      navigate(createPageUrl('Premium'));
      return;
    }

    setCreating(true);
    try {
      console.log('[AICompanion] Creating chat for user:', user.id);
      
      const newChat = await base44.entities.Chat.create({
        uid: user.id,
        title: 'New Chat',
        toneMode: user.preferredTone || 'zen',
        isActive: false
      });

      console.log('[AICompanion] Chat created successfully:', newChat);
      console.log('[AICompanion] Chat ID:', newChat?.id);
      
      if (!newChat || !newChat.id) {
        throw new Error('Chat was created but has no ID');
      }

      trackEvent(AnalyticsEvents.AI_AGENT_VIEW);

      // Add the new chat to the list immediately (optimistic update)
      setChats(prevChats => [newChat, ...prevChats]);

      console.log('[AICompanion] Navigating to chat:', newChat.id);

      // Navigate to the new chat
      navigate(createPageUrl('AIChatView') + `?chatId=${newChat.id}`, {
        state: { initialChat: newChat }
      });
    } catch (error) {
      console.error('[AICompanion] Error creating chat:', error);
      console.error('[AICompanion] Error message:', error?.message);
      console.error('[AICompanion] Error stack:', error?.stack);
      toast.error('Failed to create new chat: ' + (error.message || 'Unknown error'));
      setCreating(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      // Delete all messages in the chat first
      const messages = await base44.entities.Message.filter({ chatId }, 'created_date', 1000);
      for (const message of messages) {
        await base44.entities.Message.delete(message.id);
      }

      // Delete the chat
      await base44.entities.Chat.delete(chatId);

      // Refresh the chat list
      setChats(prevChats => prevChats.filter(c => c.id !== chatId));
      toast.success('Chat deleted');
    } catch (error) {
      console.error('[AICompanion] Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#25A55F] border-t-transparent" />
      </div>
    );
  }

  // Placeholder for AgeGate - uncomment and implement if AgeGate component and handleAgeConfirmed function are provided
  // if (showAgeGate) {
  //   return <AgeGate user={user} onConfirm={handleAgeConfirmed} />;
  // }

  // Show preview/info page for non-premium users
  if (user && !user.isPremium) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <OnboardingTooltip
          pageName="AICompanion"
          title="💬 AI Companion"
          description="Chat with your personal cannabis buddy who knows your patterns, provides guidance, and helps you stay mindful. Try the demo conversation below!"
        />

        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <MessageCircle className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Premium Feature</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">AI Companion</h1>
          <p className="text-gray-400 mb-8">Your personal cannabis guide and mindful companion</p>

          {/* Demo Conversation */}
          <div className="bg-[#141416] border border-[#25A55F]/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#25A55F]" />
              <h3 className="text-white font-semibold">Try Demo Conversation</h3>
            </div>
            <Button
              onClick={() => setShowDemo(!showDemo)}
              variant="outline"
              className="w-full border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {showDemo ? 'Hide Demo' : 'Show Demo'}
            </Button>
            
            {showDemo && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#0A0A0B] border border-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-white">Hey buddy, I just logged a 15mg vape session. What should I expect?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#25A55F]/10 border border-[#25A55F]/30 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-gray-200">
                      Hey! Nice, 15mg via vape is a solid moderate dose. You're looking at peak effects in about 15-20 minutes - that's when you'll feel it strongest, probably hitting around Buzz 4-5 based on your medium tolerance. 
                      <br/><br/>
                      Effects should last about 2-3 hours total. Stay hydrated, find a comfy spot, and enjoy the ride! 🌿✨
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#0A0A0B] border border-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-white">Should I take a tolerance break soon?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#25A55F]/10 border border-[#25A55F]/30 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-gray-200">
                      Looking at your recent pattern, you've been pretty consistent at around 12-15mg most days this week. If you're still getting good effects, you're fine to keep going! 
                      <br/><br/>
                      But if you notice you need more to feel the same, or effects are getting weaker, yeah - a 2-3 day break would reset your system nicely. Your tolerance would drop noticeably, and you'd save some green too. 💚
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg mt-4">
                  <p className="text-xs text-blue-200 text-center">
                    <strong>This is a demo.</strong> Upgrade to Premium for real-time, personalized AI guidance based on your actual sessions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feature Preview */}
          <div className="space-y-6">
            <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">What is AI Companion?</h3>
                  <p className="text-gray-400 text-sm">Your personal cannabis wellness assistant</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Chat with an AI companion that understands your consumption patterns, provides personalized insights, 
                and helps you make informed decisions about your cannabis use. Get real-time guidance tailored to your current state.
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
                    <p className="text-white font-medium">Personalized Tone</p>
                    <p className="text-gray-400 text-sm">Choose from Zen, Rick, Lo-fi, Clinical, or Dude personalities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Context-Aware Responses</p>
                    <p className="text-gray-400 text-sm">AI knows your current buzz level, tolerance, and session history</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Multiple Chat Threads</p>
                    <p className="text-gray-400 text-sm">Organize conversations by topic or session</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Harm Reduction Guidance</p>
                    <p className="text-gray-400 text-sm">Get science-backed advice for safer consumption</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#25A55F]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#25A55F]">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">24/7 Availability</p>
                    <p className="text-gray-400 text-sm">Chat anytime you need guidance or just want to talk</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Preview */}
            <div className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-2xl p-8 text-center soft-shadow">
              <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 mb-6">
                "Hey buddy, just logged a session. What should I expect?" 
                <br />
                <span className="text-purple-400 italic mt-2 block">
                  → Get personalized responses based on your current state
                </span>
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
        
      </div>
    );
  }

  // Premium user - show full AI Companion functionality
  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <OnboardingTooltip
        pageName="AICompanion_Premium"
        title="💬 AI Companion"
        description="Your cannabis buddy is here to help! Ask about your current buzz, get dosing advice, or just chat about your session. Always consume responsibly and never drive while elevated."
      />

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Premium Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-4">
          <Sparkles className="w-4 h-4 text-[#25A55F]" />
          <span className="text-sm font-medium text-[#25A55F]">Premium Feature</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">AI Companion</h1>
        <p className="text-gray-400 mb-6">Your personal cannabis tracking buddy</p>

        <Button
          onClick={handleCreateChat}
          disabled={creating}
          className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white py-6 text-lg font-semibold mb-6 rounded-xl"
        >
          {creating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              New Chat
            </>
          )}
        </Button>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#141416] rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No chats yet</h3>
            <p className="text-gray-400 text-center">Start a conversation with your AI Buddy</p>
          </div>
        ) : (
          <AIChatList chats={chats} onDeleteChat={handleDeleteChat} />
        )}
      </div>
      
    </div>
  );
}