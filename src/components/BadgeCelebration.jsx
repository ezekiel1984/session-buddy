import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Share2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareableBadgeCard from '@/components/ShareableBadgeCard';

export default function BadgeCelebration({ badgeIds, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [cardReady, setCardReady] = useState(false);

  const currentBadgeId = badgeIds[currentIndex];
  const badge = BADGE_DEFINITIONS[currentBadgeId];
  const hasMore = currentIndex < badgeIds.length - 1;

  // Wait for card to be ready before allowing sharing
  useEffect(() => {
    if (badge) {
      // Reset card ready state when badge changes
      setCardReady(false);
      setImageUrl(null);
      
      // Give the component time to fully render
      const timer = setTimeout(() => {
        setCardReady(true);
      }, 500);
      
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#25A55F', '#1e8a4c', '#ffffff']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#25A55F', '#1e8a4c', '#ffffff']
        });
      }, 250);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [badge, currentBadgeId]);

  const handleShare = async () => {
    if (!cardReady) {
      toast.error('Please wait for the card to load');
      return;
    }

    setSharing(true);
    try {
      console.log('[BadgeCelebration] Starting badge share generation');

      // Wait for component to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the badge card
      const element = document.getElementById('shareable-badge-card');
      if (!element) {
        console.error('[BadgeCelebration] Badge card element not found');
        toast.error('Failed to generate image');
        setSharing(false);
        return;
      }

      console.log('[BadgeCelebration] Capturing badge card with html2canvas');

      const canvas = await html2canvas(element, {
        backgroundColor: '#0A0A0B',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080
      });

      console.log('[BadgeCelebration] Converting to blob');

      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      const file = new File([blob], 'session-buddy-badge.png', { type: 'image/png' });

      console.log('[BadgeCelebration] Uploading image');

      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      console.log('[BadgeCelebration] Image uploaded:', file_url);
      setImageUrl(file_url);

      console.log('[BadgeCelebration] Creating share record');

      // Get current user
      const user = await base44.auth.me();

      // Create share record
      const shareId = crypto.randomUUID().split('-')[0];
      const shareData = {
        uid: user.id,
        shareId,
        imageUrl: file_url,
        isAnonymous: true,
        buzzScore: 10,
        activeTHC: 0,
        method: 'badge',
        vibeText: badge.name,
        sessionId: currentBadgeId
      };

      console.log('[BadgeCelebration] Creating share with data:', shareData);

      await base44.entities.Share.create(shareData);

      const shareUrl = `${window.location.origin}/share/${shareId}`;

      console.log('[BadgeCelebration] Share created:', shareUrl);

      // Check if we can use native share
      const isInIframe = window.self !== window.top;
      const canShare = navigator.share && !isInIframe;

      if (canShare) {
        try {
          // Try sharing with the image file
          const response = await fetch(file_url);
          const imageBlob = await response.blob();
          const imageFile = new File([imageBlob], 'session-buddy-badge.png', { type: 'image/png' });

          await navigator.share({
            title: `${badge.name} - Session Buddy`,
            text: `I just earned the ${badge.name} badge! ${badge.description}`,
            files: [imageFile]
          });
          
          toast.success('Badge shared! 🎉');
        } catch (shareError) {
          if (shareError?.name !== 'AbortError') {
            // Fallback to URL only
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard! 🎉');
          }
        }
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard! 🎉');
      }
    } catch (error) {
      console.error('[BadgeCelebration] Share error:', error);
      toast.error(`Failed to create share: ${error.message || 'Unknown error'}`);
    } finally {
      setSharing(false);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  if (!badge) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-[#141416] border border-[#25A55F] rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute inset-0 bg-[#25A55F]/5 blur-3xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25A55F]/10 border border-[#25A55F]/20 mb-6"
              >
                <Sparkles className="w-4 h-4 text-[#25A55F]" />
                <span className="text-sm font-medium text-[#25A55F]">New Badge!</span>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-8xl mb-6"
              >
                {badge.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-bold text-white mb-3"
              >
                {badge.name}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-gray-400 mb-8"
              >
                {badge.description}
              </motion.p>

              {badgeIds.length > 1 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-gray-500 mb-6"
                >
                  Badge {currentIndex + 1} of {badgeIds.length}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex gap-3"
              >
                <Button
                  onClick={handleShare}
                  disabled={sharing || !cardReady}
                  variant="outline"
                  className="flex-1 border-[#25A55F] text-[#25A55F] hover:bg-[#25A55F]/10"
                >
                  {sharing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : !cardReady ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
                >
                  {hasMore ? 'Next Badge' : 'Awesome!'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Hidden badge card for rendering */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}>
        <ShareableBadgeCard badgeId={currentBadgeId} />
      </div>
    </>
  );
}