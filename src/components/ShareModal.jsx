
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Loader2, Check, Zap, Flame, TrendingUp, Clock, Layers, Droplets } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getBuzzCategory } from '@/components/utils/buzzCalculator';
import { getMethodDisplay } from '@/components/utils/methodLabels';
import { toast } from 'sonner';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  session, 
  peakBuzz, 
  maxActiveTHC, 
  totalThc,
  soberTime,
  windowDurationMinutes,
  totalDuration,
  sessionCount 
}) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-generate share link when modal opens - MUST BE BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (isOpen && !shareUrl && !generating && session && peakBuzz !== undefined && peakBuzz !== null && maxActiveTHC !== undefined && maxActiveTHC !== null) {
      handleGenerateShare();
    }
  }, [isOpen, session, peakBuzz, maxActiveTHC]);

  const handleGenerateShare = async () => {
    setGenerating(true);
    try {
      const { data } = await base44.functions.invoke('createSessionShare', {
        sessionId: session.id,
        peakBuzz,
        maxActiveTHC,
        totalThc: totalThc || maxActiveTHC,
        soberTime,
        isAnonymous,
        isWindow: session.isWindow || sessionCount > 1,
        sessionCount: sessionCount || 1,
        windowDurationMinutes,
        sessions: session.sessions || []
      });

      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Error generating share:', error);
      toast.error('Failed to create share link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const isWindow = session.isWindow || sessionCount > 1;
    
    // Check if we're in an iframe or if share is not available
    const isInIframe = window.self !== window.top;
    const canShare = navigator.share && !isInIframe;
    
    if (canShare) {
      try {
        await navigator.share({
          title: 'Session Buddy - My Consumption Window',
          text: `Peak Buzz ${peakBuzz.toFixed(1)}/10 🔥 | ${(totalThc || maxActiveTHC).toFixed(1)}mg THC${isWindow ? ` | ${sessionCount} doses` : ''}`,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // If user cancels, error.name will be 'AbortError'
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy
          handleCopyLink();
        }
      }
    } else {
      // If in iframe or share not available, just copy
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    const isWindow = session.isWindow || sessionCount > 1;
    const text = isWindow
      ? `Peak Buzz ${peakBuzz.toFixed(1)}/10 🔥\n${(totalThc || maxActiveTHC).toFixed(1)}mg Total THC\n${sessionCount} doses in ${getDurationText(windowDurationMinutes)}\n\nTracking with Session Buddy 🌿`
      : `Peak Buzz ${peakBuzz.toFixed(1)}/10 🔥\n${maxActiveTHC.toFixed(1)}mg Blood THC\n${getMethodDisplay(session.method, false)} | ${session.strain}\n\nTracking with Session Buddy 🌿`;
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const getDurationText = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getTotalDurationText = () => {
    return getDurationText(totalDuration || 0);
  };

  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

  // Validation after hooks
  if (!session || peakBuzz === undefined || peakBuzz === null || maxActiveTHC === undefined || maxActiveTHC === null) {
    console.error('ShareModal: Missing required props', { 
      session: !!session, 
      peakBuzz, 
      maxActiveTHC 
    });
    return null;
  }

  const buzzLevel = getBuzzCategory(peakBuzz);
  const isWindow = session.isWindow || sessionCount > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Share2 className="w-5 h-5 text-[#25A55F]" />
            {isWindow ? 'Share Consumption Window' : 'Share Session'}
          </DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div className="bg-gradient-to-br from-[#0A0A0B] to-[#141416] border border-[#25A55F]/30 rounded-2xl p-6 my-4">
          <div className="flex items-center justify-between mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
              alt="Session Buddy"
              className="w-12 h-12"
            />
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Peak Buzz</div>
              <div className={`text-4xl font-bold ${buzzLevel.color}`}>
                {peakBuzz.toFixed(1)}<span className="text-xl text-gray-500">/10</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {isWindow && (
              <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Consumption Window</span>
                </div>
                <span className="text-lg font-bold text-white">{sessionCount} doses</span>
              </div>
            )}

            <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-gray-400">{isWindow ? 'Total THC' : 'Dosage'}</span>
              </div>
              <span className="text-lg font-bold text-white">{(totalThc || maxActiveTHC).toFixed(1)}mg</span>
            </div>

            <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Peak Blood THC</span>
              </div>
              <span className="text-lg font-bold text-white">{maxActiveTHC.toFixed(1)}mg</span>
            </div>

            {!isWindow && (
              <>
                <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#25A55F]" />
                    <span className="text-sm text-gray-400">Method</span>
                  </div>
                  <span className="text-lg font-bold text-white capitalize">{getMethodDisplay(session.method, false)}</span>
                </div>

                <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Strain</span>
                  </div>
                  <span className="text-lg font-bold text-white">{session.strain}</span>
                </div>
              </>
            )}

            <div className="bg-[#0A0A0B]/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">{isWindow ? 'Window Duration' : 'Duration'}</span>
              </div>
              <span className="text-lg font-bold text-white">{getTotalDurationText()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">Track your vibe. Stay mindful. Enjoy the ride.</p>
            <p className="text-xs text-[#25A55F] font-semibold mt-1">session-buddy.app</p>
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
          <Label htmlFor="anonymous" className="text-sm text-gray-300 cursor-pointer">
            Share anonymously (hide my name)
          </Label>
        </div>

        {/* Actions */}
        {generating ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-[#25A55F] animate-spin" />
            <span className="ml-2 text-gray-400">Generating share link...</span>
          </div>
        ) : shareUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                onClick={handleShare}
                className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <Button
              onClick={handleTwitterShare}
              variant="outline"
              className="w-full border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Share on 𝕏 / Twitter
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
