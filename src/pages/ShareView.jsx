import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Flame, Layers, Droplets, ArrowRight, Trophy } from 'lucide-react';
import { getBuzzCategory } from '@/components/utils/buzzCalculator';
import { motion } from 'framer-motion';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';
import { logger } from '@/components/utils/logger';

export default function ShareView() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadShare = async () => {
      try {
        logger.debug('[ShareView] Starting to load share with ID:', shareId);
        
        if (!shareId) {
          logger.error('[ShareView] No shareId provided');
          setError('Invalid share link');
          setLoading(false);
          return;
        }

        // Try multiple approaches to fetch the share
        let shareData = null;
        
        // Approach 1: Try with asServiceRole
        try {
          logger.debug('[ShareView] Attempting fetch with asServiceRole...');
          if (base44?.asServiceRole?.entities?.Share) {
            const shares = await base44.asServiceRole.entities.Share.filter({ shareId });
            if (shares && shares.length > 0) {
              shareData = shares[0];
              logger.debug('[ShareView] Share found with asServiceRole');
            }
          } else {
            logger.warn('[ShareView] asServiceRole not available for fetch attempt 1');
          }
        } catch (serviceRoleError) {
          logger.debug('[ShareView] asServiceRole fetch failed:', serviceRoleError.message);
        }

        // Approach 2: Try with regular entities (will work if user is logged in)
        if (!shareData) {
          try {
            logger.debug('[ShareView] Attempting fetch with regular entities...');
            if (base44?.entities?.Share) {
              const shares = await base44.entities.Share.filter({ shareId });
              if (shares && shares.length > 0) {
                shareData = shares[0];
                logger.debug('[ShareView] Share found with regular entities');
              }
            } else {
              logger.warn('[ShareView] Regular entities not available for fetch attempt 2');
            }
          } catch (regularError) {
            logger.debug('[ShareView] Regular entities fetch failed:', regularError.message);
          }
        }

        // Approach 3: Try list and filter client-side (last resort)
        if (!shareData) {
          try {
            logger.debug('[ShareView] Attempting list and filter approach...');
            if (base44?.asServiceRole?.entities?.Share) {
              const allShares = await base44.asServiceRole.entities.Share.list('-created_date', 100); // Fetch recent shares
              shareData = allShares.find(s => s.shareId === shareId);
              if (shareData) {
                logger.debug('[ShareView] Share found via list and filter');
              }
            } else {
              logger.warn('[ShareView] asServiceRole not available for fetch attempt 3');
            }
          } catch (listError) {
            logger.debug('[ShareView] List approach failed:', listError.message);
          }
        }

        if (!shareData) {
          logger.error('[ShareView] No share found with ID:', shareId);
          setError('Share not found - link may be invalid or expired');
          setLoading(false);
          return;
        }

        logger.debug('[ShareView] Share data loaded successfully:', {
          id: shareData.id,
          shareId: shareData.shareId,
          method: shareData.method,
          sessionId: shareData.sessionId,
          buzzScore: shareData.buzzScore,
          activeTHC: shareData.activeTHC,
          isAnonymous: shareData.isAnonymous,
          imageUrl: shareData.imageUrl ? 'present' : 'missing'
        });
        
        setShare(shareData);
        setLoading(false);
      } catch (err) {
        logger.error('[ShareView] Error loading share:', err);
        logger.debug('[ShareView] Error details:', {
          message: err.message,
          stack: err.stack
        });
        setError(`Failed to load share: ${err.message}`);
        setLoading(false);
      }
    };

    loadShare();
  }, [shareId]);

  logger.debug('[ShareView] Render state:', { loading, error, hasShare: !!share });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#25A55F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#141416] rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Share Not Found</h1>
          <p className="text-gray-400 mb-2">{error || 'This share link may have expired or been removed.'}</p>
          <p className="text-gray-500 text-sm mb-8">Share ID: {shareId || 'unknown'}</p>
          <Button
            onClick={() => window.location.href = 'https://session-buddy-8ec261d8.base44.app'}
            className="bg-[#25A55F] hover:bg-[#1e8a4c]"
          >
            Try Session Buddy
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Check if this is a badge share
  const isBadgeShare = share.method === 'badge';
  const badgeId = isBadgeShare ? share.sessionId : null;
  const badge = badgeId ? BADGE_DEFINITIONS[badgeId] : null;

  // If it's a badge share, render the badge image
  if (isBadgeShare) {
    logger.debug('[ShareView] Rendering badge share:', { badgeId, hasBadgeDef: !!badge, hasImageUrl: !!share.imageUrl });
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] flex items-center justify-center p-6">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          {share.imageUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src={share.imageUrl} 
                alt={badge ? `${badge.name} achievement` : 'Badge achievement'}
                className="w-full h-auto rounded-3xl shadow-2xl border border-gray-800"
                onError={(e) => {
                  logger.error('[ShareView] Failed to load badge image:', share.imageUrl);
                  e.target.style.display = 'none';
                  setError('Badge image failed to load');
                }}
                onLoad={() => logger.debug('[ShareView] Badge image loaded successfully')}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
              >
                <Button
                  onClick={() => window.location.href = 'https://session-buddy-8ec261d8.base44.app'}
                  className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
                >
                  <Trophy className="mr-2 w-5 h-5" />
                  Start Earning Badges
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-gray-400 text-sm mt-4">
                  Track your sessions, unlock achievements, and share your journey
                </p>
                <p className="text-gray-600 text-xs mt-2">session-buddy.app</p>
              </motion.div>
            </motion.div>
          ) : badge ? (
            // Fallback if imageUrl is missing but we have badge definition
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-gray-800 rounded-3xl p-12 text-center"
            >
              <div className="text-8xl mb-6">{badge.emoji}</div>
              <h2 className="text-3xl font-bold text-white mb-3">{badge.name}</h2>
              <p className="text-gray-400 text-lg mb-8">{badge.description}</p>
              <Button
                onClick={() => window.location.href = 'https://session-buddy-8ec261d8.base44.app'}
                className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
              >
                <Trophy className="mr-2 w-4 h-4" />
                Earn This Badge
              </Button>
            </motion.div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Badge share unavailable</p>
              <Button
                onClick={() => window.location.href = 'https://session-buddy-8ec261d8.base44.app'}
                className="bg-[#25A55F] hover:bg-[#1e8a4c]"
              >
                Try Session Buddy
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular session/stats share view
  const buzzLevel = getBuzzCategory(share.buzzScore || 0);
  
  // Parse vibeText to extract session count
  let sessionCount = 1;
  const countMatch = share.vibeText?.match(/(\d+)\s+doses?/i);
  if (countMatch) {
    sessionCount = parseInt(countMatch[1]);
  }
  const isWindow = sessionCount > 1;

  logger.debug('[ShareView] Rendering share view with data:', {
    buzzScore: share.buzzScore,
    activeTHC: share.activeTHC,
    sessionCount,
    isWindow
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0B] via-[#0D1410] to-[#0A0A0B] text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e77f1fff1fec8a8ec261d8/a188a78e3_IMG_7818.png"
            alt="Session Buddy"
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-400">
            {share.isAnonymous ? 'Someone' : 'A Session Buddy User'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isWindow ? 'shared their consumption window' : 'shared their session'}
          </p>
        </motion.div>

        {/* Main Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#141416] to-[#0A0A0B] border border-[#25A55F]/30 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden"
        >
          <div className={`absolute inset-0 ${buzzLevel.bg} opacity-5 rounded-3xl`} />
          
          <div className="relative z-10">
            {/* Peak Buzz */}
            <div className="text-center mb-8">
              <div className="text-gray-400 text-sm mb-2">Peak Buzz</div>
              <div className={`text-7xl font-bold ${buzzLevel.color} mb-2`}>
                {share.buzzScore?.toFixed(1) || '0.0'}
                <span className="text-3xl text-gray-500">/10</span>
              </div>
              <div className={`text-xl font-semibold ${buzzLevel.color}`}>
                {buzzLevel.label}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-4">
              {isWindow && (
                <div className="bg-[#0A0A0B]/50 rounded-xl p-4 flex items-center justify-between border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-gray-400">Consumption Window</span>
                  </div>
                  <span className="text-xl font-bold text-white">{sessionCount} doses</span>
                </div>
              )}

              <div className="bg-[#0A0A0B]/50 rounded-xl p-4 flex items-center justify-between border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-gray-400">Total THC</span>
                </div>
                <span className="text-xl font-bold text-white">{share.activeTHC?.toFixed(1) || '0'}mg</span>
              </div>

              <div className="bg-[#0A0A0B]/50 rounded-xl p-4 flex items-center justify-between border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-400">Peak Blood THC</span>
                </div>
                <span className="text-xl font-bold text-white">{share.activeTHC?.toFixed(1) || '0'}mg</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500 mb-2">Track your vibe. Stay mindful. Enjoy the ride.</p>
              <p className="text-sm text-[#25A55F] font-semibold">session-buddy.app</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={() => window.location.href = 'https://session-buddy-8ec261d8.base44.app'}
            className="bg-[#25A55F] hover:bg-[#1e8a4c] text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
          >
            Try Session Buddy Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            Track your consumption, monitor buzz levels, and stay in control
          </p>
        </motion.div>
      </div>
    </div>
  );
}