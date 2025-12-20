import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Share2, Download, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareableStatsCard from './ShareableStatsCard';
import { logger } from '@/components/utils/logger';

export default function ShareStatsModal({ isOpen, onClose, stats, sessions, badges }) {
  const [timePeriod, setTimePeriod] = useState('week');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [vibeTagline, setVibeTagline] = useState(null);
  const [user, setUser] = useState(null);
  const [cardReady, setCardReady] = useState(false);

  // Load user for vibe tagline generation
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        logger.error('[ShareStatsModal] Error loading user:', error);
      }
    };
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  // Generate or get cached vibe tagline
  useEffect(() => {
    const getVibeTagline = async () => {
      if (!isOpen || !stats || !sessions || !user) return;

      try {
        // Determine session count for the selected time period
        const sessionCount = timePeriod === 'today' ? stats.sessionsToday :
                           timePeriod === 'week' ? stats.sessions7d :
                           stats.sessions30d;

        // If no sessions in this period, use a mindful tagline
        if (sessionCount === 0) {
          const zeroSessionTaglines = [
            "Clean slate - mindful and present 🧘",
            "Taking a break, staying grounded 🌱",
            "Rest day - balance is key 🌿",
            "Choosing clarity today ✨",
            "Sober and centered 🎯"
          ];
          const randomTagline = zeroSessionTaglines[Math.floor(Math.random() * zeroSessionTaglines.length)];
          setVibeTagline(randomTagline);
          return;
        }

        // Check if we have a cached tagline (stored in user data, expires after 3 hours)
        const cacheKey = `vibeTagline_${timePeriod}`;
        const cachedData = user?.[cacheKey];
        const cacheTimestamp = user?.[`${cacheKey}_timestamp`];
        
        if (cachedData && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < 3 * 60 * 60 * 1000) { // 3 hours
            logger.debug('[ShareStatsModal] Using cached vibe tagline');
            setVibeTagline(cachedData);
            return;
          }
        }

        // Generate new tagline only if there are sessions
        logger.debug('[ShareStatsModal] Generating vibe tagline');
        
        const prompt = `Create a short, fun vibe tagline (max 10 words) for a cannabis user's stats card.

Stats:
- Avg Buzz: ${stats.avgPeakBuzz}/10
- Peak THC: ${Math.max(...sessions.map(s => s.dosageMg || 0), 0)}mg
- Most Used Method: ${stats.mostCommonMethod}
- Sessions: ${sessionCount} this ${timePeriod === 'today' ? 'day' : timePeriod === 'week' ? 'week' : 'month'}

Make it light, mindful, and positive. Examples:
- Balanced and creative, perfect for a sunset sesh 🌅
- Smooth operator, keeping it chill and consistent 😌
- Riding the wave, staying present and aware 🌊

Return only the tagline WITHOUT quotes, nothing else.`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: prompt
        });

        const tagline = response?.trim() || null;
        
        if (tagline) {
          // Cache the tagline
          try {
            await base44.auth.updateMe({
              [cacheKey]: tagline,
              [`${cacheKey}_timestamp`]: Date.now().toString()
            });
          } catch (cacheError) {
            logger.warn('[ShareStatsModal] Failed to cache tagline:', cacheError);
          }
          
          setVibeTagline(tagline);
        }
      } catch (error) {
        logger.error('[ShareStatsModal] Error generating vibe tagline:', error);
        // Fallback to a generic tagline
        setVibeTagline("Tracking your journey, one session at a time 🌿");
      }
    };

    getVibeTagline();
  }, [isOpen, stats, sessions, timePeriod, user]);

  // Wait for card to be ready before allowing generation
  useEffect(() => {
    if (isOpen && vibeTagline) {
      // Give the component time to fully render
      const timer = setTimeout(() => {
        setCardReady(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCardReady(false);
    }
  }, [isOpen, vibeTagline]);

  const handleGenerateImage = async () => {
    if (!cardReady) {
      toast.error('Please wait for the card to load');
      return;
    }

    setGenerating(true);
    setImageUrl(null);
    
    try {
      logger.debug('[ShareStatsModal] Starting component-to-image generation');

      // Wait for the component to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the component as an image
      const element = document.getElementById('shareable-stats-card');
      if (!element) {
        logger.error('[ShareStatsModal] Could not find stats card element');
        toast.error('Failed to generate image - card not found');
        setGenerating(false);
        return;
      }

      logger.debug('[ShareStatsModal] Found element, capturing with html2canvas');
      logger.debug('[ShareStatsModal] Element dimensions:', element.offsetWidth, 'x', element.offsetHeight);

      const canvas = await html2canvas(element, {
        backgroundColor: '#0A0A0B',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1920
      });

      logger.debug('[ShareStatsModal] Canvas generated, converting to blob');

      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      
      // Create File from blob
      const file = new File([blob], 'session-buddy-stats.png', { type: 'image/png' });

      logger.debug('[ShareStatsModal] Uploading image to storage');

      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      logger.debug('[ShareStatsModal] Image uploaded successfully:', file_url);

      setImageUrl(file_url);
      toast.success('Stats card generated!');

    } catch (error) {
      logger.error('[ShareStatsModal] Error generating image:', error);
      toast.error('Failed to generate stats card');
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
      a.download = 'session-buddy-stats.png';
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
        const file = new File([blob], 'session-buddy-stats.png', { type: 'image/png' });

        await navigator.share({
          title: 'Session Buddy - My Stats',
          text: `My consumption stats from Session Buddy 🌿`,
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

  // Reset image when settings change
  const handleSettingChange = (setter) => (value) => {
    setter(value);
    setImageUrl(null);
    setCardReady(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Share2 className="w-5 h-5 text-[#25A55F]" />
              Share Your Stats
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {/* Time Period Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-300">Time Period</Label>
              <RadioGroup value={timePeriod} onValueChange={handleSettingChange(setTimePeriod)}>
                <div 
                  onClick={() => handleSettingChange(setTimePeriod)('today')}
                  className={`flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer ${
                    timePeriod === 'today' ? 'bg-[#25A55F]/20 border border-[#25A55F]/50' : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <RadioGroupItem value="today" id="today" />
                  <Label htmlFor="today" className="text-sm text-gray-300 cursor-pointer flex-1">
                    Today
                  </Label>
                  {timePeriod === 'today' && <Check className="w-4 h-4 text-[#25A55F]" />}
                </div>
                <div 
                  onClick={() => handleSettingChange(setTimePeriod)('week')}
                  className={`flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer ${
                    timePeriod === 'week' ? 'bg-[#25A55F]/20 border border-[#25A55F]/50' : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <RadioGroupItem value="week" id="week" />
                  <Label htmlFor="week" className="text-sm text-gray-300 cursor-pointer flex-1">
                    This Week (Last 7 Days)
                  </Label>
                  {timePeriod === 'week' && <Check className="w-4 h-4 text-[#25A55F]" />}
                </div>
                <div 
                  onClick={() => handleSettingChange(setTimePeriod)('month')}
                  className={`flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer ${
                    timePeriod === 'month' ? 'bg-[#25A55F]/20 border border-[#25A55F]/50' : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month" className="text-sm text-gray-300 cursor-pointer flex-1">
                    This Month (Last 30 Days)
                  </Label>
                  {timePeriod === 'month' && <Check className="w-4 h-4 text-[#25A55F]" />}
                </div>
              </RadioGroup>
            </div>

            {/* Generate or Preview */}
            {!imageUrl && !generating && cardReady && (
              <Button
                onClick={handleGenerateImage}
                className="w-full bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                Generate Stats Card
              </Button>
            )}

            {!cardReady && !generating && !imageUrl && vibeTagline && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 text-[#25A55F] animate-spin mr-2" />
                <span className="ml-3 text-gray-400">Preparing your card...</span>
              </div>
            )}

            {generating && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#25A55F] animate-spin" />
                <span className="ml-3 text-gray-400">Generating your stats card...</span>
              </div>
            )}

            {imageUrl && (
              <div className="space-y-4">
                <div className="border-2 border-gray-800 rounded-xl overflow-hidden">
                  <img src={imageUrl} alt="Stats Card" className="w-full" />
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

      {/* Hidden stats card for rendering */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}>
        {isOpen && vibeTagline && (
          <ShareableStatsCard
            stats={stats}
            sessions={sessions}
            badges={badges}
            isAnonymous={false}
            timePeriod={timePeriod}
            vibeTagline={vibeTagline}
          />
        )}
      </div>
    </>
  );
}