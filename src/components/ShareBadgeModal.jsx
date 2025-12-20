import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareableBadgeCard from './ShareableBadgeCard';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';
import { logger } from '@/components/utils/logger';

export default function ShareBadgeModal({ isOpen, onClose, badgeId }) {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [cardReady, setCardReady] = useState(false);

  const badge = BADGE_DEFINITIONS[badgeId];

  // Wait for card to be ready before allowing generation
  useEffect(() => {
    if (isOpen && badge) {
      // Give the component time to fully render
      const timer = setTimeout(() => {
        setCardReady(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCardReady(false);
      setImageUrl(null);
    }
  }, [isOpen, badge]);

  const handleGenerateImage = async () => {
    if (!cardReady) {
      toast.error('Please wait for the card to load');
      return;
    }

    setGenerating(true);
    setImageUrl(null);
    
    try {
      logger.debug('[ShareBadgeModal] Starting badge image generation');

      // Wait for the component to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the component as an image
      const element = document.getElementById('shareable-badge-card');
      if (!element) {
        logger.error('[ShareBadgeModal] Could not find badge card element');
        toast.error('Failed to generate image - card not found');
        setGenerating(false);
        return;
      }

      logger.debug('[ShareBadgeModal] Found element, capturing with html2canvas');

      const canvas = await html2canvas(element, {
        backgroundColor: '#0A0A0B',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080 // Changed height from 1920 to 1080
      });

      logger.debug('[ShareBadgeModal] Canvas generated, converting to blob');

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      
      // Create File from blob
      const file = new File([blob], 'session-buddy-badge.png', { type: 'image/png' });

      logger.debug('[ShareBadgeModal] Uploading image to storage');

      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      logger.debug('[ShareBadgeModal] Image uploaded successfully:', file_url);

      setImageUrl(file_url);
      toast.success('Badge card generated!');

    } catch (error) {
      logger.error('[ShareBadgeModal] Error generating image:', error);
      toast.error('Failed to generate badge card');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-buddy-${badgeId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded!');
    } catch (error) {
      logger.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    // Check if we're in an iframe or if share is blocked
    const isInIframe = window.self !== window.top;
    const canShare = navigator.share && !isInIframe;

    if (canShare) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'session-buddy-badge.png', { type: 'image/png' });

        await navigator.share({
          title: `${badge.name} - Session Buddy`,
          text: `I just earned the ${badge.name} badge! ${badge.description}`,
          files: [file]
        });
        
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          logger.error('Error sharing:', error);
          // Fall back to download
          handleDownload();
        }
      }
    } else {
      // Fallback: download the image
      handleDownload();
      toast.success('Image downloaded! Upload to your social media.');
    }
  };

  if (!badge) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Share2 className="w-5 h-5 text-[#25A55F]" />
              Share Your Badge
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4">
            <div className="text-center">
              <div className="text-6xl mb-4">{badge.emoji}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{badge.name}</h3>
              <p className="text-gray-400">{badge.description}</p>
            </div>

            {/* Generate or Preview */}
            {!imageUrl && !generating && cardReady && (
              <Button
                onClick={handleGenerateImage}
                className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                Generate Badge Card
              </Button>
            )}

            {!cardReady && !generating && !imageUrl && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 text-[#25A55F] animate-spin mr-2" />
                <span className="ml-3 text-gray-400">Preparing your card...</span>
              </div>
            )}

            {generating && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#25A55F] animate-spin" />
                <span className="ml-3 text-gray-400">Generating your badge card...</span>
              </div>
            )}

            {imageUrl && (
              <div className="space-y-4">
                <div className="border-2 border-gray-800 rounded-xl overflow-hidden">
                  <img src={imageUrl} alt="Badge Card" className="w-full" />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1 border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={handleShare}
                    className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Tip: Share directly or download and post to your socials
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden badge card for rendering */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}>
        {isOpen && (
          <ShareableBadgeCard badgeId={badgeId} />
        )}
      </div>
    </>
  );
}