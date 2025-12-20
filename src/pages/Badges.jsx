import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Share2 } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/components/utils/badgeChecker';
import BadgeCard from '@/components/BadgeCard';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';
import ShareBadgeModal from '@/components/ShareBadgeModal';

export default function Badges() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // PREMIUM CHECK - Redirect if not premium
        if (!currentUser?.isPremium) {
          navigate(createPageUrl('Premium'));
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Badge.filter({ uid: user.id });
    },
    enabled: !!user?.id,
  });

  const handleShareBadge = (badgeId) => {
    setSelectedBadgeId(badgeId);
    setShowShareModal(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Additional check in case navigation didn't work
  if (!user?.isPremium) {
    return null; // Will redirect via useEffect
  }

  const earnedBadgeIds = earnedBadges.map(b => b.badgeId);
  
  const freeBadges = Object.values(BADGE_DEFINITIONS).filter(b => !b.premium);
  const premiumBadges = Object.values(BADGE_DEFINITIONS).filter(b => b.premium);

  const unlockedFree = freeBadges.filter(b => earnedBadgeIds.includes(b.id));
  const lockedFree = freeBadges.filter(b => !earnedBadgeIds.includes(b.id));
  const unlockedPremium = premiumBadges.filter(b => earnedBadgeIds.includes(b.id));
  const lockedPremium = premiumBadges.filter(b => !earnedBadgeIds.includes(b.id));

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0B] pb-24">
        <div className="max-w-lg mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('Insights'))}
              className="text-gray-400 hover:text-white hover:bg-gray-800 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <Trophy className="w-7 h-7 text-[#25A55F]" />
                <h1 className="text-2xl font-bold text-white">Badges Earned</h1>
              </div>
              <p className="text-sm text-gray-400">
                {earnedBadgeIds.length}/{Object.keys(BADGE_DEFINITIONS).length} unlocked
              </p>
            </div>
          </div>

          {/* Unlocked Badges */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">Unlocked</h2>
            {unlockedFree.length === 0 && unlockedPremium.length === 0 ? (
              <div className="text-center py-16 bg-[#141416] rounded-2xl border border-gray-800">
                <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No badges unlocked yet</p>
                <p className="text-gray-500 text-sm mt-2">Keep logging sessions to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {unlockedFree.map(badge => (
                  <div key={badge.id} className="relative">
                    <BadgeCard badgeId={badge.id} locked={false} />
                    <Button
                      onClick={() => handleShareBadge(badge.id)}
                      size="sm"
                      className="absolute top-4 right-4 bg-[#25A55F] hover:bg-[#1e8a4c] text-white h-8 px-3"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                ))}
                {unlockedPremium.map(badge => (
                  <div key={badge.id} className="relative">
                    <BadgeCard badgeId={badge.id} locked={false} />
                    <Button
                      onClick={() => handleShareBadge(badge.id)}
                      size="sm"
                      className="absolute top-4 right-4 bg-[#25A55F] hover:bg-[#1e8a4c] text-white h-8 px-3"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked Badges */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Locked</h2>
            <div className="grid grid-cols-1 gap-3">
              {lockedFree.map(badge => (
                <BadgeCard key={badge.id} badgeId={badge.id} locked={true} />
              ))}
              {lockedPremium.map(badge => (
                <BadgeCard key={badge.id} badgeId={badge.id} locked={true} />
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Share Badge Modal */}
      {selectedBadgeId && (
        <ShareBadgeModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedBadgeId(null);
          }}
          badgeId={selectedBadgeId}
        />
      )}
    </>
  );
}